import { useState, useEffect } from "react";
import useSimulationStore from "../../store/useSimulationStore";
import { definitionsService } from "../../api/definitionsService";
import { useTranslation } from "react-i18next";

// Import UI Components
import HumanBodySVG from "./components/HumanBodySVG";
import ControlPanel from "./components/ControlPanel";
import VitalSignsPanel from "./components/VitalSignsPanel";
import AlertsFeed from "./components/AlertsFeed";
import SimulationTimeline from "./components/SimulationTimeline";

/**
 * Dashboard Page Component
 * 
 * The main interface of the application. Orchestrates the layout of the 
 * Control Panel, Human Body visualization, Vital Signs, and the Alerts Feed.
 * It connects to the Zustand store to resume active simulations on mount.
 */
export default function Dashboard() {
  const { t } = useTranslation();
  const { activeSimulationId, completedSimulationId, simState, biogearsHistory, stopSimulation, checkAndResumeSimulation, joinedExternally } =
    useSimulationStore();

  useEffect(() => {
    if (checkAndResumeSimulation) {
      checkAndResumeSimulation();
    }
  }, [checkAndResumeSimulation]);

  // State for caching the uploaded scenario ID (so we don't re-upload the exact same JSON)
  const [uploadedScenario, setUploadedScenario] = useState({
    file: null,
    id: null,
  });

  const [isHumanBodyEnabled, setIsHumanBodyEnabled] = useState(true);

  // Check backend settings to see if the Human Body SVG should be rendered
  useEffect(() => {
    definitionsService
      .getDefinitions()
      .then((res) => {
        if (res) {
          setIsHumanBodyEnabled(res.isHumanBodyEnabled !== false);
        }
      })
      .catch((err) => console.error("Error fetching definitions", err));
  }, []);

  return (
    <div className="w-full bg-[#080e1a] text-white p-6 rounded-xl flex flex-col lg:h-[calc(100vh-6rem)] min-h-[700px]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 h-full min-h-0">
        {/* LEFT COLUMN: Controls & Vitals */}
        <div
          className={`col-span-1 flex flex-col gap-3 bg-[#0f172a]/50 border border-white/5 rounded-xl p-3 backdrop-blur-sm min-h-0 overflow-hidden ${isHumanBodyEnabled ? "lg:col-span-3" : "lg:col-span-6"}`}
        >
          <ControlPanel
            uploadedScenario={uploadedScenario}
            setUploadedScenario={setUploadedScenario}
          />

          {/* MOBILE ONLY: Human Body SVG right after the button */}
          {isHumanBodyEnabled && (
            <div className="lg:hidden flex items-center justify-center bg-[#080e1a] border border-white/5 rounded-xl relative overflow-hidden shadow-2xl min-h-[350px] mt-2 mb-2">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(25,36,54,0.4)_0%,transparent_70%)]"></div>
              <div className="relative w-full h-full p-2 flex items-center justify-center z-10">
                <HumanBodySVG />
              </div>
            </div>
          )}

          <VitalSignsPanel />
        </div>

        {/* CENTER COLUMN: Human Body SVG (DESKTOP ONLY) */}
        {isHumanBodyEnabled && (
          <div className="hidden lg:flex col-span-1 lg:col-span-6 items-center justify-center bg-[#080e1a] border border-white/5 rounded-xl relative overflow-hidden shadow-2xl min-h-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(25,36,54,0.4)_0%,transparent_70%)]"></div>
            <div className="relative w-full h-full p-4 flex items-center justify-center z-10">
              <HumanBodySVG />
            </div>
            <div className="absolute inset-0 pointer-events-none border border-white/5 m-2 rounded-lg opacity-10 z-20"></div>
          </div>
        )}

        {/* RIGHT COLUMN: Alerts Feed */}
        <div
          className={`col-span-1 flex flex-col bg-[#0f172a]/50 border border-white/5 rounded-xl p-4 backdrop-blur-sm h-[400px] lg:h-[600px] lg:max-h-[calc(100vh-10rem)] ${isHumanBodyEnabled ? "lg:col-span-3" : "lg:col-span-6"}`}
        >
          <div className="flex items-center justify-between pb-4 mb-2 border-b border-white/5">
            <h2 className="text-xs font-bold text-slate-300 tracking-widest uppercase flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400 text-lg">
                notifications_active
              </span>
              {t("dashboard.eventLog")}
            </h2>
          </div>
          <AlertsFeed />
        </div>

        {/* BOTTOM FULL WIDTH: Timeline Player for BioGears */}
        <SimulationTimeline />
        
        {/* IOT WAITING OVERLAY */}
        {simState === "RUNNING" && activeSimulationId && joinedExternally && (!biogearsHistory || biogearsHistory.length === 0) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#080e1a]/80 backdrop-blur-md rounded-xl">
            <div className="bg-[#0f172a] border border-cyan-500/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center max-w-2xl text-center">
              <span className="material-symbols-outlined text-cyan-400 text-6xl mb-4 animate-pulse">
                cell_tower
              </span>
              <h2 className="text-2xl font-bold text-white mb-2">{t("dashboard.iot.waitingTitle")}</h2>
              <p className="text-slate-400 mb-6 max-w-lg">
                {t("dashboard.iot.waitingDescription")}
              </p>
              
              <div className="w-full bg-black/40 border border-white/10 rounded-lg p-4 mb-6 relative group">
                <span className="absolute -top-3 left-4 bg-[#0f172a] px-2 text-xs font-bold text-cyan-500 tracking-widest uppercase">
                  Simulation ID
                </span>
                <code className="text-emerald-400 font-mono text-sm break-all select-all block mt-2">
                  {activeSimulationId}
                </code>
                <button 
                  onClick={() => navigator.clipboard.writeText(activeSimulationId)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                  title={t("dashboard.iot.copyId")}
                >
                  <span className="material-symbols-outlined text-lg">content_copy</span>
                </button>
              </div>
              
              <p className="text-xs text-slate-500 italic">
                {t("dashboard.iot.autoStartHint")}
              </p>
              
              <button
                onClick={() => {
                  stopSimulation();
                  setUploadedScenario({ file: null, id: null });
                }}
                className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-bold uppercase tracking-wider border border-white/10"
              >
                {t("dashboard.iot.cancelSession")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
