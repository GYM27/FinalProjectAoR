import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global authentication store.
 * Persists session state (email, role, timeout logic) across browser reloads via localStorage.
 * 
 * @type {import('zustand').UseBoundStore<import('zustand').StoreApi<any>>}
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      email: null,
      nomeCompleto: null,
      perfil: null,
      sessionTimeoutMinutes: null,
      lastActivity: null,
      
      /**
       * Authenticates the user and sets up the session metrics in the local store.
       * @param {Object} userData - User payload from the backend.
       * @param {string} [userData.firstName] - First name
       * @param {string} [userData.lastName] - Last name
       * @param {string} [userData.nomeCompleto] - Full name (fallback)
       * @param {string} userData.email - Primary user identifier
       * @param {string} userData.perfil - RBAC role (e.g. ADMIN, USER)
       * @param {number} [userData.sessionTimeoutMinutes] - Dynamic timeout
       */
      login: (userData) => {
        const nome = userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}`
          : userData.nomeCompleto || null;

        set({
          isAuthenticated: true,
          email: userData.email,
          nomeCompleto: nome,
          perfil: userData.perfil,
          sessionTimeoutMinutes: userData.sessionTimeoutMinutes || 30,
          lastActivity: new Date().getTime(),
        });
      },
      
      updateActivity: () => {
        if (get().isAuthenticated) {
          set({ lastActivity: new Date().getTime() });
        }
      },

      checkSession: () => {
        const { isAuthenticated, lastActivity, sessionTimeoutMinutes, logout } = get();
        
        // If authenticated but missing session data (e.g., previous store version), logout for security
        if (isAuthenticated && (!lastActivity || !sessionTimeoutMinutes)) {
          logout();
          return false;
        }

        if (isAuthenticated && lastActivity && sessionTimeoutMinutes) {
          const now = new Date().getTime();
          const timeoutMs = sessionTimeoutMinutes * 60 * 1000;
          if (now - lastActivity > timeoutMs) {
            logout();
            return false;
          }
        }
        return isAuthenticated;
      },
      
      logout: () => {
        // Dynamic import to prevent circular dependency (AuthStore -> SimStore)
        import('./useSimulationStore').then(module => {
           if (module.default && module.default.getState().clearSimulation) {
               module.default.getState().clearSimulation();
           }
        }).catch(err => console.error("Erro ao limpar store de simulação no logout", err));

        set({
          isAuthenticated: false,
          email: null,
          nomeCompleto: null,
          perfil: null,
          sessionTimeoutMinutes: null,
          lastActivity: null,
        });
      },
    }),
    {
      name: 'auth-storage', // Key in localStorage
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.checkSession();
        }
      },
    }
  )
);
