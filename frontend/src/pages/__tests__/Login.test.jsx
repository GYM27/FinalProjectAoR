import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { fetchClient } from '../../api/fetchClient';
import { useAuthStore } from '../../store/useAuthStore';

// Mock dependencies to isolate the component
vi.mock('../../api/fetchClient', () => ({
  fetchClient: {
    post: vi.fn(),
  }
}));

// Mock react-i18next to return the translation keys instead of text
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ isAuthenticated: false, nomeCompleto: null });
  });

  it('renders login form correctly', () => {
    renderWithRouter(<Login />);
    
    // Since we mocked translations, the button text will likely be the translation key,
    // or we can find inputs by their type.
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
  });

  it('handles login form submission and updates global state on success', async () => {
    fetchClient.post.mockResolvedValueOnce({
      firstName: 'Test',
      lastName: 'User',
      perfil: 'ADMIN'
    });

    renderWithRouter(<Login />);
    
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const form = document.querySelector('form');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetchClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      });
    });

    const storeState = useAuthStore.getState();
    expect(storeState.isAuthenticated).toBe(true);
    expect(storeState.perfil).toBe('ADMIN');
  });

  it('displays error message on login failure', async () => {
    fetchClient.post.mockRejectedValueOnce(new Error('Invalid credentials'));

    renderWithRouter(<Login />);
    
    const emailInput = document.querySelector('input[type="email"]');
    const passwordInput = document.querySelector('input[type="password"]');
    const form = document.querySelector('form');

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    const storeState = useAuthStore.getState();
    expect(storeState.isAuthenticated).toBe(false);
  });
});
