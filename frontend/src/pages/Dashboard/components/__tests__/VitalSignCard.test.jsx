import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import VitalSignCard from '../VitalSignCard';

describe('VitalSignCard Component', () => {
    const defaultProps = {
        title: 'Heart Rate',
        value: 80,
        unit: 'BPM',
        color: 'cyan',
        icon: 'favorite',
        trend: 'NORMAL',
        extraInfo: 'MÉDIA: 75',
        sparklinePoints: [10, 20, 30],
        isWarning: false
    };

    it('renders basic props correctly', () => {
        render(<VitalSignCard {...defaultProps} />);
        
        expect(screen.getByText('Heart Rate')).toBeInTheDocument();
        expect(screen.getByText('80')).toBeInTheDocument();
        expect(screen.getByText('BPM')).toBeInTheDocument();
        expect(screen.getByText('NORMAL')).toBeInTheDocument();
        expect(screen.getByText('MÉDIA: 75')).toBeInTheDocument();
        expect(screen.getByText('favorite')).toBeInTheDocument(); // Standard icon
    });

    it('renders warning icon when isWarning is true', () => {
        render(<VitalSignCard {...defaultProps} isWarning={true} />);
        
        const warningIcon = screen.getByText('warning');
        expect(warningIcon).toBeInTheDocument();
        expect(warningIcon).toHaveClass('animate-pulse');
        
        // When warning is true, the normal icon shouldn't be rendered
        expect(screen.queryByText('favorite')).not.toBeInTheDocument();
    });

    it('applies the correct text color class based on the color prop', () => {
        const { rerender } = render(<VitalSignCard {...defaultProps} color="red" />);
        
        // The value text should have the red class
        let valueElement = screen.getByText('80');
        expect(valueElement).toHaveClass('text-red-400');

        // Re-render with amber color
        rerender(<VitalSignCard {...defaultProps} color="amber" />);
        valueElement = screen.getByText('80');
        expect(valueElement).toHaveClass('text-amber-400');
    });

    it('renders correct trend icon based on trendIcon prop', () => {
        const { rerender } = render(<VitalSignCard {...defaultProps} trend="ALTA" trendIcon="trending_up" />);
        expect(screen.getByText('trending_up')).toBeInTheDocument();

        rerender(<VitalSignCard {...defaultProps} trend="QUEDA" trendIcon="trending_down" />);
        expect(screen.getByText('trending_down')).toBeInTheDocument();

        rerender(<VitalSignCard {...defaultProps} trend="ESTÁVEL" trendIcon="remove" />);
        expect(screen.getByText('remove')).toBeInTheDocument();
    });
});
