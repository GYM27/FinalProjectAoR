import { describe, it, expect, beforeEach, vi } from 'vitest';
import useSimulationStore from '../useSimulationStore';
import { fetchClient } from '../../api/fetchClient';

// Mock fetchClient to isolate the state logic from network requests.
vi.mock('../../api/fetchClient', () => ({
  fetchClient: vi.fn(),
}));

describe('useSimulationStore', () => {
  beforeEach(() => {
    // Reset store state and mocks before each test to avoid side effects.
    useSimulationStore.setState({
      simState: 'STOPPED',
      activeSimulationId: null,
      uploadedScenarioId: null,
      isUploading: false,
      alerts: [],
      biogearsHistory: [],
      isLive: false,
      isPlaying: false,
    });
    vi.clearAllMocks();
  });

  it('should initialize with STOPPED state', () => {
    const state = useSimulationStore.getState();
    expect(state.simState).toBe('STOPPED');
  });

  it('should transition to RUNNING on startSimulation', async () => {
    // Setup initial state necessary to run the simulation
    useSimulationStore.setState({
      biogearsHistory: [{ time: 0, readings: {} }],
      uploadedScenarioId: 10,
    });

    await useSimulationStore.getState().startSimulation();

    const state = useSimulationStore.getState();
    expect(state.simState).toBe('RUNNING');
    expect(state.isLive).toBe(true);
    expect(state.isPlaying).toBe(true);
    expect(state.simulationStartTime).not.toBeNull();
  });

  it('should not start simulation if already RUNNING', async () => {
    useSimulationStore.setState({
      simState: 'RUNNING',
      biogearsHistory: [{ time: 0, readings: {} }],
    });

    await useSimulationStore.getState().startSimulation();

    const state = useSimulationStore.getState();
    expect(state.simState).toBe('RUNNING');
  });
});
