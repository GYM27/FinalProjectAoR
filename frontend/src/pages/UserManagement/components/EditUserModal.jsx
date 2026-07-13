import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function EditUserModal({ editModalOpen, setEditModalOpen, userToEdit, handleEditUser }) {
    const { t } = useTranslation();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [perfil, setPerfil] = useState('USER');

    useEffect(() => {
        if (userToEdit) {
            setFirstName(userToEdit.firstName || '');
            setLastName(userToEdit.lastName || '');
            setPerfil(userToEdit.perfil || 'USER');
        }
    }, [userToEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        handleEditUser({ email: userToEdit.email, firstName, lastName, perfil });
    };

    if (!editModalOpen || !userToEdit) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-cyan-400">edit</span>
                        {t('users.editModal.title')}
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest mb-2" htmlFor="firstName">{t('users.editModal.firstName')}</label>
                        <input id="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500" />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest mb-2" htmlFor="lastName">{t('users.editModal.lastName')}</label>
                        <input id="lastName" type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500" />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-300 uppercase tracking-widest mb-2" htmlFor="perfil">{t('users.editModal.profile')}</label>
                        <select id="perfil" value={perfil} onChange={(e) => setPerfil(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl py-3 px-4 focus:outline-none focus:border-cyan-500">
                            <option value="USER">{t('users.user')}</option>
                            <option value="MANAGER">{t('users.manager')}</option>
                            <option value="ADMIN">{t('users.admin')}</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase">{t('users.editModal.cancel')}</button>
                        <button type="submit" className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold uppercase text-xs">{t('users.editModal.save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
