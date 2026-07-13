import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForgotPassword from '../ForgotPassword';
import { MemoryRouter } from 'react-router-dom';
import { fetchClient } from '../../api/fetchClient';

// Mock API calls
vi.mock('../../api/fetchClient', () => ({
    fetchClient: {
        post: vi.fn()
    }
}));

describe('ForgotPassword Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the initial form correctly', () => {
        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        expect(screen.getByText('VITALISM CORE')).toBeInTheDocument();
        expect(screen.getByText('Recuperação de Acesso')).toBeInTheDocument();
        expect(screen.getByLabelText(/E-mail de Registo/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ENVIAR LINK/i })).toBeInTheDocument();
    });

    it('displays success message on successful API call', async () => {
        // Simulate API success
        fetchClient.post.mockResolvedValue({ message: 'E-mail enviado com sucesso.' });

        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        const emailInput = screen.getByLabelText(/E-mail de Registo/i);
        const submitButton = screen.getByRole('button', { name: /ENVIAR LINK/i });

        // Fill in the email and submit
        fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } });
        fireEvent.click(submitButton);

        // The button state changes temporarily
        expect(screen.getByRole('button', { name: /A PROCESSAR.../i })).toBeInTheDocument();

        // Expect the success message to appear
        await waitFor(() => {
            expect(fetchClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'teste@exemplo.com' });
            expect(screen.getByText('E-mail enviado com sucesso.')).toBeInTheDocument();
        });

        // Verify that the success message has the correct classes (green/cyan text)
        const successMessage = screen.getByText('E-mail enviado com sucesso.');
        expect(successMessage).toHaveClass('text-tech-cyan');
    });

    it('displays error message on failed API call', async () => {
        // Simulate API failure
        fetchClient.post.mockRejectedValue(new Error('E-mail não encontrado na nossa base de dados.'));

        render(
            <MemoryRouter>
                <ForgotPassword />
            </MemoryRouter>
        );

        const emailInput = screen.getByLabelText(/E-mail de Registo/i);
        const submitButton = screen.getByRole('button', { name: /ENVIAR LINK/i });

        fireEvent.change(emailInput, { target: { value: 'erro@exemplo.com' } });
        fireEvent.click(submitButton);

        // Expect the error message to appear
        await waitFor(() => {
            expect(fetchClient.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'erro@exemplo.com' });
            expect(screen.getByText('E-mail não encontrado na nossa base de dados.')).toBeInTheDocument();
        });

        // Verify that the error message has the correct classes (red text)
        const errorMessage = screen.getByText('E-mail não encontrado na nossa base de dados.');
        expect(errorMessage).toHaveClass('text-red-500');
    });
});
