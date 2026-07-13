import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Navbar from '../Navbar';
import { MemoryRouter } from 'react-router-dom';

// Mock i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key
    })
}));

import { useAuthStore } from '../../store/useAuthStore';
vi.mock('../../store/useAuthStore', () => ({
    useAuthStore: vi.fn()
}));

describe('Navbar Component', () => {
    it('renders navigation links based on role (MANAGER)', () => {
        useAuthStore.mockReturnValue({ perfil: 'MANAGER' });
        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <Navbar />
            </MemoryRouter>
        );

        expect(screen.getByText('navbar.dashboard')).toBeInTheDocument();
        expect(screen.getByText('navbar.history')).toBeInTheDocument();
        expect(screen.getByText('navbar.rules')).toBeInTheDocument();
        expect(screen.queryByText('navbar.users')).not.toBeInTheDocument();
    });

    it('renders navigation links based on role (ADMIN)', () => {
        useAuthStore.mockReturnValue({ perfil: 'ADMIN' });
        render(
            <MemoryRouter initialEntries={['/users']}>
                <Navbar />
            </MemoryRouter>
        );

        expect(screen.getByText('navbar.users')).toBeInTheDocument();
        expect(screen.getByText('navbar.definitions')).toBeInTheDocument();
        expect(screen.getByText('Metrics')).toBeInTheDocument();
        expect(screen.queryByText('navbar.dashboard')).not.toBeInTheDocument();
    });

    it('highlights the Dashboard link when route is /dashboard', () => {
        useAuthStore.mockReturnValue({ perfil: 'MANAGER' });
        render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <Navbar />
            </MemoryRouter>
        );

        const dashboardLink = screen.getByText('navbar.dashboard').closest('a');
        const historyLink = screen.getByText('navbar.history').closest('a');

        // Verify if the correct class was applied to the active link
        expect(dashboardLink).toHaveClass('text-cyan-400');
        expect(historyLink).not.toHaveClass('text-cyan-400');
    });

    it('highlights the Users link when route is /users', () => {
        useAuthStore.mockReturnValue({ perfil: 'ADMIN' });
        render(
            <MemoryRouter initialEntries={['/users']}>
                <Navbar />
            </MemoryRouter>
        );

        const usersLink = screen.getByText('navbar.users').closest('a');
        const definitionsLink = screen.getByText('navbar.definitions').closest('a');

        expect(usersLink).toHaveClass('text-cyan-400');
        expect(definitionsLink).not.toHaveClass('text-cyan-400');
    });
});
