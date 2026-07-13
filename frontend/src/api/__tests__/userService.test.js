import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../userService';
import fetchClient from '../fetchClient';

// Falsificamos globalmente o utilitário de chamadas HTTP
vi.mock('../fetchClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn()
    }
}));

describe('userService API Layer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUsers conditional logic', () => {
        it('calls active users endpoint when isActive is true', () => {
            userService.getUsers(0, 10, true);
            expect(fetchClient.get).toHaveBeenCalledWith('/users?page=0&size=10');
        });

        it('calls archived users endpoint when isActive is false', () => {
            userService.getUsers(1, 20, false);
            expect(fetchClient.get).toHaveBeenCalledWith('/users/archived?page=1&size=20');
        });

        it('calls allUsers endpoint when isActive is null or undefined', () => {
            userService.getUsers(2, 5, undefined);
            expect(fetchClient.get).toHaveBeenCalledWith('/users/allUsers?page=2&size=5');
            
            userService.getUsers(3, 15, null);
            expect(fetchClient.get).toHaveBeenCalledWith('/users/allUsers?page=3&size=15');
        });
    });

    describe('other GET methods', () => {
        it('getUserStats calls /users/stats', () => {
            userService.getUserStats();
            expect(fetchClient.get).toHaveBeenCalledWith('/users/stats');
        });

        it('getAllUsers calls /users/allUsers', () => {
            userService.getAllUsers(0, 10);
            expect(fetchClient.get).toHaveBeenCalledWith('/users/allUsers?page=0&size=10');
        });

        it('getAllActiveUsers calls /users', () => {
            userService.getAllActiveUsers(1, 5);
            expect(fetchClient.get).toHaveBeenCalledWith('/users?page=1&size=5');
        });

        it('getAllInactiveUsers calls /users/archived', () => {
            userService.getAllInactiveUsers(2, 10);
            expect(fetchClient.get).toHaveBeenCalledWith('/users/archived?page=2&size=10');
        });

        it('getUserEmailById interpolates id correctly', () => {
            userService.getUserEmailById(123);
            expect(fetchClient.get).toHaveBeenCalledWith('/users/id/123/email');
        });
    });

    describe('POST methods', () => {
        it('inviteUser passes data to /users/invite', () => {
            const data = { email: 'test@test.com' };
            userService.inviteUser(data);
            expect(fetchClient.post).toHaveBeenCalledWith('/users/invite', data);
        });

        it('acceptInvite passes data to /auth/accept-invite', () => {
            const data = { token: 'abc' };
            userService.acceptInvite(data);
            expect(fetchClient.post).toHaveBeenCalledWith('/auth/accept-invite', data);
        });
    });

    describe('PUT and DELETE methods', () => {
        it('updateUserRole interpolates email and passes data', () => {
            const email = 'user@domain.com';
            const data = { role: 'ADMIN' };
            userService.updateUserRole(email, data);
            expect(fetchClient.put).toHaveBeenCalledWith('/users/user@domain.com/role', data);
        });

        it('activateUser interpolates email and calls PUT', () => {
            userService.activateUser('user@domain.com');
            expect(fetchClient.put).toHaveBeenCalledWith('/users/user@domain.com/activate');
        });

        it('deactivateUser interpolates email and calls DELETE', () => {
            userService.deactivateUser('user@domain.com');
            expect(fetchClient.delete).toHaveBeenCalledWith('/users/user@domain.com');
        });
    });
});
