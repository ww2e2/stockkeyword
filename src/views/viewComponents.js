import { escapeHtml } from './viewUtils.js';

export function renderSectionHeader(title, description = '') {
  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">${escapeHtml(title)}</h2>
        ${description
          ? `<p class="section-description">${escapeHtml(description)}</p>`
          : ''}
      </div>
    </div>
  `;
}

export function renderPlatformCard(title, description, href = '#') {
  const isPlaceholder = href === '#';

  return `
    <article class="platform-card">
      <a
        class="platform-card-link"
        href="${escapeHtml(href)}"
        ${isPlaceholder ? 'aria-disabled="true"' : ''}
      >
        <h3 class="platform-card-title">${escapeHtml(title)}</h3>
        <p class="platform-card-description">${escapeHtml(description)}</p>
      </a>
    </article>
  `;
}
