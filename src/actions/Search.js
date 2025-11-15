import {spotifyFetch} from '../../api/fetch.js';
import {createArtistCardHTML, createItemCardHTML, createSongCardHTML} from './cards.js';
import renderSection from './renderSection.js';

export default async function Search(query) {
    const mainContainer = document.querySelector('.main-container');
    mainContainer.style.minHeight = '180vh';

    const searchData = await spotifyFetch(`search?q=${encodeURIComponent(query)}&type=track,artist,album,playlist,show,audiobook&limit=25`);
    const feedElement = document.querySelector('.content-feed');
    if (!feedElement) return;

    feedElement.innerHTML = `<h2 class="section-title" style="padding: 20px;">Search Results for: "${query}"</h2>`;

    if (searchData.error) {
        feedElement.innerHTML += `<p style="padding: 20px; color: red;">Error: ${searchData.error}. Please Log In again.</p>`;
        return;
    }

    let resultsFound = false;

    if (searchData.tracks?.items?.length) {
        const items = searchData.tracks.items.map(createSongCardHTML).filter(Boolean);
        if (items.length) {
            renderSection(feedElement, 'Tracks', 'song-list', items, false);
            resultsFound = true;
        }
    }

    if (searchData.artists?.items?.length) {
        const items = searchData.artists.items.map(createArtistCardHTML).filter(Boolean);
        if (items.length) {
            renderSection(feedElement, 'Artists', 'artist-list', items, false);
            resultsFound = true;
        }
    }

    if (searchData.albums?.items?.length) {
        const items = searchData.albums.items.map(createItemCardHTML).filter(Boolean);
        if (items.length) {
            renderSection(feedElement, 'Albums', 'song-list', items, false);
            resultsFound = true;
        }
    }

    if (searchData.playlists?.items?.length) {
        try {
            const items = searchData.playlists.items.map(createItemCardHTML).filter(Boolean);
            if (items.length) {
                renderSection(feedElement, 'Playlists', 'song-list', items, false);
                resultsFound = true;
            }
        } catch (e) {
            console.warn('Skipping Playlist rendering due to data error:', e);
        }
    }

    if (searchData.shows?.items?.length) {
        const items = searchData.shows.items.map(createItemCardHTML).filter(Boolean);
        if (items.length) {
            renderSection(feedElement, 'Podcasts & Shows', 'song-list', items, false);
            resultsFound = true;
        }
    }

    if (searchData.audiobooks?.items?.length) {
        const items = searchData.audiobooks.items.map(createItemCardHTML).filter(Boolean);
        if (items.length) {
            renderSection(feedElement, 'Audiobooks', 'song-list', items, false);
            resultsFound = true;
        }
    }

    if (!resultsFound) feedElement.innerHTML += `<p style="padding: 20px;">No results found for "${query}"</p>`;
}