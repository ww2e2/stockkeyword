import { requestHandler as baseRequestHandler } from './app.js';
import {
  CROWDPIC_CATEGORIES,
  CROWDPIC_ENABLED,
  CROWDPIC_ORIGIN,
  CROWDPIC_STATUS,
  cleanText,
  collectCrowdpicTags,
  getCollectedDate,
  getMonthlyRankings,
  normalizeCategory,
} from './crowdpic.js';
import {
  buildPlatformCard,
  buildTwoColumnLayout,
  escapeHtml,
} from './miricanvasComponents.js';

const CROWDPIC_UI_MAX_TAGS = 50;
const CROWDPIC_SUBMIT_MAX_TAGS = 40;

const CROWDPIC_FAQ_ITEMS = [
  {
    question: '크라우드픽 분석 도구는 무엇인가요?',
    answer: '크라우드픽에서 스톡 콘텐츠를 제작하는 스톡 크리에이터를 위한 분석 도구입니다. 현재는 키워드 분석과 이번달 인기 검색 순위 기능을 제공합니다.',
  },
  {
    question: '키워드 분석은 어떤 용도인가요?',
    answer: '실시간 상위 콘텐츠를 분석하여 많이 사용되는 키워드를 빠르게 확인하는 용도입니다. 자주 사용하는 키워드를 정리하여 업로드 전략과 키워드 작성에 활용할 수 있습니다.',
  },
  {
    question: '이번달 인기 검색 순위는 어떤 용도인가요?',
    answer: '이번달 많이 검색된 키워드를 확인하여 콘텐츠 제작 방향과 업로드 주제를 선정하는 데 도움이 됩니다.',
  },
  {
    question: '크라우드픽 분석 도구는 어떤 도움이 되나요?',
    answer: '반복적인 조사 시간을 줄이고 실제 많이 사용되는 키워드와 검색 데이터를 기반으로 콘텐츠 제작 방향을 빠르게 결정할 수 있습니다.',
  },
];

function buildCaptureResponse(resolve) {
  const chunks = [];
  let statusCode = 200;
  let headers = {};

  return {
    writeHead(code, responseHeaders = {}) {
      statusCode = code;
      headers = { ...headers, ...responseHeaders };
    },
    setHeader(name, value) {
      headers[name] = value;
    },
    end(chunk) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      resolve({
        statusCode,
        headers,
        body: Buffer.concat(chunks).toString('utf8'),
      });
    },
  };
}

async function captureHtml(pathname, origin, search = '') {
  const req = {
    method: 'GET',
    url: `${pathname}${search}`,
    headers: {
      host: new URL(origin).host,
      'x-forwarded-proto': new URL(origin).protocol.replace(':', ''),
    },
  };

  return new Promise((resolve) => {
    const res = buildCaptureResponse(resolve);
    Promise.resolve(baseRequestHandler(req, res)).catch((error) => {
      resolve({
        statusCode: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: error?.stack || error?.message || String(error),
      });
    });
  });
}

function writeJson(res, payload, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

function replaceSection(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

function patchNav(html, activeMenu) {
  let next = html;
  const activeClass = (key) => (activeMenu === key ? 'active' : '');
  const hasCrowdpicAnchor = /<a href="\/crowdpic" class="[^"]*">[^<]*<\/a>/.test(next);
  const hasCanvaAnchor = /<a href="\/canva" class="[^"]*">[^<]*<\/a>/.test(next);
  const hasAdobeAnchor = /<a href="\/adobe-stock" class="[^"]*">[^<]*<\/a>/.test(next);

  next = next.replace(
    /<a href="\/" class="[^"]*">[^<]*<\/a>/,
    `<a href="/" class="${activeClass('home')}">홈</a>`
  );
  next = next.replace(
    /<a href="\/miricanvas" class="[^"]*">[^<]*<\/a>/,
    `<a href="/miricanvas" class="${activeClass('miricanvas')}">미리캔버스</a>`
  );

  if (hasCrowdpicAnchor) {
    next = next.replace(
      /<a href="\/crowdpic" class="[^"]*">[^<]*<\/a>/,
      `<a href="/crowdpic" class="${activeClass('crowdpic')}">크라우드픽</a>`
    );
  } else {
    next = next.replace(
      /(<a href="\/miricanvas" class="[^"]*">[^<]*<\/a>)/,
      `$1\n        <a href="/crowdpic" class="${activeClass('crowdpic')}">크라우드픽</a>`
    );
  }

  if (hasCanvaAnchor) {
    next = next.replace(
      /<a href="\/canva" class="[^"]*">[^<]*<\/a>/,
      `<a href="/canva" class="${activeClass('canva')}">캔바</a>`
    );
  } else {
    next = next.replace(
      /(<a href="\/crowdpic" class="[^"]*">[^<]*<\/a>)/,
      `$1\n        <a href="/canva" class="${activeClass('canva')}">캔바</a>`
    );
  }

  if (hasAdobeAnchor) {
    next = next.replace(
      /<a href="\/adobe-stock" class="[^"]*">[^<]*<\/a>/,
      `<a href="/adobe-stock" class="${activeClass('adobe-stock')}">어도비 스톡</a>`
    );
  } else {
    next = next.replace(
      /(<a href="\/canva" class="[^"]*">[^<]*<\/a>)/,
      `$1\n        <a href="/adobe-stock" class="${activeClass('adobe-stock')}">어도비 스톡</a>`
    );
  }

  return next;
}

