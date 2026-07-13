import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditUserModal from '../EditUserModal';

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => key
    })
}));

describe('EditUserModal Component', () => {
    const mockSetEditModalOpen = vi.fn();
    const mockHandleEditUser = vi.fn();

    const mockUser = {
        email: 'maria@instituicao.pt',
        firstName: 'Maria',
        lastName: 'Santos',
        perfil: 'ADMIN'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns null and does not render when editModalOpen is false', () => {
        const { container } = render(
            <EditUserModal 
                editModalOpen={false} 
                setEditModalOpen={mockSetEditModalOpen} 
                userToEdit={mockUser}
                handleEditUser={mockHandleEditUser} 
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('returns null and does not render when userToEdit is null', () => {
        const { container } = render(
            <EditUserModal 
                editModalOpen={true} 
                setEditModalOpen={mockSetEditModalOpen} 
                userToEdit={null}
                handleEditUser={mockHandleEditUser} 
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('pre-fills the form with user data using useEffect', () => {
        render(
            <EditUserModal 
                editModalOpen={true} 
                setEditModalOpen={mockSetEditModalOpen} 
                userToEdit={mockUser}
                handleEditUser={mockHandleEditUser} 
            />
        );

        // The component will call setFirstName, setLastName and setPerfil via useEffect
        expect(screen.getByLabelText('users.editModal.firstName').value).toBe('Maria');
        expect(screen.getByLabelText('users.editModal.lastName').value).toBe('Santos');
        expect(screen.getByLabelText('users.editModal.profile').value).toBe('ADMIN');
    });

    it('updates internal state on typing and submits correct modified data', () => {
        render(
            <EditUserModal 
                editModalOpen={true} 
                setEditModalOpen={mockSetEditModalOpen} 
                userToEdit={mockUser}
                handleEditUser={mockHandleEditUser} 
            />
        );

        const fNameInput = screen.getByLabelText('users.editModal.firstName');
        const lNameInput = screen.getByLabelText('users.editModal.lastName');
        const profileSelect = screen.getByLabelText('users.editModal.profile');

        fireEvent.change(fNameInput, { target: { value: 'Mariana' } });
        fireEvent.change(lNameInput, { target: { value: 'Silva' } });
        fireEvent.change(profileSelect, { target: { value: 'MANAGER' } });

        fireEvent.click(screen.getByRole('button', { name: 'users.editModal.save' }));

        expect(mockHandleEditUser).toHaveBeenCalledWith({
            email: 'maria@instituicao.pt',
            firstName: 'Mariana',
            lastName: 'Silva',
            perfil: 'MANAGER'
        });
    });

    it('calls setEditModalOpen(false) when cancel button is clicked', () => {
        render(
            <EditUserModal 
                editModalOpen={true} 
                setEditModalOpen={mockSetEditModalOpen} 
                userToEdit={mockUser}
                handleEditUser={mockHandleEditUser} 
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'users.editModal.cancel' }));
        expect(mockSetEditModalOpen).toHaveBeenCalledWith(false);
    });
});
