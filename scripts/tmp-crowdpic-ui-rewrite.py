from pathlib import Path
path = Path(r'C:\projects\miricanvas-tag-saas\src\crowdpicWrapper.js')
text = path.read_text(encoding='utf-8')

# Replace patchNav.
start = text.find('function patchNav(html, activeMenu) {')
end = text.find('function removeAdobeHomeCard(html) {')
if start == -1 or end == -1:
    raise SystemExit('patchNav block not found')
new_patch_nav = '''function patchNav(html, activeMenu) {
  let next = html;

  next = next.replace(
    /<a href="\/" class="[^"]*">[^<]*<\/a>/,
    `<a href="/" class="${activeMenu === 'home' ? 'active' : ''}">\uD648</a>`
  );
  next = next.replace(
    /<a href="\/miricanvas" class="[^"]*">[^<]*<\/a>/,
    `<a href="/miricanvas" class="${activeMenu === 'miricanvas' ? 'active' : ''}">\uBBF8\uB9AC\uCE94\uBC84\uC2A4</a>`
  );
  next = next.replace(
    /<a href="\/crowdpic" class="[^"]*">[^<]*<\/a>/,
    ''
  );
  next = next.replace(
    /<a href="\/canva" class="[^"]*">[^<]*<\/a>/,
    `<a href="/crowdpic" class="${activeMenu === 'crowdpic' ? 'active' : ''}">\uD06C\uB77C\uC6B0\uB4DC\uD53D</a>\n        <a href="/canva" class="${activeMenu === 'canva' ? 'active' : ''}">\uCE94\uBC14</a>`
  );

  if (!ADOBE_STOCK_ENABLED) {
    next = next.replace(
      /<a href="\/adobe-stock" class="[^"]*">[^<]*<\/a>/,
      `<a href="/adobe-stock" class="${activeMenu === 'adobe-stock' ? 'active' : ''}">\uC5B4\uB3C4\uBE44 \uC2A4\uD1A1</a>`
    );
  } else {
    next = next.replace(
      /<a href="\/adobe-stock" class="[^"]*">[^<]*<\/a>/,
      `<a href="/adobe-stock" class="${activeMenu === 'adobe-stock' ? 'active' : ''}">\uC5B4\uB3C4\uBE44 \uC2A4\uD1A1</a>`
    );
  }

  return next;
}

'''
text = text[:start] + new_patch_nav + text[end:]

# Replace insertCrowdpicHomeCard.
start = text.find('function insertCrowdpicHomeCard(html) {')
end = text.find('function patchHomePageHtml(html) {')
if start == -1 or end == -1:
    raise SystemExit('insertCrowdpicHomeCard block not found')
new_insert = '''function insertCrowdpicHomeCard(html) {
  if (html.includes('href="/crowdpic"')) {
    return html;
  }

  const card = `
        <article class="feature-card platform-card">
          <div class="platform-head">
            <div class="platform-badges">
              <span class="status-badge ${CROWDPIC_STATUS === '\uC6B4\uC601\uC911' ? 'available' : 'coming'}">${escapeHtml(CROWDPIC_STATUS)}</span>
            </div>
          </div>
          <h2>\uD06C\uB77C\uC6B0\uB4DC\uD53D</h2>
          <p>\uD06C\uB77C\uC6B0\uB4DC\uD53D \uC804\uC6A9 \uAC80\uC0C9\uC5B4 \uBD84\uC11D\uACFC \uC774\uBC88\uB2EC \uC778\uAE30 \uAC80\uC0C9\uC5B4 \uCD94\uCC9C\uC744 \uC81C\uACF5\uD558\uB294 \uB3C5\uB9BD \uBAA8\uB4C8\uC785\uB2C8\uB2E4.</p>
          <ul class="feature-list feature-checklist">
            <li>\uD0A4\uC6CC\uB4DC \uBD84\uC11D</li>
            <li>\uC774\uBC88\uB2EC \uC778\uAE30 \uAC80\uC0C9 \uC21C\uC704</li>
          </ul>
          <a class="cta-link" href="/crowdpic">\uBD84\uC11D \uC2DC\uC791</a>
        </article>`;

  const patched = html.replace(
    /(<article class="feature-card platform-card">[\s\S]*?<h2>\uBBF8\uB9AC\uCE94\uBC84\uC2A4<\/h2>[\s\S]*?<\/article>)/,
    `$1${card}`
  );

  return patched === html ? html : patched;
}

'''
text = text[:start] + new_insert + text[end:]

