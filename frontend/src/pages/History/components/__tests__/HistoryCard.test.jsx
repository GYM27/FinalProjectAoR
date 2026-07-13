import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HistoryCard from '../HistoryCard';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key
    })
}));

describe('HistoryCard Component', () => {
    const mockOnClick = vi.fn();

    const baseSession = {
        date: '2023-10-25',
        time: '14:30',
        scenarioName: 'Cenário de Teste 1',
        studentName: 'João Silva',
        status: 'EXCELENTE'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders base session information correctly', () => {
        render(<HistoryCard session={baseSession} isSelected={false} onClick={mockOnClick} />);

        expect(screen.getByText('2023-10-25')).toBeInTheDocument();
        expect(screen.getByText('14:30')).toBeInTheDocument();
        expect(screen.getByText('Cenário de Teste 1')).toBeInTheDocument();
        expect(screen.getByText(/João Silva/i)).toBeInTheDocument();
    });

    it('translates and renders EXCELENTE status with cyan color', () => {
        const { container } = render(<HistoryCard session={baseSession} isSelected={false} onClick={vi.fn()} />);

        // Status should be translated by the key associated with excellent
        expect(screen.getByText('history.status.excellent')).toBeInTheDocument();

        // span that provides color (cyan)
        // the class bg-[#00daf3] exists in getStatusIndicator for EXCELLENT
        const indicator = container.querySelector('.bg-\\[\\#00daf3\\]');
        expect(indicator).toBeInTheDocument();
    });

    it('translates and renders REPROVADO status with red color', () => {
        const failedSession = { ...baseSession, status: 'REPROVADO' };
        const { container } = render(<HistoryCard session={failedSession} isSelected={false} onClick={vi.fn()} />);

        expect(screen.getByText('history.status.failed')).toBeInTheDocument();
        // red
        const indicator = container.querySelector('.bg-\\[\\#ffb4ab\\]');
        expect(indicator).toBeInTheDocument();
    });

    it('applies selected styles and shows Open button when isSelected is true', () => {
        render(<HistoryCard session={baseSession} isSelected={true} onClick={vi.fn()} />);

        // "Open" button only appears when isSelected = true
        expect(screen.getByText('history.open')).toBeInTheDocument();
    });

    it('calls onClick when the card is clicked', () => {
        const { container } = render(<HistoryCard session={baseSession} isSelected={false} onClick={mockOnClick} />);

        // Click on the card's main div
        fireEvent.click(container.firstChild);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
});
