import {setAccessToken} from '../api/fetch.js';
import initApp from './initApp.js';


export default async function requestAccessToken(code, CLIENT_ID, REDIRECT_URI) {
    const codeVerifier = localStorage.getItem('code_verifier');

    if (!codeVerifier) {
        console.error("Code verifier missing. Cannot complete login.");
        return;
    }

    const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        }),
    };

    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const response = await fetch(tokenUrl, payload);
    const data = await response.json();

    if (data.access_token) {
        setAccessToken(data.access_token);
        localStorage.setItem('spotify_access_token', data.access_token);
        window.history.replaceState({}, document.title, REDIRECT_URI);
        initApp();
    } else {
        console.error('Failed to get token:', data);
        alert('Authentication failed.');
    }
}