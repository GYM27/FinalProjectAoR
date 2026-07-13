import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { definitionsService } from "../api/definitionsService";
import { useAuthStore } from '../store/useAuthStore';
import { useDegradedStore } from '../store/useDegradedStore';

export default function Definitions() {
    const { t } = useTranslation();
    const sessionTimeoutMinutes = useAuthStore(state => state.sessionTimeoutMinutes);
    const isDegradedMode = useDegradedStore(state => state.isDegradedMode);

    const [definitions, setDefinitions] = useState({
        sessionTimeoutMinutes: sessionTimeoutMinutes || 30,
        isBioGearsEnabled: false,
        isHumanBodyEnabled: true,
        isAudioAlertsEnabled: false,
        isDbFailed: isDegradedMode || false,
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchDefinitions();
    }, []);

    const fetchDefinitions = async () => {
        try {
            const response = await definitionsService.getDefinitions();
            if (response) {
                // Merge with existing state to keep the new UI toggles working
                // even if the backend doesn't support them yet
                setDefinitions(prev => ({ ...prev, ...response }));
            }
        } catch (error) {
            console.error('Error fetching definitions:', error);
        }
    };

    const handleChange = (name, value) => {
        setDefinitions(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveDefinitions = async () => {
        setIsSaving(true);
        try {
            await definitionsService.saveDefinitions(definitions);
            import('../store/useAuthStore').then(module => {
                module.useAuthStore.setState({ sessionTimeoutMinutes: definitions.sessionTimeoutMinutes });
            });
            import('../store/useDegradedStore').then(module => {
                module.useDegradedStore.getState().setDegradedMode(definitions.isDbFailed);
            });
            alert(t('definitions.saveSuccess'));
        } catch (error) {
            console.error('Error saving definitions:', error);
            alert(t('definitions.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    // Helper component for building modern toggle switches
    const CustomToggle = ({ id, checked, onChange }) => (
        <label htmlFor={id} className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
                type="checkbox"
                className="sr-only peer"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            {/* Toggle switch background track */}
            <div className="w-11 h-6 bg-[var(--color-surface-container-high)] rounded-full peer-checked:bg-[var(--color-tech-cyan)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-colors duration-300"></div>
            {/* Toggle switch sliding thumb */}
            <div className={`absolute left-[2px] top-[2px] h-5 w-5 rounded-full transition-transform duration-300 flex items-center justify-center shadow-md ${checked ? 'translate-x-[20px] bg-white border border-[#00363d]' : 'translate-x-0 bg-gray-300 border border-gray-400'}`}></div>
        </label>
    );

    return (
        <div className="flex-1 w-full min-h-screen p-8 sm:p-12 text-white flex justify-center">
            <div className="w-full max-w-4xl">

                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center gap-5 mb-3">
                        <h1 className="text-3xl font-bold tracking-wide text-white" style={{ fontFamily: 'var(--font-headline-lg)' }}>
                            {t('definitions.title')}
                        </h1>
                        <div className="flex-1 h-[1px] bg-gradient-to-r from-[rgba(0,218,243,0.3)] to-transparent"></div>
                    </div>
                    <p className="text-[var(--color-on-surface-variant)] text-sm max-w-3xl leading-relaxed" style={{ fontFamily: 'var(--font-body-md)' }}>
                        {t('definitions.subtitle')}
                    </p>
                </div>

                {/* Main Vertical Layout */}
                <div className="flex flex-col gap-6">

                    {/* Panel 1: System Security settings */}
                    <div className="glass-panel p-8 rounded-xl flex flex-col border border-[rgba(255,255,255,0.05)] shadow-2xl">
                        <div className="flex items-center gap-2 text-[var(--color-tech-cyan)] font-bold tracking-wider text-xs mb-8 uppercase" style={{ fontFamily: 'var(--font-label-caps)' }}>
                            <span className="material-symbols-outlined text-[18px]">security</span>
                            {t('definitions.security')}
                        </div>

                        <div className="flex flex-col gap-3">
                            <label htmlFor="timeout" className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest" style={{ fontFamily: 'var(--font-label-caps)' }}>
                                {t('definitions.timeout')}
                            </label>
                            <div className="flex items-center gap-4">
                                <div className="relative w-40">
                                    <input
                                        className="w-full bg-[#0a121e] border border-[rgba(255,255,255,0.05)] text-white px-4 py-3 rounded-md outline-none transition-all duration-300 input-focus-glow hover:border-[rgba(0,218,243,0.3)] font-mono text-lg text-center"
                                        type="number"
                                        id="timeout"
                                        min="1"
                                        value={definitions.sessionTimeoutMinutes}
                                        onChange={(e) => handleChange("sessionTimeoutMinutes", parseInt(e.target.value) || 0)}
                                    />
                                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                        <span className="text-[var(--color-outline)] font-mono text-xs font-bold">MIN</span>
                                    </div>
                                </div>
                                <span className="text-sm text-[var(--color-on-surface-variant)]">{t('definitions.minutes')}</span>
                            </div>
                            <p className="text-[13px] text-[var(--color-outline)] mt-3 leading-relaxed max-w-xl">
                                {t('definitions.timeoutDesc')}
                            </p>
                        </div>
                    </div>

                    {/* Panel 2: Feature Flags */}
                    <div className="glass-panel p-8 rounded-xl flex flex-col border border-[rgba(255,255,255,0.05)] shadow-2xl">
                        <div className="flex items-center gap-2 text-[var(--color-tech-cyan)] font-bold tracking-wider text-xs mb-8 uppercase" style={{ fontFamily: 'var(--font-label-caps)' }}>
                            <span className="material-symbols-outlined text-[18px]">flag</span>
                            {t('definitions.features')}
                        </div>

                        <div className="flex flex-col gap-8">

                            {/* Feature Flag: Human Body visualization */}
                            <div className="flex items-start justify-between gap-6 group">
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-[var(--color-tech-cyan)] transition-colors" style={{ fontFamily: 'var(--font-body-md)' }}>{t('definitions.humanBody')}</h3>
                                    <p className="text-[13px] text-[var(--color-outline)] leading-relaxed">
                                        {t('definitions.humanBodyDesc')}
                                    </p>
                                </div>
                                <CustomToggle
                                    id="humanBodyEnabled"
                                    checked={definitions.isHumanBodyEnabled}
                                    onChange={(val) => handleChange("isHumanBodyEnabled", val)}
                                />
                            </div>

                            {/* Flag: Chaos Engineering (Degraded Mode) */}
                            <div className="flex items-start justify-between gap-6 group border-t border-[rgba(255,255,255,0.05)] pt-6">
                                <div>
                                    <h3 className="text-sm font-bold text-yellow-500 mb-1 transition-colors" style={{ fontFamily: 'var(--font-body-md)' }}>{t('definitions.chaosDb', 'Chaos Engineering: Forçar Falha de BD (Modo Degradado)')}</h3>
                                    <p className="text-[13px] text-[var(--color-outline)] leading-relaxed">
                                        {t('definitions.chaosDbDesc', 'Testa a resiliência do sistema simulando uma falha na Base de Dados. O sistema passará a operar inteiramente em memória e com capacidades limitadas (Modo Degradado).')}
                                    </p>
                                </div>
                                <CustomToggle
                                    id="dbFailedEnabled"
                                    checked={definitions.isDbFailed}
                                    onChange={(val) => handleChange("isDbFailed", val)}
                                />
                            </div>

                        </div>
                    </div>

                    {/* Save Action */}
                    <div className="flex justify-end mt-4">
                        <button
                            className="bg-[var(--color-tech-cyan)] text-[#001f24] font-bold py-3.5 px-8 rounded-md uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,218,243,0.4)] hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
                            onClick={handleSaveDefinitions}
                            disabled={isSaving}
                            style={{ fontFamily: 'var(--font-label-caps)' }}
                        >
                            <span className={`material-symbols-outlined text-[20px] ${isSaving ? 'animate-spin' : ''}`}>
                                {isSaving ? 'sync' : 'save_as'}
                            </span>
                            {isSaving ? t('definitions.saving') : t('definitions.save')}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}