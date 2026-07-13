import { useTranslation } from 'react-i18next';

export default function InvitationTable({ invitations, onResend, onDelete }) {
    const { t } = useTranslation();

    return (
        <>
            {invitations.length > 0 ? (
                invitations.map((inv) => {
                    const isExpired = new Date(inv.expiresAt) < new Date();
                    return (
                        <tr key={inv.id || inv.email} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-2 md:px-4 py-4">
                                <div className="flex items-center gap-2 md:gap-4">
                                    <div className="h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm bg-cyan-900/40 text-cyan-400">
                                        <span className="material-symbols-outlined text-[18px]">mail</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold truncate text-white">{inv.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-2 md:px-4 py-4">
                                <span className="text-sm text-slate-400">
                                    {inv.invitedBy}
                                </span>
                            </td>
                            <td className="px-2 md:px-4 py-4 text-center">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${isExpired ? 'bg-red-900/20 text-red-400 border-red-800/50' : 'bg-emerald-900/20 text-emerald-400 border-emerald-800/50'}`}>
                                    {isExpired ? t('users.statusExpired') : t('users.statusPending')}
                                </span>
                            </td>
                            <td className="px-2 md:px-4 py-4 text-center">
                                <button 
                                    onClick={() => onResend(inv.email)}
                                    className="text-slate-500 hover:text-cyan-400 transition-colors mr-2"
                                    title={t('users.resendTooltip')}
                                >
                                    <span className="material-symbols-outlined">send</span>
                                </button>
                                <button 
                                    onClick={() => onDelete(inv.email)}
                                    className="text-slate-500 hover:text-red-400 transition-colors ml-2"
                                    title={t('users.deleteTooltip')}
                                >
                                    <span className="material-symbols-outlined">delete</span>
                                </button>
                            </td>
                        </tr>
                    );
                })
            ) : (
                <tr>
                    <td colSpan="4" className="px-4 py-12 text-center text-slate-500">
                        {t('users.noInvitations')}
                    </td>
                </tr>
            )}
        </>
    );
}
