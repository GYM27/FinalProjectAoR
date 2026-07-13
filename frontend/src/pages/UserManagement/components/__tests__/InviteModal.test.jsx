import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InviteModal from '../InviteModal';

describe('InviteModal Component', () => {
    const mockSetInviteModalOpen = vi.fn();
    const mockHandleInviteUser = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null and does not render when inviteModalOpen is false', () => {
        const { container } = render(
            <InviteModal 
                inviteModalOpen={false} 
                setInviteModalOpen={mockSetInviteModalOpen} 
                handleInviteUser={mockHandleInviteUser} 
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders modal content when inviteModalOpen is true', () => {
        render(
            <InviteModal 
                inviteModalOpen={true} 
                setInviteModalOpen={mockSetInviteModalOpen} 
                handleInviteUser={mockHandleInviteUser} 
            />
        );

        expect(screen.getByText('Convidar Utilizador')).toBeInTheDocument();
        expect(screen.getByLabelText('Endereço de Email')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Enviar Convite' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    });

    it('submits form with correct email and clears the input afterwards', () => {
        render(
            <InviteModal 
                inviteModalOpen={true} 
                setInviteModalOpen={mockSetInviteModalOpen} 
                handleInviteUser={mockHandleInviteUser} 
            />
        );

        const emailInput = screen.getByLabelText('Endereço de Email');
        const submitBtn = screen.getByRole('button', { name: 'Enviar Convite' });

        // Type the email
        fireEvent.change(emailInput, { target: { value: 'novo.utilizador@exemplo.pt' } });
        expect(emailInput.value).toBe('novo.utilizador@exemplo.pt');

        // Submit the invite (fireEvent.click on button triggers form onSubmit)
        fireEvent.click(submitBtn);

        // Verify call
        expect(mockHandleInviteUser).toHaveBeenCalledWith({ email: 'novo.utilizador@exemplo.pt' });
        expect(mockHandleInviteUser).toHaveBeenCalledTimes(1);

        // Verify field clearance
        expect(emailInput.value).toBe('');
    });

    it('calls setInviteModalOpen(false) when cancel button is clicked', () => {
        render(
            <InviteModal 
                inviteModalOpen={true} 
                setInviteModalOpen={mockSetInviteModalOpen} 
                handleInviteUser={mockHandleInviteUser} 
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
        expect(mockSetInviteModalOpen).toHaveBeenCalledWith(false);
    });
});
