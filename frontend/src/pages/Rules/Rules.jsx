import { useState, useEffect } from 'react';
import { fetchClient } from '../../api/fetchClient';
import RuleCard from './components/RuleCard';
import RuleModal from './components/RuleModal';
import { useTranslation } from 'react-i18next';

/**
 * Rules Page Component
 * 
 * Manages the CRUD (Create, Read, Update, Delete) operations for physiological 
 * evaluation rules. It supports backend pagination, filtering by system/status, 
 * and searching by name.
 */
export default function Rules() {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ruleToEdit, setRuleToEdit] = useState(null); // the rule we want to edit
    const [filter, setFilter] = useState('Todas'); // Using PT keys here since it's the state, but we will translate in UI
    const [searchName, setSearchName] = useState('');
    const [selectedSystem, setSelectedSystem] = useState('');
    const [rules, setRules] = useState([]);
    const [systems, setSystems] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        totalElements: 0,
        totalPages: 0
    });

    const translateSystem = (name) => {
        if (name === 'Sistema Cardiovascular') return t('rules.systems.cardiovascular');
        if (name === 'Sistema Respiratório') return t('rules.systems.respiratory');
        if (name === 'Sistema Neurológico') return t('rules.systems.neurological');
        return name;
    };

    // Fetches the physiological systems (e.g. Cardiovascular, Respiratory) from backend on mount
    // These are used to populate the filtering dropdown
    useEffect(() => {
        fetchClient.get('/physiological-systems')
            .then(res => setSystems(res))
            .catch(err => console.error("Error fetching systems:", err));
    }, []);

    /**
     * Fetches all rules from the backend, applying pagination and current filters.
     * Translates local component state (page, limit, filter, searchName) into query params.
     */
    const fetchRules = async () => {
        try {
            const backendPage = pagination.page - 1;
            let endpoint = `/rules?page=${backendPage}&size=${pagination.limit}`;
            if (searchName) endpoint += `&name=${encodeURIComponent(searchName)}`;
            if (selectedSystem) endpoint += `&systemId=${selectedSystem}`;
            if (filter) endpoint += `&status=${filter}`;

            const response = await fetchClient.get(endpoint);
            setRules(response.content || []);
            setPagination(prev => ({
                ...prev,
                totalElements: response.totalElements || 0,
                totalPages: response.totalPages || 0
            }));
        } catch (error) {
            console.error("Error fetching rules:", error);
        }
    };

    useEffect(() => {
        fetchRules();
    }, [pagination.page, pagination.limit, filter, searchName, selectedSystem]);

    useEffect(() => {
        // Reset page to 1 when filters change
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [searchName, filter, selectedSystem]);

    /**
     * Handles creating a new rule or updating an existing one.
     * Automatically triggers a list refresh upon success.
     * @param {Object} ruleDTO - The rule data payload
     */
    const handleSaveRule = async (ruleDTO) => {
        try {
            if (ruleToEdit) {
                const resp = await fetchClient.put(`/rules/${ruleToEdit.id}`, ruleDTO);
                fetchRules(); // refresh to keep pagination logic consistent
            } else {
                const resp = await fetchClient.post('/rules', ruleDTO);
                fetchRules(); // refresh
            }
            setIsModalOpen(false);
            setRuleToEdit(null);
        } catch (error) {
            console.error("Failed to save rule:", error);
            const msg = error.response?.data?.message || t('rules.errorSave');
            alert(msg);
        }
    };

    /**
     * Toggles a rule's active state between TRUE and FALSE.
     * Active rules are evaluated by the backend Rules Engine during simulations.
     * @param {string|number} ruleId - The ID of the rule
     * @param {boolean} currentActiveState - Whether the rule is currently active
     */
    const handleToggleActive = async (ruleId, currentActiveState) => {
        try {
            if (currentActiveState) {
                await fetchClient.put(`/rules/${ruleId}/deactivate`);
            } else {
                await fetchClient.put(`/rules/${ruleId}/activate`);
            }
            fetchRules();
        } catch (error) {
            console.error("Failed to toggle rule:", error);
            alert(t('rules.errorToggle'));
        }
    };

    const handleDelete = async (ruleId) => {
        if (!window.confirm(t('rules.confirmDelete'))) return;
        try {
            await fetchClient.delete(`/rules/${ruleId}`);
            fetchRules();
        } catch (error) {
            console.error("Failed to delete rule:", error);
            alert(t('rules.errorDelete'));
        }
    };

    const openEditModal = (rule) => {
        setRuleToEdit(rule);
        setIsModalOpen(true);
    };

    const { totalElements: totalRules, totalPages, limit, page } = pagination;
    const startRange = totalRules === 0 ? 0 : (page - 1) * limit + 1;
    const endRange = Math.min(page * limit, totalRules);
    // Rules from backend are already filtered and paginated
    const paginatedRules = rules;

    const handleItemsPerPageChange = (e) => {
        setPagination(prev => ({
            ...prev,
            limit: Number(e.target.value),
            page: 1
        }));
    };

    const generatePageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        const page = pagination.page;

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

    return (        <div className="w-full min-w-0 flex-1 flex flex-col gap-4 p-4 sm:p-6 text-slate-300">
            <style>{`
                .font-headline-md { font-family: 'Geist', sans-serif; font-weight: 600; }
                .text-headline-md { font-size: 24px; line-height: 32px; }
                .font-label-caps { font-family: 'JetBrains Mono', monospace; font-weight: 500; letter-spacing: 0.1em; }
                .text-label-caps { font-size: 12px; line-height: 16px; }
                .font-body-md { font-family: 'Inter', sans-serif; font-weight: 400; }
                .text-on-surface { color: #e0e3e5; }
                .text-on-surface-variant { color: #bac9cc; }
            `}</style>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div>
                    <h1 className="text-[32px] font-bold text-white tracking-wide">
                        {t('rules.title')}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">{t('rules.subtitle')}</p>
                </div>
                <button
                    onClick={() => { setRuleToEdit(null); setIsModalOpen(true); }}
                    className="flex items-center justify-center gap-2 border border-cyan-700 hover:bg-cyan-900/30 text-cyan-400 px-5 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-wider transition-all w-full md:w-auto"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    {t('rules.newRule')}
                </button>
            </div>

            <div className="bg-[#1e293b]/40 border border-slate-700/50 rounded-2xl flex-1 flex flex-col p-4 md:p-6 overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 w-full lg:w-auto">
                        <div className="relative w-full md:w-72">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 text-[20px]">search</span>
                            <input 
                                type="text" 
                                placeholder={t('rules.searchPlaceholder')}
                                value={searchName} 
                                onChange={(e) => setSearchName(e.target.value)}
                                className="w-full bg-[#0f172a] border border-slate-700 text-sm text-white rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-500"
                            />
                        </div>

                        <div className="flex flex-col md:flex-row gap-4">
                            <select 
                                value={selectedSystem} 
                                onChange={(e) => setSelectedSystem(e.target.value)}
                                className="bg-[#0f172a] border border-slate-700 rounded-lg p-2 text-sm text-white outline-none cursor-pointer focus:border-cyan-500 transition-colors"
                            >
                                <option value="" className="bg-[#0f172a]">{t('rules.allSystems')}</option>
                                {systems.map(sys => (
                                    <option key={sys.id} value={sys.id} className="bg-[#0f172a]">{translateSystem(sys.systemName)}</option>
                                ))}
                            </select>

                            <div className="flex flex-wrap justify-center bg-[#0f172a] rounded-lg p-1 border border-slate-800">
                                {['Todas', 'Ativa', 'Inativas', 'Eliminadas'].map((tab) => {
                                    const filterMap = {
                                        'Todas': t('rules.filterAll'),
                                        'Ativa': t('rules.filterActive'),
                                        'Inativas': t('rules.filterInactive'),
                                        'Eliminadas': t('rules.filterDeleted')
                                    };
                                    return (
                                    <button
                                        key={tab}
                                        onClick={() => setFilter(tab)}
                                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${filter === tab
                                            ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-700/50'
                                            : 'text-slate-500 hover:text-slate-300 border border-transparent'
                                            }`}
                                    >
                                        {filterMap[tab]}
                                    </button>
                                )})}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center sm:text-left mt-4 md:mt-0">
                        {t('rules.showing')} {startRange}-{endRange} {t('rules.of')} {totalRules}
                        <div className="flex gap-1">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                                disabled={pagination.page === 1}
                                className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${pagination.page === 1 ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                            </button>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, totalPages) }))}
                                disabled={pagination.page === totalPages || totalRules === 0}
                                className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${pagination.page === totalPages || totalRules === 0 ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}>
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 w-full flex-1 overflow-y-auto pr-2 pb-4">
                    {paginatedRules.map((rule) => (
                        <RuleCard 
                            key={rule.id} 
                            rule={rule} 
                            onToggleActive={handleToggleActive} 
                            onEdit={() => openEditModal(rule)}
                            onDelete={() => handleDelete(rule.id)}
                        />
                    ))}
                    {paginatedRules.length === 0 && (
                        <div className="text-center p-8 text-on-surface-variant text-sm font-body-md h-full flex items-center justify-center border border-dashed border-slate-700 rounded-xl">
                            {t('rules.noResults')}
                        </div>
                    )}
                </div>

                {totalPages > 0 && (
                    <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-semibold text-slate-400 border-t border-slate-700/50 pt-4">
                        <div className="flex items-center gap-2">
                            {t('rules.rowsPerPage')}
                            <select
                                value={pagination.limit}
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
                                disabled={pagination.page === 1}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${pagination.page === 1 ? 'text-slate-600 cursor-not-allowed' : 'hover:bg-slate-800'}`}>
                                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                            </button>

                            {generatePageNumbers().map((p, index) => (
                                p === '...' ? (
                                    <span key={index} className="px-1 text-slate-600">...</span>
                                ) : (
                                    <button
                                        key={index}
                                        onClick={() => setPagination(prev => ({ ...prev, page: p }))}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${pagination.page === p ? 'bg-cyan-500 text-white font-bold' : 'hover:bg-slate-800'}`}>
                                        {p}
                                    </button>
                                )
                            ))}

                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, totalPages) }))}
                                disabled={pagination.page === totalPages}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${pagination.page === totalPages ? 'text-slate-600 cursor-not-allowed' : 'hover:bg-slate-800'}`}>
                                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <RuleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveRule}
                systems={systems}
                initialData={ruleToEdit}
                translateSystem={translateSystem}
            />
        </div>
    );
}
