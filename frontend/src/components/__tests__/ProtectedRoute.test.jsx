import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtectedRoute from '../ProtectedRoute';
import { useAuthStore } from '../../store/useAuthStore';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../../store/useAuthStore', () => ({
    useAuthStore: vi.fn()
}));

// Mock window.alert to not pause test execution
const mockAlert = vi.fn();
window.alert = mockAlert;

describe('ProtectedRoute Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('redirects to /login if not authenticated', () => {
        useAuthStore.mockReturnValue({ isAuthenticated: false, perfil: null });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
                    <Route path="/protected" element={<ProtectedRoute />}>
                        <Route index element={<div data-testid="protected-content">Secret Content</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        // Without session: must redirect to login and not render protected content
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('renders the child routes if authenticated', () => {
        useAuthStore.mockReturnValue({ isAuthenticated: true, perfil: 'admin' });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
                    <Route path="/protected" element={<ProtectedRoute />}>
                        <Route index element={<div data-testid="protected-content">Secret Content</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        // With session: must see the protected content (Outlet is rendered)
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    });

    it('redirects to /dashboard and alerts if role is not allowed', () => {
        useAuthStore.mockReturnValue({ isAuthenticated: true, perfil: 'user' }); // Has session, but is User

        render(
            <MemoryRouter initialEntries={['/admin-only']}>
                <Routes>
                    <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard Page</div>} />
                    <Route path="/admin-only" element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route index element={<div data-testid="admin-content">Admin Content</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        // Role not allowed: triggers alert and redirects to dashboard
        expect(mockAlert).toHaveBeenCalledWith('Acesso Negado: Não tem permissões para aceder a esta página.');
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
        expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
    });

    it('renders the child routes if role is allowed', () => {
        useAuthStore.mockReturnValue({ isAuthenticated: true, perfil: 'admin' }); // Has session and is Admin

        render(
            <MemoryRouter initialEntries={['/admin-only']}>
                <Routes>
                    <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard Page</div>} />
                    <Route path="/admin-only" element={<ProtectedRoute allowedRoles={['admin']} />}>
                        <Route index element={<div data-testid="admin-content">Admin Content</div>} />
                    </Route>
                </Routes>
            </MemoryRouter>
        );

        // Role allowed: no alerts and content is rendered
        expect(mockAlert).not.toHaveBeenCalled();
        expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    });
});
