/**
 * Creates the controls slice for the Zustand store.
 * Manages the timeline playback (play, pause, seek) and computes 
 * organ health statuses based on the current time index.
 * 
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 */
export const createControlsSlice = (set, get) => ({
  // ============================================================================
  // REGION 1: TIMELINE MANIPULATION & STATUS COMPUTATION
  // ============================================================================
  
  /**
   * Sets the current time index (e.g. when scrubbing the timeline).
   * Automatically updates vital signs to match the frame at the given index
   * and recalculates the status of all organs based on alerts up to that point.
   * 
   * @param {number} index - The target frame index in the history array
   */
  setCurrentTimeIndex: (index) => {
    const history = get().biogearsHistory;
    if (history && history.length > 0 && index >= 0 && index < history.length) {
      const frame = history[index];
      const hr = frame.readings["HeartRate"] || frame.readings["HR"];
      const spo2 = frame.readings["OxygenSaturation"] || frame.readings["SpO2"];
      const sys =
        frame.readings["SystolicArterialPressure"] ||
        frame.readings["ArterialPressure_Systolic"] ||
        frame.readings["SBP"];
      let dia =
        frame.readings["DiastolicArterialPressure"] ||
        frame.readings["ArterialPressure_Diastolic"] ||
        frame.readings["DBP"];

      if (
        (dia === undefined || dia === null) &&
        sys !== undefined &&
        sys !== null
      ) {
        const map =
          frame.readings["MeanArterialPressure"] || frame.readings["MAP"];
        if (map !== undefined && map !== null) {
          dia = (3 * map - sys) / 2;
        }
      }

      set({
        currentTimeIndex: index,
        heartRate:
          hr !== undefined && hr !== null ? Math.round(hr) : get().heartRate,
        spo2:
          spo2 !== undefined && spo2 !== null
            ? spo2 < 1
              ? Math.round(spo2 * 100)
              : Math.round(spo2)
            : get().spo2,
        sysBP:
          sys !== undefined && sys !== null ? Math.round(sys) : get().sysBP,
        diaBP:
          dia !== undefined && dia !== null ? Math.round(dia) : get().diaBP,
      });
    } else {
      set({ currentTimeIndex: index });
    }

    // Recompute organ statuses based on alerts up to this index
    const allAlerts = get().alerts;
    let newHeartStatus = {};
    let newBPStatus = {};
    let newLungsStatus = {};
    let newBrainStatus = {};
    let newKidneyStatus = {};

    for (let i = allAlerts.length - 1; i >= 0; i--) {
      const a = allAlerts[i];
      if (a.simulationIndex > index) continue;

      const systemName = a.systemName || "";
      const severity = a.severity?.toLowerCase() || (a.rule?.severity?.toLowerCase()) || "";
      const alertStatus = a.status?.toUpperCase() || "";

      let uiStatus = "warning";
      if (alertStatus === "RESOLVIDO" || alertStatus === "RESOLVED" || severity === "normal" || severity === "resolvido") {
        uiStatus = "normal";
      } else if (severity === "critico" || severity === "critical") {
        uiStatus = "critical";
      }

      const ruleId = a.ruleId || a.id || Math.random();
      const ruleName = (a.ruleName || "").toLowerCase();
      
      const isCardio = systemName.includes("Cardio");
      const isResp = systemName.includes("Respir");
      const isNeuro = systemName.includes("Neuro");
      const isRenal = systemName.includes("Renal");

      if (isCardio) {
        const isHeartRateRule = ruleName.includes("taquicardia") || ruleName.includes("bradicardia") || ruleName.includes("heart") || ruleName.includes("cardíaca");
        const isBPRule = ruleName.includes("hipertensão") || ruleName.includes("hipotensão") || ruleName.includes("pressure") || ruleName.includes("pressão");
        
        if (isHeartRateRule) {
          if (uiStatus === "normal") { delete newHeartStatus[ruleId]; }
          else { newHeartStatus[ruleId] = uiStatus; }
        }
        if (isBPRule) {
          if (uiStatus === "normal") { delete newBPStatus[ruleId]; }
          else { newBPStatus[ruleId] = uiStatus; }
        }
        
        // Se a regra for genérica e não tiver palavras-chave, aplica a ambos como fallback
        if (!isHeartRateRule && !isBPRule) {
          if (uiStatus === "normal") { delete newHeartStatus[ruleId]; delete newBPStatus[ruleId]; }
          else { newHeartStatus[ruleId] = uiStatus; newBPStatus[ruleId] = uiStatus; }
        }
      }
      if (isResp) {
        if (uiStatus === "normal") { delete newLungsStatus[ruleId]; }
        else { newLungsStatus[ruleId] = uiStatus; }
      }
      if (isNeuro) {
        if (uiStatus === "normal") { delete newBrainStatus[ruleId]; }
        else { newBrainStatus[ruleId] = uiStatus; }
      }
      if (isRenal) {
        if (uiStatus === "normal") { delete newKidneyStatus[ruleId]; }
        else { newKidneyStatus[ruleId] = uiStatus; }
      }
    }

    set({
      heartStatus: newHeartStatus,
      bpStatus: newBPStatus,
      lungsStatus: newLungsStatus,
      brainStatus: newBrainStatus,
      kidneyStatus: newKidneyStatus,
    });

    if (get().isPlaying && !get().isLive) {
      set({ lastPlayTime: Date.now(), lastPlayIndex: index });
    }
  },

  // ============================================================================
  // REGION 2: PLAYBACK CONTROLS
  // ============================================================================

  /**
   * Starts or resumes the timeline playback from the current index.
   */
  playBiogears: () => {
    set({ isPlaying: true, lastPlayTime: Date.now(), lastPlayIndex: get().currentTimeIndex });
  },

  /**
   * Pauses the timeline playback.
   */
  pauseBiogears: () => {
    set({ isPlaying: false, isLive: false });
  },

  /**
   * Jumps the timeline to the most recent live data frame.
   * Used when the user was scrubbing past data but wants to return to "Now".
   */
  jumpToLive: () => {
    const state = get();
    if (!state.biogearsHistory || state.biogearsHistory.length === 0) return;

    // In a Live JSON scenario
    if (state.activeSimulationId) {
      set({
        isAutoScrolling: true,
        currentTimeIndex: state.biogearsHistory.length - 1
      });
    } else {
      // In a Real-Time CSV scenario
      set({
        isLive: true,
        isPlaying: true, // Auto-play when jumping to live
        currentTimeIndex: state.csvLiveIndex
      });
    }
  }
});
