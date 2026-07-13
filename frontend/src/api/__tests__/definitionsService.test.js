import { describe, it, expect, vi, beforeEach } from 'vitest';
import { definitionsService } from '../definitionsService';
import fetchClient from '../fetchClient';

// Falsificamos (Mock) os métodos do fetchClient para não realizarmos chamadas reais de rede
vi.mock('../fetchClient', () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
        post: vi.fn(),
        delete: vi.fn()
    }
}));

describe('definitionsService API Layer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getDefinitions calls fetchClient.get with /settings', () => {
        definitionsService.getDefinitions();
        expect(fetchClient.get).toHaveBeenCalledWith('/settings');
        expect(fetchClient.get).toHaveBeenCalledTimes(1);
    });

    it('saveDefinitions calls fetchClient.put with /settings and correct data payload', () => {
        const mockData = { test: 'data' };
        definitionsService.saveDefinitions(mockData);
        expect(fetchClient.put).toHaveBeenCalledWith('/settings', mockData);
        expect(fetchClient.put).toHaveBeenCalledTimes(1);
    });
});
