import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * SystemMetrics Component
 * 
 * Renders a diagnostic dashboard that fetches real-time actuator metrics 
 * from the Spring Boot backend (using Micrometer). It tracks JVM memory, 
 * CPU usage, and custom business metrics (e.g., CSV Batch parse delay, rules triggered).
 * Mostly used for debugging and performance monitoring.
 */
export default function SystemMetrics() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState({
    batchTimeMax: 0,
    batchCount: 0,
    alertsTriggered: 0,
    alertsResolved: 0
  });

  const [hardware, setHardware] = useState({
    memoryUsed: 0,
    memoryMax: 0,
    cpuUsage: 0
  });

  /**
   * Fetches actuator metrics from the backend.
   * Handles individual API calls for each specific metric endpoint.
   */
  const fetchMetrics = async () => {
    try {
      // Helper function to safely fetch and parse a specific metric by name
      const getMetric = async (name) => {
        const response = await fetch(`/actuator/metrics/${name}`);
        if (!response.ok) return null;
        return await response.json();
      };

      const batchTime = await getMetric('vitalsim.readings.batch.save.time');
      const triggered = await getMetric('vitalsim.alerts.triggered');
      const resolved = await getMetric('vitalsim.alerts.resolved');
      
      const memUsed = await getMetric('jvm.memory.used');
      const memMax = await getMetric('jvm.memory.max');
      const cpu = await getMetric('process.cpu.usage');

      setMetrics({
        batchTimeMax: batchTime ? batchTime.measurements.find(m => m.statistic === 'MAX')?.value * 1000 : 0,
        batchCount: batchTime ? batchTime.measurements.find(m => m.statistic === 'COUNT')?.value : 0,
        alertsTriggered: triggered ? triggered.measurements.find(m => m.statistic === 'COUNT')?.value : 0,
        alertsResolved: resolved ? resolved.measurements.find(m => m.statistic === 'COUNT')?.value : 0,
      });

      setHardware({
        memoryUsed: memUsed ? memUsed.measurements.find(m => m.statistic === 'VALUE')?.value : 0,
        memoryMax: memMax ? memMax.measurements.find(m => m.statistic === 'VALUE')?.value : 0,
        cpuUsage: cpu ? cpu.measurements.find(m => m.statistic === 'VALUE')?.value * 100 : 0
      });

    } catch (e) {
      console.error("Failed to fetch metrics", e);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000); // 3 seconds refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      <h2 className="text-3xl font-bold font-headline-lg text-cyan-400 uppercase tracking-wider mb-8 drop-shadow-[0_0_8px_rgba(0,229,255,0.6)] text-center">
        {t('systemMetrics.title')}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <div className="dark-card border border-cyan-500/30 flex flex-col items-center justify-center p-8 rounded-xl bg-gray-800/80 shadow-[0_0_15px_rgba(0,229,255,0.1)] transition-transform hover:scale-105">
          <span className="material-symbols-outlined text-5xl text-cyan-400 mb-2">memory</span>
          <h3 className="text-gray-400 uppercase tracking-widest text-sm mb-4">{t('systemMetrics.maxDelay')}</h3>
          <p className="text-6xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {metrics.batchTimeMax.toFixed(1)} <span className="text-2xl text-cyan-500">ms</span>
          </p>
          <p className="text-gray-500 mt-2 text-sm">{t('systemMetrics.totalBatches')} {metrics.batchCount}</p>
        </div>

        <div className="dark-card border border-red-500/30 flex flex-col items-center justify-center p-8 rounded-xl bg-gray-800/80 shadow-[0_0_15px_rgba(255,0,0,0.1)] transition-transform hover:scale-105">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-2">warning</span>
          <h3 className="text-gray-400 uppercase tracking-widest text-sm mb-4">{t('systemMetrics.alertsTriggered')}</h3>
          <p className="text-6xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {metrics.alertsTriggered}
          </p>
        </div>

        <div className="dark-card border border-green-500/30 flex flex-col items-center justify-center p-8 rounded-xl bg-gray-800/80 shadow-[0_0_15px_rgba(0,255,0,0.1)] transition-transform hover:scale-105">
          <span className="material-symbols-outlined text-5xl text-green-400 mb-2">check_circle</span>
          <h3 className="text-gray-400 uppercase tracking-widest text-sm mb-4">{t('systemMetrics.alertsResolved')}</h3>
          <p className="text-6xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {metrics.alertsResolved}
          </p>
        </div>

        <div className="dark-card border border-indigo-500/30 flex flex-col items-center justify-center p-8 rounded-xl bg-gray-800/80 shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-transform hover:scale-105">
          <span className="material-symbols-outlined text-5xl text-indigo-400 mb-2">speed</span>
          <h3 className="text-gray-400 uppercase tracking-widest text-sm mb-4">{t('systemMetrics.ruleProcessing')}</h3>
          <p className="text-xl font-bold text-indigo-300">
            {metrics.alertsTriggered === 0 && metrics.batchCount === 0 ? t('systemMetrics.idle') : t('systemMetrics.running')}
          </p>
          <p className="text-gray-500 mt-2 text-xs text-center">{t('systemMetrics.ruleEvalDesc')}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-300 uppercase tracking-widest mt-12 mb-6 w-full max-w-4xl text-left border-b border-gray-700 pb-2">
        {t('systemMetrics.hardwareIndicators')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl mb-12">
        {/* Memory */}
        <div className="dark-card border border-yellow-500/30 flex flex-col items-center justify-center p-8 rounded-xl bg-gray-800/80 shadow-[0_0_15px_rgba(234,179,8,0.1)] transition-transform hover:scale-105">
           <span className="material-symbols-outlined text-4xl text-yellow-400 mb-2">storage</span>
           <h3 className="text-gray-400 uppercase tracking-widest text-sm mb-4">{t('systemMetrics.jvmMemory')}</h3>
           <div className="w-full bg-gray-700 rounded-full h-4 mb-2 overflow-hidden border border-gray-600">
             <div className="bg-gradient-to-r from-yellow-500 to-red-500 h-4 rounded-full transition-all duration-1000" style={{ width: `${hardware.memoryMax > 0 ? Math.min((hardware.memoryUsed / hardware.memoryMax) * 100, 100) : 0}%` }}></div>
           </div>
           <p className="text-gray-300 font-bold mt-2 text-xl">
             {(hardware.memoryUsed / 1024 / 1024).toFixed(0)} MB <span className="text-gray-500 text-sm font-normal">/ {(hardware.memoryMax / 1024 / 1024).toFixed(0)} MB</span>
           </p>
           <p className="text-gray-500 text-xs mt-2 text-center">{t('systemMetrics.jvmDesc')}</p>
        </div>

        {/* CPU */}
        <div className="dark-card border border-orange-500/30 flex flex-col items-center justify-center p-8 rounded-xl bg-gray-800/80 shadow-[0_0_15px_rgba(249,115,22,0.1)] transition-transform hover:scale-105">
           <span className="material-symbols-outlined text-4xl text-orange-400 mb-2">developer_board</span>
           <h3 className="text-gray-400 uppercase tracking-widest text-sm mb-4">{t('systemMetrics.cpuUsage')}</h3>
           <p className="text-5xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
             {hardware.cpuUsage.toFixed(1)} <span className="text-xl text-orange-500">%</span>
           </p>
           <p className="text-gray-500 text-xs mt-4 text-center">{t('systemMetrics.cpuDesc')}</p>
        </div>
      </div>
    </div>
  );
}
