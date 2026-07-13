import React, { useMemo } from 'react';
import VitalSignCard from './VitalSignCard';
import useSimulationStore from '../../../store/useSimulationStore';
import { useTranslation } from 'react-i18next';

/**
 * VitalSignsPanel Component
 * 
 * Displays the patient's current vital signs (HR, SpO2, BP) and calculates 
 * short-term historical trends (last 30 seconds) to display mini sparkline 
 * charts and trend arrows indicating if the patient is stabilizing or crashing.
 */
export default function VitalSignsPanel() {
    const { t } = useTranslation();

    const { 
        heartRate, heartStatus, 
        spo2, lungsStatus, 
        sysBP, diaBP, bpStatus,
        biogearsHistory, currentTimeIndex, simState
    } = useSimulationStore();
    const bloodPressure = `${sysBP}/${diaBP}`;

    /**
     * Calculates the historical trends for the last 30 simulated seconds.
     * It downsamples the data to a maximum of 50 points so the sparkline charts
     * remain performant and visually clean, even on very dense CSV datasets.
     */
    const { hrTrend, spo2Trend, bpTrend } = useMemo(() => {
        if (!biogearsHistory || biogearsHistory.length === 0 || currentTimeIndex < 0) {
            return { hrTrend: [], spo2Trend: [], bpTrend: [] };
        }
        const currentTimestamp = biogearsHistory[currentTimeIndex]?.timestamp || 0;
        const targetTimestamp = Math.max(0, currentTimestamp - 30);
        let startIdx = currentTimeIndex;
        while (startIdx > 0 && biogearsHistory[startIdx].timestamp > targetTimestamp) startIdx--;
        
        const rawWindow = biogearsHistory.slice(startIdx, currentTimeIndex + 1);
        
        // Downsample if there are too many points (avoid overly dense charts)
        let window = [];
        if (rawWindow.length > 50) {
            const step = Math.ceil(rawWindow.length / 50);
            for (let i = 0; i < rawWindow.length; i += step) {
                window.push(rawWindow[i]);
            }
            if (window[window.length - 1] !== rawWindow[rawWindow.length - 1]) {
                window.push(rawWindow[rawWindow.length - 1]);
            }
        } else {
            window = rawWindow;
        }

        return {
            hrTrend: window.map(row => row.readings['HeartRate'] || row.readings['HR'] || 0).filter(v => v > 0),
            spo2Trend: window.map(row => {
                const val = row.readings['OxygenSaturation'] || row.readings['SpO2'] || 0;
                return val < 1 && val > 0 ? val * 100 : val;
            }).filter(v => v > 0),
            bpTrend: window.map(row => row.readings['SystolicArterialPressure'] || row.readings['ArterialPressure_Systolic'] || row.readings['SBP'] || 0).filter(v => v > 0)
        };
    }, [biogearsHistory, currentTimeIndex]);

    /**
     * Maps the internal rule evaluation state (which can contain multiple active rules)
     * into a single deterministic UI status color (critical > warning > normal).
     */
    const getOverallStatus = (statusObj) => {
        if (!statusObj || typeof statusObj !== 'object') return 'normal';
        const values = Object.values(statusObj);
        if (values.includes('critical')) return 'critical';
        if (values.includes('warning')) return 'warning';
        return 'normal';
    };

    const getStatusColor = (statusObj) => {
        const overall = getOverallStatus(statusObj);
        if (overall === 'critical') return 'red';
        if (overall === 'warning') return 'amber';
        return 'cyan';
    };

    const getTrendKey = (history) => {
        if (!history || history.length < 2) return 'dashboard.trendStable';
        const first = history[0];
        const last = history[history.length - 1];
        if (last > first + 2) return 'dashboard.trendHigh';
        if (last < first - 2) return 'dashboard.trendDown';
        return 'dashboard.trendStable';
    };

    const getTrendIcon = (history) => {
        if (!history || history.length < 2) return 'remove';
        const first = history[0];
        const last = history[history.length - 1];
        if (last > first + 2) return 'trending_up';
        if (last < first - 2) return 'trending_down';
        return 'remove';
    };

    const getMaxMin = (history) => {
        if (!history || history.length === 0) return 'MAX: -- | MIN: --';
        const max = Math.max(...history);
        const min = Math.min(...history);
        return `MAX: ${Math.round(max)} | MIN: ${Math.round(min)}`;
    };

    const getSpO2Baseline = () => {
        if (!biogearsHistory || biogearsHistory.length === 0) return '--';
        for (let row of biogearsHistory) {
            const val = row.readings['OxygenSaturation'] || row.readings['SpO2'] || 0;
            if (val > 0) return val < 1 ? Math.round(val * 100) : Math.round(val);
        }
        return '--';
    };

    const mapValue = (sysBP !== '--' && diaBP !== '--') ? Math.round((2 * diaBP + sysBP) / 3) : '--';

    return (
        <div className="flex-1 flex flex-col gap-2 justify-between">
            <VitalSignCard
                title={t('dashboard.heartRate')}
                value={heartRate}
                unit="BPM"
                color={getStatusColor(heartStatus)}
                icon="favorite"
                isWarning={getOverallStatus(heartStatus) !== 'normal'}
                trend={t(getTrendKey(hrTrend))}
                trendIcon={getTrendIcon(hrTrend)}
                extraInfo={getMaxMin(hrTrend)}
                sparklinePoints={hrTrend.length > 0 ? hrTrend : [30, 31, 29, 28, 25, 20, 15, 12, 16, 20, 22]}
            />

            <VitalSignCard
                title={t('dashboard.spo2')}
                value={spo2}
                unit="%"
                color={getStatusColor(lungsStatus)}
                icon="air"
                isWarning={getOverallStatus(lungsStatus) !== 'normal'}
                trend={t(getTrendKey(spo2Trend))}
                trendIcon={getTrendIcon(spo2Trend)}
                extraInfo={`BASE: ${getSpO2Baseline()}%`}
                sparklinePoints={spo2Trend.length > 0 ? spo2Trend : [10, 12, 15, 18, 20, 22, 25, 28, 30, 31, 32]}
            />

            <VitalSignCard
                title={t('dashboard.bloodPressure')}
                value={bloodPressure}
                unit="MMHG"
                color={getStatusColor(bpStatus)}
                icon="monitor_heart"
                isWarning={getOverallStatus(bpStatus) !== 'normal'}
                trend={t(getTrendKey(bpTrend))}
                trendIcon={getTrendIcon(bpTrend)}
                extraInfo={`MAP: ${mapValue}`}
                sparklinePoints={bpTrend.length > 0 ? bpTrend : [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]}
            />
        </div>
    );
}
