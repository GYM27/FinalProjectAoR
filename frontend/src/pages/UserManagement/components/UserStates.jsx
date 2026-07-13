import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function UserStates({ stats, setStatusFilter }) {
    const { t } = useTranslation();
    const { totalUsers, activeUsers, inactiveUsers } = stats;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div onClick={() => setStatusFilter('Todos')}
                className="bg-[#1e293b]/60 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-[#1e293b] hover:border-slate-500 transition-all"
            >
                <div className="h-12 w-12 rounded-lg bg-cyan-900/40 text-cyan-400 flex items-center justify-center">
                    <span className="material-symbols-outlined">group</span>
                </div>
                <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">{t('users.totalUsers')}</p>
                    <p className="text-2xl font-bold text-white">{totalUsers}</p>
                </div>
            </div>

            <div
                onClick={() => setStatusFilter('Ativo')}
                className="bg-[#1e293b]/60 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-[#1e293b] hover:border-emerald-500/50 transition-all"
            >
                <div className="h-12 w-12 rounded-lg bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
                    <span className="material-symbols-outlined">check_circle</span>
                </div>
                <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">{t('users.activeAccounts')}</p>
                    <p className="text-2xl font-bold text-white">{activeUsers}</p>
                </div>
            </div>

            <div
                onClick={() => setStatusFilter('Inativo')}
                className="bg-[#1e293b]/60 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-[#1e293b] hover:border-rose-500/50 transition-all"
            >
                <div className="h-12 w-12 rounded-lg bg-rose-900/20 text-rose-500 flex items-center justify-center">
                    <span className="material-symbols-outlined">block</span>
                </div>
                <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">{t('users.inactiveAccounts')}</p>
                    <p className="text-2xl font-bold text-white">{inactiveUsers}</p>
                </div>
            </div>

            <div
                onClick={() => setStatusFilter('Convites')}
                className="bg-[#1e293b]/60 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-[#1e293b] hover:border-cyan-500/50 transition-all"
            >
                <div className="h-12 w-12 rounded-lg bg-cyan-900/20 text-cyan-500 flex items-center justify-center">
                    <span className="material-symbols-outlined">mark_email_unread</span>
                </div>
                <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">{t('users.pendingInvitations')}</p>
                    <p className="text-2xl font-bold text-white">{stats.pendingInvitations || 0}</p>
                </div>
            </div>
        </div >
    )
}