function removeAdobeHomeCard(html) {
  return html;
}

function buildCrowdpicHomeCard() {
  const statusTone = String(CROWDPIC_STATUS).includes('운영') ? 'available' : 'coming';

  return buildPlatformCard({
    title: '크라우드픽',
    status: CROWDPIC_STATUS,
    statusTone,
    description: '크라우드픽 전용 키워드 분석과 이번달 인기 키워드 추천을 제공하는 독립 모듈입니다.',
    features: ['키워드 분석', '이번달 인기 검색 순위'],
    ctaHref: '/crowdpic',
    ctaLabel: '분석 시작',
  });
}

function insertCrowdpicHomeCard(html) {
  if (html.includes('\uD06C\uB77C\uC6B0\uB4DC\uD53D \uC804\uC6A9 \uBD84\uC11D \uBAA8\uB4C8') || html.includes('<h2>\uD06C\uB77C\uC6B0\uB4DC\uD53D</h2>')) {
    return html;
  }

  const card = buildCrowdpicHomeCard();
  const patched = html.replace(
    /(<article class="feature-card platform-card">[\s\S]*?<h2>미리캔버스<\/h2>[\s\S]*?<\/article>)/,
    `$1${card}`
  );

  return patched === html ? html : patched;
}

function patchHomePageHtml(html) {
  let next = html;
  next = removeAdobeHomeCard(next);
  next = insertCrowdpicHomeCard(next);
  next = patchNav(next, 'home');
  return next;
}

