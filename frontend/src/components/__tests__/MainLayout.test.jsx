import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MainLayout from '../MainLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { MemoryRouter } from 'react-router-dom';

// Mock child components to isolate MainLayout
vi.mock('../Header', () => ({ default: () => <div data-testid="header-mock">Header</div> }));
vi.mock('../Footer', () => ({ default: () => <div data-testid="footer-mock">Footer</div> }));
vi.mock('../Navbar', () => ({ default: () => <div data-testid="navbar-mock">Navbar</div> }));

// Mock React Router useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock Zustand Store
vi.mock('../../store/useAuthStore', () => ({
    useAuthStore: vi.fn()
}));

describe('MainLayout Component', () => {
    beforeEach(() => {
        // Use fake timers to test setInterval without having to wait 10 seconds
        vi.useFakeTimers();
        mockNavigate.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the layout components correctly', () => {
        // Mock session valid
        useAuthStore.mockImplementation((selector) => {
            return () => true; // checkSession returns true
        });

        render(
            <MemoryRouter>
                <MainLayout />
            </MemoryRouter>
        );

        expect(screen.getByTestId('header-mock')).toBeInTheDocument();
        expect(screen.getByTestId('navbar-mock')).toBeInTheDocument();
        expect(screen.getByTestId('footer-mock')).toBeInTheDocument();
    });

    it('checks session every 10 seconds and does not redirect if valid', () => {
        const mockCheckSession = vi.fn().mockReturnValue(true);
        useAuthStore.mockImplementation((selector) => {
            return mockCheckSession;
        });

        render(
            <MemoryRouter>
                <MainLayout />
            </MemoryRouter>
        );

        expect(mockCheckSession).not.toHaveBeenCalled();

        // Advance the clock 10 seconds
        vi.advanceTimersByTime(10000);

        expect(mockCheckSession).toHaveBeenCalledTimes(1);
        expect(mockNavigate).not.toHaveBeenCalled(); // Should not redirect
    });

    it('redirects to /login if session is invalid after 10 seconds', () => {
        const mockCheckSession = vi.fn().mockReturnValue(false);
        useAuthStore.mockImplementation((selector) => {
            return mockCheckSession;
        });

        render(
            <MemoryRouter>
                <MainLayout />
            </MemoryRouter>
        );

        // Advance the clock 10 seconds
        vi.advanceTimersByTime(10000);

        expect(mockCheckSession).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/login'); // Should redirect
    });
});
