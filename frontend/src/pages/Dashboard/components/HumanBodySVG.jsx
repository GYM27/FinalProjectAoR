import React from 'react';
import useSimulationStore from '../../../store/useSimulationStore';

export default function HumanBodySVG() {

    const heartStatusMap = useSimulationStore(state => state.heartStatus);
    const lungsStatusMap = useSimulationStore(state => state.lungsStatus);
    const brainStatusMap = useSimulationStore(state => state.brainStatus);
    const kidneyStatusMap = useSimulationStore(state => state.kidneyStatus);

    const getHighestSeverity = (statusMap) => {
        if (!statusMap) return 'normal';
        const values = Object.values(statusMap);
        if (values.includes('critical')) return 'critical';
        if (values.includes('warning')) return 'warning';
        return 'normal';
    };

    const heartStatus = getHighestSeverity(heartStatusMap);
    const lungsStatus = getHighestSeverity(lungsStatusMap);
    const brainStatus = getHighestSeverity(brainStatusMap);
    const kidneyStatus = getHighestSeverity(kidneyStatusMap);

    // Returns the Stroke color and Neon shadow if there is an alert
    const getStroke = (status) => {
        if (status === 'critical') return '#ef4444'; // Red
        if (status === 'warning') return '#f59e0b'; // Yellow
        return 'rgba(6, 182, 212, 0.6)'; // Normal Cyan
    };

    // Returns a more transparent Fill color to highlight the border
    const getFill = (status, defaultAlpha = '0.15') => {
        if (status === 'critical') return 'rgba(239, 68, 68, 0.25)'; // Transparent Red
        if (status === 'warning') return 'rgba(245, 158, 11, 0.25)'; // Transparent Yellow
        return `rgba(6, 182, 212, ${defaultAlpha})`; // Normal Cyan
    };

    // Apply blinking animation only when critical
    const heartAnim = heartStatus === 'critical' ? 'animate-pulse' : '';

    return (
        <svg viewBox="0 0 200 500" className="w-full h-full max-h-[600px] select-none">

            <defs>
                <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(6, 182, 212, 0.4)" />
                    <stop offset="100%" stopColor="rgba(6, 182, 212, 0.05)" />
                </linearGradient>
            </defs>

            {/* ── Corpo: Minimalista e Elegante (Tech Icon Premium) ── */}
            <g fill="url(#bodyGradient)" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.2))' }}>
                {/* Cabeça */}
                <circle cx="100" cy="50" r="22" />
                {/* Tronco */}
                <rect x="60" y="90" width="80" height="160" rx="35" />
                {/* Ombros e Braços */}
                <path d="M 40 100 C 40 65, 160 65, 160 100" strokeWidth="4" fill="none" />
                <path d="M 40 100 L 40 250 M 160 100 L 160 250" strokeWidth="4" fill="none" />
                {/* Pernas */}
                <path d="M 75 270 L 75 440 M 125 270 L 125 440" strokeWidth="4" fill="none" />
            </g>

            {/* ── Órgãos Interativos (Geometria Limpa) ── */}
            <g strokeWidth="2.5">

                {/* Pulmões (Duas cápsulas longas) */}
                <rect x="70" y="110" width="24" height="60" rx="12"
                    fill={getFill(lungsStatus)}
                    stroke={getStroke(lungsStatus)}
                    className="transition-all duration-700"
                    style={{ filter: lungsStatus !== 'normal' ? `drop-shadow(0 0 10px ${getStroke(lungsStatus)})` : 'none' }} />

                <rect x="106" y="110" width="24" height="60" rx="12"
                    fill={getFill(lungsStatus)}
                    stroke={getStroke(lungsStatus)}
                    className="transition-all duration-700"
                    style={{ filter: lungsStatus !== 'normal' ? `drop-shadow(0 0 10px ${getStroke(lungsStatus)})` : 'none' }} />

                {/* Rins (Pequenos feijões rodados) */}
                <rect x="72" y="195" width="18" height="28" rx="9" transform="rotate(15, 81, 209)"
                    fill={getFill(kidneyStatus)}
                    stroke={getStroke(kidneyStatus)}
                    className="transition-all duration-700"
                    style={{ filter: kidneyStatus !== 'normal' ? `drop-shadow(0 0 10px ${getStroke(kidneyStatus)})` : 'none' }} />

                <rect x="110" y="195" width="18" height="28" rx="9" transform="rotate(-15, 119, 209)"
                    fill={getFill(kidneyStatus)}
                    stroke={getStroke(kidneyStatus)}
                    className="transition-all duration-700"
                    style={{ filter: kidneyStatus !== 'normal' ? `drop-shadow(0 0 10px ${getStroke(kidneyStatus)})` : 'none' }} />

                {/* Cérebro (Elipse dentro da cabeça) */}
                <ellipse cx="100" cy="45" rx="14" ry="11"
                    fill={getFill(brainStatus)}
                    stroke={getStroke(brainStatus)}
                    className="transition-all duration-700"
                    style={{ filter: brainStatus !== 'normal' ? `drop-shadow(0 0 10px ${getStroke(brainStatus)})` : 'none' }} />

                {/* Coração (Ícone limpo sobreposto) */}
                <path d="M 100 165 C 112 148, 130 160, 100 185 C 70 160, 88 148, 100 165 Z"
                    fill={getFill(heartStatus, '0.35')}
                    stroke={getStroke(heartStatus)}
                    className={`transition-all duration-700 ${heartAnim}`}
                    style={{
                        transformOrigin: '100px 170px',
                        filter: heartStatus !== 'normal' ? `drop-shadow(0 0 12px ${getStroke(heartStatus)})` : 'drop-shadow(0 0 6px rgba(6,182,212,0.6))'
                    }} />
            </g>
        </svg>
    );
}
