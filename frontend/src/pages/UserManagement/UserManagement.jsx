import { useState, useEffect, useMemo } from 'react';
import UserStates from './components/UserStates';
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import InvitationTable from './components/InvitationTable';
import InviteModal from './components/InviteModal';
import EditUserModal from './components/EditUserModal';
import UserPagination from './components/UserPagination';
import { useAuthStore } from '../../store/useAuthStore';
import { userService } from '../../api/userService';
import { invitationService } from '../../api/invitationService';
import { useTranslation } from 'react-i18next';

export default function Utilizadores() {
  const { t } = useTranslation();

  const mapProfile = (perfilEnum) => {
    switch (perfilEnum) {
      case 'ADMIN': return t('users.admin');
      case 'MANAGER': return t('users.manager');
      case 'USER': return t('users.user');
      default: return perfilEnum;
    }
  };

  const { perfil } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos'); // 'Todos', 'Ativo', 'Inativo'
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [globalStats, setGlobalStats] = useState({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0 });

  // Invitation Management
  const [invitations, setInvitations] = useState([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
    totalElements: 0
  });

  const fetchStats = async () => {
    try {
      const statsResponse = await userService.getUserStats();
      setGlobalStats({
        totalUsers: statsResponse.totalUsers || 0,
        activeUsers: statsResponse.activeUsers || 0,
        inactiveUsers: statsResponse.inactiveUsers || 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const backendPage = pagination.page - 1; // Use pagination.page
      let isActive = null;
      if (statusFilter === 'Ativo') isActive = true;
      if (statusFilter === 'Inativo') isActive = false;

      const response = await userService.getUsers(backendPage, pagination.limit, isActive);

      if (response) {
        const formatUser = (user) => ({
          ...user,
          name: `${user.firstName} ${user.lastName}`.trim(),
          profile: mapProfile(user.perfil),
          status: user.active ? 'Ativo' : 'Inativo',
        });

        setUsers((response.content || []).map(formatUser));
        setPagination(prev => ({
          ...prev,
          totalElements: response.totalElements || 0,
          totalPages: response.totalPages || 0
        }));
      }

      await fetchStats();

    } catch (error) {
      console.error("Erro ao carregar utilizadores:", error);
    }
  }

  const fetchInvitations = async () => {
    setIsLoadingInvitations(true);
    try {
      const data = await invitationService.getAllInvitations();
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleResendInvitation = async (email) => {
    try {
      await invitationService.resendInvitation(email);
      showToast(t('users.invitationResent', { email }));
      fetchInvitations();
    } catch (error) {
      console.error('Error resending invitation:', error);
      showToast(t('users.invitationResendError', { email }));
    }
  };

  const handleDeleteInvitation = async (email) => {
    if (!window.confirm(t('users.invitationDeleteConfirm', { email }))) return;
    try {
      await invitationService.deleteInvitation(email);
      showToast(t('users.invitationDeleted', { email }));
      fetchInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      showToast(t('users.invitationDeleteError', { email }));
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
  }, [pagination.page, pagination.limit, statusFilter, searchTerm]);

  useEffect(() => {
    // Reset the page while keeping the other properties
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchTerm, statusFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'Todos' || user.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const filteredInvitations = useMemo(() => {
    return invitations.filter(inv => {
      return inv.email.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [invitations, searchTerm]);

  const requireAdmin = (actionKey) => {
    if (perfil !== 'ADMIN') {
      alert(`${t('users.accessDenied')} ${t('users.alerts.actions.' + actionKey)}.`);
      return false;
    }
    return true;
  };

  const toggleStatus = async (email, currentStatus) => {
    if (!requireAdmin('toggle')) return;

    try {
      if (currentStatus === 'Ativo') {
        await userService.deactivateUser(email)
      }
      else {
        await userService.activateUser(email)
      }
      fetchUsers();
    }
    catch (error) {
      console.error("Error changing user status:", error)
    }
  };

  const handleInviteUser = async (userData) => {
    if (!requireAdmin('invite')) return;

    try {
      await userService.inviteUser(userData);
      alert(t('users.alerts.inviteSent', { email: userData.email }));
      setIsInviteModalOpen(false);
      fetchUsers();
    } catch (error) {
      alert(t('users.alerts.inviteError', { error: error.message || t('users.alerts.serverError') }));
    }
  }

  const handleEditUser = async (userData) => {
    if (!requireAdmin('edit')) return;

    try {
      await userService.updateUserRole(userData.email, userData);
      alert(t('users.alerts.updateSuccess'));
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      alert(error.message);
    }
  }

  const handleOpenEdit = (user) => {
    if (!requireAdmin('edit')) return;
    setEditUser(user);
    setIsEditModalOpen(true);
  }

  const handleDeleteUser = async (email) => {
    if (!requireAdmin('delete')) return;

    if (confirm(t('users.confirmDelete'))) {
      try {
        await userService.deactivateUser(email);
        fetchUsers();
      } catch (error) {
        console.error("Error deactivating user:", error)
      }
    }
  };

  return (
    <div className="relative flex-1 flex flex-col p-4 md:p-8 overflow-y-auto w-full text-slate-300">

      {toastMessage && (
        <div className="fixed top-24 right-8 bg-cyan-500 text-[#001f24] px-6 py-3 rounded-lg shadow-lg font-bold flex items-center gap-3 z-[100] animate-fade-in-down">
          <span className="material-symbols-outlined">check_circle</span>
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-[32px] font-bold text-white tracking-wide">
            {t('users.title')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t('users.subtitle')}</p>
        </div>
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 border border-cyan-700 hover:bg-cyan-900/30 text-cyan-400 px-5 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          {t('users.inviteUser')}
        </button>
      </div>

      <UserStates
        stats={{ ...globalStats, pendingInvitations: invitations.length }}
        setStatusFilter={setStatusFilter}
      />

      {/* Main Table Container */}
      <div className="bg-[#1e293b]/40 border border-slate-700/50 rounded-2xl flex-1 flex flex-col p-4 md:p-6 overflow-hidden">

        <UserFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          totalUsers={statusFilter === 'Convites' ? filteredInvitations.length : filteredUsers.length}
          pagination={pagination}
          setPagination={setPagination}
        />

        {/* Table */}
        <div className="overflow-x-auto flex-1 w-full -mx-4 px-4 md:mx-0 md:px-0">
          <table className="w-full text-left border-collapse">
            <thead>
              {statusFilter === 'Convites' ? (
                <tr className="border-b border-slate-700/50">
                  <th className="px-2 md:px-4 py-3 text-cyan-500 text-[10px] font-bold uppercase tracking-widest">{t('users.colEmail')}</th>
                  <th className="px-2 md:px-4 py-3 text-cyan-500 text-[10px] font-bold uppercase tracking-widest">{t('users.colInvitedBy')}</th>
                  <th className="px-2 md:px-4 py-3 text-cyan-500 text-[10px] font-bold uppercase tracking-widest text-center">{t('users.colStatus')}</th>
                  <th className="px-2 md:px-4 py-3 text-cyan-500 text-[10px] font-bold uppercase tracking-widest text-center">{t('users.colActions')}</th>
                </tr>
              ) : (
                <tr className="border-b border-slate-700/50">
                  <th className="px-2 md:px-4 py-3 text-cyan-500 text-[10px] font-bold uppercase tracking-widest">{t('users.colUser')}</th>
                  <th className="px-2 md:px-4 py-3 text-cyan-500 text-[10px] font-bold uppercase tracking-widest">{t('users.colProfile')}</th>
                  <th className="px-2 md:px-4 py-3 text-cyan-500 text-[10px] font-bold uppercase tracking-widest text-center">{t('users.colStatus')}</th>
                  <th className="px-2 md:px-4 py-3 text-cyan-500 text-[10px] font-bold uppercase tracking-widest text-center">{t('users.colActions')}</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {statusFilter === 'Convites' ? (
                <InvitationTable
                  invitations={filteredInvitations}
                  onResend={handleResendInvitation}
                  onDelete={handleDeleteInvitation}
                />
              ) : (
                <UserTable
                  filteredUsers={filteredUsers}
                  onEdit={handleOpenEdit}
                  toggleStatus={toggleStatus}
                  onDelete={handleDeleteUser}
                />
              )}
            </tbody>
          </table>
        </div>

        {statusFilter !== 'Convites' && (
          <UserPagination
            pagination={pagination}
            setPagination={setPagination}
          />
        )}

      </div>

      {/* Invite Modal */}
      <InviteModal
        inviteModalOpen={isInviteModalOpen}
        setInviteModalOpen={setIsInviteModalOpen}
        handleInviteUser={handleInviteUser}
      />

      {/* Edit Modal */}
      <EditUserModal
        editModalOpen={isEditModalOpen}
        handleEditUser={handleEditUser}
        setEditModalOpen={setIsEditModalOpen}
        userToEdit={editUser}
      />

    </div>
  );
}
