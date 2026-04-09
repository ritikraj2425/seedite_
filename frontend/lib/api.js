// Centralized API configuration
// Change this URL when deploying to production

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Authenticated fetch wrapper.
 * - Automatically adds the Authorization header from localStorage
 * - On 401 response, clears user data and redirects to login
 * - Drop-in replacement for fetch() in all authenticated API calls
 *
 * @param {string} url - Full URL or path (if path, API_URL is prepended)
 * @param {RequestInit} options - Standard fetch options
 * @returns {Promise<Response>}
 */
async function apiFetch(url, options = {}) {
    // Build full URL if a relative path was given
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    // Inject auth header if we have a token
    let token = null;
    try {
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        token = savedUser.token;
    } catch {}

    const headers = {
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(fullUrl, { ...options, headers });

    // Auto-logout on 401 Unauthorized
    if (res.status === 401) {
        // Clear all user data
        try {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            document.cookie = 'token=; Max-Age=0; path=/;';
        } catch {}

        // Redirect to login with return URL
        if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }

        // Throw so the calling code doesn't try to parse the response
        throw new Error('Session expired. Please log in again.');
    }

    return res;
}

/**
 * Get the current user ID from localStorage.
 * Returns empty string if not logged in to prevent key collisions.
 */
function getCurrentUserId() {
    try {
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        return savedUser._id || '';
    } catch {
        return '';
    }
}

export { API_URL, apiFetch, getCurrentUserId };
