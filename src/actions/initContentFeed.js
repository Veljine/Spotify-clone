import {spotifyFetch} from '../api/fetch.js';
import {createArtistCardHTML, createItemCardHTML, createSongCardHTML} from './cards.js';
import renderSection from './renderSection.js';

function filterAvailable(items, market = "US") {
    return items?.filter(i =>
        i?.available_markets?.includes(market)
    ) || [];
}

export default async function initContentFeed() {
    const feedElement = document.querySelector('.content-feed');
    if (!feedElement) return;

    feedElement.innerHTML = '<p style="padding: 20px;">Loading personalized content...</p>';

    const topTracksData = await spotifyFetch('me/top/tracks?limit=25');
    const topArtistsData = await spotifyFetch('me/top/artists?limit=25');
    const topPlaylistsData = await spotifyFetch('me/playlists?limit=25');
    const topPodcastsData = await spotifyFetch('me/shows?limit=25');

    const audiobookSearch = await spotifyFetch(
        'search?q=bestseller%20audiobook&type=audiobook&limit=25'
    );
    const topAudiobooksData = audiobookSearch?.audiobooks;


    const seedTracks = Array.isArray(topTracksData?.items)
        ? topTracksData.items
            .filter(t => t?.id && typeof t.id === 'string')
            .slice(0, 3)
            .map(t => t.id)
        : [];

    const seedArtists = Array.isArray(topArtistsData?.items)
        ? topArtistsData.items
            .filter(a => a?.id && typeof a.id === 'string')
            .slice(0, 3)
            .map(a => a.id)
        : [];

    if (seedTracks.length === 0 && seedArtists.length === 0) {
        seedTracks.push('4uLU6hMCjMI75M1A2tKUQC');
    }

    let recommendationsData = null;

    function chooseSeeds(arr, count = 2) {
        return Array.isArray(arr)
            ? arr.slice(0, count).map(x => x.id).filter(Boolean)
            : [];
    }

    try {
        const seedTracks = chooseSeeds(validTopTracks, 2);
        const seedArtists = chooseSeeds(validTopArtists, 2);

        const params = new URLSearchParams({ limit: "25", market: "from_token" });

        if (seedTracks.length >= 1) {
            params.append("seed_tracks", seedTracks.join(","));
        } else if (seedArtists.length >= 1) {
            params.append("seed_artists", seedArtists.join(","));
        } else {
            params.append("seed_genres", "pop");
        }

        console.log("RECOMMENDATION URL:", `recommendations?${params.toString()}`);

        let recResponse = await spotifyFetch(`recommendations?${params.toString()}`);

        if (recResponse?.tracks?.length) {
            recommendationsData = recResponse;
        } else {
            const retryParams = new URLSearchParams({
                limit: "25",
                market: "from_token",
                seed_tracks: "4uLU6hMCjMI75M1A2tKUQC,1301WleyT98MSxVHPZCA6M"
            });

            console.log("RECOMMENDATION RETRY URL:", `recommendations?${retryParams.toString()}`);

            recResponse = await spotifyFetch(`recommendations?${retryParams.toString()}`);

            if (recResponse?.tracks?.length) {
                recommendationsData = recResponse;
            } else {
                console.log("Recommendations empty even after retry:", recResponse?.error || "no tracks");
            }
        }
    } catch (err) {
        console.log("Error occurred while fetching recommendations: ", err);
    }


    feedElement.innerHTML = '';

    if (topPodcastsData?.items?.length) {
        renderSection(feedElement, 'Your Podcasts & Shows', 'song-list',
            topPodcastsData.items.map(item => createItemCardHTML(item.show)));
    }



    if (topPlaylistsData?.items?.length) {
        renderSection(feedElement, 'Your Playlists', 'song-list',
            topPlaylistsData.items.map(createItemCardHTML));
    }

    if (recommendationsData?.tracks?.length) {
        renderSection(feedElement, 'Recommended For You', 'song-list',
            recommendationsData.tracks.map(createSongCardHTML));
    }

    if (!recommendationsData && !topTracksData?.items?.length && !topArtistsData?.items?.length) {
        feedElement.innerHTML = `
            <p style="padding: 20px;">
                Could not load personalized content. Play some music on Spotify to generate data!
            </p>
        `;
    }

    if (topTracksData?.items?.length) {
        renderSection(feedElement, 'Your Top Tracks', 'song-list',
            topTracksData.items.map(createSongCardHTML));
    }

    if (topArtistsData?.items?.length) {
        renderSection(feedElement, 'Your Popular Artists', 'artist-list',
            topArtistsData.items.map(createArtistCardHTML));
    }

    if (topAudiobooksData?.items?.length) {
        renderSection(feedElement, 'Audiobooks', 'song-list',
            topAudiobooksData.items.map(createItemCardHTML));
    }
}