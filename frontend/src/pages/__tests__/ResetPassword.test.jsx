import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ResetPassword from '../ResetPassword';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fetchClient } from '../../api/fetchClient';

// Mock API calls
vi.mock('../../api/fetchClient', () => ({
    fetchClient: {
        post: vi.fn()
    }
}));

// Mock React Router navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('ResetPassword Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithToken = (tokenValue) => {
        const route = tokenValue ? `/?token=${tokenValue}` : '/';
        return render(
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path="/" element={<ResetPassword />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('shows error if no token is provided in URL and prevents API call', async () => {
        renderWithToken(null);

        const newPassInput = screen.getByLabelText(/Nova Palavra-passe/i);
        const confirmPassInput = screen.getByLabelText(/Confirmar Palavra-passe/i);
        const submitButton = screen.getByRole('button', { name: /REDEFINIR ACESSO/i });

        fireEvent.change(newPassInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPassInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        expect(screen.getByText('Token de recuperação inválido ou inexistente.')).toBeInTheDocument();
        expect(fetchClient.post).not.toHaveBeenCalled();
    });

    it('shows error if passwords do not match and prevents API call', () => {
        renderWithToken('valid-token-123');

        const newPassInput = screen.getByLabelText(/Nova Palavra-passe/i);
        const confirmPassInput = screen.getByLabelText(/Confirmar Palavra-passe/i);
        const submitButton = screen.getByRole('button', { name: /REDEFINIR ACESSO/i });

        fireEvent.change(newPassInput, { target: { value: 'password123' } });
        fireEvent.change(confirmPassInput, { target: { value: 'different123' } });
        fireEvent.click(submitButton);

        expect(screen.getByText('As palavras-passe não coincidem.')).toBeInTheDocument();
        expect(fetchClient.post).not.toHaveBeenCalled();
    });

    it('handles successful password reset, hides form and navigates to login after 3s', async () => {
        fetchClient.post.mockResolvedValue({ message: 'Palavra-passe redefinida com sucesso.' });

        renderWithToken('valid-token-123');

        const newPassInput = screen.getByLabelText(/Nova Palavra-passe/i);
        const confirmPassInput = screen.getByLabelText(/Confirmar Palavra-passe/i);
        const submitButton = screen.getByRole('button', { name: /REDEFINIR ACESSO/i });

        fireEvent.change(newPassInput, { target: { value: 'newSecurePass' } });
        fireEvent.change(confirmPassInput, { target: { value: 'newSecurePass' } });
        fireEvent.click(submitButton);

        // Wait for the request to complete successfully and the DOM to update
        await waitFor(() => {
            expect(fetchClient.post).toHaveBeenCalledWith('/auth/reset-password', {
                token: 'valid-token-123',
                newPassword: 'newSecurePass'
            });
            expect(screen.getByText('Palavra-passe redefinida com sucesso.')).toBeInTheDocument();
        });

        // The input form should disappear when the success flag is true
        expect(screen.queryByLabelText(/Nova Palavra-passe/i)).not.toBeInTheDocument();

        // The real setTimeout in the component waits 3 seconds. Navigation happens after that.
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        }, { timeout: 4000 });
    });
});