function replaceSeoAndHero(html, seo) {
  let next = html;
  const canonical = `${seo.origin}${seo.pathname}`;

  next = replaceSection(next, /<title>[^<]*<\/title>/, `<title>${escapeHtml(seo.title)}</title>`);
  next = replaceSection(next, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(seo.description)}" />`);
  next = replaceSection(next, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  next = replaceSection(next, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(seo.title)}" />`);
  next = replaceSection(next, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(seo.description)}" />`);
  next = replaceSection(next, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  next = replaceSection(next, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(seo.title)}" />`);
  next = replaceSection(next, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeHtml(seo.description)}" />`);
  next = replaceSection(next, /<h1>[\s\S]*?<\/h1>/, `<h1>${escapeHtml(seo.heroTitle)}</h1>`);
  next = replaceSection(next, /<p class="desc">[\s\S]*?<\/p>/, `<p class="desc">${escapeHtml(seo.heroDesc)}</p>`);

  return next;
}

function buildBreadcrumbHtml(pathname) {
  const itemSets = {
    '/crowdpic': [
      { href: '/', label: '홈' },
      { href: '/crowdpic', label: '크라우드픽' },
    ],
    '/crowdpic/tag': [
      { href: '/', label: '홈' },
      { href: '/crowdpic', label: '크라우드픽' },
      { href: '/crowdpic/tag', label: '키워드 분석' },
    ],
    '/crowdpic/rankings': [
      { href: '/', label: '홈' },
      { href: '/crowdpic', label: '크라우드픽' },
      { href: '/crowdpic/rankings', label: '이번달 인기 검색 순위' },
    ],
  };

  const items = itemSets[pathname] || [];
  if (!items.length) {
    return '';
  }

  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      ${items.map((item, index) => `
        ${index > 0 ? '<span class="breadcrumb-sep">></span>' : ''}
        <a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>
      `).join('')}
    </nav>
  `;
}

function replaceBreadcrumb(html, pathname) {
  const breadcrumbHtml = buildBreadcrumbHtml(pathname);

  if (/<nav class="breadcrumb" aria-label="Breadcrumb">[\s\S]*?<\/nav>/.test(html)) {
    return html.replace(/<nav class="breadcrumb" aria-label="Breadcrumb">[\s\S]*?<\/nav>/, breadcrumbHtml);
  }

  if (!breadcrumbHtml) {
    return html;
  }

  return html.replace(/(<\/div>\s*)(<section class="hero">)/, `$1\n    ${breadcrumbHtml}\n\n    $2`);
}

function replaceMain(html, mainHtml) {
  return html.replace(/<main>[\s\S]*?<\/main>/, `<main>\n      ${mainHtml.trim()}\n    </main>`);
}

function buildLandingMain() {
  return `
    <div class="page-grid">
      <section class="page-card stack">
        <div class="eyebrow">Crowdpic Platform</div>
        <h2>크라우드픽에서 스톡 콘텐츠를 제작하는 스톡 크리에이터를 위한 분석 도구</h2>
        <p>크라우드픽 분석 도구는 스톡 크리에이터가 상위 노출 키워드와 이번달 인기 키워드를 빠르게 확인할 수 있도록 설계되었습니다.</p>
      </section>

      <section class="miricanvas-tool-grid">
        <article class="feature-card">
          <div class="eyebrow">Keyword Analysis</div>
          <h2>키워드 분석</h2>
          <p>실시간 상위 콘텐츠를 분석하여 가장 많이 사용되는 키워드를 추천합니다.</p>
          <a class="cta-link" href="/crowdpic/tag">키워드 분석 시작</a>
        </article>
        <article class="feature-card">
          <div class="eyebrow">Monthly Rankings</div>
          <h2>이번달 인기 검색 순위</h2>
          <p>이번달 크라우드픽 인기 검색 데이터를 기준으로 많이 찾는 키워드를 정리합니다.</p>
          <a class="cta-link" href="/crowdpic/rankings">인기 검색 순위 확인</a>
        </article>
      </section>

      <section class="page-card stack">
        <div class="eyebrow">FAQ</div>
        <h2>자주 묻는 질문</h2>
        ${CROWDPIC_FAQ_ITEMS.map((item) => `
          <article class="faq-item">
            <h3>${escapeHtml(item.question)}</h3>
            <p>${escapeHtml(item.answer)}</p>
          </article>
        `).join('')}
      </section>
    </div>
  `;
}

function buildSearchStatus(keyword) {
  return cleanText(keyword) ? '1개 키워드 분석 완료' : '대기 중';
}

function buildSearchForm(keyword = '', category = CROWDPIC_CATEGORIES[0]) {
  const options = CROWDPIC_CATEGORIES
    .map((item) => `<option value="${escapeHtml(item)}"${item === category ? ' selected' : ''}>${escapeHtml(item)}</option>`)
    .join('');

  return `
    <section class="card">
      <label for="crowdpicKeyword">키워드</label>
      <form method="GET" action="/crowdpic/tag">
        <input id="crowdpicKeyword" name="q" class="text-input" type="text" placeholder="키워드를 입력하세요" value="${escapeHtml(keyword)}" />
        <label for="crowdpicCategory" style="margin-top: 16px;">카테고리</label>
        <select id="crowdpicCategory" name="category" class="text-input">
          ${options}
        </select>
        <div class="actions">
          <button class="primary" type="submit">키워드 분석</button>
        </div>
      </form>
      <div class="status">${escapeHtml(buildSearchStatus(keyword))}</div>
    </section>
  `;
}

function renderTags(tags) {
  return tags
    .map((tag, index) => `
      <span class="tag" data-tag-index="${index}">
        <span class="tag-label">${escapeHtml(tag)}</span>
        <button type="button" class="tag-remove" data-remove-index="${index}" aria-label="${escapeHtml(tag)} 삭제">x</button>
      </span>
    `)
    .join('');
}

function buildSearchResultPanel(keyword = '', result = null) {
  const cleanKeyword = cleanText(keyword);
  const tags = Array.isArray(result?.topTags) ? result.topTags : [];
  const visibleTags = tags.slice(0, CROWDPIC_UI_MAX_TAGS);
  const collectedAt = escapeHtml(result?.collectedAt || getCollectedDate());

  if (!cleanKeyword) {
    return '<div class="result-empty">분석할 키워드가 없습니다.</div>';
  }

  return `
    <section class="result-card" data-crowdpic-result data-tags='${escapeHtml(JSON.stringify(visibleTags))}'>
      <div class="result-head">
        <h3 class="result-title">[${escapeHtml(cleanKeyword)}]</h3>
        <button type="button" class="secondary copy-chip" data-copy-button>&#xBCF5;&#xC0AC;&#xD558;&#xAE30;</button>
      </div>
      <div class="meta"><span data-selected-count>추천 키워드: ${escapeHtml(String(visibleTags.length))}개 / 수집일: ${collectedAt}</span></div>
      <div class="result-text" data-copy-preview>${escapeHtml(visibleTags.join(', ') || '(&#xCD94;&#xCC9C; &#xD0A4;&#xC6CC;&#xB4DC; &#xC5C6;&#xC74C;)')}</div>
      <div class="tags" data-tag-list>${renderTags(visibleTags)}</div>
      <script>
        (() => {
          const card = document.currentScript.closest('[data-crowdpic-result]');
          if (!card) return;

          const rawTags = card.dataset.tags || '[]';
          const selectedCountEl = card.querySelector('[data-selected-count]');
          const previewEl = card.querySelector('[data-copy-preview]');
          const tagListEl = card.querySelector('[data-tag-list]');
          const copyBtn = card.querySelector('[data-copy-button]');
          let activeTags = [];

          try {
            activeTags = JSON.parse(rawTags);
          } catch (error) {
            activeTags = [];
          }

          function escapeTagText(value) {
            return String(value)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
          }

          function renderTagItems() {
            if (!tagListEl) return;
            tagListEl.innerHTML = activeTags.map((tag, index) => {
              const safeTag = escapeTagText(tag);
              return '<span class="tag" data-tag-index="' + index + '"><span class="tag-label">' + safeTag + '</span><button type="button" class="tag-remove" data-remove-index="' + index + '" aria-label="' + safeTag + ' \uC0AD\uC81C">x</button></span>';
            }).join('');
          }

          function renderState() {
            if (selectedCountEl) {
              selectedCountEl.textContent = '\uCD94\uCC9C \uD0A4\uC6CC\uB4DC: ' + activeTags.length + '\uAC1C / \uC218\uC9D1\uC77C: ${collectedAt}';
            }
            if (previewEl) {
              previewEl.textContent = activeTags.join(', ') || '(\uCD94\uCC9C \uD0A4\uC6CC\uB4DC \uC5C6\uC74C)';
            }
            renderTagItems();
          }

          if (tagListEl) {
            tagListEl.addEventListener('click', (event) => {
              const button = event.target.closest('[data-remove-index]');
              if (!button) return;
              const index = Number(button.dataset.removeIndex);
              if (!Number.isInteger(index) || index < 0 || index >= activeTags.length) return;
              activeTags.splice(index, 1);
              renderState();
            });
          }

          if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
              const copyText = activeTags.join(', ');
              try {
                await navigator.clipboard.writeText(copyText);
                copyBtn.textContent = '\uBCF5\uC0AC\uB428';
              } catch (error) {
                copyBtn.textContent = '\uBCF5\uC0AC \uC2E4\uD328';
              }
            });
          }

          renderState();
        })();
      </script>
    </section>
  `;
}
function buildSearchMain(keyword = '', category = CROWDPIC_CATEGORIES[0], result = null) {
  const leftHtml = buildSearchForm(keyword, category);
  const rightHtml = `
    <section class="card">
      <label>결과</label>
      <div class="result-panel stack">
        ${buildSearchResultPanel(keyword, result)}
      </div>
    </section>
  `;

  return buildTwoColumnLayout(leftHtml, rightHtml);
}

function renderRankingRows(items, valueKey) {
  if (!items.length) {
    return '<div class="result-empty">아직 수집된 데이터가 없습니다.</div>';
  }

  return `<ol class="rank-list">${items
    .map((item) => `
      <li class="rank-item">
        <span class="rank-order">${escapeHtml(String(item.rank || 0))}</span>
        <span class="rank-label">${escapeHtml(item[valueKey] || item.label || item.keyword || '-')}</span>
        <span class="rank-count">${escapeHtml(String(item.count || 0))}회</span>
      </li>
    `)
    .join('')}</ol>`;
}

function buildRankingMain(rankings) {
  const keywordTop20 = Array.isArray(rankings?.keywordSearchTop20) ? rankings.keywordSearchTop20 : [];
  const categoryTop20 = Array.isArray(rankings?.categoryTop20) ? rankings.categoryTop20 : [];

  return `
    <div class="page-grid">
      <section class="page-card stack">
        <div class="eyebrow">Monthly Rankings</div>
        <h2>크라우드픽 이번달 인기 키워드</h2>
        <p>이번달 키워드 검색 순위와 카테고리 순위를 확인할 수 있습니다.</p>
        <div class="summary-grid">
          <section class="summary-card">
            <h3>이번달 키워드 검색 순위 TOP 20</h3>
            ${renderRankingRows(keywordTop20, 'keyword')}
          </section>
          <section class="summary-card">
            <h3>이번달 카테고리 검색 순위</h3>
            ${renderRankingRows(categoryTop20, 'label')}
          </section>
        </div>
      </section>
    </div>
  `;
}

function buildSeo(pathname) {
  if (pathname === '/crowdpic') {
    return {
      title: '크라우드픽 분석 도구 | 미리캔버스 키워드 분석 사이트',
      description: '크라우드픽 전용 키워드 분석과 이번달 인기 키워드를 제공하는 독립 모듈입니다.',
      heroTitle: '크라우드픽 분석 도구',
      heroDesc: '크라우드픽에서 스톡 콘텐츠를 제작하는 스톡 크리에이터를 위한 분석 도구입니다.',
    };
  }

  if (pathname === '/crowdpic/rankings') {
    return {
      title: '크라우드픽 이번달 인기 키워드 | 미리캔버스 키워드 분석 사이트',
      description: '크라우드픽에서 수집된 이번달 인기 키워드를 보여줍니다.',
      heroTitle: '이번달 인기 검색 순위',
      heroDesc: '이번달 키워드 검색 순위와 카테고리 순위를 확인할 수 있습니다.',
    };
  }

  return {
    title: '키워드 분석 | 크라우드픽 분석 도구 | 스톡 크리에이터 분석 플랫폼',
    description: '실시간 상위 콘텐츠를 분석하여 가장 많이 사용되는 키워드를 추천하는 키워드 분석 도구입니다.',
    heroTitle: '키워드 분석',
    heroDesc: '실시간 상위 콘텐츠를 분석하여 가장 많이 사용되는 키워드를 추천하는 키워드 분석 도구입니다.',
  };
}

async function renderPage(origin, pathname, seo, mainHtml) {
  const shell = await captureHtml('/', origin);
  let html = shell.body;
  html = patchNav(html, 'crowdpic');
  html = replaceBreadcrumb(html, pathname);
  html = replaceSeoAndHero(html, {
    origin,
    pathname,
    title: seo.title,
    description: seo.description,
    heroTitle: seo.heroTitle,
    heroDesc: seo.heroDesc,
  });
  html = replaceMain(html, mainHtml);
  return html;
}

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (!cleanText(text)) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(text));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

export async function requestHandler(req, res) {
  try {
    const protocol = cleanText(req.headers['x-forwarded-proto']) || 'http';
    const host = cleanText(req.headers.host) || 'localhost';
    const requestUrl = new URL(req.url, `${protocol}://${host}`);
    const pathname = requestUrl.pathname;
    const normalizedPathname = pathname !== '/' ? pathname.replace(/\/+$/, '') || '/' : '/';


    if (req.method === 'GET' && normalizedPathname === '/crowdpic') {
      const seo = buildSeo('/crowdpic');
      const html = await renderPage(requestUrl.origin, pathname, seo, buildLandingMain());
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && normalizedPathname === '/crowdpic/tag') {
      const keyword = cleanText(requestUrl.searchParams.get('q'));
      const category = normalizeCategory(requestUrl.searchParams.get('category'));
      let result = null;

      if (keyword) {
        result = await collectCrowdpicTags(keyword, category, CROWDPIC_ORIGIN);
      }

      const seo = buildSeo('/crowdpic/tag');
      const html = await renderPage(requestUrl.origin, pathname, seo, buildSearchMain(keyword, category, result));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && normalizedPathname === '/crowdpic/rankings') {
      const rankings = await getMonthlyRankings();
      const seo = buildSeo('/crowdpic/rankings');
      const html = await renderPage(requestUrl.origin, pathname, seo, buildRankingMain(rankings));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/crowdpic/collect') {
      const body = await parseJsonBody(req);
      const keyword = cleanText(body?.keyword);
      const category = normalizeCategory(body?.category);

      if (!keyword) {
        writeJson(res, { error: 'keyword is required' }, 400);
        return;
      }

      try {
        const result = await collectCrowdpicTags(keyword, category, CROWDPIC_ORIGIN);
        writeJson(res, result, 200);
      } catch (error) {
        writeJson(res, { error: error?.message || String(error) }, 500);
      }
      return;
    }

    if (req.method === 'GET' && pathname === '/api/crowdpic/monthly-rankings') {
      try {
        const result = await getMonthlyRankings();
        writeJson(res, result, 200);
      } catch (error) {
        writeJson(res, { error: error?.message || String(error) }, 500);
      }
      return;
    }

    if (req.method === 'GET' && pathname === '/') {
      const shell = await captureHtml('/', requestUrl.origin);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(patchHomePageHtml(shell.body));
      return;
    }

    return baseRequestHandler(req, res);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: error?.message || String(error) }));
  }
}

export default requestHandler;





