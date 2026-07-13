import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserPagination from '../UserPagination';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key
    })
}));

describe('UserPagination Component', () => {
    const mockSetPagination = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render if totalPages is 0', () => {
        const { container } = render(
            <UserPagination pagination={{ page: 1, limit: 10, totalPages: 0 }} setPagination={mockSetPagination} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders all pages without ellipses if totalPages is 5 or less', () => {
        render(
            <UserPagination pagination={{ page: 1, limit: 10, totalPages: 5 }} setPagination={mockSetPagination} />
        );

        expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
        expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    it('renders ellipses correctly when at the beginning of 10 pages', () => {
        render(
            <UserPagination pagination={{ page: 1, limit: 10, totalPages: 10 }} setPagination={mockSetPagination} />
        );

        // If page <= 3 -> [1, 2, 3, 4, '...', 10]
        expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
        expect(screen.getAllByText('...').length).toBe(1);
    });

    it('renders ellipses correctly when in the middle of 10 pages', () => {
        render(
            <UserPagination pagination={{ page: 5, limit: 10, totalPages: 10 }} setPagination={mockSetPagination} />
        );

        // If page == 5 -> [1, '...', 4, 5, 6, '...', 10]
        expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '6' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
        expect(screen.getAllByText('...').length).toBe(2);
    });

    it('renders ellipses correctly when at the end of 10 pages', () => {
        render(
            <UserPagination pagination={{ page: 9, limit: 10, totalPages: 10 }} setPagination={mockSetPagination} />
        );

        // If page >= 8 -> [1, '...', 7, 8, 9, 10]
        expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '7' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '8' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '9' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
        expect(screen.getAllByText('...').length).toBe(1);
    });

    it('calls setPagination when a page number is clicked', () => {
        render(
            <UserPagination pagination={{ page: 1, limit: 10, totalPages: 5 }} setPagination={mockSetPagination} />
        );

        fireEvent.click(screen.getByRole('button', { name: '3' }));
        expect(mockSetPagination).toHaveBeenCalledTimes(1);
        
        // setPagination is called with a callback updater. We can just check it was called.
        // It updates the state inside the component's parent.
    });

    it('disables previous button on first page and next button on last page', () => {
        const { rerender } = render(
            <UserPagination pagination={{ page: 1, limit: 10, totalPages: 5 }} setPagination={mockSetPagination} />
        );

        const buttons = screen.getAllByRole('button');
        // First button is "Previous"
        expect(buttons[0]).toBeDisabled();

        rerender(
            <UserPagination pagination={{ page: 5, limit: 10, totalPages: 5 }} setPagination={mockSetPagination} />
        );

        const buttonsEnd = screen.getAllByRole('button');
        // Last button is "Next"
        expect(buttonsEnd[buttonsEnd.length - 1]).toBeDisabled();
    });

    it('calls setPagination when items per page is changed', () => {
        render(
            <UserPagination pagination={{ page: 1, limit: 10, totalPages: 5 }} setPagination={mockSetPagination} />
        );

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '20' } });
        
        expect(mockSetPagination).toHaveBeenCalledTimes(1);
    });
});
