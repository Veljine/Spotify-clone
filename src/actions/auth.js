import { setAccessToken } from '../api/fetch.js';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const AUTH_URL = 'https://accounts.spotify.com/authorize';
const SCOPES =
    'user-top-read user-read-private user-read-email playlist-read-private user-read-recently-played user-library-read';

function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(values, v => possible[v % possible.length]).join('');
}

async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return crypto.subtle.digest('SHA-256', data);
}

function base64urlencode(input) {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

async function generateCodeChallenge(verifier) {
    const hashed = await sha256(verifier);
    return base64urlencode(hashed);
}

export async function handleLogin() {
    if (!CLIENT_ID || !REDIRECT_URI) {
        alert('Client ID or Redirect URI is missing. Check your .env file!');
        return;
    }

    const codeVerifier = generateRandomString(64);
    localStorage.setItem('code_verifier', codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        response_type: 'code',
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
    });

    window.location.href = `${AUTH_URL}?${params.toString()}`;
}

export async function requestAccessToken(code) {
    const codeVerifier = localStorage.getItem('code_verifier');
    if (!codeVerifier) {
        console.error('Code verifier missing. Cannot complete login.');
        return;
    }

    const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: REDIRECT_URI,
            code_verifier: codeVerifier,
        }),
    };

    try {
        const res = await fetch('https://accounts.spotify.com/api/token', payload);
        const data = await res.json();

        if (data.access_token) {
            setAccessToken(data.access_token);
            localStorage.setItem('spotify_access_token', data.access_token);
            window.history.replaceState({}, document.title, REDIRECT_URI);
        } else {
            console.error('Failed to get token:', data);
            alert('Authentication failed. Please try again.');
        }
    } catch (err) {
        console.error('Error requesting token:', err);
    }
}

export function handleLogout() {
    setAccessToken('');
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('code_verifier');
    window.location.reload();
}
