import { create } from 'zustand';

export const useDegradedStore = create((set) => ({
  isDegradedMode: false,
  setDegradedMode: (status) => set({ isDegradedMode: status }),
}));