# Replace buildSearchForm.
start = text.find('function buildSearchForm(keyword = \'\', category = CROWDPIC_CATEGORIES[0]) {')
end = text.find('function renderTags(tags) {')
if start == -1 or end == -1:
    raise SystemExit('buildSearchForm block not found')
new_form = '''function buildSearchForm(keyword = '', category = CROWDPIC_CATEGORIES[0]) {
  const options = CROWDPIC_CATEGORIES
    .map((item) => `<option value="${escapeHtml(item)}"${item === category ? ' selected' : ''}>${escapeHtml(item)}</option>`)
    .join('');

  return `
    <section class="page-card stack">
      <div class="eyebrow">Crowdpic Search</div>
      <h2>크라우드픽 검색어 분석</h2>
      <p>크라우드픽은 최대 40개의 키워드를 입력할 수 있습니다. 내부에서는 최대 50개를 생성하고, 화면에서는 상위 40개만 출력하며 복사도 동일하게 동작합니다.</p>
      <form method="GET" action="/crowdpic/tag">
        <label for="crowdpicKeyword">검색어</label>
        <input id="crowdpicKeyword" name="q" class="text-input" type="text" placeholder="검색어를 입력하세요" value="${escapeHtml(keyword)}" />
        <label for="crowdpicCategory" style="margin-top:16px;">카테고리</label>
        <select id="crowdpicCategory" name="category" class="text-input">
          ${options}
        </select>
        <div class="actions">
          <button class="primary" type="submit">검색</button>
        </div>
      </form>
    </section>
  `;
}

'''
text = text[:start] + new_form + text[end:]

# Replace buildSearchResultCard.
start = text.find('function buildSearchResultCard(result) {')
end = text.find('function buildSearchMain(keyword =', start)
if start == -1 or end == -1:
    raise SystemExit('buildSearchResultCard block not found')
new_result = '''function buildSearchResultCard(result) {
  if (!result) {
    return '<section class="page-card stack"><div class="result-empty">아직 검색 결과가 없습니다.</div></section>';
  }

  const tags = Array.isArray(result.topTags) ? result.topTags : [];
  const visibleTags = tags.slice(0, CROWDPIC_UI_MAX_TAGS);
  const copyText = visibleTags.join(', ');
  const collectedAt = escapeHtml(result.collectedAt || getCollectedDate());

  return `
    <section class="page-card stack">
      <div class="eyebrow">추천 키워드</div>
      <section class="result-card stack">
        <div class="result-head">
          <div>
            <h3 class="result-title">추천 키워드</h3>
            <div class="meta">추천 키워드: ${escapeHtml(String(visibleTags.length))}개 / 수집일: ${collectedAt}</div>
          </div>
          ${buildCopyButton(copyText)}
        </div>
        <div class="result-empty" style="margin-top: 12px;">${escapeHtml(result.metaTagString || copyText)}</div>
        <div class="tags" style="margin-top: 16px;">${renderTags(visibleTags)}</div>
      </section>
    </section>
  `;
}

'''
text = text[:start] + new_result + text[end:]

# Replace buildSearchMain.
start = text.find('function buildSearchMain(keyword =', 0)
end = text.find('function renderRankingRows(items, valueKey) {')
if start == -1 or end == -1:
    raise SystemExit('buildSearchMain block not found')
new_main = '''function buildSearchMain(keyword = '', category = CROWDPIC_CATEGORIES[0], result = null) {
  return `
    <div class="page-grid">
      ${buildSearchForm(keyword, category)}
      ${buildSearchResultCard(result)}
    </div>
  `;
}

'''
text = text[:start] + new_main + text[end:]

path.write_text(text, encoding='utf-8')
