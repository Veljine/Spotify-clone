import { resolvePreviewForCard as resolvePreviewForCardBasic, findDeezerPreviewByISRC, findDeezerPreviewByMeta } from '../../api/deezer.js';
import { spotifyFetch } from '../api/fetch.js';

let currentAudio = null;
let currentActiveCardButton = null;
let playerPlayPauseButton = null;
let prevButton = null;
let nextButton = null;
let progressBar = null;
let currentTimeEl = null;
let durationEl = null;
let volumeSlider = null;
let currentVolume = 0.8;

function getPlayableButtons() {
    return Array.from(document.querySelectorAll('.play-button'));
}

function formatTime(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function isAudioUrl(url) {
    return /\.mp3(\?|$)/i.test(url || '');
}

async function resolveTrackPreviewByMeta(title, artist, isrc) {
    if (isrc) {
        const url = await findDeezerPreviewByISRC(isrc);
        if (url) return url;
    }
    if (title || artist) {
        const url = await findDeezerPreviewByMeta(title || '', artist || '');
        if (url) return url;
    }
    return '';
}

async function resolvePlaylistFirstTrack(playlistId) {
    if (!playlistId) return null;
    const data = await spotifyFetch(`playlists/${playlistId}/tracks?limit=50&market=from_token`);
    const items = Array.isArray(data?.items) ? data.items : [];
    for (const it of items) {
        const t = it?.track;
        if (!t) continue;
        const preview = t.preview_url || '';
        const title = t.name || '';
        const artist = Array.isArray(t.artists) ? t.artists.map(a => a?.name).filter(Boolean).join(', ') : '';
        if (isAudioUrl(preview)) return { url: preview, title, artist };
        const isrc = t?.external_ids?.isrc || '';
        const deezer = await resolveTrackPreviewByMeta(title, artist, isrc);
        if (deezer) return { url: deezer, title, artist };
    }
    return null;
}

async function resolveArtistTopTrack(artistId) {
    if (!artistId) return null;

    const data = await spotifyFetch(`artists/${artistId}/top-tracks?market=from_token`);
    const tracks = Array.isArray(data?.tracks) ? data.tracks : [];
    for (const t of tracks) {
        const preview = t.preview_url || '';
        const title = t.name || '';
        const artist = Array.isArray(t.artists) ? t.artists.map(a => a?.name).filter(Boolean).join(', ') : '';
        if (isAudioUrl(preview)) return { url: preview, title, artist };
        const isrc = t?.external_ids?.isrc || '';
        const deezer = await resolveTrackPreviewByMeta(title, artist, isrc);
        if (deezer) return { url: deezer, title, artist };
    }
    return null;
}

async function resolveAlbumFirstTrack(albumId) {
    if (!albumId) return null;
    const data = await spotifyFetch(`albums/${albumId}/tracks?limit=50&market=from_token`);
    const tracks = Array.isArray(data?.items) ? data.items : [];
    for (const t of tracks) {
        const preview = t.preview_url || '';
        const title = t.name || '';
        const artist = Array.isArray(t.artists) ? t.artists.map(a => a?.name).filter(Boolean).join(', ') : '';
        if (isAudioUrl(preview)) return { url: preview, title, artist };
        const isrc = t?.external_ids?.isrc || '';
        const deezer = await resolveTrackPreviewByMeta(title, artist, isrc);
        if (deezer) return { url: deezer, title, artist };
    }
    return null;
}

async function resolveShowEpisodePreview(showId) {
    if (!showId) return null;
    const data = await spotifyFetch(`shows/${showId}/episodes?limit=50&market=from_token`);
    const items = Array.isArray(data?.items) ? data.items : [];
    for (const ep of items) {
        const p = ep?.audio_preview_url || '';
        const title = ep?.name || '';
        const artist = ep?.show?.publisher || ep?.show?.name || '';
        if (isAudioUrl(p)) return { url: p, title, artist };
        const deezer = await findDeezerPreviewByMeta(title, artist);
        if (deezer) return { url: deezer, title, artist };
    }
    return null;
}

async function resolveAudiobookChapterPreview(audiobookId) {
    if (!audiobookId) return null;

    const chaptersData = await spotifyFetch(`audiobooks/${audiobookId}/chapters?limit=50&market=from_token`);
    const items = Array.isArray(chaptersData?.items) ? chaptersData.items : [];
    for (const ch of items) {
        const p = ch?.audio_preview_url || '';
        const title = ch?.name || '';
        const artist = ch?.chapter_number ? `Chapter ${ch.chapter_number}` : 'Audiobook';
        if (isAudioUrl(p)) return { url: p, title, artist };
        const deezer = await findDeezerPreviewByMeta(title, artist);
        if (deezer) return { url: deezer, title, artist };
    }

    const book = await spotifyFetch(`audiobooks/${audiobookId}?market=from_token`);
    const bookTitle = book?.name || '';
    const authors = Array.isArray(book?.authors) ? book.authors.map(a => a?.name).filter(Boolean).join(', ') : '';
    if (bookTitle || authors) {
        const deezerBook = await findDeezerPreviewByMeta(bookTitle, authors);
        if (deezerBook) return { url: deezerBook, title: bookTitle, artist: authors || 'Audiobook' };
    }

    return null;
}

async function resolvePlayableFromCard(card) {
    if (!card) return null;
    const dataset = card.dataset || {};
    const type = (dataset.type || '').toLowerCase();
    const id = dataset.id || '';
    const title = dataset.title || '';
    const artist = dataset.artist || '';
    const isrc = dataset.isrc || '';

    let preview = dataset.preview || '';
    if (isAudioUrl(preview)) {
        return { url: preview, title, artist };
    }

    if (type === 'track') {
        const url = await resolveTrackPreviewByMeta(title, artist, isrc);
        if (url) {
            card.dataset.preview = url;
            card.dataset.hasPreview = 'true';
            return { url, title, artist };
        }
        return null;
    }

    if (type === 'playlist') {
        const res = await resolvePlaylistFirstTrack(id);
        if (res?.url) {
            card.dataset.preview = res.url;
            card.dataset.hasPreview = 'true';
            return res;
        }
        return null;
    }

    if (type === 'artist') {
        const res = await resolveArtistTopTrack(id);
        if (res?.url) {
            card.dataset.preview = res.url;
            card.dataset.hasPreview = 'true';
            return res;
        }
        const basic = await resolvePreviewForCardBasic(card);
        if (basic) {
            card.dataset.preview = basic;
            card.dataset.hasPreview = 'true';
            return { url: basic, title, artist };
        }
        return null;
    }

    if (type === 'album') {
        const res = await resolveAlbumFirstTrack(id);
        if (res?.url) {
            card.dataset.preview = res.url;
            card.dataset.hasPreview = 'true';
            return res;
        }
        return null;
    }

    if (type === 'show' || type === 'podcast') {
        const res = await resolveShowEpisodePreview(id);
        if (res?.url) {
            card.dataset.preview = res.url;
            card.dataset.hasPreview = 'true';
            return res;
        }
        return null;
    }

    if (type === 'audiobook') {
        const res = await resolveAudiobookChapterPreview(id);
        if (res?.url) {
            card.dataset.preview = res.url;
            card.dataset.hasPreview = 'true';
            return res;
        }
        return null;
    }

    const url = await resolveTrackPreviewByMeta(title, artist, isrc);
    if (url) {
        card.dataset.preview = url;
        card.dataset.hasPreview = 'true';
        return { url, title, artist };
    }

    return null;
}

export function setupPlayer() {
    playerPlayPauseButton = document.querySelector('.player-playpause');
    prevButton = document.querySelector('.control-btn.prev');
    nextButton = document.querySelector('.control-btn.next');
    progressBar = document.querySelector('.player-progress .progress-bar');
    currentTimeEl = document.querySelector('.player-progress .current-time');
    durationEl = document.querySelector('.player-progress .duration');
    volumeSlider = document.querySelector('.player-volume .volume-slider');

    if (volumeSlider) {
        const initial = parseFloat(volumeSlider.value);
        if (!Number.isNaN(initial)) currentVolume = initial;
        volumeSlider.addEventListener('input', () => {
            const v = parseFloat(volumeSlider.value);
            if (!Number.isNaN(v)) {
                currentVolume = v;
                if (currentAudio) currentAudio.volume = v;
            }
        });
    }

    if (playerPlayPauseButton) {
        playerPlayPauseButton.addEventListener('click', () => {
            togglePlayPause();
        });
    }

    if (prevButton) {
        prevButton.addEventListener('click', () => playPrev());
    }
    if (nextButton) {
        nextButton.addEventListener('click', () => playNext());
    }

    if (progressBar) {
        progressBar.addEventListener('input', () => {
            if (currentAudio && !isNaN(currentAudio.duration)) {
                currentAudio.currentTime = Number(progressBar.value);
                if (currentTimeEl) currentTimeEl.textContent = formatTime(currentAudio.currentTime);
            }
        });
    }

    document.addEventListener('click', e => {
        if (e.target.closest('.play-button')) return;
        const artistCard = e.target.closest('.content-feed .artist-card');
        if (!artistCard) return;
        const external = artistCard.dataset.externalUrl || artistCard.getAttribute('data-external-url') || '';
        if (external) {
            try { window.open(external, '_blank'); } catch {}
        }
    });

    document.addEventListener('click', async e => {
        const btn = e.target.closest('.play-button');
        if (!btn) return;

        const card = btn.closest('[data-preview]');
        if (!card) return;

        const resolved = await resolvePlayableFromCard(card);
        const previewUrl = resolved?.url || '';
        const cover = resolved?.cover || (card.querySelector('.song-cover, .artist-photo') || {}).src || '';
        const title = resolved?.title || (card.querySelector('.song-title, .artist-name') || {}).textContent || '';
        const artist = resolved?.artist || (card.querySelector('.song-artist, .artist-role') || {}).textContent || '';
        const artistFiltered = artist.substring(0, 85);

        if (!previewUrl) {
            const external = card.dataset.externalUrl || card.getAttribute('data-external-url') || '';
            if (external) {
                try { window.open(external, '_blank'); } catch {}
            }
            return;
        }

        if (currentActiveCardButton === btn) {
            togglePlayPause();
        } else {
            playTrack(previewUrl, cover, title, artistFiltered, btn);
        }
    });
}

function wireAudioEvents() {
    if (!currentAudio) return;

    currentAudio.addEventListener('timeupdate', () => {
        if (progressBar) progressBar.value = currentAudio.currentTime || 0;
        if (currentTimeEl) currentTimeEl.textContent = formatTime(currentAudio.currentTime || 0);
    });

    currentAudio.addEventListener('loadedmetadata', () => {
        if (progressBar && isFinite(currentAudio.duration)) {
            progressBar.max = String(currentAudio.duration);
        }
        if (durationEl) durationEl.textContent = formatTime(currentAudio.duration || 0);
    });

    currentAudio.onended = () => {
        playNext();
    };
}

function playTrack(previewUrl, cover, title, artistFiltered, clickedButton) {
    if (currentAudio) {
        try { currentAudio.pause(); } catch {}
        currentAudio = null;
    }

    if (currentActiveCardButton) {
        currentActiveCardButton.classList.remove('playing');
    }

    currentAudio = new Audio(previewUrl);
    try { currentAudio.volume = Math.min(1, Math.max(0, currentVolume)); } catch {}

    const playerBar = document.querySelector('.player-bar');
    if (playerBar) {
        const coverEl = playerBar.querySelector('.player-cover');
        if (coverEl) coverEl.src = cover || coverEl.src;
        const titleEl = playerBar.querySelector('.player-title');
        if (titleEl) titleEl.textContent = title || '';
        const artistEl = playerBar.querySelector('.player-artist');
        if (artistEl) artistEl.textContent = artistFiltered || '';
    }

    if (playerPlayPauseButton) playerPlayPauseButton.classList.add('playing');
    if (clickedButton) clickedButton.classList.add('playing');
    currentActiveCardButton = clickedButton || null;

    wireAudioEvents();

    const playPromise = currentAudio.play();
    if (playPromise && typeof playPromise.then === 'function') {
        playPromise.catch(err => {
            console.log('Audio play failed:', err);
            if (playerPlayPauseButton) playerPlayPauseButton.classList.remove('playing');
            if (currentActiveCardButton) currentActiveCardButton.classList.remove('playing');
        });
    }
}

function togglePlayPause() {
    if (!currentAudio) return;

    if (currentAudio.paused) {
        currentAudio.play().then(() => {
            if (playerPlayPauseButton) playerPlayPauseButton.classList.add('playing');
            if (currentActiveCardButton) currentActiveCardButton.classList.add('playing');
        }).catch(() => {});
    } else {
        currentAudio.pause();
        if (playerPlayPauseButton) playerPlayPauseButton.classList.remove('playing');
        if (currentActiveCardButton) currentActiveCardButton.classList.remove('playing');
    }
}

function playNext() {
    const playable = getPlayableButtons();
    if (!playable.length) return;
    let idx = currentActiveCardButton ? playable.indexOf(currentActiveCardButton) : -1;
    idx = (idx + 1 + playable.length) % playable.length;
    const btn = playable[idx];
    if (btn) btn.click();
}

function playPrev() {
    const playable = getPlayableButtons();
    if (!playable.length) return;
    let idx = currentActiveCardButton ? playable.indexOf(currentActiveCardButton) : 0;
    idx = (idx - 1 + playable.length) % playable.length;
    const btn = playable[idx];
    if (btn) btn.click();
}