import fetchClient from "./fetchClient";

export const userService = {

    getUsers: (page, size, isActive) => {
        if (isActive === true) {
            return fetchClient.get(`/users?page=${page}&size=${size}`); // Ativos
        } else if (isActive === false) {
            return fetchClient.get(`/users/archived?page=${page}&size=${size}`); // Inativos
        } else {
            return fetchClient.get(`/users/allUsers?page=${page}&size=${size}`); // Todos
        }
    },

    getUserStats: () => fetchClient.get('/users/stats'),
    getAllUsers: (page, size) => fetchClient.get(`/users/allUsers?page=${page}&size=${size}`),
    getAllActiveUsers: (page, size) => fetchClient.get(`/users?page=${page}&size=${size}`),
    getAllInactiveUsers: (page, size) => fetchClient.get(`/users/archived?page=${page}&size=${size}`),
    inviteUser: (userData) => fetchClient.post('/users/invite', userData),
    acceptInvite: (data) => fetchClient.post('/auth/accept-invite', data),
    updateUserRole: (email, userData) => fetchClient.put(`/users/${email}/role`, userData),
    deactivateUser: (email) => fetchClient.delete(`/users/${email}`),
    activateUser: (email) => fetchClient.put(`/users/${email}/activate`),
    getUserEmailById: (id) => fetchClient.get(`/users/id/${id}/email`),

};
