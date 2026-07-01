import {
  CROWDPIC_CATEGORIES,
  CROWDPIC_ORIGIN,
  cleanText,
  collectCrowdpicTags,
  escapeHtml,
  getCollectedDate,
  getMonthlyRankings,
  normalizeCategory,
} from './crowdpic.js';

const CROWDPIC_UI_MAX_TAGS = 50;

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

function writeJson(res, payload, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function buildTwoColumnLayout(leftHtml, rightHtml) {
  return `
    <div class="grid">
      ${leftHtml}
      ${rightHtml}
    </div>
  `;
}

function buildCrowdpicBreadcrumb(pathname) {
  if (pathname === '/crowdpic') {
    return [
      { label: '홈', href: '/' },
      { label: '크라우드픽', href: '/crowdpic' },
    ];
  }

  if (pathname === '/crowdpic/tag') {
    return [
      { label: '홈', href: '/' },
      { label: '크라우드픽', href: '/crowdpic' },
      { label: '키워드 분석', href: '/crowdpic/tag' },
    ];
  }

  if (pathname === '/crowdpic/rankings') {
    return [
      { label: '홈', href: '/' },
      { label: '크라우드픽', href: '/crowdpic' },
      { label: '이번달 인기 검색 순위', href: '/crowdpic/rankings' },
    ];
  }

  return [];
}

function buildCrowdpicSeo(pathname) {
  if (pathname === '/crowdpic') {
    return {
      title: '크라우드픽 분석 도구 | 스톡 크리에이터 분석 플랫폼',
      description: '크라우드픽에서 스톡 콘텐츠를 제작하는 스톡 크리에이터를 위한 분석 도구입니다.',
      heroTitle: '크라우드픽 분석 도구',
      heroDesc: '크라우드픽에서 스톡 콘텐츠를 제작하는 스톡 크리에이터를 위한 분석 도구입니다.',
    };
  }

  if (pathname === '/crowdpic/rankings') {
    return {
      title: '이번달 인기 검색 순위 | 크라우드픽 분석 도구 | 스톡 크리에이터 분석 플랫폼',
      description: '이번달 키워드 검색 순위와 카테고리 순위를 확인할 수 있습니다.',
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
        <button type="button" class="secondary copy-chip" data-copy-button>복사하기</button>
      </div>
      <div class="meta"><span data-selected-count>추천 키워드: ${escapeHtml(String(visibleTags.length))}개 / 수집일: ${collectedAt}</span></div>
      <div class="result-text" data-copy-preview>${escapeHtml(visibleTags.join(', ') || '(추천 키워드 없음)')}</div>
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
          } catch {
            activeTags = [];
          }

          const renderState = () => {
            if (selectedCountEl) {
              selectedCountEl.textContent = '추천 키워드: ' + activeTags.length + '개 / 수집일: ${collectedAt}';
            }

            if (previewEl) {
              previewEl.textContent = activeTags.join(', ') || '(추천 키워드 없음)';
            }

            if (tagListEl) {
              tagListEl.innerHTML = activeTags.map((tag, index) =>
                '<span class="tag" data-tag-index="' + index + '">' +
                  '<span class="tag-label">' + tag + '</span>' +
                  '<button type="button" class="tag-remove" data-remove-index="' + index + '" aria-label="' + tag + ' 삭제">x</button>' +
                '</span>'
              ).join('');

              tagListEl.querySelectorAll('[data-remove-index]').forEach((button) => {
                button.addEventListener('click', () => {
                  const index = Number(button.getAttribute('data-remove-index'));
                  if (!Number.isInteger(index) || index < 0 || index >= activeTags.length) return;
                  activeTags.splice(index, 1);
                  renderState();
                });
              });
            }
          };

          if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
              const copyText = activeTags.join(', ');
              try {
                await navigator.clipboard.writeText(copyText);
                copyBtn.textContent = '복사됨';
              } catch {
                copyBtn.textContent = '복사 실패';
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
            <h3>이번달 카테고리 검색 순위 TOP 20</h3>
            ${renderRankingRows(categoryTop20, 'label')}
          </section>
        </div>
      </section>
    </div>
  `;
}

export async function handleCrowdpicRequest(req, res, requestUrl, renderPage, readJsonBody) {
  const pathname = requestUrl.pathname;
  const normalizedPathname = pathname !== '/' ? pathname.replace(/\/+$/, '') || '/' : '/';

  if (req.method === 'GET' && normalizedPathname === '/crowdpic') {
    const seo = buildCrowdpicSeo('/crowdpic');
    const html = renderPage('/crowdpic', requestUrl.origin, {
      activeMenu: 'crowdpic',
      seo,
      heroTitle: seo.heroTitle,
      heroDesc: seo.heroDesc,
      breadcrumbItems: buildCrowdpicBreadcrumb('/crowdpic'),
      contentHtml: buildLandingMain(),
      faqItems: CROWDPIC_FAQ_ITEMS,
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return true;
  }

  if (req.method === 'GET' && normalizedPathname === '/crowdpic/tag') {
    const keyword = cleanText(requestUrl.searchParams.get('q'));
    const category = normalizeCategory(requestUrl.searchParams.get('category'));
    let result = null;

    if (keyword) {
      result = await collectCrowdpicTags(keyword, category, CROWDPIC_ORIGIN);
    }

    const seo = buildCrowdpicSeo('/crowdpic/tag');
    const html = renderPage('/crowdpic/tag', requestUrl.origin, {
      activeMenu: 'crowdpic',
      seo,
      heroTitle: seo.heroTitle,
      heroDesc: seo.heroDesc,
      breadcrumbItems: buildCrowdpicBreadcrumb('/crowdpic/tag'),
      contentHtml: buildSearchMain(keyword, category, result),
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return true;
  }

  if (req.method === 'GET' && normalizedPathname === '/crowdpic/rankings') {
    const rankings = await getMonthlyRankings();
    const seo = buildCrowdpicSeo('/crowdpic/rankings');
    const html = renderPage('/crowdpic/rankings', requestUrl.origin, {
      activeMenu: 'crowdpic',
      seo,
      heroTitle: seo.heroTitle,
      heroDesc: seo.heroDesc,
      breadcrumbItems: buildCrowdpicBreadcrumb('/crowdpic/rankings'),
      contentHtml: buildRankingMain(rankings),
    });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return true;
  }

  if (req.method === 'POST' && normalizedPathname === '/api/crowdpic/collect') {
    const body = await readJsonBody(req);
    const keyword = cleanText(body?.keyword);
    const category = normalizeCategory(body?.category);

    if (!keyword) {
      writeJson(res, { error: 'keyword is required' }, 400);
      return true;
    }

    try {
      const result = await collectCrowdpicTags(keyword, category, CROWDPIC_ORIGIN);
      writeJson(res, result, 200);
    } catch (error) {
      writeJson(res, { error: error?.message || String(error) }, 500);
    }
    return true;
  }

  if (req.method === 'GET' && normalizedPathname === '/api/crowdpic/monthly-rankings') {
    try {
      const result = await getMonthlyRankings();
      writeJson(res, result, 200);
    } catch (error) {
      writeJson(res, { error: error?.message || String(error) }, 500);
    }
    return true;
  }

  return false;
}

