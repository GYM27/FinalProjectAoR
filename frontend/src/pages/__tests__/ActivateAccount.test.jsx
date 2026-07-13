import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ActivateAccount from '../ActivateAccount';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fetchClient } from '../../api/fetchClient';

vi.mock('../../api/fetchClient', () => ({
    fetchClient: {
        get: vi.fn()
    }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('ActivateAccount Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithToken = (token) => {
        const route = token ? `/?token=${token}` : '/';
        return render(
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path="/" element={<ActivateAccount />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('shows error immediately if no token is provided', () => {
        renderWithToken();

        expect(screen.getByText('No activation token provided in the link.')).toBeInTheDocument();
        expect(screen.getByText('Voltar ao Início de Sessão')).toBeInTheDocument();
        expect(fetchClient.get).not.toHaveBeenCalled();
    });

    it('shows already activated message if API returns alreadyActivated flag', async () => {
        fetchClient.get.mockResolvedValue({ alreadyActivated: true, message: 'Account is already active.' });

        renderWithToken('token-123');

        // Show loading state initially
        expect(screen.getByText('A validar o token de ativação...')).toBeInTheDocument();

        // Wait for state update
        await waitFor(() => {
            expect(screen.getByText('Account is already active.')).toBeInTheDocument();
            expect(screen.getByText('Ir para o Início de Sessão →')).toBeInTheDocument();
        });
    });

    it('shows generic error if API call fails', async () => {
        fetchClient.get.mockRejectedValue(new Error('Invalid token.'));

        renderWithToken('bad-token');

        await waitFor(() => {
            expect(screen.getByText('Invalid token.')).toBeInTheDocument();
        });
    });

    it('handles successful activation and navigates to login after 3 seconds', async () => {
        fetchClient.get.mockResolvedValue({ alreadyActivated: false, message: 'Account activated successfully!' });

        renderWithToken('good-token');

        await waitFor(() => {
            expect(screen.getByText('Account activated successfully!')).toBeInTheDocument();
        });

        // The real setTimeout in the component waits 3 seconds. Navigation happens after that.
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        }, { timeout: 4000 });
    });
});
