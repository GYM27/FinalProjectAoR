import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { fetchClient } from '../fetchClient';
import { useAuthStore } from '../../store/useAuthStore';

describe('fetchClient API Interceptor', () => {
    let originalFetch;
    let originalCookie;
    let originalLocation;
    let logoutSpy;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Spy no zustand store
        logoutSpy = vi.spyOn(useAuthStore.getState(), 'logout').mockImplementation(() => {});

        // Mock nativo do fetch
        originalFetch = global.fetch;
        global.fetch = vi.fn();

        // Mock document.cookie para testar tokens CSRF
        originalCookie = Object.getOwnPropertyDescriptor(document, 'cookie');
        Object.defineProperty(document, 'cookie', {
            writable: true,
            value: ''
        });

        // Mock window.location para testar redirecionamentos forçados
        originalLocation = window.location;
        delete window.location;
        window.location = { href: '' };
    });

    afterEach(() => {
        logoutSpy.mockRestore();
        global.fetch = originalFetch;
        if (originalCookie) {
            Object.defineProperty(document, 'cookie', originalCookie);
        }
        window.location = originalLocation;
    });

    it('appends /api prefix and sets default credentials to include', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
            headers: new Headers()
        });

        await fetchClient('/users');

        expect(global.fetch).toHaveBeenCalledTimes(1);
        const [url, options] = global.fetch.mock.calls[0];
        
        expect(url).toBe('/api/users');
        expect(options.credentials).toBe('include');
        expect(options.headers['Content-Type']).toBe('application/json');
    });

    it('injects XSRF-TOKEN if it exists in cookies', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true }),
            headers: new Headers()
        });

        document.cookie = 'XSRF-TOKEN=test-token-123; other=cookie';

        await fetchClient('/test');

        const [, options] = global.fetch.mock.calls[0];
        expect(options.headers['X-XSRF-TOKEN']).toBe('test-token-123');
    });

    it('throws error and redirects to login on 401 Unauthorized', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ error: 'Unauthorized' }),
            headers: new Headers()
        });

        await expect(fetchClient('/protected')).rejects.toThrow('Unauthorized');

        await waitFor(() => {
            expect(logoutSpy).toHaveBeenCalledTimes(1);
            expect(window.location.href).toBe('/login');
        });
    });

    it('throws error and redirects if response is 200 OK but content-type is text/html (Spring Security Auth redirect)', async () => {
        const headers = new Headers();
        headers.set('content-type', 'text/html; charset=UTF-8');
        
        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => { throw new Error('Not JSON') },
            headers: headers
        });

        await expect(fetchClient('/test')).rejects.toThrow('Session expired');
        
        await waitFor(() => {
            expect(logoutSpy).toHaveBeenCalledTimes(1);
            expect(window.location.href).toBe('/login');
        });
    });

    it('convenience method: get', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}), headers: new Headers() });
        await fetchClient.get('/path');
        expect(global.fetch.mock.calls[0][1].method).toBe('GET');
    });

    it('convenience method: post with body stringification', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}), headers: new Headers() });
        const body = { name: 'Test' };
        await fetchClient.post('/path', body);
        
        const options = global.fetch.mock.calls[0][1];
        expect(options.method).toBe('POST');
        expect(options.body).toBe(JSON.stringify(body));
    });

    it('convenience method: upload omits Content-Type header for boundaries to work', async () => {
        global.fetch.mockResolvedValueOnce({ 
            ok: true, 
            json: async () => ({ success: true }), 
            headers: new Headers() 
        });
        
        const formData = new FormData();
        formData.append('file', new Blob(['test']), 'test.txt');

        await fetchClient.upload('/upload', formData);

        const options = global.fetch.mock.calls[0][1];
        expect(options.method).toBe('POST');
        expect(options.body).toBe(formData);
        expect(options.headers['Content-Type']).toBeUndefined();
    });
});
