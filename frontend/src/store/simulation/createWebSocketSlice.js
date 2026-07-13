import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClientInstance = null;

/**
 * Creates the WebSocket slice for the Zustand store.
 * Manages the STOMP over SockJS connection for real-time alerts and readings.
 * 
 * @param {Function} set - Zustand set function
 * @param {Function} get - Zustand get function
 */
export const createWebSocketSlice = (set, get) => ({
  // ----------------------------------------
  // 3. STOMP WebSocket Logic
  // ----------------------------------------
  
  /**
   * Establishes a STOMP connection to the Spring Boot backend.
   * Subscribes to the specific topics for the given simulation ID.
   * 
   * @param {string} simulationId - The UUID of the active simulation
   * @returns {Promise<void>} Resolves when the connection is established
   */
  connectWebSocket: (simulationId) => {
    return new Promise((resolve, reject) => {
      // Prevent multiple concurrent connections
      if (stompClientInstance) {
        resolve();
        return;
      }

      const client = new Client({
        webSocketFactory: () => new SockJS("/api/ws"),
        debug: (msg) => console.log("STOMP:", msg),
        reconnectDelay: 5000,
        onConnect: () => {
          client.subscribe(
            `/topic/simulations/${simulationId}/alerts`,
            (message) => {
              const alertData = JSON.parse(message.body);
              const state = get();

              if (state.isUploading) {
                set((s) => ({
                  pendingWebSocketAlerts: [...(s.pendingWebSocketAlerts || []), alertData]
                }));
                return;
              }

              let closestIdx = state.biogearsHistory && state.biogearsHistory.length > 0 
                               ? state.biogearsHistory.length - 1 
                               : state.currentTimeIndex;
              
              // For Live/IoT scenarios, the alert always belongs to the current simulation time!
              // Ignore diffSeconds math to avoid timezone issues.
              if (!state.joinedExternally && alertData.timestamp && state.activeSimulationStartTime) {
                let alertTimeMs;
                if (Array.isArray(alertData.timestamp)) {
                  const [year, month, day, hour, minute, second, nano] = alertData.timestamp;
                  alertTimeMs = new Date(year, month - 1, day, hour, minute, second, (nano || 0) / 1000000).getTime();
                } else {
                  alertTimeMs = new Date(alertData.timestamp).getTime();
                }
                
                let baseTimeMs;
                if (Array.isArray(state.activeSimulationStartTime)) {
                  const [y, m, d, h, min, sec, n] = state.activeSimulationStartTime;
                  baseTimeMs = new Date(y, m - 1, d, h, min, sec, (n || 0) / 1000000).getTime();
                } else {
                  baseTimeMs = new Date(state.activeSimulationStartTime).getTime();
                }
                
                const diffSeconds = (alertTimeMs - baseTimeMs) / 1000;
                if (state.biogearsHistory) {
                  const foundIdx = state.biogearsHistory.findIndex(frame => frame.timestamp >= diffSeconds);
                  if (foundIdx !== -1) {
                    closestIdx = foundIdx;
                  }
                }
              }
                               
              if (closestIdx < 0) closestIdx = 0;
              alertData.simulationIndex = closestIdx;

              set((state) => {
                if (alertData.systemName === "[SYSTEM_END_SIMULATION]") {
                  console.log("Server signaled the end of the JSON scenario.");
                  if (!state.isUploading && (!state.biogearsHistory || state.biogearsHistory.length === 0)) {
                    setTimeout(() => get().stopSimulation(), 500);
                  }
                  return state;
                }

                if (alertData.alertId) {
                  const existingIdx = state.alerts.findIndex(a => 
                      a.alertId === alertData.alertId && 
                      a.severity === alertData.severity
                  );
                  if (existingIdx !== -1) {
                    return state; // Ignore duplicate event for the exact same state transition
                  }
                }
                const updatedAlerts = [alertData, ...state.alerts];
                updatedAlerts.sort((a, b) => (b.simulationIndex - a.simulationIndex) || (new Date(b.timestamp) - new Date(a.timestamp)));

                if (updatedAlerts.length > 100) updatedAlerts.length = 100;
                return { alerts: updatedAlerts };
              });

              if (get().setCurrentTimeIndex) {
                get().setCurrentTimeIndex(get().currentTimeIndex);
              }
            },
          );

          client.subscribe(
            `/topic/simulations/${simulationId}/readings`,
            (message) => {
              const reading = JSON.parse(message.body);
              
              // Normalize the handle string to avoid casing issues from different backend systems
              const handle = reading.handle ? reading.handle.toUpperCase() : "";

              // Update the specific physiological parameter in the global store
              // We check against common BioGears aliases and our own custom names
              if (handle === "HEART_RATE" || handle === "HEARTRATE") {
                set({ heartRate: reading.value });
              }
              if (handle === "SPO2" || handle === "OXYGENSATURATION") {
                set({ spo2: reading.value });
              }
              if (handle === "ARTERIALPRESSURE_SYSTOLIC" || handle === "SYS") {
                set({ sysBP: Math.round(reading.value) });
              }
              if (handle === "ARTERIALPRESSURE_DIASTOLIC" || handle === "DIA") {
                set({ diaBP: Math.round(reading.value) });
              }
            },
          );
          resolve();
        },
        onStompError: (frame) => {
          console.error("Broker reported error: " + frame.headers["message"]);
          reject(frame);
        }
      });

      client.activate();
      stompClientInstance = client;
    });
  },

  /**
   * Disconnects the STOMP WebSocket client and clears any associated intervals.
   * Ensures resources are freed when a simulation is stopped or unmounted.
   */
  disconnectWebSocket: () => {
    if (stompClientInstance) {
      stompClientInstance.deactivate();
      stompClientInstance = null;
    }
    if (window.liveRecorderInterval) {
      clearInterval(window.liveRecorderInterval);
      window.liveRecorderInterval = null;
    }
  },
});
