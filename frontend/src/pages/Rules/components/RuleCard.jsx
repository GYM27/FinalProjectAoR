import React from 'react';
import { useTranslation } from 'react-i18next';

export default function RuleCard({ rule, onToggleActive, onEdit, onDelete }) {
    const { t } = useTranslation();
    // I parse the JSON payload from the backend to extract the DSL logic
    const dsl = JSON.parse(rule.expressionDsl || '{}');
    const isCritical = rule.severity === 'CRITICO';
    const isActive = rule.active;
    const isDeleted = rule.deleted;

    return (
        <div className={`glass-panel rounded-xl flex flex-col relative overflow-hidden group transition-all border px-6 py-3 shadow-xl border-white/5 w-full ${(!isActive || isDeleted) ? 'opacity-50 grayscale' : ''} ${isDeleted ? 'border-error/30 bg-error/5' : ''}`}>
            <div className={`w-1 bg-gradient-to-b ${isCritical ? 'from-error to-error/30 shadow-[0_0_10px_rgba(255,180,171,0.5)]' : 'from-secondary-container to-secondary-container/30 shadow-[0_0_10px_rgba(250,189,0,0.5)]'} h-full absolute left-0 top-0 ${isDeleted ? 'from-error/50 to-error/10' : ''}`}></div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2 w-full mb-2 sm:mb-1">
                <div className="flex flex-col w-full sm:w-auto">
                    <span className="font-headline-md text-base sm:text-lg text-on-surface font-semibold leading-tight flex items-center gap-2">
                        {t(`rules.names.${rule.name}`, rule.name) || t('rules.card.defaultName')} 
                        {isDeleted ? (
                            <span className="text-error text-xs uppercase tracking-widest bg-error/10 px-2 py-0.5 rounded-sm">({t('rules.card.deleted')})</span>
                        ) : !isActive ? (
                            <span className="text-error text-xs uppercase tracking-widest">({t('rules.card.inactive')})</span>
                        ) : null}
                    </span>
                    <span className="font-headline-md text-[10px] text-on-surface-variant uppercase tracking-widest mt-0.5">
                        {t('rules.card.author')}: {rule.createdByUserEmail}
                    </span>
                </div>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-end">
                    {!isDeleted && (
                        <button 
                            onClick={() => onToggleActive(rule.id, isActive)}
                            className={`font-label-caps text-[9px] sm:text-[10px] uppercase tracking-widest px-2.5 sm:px-3 py-1 rounded-full border backdrop-blur-sm shrink-0 cursor-pointer transition-colors ${isActive ? 'bg-error/10 text-error border-error/20 hover:bg-error hover:text-white' : 'bg-primary-container/10 text-primary-container border-primary-container/20 hover:bg-primary-container hover:text-[#192436]'}`}
                        >
                            {isActive ? t('rules.card.deactivate') : t('rules.card.activate')}
                        </button>
                    )}
                    
                    {!isDeleted && (
                        <div className="flex gap-1 items-center ml-2 border-l border-white/10 pl-2">
                            <button onClick={onEdit} className="text-on-surface-variant hover:text-primary-container transition-colors p-1 cursor-pointer" title={t('rules.card.edit')}>
                                <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button onClick={onDelete} className="text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer" title={t('rules.card.delete')}>
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    )}
                    <span className={`font-headline-md text-[9px] sm:text-[10px] uppercase tracking-widest px-2.5 sm:px-3 py-1 rounded-full border backdrop-blur-sm shrink-0 ${isCritical ? 'bg-error/10 text-error border-error/20' : 'bg-secondary-container/10 text-secondary-container border-secondary-container/20'}`}>
                        {rule.severity === 'CRITICO' ? t('rules.card.critical') : t('rules.card.alert')}
                    </span>
                </div>
            </div>

            <div className="mt-3 flex flex-col md:flex-row gap-2">
                <div className="flex flex-wrap items-center gap-2 bg-red-900/10 border border-red-500/20 px-3 py-1.5 rounded-lg w-full md:w-fit">
                    <span className="font-mono text-[10px] text-red-400 uppercase tracking-wider">{t('rules.card.activation')}</span>
                    <span className="font-mono text-sm text-red-100 font-bold tracking-wider">
                        {`${dsl.metric} ${dsl.operator} ${dsl.activationThreshold !== undefined ? dsl.activationThreshold : dsl.threshold}`}
                    </span>
                    <span className="font-mono text-[10px] text-red-400/70">
                        ({t('rules.card.persistence')}: {dsl.activationPersistence !== undefined ? dsl.activationPersistence : dsl.persistence}s)
                    </span>
                </div>
                
                {dsl.resolutionThreshold !== undefined && dsl.resolutionThreshold !== null && (
                    <div className="flex flex-wrap items-center gap-2 bg-emerald-900/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-full md:w-fit">
                        <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-wider">{t('rules.card.resolution')}</span>
                        <span className="font-mono text-sm text-emerald-100 font-bold tracking-wider">
                            {`${dsl.metric} ${dsl.operator === '>' ? '<' : dsl.operator === '<' ? '>' : dsl.operator} ${dsl.resolutionThreshold}`}
                        </span>
                        <span className="font-mono text-[10px] text-emerald-400/70">
                            ({t('rules.card.washout')}: {dsl.resolutionPersistence}s)
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
