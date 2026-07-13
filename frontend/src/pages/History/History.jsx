import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HistoryCard from './components/HistoryCard';
import HistoryDetails from './components/HistoryDetails';
import { fetchClient } from '../../api/fetchClient';
import { useTranslation } from 'react-i18next';

/**
 * History Page Component
 * 
 * Displays a list of all past simulations fetched from the backend.
 * Provides filtering by time and scenario, search capabilities, and pagination.
 * Selecting a simulation displays its details in a side panel.
 */
export default function History() {
    const { t } = useTranslation();
    const location = useLocation();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [selectedSessionId, setSelectedSessionId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [timeFilter, setTimeFilter] = useState('filter30Days');
    const [scenarioFilter, setScenarioFilter] = useState('Todos os Cenários');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        fetchHistory();
    }, [location.search]);

    /**
     * Fetches the entire simulation history from the backend API.
     * The raw data is then formatted into a shape easily consumed by the UI,
     * including calculating durations and parsing timestamp arrays if necessary.
     */
    const fetchHistory = async () => {
        try {
            setLoading(true);
            const data = await fetchClient('/simulations');
            
            // Format the raw backend data into the UI shape
            const formatted = data.map(sim => {
                let start;
                if (Array.isArray(sim.startedAt)) {
                    start = new Date(sim.startedAt[0], sim.startedAt[1] - 1, sim.startedAt[2], sim.startedAt[3], sim.startedAt[4], sim.startedAt[5] || 0);
                } else {
                    start = new Date(sim.startedAt);
                }

                let end = new Date();
                if (sim.endedAt) {
                    if (Array.isArray(sim.endedAt)) {
                        end = new Date(sim.endedAt[0], sim.endedAt[1] - 1, sim.endedAt[2], sim.endedAt[3], sim.endedAt[4], sim.endedAt[5] || 0);
                    } else {
                        end = new Date(sim.endedAt);
                    }
                }
                
                // If the backend has the simulated duration (in seconds), we use that preferably!
                let diffMins = 0;
                let diffSecs = 0;
                
                if (sim.simulatedDurationSeconds != null) {
                    diffMins = Math.floor(sim.simulatedDurationSeconds / 60);
                    diffSecs = Math.floor(sim.simulatedDurationSeconds % 60);
                } else {
                    // Fallback to real time (old versions)
                    const diffMs = end - start;
                    diffMins = Math.floor(diffMs / 60000);
                    diffSecs = Math.floor((diffMs % 60000) / 1000);
                }

                return {
                    id: sim.id.split('-')[0].toUpperCase(), // Just a short ID for display
                    fullId: sim.id,
                    date: start.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }),
                    time: start.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) + ' ' + (start.getHours() >= 12 ? 'PM' : 'AM'),
                    scenarioName: sim.scenarioName,
                    studentName: sim.studentName,
                    status: (sim.status || '').replace('_', ' '),
                    duration: `${diffMins}m ${diffSecs}s`,
                    events: (sim.events || []).map(e => {
                        let eTime;
                        if (Array.isArray(e.timestamp)) {
                            eTime = new Date(e.timestamp[0], e.timestamp[1] - 1, e.timestamp[2], e.timestamp[3], e.timestamp[4], e.timestamp[5] || 0);
                        } else {
                            eTime = new Date(e.timestamp);
                        }
                        // Show absolute time as HH:MM:SS
                        const absoluteTime = eTime.toLocaleTimeString('pt-PT', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                        return {
                            time: absoluteTime,
                            description: e.description,
                            type: e.type
                        };
                    }),
                    timestamp: start.getTime()
                };
            });
            
            // Reverse sort to show newest first
            formatted.sort((a, b) => b.timestamp - a.timestamp);
            
            setSessions(formatted);

            const searchParams = new URLSearchParams(location.search);
            const targetSimId = searchParams.get('simId');

            if (targetSimId && formatted.find(s => s.fullId === targetSimId)) {
                setSelectedSessionId(targetSimId);
            } else if (formatted.length > 0) {
                setSelectedSessionId(formatted[0].fullId);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
            setFetchError(error.toString());
        } finally {
            setLoading(false);
        }
    };

    const selectedSession = sessions.find(s => s.fullId === selectedSessionId);

    // Filter logic
    const filteredData = sessions.filter(session => {
        // Search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesScenario = session.scenarioName.toLowerCase().includes(query);
            const matchesStudent = session.studentName.toLowerCase().includes(query);
            const matchesId = session.id.toLowerCase().includes(query) || session.fullId.toLowerCase().includes(query);
            
            if (!matchesScenario && !matchesStudent && !matchesId) {
                return false;
            }
        }
        
        // Scenario filter
        if (scenarioFilter !== 'Todos os Cenários' && session.scenarioName !== scenarioFilter) {
            return false;
        }

        // Time filter
        if (timeFilter !== 'filterAllTimes') {
            const sessionDate = new Date(session.timestamp);
            const now = new Date();
            const diffTime = Math.abs(now - sessionDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (timeFilter === 'filter30Days' && diffDays > 30) return false;
            if (timeFilter === 'filter7Days' && diffDays > 7) return false;
            if (timeFilter === 'filterThisYear' && sessionDate.getFullYear() !== now.getFullYear()) return false;
        }
        
        return true;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);


    const uniqueScenarios = ['Todos os Cenários', ...new Set(sessions.map(s => s.scenarioName))];

    return (
        <div className="w-full min-w-0 flex-1 flex flex-col gap-6 p-4 sm:p-6 text-slate-300 xl:h-full overflow-y-auto xl:overflow-hidden">
            <style>{`
                .font-headline-md { font-family: 'Geist', sans-serif; font-weight: 600; }
                .text-headline-md { font-size: 24px; line-height: 32px; }
                .font-label-caps { font-family: 'JetBrains Mono', monospace; font-weight: 500; letter-spacing: 0.1em; }
                .font-body-md { font-family: 'Inter', sans-serif; font-weight: 400; }
            `}</style>

            {/* Header & Global Filters */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 shrink-0">
                <div>
                    <h1 className="text-[32px] font-bold text-white tracking-wide">
                        {t('history.title')}
                    </h1>
                    <p className="text-sm text-slate-400 mt-1 max-w-xl">
                        {t('history.subtitle')}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    {/* Time Filter */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">calendar_today</span>
                        <select 
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="w-full sm:w-auto appearance-none bg-[#1e293b]/60 border border-slate-700/50 text-sm text-slate-300 rounded-lg py-2.5 pl-10 pr-8 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                        >
                            <option value="filter30Days">{t('history.filter30Days')}</option>
                            <option value="filter7Days">{t('history.filter7Days')}</option>
                            <option value="filterThisYear">{t('history.filterThisYear')}</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">arrow_drop_down</span>
                    </div>

                    {/* Scenario Filter */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">medical_services</span>
                        <select 
                            value={scenarioFilter}
                            onChange={(e) => setScenarioFilter(e.target.value)}
                            className="w-full sm:w-auto appearance-none bg-[#1e293b]/60 border border-slate-700/50 text-sm text-slate-300 rounded-lg py-2.5 pl-10 pr-8 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                        >
                            {uniqueScenarios.map(name => (
                                <option key={name} value={name}>{name === 'Todos os Cenários' ? t('history.filterAllScenarios') : name}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">arrow_drop_down</span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full sm:w-64">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                        <input 
                            type="text" 
                            placeholder={t('history.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1e293b]/60 border border-slate-700/50 text-sm text-slate-300 rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-500"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content Area (Two Columns) */}
            <div className="flex flex-col xl:flex-row gap-6 flex-1 xl:min-h-0">
                {/* Left Side: List */}
                <div className="flex-1 flex flex-col bg-[#1e293b]/40 border border-slate-700/50 rounded-2xl p-4 md:p-6 xl:overflow-hidden min-h-[500px] xl:min-h-0">
                    <div className="flex justify-between items-center mb-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                        <span>{t('history.recentSessions')}</span>
                        <span>{filteredData.length} {t('history.total')}</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-slate-500">{t('history.loading')}</div>
                        ) : fetchError ? (
                            <div className="flex items-center justify-center h-full text-red-500 border border-dashed border-red-900 rounded-xl p-8 text-center bg-red-500/10 whitespace-pre-wrap">
                                {t('history.error')}{fetchError}
                            </div>
                        ) : paginatedData.map((session) => (
                            <HistoryCard 
                                key={session.fullId} 
                                session={session} 
                                isSelected={selectedSessionId === session.fullId}
                                onClick={() => setSelectedSessionId(session.fullId)}
                            />
                        ))}
                        {!loading && !fetchError && filteredData.length === 0 && (
                            <div className="flex items-center justify-center h-full text-slate-500 border border-dashed border-slate-700 rounded-xl p-8 text-center">
                                {t('history.noResults')}
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {!loading && !fetchError && totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 mt-4 pt-4 border-t border-slate-700/50">
                            <span className="text-xs text-slate-500 font-medium">
                                {t('history.showing')} {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} {t('history.of')} {filteredData.length}
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                                </button>
                                <span className="text-xs font-medium text-slate-300 flex items-center px-2">
                                    {t('history.page')} {currentPage} {t('history.of')} {totalPages}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: Details Panel */}
                <div className="w-full xl:w-[400px] 2xl:w-[480px] shrink-0 h-[600px] xl:h-auto">
                    {selectedSession ? (
                        <HistoryDetails 
                            session={selectedSession} 
                            onClose={() => setSelectedSessionId(null)}
                        />
                    ) : (
                        <div className="h-full border border-dashed border-slate-700/50 rounded-2xl flex items-center justify-center text-slate-500 bg-[#1e293b]/20">
                            {t('history.selectPrompt')}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Embedded CSS for custom scrollbar to match the slick design */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </div>
    );
}
