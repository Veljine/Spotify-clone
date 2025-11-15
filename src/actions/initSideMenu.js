import { spotifyFetch } from '../../api/fetch.js';
import { createArtistCardHTML, createItemCardHTML, createSongCardHTML } from './cards.js';

const cache = {
  tracks: null,
  artists: null,
  albums: null,
  playlists: null,
  podcasts: null,
};

function qs(sel) { return document.querySelector(sel); }

function normalizeStr(s) { return (s || '').toString().toLowerCase(); }

function filterByQuery(items, query, extractor) {
  if (!query) return items;
  const q = normalizeStr(query);
  return items.filter(it => {
    const text = normalizeStr(extractor(it));
    return text.includes(q);
  });
}

function renderList(container, htmlItems) {
  container.innerHTML = htmlItems.join('');
}

async function fetchCategory(category) {
  if (cache[category]) return cache[category];

  switch (category) {
    case 'tracks': {
      const data = await spotifyFetch('me/tracks?limit=50&market=from_token');
      const items = Array.isArray(data?.items) ? data.items.map(it => it?.track).filter(Boolean) : [];
      cache.tracks = items;
      return items;
    }
    case 'artists': {
      const data = await spotifyFetch('me/following?type=artist&limit=50');
      let items = Array.isArray(data?.artists?.items) ? data.artists.items : [];

      if (!items.length) {
        const top = await spotifyFetch('me/top/artists?limit=50');
        if (Array.isArray(top?.items)) items = top.items;
      }

      if (!items.length) {
        const tracks = await fetchCategory('tracks');
        const unique = new Map();
        (tracks || []).forEach(t => {
          (Array.isArray(t?.artists) ? t.artists : []).forEach(a => {
            const key = a?.id || (a?.name || '').toLowerCase();
            if (key && !unique.has(key)) unique.set(key, a);
          });
        });
        items = Array.from(unique.values());
      }

      cache.artists = items;
      return items;
    }
    case 'albums': {
      const data = await spotifyFetch('me/albums?limit=50&market=from_token');
      const items = Array.isArray(data?.items) ? data.items.map(it => it?.album).filter(Boolean) : [];
      cache.albums = items;
      return items;
    }
    case 'playlists': {
      const data = await spotifyFetch('me/playlists?limit=50');
      const items = Array.isArray(data?.items) ? data.items : [];
      cache.playlists = items;
      return items;
    }
    case 'podcasts': {
      const data = await spotifyFetch('me/shows?limit=50');
      const items = Array.isArray(data?.items) ? data.items.map(it => it?.show).filter(Boolean) : [];
      cache.podcasts = items;
      return items;
    }
    default:
      return [];
  }
}

function toCards(category, items) {
  switch (category) {
    case 'tracks': return items.map(createSongCardHTML).filter(Boolean);
    case 'artists': return items.map(createArtistCardHTML).filter(Boolean);
    case 'albums':
    case 'playlists':
    case 'podcasts': return items.map(createItemCardHTML).filter(Boolean);
    default: return [];
  }
}

function itemTextExtractor(category) {
  return (it) => {
    switch (category) {
      case 'tracks': return `${it?.name || ''} ${(Array.isArray(it?.artists) ? it.artists.map(a=>a?.name).join(', ') : '')}`;
      case 'artists': return it?.name || '';
      case 'albums': return `${it?.name || ''} ${(Array.isArray(it?.artists) ? it.artists.map(a=>a?.name).join(', ') : '')}`;
      case 'playlists': return `${it?.name || ''} ${it?.owner?.display_name || ''}`;
      case 'podcasts': return `${it?.name || ''} ${it?.publisher || ''}`;
      default: return '';
    }
  };
}

function attachSidebarCardHandlers() {
    const cards = document.querySelectorAll('.sidebar-items .artist-card');

    cards.forEach(card => {
        const url = card.dataset.externalUrl;
        if (!url) return;

        card.addEventListener('click', () => {
            window.open(url, '_blank');
        });
    });
}


async function loadAndRender(category, query = '') {
  const container = qs('.sidebar-items');
  const titleEl = qs('#sidebar-section-title');
  if (!container || !titleEl) return;
  titleEl.textContent = category.charAt(0).toUpperCase() + category.slice(1);
  container.innerHTML = '<p style="padding:6px;color:#b3b3b3;">Loading...</p>';

  const raw = await fetchCategory(category);
  const extractor = itemTextExtractor(category);
  const filtered = filterByQuery(raw, query, extractor);
  const cards = toCards(category, filtered);

  renderList(container, cards);

    if (category === 'artists') attachSidebarCardHandlers();
}

export default function initSideMenu() {
  const container = qs('.sidebar-items');
  const tabs = Array.from(document.querySelectorAll('.menu-tab'));
  const search = qs('.sidebar-search-input');

  if (!container || tabs.length === 0 || !search) return;

  let currentCategory = 'playlists';

  function setActiveTab(cat) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.category === cat));
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = tab.dataset.category;
      if (!cat || cat === currentCategory) return;
      currentCategory = cat;
      setActiveTab(cat);
      loadAndRender(currentCategory, search.value.trim());
    });
  });

  let typingTimer = 0;
  search.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => loadAndRender(currentCategory, search.value.trim()), 150);
  });

  setActiveTab(currentCategory);
  loadAndRender(currentCategory, '');
}

