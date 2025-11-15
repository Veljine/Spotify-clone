export default function renderSection(parentEl, title, listClass, itemsHTML, showAll = true) {
    const sectionHTML = `
        <div class="music-section">
            <div class="section-header">
                <h2 class="section-title">${title}</h2>
                ${showAll ? '<a href="https://open.spotify.com/search" class="show-all">Show all</a>' : ''}
            </div>
            <div class="${listClass}">
                ${itemsHTML.join('')}
            </div>
        </div>
    `;
    parentEl.insertAdjacentHTML('beforeend', sectionHTML);
}