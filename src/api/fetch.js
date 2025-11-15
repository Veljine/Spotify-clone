const SPOTIFY_BASE_URL = import.meta.env.VITE_SPOTIFY_BASE_URL;

let currentAccessToken = '';

export function setAccessToken(token) {
    currentAccessToken = token;
    localStorage.setItem('spotify_access_token', token);
}

export function getAccessToken() {
    if (!currentAccessToken) {
        currentAccessToken = localStorage.getItem('spotify_access_token') || '';
    }
    return currentAccessToken;
}

export async function spotifyFetch(endpoint) {
    const token = getAccessToken();
    if (!token) {
        console.warn('No Spotify token available');
        return { error: 'Authentication required' };
    }

    const url = `${SPOTIFY_BASE_URL}/${endpoint}`;
    const options = {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const res = await fetch(url, options);

        if (res.status === 401) {
            console.log('Spotify token expired or invalid');
            localStorage.removeItem('spotify_access_token');
            return { error: 'Token expired' };
        }

        if (!res.ok) {
            const text = await res.text();
            console.log(`Spotify fetch error (${res.status}): ${text}`);
            return { error: `HTTP ${res.status}` };
        }

        return await res.json();
    } catch (err) {
        console.log('Network or fetch error:', err);
        return { error: 'Network error' };
    }
}
