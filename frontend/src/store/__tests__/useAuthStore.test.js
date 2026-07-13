import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear the store state before each test to ensure isolation.
    useAuthStore.setState({
      isAuthenticated: false,
      nomeCompleto: null,
      perfil: null,
      sessionTimeoutMinutes: null,
      lastActivity: null,
    });
  });

  it('should initialize with default values', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.nomeCompleto).toBeNull();
  });

  it('should set authenticated state on login', () => {
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      perfil: 'ADMIN',
      sessionTimeoutMinutes: 30,
    };

    useAuthStore.getState().login(userData);
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.nomeCompleto).toBe('John Doe');
    expect(state.perfil).toBe('ADMIN');
    expect(state.lastActivity).not.toBeNull();
  });

  it('should clear state on logout', () => {
    // Setup state
    useAuthStore.getState().login({ firstName: 'Jane', lastName: 'Doe', perfil: 'USER' });
    
    // Logout
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.nomeCompleto).toBeNull();
    expect(state.lastActivity).toBeNull();
  });
});
