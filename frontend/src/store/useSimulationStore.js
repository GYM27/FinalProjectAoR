import { create } from "zustand";
import { createCoreSlice } from "./simulation/createCoreSlice";
import { createWebSocketSlice } from "./simulation/createWebSocketSlice";
import { createControlsSlice } from "./simulation/createControlsSlice";
import { createOrchestrationSlice } from "./simulation/createOrchestrationSlice";

/**
 * Centralized Zustand store for the Simulation domain.
 * <p>This store is composed of multiple independent slices to maintain code readability 
 * and separation of concerns. It manages the real-time state of simulations, WebSocket 
 * connections, timeline controls, and API orchestration.</p>
 * 
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<any>>}
 */
const useSimulationStore = create((set, get) => ({
  ...createCoreSlice(set, get),
  ...createWebSocketSlice(set, get),
  ...createControlsSlice(set, get),
  ...createOrchestrationSlice(set, get),
}));

export default useSimulationStore;
