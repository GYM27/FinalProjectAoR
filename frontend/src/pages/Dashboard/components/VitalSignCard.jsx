
export default function VitalSignCard({ title, value, unit, color, icon, trend, trendIcon, extraInfo, sparklinePoints, isWarning }) {
    const colors = {
        red: 'text-red-400 border-red-500/70 shadow-[0_0_20px_rgba(239,68,68,0.15)] bg-gradient-to-r from-red-500/10 to-transparent',
        amber: 'text-amber-400 border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.15)] bg-gradient-to-r from-amber-500/10 to-transparent',
        cyan: 'text-cyan-400 border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.15)] bg-gradient-to-r from-cyan-500/10 to-transparent',
    };

    const svgColors = {
        red: { stroke: '#ef4444', fill: 'url(#grad-red)' },
        amber: { stroke: '#f59e0b', fill: 'url(#grad-amber)' },
        cyan: { stroke: '#06b6d4', fill: 'url(#grad-cyan)' },
    };

    const currentColor = colors[color] || colors.cyan;
    const currentSvg = svgColors[color] || svgColors.cyan;

    const pointsToUse = sparklinePoints.length === 1 ? [sparklinePoints[0], sparklinePoints[0]] : sparklinePoints;
    
    // Normalize Y points to SVG height (Y=0 is top, Y=40 is bottom)
    // We will use a margin: the chart will go from Y=5 (max value) to Y=35 (min value)
    const maxVal = Math.max(...pointsToUse);
    const minVal = Math.min(...pointsToUse);
    let range = maxVal - minVal; 
    
    // Prevent zigzag effect: if the signal is very stable (noise less than 5 units),
    // we fix the minimum scale so the line looks perfectly flat instead of amplifying decimal noise.
    if (range < 5) {
        range = 5;
    }
    
    // Recalculate minimum value to keep the line vertically centered when scale is forced
    const center = (maxVal + minVal) / 2;
    const adjustedMin = center - (range / 2);

    const normalizedPoints = pointsToUse.map(p => 35 - ((p - adjustedMin) / range) * 30);
    const polylinePoints = normalizedPoints.map((y, i) => `${i * (100 / (normalizedPoints.length - 1))},${y}`).join(' ');

    return (
        <div className={`relative flex flex-col p-2 rounded-xl border-l-4 bg-[#0b1320] border-y border-r border-white/5 ${currentColor}`}>

            {/* Topo */}
            <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-bold tracking-widest uppercase text-slate-300">{title}</span>
                {isWarning ? (
                    <span className={`material-symbols-outlined text-[14px] animate-pulse ${currentColor.split(' ')[0]}`}>warning</span>
                ) : (
                    <span className="material-symbols-outlined text-[12px] text-slate-500">{icon}</span>
                )}
            </div>

            {/* Valor */}
            <div className="flex items-baseline gap-1 mb-1 z-10">
                <span className={`text-2xl font-bold font-mono ${currentColor.split(' ')[0]}`}>{value}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase">{unit}</span>
            </div>

            {/* Gráfico Sparkline */}
            <div className="absolute bottom-5 left-0 w-full h-8 z-0 opacity-80 pointer-events-none">
                <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={currentSvg.stroke} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={currentSvg.stroke} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>
                    <path d={`M 0 40 L 0 ${normalizedPoints[0]} ` + normalizedPoints.map((y, i) => `L ${i * (100 / (normalizedPoints.length - 1))} ${y}`).join(' ') + ' L 100 40 Z'} fill={currentSvg.fill} />
                    <polyline points={polylinePoints} fill="none" stroke={currentSvg.stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                </svg>
            </div>

            {/* Rodapé */}
            <div className="flex justify-between items-center mt-1 z-10 border-t border-white/5 pt-1">
                <div className="flex items-center gap-1 bg-[#162435] px-1 py-0.5 rounded">
                    <span className={`material-symbols-outlined text-[9px] ${currentColor.split(' ')[0]}`}>
                        {trendIcon || 'remove'}
                    </span>
                    <span className="text-[6px] font-bold tracking-wider text-slate-300">{trend}</span>
                </div>
                <span className="text-[6px] font-bold text-slate-500 uppercase tracking-widest">{extraInfo}</span>
            </div>
        </div>
    );
}
