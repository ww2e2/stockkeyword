function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPlatformNav({ active = 'home', includeCrowdpic = true, includeAdobe = true } = {}) {
  const links = [
    { href: '/', label: '홈', key: 'home' },
    { href: '/miricanvas', label: '미리캔버스', key: 'miricanvas' },
  ];

  if (includeCrowdpic) {
    links.push({ href: '/crowdpic', label: '크라우드픽', key: 'crowdpic' });
  }

  links.push({ href: '/canva', label: '캔바', key: 'canva' });

  if (includeAdobe) {
    links.push({ href: '/adobe-stock', label: '어도비 스톡', key: 'adobe-stock' });
  }

  return links
    .map((link) => `<a href="${escapeHtml(link.href)}" class="${active === link.key ? 'active' : ''}">${escapeHtml(link.label)}</a>`)
    .join('\n        ');
}

function buildPlatformCard({
  title,
  status = '준비중',
  statusTone = 'coming',
  description,
  features = [],
  ctaHref = '',
  ctaLabel = '',
} = {}) {
  const featureList = features
    .map((feature) => `<li>${escapeHtml(feature)}</li>`)
    .join('');

  return `
        <article class="feature-card platform-card">
          <div class="platform-head">
            <div class="platform-badges">
              <span class="status-badge ${statusTone}">${escapeHtml(status)}</span>
            </div>
          </div>
          <h2>${escapeHtml(title)}</h2>
          <p>${escapeHtml(description)}</p>
          ${featureList ? `<ul class="feature-list feature-checklist">${featureList}</ul>` : ''}
          ${ctaHref && ctaLabel ? `<a class="cta-link" href="${escapeHtml(ctaHref)}">${escapeHtml(ctaLabel)}</a>` : ''}
        </article>`;
}

function buildTwoColumnLayout(leftHtml, rightHtml) {
  return `
    <div class="grid">
      ${leftHtml}
      ${rightHtml}
    </div>
  `;
}

function buildSearchFormCard({
  eyebrow = 'Crowdpic Search',
  title = '키워드 분석',
  description = '',
  keywordLabel = '키워드',
  categoryLabel = '카테고리',
  submitLabel = '검색',
  keyword = '',
  category = '',
  categories = [],
  action = '',
} = {}) {
  const options = categories
    .map((item) => `<option value="${escapeHtml(item)}"${item === category ? ' selected' : ''}>${escapeHtml(item)}</option>`)
    .join('');

  return `
    <section class="card stack">
      <label>${escapeHtml(eyebrow)}</label>
      <h2>${escapeHtml(title)}</h2>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      <form method="GET" action="${escapeHtml(action)}">
        <label for="crowdpicKeyword">${escapeHtml(keywordLabel)}</label>
        <input id="crowdpicKeyword" name="q" class="text-input" type="text" placeholder="키워드를 입력하세요" value="${escapeHtml(keyword)}" />
        <label for="crowdpicCategory" style="margin-top:16px;">${escapeHtml(categoryLabel)}</label>
        <select id="crowdpicCategory" name="category" class="text-input">
          ${options}
        </select>
        <div class="actions">
          <button class="primary" type="submit">${escapeHtml(submitLabel)}</button>
        </div>
      </form>
    </section>
  `;
}

function buildSearchResultCard({
  eyebrow = '추천 키워드',
  title = '추천 키워드',
  countLabel = '추천 키워드',
  count = 0,
  collectedAt = '',
  copyButtonHtml = '',
  meta = '',
  tagsHtml = '',
  emptyText = '아직 검색 결과가 없습니다.',
} = {}) {
  return `
    <section class="card stack">
      <label>${escapeHtml(eyebrow)}</label>
      <div class="result-panel stack">
        <div class="result-head">
          <div>
            <h3 class="result-title">${escapeHtml(title)}</h3>
            <div class="meta">${escapeHtml(countLabel)}: ${escapeHtml(String(count))}개 / 수집일: ${escapeHtml(collectedAt)}</div>
          </div>
          ${copyButtonHtml}
        </div>
        <div class="result-empty">${escapeHtml(meta || emptyText)}</div>
        <div class="tags">${tagsHtml}</div>
      </div>
    </section>
  `;
}

export {
  buildPlatformCard,
  buildPlatformNav,
  buildSearchFormCard,
  buildSearchResultCard,
  buildTwoColumnLayout,
  escapeHtml,
};

