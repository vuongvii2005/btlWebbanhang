const APP_API_BASE_URL = 'http://localhost/btlWebbanhang/api/index.php';
window.APP_API_URL = APP_API_BASE_URL;

function getAuthToken() {
    try {
        return localStorage.getItem('auth_token') || '';
    } catch (error) {
        return '';
    }
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('auth_user') || 'null');
    } catch (error) {
        localStorage.removeItem('auth_user');
        return null;
    }
}

function isLoggedIn() {
    return Boolean(getAuthToken());
}

function clearAuth() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
}

function isAuthError(error) {
    const status = Number(error?.status || error?.code || 0);
    return status === 401 || status === 403;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function hasHeader(headers, name) {
    return Object.keys(headers).some((key) => key.toLowerCase() === name.toLowerCase());
}

async function apiFetch(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = getAuthToken();
    const hasBody = options.body !== undefined && options.body !== null;
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

    if (token && !hasHeader(headers, 'Authorization')) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (hasBody && !isFormData && !hasHeader(headers, 'Content-Type')) {
        headers['Content-Type'] = 'application/json';
    }

    let response;
    try {
        response = await fetch(url, {
            credentials: 'same-origin',
            ...options,
            headers
        });
    } catch (networkError) {
        const error = new Error('Network error. Please check the connection and try again.');
        error.isNetworkError = true;
        error.cause = networkError;
        throw error;
    }

    const text = await response.text();
    let result = null;

    if (text) {
        try {
            result = JSON.parse(text);
        } catch (parseError) {
            const error = new Error('API returned invalid JSON.');
            error.status = response.status;
            error.code = response.status;
            error.responseText = text;
            error.cause = parseError;
            if (isAuthError(error)) clearAuth();
            throw error;
        }
    }

    if (!response.ok || result?.success === false) {
        const status = Number(result?.code || response.status || 0);
        const error = new Error(result?.message || `HTTP ${response.status}`);
        error.status = status;
        error.code = status;
        error.errors = result?.errors || {};
        error.data = result;
        if (isAuthError(error)) clearAuth();
        throw error;
    }

    return result;
}
