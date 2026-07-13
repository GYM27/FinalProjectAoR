import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * AlertItem Component
 * 
 * Displays a single alert or event in the system's feed/timeline.
 * Supports different severity levels which dictate the color scheme and icon.
 *
 * @param {Object} props
 * @param {string} props.time - The formatted timestamp or time index of the event
 * @param {string} props.title - The main heading/title of the alert
 * @param {string} props.subtitle - Optional secondary text (e.g. detailed rule justification)
 * @param {string} props.type - Severity level ('critical', 'warning', 'info', 'success')
 * @param {string} [props.link] - Optional URL to navigate to when clicked
 */
export default function AlertItem({ time, title, subtitle, type, link }) {
    const { t } = useTranslation();
    // Tailwind classes mapping for the container's border and background color
    const styles = {
        critical: 'border-l-red-500 bg-red-500/10',
        warning: 'border-l-amber-500 bg-amber-500/10',
        info: 'border-l-cyan-500 bg-cyan-500/10',
        success: 'border-l-green-500 bg-green-500/10'
    };

    const iconColors = {
        critical: 'text-red-400',
        warning: 'text-amber-400',
        info: 'text-cyan-400',
        success: 'text-green-400'
    };

    const icons = {
        critical: 'emergency',
        warning: 'warning',
        info: 'info',
        success: 'check_circle'
    };

    return (
        <div className={`flex items-start gap-3 p-3 rounded-r-lg border-l-2 ${styles[type] || styles.info} mb-3 transition-all hover:brightness-125 w-full overflow-hidden`}>
            <span className={`material-symbols-outlined text-[16px] mt-0.5 shrink-0 ${iconColors[type] || iconColors.info}`}>
                {icons[type] || icons.info}
            </span>
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs font-bold text-white break-words w-full">
                        {title}
                    </span>
                </div>
                {subtitle && (
                    <span className="text-xs font-medium leading-relaxed text-slate-300 break-words w-full mt-1">
                        {subtitle}
                    </span>
                )}
                {link && (
                    <Link to={link} className={`mt-2 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1 w-fit pb-0.5 border-b border-transparent hover:border-current transition-all ${iconColors[type] || iconColors.info}`}>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        {t('history.events.viewInHistory')}
                    </Link>
                )}
                <span className={`text-[9px] font-bold tracking-widest mt-1 ${iconColors[type] || iconColors.info} opacity-80 text-right`}>
                    {time}
                </span>
            </div>
        </div>
    );
}
