import {getAccessToken} from '../../api/fetch.js';

export default function initApp(handleLogin, handleLogout, initContentFeed, setupSearchHandler) {

    const feed = document.querySelector('.content-feed');
    const loginButton = document.querySelector('.login-button');
    if (!feed || !loginButton) return;

    const token = getAccessToken();

    if (token) {
        loginButton.textContent = 'Log Out';
        loginButton.onclick = handleLogout;
        initContentFeed().then();
        setupSearchHandler();
    } else {
        loginButton.textContent = 'Log In';
        loginButton.onclick = handleLogin;

        feed.innerHTML = `
            <div style="text-align:center; padding: 50px;">
                <h2 class="section-title">Welcome to Spotify Clone</h2>
                <p>Please log in to see your personalized music feed and recommendations.</p>
            </div>
        `;
    }
}