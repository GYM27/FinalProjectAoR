import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Register from '../Register';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fetchClient } from '../../api/fetchClient';
import { userService } from '../../api/userService';

// Mock APIs
vi.mock('../../api/fetchClient', () => ({
    fetchClient: {
        get: vi.fn(),
        post: vi.fn()
    }
}));

vi.mock('../../api/userService', () => ({
    userService: {
        acceptInvite: vi.fn()
    }
}));

// Mock window.alert
const mockAlert = vi.fn();
window.alert = mockAlert;

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key
    })
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Register Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithToken = (token) => {
        const route = token ? `/?token=${token}` : '/';
        return render(
            <MemoryRouter initialEntries={[route]}>
                <Routes>
                    <Route path="/" element={<Register />} />
                </Routes>
            </MemoryRouter>
        );
    };

    it('shows error when passwords do not match', () => {
        renderWithToken();

        fireEvent.change(screen.getByLabelText('auth.firstName'), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText('auth.lastName'), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'Valid1@Pass' } });
        fireEvent.change(screen.getByLabelText('auth.confirmPassword'), { target: { value: 'Valid2@Pass' } });
        fireEvent.click(screen.getByRole('button', { name: 'auth.registerButton' }));

        expect(screen.getByText('auth.passwordsNotMatch')).toBeInTheDocument();
        expect(fetchClient.post).not.toHaveBeenCalled();
    });

    it('shows error when password does not meet requirements', () => {
        renderWithToken();

        // Fill required fields
        fireEvent.change(screen.getByLabelText('auth.firstName'), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText('auth.lastName'), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'john@example.com' } });
        // Password without uppercase letters or special characters, etc.
        fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'fraca123' } });
        fireEvent.change(screen.getByLabelText('auth.confirmPassword'), { target: { value: 'fraca123' } });
        fireEvent.click(screen.getByRole('button', { name: 'auth.registerButton' }));

        expect(screen.getByText('auth.passwordRequirements')).toBeInTheDocument();
        expect(fetchClient.post).not.toHaveBeenCalled();
    });

    it('handles normal registration correctly (no token)', async () => {
        fetchClient.post.mockResolvedValue({}); // success

        renderWithToken();

        fireEvent.change(screen.getByLabelText('auth.firstName'), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText('auth.lastName'), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'john@example.com' } });
        fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'Strong@Pass123' } });
        fireEvent.change(screen.getByLabelText('auth.confirmPassword'), { target: { value: 'Strong@Pass123' } });

        fireEvent.click(screen.getByRole('button', { name: 'auth.registerButton' }));

        await waitFor(() => {
            expect(fetchClient.post).toHaveBeenCalledWith('/auth/register', {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                password: 'Strong@Pass123',
                confirmPassword: 'Strong@Pass123'
            });
            expect(screen.getByText('auth.registerVerifyMsg')).toBeInTheDocument();
        });
    });

    it('handles registration via invite correctly (with token)', async () => {
        userService.acceptInvite.mockResolvedValue({}); // success

        fetchClient.get.mockResolvedValue({ email: 'jane@example.com' });

        renderWithToken('invite-token-123');

        await waitFor(() => {
            expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
        });

        fireEvent.change(screen.getByLabelText(/auth\.firstName/i), { target: { value: 'Jane' } });
        fireEvent.change(screen.getByLabelText(/auth\.lastName/i), { target: { value: 'Smith' } });
        fireEvent.change(screen.getByLabelText(/auth\.password/i), { target: { value: 'Strong@Pass123' } });
        fireEvent.change(screen.getByLabelText(/auth\.confirmPassword/i), { target: { value: 'Strong@Pass123' } });

        fireEvent.click(screen.getByRole('button', { name: 'auth.registerButton' }));

        await waitFor(() => {
            expect(userService.acceptInvite).toHaveBeenCalledWith({
                token: 'invite-token-123',
                firstName: 'Jane',
                lastName: 'Smith',
                password: 'Strong@Pass123',
                confirmPassword: 'Strong@Pass123'
            });
            expect(mockAlert).toHaveBeenCalledWith('auth.registerSuccessMsg');
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
        
        // Verify that fetchClient (normal registration) was not called
        expect(fetchClient.post).not.toHaveBeenCalled();
    });
});
