const API_BASE_URL = '/api';

/**
 * Helper to extract a cookie by name
 */
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

/**
 * Custom HTTP client that wraps the native Fetch API.
 * Automatically configures the base URL and injects the credentials: 'include' parameter.
 * This is mandatory for the browser to send and save the JSESSIONID cookie to maintain the Spring Boot session.
 * 
 * @async
 * @param {string} endpoint - The relative API endpoint (e.g., "/simulations").
 * @param {RequestInit} [options={}] - Standard Fetch API options (method, headers, body, etc.).
 * @returns {Promise<any>} The parsed JSON response or null (for 204 No Content).
 * @throws {Error} When the HTTP response status is not OK (2xx).
 */
export const fetchClient = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    ...options,
    // ESSENTIAL: Allows sending/receiving session cookies (JSESSIONID) in CORS
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken) {
    defaultOptions.headers['X-XSRF-TOKEN'] = csrfToken;
  }

  // Update activity timestamp in local store so it stays in sync with backend session
  import('../store/useAuthStore').then(module => {
    module.useAuthStore.getState().updateActivity();
  });

  const response = await fetch(url, defaultOptions);

  if (!response.ok) {
    let errorMessage = 'A server error occurred.';
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      console.error("Failed to parse JSON error response:", e);
    }

    if (response.status === 401) {
      // Automatically log out on unauthorized (session expired)
      import('../store/useAuthStore').then(module => {
        module.useAuthStore.getState().logout();
        window.location.href = '/login';
      });
    }

    throw new Error(errorMessage);
  }

  // Spring Security often redirects unauthenticated API requests to a default HTML login page (returning 200 OK)
  // If we receive HTML instead of JSON from an API, it means the session is invalid.
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("text/html")) {
    import('../store/useAuthStore').then(module => {
      module.useAuthStore.getState().logout();
      window.location.href = '/login';
    });
    throw new Error('Session expired');
  }

  try {
    return await response.json();
  } catch (e) {
    return null;
  }
};

// =========================================================
// CONVENIENCE METHODS (Shortcuts)
// Created so we don't have to write method and JSON.stringify on every request!
// =========================================================

fetchClient.get = (endpoint, options = {}) =>
  fetchClient(endpoint, { ...options, method: 'GET' });

fetchClient.post = (endpoint, body, options = {}) => {
  const reqOptions = { ...options, method: 'POST' };
  if (body) reqOptions.body = JSON.stringify(body);
  return fetchClient(endpoint, reqOptions);
};

fetchClient.put = (endpoint, body, options = {}) => {
  const reqOptions = { ...options, method: 'PUT' };
  if (body) reqOptions.body = JSON.stringify(body);
  return fetchClient(endpoint, reqOptions);
};

fetchClient.delete = (endpoint, options = {}) =>
  fetchClient(endpoint, { ...options, method: 'DELETE' });

// Method for multipart/form-data uploads (e.g. JSON scenario files).
// We deliberately omit 'Content-Type' so the browser sets it with the correct boundary.
fetchClient.upload = (endpoint, formData, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = { ...options.headers };
  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken) {
    headers['X-XSRF-TOKEN'] = csrfToken;
  }

  import('../store/useAuthStore').then(module => {
    module.useAuthStore.getState().updateActivity();
  });

  return fetch(url, {
    ...options,
    method: 'POST',
    credentials: 'include',
    headers: headers,
    body: formData,
    // Do NOT set Content-Type here — browser does it automatically for FormData
  }).then(async (response) => {
    if (!response.ok) {
      if (response.status === 401) {
        import('../store/useAuthStore').then(module => {
          module.useAuthStore.getState().logout();
          window.location.href = '/login';
        });
      }
      const text = await response.text();
      throw new Error(text || 'Upload failed');
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      import('../store/useAuthStore').then(module => {
        module.useAuthStore.getState().logout();
        window.location.href = '/login';
      });
      throw new Error('Session expired');
    }

    return response.json();
  });
};

export default fetchClient;
