import { fetchClient } from "../../api/fetchClient";
import i18n from "../../i18n";
import { useAuthStore } from "../useAuthStore";

let playbackInterval = null;

/**
 * Creates the orchestration slice for the Zustand store.
 * @param {Function} set - Zustand's set function to update the store state.
 * @param {Function} get - Zustand's get function to read the current store state.
 * @returns {Object} The orchestration actions and state.
 */
export const createOrchestrationSlice = (set, get) => ({
  // ============================================================================
  // REGION 1: UTILITIES
  // ============================================================================
  
  /**
   * Clears any active simulated playback intervals.
   * Ensures no memory leaks or phantom intervals continue executing.
   */
  clearPlaybackIntervals: () => {
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
  },

  // ============================================================================
  // REGION 2: SCENARIO IMPORT & INITIALIZATION
  // ============================================================================

  /**
   * Imports a new simulation scenario via a JSON file.
   * Uploads the file to the backend and prepares the state to be RUNNING.
   * @async
   * @param {File} file - The file blob to be uploaded.
   * @returns {Promise<void>}
   */
  importSimulation: async (file) => {
    const s = get();
    if (!file) {
      set({
        alerts: [
          {
            timestamp: Date.now(),
            simulationIndex: s.currentTimeIndex,
            rule: { severity: "INFO" },
            valueAtTrigger: i18n.t('dashboard.alerts.selectFileFirst'),
          },
          ...get().alerts,
        ],
      });
      return;
    }

    if (get().resetVisualState) get().resetVisualState();

    set({
      isUploading: true,
      isConnecting: true,
      alerts: [
        {
          timestamp: Date.now(),
          simulationIndex: s.currentTimeIndex,
          rule: { severity: "INFO" },
          valueAtTrigger: i18n.t('dashboard.alerts.importStarted', { file: file.name }),
        }
      ],
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      const scenarioData = await fetchClient.upload(
        "/clinical-scenarios/upload",
        formData,
      );
      const scenarioId = scenarioData.id;

      set((s) => ({
        uploadedScenarioId: scenarioId,
        isUploading: false,
        simState: "READY",
        alerts: [
          {
            timestamp: Date.now(),
            simulationIndex: 0,
            rule: { severity: "SUCCESS" },
            valueAtTrigger: i18n.t('dashboard.alerts.scenarioReady'),
          },
          ...s.alerts,
        ],
      }));
    } catch (error) {
      console.error(error);
      set((s) => ({
        isUploading: false,
        alerts: [
          {
            timestamp: Date.now(),
            simulationIndex: s.currentTimeIndex,
            rule: { severity: "CRITICO" },
            valueAtTrigger: i18n.t('dashboard.alerts.jsonError'),
          },
          ...s.alerts,
        ],
      }));
    } finally {
      set({ isConnecting: false });
    }
  },

  // ============================================================================
  // REGION 3: PLAYBACK & LIVE RECORDER CONTROLS
  // ============================================================================

  /**
   * Starts a simulation. 
   * If there's already a loaded history (biogearsHistory), it starts local playback via intervals.
   * If it's a new JSON scenario, it calls the backend API to start it, connects WebSockets,
   * and starts a "Live Recorder" interval to append data frames as they arrive.
   */
  startSimulation: async () => {
    console.log('START button clicked, state:', get().simState);
    const state = get();
    console.log('Current store snapshot before start:', state);
    if (state.simState === "RUNNING") return;

    if (state.biogearsHistory && state.biogearsHistory.length > 0) {
      set((s) => ({
        simState: 'RUNNING',
        simulationStartTime: Date.now(),
        isLive: true,
        isPlaying: true,
        lastPlayTime: Date.now(),
        lastPlayIndex: s.currentTimeIndex
      }));

      get().clearPlaybackIntervals();

      playbackInterval = setInterval(() => {
        const s = get();
        if (s.simState !== 'RUNNING' && s.simState !== 'PAUSED') {
          get().clearPlaybackIntervals();
          return;
        }

        let newLiveIndex = Math.floor((Date.now() - s.simulationStartTime) / 20);
        let reachedEnd = false;

        if (newLiveIndex >= s.biogearsHistory.length - 1) {
          newLiveIndex = s.biogearsHistory.length - 1;
          reachedEnd = true;
        }

        let nextIdx = s.currentTimeIndex;

        if (s.isLive) {
          nextIdx = newLiveIndex;
          if (reachedEnd) {
            if (get().pauseBiogears) get().pauseBiogears();
            return;
          }
        } else if (s.isPlaying && s.lastPlayTime) {
          let framesPassed = Math.floor((Date.now() - s.lastPlayTime) / 20);
          nextIdx = s.lastPlayIndex + framesPassed;

          if (nextIdx >= s.biogearsHistory.length - 1) {
            nextIdx = s.biogearsHistory.length - 1;
            if (get().pauseBiogears) get().pauseBiogears();
            return;
          }
        }

        if (nextIdx !== s.currentTimeIndex) {
          if (get().setCurrentTimeIndex) get().setCurrentTimeIndex(nextIdx);
        }

        set({ csvLiveIndex: newLiveIndex });

      }, 16);

      return;
    }

    if (!state.uploadedScenarioId) {
      set({
        alerts: [
          {
            timestamp: Date.now(),
            simulationIndex: state.currentTimeIndex,
            rule: { severity: "INFO" },
            valueAtTrigger: i18n.t('dashboard.alerts.importFirst'),
          },
          ...state.alerts,
        ],
      });
      return;
    }

    if (get().resetVisualState) get().resetVisualState();
    set({ isConnecting: true });

    try {
      const simResp = await fetchClient.post("/simulations/start", {
        scenarioId: state.uploadedScenarioId,
      });
      const realSimulationId = simResp.id;

      set((s) => ({
        activeSimulationId: realSimulationId,
        activeSimulationStartTime: simResp.startedAt,
        simState: "RUNNING",
        isAutoScrolling: true
      }));

      if (get().connectWebSocket) get().connectWebSocket(realSimulationId);

      if (window.liveRecorderInterval)
        clearInterval(window.liveRecorderInterval);
      window.liveRecorderInterval = setInterval(() => {
        const state = get();
        if (state.simState === "STOPPED") {
          clearInterval(window.liveRecorderInterval);
          return;
        }

        // Block recording of empty frames if the IoT machine hasn't connected yet
        if (state.heartRate === "--" && (!state.biogearsHistory || state.biogearsHistory.length === 0)) {
          return; // Keep biogearsHistory empty to show the modal
        }

        const newFrame = {
          timestamp: state.biogearsHistory.length,
          readings: {
            HeartRate: state.heartRate === "--" ? 0 : state.heartRate,
            SpO2: state.spo2 === "--" ? 0 : state.spo2,
            SystolicArterialPressure: state.sysBP === "--" ? 0 : state.sysBP,
            DiastolicArterialPressure: state.diaBP === "--" ? 0 : state.diaBP,
          },
        };

        set((s) => {
          const updatedHistory = [...s.biogearsHistory, newFrame];
          const nextIdx =
            s.simState === "RUNNING" && s.isAutoScrolling
              ? updatedHistory.length - 1
              : s.currentTimeIndex;

          return {
            biogearsHistory: updatedHistory,
            currentTimeIndex: nextIdx,
          };
        });
      }, 1000);
    } catch (error) {
      console.error(error);
      set((s) => ({
        simState: "STOPPED",
        alerts: [
          {
            timestamp: Date.now(),
            simulationIndex: s.currentTimeIndex,
            rule: { severity: "CRITICO" },
            valueAtTrigger: i18n.t('dashboard.alerts.serverError'),
          },
          ...s.alerts,
        ],
      }));
    } finally {
      set({ isConnecting: false });
    }
  },

  /**
   * Checks if there's any active simulation on the backend (e.g., after a page refresh).
   * If found, it automatically reconnects the WebSocket and resumes the Live Recorder.
   */
  checkAndResumeSimulation: async () => {
    try {
      const state = get();
      if (state.activeSimulationId) return;
      if (state.biogearsHistory && state.biogearsHistory.length > 0) return;

      const simsRes = await fetchClient.get("/simulations/active");
      const runningSim = Array.isArray(simsRes) ? simsRes.find(s => 
          (s.status === 'EM_CURSO' || s.status === 'INICIADA') && 
          s.id !== state.completedSimulationId &&
          s.scenarioName === 'Livestream'
      ) : null;
      
      if (runningSim) {
        const isLive = runningSim.scenarioName === "Livestream";
        const isOwner = localStorage.getItem("ownedSimulationId") === runningSim.id;
        
        set({
          activeSimulationId: runningSim.id,
          simState: "RUNNING",
          simulationStartTime: runningSim.startedAt ? new Date(runningSim.startedAt).getTime() : Date.now(),
          joinedExternally: isLive,
          isSpectator: !isOwner
        });
        if (get().connectWebSocket) {
          get().connectWebSocket(runningSim.id);
        }

        if (isLive) {
          if (window.liveRecorderInterval) clearInterval(window.liveRecorderInterval);
          window.liveRecorderInterval = setInterval(() => {
            const state = get();
            if (state.simState === "STOPPED") {
              clearInterval(window.liveRecorderInterval);
              return;
            }

            if (state.heartRate === "--" && (!state.biogearsHistory || state.biogearsHistory.length === 0)) {
              return;
            }

            const newFrame = {
              timestamp: state.biogearsHistory ? state.biogearsHistory.length : 0,
              readings: {
                HeartRate: state.heartRate === "--" ? 0 : state.heartRate,
                SpO2: state.spo2 === "--" ? 0 : state.spo2,
                SystolicArterialPressure: state.sysBP === "--" ? 0 : state.sysBP,
                DiastolicArterialPressure: state.diaBP === "--" ? 0 : state.diaBP,
              },
            };

            set((s) => {
              const currentHistory = s.biogearsHistory || [];
              const updatedHistory = [...currentHistory, newFrame];
              const nextIdx = s.simState === "RUNNING" && s.isAutoScrolling
                  ? updatedHistory.length - 1
                  : s.currentTimeIndex;

              return {
                biogearsHistory: updatedHistory,
                currentTimeIndex: nextIdx,
              };
            });
          }, 1000);
        }
      }
    } catch (err) {
      console.error("Failed to check for active simulations:", err);
    }
  },

  /**
   * Joins an active simulation manually (the "LIVE" button).
   * If no simulation is active, it creates a fallback "Livestream" session 
   * specifically for external IoT injection and starts listening.
   */
  joinActiveSimulation: async () => {
    if (get().resetVisualState) get().resetVisualState();
    set({ isConnecting: true });

    try {
      const simsRes = await fetchClient.get("/simulations/active");
      const runningSim = Array.isArray(simsRes) ? simsRes.find(s => s.status === 'EM_CURSO' || s.status === 'INICIADA') : null;

      if (!runningSim) {
        // Intelligent IoT Logic: Instead of failing, create a clean Livestream and start!
        try {
          const scenariosRes = await fetchClient.get("/clinical-scenarios");
          let livestreamScenario = scenariosRes.find(s => s.name === "Livestream");

          if (!livestreamScenario) {
            const dummyScenario = {
              name: "Livestream",
              description: "Cenário genérico criado automaticamente para injeção de dados em tempo real via IoT.",
              metrics: [],
            };
            const jsonBlob = new Blob([JSON.stringify(dummyScenario)], { type: "application/json" });
            const jsonFile = new File([jsonBlob], "livestream.json", { type: "application/json" });
            const formData = new FormData();
            formData.append("file", jsonFile);
            
            livestreamScenario = await fetchClient.upload("/clinical-scenarios/upload", formData);
          }

          const simResp = await fetchClient.post("/simulations/start", { scenarioId: livestreamScenario.id });
          const newSimId = simResp.id;
          
          // Store the ownership in this specific browser to prevent other PCs with the same login from stopping it
          localStorage.setItem("ownedSimulationId", newSimId);

          set((s) => ({
            activeSimulationId: newSimId,
            activeSimulationStartTime: simResp.startedAt,
            simState: "RUNNING",
            isAutoScrolling: true,
            biogearsHistory: [],
            uploadedScenarioId: livestreamScenario.id, // Helps in the final report
            joinedExternally: true, // FLAG NEEDED TO SHOW LOCAL TIME!
            isSpectator: false, // We created this livestream, so we are not a spectator!
            alerts: [
              {
                timestamp: Date.now(),
                simulationIndex: s.currentTimeIndex,
                rule: { severity: "INFO" },
                valueAtTrigger: i18n.t('dashboard.alerts.liveStarted'),
              },
              ...s.alerts,
            ],
          }));

          if (get().connectWebSocket) get().connectWebSocket(newSimId);

          if (window.liveRecorderInterval) clearInterval(window.liveRecorderInterval);
          window.liveRecorderInterval = setInterval(() => {
            const state = get();
            if (state.simState === "STOPPED") {
              clearInterval(window.liveRecorderInterval);
              return;
            }

            if (state.heartRate === "--" && (!state.biogearsHistory || state.biogearsHistory.length === 0)) {
              return; 
            }

            const newFrame = {
              timestamp: state.biogearsHistory.length,
              readings: {
                HeartRate: state.heartRate === "--" ? 0 : state.heartRate,
                SpO2: state.spo2 === "--" ? 0 : state.spo2,
                SystolicArterialPressure: state.sysBP === "--" ? 0 : state.sysBP,
                DiastolicArterialPressure: state.diaBP === "--" ? 0 : state.diaBP,
              },
            };

            set((s) => {
              const updatedHistory = [...s.biogearsHistory, newFrame];
              const nextIdx = s.simState === "RUNNING" && s.isAutoScrolling ? updatedHistory.length - 1 : s.currentTimeIndex;
              return { biogearsHistory: updatedHistory, currentTimeIndex: nextIdx };
            });
          }, 1000);

          return; // Finish here because a new simulation was successfully created.

        } catch (autoCreateErr) {
          console.error("Failed to auto-create Livestream simulation:", autoCreateErr);
          set((s) => ({
            alerts: [
              {
                timestamp: Date.now(),
                simulationIndex: s.currentTimeIndex,
                rule: { severity: "CRITICO" },
                valueAtTrigger: i18n.t('dashboard.alerts.liveFailed'),
              },
              ...s.alerts,
            ],
          }));
          set({ isConnecting: false });
          return;
        }
      }

      const realSimulationId = runningSim.id;

      let baseTimeMs = new Date(runningSim.startedAt).getTime();
      if (Array.isArray(runningSim.startedAt)) {
        const [year, month, day, hour, minute, second, nano] = runningSim.startedAt;
        baseTimeMs = new Date(year, month - 1, day, hour, minute, second, (nano || 0) / 1000000).getTime();
      }

      let history = [];
      let restoredAlerts = [];
      let lastHR = "--", lastSPO2 = "--", lastSys = "--", lastDia = "--";

      const sessionJoinTimeMs = Date.now();
      
      // We are only the owner if this exact browser created the simulation
      const isOwner = localStorage.getItem("ownedSimulationId") === realSimulationId;

      set((s) => ({
        activeSimulationId: realSimulationId,
        activeSimulationStartTime: sessionJoinTimeMs,
        sessionJoinTime: sessionJoinTimeMs,
        simStartedAt: baseTimeMs,
        simState: "RUNNING",
        isAutoScrolling: true,
        joinedExternally: true,
        isSpectator: !isOwner, // We are a spectator ONLY if we don't own this simulation!
        biogearsHistory: history,
        currentTimeIndex: history.length > 0 ? history.length - 1 : 0,
        heartRate: lastHR,
        spo2: lastSPO2,
        sysBP: lastSys,
        diaBP: lastDia,
        alerts: [
          {
            timestamp: Date.now(),
            simulationIndex: history.length > 0 ? history.length - 1 : 0,
            rule: { severity: "SUCCESS" },
            valueAtTrigger: i18n.t('dashboard.alerts.liveJoined', { name: runningSim.scenarioName || 'Stream Externo' }),
          },
          ...restoredAlerts,
          ...s.alerts,
        ],
      }));

      if (get().connectWebSocket) get().connectWebSocket(realSimulationId);

      if (window.liveRecorderInterval) clearInterval(window.liveRecorderInterval);
      window.liveRecorderInterval = setInterval(() => {
        const state = get();
        if (state.simState === "STOPPED") {
          clearInterval(window.liveRecorderInterval);
          return;
        }

        // Block recording of empty frames if the IoT machine hasn't connected yet
        if (state.heartRate === "--" && (!state.biogearsHistory || state.biogearsHistory.length === 0)) {
          return; // Keep biogearsHistory empty to show the modal
        }

        const newFrame = {
          timestamp: state.biogearsHistory.length,
          readings: {
            HeartRate: state.heartRate === "--" ? 0 : state.heartRate,
            SpO2: state.spo2 === "--" ? 0 : state.spo2,
            SystolicArterialPressure: state.sysBP === "--" ? 0 : state.sysBP,
            DiastolicArterialPressure: state.diaBP === "--" ? 0 : state.diaBP,
          },
        };

        set((s) => {
          const updatedHistory = [...s.biogearsHistory, newFrame];
          const nextIdx =
            s.simState === "RUNNING" && s.isAutoScrolling
              ? updatedHistory.length - 1
              : s.currentTimeIndex;

          return {
            biogearsHistory: updatedHistory,
            currentTimeIndex: nextIdx,
          };
        });
      }, 1000);
    } catch (error) {
      console.error(error);
      set((s) => ({
        simState: "STOPPED",
        alerts: [
          {
            timestamp: Date.now(),
            simulationIndex: s.currentTimeIndex,
            rule: { severity: "WARNING" },
            valueAtTrigger: i18n.t('dashboard.alerts.searchFailed'),
          },
          ...s.alerts,
        ],
      }));
    } finally {
      set({ isConnecting: false });
    }
  },

  // ============================================================================
  // REGION 4: PAUSE & STOP MECHANISMS
  // ============================================================================

  /**
   * Pauses the simulation. 
   * If it's a local playback, pauses the internal clock. 
   * If it's live, stops auto-scrolling the timeline.
   */
  pauseSimulation: async () => {
    const state = get();

    if (state.biogearsHistory && state.biogearsHistory.length > 0) {
      if (state.isPlaying) {
        if (get().pauseBiogears) get().pauseBiogears();
        set((s) => ({
          simState: "PAUSED"
        }));
      } else {
        if (get().playBiogears) get().playBiogears();
        set((s) => ({
          simState: "RUNNING"
        }));
      }
      return;
    }

    if (state.simState === "STOPPED") return;

    if (state.simState === "RUNNING") {
      set((s) => ({
        simState: "PAUSED",
        isAutoScrolling: false
      }));
    } else {
      set((s) => ({
        simState: "RUNNING",
        isAutoScrolling: false
      }));
    }
  },

  /**
   * Stops the current simulation and generates the final PDF report.
   * Disconnects WebSockets and notifies the backend that the session ended.
   * 
   * @param {boolean} skipBackend - If true, skips the /stop API call.
   */
  stopSimulation: (skipBackend = false) => {
    const state = get();
    if (
      state.simState === "STOPPED" &&
      (!state.biogearsHistory || state.biogearsHistory.length === 0)
    )
      return;

    const targetSimId = state.activeSimulationId || state.completedSimulationId;
    let cutOffSeconds = state.biogearsHistory && state.biogearsHistory[state.currentTimeIndex] ? state.biogearsHistory[state.currentTimeIndex].timestamp : state.currentTimeIndex;

    if (state.joinedExternally) {
      cutOffSeconds = null;
    }

    get().clearPlaybackIntervals();
    if (get().disconnectWebSocket) get().disconnectWebSocket();
    if (get().pauseBiogears) get().pauseBiogears();

    set((s) => {
      const newAlerts = [
        {
          timestamp: Date.now(),
          simulationIndex: s.currentTimeIndex,
          rule: { severity: "SUCCESS" },
          ruleName: i18n.t('history.events.finished'),
          formattedValue: s.joinedExternally ? i18n.t('dashboard.alerts.liveEnded') : i18n.t('dashboard.alerts.sessionRecorded'),
          link: targetSimId ? `/historico?simId=${targetSimId}` : null
        },
        ...s.alerts,
      ];

      return {
        simState: "STOPPED",
        completedSimulationId: s.activeSimulationId || s.completedSimulationId,
        activeSimulationId: null,
        uploadedScenarioId: null,
        simulationStartTime: null,
        alerts: newAlerts,
      };
    });

    if (targetSimId && !skipBackend && !state.isSpectator) {
      const queryParams = (cutOffSeconds !== null && cutOffSeconds !== undefined) ? `?cutOffSeconds=${cutOffSeconds}` : "";
      console.log(`[DEBUG] SENDING STOP REQUEST: /simulations/${targetSimId}/stop${queryParams}`);
        const generateReport = () => {
            const activeSimId = targetSimId;
            const payload = {
                simulationId: activeSimId,
                intervaloTemporal: i18n.t('reports.completeSimulation'),
                rationaleText: i18n.t('dashboard.rationaleText'),
                isLive: get().joinedExternally,
                startObservation: null,
                endObservation: null
            };
            fetchClient.post('/reports', payload).then(reportDto => {
                console.log("[DEBUG] Relatório Global gerado automaticamente:", reportDto);
            }).catch(err => {
                console.error("[DEBUG] Erro ao gerar Relatório Global:", err);
            });
        };

        return fetchClient.post(`/simulations/${targetSimId}/stop${queryParams}`).then(res => {
            console.log("[DEBUG] STOP REQUEST SUCCESS:", res);
            generateReport();
            return res;
        }).catch(err => {
            console.error("[DEBUG] STOP REQUEST ERROR:", err);
            console.log("Stop info: Simulation may already be closed on backend.", err.message || err);
            generateReport();
        });
    }
  },

  // ============================================================================
  // REGION 5: HEAVY BATCH PROCESSING (BIOGEARS)
  // ============================================================================

  /**
   * Uploads and parses a BioGears CSV history file (Batch Mode).
   * 1. Creates a dummy simulation on the backend.
   * 2. Uploads the CSV file for backend processing (Alerts Engine).
   * 3. Parses the CSV LOCALLY to quickly render the timeline chart.
   * 4. Fetches pre-calculated alerts and maps them accurately to the timeline index.
   * 
   * @param {File} file - The BioGears CSV file.
   */
  uploadBiogears: async (file) => {
    if (!file) return;

    if (get().resetVisualState) get().resetVisualState();

    set({
      isUploading: true,
      isConnecting: true,
      pendingWebSocketAlerts: [] 
    });

    try {
      const dummyScenario = {
        name: file.name.substring(0, 50),
        description: "Histórico Batch BioGears importado pelo médico.",
        metrics: [],
      };
      const jsonBlob = new Blob([JSON.stringify(dummyScenario)], {
        type: "application/json",
      });
      const jsonFile = new File([jsonBlob], "dummy.json", {
        type: "application/json",
      });
      const formData = new FormData();
      formData.append("file", jsonFile);

      const scenarioData = await fetchClient.upload(
        "/clinical-scenarios/upload",
        formData,
      );

      const simResp = await fetchClient.post("/simulations/start", {
        scenarioId: scenarioData.id,
      });
      const batchSimId = simResp.id;
      set({ activeSimulationStartTime: simResp.startedAt });

      try {
        if (get().connectWebSocket) await get().connectWebSocket(batchSimId);
      } catch (wsErr) {
        console.warn("WebSocket falhou ao ligar antes do upload. O fallback REST irá recuperar os dados.", wsErr);
      }

      const batchFormData = new FormData();
      batchFormData.append("file", file);
      await fetchClient.upload(
        `/readings/simulation/${batchSimId}/batch`,
        batchFormData,
      );

      console.log('Batch upload finished for simulation', batchSimId);

      const text = await file.text();
      const lines = text.split("\n");
      const headers = lines[0].split(",");
      const normalizedHeaders = headers.map((h) => {
        let clean = h.trim().replace(/"/g, "").replace("\r", "");
        clean = clean.split("(")[0]; 
        clean = clean.split("-").pop(); 
        return clean;
      });

      const history = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(",");
        const time = parseFloat(values[0]);

        const rowReadings = {};
        for (let j = 1; j < normalizedHeaders.length; j++) {
          rowReadings[normalizedHeaders[j]] = parseFloat(values[j]);
        }

        history.push({
          timestamp: time,
          readings: rowReadings,
        });
      }

      let preCalculatedAlerts = [];
      try {
        preCalculatedAlerts = await fetchClient.get(`/alerts/simulation/${batchSimId}`);
      } catch (err) {
        console.error("Failed to fetch pre-calculated alerts:", err);
      }

      let baseTimeMs;
      if (Array.isArray(simResp.startedAt)) {
        const [year, month, day, hour, minute, second, nano] = simResp.startedAt;
        baseTimeMs = new Date(year, month - 1, day, hour, minute, second, (nano || 0) / 1000000).getTime();
      } else {
        baseTimeMs = new Date(simResp.startedAt).getTime();
      }

      let expandedAlerts = [];
      preCalculatedAlerts.forEach(alertData => {
        expandedAlerts.push({ ...alertData, status: 'ATIVO' }); 
        if (alertData.warningAt) {
          expandedAlerts.push({
            ...alertData,
            timestamp: alertData.warningAt,
            severity: 'WARNING',
            status: 'ATIVO',
            id: alertData.id + '-warning'
          });
        }
        if (alertData.resolvedAt) {
          expandedAlerts.push({
            ...alertData,
            timestamp: alertData.resolvedAt,
            severity: 'NORMAL',
            status: 'RESOLVIDO',
            id: alertData.id + '-resolved'
          });
        }
      });

      const mappedAlerts = expandedAlerts.map(alertData => {
        let alertTimeMs;
        if (Array.isArray(alertData.timestamp)) {
          const [year, month, day, hour, minute, second, nano] = alertData.timestamp;
          alertTimeMs = new Date(year, month - 1, day, hour, minute, second, (nano || 0) / 1000000).getTime();
        } else {
          alertTimeMs = new Date(alertData.timestamp).getTime();
        }

        const diffSeconds = (alertTimeMs - baseTimeMs) / 1000;

        let closestIdx = history.findIndex(frame => frame.timestamp >= diffSeconds);
        if (closestIdx === -1) closestIdx = history.length > 0 ? history.length - 1 : 0;

        return {
          ...alertData,
          simulationIndex: closestIdx,
          rule: { severity: alertData.severity || 'WARNING' }
        };
      });

      mappedAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const currentAlerts = get().alerts;
      const combinedAlerts = [...mappedAlerts, ...currentAlerts];
      const uniqueAlertsMap = new Map();
      combinedAlerts.forEach(alert => {
        if (alert.id) {
          if (!uniqueAlertsMap.has(alert.id)) {
            uniqueAlertsMap.set(alert.id, alert);
          }
        } else {
          uniqueAlertsMap.set(Math.random(), alert);
        }
      });
      const finalAlerts = Array.from(uniqueAlertsMap.values());
      finalAlerts.sort((a, b) => b.simulationIndex - a.simulationIndex || new Date(b.timestamp) - new Date(a.timestamp));

      const pendingAlerts = get().pendingWebSocketAlerts || [];
      const mappedPendingAlerts = pendingAlerts.map(alertData => {
        let alertTimeMs;
        if (Array.isArray(alertData.timestamp)) {
          const [year, month, day, hour, minute, second, nano] = alertData.timestamp;
          alertTimeMs = new Date(year, month - 1, day, hour, minute, second, (nano || 0) / 1000000).getTime();
        } else {
          alertTimeMs = new Date(alertData.timestamp).getTime();
        }
        const diffSeconds = (alertTimeMs - baseTimeMs) / 1000;
        let closestIdx = history.findIndex(frame => frame.timestamp >= diffSeconds);
        if (closestIdx === -1) closestIdx = history.length > 0 ? history.length - 1 : 0;
        return {
          ...alertData,
          simulationIndex: closestIdx,
          rule: { severity: alertData.severity || 'WARNING' }
        };
      });

      const ultimateAlerts = [...mappedPendingAlerts, ...finalAlerts];
      const ultimateMap = new Map();
      ultimateAlerts.forEach(alert => {
        if (alert.id) {
          if (!ultimateMap.has(alert.id)) ultimateMap.set(alert.id, alert);
        } else {
          ultimateMap.set(Math.random(), alert);
        }
      });
      const resolvedUltimateAlerts = Array.from(ultimateMap.values());
      resolvedUltimateAlerts.sort((a, b) => b.simulationIndex - a.simulationIndex || new Date(b.timestamp) - new Date(a.timestamp));

      set((s) => ({
        isUploading: false,
        simState: "READY",
        biogearsHistory: history,
        heartRate: "--",
        spo2: "--",
        sysBP: "--",
        diaBP: "--",
        completedSimulationId: batchSimId,
        alerts: [
          {
            timestamp: Date.now(),
            simulationIndex: 0,
            rule: { severity: "INFO" },
            valueAtTrigger: i18n.t('dashboard.alerts.csvLoaded', { id: batchSimId.slice(0, 8) }),
          },
          ...resolvedUltimateAlerts,
        ],
        pendingWebSocketAlerts: []
      }));

      if (get().setCurrentTimeIndex) get().setCurrentTimeIndex(0);
    } catch (err) {
      console.error(err);
      set((s) => ({
        isUploading: false,
        alerts: [
          {
            timestamp: Date.now(),
            simulationIndex: s.currentTimeIndex,
            rule: { severity: "CRITICO" },
            valueAtTrigger: i18n.t('dashboard.alerts.csvError'),
          },
          ...s.alerts,
        ],
      }));
    } finally {
      set({ isConnecting: false });
    }
  },
});
