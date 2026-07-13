import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Header from '../Header';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { fetchClient } from '../../api/fetchClient';

// Mock Zustand Store
vi.mock('../../store/useAuthStore', () => ({
    useAuthStore: vi.fn()
}));

// Mock local API calls
vi.mock('../../api/fetchClient', () => ({
    fetchClient: {
        post: vi.fn()
    }
}));

// Mock internationalization module (i18next)
const mockChangeLanguage = vi.fn();
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key,
        i18n: {
            language: 'pt',
            changeLanguage: mockChangeLanguage
        }
    })
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

describe('Header Component', () => {
    const mockLogout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Mock global fetch() used in Header to check "server status" every 30s
        global.fetch = vi.fn(() =>
            Promise.resolve({
                status: 200,
                json: () => Promise.resolve({ status: 'UP' }),
            })
        );

        useAuthStore.mockReturnValue({
            nomeCompleto: 'Test User',
            logout: mockLogout
        });
    });

    it('renders user name and title correctly', () => {
        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('VITALSIM CORE')).toBeInTheDocument();
    });

    it('opens and closes dropdown on user click', () => {
        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Starts without showing the logout option
        expect(screen.queryByText('header.logout')).not.toBeInTheDocument();

        // Click on the user area
        const userContainer = screen.getByText('Test User');
        fireEvent.click(userContainer);

        // Dropdown opened, should show logout
        expect(screen.getByText('header.logout')).toBeInTheDocument();

        // Click again to close
        fireEvent.click(userContainer);
        expect(screen.queryByText('header.logout')).not.toBeInTheDocument();
    });

    it('handles logout process correctly (API call, store clear and navigation)', async () => {
        fetchClient.post.mockResolvedValue({}); // API responds without issues

        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        // Opens the menu and clicks on logout
        fireEvent.click(screen.getByText('Test User'));
        const logoutButton = screen.getByText('header.logout');
        fireEvent.click(logoutButton);

        // Since the logout button triggers Promises (async), we use waitFor
        await waitFor(() => {
            expect(fetchClient.post).toHaveBeenCalledWith('/auth/logout');
            expect(mockLogout).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    it('calls i18n changeLanguage when language buttons are clicked', () => {
        render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );

        const ptButton = screen.getByText('PT');
        const enButton = screen.getByText('EN');

        // Click on English
        fireEvent.click(enButton);
        expect(mockChangeLanguage).toHaveBeenCalledWith('en');

        // Click on Portuguese
        fireEvent.click(ptButton);
        expect(mockChangeLanguage).toHaveBeenCalledWith('pt');
    });
});
