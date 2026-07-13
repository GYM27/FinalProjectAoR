import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VitalSignsPanel from '../VitalSignsPanel';
import useSimulationStore from '../../../../store/useSimulationStore';

// Mock i18next - allows testing if the right translation was called by returning the key itself
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key
    })
}));

// Mock Zustand store
vi.mock('../../../../store/useSimulationStore');

describe('VitalSignsPanel Component', () => {
    it('renders all vital sign cards with correct data from store', () => {
        // Define what the store will return in this test
        useSimulationStore.mockReturnValue({
            heartRate: 75,
            heartStatus: { status: 'normal' },
            spo2: 98,
            lungsStatus: { status: 'normal' },
            sysBP: 120,
            diaBP: 80,
            bpStatus: { status: 'normal' },
            biogearsHistory: [],
            currentTimeIndex: 0
        });

        render(<VitalSignsPanel />);

        // Check if titles (mocked translation keys) are present
        expect(screen.getByText('dashboard.heartRate')).toBeInTheDocument();
        expect(screen.getByText('dashboard.spo2')).toBeInTheDocument();
        expect(screen.getByText('dashboard.bloodPressure')).toBeInTheDocument();

        // Check if values were passed and rendered correctly
        expect(screen.getByText('75')).toBeInTheDocument(); // Heart Rate
        expect(screen.getByText('98')).toBeInTheDocument(); // SpO2
        expect(screen.getByText('120/80')).toBeInTheDocument(); // Blood Pressure
    });

    it('displays warning states correctly when status is critical', () => {
        useSimulationStore.mockReturnValue({
            heartRate: 160,
            heartStatus: { status: 'critical' },
            spo2: 88,
            lungsStatus: { status: 'critical' },
            sysBP: 180,
            diaBP: 110,
            bpStatus: { status: 'critical' },
            biogearsHistory: [],
            currentTimeIndex: 0
        });

        render(<VitalSignsPanel />);

        // Look for the warning icons rendered by VitalSignCard
        const warningIcons = screen.getAllByText('warning');
        
        // We should have 3 warning icons, one for each card
        expect(warningIcons).toHaveLength(3);
    });
});
