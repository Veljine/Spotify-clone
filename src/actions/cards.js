function escapeAttr(val) {
    return String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeHTML(val) {
    return String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function createSongCardHTML(track) {
    if (!track || typeof track !== 'object') return '';
    const rawTitle = track?.name || 'Unknown Title';
    const rawArtist = Array.isArray(track?.artists) ? track.artists.map(a => a?.name).filter(Boolean).join(', ') : 'Unknown Artist';
    const coverUrl = track?.album?.images?.[0]?.url || '/public/noIcon.png';
    const previewUrl = track?.preview_url || '';

    const isrc = track?.external_ids?.isrc || '';
    const externalUrl = track?.external_urls?.spotify || '';
    const title = escapeHTML(rawTitle);
    const artist = escapeHTML(rawArtist);
    
    return `
        <div class="song-card" data-preview="${escapeAttr(previewUrl)}" data-type="track" data-has-preview="${!!previewUrl}" data-title="${escapeAttr(rawTitle)}" data-artist="${escapeAttr(rawArtist)}" data-isrc="${escapeAttr(isrc)}" data-external-url="${escapeAttr(externalUrl)}">
            <div class="cover-wrapper">
                <img src="${escapeAttr(coverUrl)}" alt="Album Cover for ${title}" class="song-cover" onerror="this.onerror=null;this.src='/public/noIcon.png';" />
                <button class="play-button" title="${previewUrl ? 'Play Preview' : 'Try Preview'}">
                    <svg class="icon-play" xmlns="http://www.w3.org/2000/svg" fill="currentColor"  viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <svg class="icon-pause" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                </button>
            </div>
            <p class="song-title">${title}</p>
            <p class="song-artist">${artist}</p>
        </div>
    `;
}

function createArtistCardHTML(artist) {
    if (!artist || typeof artist !== 'object') return '';

    const photoUrl = artist?.images?.[0]?.url || '/public/noIcon.png';
    const nameRaw = artist?.name || 'Unknown Artist';
    const previewUrl = artist?.preview_url || '';
    const externalUrl = artist?.external_urls?.spotify || '';
    const id = artist?.id || '';

    const name = escapeHTML(nameRaw);

    return `
        <div class="artist-card" data-id="${escapeAttr(id)}" data-preview="${escapeAttr(previewUrl)}" data-type="artist" data-title="${escapeAttr(nameRaw)}" data-artist="${escapeAttr(nameRaw)}" data-external-url="${escapeAttr(externalUrl)}">
            <div class="cover-wrapper">
                <img src="${escapeAttr(photoUrl)}" alt="Photo of ${name}" class="artist-photo" style="border-radius: 50%;" onerror="this.onerror=null;this.src='/public/noIcon.png';" />
                <button class="play-button" title="${previewUrl ? 'Play Preview' : 'Try Preview'}">
                    <svg class="icon-play" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <svg class="icon-pause" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                </button>
            </div>
            <p class="artist-name">${name}</p>
            <p class="artist-role">Artist</p>
        </div>
    `;
}

function createItemCardHTML(item) {
    if (!item || typeof item !== 'object') return '';
    const rawTitle = item?.name || 'Untitled';

    const type = item?.type || 'item';

    let authors = '';
    if (type === 'audiobook' && Array.isArray(item?.authors)) {
        authors = item.authors.map(a => a?.name).filter(Boolean).join(', ');
    }

    const secondaryTextRaw =
        authors ||
        item?.description ||
        item?.owner?.display_name ||
        (Array.isArray(item?.artists) ? item.artists.map(a => a?.name).filter(Boolean).join(', ') : 'Spotify');

    let coverUrl = '/public/noIcon.png';

    if (Array.isArray(item?.images) && item.images.length) {
        const sortedImages = [...item.images].filter(img => img && typeof img === 'object').sort((a, b) => (b?.width || 0) - (a?.width || 0));
        coverUrl = sortedImages[0]?.url || coverUrl;
    }

    const previewUrl = item?.preview_url || item?.audio_preview_url || '';
    const externalUrl = item?.external_urls?.spotify || '';
    const id = item?.id || '';

    const finalPreview = /\.mp3(\?|$)/i.test(previewUrl || '') ? previewUrl : '';

    const title = escapeHTML(rawTitle);

    return `
        <div class="song-card" data-id="${escapeAttr(id)}" data-preview="${escapeAttr(finalPreview)}" data-type="${escapeAttr(type)}" data-has-preview="${!!finalPreview}" data-title="${escapeAttr(rawTitle)}" data-artist="${escapeAttr(secondaryTextRaw)}" data-authors="${escapeAttr(authors)}" data-external-url="${escapeAttr(externalUrl)}">
            <div class="cover-wrapper">
                <img src="${escapeAttr(coverUrl)}" alt="Cover for ${title}" class="song-cover" onerror="this.onerror=null;this.src='/public/noIcon.png';" />
                <button class="play-button" title="${finalPreview ? 'Play Preview' : externalUrl ? 'Try Preview' : 'No Preview'}">
                    <svg class="icon-play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <svg class="icon-pause" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                    </svg>
                </button>
            </div>
            <p class="song-title">${title}</p>
        </div>
    `;
}

export { createSongCardHTML, createArtistCardHTML, createItemCardHTML };
