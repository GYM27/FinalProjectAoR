import fetchClient from "./fetchClient";

export const definitionsService = {

    getDefinitions: () => fetchClient.get('/settings'),
    saveDefinitions: (definitions) => fetchClient.put('/settings', definitions),

}
