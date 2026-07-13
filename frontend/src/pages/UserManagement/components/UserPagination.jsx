import { useTranslation } from 'react-i18next';

export default function UserPagination({ pagination, setPagination }) {
    const { t } = useTranslation();
    const { page, limit, totalPages } = pagination;

    const handleItemsPerPageChange = (e) => {
        setPagination(prev => ({
            ...prev,
            limit: Number(e.target.value),
            page: 1 // Go back to the first page when changing the limit
        }));
    };

    const generatePageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (page <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (page >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', page - 1, page, page + 1, '...', totalPages);
            }
        }
        return pages;
    };

    if (totalPages === 0) return null;

    return (
        <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-2">
                {t('users.rowsPerPage')}
                <select
                    value={limit}
                    onChange={handleItemsPerPageChange}
                    className="bg-transparent border-none text-slate-300 focus:ring-0 cursor-pointer outline-none font-bold">
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-1 mt-4 md:mt-0">
                <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                    disabled={page === 1}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${page === 1 ? 'text-slate-600 cursor-not-allowed' : 'hover:bg-slate-800'}`}>
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>

                {generatePageNumbers().map((p, index) => (
                    p === '...' ? (
                        <span key={index} className="px-1 text-slate-600">...</span>
                    ) : (
                        <button
                            key={index}
                            onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${page === p ? 'bg-cyan-500 text-white font-bold' : 'hover:bg-slate-800'}`}>
                            {p}
                        </button>
                    )
                ))}

                <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, totalPages) }))}
                    disabled={page === totalPages}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${page === totalPages ? 'text-slate-600 cursor-not-allowed' : 'hover:bg-slate-800'}`}>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
            </div>
        </div>
    );
}