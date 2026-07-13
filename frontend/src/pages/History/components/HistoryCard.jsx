import React from 'react';
import { useTranslation } from 'react-i18next';

export default function HistoryCard({ session, isSelected, onClick }) {
    const { t } = useTranslation();
    // Utility function to get the appropriate color dot based on the status
    const getStatusIndicator = (status) => {
        const upperStatus = status.toUpperCase();
        if (upperStatus.includes("EXCELENTE") || upperStatus.includes("EXCELLENT")) return "bg-[#00daf3]"; // Cyan
        if (upperStatus.includes("APROVADO") || upperStatus.includes("APPROVED")) return "bg-[#fabd00]";  // Yellow
        if (upperStatus.includes("PAUSADA") || upperStatus.includes("PAUSED")) return "bg-[#e5e7eb]"; // Gray
        return "bg-[#ffb4ab]"; // Red for Failed or others
    };

    const translateStatus = (status) => {
        if (!status) return "";
        const upperStatus = status.toUpperCase();
        if (upperStatus.includes('FINALIZADA') || upperStatus.includes('FINISHED')) return t('history.status.finished');
        if (upperStatus.includes('CURSO') || upperStatus.includes('RUNNING') || upperStatus.includes('PROGRESS')) return t('history.status.running');
        if (upperStatus.includes('EXCELENTE') || upperStatus.includes('EXCELLENT')) return t('history.status.excellent');
        if (upperStatus.includes('APROVADO') || upperStatus.includes('APPROVED')) return t('history.status.approved');
        if (upperStatus.includes('REPROVADO') || upperStatus.includes('FAILED')) return t('history.status.failed');
        if (upperStatus.includes('PAUSADA') || upperStatus.includes('PAUSED')) return t('history.status.paused');
        if (upperStatus.includes('CANCELADA') || upperStatus.includes('CANCELLED') || upperStatus.includes('CANCELED')) return t('history.status.cancelled');
        return status;
    };

    return (
        <div 
            onClick={onClick}
            className={`
                flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0 p-3 md:p-4 mb-2 rounded-xl cursor-pointer transition-all duration-300
                ${isSelected 
                    ? 'bg-gradient-to-r from-[#00daf3]/10 to-transparent border-l-4 border-[#00daf3] shadow-lg' 
                    : 'bg-black/20 border border-white/5 hover:bg-black/30 hover:border-white/10'
                }
            `}
        >
            {/* Left section: Date & Time */}
            <div className="flex flex-col min-w-[120px] w-full md:w-auto border-b md:border-0 border-white/5 pb-2 md:pb-0">
                <span className={`font-headline-md font-semibold text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {session.date}
                </span>
                <span className={`font-body-md text-xs mt-1 ${isSelected ? 'text-[#00daf3]' : 'text-slate-500'}`}>
                    {session.time}
                </span>
            </div>

            {/* Middle section: Scenario & Student */}
            <div className="flex-1 w-full md:w-auto px-0 md:px-4 min-w-0">
                <span className={`block font-headline-md font-semibold text-base mb-1 truncate ${isSelected ? 'text-white' : 'text-slate-200'}`} title={session.scenarioName}>
                    {session.scenarioName}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    {session.studentName}
                </div>
            </div>

            {/* Right section: Status & Score */}
            <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2 md:gap-6 shrink-0 mt-1 md:mt-0">
                <div className="flex flex-col items-start md:items-end gap-1">
                    <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${getStatusIndicator(session.status)}`}></span>
                        <span className="font-body-md text-xs text-slate-300">{translateStatus(session.status)}</span>
                    </div>
                </div>

                {/* Open Button (Only visible if selected) */}
                {isSelected && (
                    <div className="bg-[#00daf3] text-[#192436] px-3 md:px-3 py-1 rounded font-bold text-[10px] tracking-wider ml-auto md:ml-4 uppercase shrink-0 whitespace-nowrap">
                        {t('history.open')}
                    </div>
                )}
            </div>
        </div>
    );
}
