import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function RuleModal({ isOpen, onClose, onSave, systems, initialData, translateSystem }) {
    const { t } = useTranslation();
    // I isolated all form states here to maintain a clean architecture in the parent component
    const [formName, setFormName] = useState('');
    const [formSystem, setFormSystem] = useState('');
    const [formParameter, setFormParameter] = useState('hr');
    
    const [formCondition, setFormCondition] = useState('gt');
    
    // Hysteresis State: Activation (Degradation)
    const [activationThreshold, setActivationThreshold] = useState('');
    const [activationPersistence, setActivationPersistence] = useState('');
    
    // Hysteresis State: Resolution (Recovery)
    const [resolutionThreshold, setResolutionThreshold] = useState('');
    const [resolutionPersistence, setResolutionPersistence] = useState('');

    const [formSeverity, setFormSeverity] = useState('critical');
    const [formJustification, setFormJustification] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormName(initialData.name || '');
                setFormSystem(initialData.systemId || '');
                setFormSeverity(initialData.severity === 'CRITICO' ? 'critical' : 'alert');
                
                try {
                    const dsl = JSON.parse(initialData.expressionDsl || '{}');
                    setFormParameter(dsl.metric === 'HEART_RATE' ? 'hr' : dsl.metric === 'SPO2' ? 'spo2' : dsl.metric === 'BP' ? 'bp' : 'rr');
                    setFormCondition(dsl.operator === '>' ? 'gt' : dsl.operator === '<' ? 'lt' : 'eq');
                    setActivationThreshold(dsl.activationThreshold || dsl.threshold || '');
                    setActivationPersistence(dsl.activationPersistence || dsl.persistence || '');
                    setResolutionThreshold(dsl.resolutionThreshold || '');
                    setResolutionPersistence(dsl.resolutionPersistence || '');
                } catch (e) {
                    resetForm();
                }
            } else {
                resetForm();
            }
        }
    }, [isOpen, initialData]);

    const resetForm = () => {
        setFormName('');
        setFormSystem('');
        setFormParameter('hr');
        setFormCondition('gt');
        setActivationThreshold('');
        setActivationPersistence('');
        setResolutionThreshold('');
        setResolutionPersistence('');
        setFormSeverity('critical');
        setFormJustification('');
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formParameter === 'bp') {
            const thresholdValue = parseFloat(activationThreshold);
            if (thresholdValue < 0 || thresholdValue > 300) {
                alert(t('rules.modal.bpAlert'));
                return;
            }
        }

        const dslObject = {
            metric: formParameter === 'hr' ? 'HEART_RATE' : formParameter === 'spo2' ? 'SPO2' : formParameter.toUpperCase(),
            operator: formCondition === 'gt' ? '>' : formCondition === 'lt' ? '<' : '==',
            activationThreshold: parseFloat(activationThreshold),
            activationPersistence: parseInt(activationPersistence, 10) || 0,
            resolutionThreshold: parseFloat(resolutionThreshold) || null,
            resolutionPersistence: parseInt(resolutionPersistence, 10) || 0
        };

        const newRule = {
            name: formName,
            systemId: parseInt(formSystem),
            severity: formSeverity === 'critical' ? 'CRITICO' : 'ALERTA',
            expressionDsl: JSON.stringify(dslObject)
        };

        onSave(newRule);
    };

    // Calculate deduced resolution operator
    const getResolutionOperator = () => {
        if (formCondition === 'gt') return 'Menor que (<)';
        if (formCondition === 'lt') return 'Maior que (>)';
        return 'Set manually'; // For "==" we block automatic deduction
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
            <div className="glass-panel bg-[#192436] rounded-xl p-4 sm:p-[24px] flex flex-col gap-5 w-full max-w-2xl max-h-[92vh] overflow-y-auto relative z-10 border border-white/10 shadow-2xl">
                <button className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={onClose}>
                    <span className="material-symbols-outlined">close</span>
                </button>

                <div className="border-b border-outline-variant pb-3 pr-6">
                    <h2 className="font-headline-md text-xl text-on-surface font-semibold">{initialData ? t('rules.modal.editTitle') : t('rules.modal.createTitleHysteresis')}</h2>
                    <p className="font-body-md text-xs text-on-surface-variant mt-0.5">{t('rules.modal.subtitleHysteresis')}</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
                    {/* Row: Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-xs text-primary-fixed-dim uppercase tracking-wider">{t('rules.modal.nameLabel')}</label>
                        <input className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-on-surface outline-none focus:border-primary-container/40" type="text" value={formName} onChange={e => setFormName(e.target.value)} required />
                    </div>

                    {/* Row: System and Parameter */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="font-label-caps text-xs text-primary-fixed-dim uppercase tracking-wider">{t('rules.modal.systemLabel')}</label>
                            <select className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-on-surface outline-none cursor-pointer" value={formSystem} onChange={e => setFormSystem(e.target.value)} required>
                                <option value="">{t('rules.modal.selectOption')}</option>
                                {systems.map(sys => (
                                    <option key={sys.id} value={sys.id} className="bg-[#192436]">{translateSystem ? translateSystem(sys.systemName) : sys.systemName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="font-label-caps text-xs text-primary-fixed-dim uppercase tracking-wider">{t('rules.modal.parameterLabel')}</label>
                            <select className="w-full bg-black/20 border border-white/10 rounded-lg p-2.5 text-sm text-on-surface outline-none cursor-pointer" value={formParameter} onChange={e => setFormParameter(e.target.value)}>
                                <option value="hr" className="bg-[#192436]">{t('rules.modal.params.hr')}</option>
                                <option value="spo2" className="bg-[#192436]">{t('rules.modal.params.spo2')}</option>
                                <option value="bp" className="bg-[#192436]">{t('rules.modal.params.bp')}</option>
                                <option value="rr" className="bg-[#192436]">{t('rules.modal.params.rr')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="font-label-caps text-xs text-primary-fixed-dim uppercase tracking-wider">{t('rules.modal.activationConditionLabel')}</label>
                        <select className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm text-on-surface cursor-pointer" value={formCondition} onChange={e => setFormCondition(e.target.value)}>
                            <option value="gt" className="bg-[#192436]">{t('rules.modal.conditions.gt')}</option>
                            <option value="lt" className="bg-[#192436]">{t('rules.modal.conditions.lt')}</option>
                            <option value="eq" className="bg-[#192436]">{t('rules.modal.conditions.eqHysteresis')}</option>
                        </select>
                    </div>

                    {/* Hysteresis Cards: Activation and Resolution side-by-side on desktop, stacked on mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        
                        {/* Phase 1: Activation */}
                        <div className="flex flex-col gap-3 bg-red-900/10 border border-red-500/20 p-4 rounded-xl shadow-[inset_0_0_20px_rgba(220,38,38,0.05)]">
                            <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest border-b border-red-500/20 pb-2">{t('rules.modal.phase1Title')}</h3>
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-caps text-[10px] text-red-300/70 uppercase">{t('rules.modal.triggerValueLabel')}</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-red-400 font-bold w-6">{formCondition === 'gt' ? '>' : formCondition === 'lt' ? '<' : '=='}</span>
                                    <input className="w-full bg-black/20 border border-red-500/20 rounded-lg p-2 text-sm text-red-100 font-bold text-center outline-none focus:border-red-400/50" type="number" step="0.1" value={activationThreshold} onChange={e => setActivationThreshold(e.target.value)} required />
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-caps text-[10px] text-red-300/70 uppercase">{t('rules.modal.persistenceTimeLabel')}</label>
                                <input className="w-full bg-black/20 border border-red-500/20 rounded-lg p-2 text-sm text-red-100 font-bold text-center outline-none focus:border-red-400/50" type="number" placeholder="ex: 30" value={activationPersistence} onChange={e => setActivationPersistence(e.target.value)} required />
                            </div>
                        </div>

                        {/* Phase 2: Resolution */}
                        <div className={`flex flex-col gap-3 bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-xl shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] ${formCondition === 'eq' ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-emerald-500/20 pb-2">{t('rules.modal.phase2Title')}</h3>
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-caps text-[10px] text-emerald-300/70 uppercase">{t('rules.modal.safeValueLabel')}</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-emerald-400 font-bold w-6 text-center" title="Deduzido automaticamente">{formCondition === 'gt' ? '<' : formCondition === 'lt' ? '>' : 'N/A'}</span>
                                    <input className="w-full bg-black/20 border border-emerald-500/20 rounded-lg p-2 text-sm text-emerald-100 font-bold text-center outline-none focus:border-emerald-400/50" type="number" step="0.1" value={resolutionThreshold} onChange={e => setResolutionThreshold(e.target.value)} required={formCondition !== 'eq'} />
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="font-label-caps text-[10px] text-emerald-300/70 uppercase">{t('rules.modal.stabilizationTimeLabel')}</label>
                                <input className="w-full bg-black/20 border border-emerald-500/20 rounded-lg p-2 text-sm text-emerald-100 font-bold text-center outline-none focus:border-emerald-400/50" type="number" placeholder="ex: 60" value={resolutionPersistence} onChange={e => setResolutionPersistence(e.target.value)} required={formCondition !== 'eq'} />
                            </div>
                        </div>

                    </div>

                    {formCondition === 'eq' && (
                        <p className="text-[10px] text-amber-400/80 -mt-2">
                            <span className="material-symbols-outlined text-[12px] align-middle mr-1">info</span>
                            {t('rules.modal.hysteresisInfo')}
                        </p>
                    )}

                    {/* Row: Severity */}
                    <div className="flex flex-col gap-1.5 mt-2">
                        <label className="font-label-caps text-xs text-primary-fixed-dim uppercase tracking-wider">{t('rules.modal.severityInitialLabel')}</label>
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            {['alert', 'critical'].map((sev) => (
                                <label key={sev} className="flex-1 relative cursor-pointer text-center">
                                    <input className="sr-only peer" name="severity" type="radio" value={sev} checked={formSeverity === sev} onChange={() => setFormSeverity(sev)} />
                                    <div className={`p-2.5 rounded-lg border border-outline-variant bg-black/20 font-label-caps text-xs transition-all uppercase tracking-wider
                                        ${sev === 'critical' ? 'text-[#ffb4ab] peer-checked:border-[#ffb4ab]/60 peer-checked:bg-[#ffb4ab]/10' : ''}
                                        ${sev === 'alert' ? 'text-[#fabd00] peer-checked:border-[#fabd00]/60 peer-checked:bg-[#fabd00]/10' : ''}
                                    `}>
                                        {sev === 'critical' ? t('rules.modal.severities.criticalRed') : t('rules.modal.severities.alertYellow')}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Row: Justification */}
                    <div className="flex flex-col gap-1.5 mt-2">
                        <label className="font-label-caps text-xs text-primary-fixed-dim uppercase tracking-wider">{t('rules.modal.justificationLabel')}</label>
                        <textarea className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-xs text-on-surface outline-none resize-none leading-relaxed" rows="2" value={formJustification} onChange={e => setFormJustification(e.target.value)} />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" className="bg-[#00daf3]/20 text-[#00daf3] border border-[#00daf3]/50 hover:bg-[#00daf3] hover:text-[#192436] transition-all duration-300 px-6 py-2.5 rounded-lg font-label-caps text-xs font-bold flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center active:scale-95">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>save</span>
                            {t('rules.modal.saveBtnHysteresis')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
