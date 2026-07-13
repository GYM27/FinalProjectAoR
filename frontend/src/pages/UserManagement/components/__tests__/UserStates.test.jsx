import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserStates from '../UserStates';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key
    })
}));

describe('UserStates Component', () => {
    const mockStats = {
        totalUsers: 42,
        activeUsers: 30,
        inactiveUsers: 12
    };

    it('renders statistics correctly', () => {
        const mockSetStatusFilter = vi.fn();
        render(<UserStates stats={mockStats} setStatusFilter={mockSetStatusFilter} />);

        // Translations check
        expect(screen.getByText('users.totalUsers')).toBeInTheDocument();
        expect(screen.getByText('users.activeAccounts')).toBeInTheDocument();
        expect(screen.getByText('users.inactiveAccounts')).toBeInTheDocument();

        // Values check
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('calls setStatusFilter with "Todos" when total users card is clicked', () => {
        const mockSetStatusFilter = vi.fn();
        render(<UserStates stats={mockStats} setStatusFilter={mockSetStatusFilter} />);

        const totalCardText = screen.getByText('users.totalUsers');
        fireEvent.click(totalCardText);

        expect(mockSetStatusFilter).toHaveBeenCalledWith('Todos');
        expect(mockSetStatusFilter).toHaveBeenCalledTimes(1);
    });

    it('calls setStatusFilter with "Ativo" when active users card is clicked', () => {
        const mockSetStatusFilter = vi.fn();
        render(<UserStates stats={mockStats} setStatusFilter={mockSetStatusFilter} />);

        const activeCardText = screen.getByText('users.activeAccounts');
        fireEvent.click(activeCardText);

        expect(mockSetStatusFilter).toHaveBeenCalledWith('Ativo');
        expect(mockSetStatusFilter).toHaveBeenCalledTimes(1);
    });

    it('calls setStatusFilter with "Inativo" when inactive users card is clicked', () => {
        const mockSetStatusFilter = vi.fn();
        render(<UserStates stats={mockStats} setStatusFilter={mockSetStatusFilter} />);

        const inactiveCardText = screen.getByText('users.inactiveAccounts');
        fireEvent.click(inactiveCardText);

        expect(mockSetStatusFilter).toHaveBeenCalledWith('Inativo');
        expect(mockSetStatusFilter).toHaveBeenCalledTimes(1);
    });
});
