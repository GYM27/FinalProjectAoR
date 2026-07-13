import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RuleCard from '../RuleCard';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key
    })
}));

describe('RuleCard Component', () => {
    const mockOnToggleActive = vi.fn();
    const mockOnEdit = vi.fn();
    const mockOnDelete = vi.fn();

    const baseRule = {
        id: 1,
        name: 'Regra de Teste',
        createdByUserEmail: 'autor@exemplo.com',
        severity: 'ALERTA',
        active: true,
        deleted: false,
        expressionDsl: JSON.stringify({
            metric: 'HeartRate',
            operator: '>',
            threshold: 120,
            persistence: 5,
            resolutionThreshold: 100,
            resolutionPersistence: 10
        })
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders basic rule information and parsed DSL', () => {
        render(
            <RuleCard 
                rule={baseRule} 
                onToggleActive={mockOnToggleActive} 
                onEdit={mockOnEdit} 
                onDelete={mockOnDelete} 
            />
        );

        // Base information
        expect(screen.getByText(/Regra de Teste/i)).toBeInTheDocument();
        expect(screen.getByText(/autor@exemplo.com/i)).toBeInTheDocument();

        // Severity "ALERTA" -> uses the translation key
        expect(screen.getByText('rules.card.alert')).toBeInTheDocument();

        // Parsed DSL expression (Activation)
        expect(screen.getByText('HeartRate > 120')).toBeInTheDocument();
        expect(screen.getByText(/\(Persistência: 5s\)/)).toBeInTheDocument();

        // Parsed DSL expression (Resolution)
        expect(screen.getByText('HeartRate < 100')).toBeInTheDocument();
        expect(screen.getByText(/\(Washout: 10s\)/)).toBeInTheDocument();
    });

    it('renders critical style correctly', () => {
        const criticalRule = { ...baseRule, severity: 'CRITICO' };
        render(<RuleCard rule={criticalRule} onToggleActive={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);

        expect(screen.getByText('rules.card.critical')).toBeInTheDocument();
    });

    it('renders grayscale/inactive styles and labels when inactive', () => {
        const inactiveRule = { ...baseRule, active: false };
        const { container } = render(<RuleCard rule={inactiveRule} onToggleActive={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);

        expect(screen.getByText(/\(rules.card.inactive\)/)).toBeInTheDocument();
        // Verify if the main div received the inactive class (opacity-50 grayscale)
        expect(container.firstChild).toHaveClass('opacity-50', 'grayscale');
    });

    it('renders deleted styles and hides edit/delete buttons when deleted', () => {
        const deletedRule = { ...baseRule, deleted: true };
        render(<RuleCard rule={deletedRule} onToggleActive={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);

        expect(screen.getByText(/\(rules.card.deleted\)/)).toBeInTheDocument();
        
        // Buttons should not exist
        expect(screen.queryByTitle('rules.card.edit')).not.toBeInTheDocument();
        expect(screen.queryByTitle('rules.card.delete')).not.toBeInTheDocument();
    });

    it('triggers callbacks when buttons are clicked', () => {
        render(
            <RuleCard 
                rule={baseRule} 
                onToggleActive={mockOnToggleActive} 
                onEdit={mockOnEdit} 
                onDelete={mockOnDelete} 
            />
        );

        // Click on Edit
        fireEvent.click(screen.getByTitle('rules.card.edit'));
        expect(mockOnEdit).toHaveBeenCalledTimes(1);

        // Click on Delete
        fireEvent.click(screen.getByTitle('rules.card.delete'));
        expect(mockOnDelete).toHaveBeenCalledTimes(1);

        // Click on Deactivate/Activate (Since it's active, it should show "deactivate")
        fireEvent.click(screen.getByText('rules.card.deactivate'));
        expect(mockOnToggleActive).toHaveBeenCalledWith(1, true); // (id, current_active_state)
    });
});
