const DEEZER_BASE = import.meta.env.PROD
    ? '/api/deezer'
    : '/deezer';

async function deezerFetch(path) {
    let url;
    if (import.meta.env.PROD) {
        url = `/api/deezer?path=${encodeURIComponent(path.replace(/^\/+/, ''))}`;
    } else {
        url = `/deezer${path.startsWith('/') ? '' : '/'}${path}`;
    }

    try {
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        console.warn('Deezer fetch failed', e);
        return null;
    }
}

export async function findDeezerPreviewByISRC(isrc) {
    if (!isrc) return '';

    const data = await deezerFetch(`/search/track?q=${encodeURIComponent(`isrc:"${isrc}"`)}`);
    const track = data?.data?.find(t => typeof t?.preview === 'string' && t.preview);
    return track?.preview || '';
}

export async function findDeezerPreviewByMeta(title, artist) {
    const qParts = [];
    if (title) qParts.push(`track:"${title}"`);
    if (artist) qParts.push(`artist:"${artist}"`);
    const q = qParts.length ? qParts.join(' ') : (title || artist || '');
    if (!q) return '';

    let data = await deezerFetch(`/search/track?q=${encodeURIComponent(q)}`);
    let track = data?.data?.find(t => typeof t?.preview === 'string' && t.preview);
    if (track?.preview) return track.preview;

    data = await deezerFetch(`/search?q=${encodeURIComponent(q)}`);
    track = data?.data?.find(t => typeof t?.preview === 'string' && t.preview);
    return track?.preview || '';
}

export async function resolvePreviewForCard(cardEl) {
    const dataset = cardEl?.dataset || {};
    const existing = dataset.preview || '';
    if (/\.mp3(\?|$)/i.test(existing)) return existing;

    const isrc = dataset.isrc || '';
    let url = await findDeezerPreviewByISRC(isrc);
    if (url) return url;

    const title = dataset.title || (cardEl.querySelector('.song-title, .artist-name')?.textContent || '');
    const artist = dataset.artist || (cardEl.querySelector('.song-artist, .artist-role')?.textContent || '');
    url = await findDeezerPreviewByMeta(title, artist);
    return url || '';
}
