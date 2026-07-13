/**
 * Creates the core slice for the Zustand store.
 * This slice holds the central state of the simulation engine, including UI flags,
 * current vital signs, timeline history, and global active simulation identifiers.
 * 
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 */
export const createCoreSlice = (set, get) => ({
  // ============================================================================
  // REGION 1: CORE STATE
  // ============================================================================
  simState: "STOPPED", // 'STOPPED', 'READY', 'RUNNING', 'PAUSED'
  activeSimulationId: null,
  completedSimulationId: null,
  uploadedScenarioId: null,
  isUploading: false,
  isConnecting: false, // Blocks double clicks during transitions (Start/Live)
  alerts: [],
  pendingWebSocketAlerts: [],

  hasGeneratedPdf: false,
  joinedExternally: false,
  isSpectator: false,

  // Vitals State (Map of ruleId -> severity to support concurrent rules per organ)
  heartStatus: {},
  lungsStatus: {},
  bpStatus: {},
  brainStatus: {},
  kidneyStatus: {},
  heartRate: "--",
  spo2: "--",
  sysBP: "--",
  diaBP: "--",

  // BioGears History (Timeline) State
  biogearsHistory: [],
  currentTimeIndex: 0,
  csvLiveIndex: 0, // Where the patient is "live" in the real world
  simulationStartTime: null, // When START was pressed
  activeSimulationStartTime: null,
  sessionJoinTime: null,
  simStartedAt: null,
  lastPlayTime: null,
  lastPlayIndex: 0,
  isPlaying: false,
  isLive: false, // If true, the screen is locked to csvLiveIndex
  isAutoScrolling: true, // For JSON DVR Mode Live

  // ============================================================================
  // REGION 2: STATE RESET & CLEANUP
  // ============================================================================
  
  /**
   * Resets only the visual and playback state.
   * Useful when transitioning between scenarios or starting a new session
   * without losing the global application state.
   */
  resetVisualState: () => {
    // 1. Clear timers and WebSockets to prevent race conditions
    if (get().clearPlaybackIntervals) get().clearPlaybackIntervals();
    if (get().disconnectWebSocket) get().disconnectWebSocket();
    if (get().pauseBiogears) get().pauseBiogears();
    
    // 2. Clear UI and Vital Signs
    set({
      biogearsHistory: [],
      alerts: [],
      heartRate: "--",
      spo2: "--",
      sysBP: "--",
      diaBP: "--",
      currentTimeIndex: 0,
      heartStatus: {},
      lungsStatus: {},
      bpStatus: {},
      brainStatus: {},
      kidneyStatus: {},
      pendingWebSocketAlerts: [],
      joinedExternally: false,
      isSpectator: false,
      isLive: false,
      isPlaying: false,
    });
  },

  /**
   * Performs a hard reset of the simulation engine.
   * Stops all recorders, disconnects WebSockets, and purges all local data.
   */
  clearSimulation: () => {
    // Stop any active recording to avoid garbage data
    if (get().clearPlaybackIntervals) get().clearPlaybackIntervals();
    if (get().disconnectWebSocket) get().disconnectWebSocket();

    set({
      simState: "IDLE",
      activeSimulationId: null,
      completedSimulationId: null,
      uploadedScenarioId: null,
      simulationStartTime: null,
      joinedExternally: false,
      isSpectator: false,
      hasGeneratedPdf: false,
      biogearsHistory: [],
      alerts: [],
      heartStatus: {},
      bpStatus: {},
      lungsStatus: {},
      brainStatus: {},
      kidneyStatus: {},
      heartRate: "--",
      spo2: "--",
      sysBP: "--",
      diaBP: "--",
      currentTimeIndex: 0,
      csvLiveIndex: 0,
      isPlaying: false,
      isLive: false,
      isAutoScrolling: false
    });
  },
});
