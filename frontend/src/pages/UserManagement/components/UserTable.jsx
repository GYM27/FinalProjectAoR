import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../store/useAuthStore';

export default function UserTable({ filteredUsers, toggleStatus, onEdit, onDelete }) {
    const { t } = useTranslation();
    const { email: currentUserEmail } = useAuthStore();

    const translateProfile = (profile) => {
        if (!profile) return '';
        const upperProfile = profile.toUpperCase();
        if (upperProfile.includes('ADMIN')) return t('users.admin');
        if (upperProfile.includes('GESTOR') || upperProfile.includes('MANAGER')) return t('users.manager');
        if (upperProfile.includes('UTILIZADOR') || upperProfile.includes('USER')) return t('users.user');
        return profile;
    };

    return (
        <>
            {filteredUsers.length > 0 ? (
                filteredUsers.map(user => {
                    const isCurrentUser = user.email === currentUserEmail;
                    return (
                        <tr key={user.email} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-2 md:px-4 py-4">
                                <div className="flex items-center gap-2 md:gap-4">
                                    <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm
              ${user.status === 'Ativo' ? 'bg-cyan-900/60 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}
                                    >
                                        {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className={`font-semibold truncate ${user.status === 'Ativo' ? 'text-white' : 'text-slate-400'}`}>
                                            {user.name}
                                            {isCurrentUser && <span className="ml-2 text-[10px] bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full">{t('users.you', '(Tu)')}</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 truncate">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-2 md:px-4 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border
            ${user.profile === 'ADMIN' ? 'bg-cyan-900/20 text-cyan-400 border-cyan-800/50' :
                                        user.profile === 'GESTOR' ? 'bg-cyan-900/20 text-cyan-400 border-cyan-800/50' :
                                            'bg-slate-800/50 text-slate-400 border-slate-700'}`}
                                >
                                    {translateProfile(user.profile)}
                                </span>
                            </td>

                            <td className="px-2 md:px-4 py-4">
                                <div className="flex justify-center">
                                    <span
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${user.status === 'Ativo'
                                            ? 'bg-emerald-900/10 text-emerald-400 border-emerald-700/50'
                                            : 'bg-rose-900/10 text-rose-400 border-rose-700/50'
                                            }`}
                                    >
                                        {user.status === 'Ativo' ? t('users.active') : t('users.inactive')}
                                    </span>
                                </div>
                            </td>
                            <td className="px-2 md:px-4 py-4 text-center">
                                {isCurrentUser ? (
                                    <span className="text-slate-600 text-xs italic">{t('users.notAvailable', 'Não disponível')}</span>
                                ) : (
                                    <>
                                        <button onClick={() => onEdit(user)} className="text-slate-500 hover:text-cyan-400 transition-colors mr-2" title={t('users.editTooltip')}>
                                            <span className="material-symbols-outlined">edit</span>
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(user.email, user.status)}
                                            className={`text-slate-500 transition-colors ml-2 ${user.status === 'Ativo' ? 'hover:text-red-400' : 'hover:text-emerald-400'}`}
                                            title={user.status === 'Ativo' ? t('users.deactivateTooltip') : t('users.activateTooltip')}
                                        >
                                            <span className="material-symbols-outlined">{user.status === 'Ativo' ? 'person_off' : 'person_check'}</span>
                                        </button>
                                    </>
                                )}
                            </td>

                        </tr>
                    );
                })
            ) : (
                <tr>
                    <td colSpan="4" className="px-4 py-12 text-center text-slate-500">
                        {t('users.noUsersFound')}
                    </td>
                </tr>
            )}
        </>
    )
}