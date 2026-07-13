import { useTranslation } from 'react-i18next';

export default function UserFilters({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, totalUsers, pagination, setPagination }) {
    const { t } = useTranslation();
    const { page, limit } = pagination;
    const startRange = totalUsers === 0 ? 0 : (page - 1) * limit + 1;
    const endRange = Math.min(page * limit, totalUsers);

    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full lg:w-auto">
                {/* Search */}
                <div className="relative w-full md:w-72">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 text-[20px]">search</span>
                    <input
                        type="text"
                        placeholder={t('users.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0f172a] border border-slate-700 text-sm text-white rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-500"
                    />
                </div>

                {/* Filters */}
                <div className="flex bg-surface-container-low p-1 rounded-full border border-outline-variant shadow-inner w-full sm:w-fit justify-around sm:justify-start">
                    {['Todos', 'Ativo', 'Inativo', 'Convites'].map((tab) => {
                        const label = tab === 'Todos' ? t('users.filterAll') : tab === 'Ativo' ? t('users.filterActive') : tab === 'Inativo' ? t('users.filterInactive') : t('users.filterInvitations');
                        return (
                            <button
                                key={tab}
                                onClick={() => setStatusFilter(tab)}
                                className={`px-3 sm:px-4 py-1 rounded-full text-[10px] font-label-caps uppercase tracking-wider transition-all cursor-pointer ${statusFilter === tab
                                        ? 'bg-primary-container/20 text-[var(--color-tech-cyan)] font-bold'
                                        : 'text-on-surface-variant/60 hover:text-on-surface hover:bg-white/5 border border-transparent'
                                    }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center sm:text-left mt-4 md:mt-0">
                {t('users.showing')} {startRange}-{endRange} {t('users.of')} {totalUsers}
                <div className="flex gap-1">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                        disabled={page === 1}
                        className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${page === 1 ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>
                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, Math.ceil(totalUsers / limit)) }))}
                        disabled={page === Math.ceil(totalUsers / limit) || totalUsers === 0}
                        className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${page === Math.ceil(totalUsers / limit) || totalUsers === 0 ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>
    );
}