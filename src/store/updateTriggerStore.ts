import { create } from 'zustand';

// ============================================
// UPDATE TRIGGER STORE
// Forza re-render globale quando arrivano eventi WebSocket
// ============================================

interface UpdateTriggerState {
  trigger: number;
  forceTrigger: () => void;
}

export const useUpdateTrigger = create<UpdateTriggerState>((set) => ({
  trigger: 0,
  forceTrigger: () => set((state) => ({ trigger: state.trigger + 1 })),
}));
