import React, { useState } from 'react';
import useSimulationStore from '../../../store/useSimulationStore';
import { useTranslation } from 'react-i18next';

/**
 * ControlPanel Component
 * 
 * Renders the main engine controls for the dashboard (Upload, Start, Stop, Live).
 * It connects to the global Zustand simulation store to dispatch actions
 * and read the current simulation state.
 *
 * @param {Object} props - Component props
 * @param {Object} props.uploadedScenario - Currently uploaded scenario data (if any)
 * @param {Function} props.setUploadedScenario - Callback to update the uploaded scenario state
 */
export default function ControlPanel({
    uploadedScenario, 
    setUploadedScenario
}) {
    const { t } = useTranslation();
    // Local state just for UI
    const [selectedFile, setSelectedFile] = useState(null);
    
    // Connect to Zustand Store for simulation control and state
    const { 
        simState, 
        startSimulation, 
        stopSimulation,
        uploadBiogears,
        importSimulation,
        isConnecting,
        isUploading,
        isSpectator
    } = useSimulationStore();

    // Determine if the engine is busy processing a file or connecting to the server
    const isBusy = isConnecting || isUploading;

    return (
        <div className="flex flex-col gap-3 bg-[#080e1a] p-4 rounded-lg border border-white/5 shadow-inner">
            <h3 className="text-xs text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.engine')}</h3>

            {/* Universal Upload Area (JSON or CSV)
                Allows the user to upload either a clinical scenario (JSON) or a batch history file (CSV).
                The component automatically determines the appropriate parsing method based on the file extension.
            */}
            <label className={`flex items-center justify-center gap-2 p-3 mb-2 border border-dashed rounded-xl transition-all text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.1)] ${isBusy ? 'opacity-50 cursor-not-allowed bg-[#0d1b2a] border-slate-600 text-slate-500' : selectedFile ? 'bg-cyan-900/30 border-cyan-400 text-cyan-300 cursor-pointer' : 'bg-[#0d1b2a] border-cyan-500/50 hover:bg-[#112236] hover:border-cyan-400 text-cyan-400 cursor-pointer'}`}>
                <span className="material-symbols-outlined text-[18px]">
                    {isBusy ? 'hourglass_empty' : selectedFile ? 'check_circle' : 'upload_file'}
                </span>
                <span className="truncate max-w-[200px]">
                    {isBusy ? 'AGUARDE...' : selectedFile ? selectedFile.name : t('dashboard.importData')}
                </span>
                <input
                    type="file"
                    className="hidden"
                    accept=".json,.csv"
                    disabled={isBusy}
                    onChange={(e) => {
                        if (isBusy) return;
                        const file = e.target.files[0];
                        if (file) {
                            setSelectedFile(file);
                            // Imports immediately when the file is selected
                            //Branch the logic based on file extension to call the correct store action
                            if (file.name.endsWith('.csv')) {
                                uploadBiogears(file);
                            } else {
                                importSimulation(file);
                            }
                        }
                        // Reset the input value so the same file can be selected again if needed
                        e.target.value = '';
                    }}
                />
            </label>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
                {/* START */}
                <button
                    onClick={() => { console.log('START button wrapper clicked'); startSimulation(); }}
                    disabled={simState !== 'READY' || isBusy}
                    className={`flex flex-col items-center justify-center py-3 border rounded-lg transition-all duration-300 ${(simState !== 'READY' || isBusy) ? 'bg-[#080e1a] border-slate-800 text-slate-600 shadow-none cursor-not-allowed' : 'bg-[#0d1b2a] hover:bg-[#112236] border-cyan-500/30 hover:border-cyan-500/60 text-cyan-400'}`}
                    title={t('dashboard.start')}
                >
                    <span className="material-symbols-outlined mb-1">play_arrow</span>
                    <span className="text-[10px] font-bold tracking-wider">START</span>
                </button>

                {/* STOP / SAIR */}
                <button
                    onClick={() => {
                        stopSimulation();
                        setSelectedFile(null);
                        setUploadedScenario?.(null);
                    }}
                    disabled={simState !== 'RUNNING' || isBusy}
                    className={`flex flex-col items-center justify-center py-3 bg-[#0d1b2a] border rounded-lg transition-all duration-300 ${
                        simState !== 'RUNNING' || isBusy 
                            ? 'opacity-50 cursor-not-allowed border-red-500/30 text-red-400' 
                            : isSpectator 
                                ? 'border-orange-500/30 hover:border-orange-500/60 text-orange-400 hover:bg-[#112236] active:bg-orange-900/40'
                                : 'border-red-500/30 hover:border-red-500/60 text-red-400 hover:bg-[#112236] active:bg-red-900/40'
                    }`}
                >
                    <span className="material-symbols-outlined mb-1">
                        {isSpectator ? 'logout' : 'stop'}
                    </span>
                    <span className="text-[10px] font-bold tracking-wider">
                        {isSpectator ? 'SAIR' : 'STOP'}
                    </span>
                </button>

                {/* LIVE */}
                <button
                    onClick={() => {
                        useSimulationStore.getState().joinActiveSimulation();
                    }}
                    disabled={simState === 'RUNNING' || isBusy}
                    className={`flex flex-col items-center justify-center py-3 border border-emerald-500/30 rounded-lg text-emerald-400 transition-all duration-300 ${(simState === 'RUNNING' || isBusy) ? 'opacity-50 cursor-not-allowed bg-[#080e1a]' : 'hover:border-emerald-500/60 hover:bg-[#112236] active:bg-emerald-900/40'}`}
                    title="Ligar a uma simulação em direto a correr no servidor (ex: Scripts externos)"
                >
                    <span className="material-symbols-outlined mb-1">sensors</span>
                    <span className="text-[10px] font-bold tracking-wider">LIVE</span>
                </button>
            </div>
        </div>
    );
}
