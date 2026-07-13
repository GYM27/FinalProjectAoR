import React from 'react';
import useSimulationStore from '../../../store/useSimulationStore';
import { useTranslation } from 'react-i18next';

import { formatTimeByMode } from '../../../utils/timeFormat';

/**
 * Interactive Timeline component for navigating through BioGears simulation data.
 * <p>It allows medical professionals to scrub back and forth through physiological telemetry 
 * in real-time or playback modes. Integrating closely with Zustand, it controls 
 * auto-scrolling and live-following behavior.</p>
 * 
 * @component
 * @returns {JSX.Element|null} The rendered timeline UI, or null if no data is loaded.
 */
export default function SimulationTimeline() {
    const { t } = useTranslation();
    const { 
        biogearsHistory, 
        currentTimeIndex, 
        isPlaying, 
        pauseBiogears, 
        setCurrentTimeIndex,
        simState,
        pauseSimulation,
        isAutoScrolling,
        isLive,
        activeSimulationId,
        joinedExternally,
        activeSimulationStartTime
    } = useSimulationStore();

    // Do not render the timeline if there is no BioGears history loaded
    if (!biogearsHistory || biogearsHistory.length === 0) {
        return null;
    }

    const totalPoints = biogearsHistory.length;

    const handleSliderChange = (e) => {
        // Disable auto modes if the doctor pulls the bar
        if (simState === 'RUNNING') {
            useSimulationStore.setState({ isAutoScrolling: false, isLive: false });
        }
        
        setCurrentTimeIndex(parseInt(e.target.value, 10));
    };

    const formatTime = (index) => {
        let totalSeconds = index;
        if (biogearsHistory && index < biogearsHistory.length) {
            totalSeconds = biogearsHistory[index].timestamp;
        }
        return formatTimeByMode(totalSeconds, activeSimulationStartTime, joinedExternally);
    };

    const isCsvSimulation = !activeSimulationId;
    const isPaused = simState === 'PAUSED' || (isCsvSimulation && biogearsHistory && biogearsHistory.length > 0 && !isPlaying);

    return (
        <div className="col-span-1 lg:col-span-12 flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4 bg-[#080e1a]/80 border border-cyan-500/30 rounded-xl p-3 md:p-4 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.1)] mt-2">
            
            {/* Play/Pause Button */}
            <button
                onClick={pauseSimulation}
                className={`order-1 shrink-0 flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 ${
                    isPaused 
                        ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/50 hover:bg-emerald-800/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                        : 'bg-amber-900/40 text-amber-400 border-amber-500/50 hover:bg-amber-800/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                }`}
                title={isPaused ? t('dashboard.continue') : t('dashboard.pause')}
            >
                <span className="material-symbols-outlined text-[18px]">
                    {isPaused ? 'play_arrow' : 'pause'}
                </span>
            </button>

            {/* Time Elapsed */}
            <div className="order-2 shrink-0 text-cyan-400 font-mono text-sm tracking-wider font-bold w-auto min-w-[40px] text-center md:text-right">
                {formatTime(currentTimeIndex)}
            </div>

            {/* Scrubber / Slider */}
            <div className="order-5 md:order-3 w-full md:flex-1 px-1 md:px-4 mt-2 md:mt-0 relative flex items-center group">
                <input 
                    type="range" 
                    min="0" 
                    max={totalPoints - 1} 
                    value={currentTimeIndex}
                    onChange={handleSliderChange}
                    className="w-full h-3 md:h-2 bg-[#0d1b2a] rounded-lg appearance-none cursor-pointer accent-cyan-500 border border-white/5 shadow-inner"
                    style={{
                        background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${(currentTimeIndex / (totalPoints - 1)) * 100}%, #0d1b2a ${(currentTimeIndex / (totalPoints - 1)) * 100}%, #0d1b2a 100%)`
                    }}
                />
                
                {/* Custom glowing thumb (optional CSS override for webkit-slider-thumb) */}
                <style dangerouslySetInnerHTML={{__html: `
                    input[type=range]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        height: 20px;
                        width: 20px;
                        border-radius: 50%;
                        background: #22d3ee;
                        box-shadow: 0 0 10px #06b6d4;
                        cursor: pointer;
                        margin-top: 0px;
                    }
                    input[type=range]::-moz-range-thumb {
                        height: 20px;
                        width: 20px;
                        border-radius: 50%;
                        background: #22d3ee;
                        box-shadow: 0 0 10px #06b6d4;
                        cursor: pointer;
                        border: none;
                    }
                    @media (min-width: 768px) {
                        input[type=range]::-webkit-slider-thumb {
                            height: 16px;
                            width: 16px;
                        }
                        input[type=range]::-moz-range-thumb {
                            height: 16px;
                            width: 16px;
                        }
                    }
                `}} />
            </div>

            {/* Total Time */}
            <div className="order-3 md:order-4 shrink-0 text-slate-500 font-mono text-sm tracking-wider w-auto min-w-[40px] text-center md:text-left">
                / {formatTime(totalPoints - 1)}
            </div>

            {/* Go to Live Button */}
            <button 
                onClick={() => useSimulationStore.getState().jumpToLive()}
                className={`order-4 md:order-5 ml-auto md:ml-2 shrink-0 px-3 py-1 rounded text-xs font-bold transition-all border ${isLive || (simState === 'RUNNING' && isAutoScrolling) ? 'bg-red-600/20 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(220,38,38,0.3)]' : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'}`}
                title={t('dashboard.jumpToLive')}
            >
                <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${isLive || (simState === 'RUNNING' && isAutoScrolling) ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`}></span>
                    {t('dashboard.live')}
                </span>
            </button>

        </div>
    );
}
