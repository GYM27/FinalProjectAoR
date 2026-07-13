import React, { useState, useEffect } from 'react';
import { fetchClient } from '../../../api/fetchClient';
import { useTranslation } from 'react-i18next';

export default function HistoryDetails({ session, onClose }) {
    const { t } = useTranslation();
    if (!session) return null;

    const getTimelineColor = (type) => {
        switch (type) {
            case 'critical': return 'border-[#ffb4ab]';
            case 'warning': return 'border-[#fabd00]';
            case 'success': return 'border-[#81c995]';
            case 'info':
            default: return 'border-[#00daf3]';
        }
    };

    const getTimelineDotColor = (type) => {
        switch (type) {
            case 'critical': return 'bg-[#ffb4ab]';
            case 'warning': return 'bg-[#fabd00]';
            case 'success': return 'bg-[#81c995]';
            case 'info':
            default: return 'bg-[#00daf3]';
        }
    };

    const translateEventDescription = (desc) => {
        if (!desc) return '';

        let ruleMatch = desc.match(/^Rule (.*) triggered \((.*)\)$/) || desc.match(/^Regra (.*) acionada \((.*)\)$/);
        if (ruleMatch) {
            let ruleName = ruleMatch[1];
            if (ruleName === 'Unnamed' || ruleName === 'Sem Nome') {
                ruleName = t('history.events.unnamedRule');
            } else {
                ruleName = t(`rules.names.${ruleName}`, ruleName);
            }
            return t('history.events.ruleTriggered', { ruleName, value: ruleMatch[2] });
        }

        let stabilizingMatch = desc.match(/^Rule (.*) stabilizing$/) || desc.match(/^Regra (.*) a estabilizar$/);
        if (stabilizingMatch) {
            let ruleName = stabilizingMatch[1];
            if (ruleName === 'Unnamed' || ruleName === 'Sem Nome') {
                ruleName = t('history.events.unnamedRule');
            } else {
                ruleName = t(`rules.names.${ruleName}`, ruleName);
            }
            return t('history.events.ruleStabilizing', { ruleName });
        }

        let resolvedMatch = desc.match(/^Rule (.*) resolved$/) || desc.match(/^Regra (.*) resolvida$/);
        if (resolvedMatch) {
            let ruleName = resolvedMatch[1];
            if (ruleName === 'Unnamed' || ruleName === 'Sem Nome') {
                ruleName = t('history.events.unnamedRule');
            } else {
                ruleName = t(`rules.names.${ruleName}`, ruleName);
            }
            return t('history.events.ruleResolved', { ruleName });
        }

        if (desc === 'Simulação Iniciada' || desc === 'Simulation Started') return t('history.events.started', 'Simulação Iniciada');
        if (desc === 'Simulação Terminada' || desc === 'Simulation Finished') return t('history.events.finished', 'Simulação Terminada');

        return desc;
    };

    const [isDownloading, setIsDownloading] = useState(false);
    const [reports, setReports] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (session && session.fullId) {
            fetchClient.get(`/reports/simulation/${session.fullId}`)
                .then(data => {
                    if (Array.isArray(data)) {
                        setReports(data);
                    }
                })
                .catch(err => console.error("Error fetching reports:", err));
        }
    }, [session]);

    // Manual rescue: generates a missing report for simulations that lost their STOP flow (e.g. page refresh mid-session)
    const handleGenerateMissingReport = async () => {
        try {
            setIsGenerating(true);

            // 1. Force stop the simulation to cleanly close its state in the database
            try {
                await fetchClient.post(`/simulations/${session.fullId}/stop`);
            } catch (err) {
                console.warn("Simulation might already be stopped or failed to stop:", err);
            }

            const payload = {
                simulationId: session.fullId,
                intervaloTemporal: "Simulação Completa",
                rationaleText: "Geração manual de recuperação.",
                isLive: session.scenarioName === "Livestream",
                startObservation: null,
                endObservation: null
            };

            await fetchClient.post('/reports', payload);

            const updatedReports = await fetchClient.get(`/reports/simulation/${session.fullId}`);
            if (Array.isArray(updatedReports)) {
                setReports(updatedReports);
            }
            
            // Reload the page to refresh the History list with the new 'CONCLUIDA' status
            window.location.reload();
        } catch (error) {
            console.error("Failed to generate recovery report:", error);
            alert(t('history.generateReportError'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadReport = async (reportId) => {
        try {
            setIsDownloading(true);
            const response = await fetch(`/api/reports/download/${reportId}`, {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Falha ao descarregar PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert(t('history.downloadError'));
        } finally {
            setIsDownloading(false);
        }
    };


    return (
        <div className="bg-[#192436]/90 border border-white/5 rounded-2xl h-full flex flex-col p-6 shadow-xl relative overflow-y-auto">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-md hover:bg-white/5 text-slate-400 hover:text-white transition-colors z-10"
            >
                <span className="material-symbols-outlined text-lg">close</span>
            </button>

            {/* Header Area */}
            <div className="flex flex-col gap-4 border-b border-white/5 pb-4 pr-8">
                <div>
                    <h3 className="text-[10px] text-cyan-500 font-bold tracking-widest uppercase mb-1">{t('history.detailsTitle')}</h3>
                    <h2 className="text-2xl font-bold text-white">{session.scenarioName}</h2>

                    <div className="flex flex-wrap gap-4 sm:gap-8 mt-4 text-sm">
                        <div>
                            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('history.student')}</span>
                            <span className="text-slate-200">{session.studentName}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('history.duration')}</span>
                            <span className="text-slate-200">{session.duration}</span>
                        </div>
                        <div>
                            <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">{t('history.id')}</span>
                            <span className="text-slate-200">{session.id}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reports Section */}
            <div className="mt-6">
                <h4 className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    {t('history.exportedReports')}
                </h4>

                {reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 bg-[#0f172a]/50 p-6 rounded-lg border border-white/5 text-center">
                        <span className="text-sm text-slate-400 italic">
                            {t('history.noReports')}
                        </span>
                        <button
                            onClick={handleGenerateMissingReport}
                            disabled={isGenerating}
                            className="flex items-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border border-cyan-500/30 px-4 py-2 rounded-lg transition-colors font-bold tracking-wide uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className={`material-symbols-outlined text-[16px] ${isGenerating ? 'animate-spin' : ''}`}>
                                {isGenerating ? 'sync' : 'note_add'}
                            </span>
                            {isGenerating ? t('history.generating') : t('history.generateMissingReport')}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {reports.map((report) => (
                            <div key={report.id} className="flex items-start sm:items-center justify-between gap-3 bg-[#0f172a]/80 border border-white/10 rounded-lg p-3 hover:border-indigo-500/50 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-bold text-slate-200 truncate">{report.createdBy === 'SYSTEM' ? 'Avaliador / Sistema' : report.createdBy}</span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded shrink-0">
                                            {report.isLive ? 'LIVE' : 'BATCH'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                        <span title="Data de Geração" className="flex items-center whitespace-nowrap">
                                            <span className="material-symbols-outlined text-[12px] mr-1 shrink-0">event</span>
                                            {new Date(report.createdAt).toLocaleString('pt-PT')}
                                        </span>
                                        <span title="Intervalo Temporal Observado" className="flex items-center whitespace-nowrap">
                                            <span className="material-symbols-outlined text-[12px] mr-1 shrink-0">schedule</span>
                                            {report.intervaloTemporal === 'Simulação Completa' ? t('history.fullSimulation', 'Simulação Completa') : report.intervaloTemporal}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDownloadReport(report.id)}
                                    className="shrink-0 p-2 border border-white/10 rounded-lg hover:bg-indigo-500 hover:text-white hover:border-indigo-500 text-slate-400 transition-colors"
                                    title="Descarregar PDF"
                                >
                                    <span className="material-symbols-outlined text-[18px]">download</span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Timeline Section */}
            <div className="mt-8 mb-8">
                <h4 className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">show_chart</span>
                    {t('history.eventTimeline')}
                </h4>

                <div className="flex flex-col gap-3 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                    {session.events.map((event, index) => (
                        <div key={index} className="relative flex items-center justify-between group is-active">
                            {/* Dot */}
                            <div className={`flex items-center justify-center w-3 h-3 rounded-full border-2 border-[#192436] ${getTimelineDotColor(event.type)} shrink-0 z-10 absolute left-0`}></div>

                            {/* Content Box */}
                            <div className={`ml-6 w-[calc(100%-1.5rem)] p-3 border rounded-lg bg-[#0f172a]/50 ${getTimelineColor(event.type)} flex items-center gap-3`}>
                                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-black/40 ${event.type === 'critical' ? 'text-[#ffb4ab]' : event.type === 'warning' ? 'text-[#fabd00]' : 'text-[#00daf3]'}`}>
                                    {event.time}
                                </span>
                                <span className="text-sm text-slate-300">
                                    {translateEventDescription(event.description)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
