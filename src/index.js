import.meta.glob('./styles/*.css', { eager: true });

import Search from './actions/Search.js';
import { handleLogin, handleLogout, requestAccessToken } from './actions/auth.js';
import { setAccessToken } from './api/fetch.js';
import initApp from './actions/initApp.js';
import initSideMenu from './actions/initSideMenu.js';
import initContentFeed from './actions/initContentFeed.js';
import { setupPlayer } from './actions/player.js';

const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const contentFeed = document.querySelector('.content-feed');

function setupSearchHandler() {
    const searchInput = document.querySelector('.search-input');
    const handleSearch = () => { const query = searchInput.value.trim();
        if (query.length > 0) Search(query);
        else initContentFeed();
    };
    searchInput.addEventListener('keypress', e => { if (e.key === 'Enter') handleSearch(); });
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const localToken = localStorage.getItem('spotify_access_token');

    const isAuthenticatedPath = window.location.pathname === new URL(REDIRECT_URI).pathname;

    if (isAuthenticatedPath && code) {
        await requestAccessToken(code);
        initApp(handleLogin, handleLogout, initContentFeed, setupSearchHandler);
        initSideMenu();
        setupPlayer();
    } else if (localToken) {
        setAccessToken(localToken);
        initApp(handleLogin, handleLogout, initContentFeed, setupSearchHandler);
        initSideMenu();
        setupPlayer();
    } else {
        initApp(handleLogin, handleLogout, initContentFeed, setupSearchHandler);
        initSideMenu();
        setupPlayer();
        contentFeed.style.minHeight = '100vh';
    }
});
