import { fetchClient } from "./fetchClient";

const API_BASE = "/invitations";

export const invitationService = {
  getAllInvitations: async () => {
    return await fetchClient(API_BASE);
  },

  resendInvitation: async (email) => {
    return await fetchClient(`${API_BASE}/${email}/resend`, {
      method: "POST"
    });
  },

  deleteInvitation: async (email) => {
    return await fetchClient(`${API_BASE}/${email}`, {
      method: "DELETE"
    });
  }
};
