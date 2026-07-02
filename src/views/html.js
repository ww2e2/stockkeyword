export function createHtmlView(dependencies) {
  const {
    DEBUG,
    HOME_FAQ_ITEMS,
    MAX_KEYWORDS_PER_REQUEST,
    MIRICANVAS_CATEGORY_OPTIONS,
    MIRICANVAS_FAQ_ITEMS,
    STATIC_PAGE_CONTENT,
    TEMPLATE_FILTER_TABS,
    TEMPLATE_RESULT_TABS,
    TEMPLATE_TYPE_MAP,
    escapeHtml,
  } = dependencies;

function buildBreadcrumbItems(pathname) {
  if (pathname === '/miricanvas') {
    return [
      { label: '홈', href: '/' },
      { label: '미리캔버스', href: '/miricanvas' },
    ];
  }

  if (pathname === '/miricanvas/tag') {
    return [
      { label: '홈', href: '/' },
      { label: '미리캔버스', href: '/miricanvas' },
      { label: '키워드 분석', href: '/miricanvas/tag' },
    ];
  }

  if (pathname === '/miricanvas/template') {
    return [
      { label: '홈', href: '/' },
      { label: '미리캔버스', href: '/miricanvas' },
      { label: '템플릿 분석', href: '/miricanvas/template' },
    ];
  }

  if (pathname === '/miricanvas/rankings') {
    return [
      { label: '홈', href: '/' },
      { label: '미리캔버스', href: '/miricanvas' },
      { label: '이번달 인기 검색 순위', href: '/miricanvas/rankings' },
    ];
  }

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

  if (pathname === '/canva') {
    return [
      { label: '홈', href: '/' },
      { label: '캔바', href: '/canva' },
    ];
  }

  if (pathname === '/adobe-stock') {
    return [
      { label: '홈', href: '/' },
      { label: '어도비 스톡', href: '/adobe-stock' },
    ];
  }

  return [];
}
function buildPageSeo(pathname) {
  if (pathname === '__404__') {
    return {
      title: '페이지를 찾을 수 없습니다 | 스톡 크리에이터 분석 도구',
      description: '요청하신 페이지를 찾을 수 없습니다. 스톡 크리에이터 분석 도구의 홈 또는 분석 도구 페이지로 이동해 주세요.',
    };
  }

  if (pathname === '/') {
    return {
      title: '스톡 작가를 위한 분석 도구 | 미리캔버스, 크라우드픽',
      description: '스톡 작가를 위한 분석 도구입니다. 현재는 미리캔버스와 크라우드픽 기반 분석 기능을 제공합니다.',
    };
  }

  if (pathname === '/miricanvas') {
    return {
      title: '미리캔버스 분석 도구 | 스톡 크리에이터 분석 플랫폼',
      description: '미리캔버스 스톡 작가를 위한 키워드 분석 및 템플릿 분석 도구 모음입니다.',
    };
  }

  if (pathname === '/miricanvas/tag') {
    return {
      title: '키워드 분석 | 미리캔버스 분석 도구 | 스톡 크리에이터 분석 플랫폼',
      description: '실시간 상위 요소를 분석하여 가장 많이 사용되는 키워드를 추천하는 도구입니다. 스톡 콘텐츠 키워드 전략 수립에 활용할 수 있습니다.',
    };
  }

  if (pathname === '/miricanvas/template') {
    return {
      title: '템플릿 분석 | 미리캔버스 분석 도구 | 스톡 크리에이터 분석 플랫폼',
      description: '미리캔버스 스톡 작가를 위한 템플릿 분석 도구입니다.',
    };
  }

  if (pathname === '/miricanvas/rankings') {
    return {
      title: '이번달 인기 검색 순위 | 미리캔버스 분석 도구 | 스톡 크리에이터 분석 플랫폼',
      description: '이번달 키워드 검색 순위, 템플릿 종류 검색 순위, 템플릿 키워드 검색 순위를 확인할 수 있습니다.',
    };
  }

  return {
    title: STATIC_PAGE_CONTENT[pathname]?.title || '스톡 크리에이터 분석 도구',
    description: STATIC_PAGE_CONTENT[pathname]?.description || '스톡 작가와 디지털 크리에이터를 위한 분석 도구입니다.',
  };
}

function buildStructuredData(pathname, origin, canonicalUrl, options = {}) {
  const seo = options.seo || buildPageSeo(pathname);
  const faqItems = Array.isArray(options.faqItems) ? options.faqItems : [];
  const items = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: '스톡 크리에이터 분석 도구',
      url: `${origin}/`,
      description: '스톡 작가와 디지털 크리에이터를 위한 키워드 분석, 템플릿 분석 도구',
      inLanguage: 'ko-KR',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: '스톡 크리에이터 분석 도구',
      url: `${origin}/`,
      description: '미리캔버스 기반 기능을 시작으로 확장 중인 스톡 크리에이터 분석 플랫폼',
    },
  ];

  if (pathname === '/') {
    items.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: HOME_FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  if (pathname === '/miricanvas') {
    items.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: MIRICANVAS_FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  if (faqItems.length > 0) {
    items.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  items.push({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: seo.title,
    url: canonicalUrl,
    description: seo.description,
    inLanguage: 'ko-KR',
  });

  return items.map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`).join('\n');
}

function htmlPage(pathname, origin, options = {}) {
  const isNotFoundPage = Boolean(options.notFound);
  const staticPage = STATIC_PAGE_CONTENT[pathname] || null;
  const isHomePage = pathname === '/' && !isNotFoundPage;
  const isMiricanvasPage = pathname === '/miricanvas';
  const isTemplatePage = pathname === '/miricanvas/template';
  const isElementPage = pathname === '/miricanvas/tag';
  const isRankingsPage = pathname === '/miricanvas/rankings';
  const activeMenu = options.activeMenu || (pathname.startsWith('/miricanvas')
    ? 'miricanvas'
    : pathname.startsWith('/crowdpic')
      ? 'crowdpic'
      : pathname === '/canva'
        ? 'canva'
        : pathname === '/adobe-stock'
          ? 'adobe-stock'
          : 'home');
  const seo = options.seo || buildPageSeo(isNotFoundPage ? '__404__' : pathname);
  const canonicalPath = pathname === '/' ? '/' : pathname;
  const canonicalUrl = `${origin}${canonicalPath}`;
  const heroTitle = options.heroTitle || (isNotFoundPage
    ? '페이지를 찾을 수 없습니다'
    : isHomePage
    ? '스톡 작가를 위한 분석 도구'
    : isMiricanvasPage
      ? '미리캔버스 분석 도구'
    : staticPage?.title?.split(' | ')[0] || (isRankingsPage ? '이번달 인기 검색 순위' : isTemplatePage ? '템플릿 분석' : '키워드 분석'));
  const heroDesc = options.heroDesc || (isNotFoundPage
    ? '요청하신 페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.'
    : isHomePage
    ? '스톡 콘텐츠 제작에 필요한 상위 노출 키워드를 분석합니다.'
    : isMiricanvasPage
      ? '미리캔버스에서 스톡 콘텐츠를 제작하는 스톡 크리에이터를 위한 분석 도구입니다.'
    : isRankingsPage
      ? '이번달 키워드 검색 순위와 템플릿 검색 순위를 확인할 수 있습니다.'
    : staticPage?.description || (isTemplatePage
      ? '상위 템플릿 데이터를 분석하여 제목 키워드, 페이지 수, 제목 패턴을 확인할 수 있는 템플릿 분석 도구입니다.'
      : '실시간 상위 콘텐츠를 분석하여 가장 많이 사용되는 키워드를 추천하는 키워드 분석 도구입니다.'));
  const structuredDataScripts = buildStructuredData(isNotFoundPage ? '__404__' : pathname, origin, canonicalUrl, { seo, faqItems: options.faqItems });
  const breadcrumbItems = options.breadcrumbItems || (isNotFoundPage ? [] : buildBreadcrumbItems(pathname));
  const breadcrumbHtml = breadcrumbItems.length > 0
    ? `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        ${breadcrumbItems.map((item, index) => `
          ${index > 0 ? '<span class="breadcrumb-sep">></span>' : ''}
          <a href="${item.href}">${item.label}</a>
        `).join('')}
      </nav>
    `
    : '';

  const toolHtml = isTemplatePage
    ? `
      <section class="card">
        <label for="templateKeyword">키워드</label>
        <input id="templateKeyword" class="text-input" type="text" placeholder="예) 6월" />

        <label for="templateTypeSearch" style="margin-top: 16px;">템플릿 종류 검색</label>
        <input id="templateTypeSearch" class="text-input" type="text" placeholder="템플릿 종류를 검색하세요." />

        <div class="type-panel">
          <div class="type-filter-tabs" id="templateTypeTabs"></div>
          <div class="type-panel-list" id="templateTypePanel"></div>
        </div>

        <div class="selected-type" id="selectedTemplateTypeText">선택됨: 웹 > 프레젠테이션</div>

        <div class="actions">
          <button class="primary" id="templateRunBtn">템플릿 분석</button>
        </div>
        <div class="status" id="status">대기 중</div>
      </section>
    `
    : `
      <section class="card">
        <label for="keyword">키워드</label>
        <input id="keyword" class="text-input" type="text" placeholder="키워드를 입력하세요" />

        <label for="category" style="margin-top: 16px;">카테고리</label>
        <select id="category" class="text-input">
          ${MIRICANVAS_CATEGORY_OPTIONS.map((item) => `<option value="${item.value}">${item.label}</option>`).join('')}
        </select>

        <div class="actions">
          <button class="primary" id="runBtn">키워드 분석</button>
        </div>
        <div class="status" id="status">대기 중</div>
      </section>
    `;

  const homeHtml = `
    <div class="page-grid">
      <section class="page-card stack">
        <div class="eyebrow">Platform Vision</div>
        <h2>플랫폼 중심으로 확장되는 스톡 작가를 위한 분석 도구</h2>
        <p>스톡 작가와 디지털 크리에이터가 상위권에 노출되는 키워드와 템플릿 제목 패턴을 더 빠르게 파악할 수 있도록 돕는 서비스입니다.</p>
        <p>플랫폼별 특성에 맞춰 키워드 분석, 템플릿 분석, 콘텐츠 전략 수립을 지원하는 구조로 발전시키는 것이 목표입니다. 다양한 플랫폼을 순차적으로 지원할 예정입니다.</p>
      </section>

      <section class="platform-grid">
        <article class="feature-card platform-card">
          <div class="platform-head">
            <div class="platform-badges">
              <span class="status-badge available">운영중</span>
              <span class="status-badge available">사용 가능</span>
            </div>
          </div>
          <h2>\uBBF8\uB9AC\uCE94\uBC84\uC2A4</h2>
          <p>\uBBF8\uB9AC\uCE94\uBC84\uC2A4 \uC2A4\uD1A1 \uCF58\uD150\uCE20 \uC81C\uC791\uC790\uB97C \uC704\uD55C \uBD84\uC11D \uB3C4\uAD6C\uC785\uB2C8\uB2E4.</p>
          <ul class="feature-list feature-checklist">
            <li>키워드 분석</li>
            <li>템플릿 분석</li>
            <li>이번달 인기 검색 순위</li>
          </ul>
          <a class="cta-link" href="/miricanvas">분석 시작</a>
        </article>

        <article class="feature-card platform-card">
          <div class="platform-head">
            <div class="platform-badges">
              <span class="status-badge available">운영중</span>
              <span class="status-badge available">사용 가능</span>
            </div>
          </div>
          <h2>크라우드픽</h2>
          <p>크라우드픽 스톡 콘텐츠 제작자를 위한 분석 도구입니다.</p>
          <ul class="feature-list feature-checklist">
            <li>키워드 분석</li>
            <li>이번달 인기 검색 순위</li>
          </ul>
          <a class="cta-link" href="/crowdpic">분석 시작</a>
        </article>

      </section>

      <section class="page-card stack">
        <div class="eyebrow">FAQ</div>
        <h2>자주 묻는 질문</h2>
        ${HOME_FAQ_ITEMS.map((item) => `
          <article class="faq-item">
            <h3>${item.question}</h3>
            <p>${item.answer}</p>
          </article>
        `).join('')}
      </section>
    </div>
  `;

  const normalizedHomeHtml = homeHtml;

  const miricanvasHtml = `
    <div class="page-grid">
      <section class="page-card stack">
        <div class="eyebrow">Miricanvas Platform</div>
        <h2>미리캔버스에서 스톡 콘텐츠를 제작하는 스톡 크리에이터를 위한 분석 도구</h2>
        <p>미리캔버스 분석 도구는 스톡 크리에이터가 상위 노출 키워드와 인기 템플릿 제목 패턴을 빠르게 파악할 수 있도록 설계되어 있습니다.</p>
      </section>

      <section class="miricanvas-tool-grid">
        <article class="feature-card">
          <div class="eyebrow">Keyword Analysis</div>
          <h2>키워드 분석</h2>
          <p>실시간 상위 콘텐츠를 분석하여 가장 많이 사용되는 키워드를 추천합니다.</p>
          <a class="cta-link" href="/miricanvas/tag">키워드 분석 시작</a>
        </article>
        <article class="feature-card">
          <div class="eyebrow">Template Analysis</div>
          <h2>템플릿 분석</h2>
          <p>인기 템플릿의 제목 키워드와 상위 노출 패턴을 분석합니다.</p>
          <a class="cta-link" href="/miricanvas/template">템플릿 분석 시작</a>
        </article>
        <article class="feature-card">
          <div class="eyebrow">Monthly Rankings</div>
          <h2>이번달 인기 검색 순위</h2>
          <p>이번달 미리캔버스 인기 검색 데이터를 기준으로 많이 찾는 키워드와 템플릿을 정리합니다.</p>
          <a class="cta-link" href="/miricanvas/rankings">인기 검색 순위 확인</a>
        </article>
      </section>

      <section class="page-card stack">
        <div class="eyebrow">FAQ</div>
        <h2>자주 묻는 질문</h2>
        ${MIRICANVAS_FAQ_ITEMS.map((item) => `
          <article class="faq-item">
            <h3>${item.question}</h3>
            <p>${item.answer}</p>
          </article>
        `).join('')}
      </section>
    </div>
  `;

  const notFoundHtml = `
    <div class="page-grid">
      <section class="page-card stack">
        <div class="eyebrow">404 Not Found</div>
        <h2>페이지를 찾을 수 없습니다</h2>
        <p>요청하신 페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.</p>
        <div class="actions">
          <a class="cta-link" href="/">홈으로 이동</a>
          <a class="ghost-link" href="/miricanvas/tag">키워드 분석</a>
          <a class="ghost-link" href="/miricanvas/template">템플릿 분석</a>
        </div>
      </section>
    </div>
  `;

  const rankingsHtml = `
    <div class="page-grid">
      <section class="page-card stack">
        <div class="eyebrow">Monthly Rankings</div>
        <h2>이번달 인기 검색 순위</h2>
        <p>이번달 미리캔버스 인기 검색 데이터를 기준으로 많이 찾는 키워드와 템플릿을 정리합니다.</p>
        <div class="summary-grid" id="rankingPanel">
          <section class="summary-card">
            <h3>이번달 키워드 검색 순위 TOP 20</h3>
            <div class="result-empty">불러오는 중...</div>
          </section>
          <section class="summary-card">
            <h3>이번달 콘텐츠 유형 검색 순위</h3>
            <div class="result-empty">불러오는 중...</div>
          </section>
          <section class="summary-card">
            <h3>이번달 템플릿 종류 검색 순위 TOP 20</h3>
            <div class="result-empty">불러오는 중...</div>
          </section>
          <section class="summary-card">
            <h3>이번달 템플릿 키워드 검색 순위 TOP 20</h3>
            <div class="result-empty">불러오는 중...</div>
          </section>
        </div>
      </section>
    </div>
  `;

  const contentHtml = options.contentHtml || (isNotFoundPage
    ? notFoundHtml
    : isHomePage
      ? normalizedHomeHtml
    : isMiricanvasPage
      ? miricanvasHtml
    : isRankingsPage
      ? rankingsHtml
    : staticPage
      ? `<div class="page-grid">${staticPage.content}</div>`
      : `
        <div class="grid">
          ${toolHtml}

          <section class="card">
            <label>결과</label>
            <div class="result-panel" id="resultPanel">
              <div class="result-empty">아직 결과가 없습니다.</div>
            </div>
          </section>
        </div>
      `);

  return `<!doctype html>
<html lang="ko">
<head>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-THGZ9WD3');</script>
  <!-- End Google Tag Manager -->
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="google-adsense-account" content="ca-pub-3386559853644133" />
  <meta name="naver-site-verification" content="b6e5b11e3e08d55df1d3c09091738722d414eb42" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <title>${escapeHtml(seo.title)}</title>
  <meta name="description" content="${escapeHtml(seo.description)}" />
  <meta name="robots" content="${isNotFoundPage ? 'noindex' : 'index,follow'}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:site_name" content="스톡 크리에이터 분석 도구" />
  <meta property="og:title" content="${escapeHtml(seo.title)}" />
  <meta property="og:description" content="${escapeHtml(seo.description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
  <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-5J443L4F10"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-5J443L4F10');
  </script>
  ${structuredDataScripts}
  <style>
    :root {
      color-scheme: light;
      --page: #ffffff;
      --panel: #ffffff;
      --panel-strong: #f8fafc;
      --surface: #f8fafc;
      --surface-strong: #eff6ff;
      --text: #111827;
      --muted: #6b7280;
      --accent: #2563eb;
      --accent-hover: #1d4ed8;
      --accent-soft: #dbeafe;
      --accent-soft-strong: #bfdbfe;
      --border: #e5e7eb;
      --shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background: var(--page);
      min-height: 100vh;
    }

    .wrap {
      max-width: 1180px;
      margin: 0 auto;
      padding: 24px 20px 48px;
    }

    .topbar {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 18px;
    }

    .menu {
      display: inline-flex;
      gap: 8px;
      padding: 8px;
      border-radius: 999px;
      background: #ffffff;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      overflow-x: auto;
    }

    .menu a {
      text-decoration: none;
      color: var(--accent-2);
      padding: 10px 16px;
      border-radius: 999px;
      white-space: nowrap;
      font-weight: 700;
    }

    .menu a.active {
      background: var(--accent);
      color: white;
    }

    .hero {
      padding: 28px;
      border: 1px solid var(--border);
      border-radius: 28px;
      background: var(--panel);
      box-shadow: var(--shadow);
    }

    h1 {
      margin: 0 0 10px;
      font-size: clamp(28px, 4vw, 48px);
      letter-spacing: -0.04em;
      line-height: 1.05;
    }

    .desc {
      margin: 0;
      color: var(--muted);
      font-size: 15px;
      line-height: 1.6;
    }

    .grid {
      display: grid;
      grid-template-columns: 0.95fr 1.05fr;
      gap: 20px;
      margin-top: 20px;
    }

    .home-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .miricanvas-tool-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .platform-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
    }

    .ad-slot {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 88px;
      border: 1px dashed var(--border);
      border-radius: 20px;
      background: var(--surface);
      color: var(--muted);
      font-size: 14px;
      font-weight: 600;
    }

    .page-grid {
      display: grid;
      gap: 20px;
      margin-top: 20px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
    }

    .card {
      background: var(--panel-strong);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 20px;
      box-shadow: var(--shadow);
    }

    .page-card,
    .feature-card {
      background: var(--panel-strong);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 24px;
      box-shadow: var(--shadow);
    }

    .summary-card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 22px;
      box-shadow: var(--shadow);
    }

    .compact-ranking-panel {
      display: grid;
      gap: 12px;
      margin-top: 14px;
    }

    .compact-ranking-panel .summary-card {
      padding: 16px;
      border-radius: 18px;
    }

    .compact-ranking-panel .summary-card h3 {
      font-size: 16px;
      margin-bottom: 10px;
    }

    .summary-card h3 {
      margin: 0 0 10px;
      font-size: 18px;
      letter-spacing: -0.02em;
    }

    .rank-list {
      margin: 0;
      padding-left: 0;
      list-style: none;
      display: grid;
      gap: 8px;
    }

    .rank-item {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 14px;
      background: #ffffff;
      border: 1px solid var(--border);
      font-size: 14px;
    }

    .rank-order {
      font-weight: 800;
      color: var(--accent);
      min-width: 28px;
    }

    .rank-label {
      color: var(--text);
      line-height: 1.5;
      word-break: keep-all;
    }

    .rank-count {
      color: var(--muted);
      font-weight: 700;
      white-space: nowrap;
    }

    .feature-card h2,
    .page-card h2,
    .summary-card h2 {
      margin: 0 0 10px;
      font-size: 26px;
      letter-spacing: -0.03em;
    }

    .feature-card p,
    .page-card p,
    .summary-card p {
      margin: 0;
      color: var(--muted);
      line-height: 1.7;
      font-size: 15px;
    }

    .faq-item {
      padding: 18px 0;
      border-top: 1px solid var(--border);
    }

    .faq-item:first-of-type {
      border-top: 0;
      padding-top: 0;
    }

    .faq-item h3 {
      margin: 0 0 8px;
      font-size: 18px;
      letter-spacing: -0.02em;
    }

    .platform-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .platform-card {
      display: grid;
      align-content: start;
      gap: 14px;
    }

    .platform-badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 7px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      border: 1px solid var(--border);
    }

    .status-badge.available {
      background: var(--accent-soft);
      color: var(--accent);
      border-color: var(--accent-soft-strong);
    }

    .status-badge.coming {
      background: var(--surface);
      color: var(--muted);
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 14px;
      color: var(--muted);
      font-size: 14px;
    }

    .breadcrumb a {
      color: var(--muted);
      text-decoration: none;
      font-weight: 600;
    }

    .breadcrumb-sep {
      color: #9ca3af;
    }

    .feature-list {
      margin: 0;
      padding-left: 18px;
      color: var(--muted);
      line-height: 1.8;
    }

    .feature-checklist {
      list-style: none;
      padding-left: 0;
      display: grid;
      gap: 8px;
    }

    .feature-checklist li {
      position: relative;
      padding-left: 24px;
      color: var(--text);
      font-size: 14px;
      font-weight: 600;
      line-height: 1.6;
    }

    .feature-checklist li::before {
      content: '✓';
      position: absolute;
      left: 0;
      top: 0;
      color: var(--accent);
      font-weight: 800;
    }

    .eyebrow {
      display: inline-block;
      margin-bottom: 14px;
      padding: 8px 12px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    label {
      display: block;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 10px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    textarea,
    .text-input {
      width: 100%;
      border-radius: 18px;
      border: 1px solid var(--border);
      padding: 16px;
      font: inherit;
      outline: none;
      background: #fff;
      line-height: 1.6;
    }

    textarea {
      min-height: 180px;
      resize: vertical;
    }

    textarea:focus,
    .text-input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
    }

    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 14px;
    }

    button {
      appearance: none;
      border: 1px solid transparent;
      border-radius: 999px;
      padding: 12px 18px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
    }

    .primary {
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }

    .primary:hover {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
    }

    .secondary {
      background: #ffffff;
      color: var(--accent);
      border-color: var(--border);
    }

    .copy-chip {
      background: #ffffff;
      color: var(--accent);
      border-color: var(--border);
      padding: 9px 14px;
      font-size: 13px;
    }

    .status {
      margin-top: 12px;
      font-size: 13px;
      color: var(--muted);
    }

    .result-panel {
      min-height: 240px;
      background: #fff;
      border-radius: 18px;
      border: 1px solid var(--border);
      padding: 16px;
    }

    .result-empty {
      color: var(--muted);
      line-height: 1.7;
      font-size: 14px;
    }

    .tabs {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding-bottom: 6px;
      margin-bottom: 14px;
      scrollbar-width: thin;
    }

    .tab-btn {
      flex: 0 0 auto;
      background: #ffffff;
      color: var(--muted);
      border: 1px solid var(--border);
      padding: 10px 14px;
      font-size: 14px;
    }

    .tab-btn.active {
      background: var(--accent);
      color: white;
      border-color: transparent;
    }

    .type-panel {
      margin-top: 12px;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: #fff;
      overflow: hidden;
    }

    .type-filter-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 12px;
      border-bottom: 1px solid var(--border);
      background: var(--panel);
    }

    .type-filter-tab {
      flex: 0 0 auto;
      border: 1px solid var(--border);
      background: #ffffff;
      color: var(--muted);
      padding: 9px 14px;
      font-size: 13px;
    }

    .type-filter-tab.active {
      background: var(--accent);
      color: white;
      border-color: transparent;
    }

    .type-panel-list {
      max-height: 360px;
      overflow-y: auto;
      padding: 12px;
      display: grid;
      gap: 12px;
    }

    .type-group {
      display: grid;
      gap: 8px;
    }

    .type-group-title {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: var(--muted);
      text-transform: uppercase;
    }

    .type-option-list {
      display: grid;
      gap: 8px;
    }

    .type-option-btn,
    .type-parent-btn {
      width: 100%;
      text-align: left;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: #ffffff;
      color: var(--text);
      padding: 12px 14px;
      font-size: 14px;
    }

    .type-option-btn.active,
    .type-parent-btn.active {
      background: var(--accent-soft);
      border-color: var(--accent-soft-strong);
      color: var(--accent);
    }

    .type-parent-meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }

    .type-child-list {
      display: grid;
      gap: 8px;
      padding-left: 14px;
      border-left: 2px solid var(--border);
      margin-left: 6px;
    }

    .selected-type {
      margin-top: 12px;
      padding: 12px 14px;
      border-radius: 14px;
      background: var(--surface);
      color: var(--text);
      border: 1px solid var(--border);
      font-size: 14px;
      font-weight: 700;
    }

    .result-card {
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 16px;
      background: var(--panel);
    }

    .result-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .result-title {
      margin: 0;
      font-size: 18px;
      letter-spacing: -0.03em;
    }

    .meta {
      margin-top: 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.6;
    }

    .result-text {
      white-space: pre-wrap;
      word-break: keep-all;
      line-height: 1.7;
      font-size: 14px;
      background: #fff;
      border-radius: 14px;
      border: 1px solid var(--border);
      padding: 14px;
      margin-top: 12px;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px 8px 12px;
      border-radius: 999px;
      background: var(--surface);
      color: var(--accent);
      font-size: 13px;
      border: 1px solid var(--border);
    }

    .tag-label {
      line-height: 1;
    }

    .tag-remove {
      appearance: none;
      border: 0;
      background: transparent;
      color: var(--accent);
      padding: 0;
      width: 16px;
      height: 16px;
      min-width: 16px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 800;
      line-height: 1;
      cursor: pointer;
    }

    .tag-remove:hover {
      background: rgba(37, 99, 235, 0.12);
    }

    .stack {
      display: grid;
      gap: 14px;
    }

    .metric-block {
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 14px;
      background: var(--panel);
    }

    .metric-title {
      margin: 0 0 10px;
      font-size: 15px;
      font-weight: 700;
    }

    .metric-list {
      display: grid;
      gap: 8px;
    }

    .metric-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 12px;
      background: var(--surface);
      font-size: 14px;
    }

    .title-list {
      margin: 0;
      padding-left: 18px;
      display: grid;
      gap: 8px;
      font-size: 14px;
      line-height: 1.6;
    }

    .cta-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 18px;
      padding: 12px 18px;
      border-radius: 999px;
      background: var(--accent);
      color: #fff;
      text-decoration: none;
      font-weight: 800;
      border: 1px solid var(--accent);
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }

    .cta-link:hover {
      background: var(--accent-hover);
      border-color: var(--accent-hover);
    }

    .ghost-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 18px;
      padding: 12px 18px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: #ffffff;
      color: var(--accent);
      text-decoration: none;
      font-weight: 800;
    }

    .disabled-link {
      cursor: default;
      color: var(--muted);
      border-color: var(--border);
      background: var(--surface);
    }

    .site-footer {
      margin-top: 28px;
      padding: 18px 20px;
      border-radius: 24px;
      border: 1px solid var(--border);
      background: var(--panel);
      box-shadow: var(--shadow);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .footer-brand {
      color: var(--muted);
      font-size: 14px;
    }

    .footer-links {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
    }

    .footer-links a {
      color: var(--accent);
      text-decoration: none;
      font-size: 14px;
      font-weight: 700;
    }

    @media (max-width: 920px) {
      .grid {
        grid-template-columns: 1fr;
      }

      .home-grid {
        grid-template-columns: 1fr;
      }

      .platform-grid {
        grid-template-columns: 1fr;
      }

      .miricanvas-tool-grid {
        grid-template-columns: 1fr;
      }

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .hero {
        padding: 22px;
      }

      .tabs {
        margin-left: -2px;
        margin-right: -2px;
      }

      .menu {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-THGZ9WD3"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->
  <div class="wrap">
    <div class="topbar">
            <nav class="menu" aria-label="서비스 메뉴">
        <a href="/" class="${activeMenu === 'home' ? 'active' : ''}">홈</a>
        <a href="/miricanvas" class="${activeMenu === 'miricanvas' ? 'active' : ''}">미리캔버스</a>
        <a href="/crowdpic" class="${activeMenu === 'crowdpic' ? 'active' : ''}">크라우드픽</a>
      </nav>
    </div>

    ${breadcrumbHtml}

    <section class="hero">
      <h1>${heroTitle}</h1>
      <p class="desc">${heroDesc}</p>
    </section>

    <main>
      ${contentHtml}
    </main>

    <footer class="site-footer">
      <div class="footer-brand">스톡 크리에이터 분석 도구</div>
      <nav class="footer-links" aria-label="하단 정보 링크">
        <a href="/about">서비스 소개</a>
        <a href="/privacy">개인정보처리방침</a>
        <a href="/terms">이용약관</a>
        <a href="/contact">문의</a>
      </nav>
    </footer>
  </div>

  <script>
    const CURRENT_PATH = window.location.pathname;
    const DEBUG = ${JSON.stringify(DEBUG)};
    const TEMPLATE_TYPE_OPTIONS = ${JSON.stringify(TEMPLATE_TYPE_MAP)};
    const TEMPLATE_FILTER_TABS = ${JSON.stringify(TEMPLATE_FILTER_TABS)};
    const TEMPLATE_RESULT_TABS = ${JSON.stringify(TEMPLATE_RESULT_TABS)};
    const MIRICANVAS_CATEGORY_OPTIONS = ${JSON.stringify(MIRICANVAS_CATEGORY_OPTIONS)};
    const MAX_KEYWORDS = ${MAX_KEYWORDS_PER_REQUEST};
    const resultPanelEl = document.getElementById('resultPanel');
    const statusEl = document.getElementById('status');
    const keywordEl = document.getElementById('keyword');
    const categoryEl = document.getElementById('category');
    const runBtn = document.getElementById('runBtn');
    const templateKeywordEl = document.getElementById('templateKeyword');
    const templateTypeSearchEl = document.getElementById('templateTypeSearch');
    const templateTypeTabsEl = document.getElementById('templateTypeTabs');
    const templateTypePanelEl = document.getElementById('templateTypePanel');
    const selectedTemplateTypeTextEl = document.getElementById('selectedTemplateTypeText');
    const templateRunBtn = document.getElementById('templateRunBtn');
    const rankingPanelEl = document.getElementById('rankingPanel');

    function debugLog(...args) {
      if (!DEBUG) return;
      console.log(...args);
    }

    function cleanText(value) {
      return String(value ?? '').replace(/\\uFEFF/g, '').trim();
    }

    function normalizeTemplateApiValues(apiValue, fallbackValue = '') {
      const values = Array.isArray(apiValue) ? apiValue : [apiValue || fallbackValue];
      return values.map((value) => cleanText(value)).filter(Boolean);
    }

    function flattenTemplateTypeItems(items, parentPath = []) {
      const flattened = [];

      for (const item of items) {
        const currentPath = [...parentPath, item.label];

        if (Array.isArray(item.children) && item.children.length > 0) {
          flattened.push(...flattenTemplateTypeItems(item.children, currentPath));
          continue;
        }

        flattened.push({
          ...item,
          pathLabels: currentPath,
        });
      }

      return flattened;
    }

    const FLAT_TEMPLATE_TYPE_OPTIONS = flattenTemplateTypeItems(TEMPLATE_TYPE_OPTIONS);
    const TEMPLATE_TYPE_INDEX = new Map(FLAT_TEMPLATE_TYPE_OPTIONS.map((item) => [item.value, item]));
    const TEMPLATE_TYPE_API_INDEX = new Map();
    for (const item of FLAT_TEMPLATE_TYPE_OPTIONS) {
      const apiKeys = normalizeTemplateApiValues(item.apiValue, item.value);
      for (const apiKey of apiKeys) {
        if (!TEMPLATE_TYPE_API_INDEX.has(apiKey)) {
          TEMPLATE_TYPE_API_INDEX.set(apiKey, item);
        }
      }
    }
    const TEMPLATE_RESULT_TAB_INDEX = new Map(TEMPLATE_RESULT_TABS.map((item) => [item.key, item]));

    let lastResults = [];
    let lastTemplateResult = null;
    let selectedTemplateTypeValue = 'presentation';
    let currentTemplateFilterTab = 'all';
    let currentTemplateSearchText = '';
    const expandedTemplateGroups = new Set();

    function parseKeywordsInput(input) {
      const lines = String(input || '')
        .split(/\\r?\\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const seen = new Set();
      const keywords = [];

      for (const line of lines) {
        if (seen.has(line)) continue;
        seen.add(line);
        keywords.push(line);
      }

      return keywords;
    }

    function parseKeywordsQuery(rawQuery) {
      return String(rawQuery || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((value, index, array) => array.indexOf(value) === index);
    }

    function validateKeywordsLimit(keywords) {
      if (keywords.length > MAX_KEYWORDS) {
        throw new Error('한 번에 최대 5개 키워드까지 분석할 수 있습니다.');
      }
    }

    function parseSingleKeywordInput(input) {
      const keywords = parseKeywordsInput(input);

      if (keywords.length === 0) {
        throw new Error('키워드를 입력하세요.');
      }

      if (keywords.length > 1) {
        throw new Error('템플릿 분석은 키워드 1개만 입력할 수 있습니다.');
      }

      return keywords[0];
    }

    function normalizeTemplateTab(tabKey) {
      const value = cleanText(tabKey);
      if (TEMPLATE_RESULT_TAB_INDEX.has(value)) {
        return value;
      }
      return TEMPLATE_RESULT_TABS[0].key;
    }

    function resolveTemplateTypeConfig(value) {
      const normalized = cleanText(value);
      return TEMPLATE_TYPE_INDEX.get(normalized) || TEMPLATE_TYPE_API_INDEX.get(normalized) || null;
    }

    function setStatus(text) {
      statusEl.textContent = text;
    }

    async function copyText(text, successMessage) {
      await navigator.clipboard.writeText(text);
      setStatus(successMessage);
    }

    function normalizeMiricanvasCategory(value) {
      const normalized = cleanText(value);
      return MIRICANVAS_CATEGORY_OPTIONS.some((item) => item.value === normalized)
        ? normalized
        : MIRICANVAS_CATEGORY_OPTIONS[0].value;
    }

    function buildElementResultUrl(keyword, category) {
      return (
        '/miricanvas/tag?q=' +
        encodeURIComponent(keyword) +
        '&category=' +
        encodeURIComponent(normalizeMiricanvasCategory(category))
      );
    }

    function buildTemplateResultUrl(keyword, type, tab) {
      return (
        '/miricanvas/template?q=' +
        encodeURIComponent(keyword) +
        '&type=' +
        encodeURIComponent(type) +
        '&tab=' +
        encodeURIComponent(normalizeTemplateTab(tab))
      );
    }

    function createRankingCard(titleText, items, valueKey) {
      const card = document.createElement('section');
      card.className = 'summary-card';

      const heading = document.createElement('h3');
      heading.textContent = titleText;
      card.appendChild(heading);

      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'result-empty';
        empty.textContent = '이번달 데이터가 아직 없습니다.';
        card.appendChild(empty);
        return card;
      }

      const list = document.createElement('ol');
      list.className = 'rank-list';

      items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'rank-item';

        const rank = document.createElement('span');
        rank.className = 'rank-order';
        rank.textContent = String(index + 1);

        const label = document.createElement('span');
        label.className = 'rank-label';
        label.textContent = item[valueKey] || '-';

        const count = document.createElement('span');
        count.className = 'rank-count';
        count.textContent = (item.count || 0) + '회';

        li.appendChild(rank);
        li.appendChild(label);
        li.appendChild(count);
        list.appendChild(li);
      });

      card.appendChild(list);
      return card;
    }

    function renderMonthlyRankings(data) {
      if (!rankingPanelEl) return;
      rankingPanelEl.innerHTML = '';

      rankingPanelEl.appendChild(
        createRankingCard('이번달 키워드 검색 순위 TOP 20', data.keywordSearchTop20 || [], 'keyword')
      );
      rankingPanelEl.appendChild(
        createRankingCard('이번달 콘텐츠 유형 검색 순위', data.contentTypeTop20 || [], 'label')
      );
      rankingPanelEl.appendChild(
        createRankingCard('이번달 템플릿 종류 검색 순위 TOP 20', data.templateTypeTop20 || [], 'label')
      );
      rankingPanelEl.appendChild(
        createRankingCard('이번달 템플릿 키워드 검색 순위 TOP 20', data.templateKeywordTop20 || [], 'keyword')
      );
    }

    async function loadMonthlyRankings() {
      if (!rankingPanelEl) return;

      try {
        const response = await fetch('/api/monthly-rankings');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || '랭킹 요청 실패');
        }

        renderMonthlyRankings(data);
      } catch (error) {
        rankingPanelEl.innerHTML = '';
        const card = document.createElement('section');
        card.className = 'summary-card';
        const heading = document.createElement('h3');
        heading.textContent = '이번달 인기 검색 순위';
        const empty = document.createElement('div');
        empty.className = 'result-empty';
        empty.textContent = error?.message || String(error);
        card.appendChild(heading);
        card.appendChild(empty);
        rankingPanelEl.appendChild(card);
      }
    }

    function getEditableTags(item) {
      if (!Array.isArray(item.editableTopTags)) {
        item.editableTopTags = [...(item.topTags || [])];
      }

      return item.editableTopTags;
    }

    function buildMetaTagString(tags) {
      return tags.join(', ');
    }

    function renderTags(tags, onRemove) {
      const wrap = document.createElement('div');
      wrap.className = 'tags';

      for (const [index, tag] of tags.entries()) {
        const chip = document.createElement('span');
        chip.className = 'tag';

        const label = document.createElement('span');
        label.className = 'tag-label';
        label.textContent = tag;
        chip.appendChild(label);

        if (typeof onRemove === 'function') {
          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'tag-remove';
          removeBtn.textContent = 'x';
          removeBtn.setAttribute('aria-label', tag + ' 삭제');
          removeBtn.addEventListener('click', () => {
            onRemove(index);
          });
          chip.appendChild(removeBtn);
        }

        wrap.appendChild(chip);
      }

      return wrap;
    }

    function createElementResultCard(item) {
      const editableTags = getEditableTags(item);
      const metaTagString = buildMetaTagString(editableTags);
      const card = document.createElement('section');
      card.className = 'result-card';

      const head = document.createElement('div');
      head.className = 'result-head';

      const title = document.createElement('h3');
      title.className = 'result-title';
      title.textContent = '[' + item.keyword + ']';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'secondary copy-chip';
      copyBtn.textContent = '복사하기';
      copyBtn.addEventListener('click', async () => {
        await copyText(metaTagString || '', item.keyword + ' 복사 완료');
      });

      head.appendChild(title);
      head.appendChild(copyBtn);

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = '추천 키워드: ' + editableTags.length + '개 / 수집일: ' + item.collectedAt;

      const text = document.createElement('div');
      text.className = 'result-text';
      text.textContent = metaTagString || '(추천 키워드 없음)';

      card.appendChild(head);
      card.appendChild(meta);
      card.appendChild(text);
      card.appendChild(renderTags(editableTags, (tagIndex) => {
        editableTags.splice(tagIndex, 1);
        renderElementResults(lastResults[0] || null);
      }));

      return card;
    }

    function renderElementResults(result) {
      resultPanelEl.innerHTML = '';
      lastResults = result ? [result] : [];

      if (!result) {
        resultPanelEl.innerHTML = '<div class="result-empty">분석할 키워드가 없습니다.</div>';
        return;
      }

      getEditableTags(result);
      resultPanelEl.appendChild(createElementResultCard(result));
    }

    function createMetricBlock(titleText, rows) {
      const block = document.createElement('section');
      block.className = 'metric-block';

      const title = document.createElement('h3');
      title.className = 'metric-title';
      title.textContent = titleText;
      block.appendChild(title);

      if (!rows.length) {
        const empty = document.createElement('div');
        empty.className = 'result-empty';
        empty.textContent = '분석 가능한 데이터가 없습니다.';
        block.appendChild(empty);
        return block;
      }

      const list = document.createElement('div');
      list.className = 'metric-list';

      rows.forEach((row) => {
        list.appendChild(row);
      });

      block.appendChild(list);
      return block;
    }

    function createMetricRow(leftText, rightText) {
      const row = document.createElement('div');
      row.className = 'metric-row';

      const left = document.createElement('span');
      left.textContent = leftText;

      const right = document.createElement('span');
      right.textContent = rightText;

      row.appendChild(left);
      row.appendChild(right);
      return row;
    }

    function createTitleListBlock(titleText, items) {
      const block = document.createElement('section');
      block.className = 'metric-block';

      const heading = document.createElement('h3');
      heading.className = 'metric-title';
      heading.textContent = titleText;
      block.appendChild(heading);

      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'result-empty';
        empty.textContent = '분석 가능한 데이터가 없습니다.';
        block.appendChild(empty);
        return block;
      }

      const list = document.createElement('ol');
      list.className = 'title-list';

      items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });

      block.appendChild(list);
      return block;
    }

    function createTemplateTabButtons(result, selectedTab) {
      const tabs = document.createElement('div');
      tabs.className = 'tabs';

      TEMPLATE_RESULT_TABS.forEach((tab) => {
        const tabBtn = document.createElement('button');
        tabBtn.className = 'tab-btn' + (tab.key === selectedTab ? ' active' : '');
        tabBtn.textContent = tab.label;
        tabBtn.addEventListener('click', () => {
          const nextTab = normalizeTemplateTab(tab.key);
          const nextUrl = buildTemplateResultUrl(result.keyword, result.typeValue, nextTab);
          window.history.replaceState({}, '', nextUrl);
          renderTemplateResult(lastTemplateResult, nextTab);
        });
        tabs.appendChild(tabBtn);
      });

      return tabs;
    }

    function buildTemplateTabContent(result, selectedTab) {
      if (selectedTab === 'pageCount') {
        const rows = (result.pageCountRatios || []).map((item) =>
          createMetricRow(item.label, item.count + '개 / ' + item.percentage + '%')
        );
        return createMetricBlock('페이지 수 비율', rows);
      }

      if (selectedTab === 'topTitles') {
        return createTitleListBlock('상위 템플릿 제목 30개', result.topTemplateTitles || []);
      }

      const rows = (result.titleKeywordTop10 || []).map((item) =>
        createMetricRow(item.value, item.count + '회 / ' + item.percentage + '%')
      );
      return createMetricBlock('제목 키워드 TOP 10', rows);
    }

    function renderTemplateResult(result, requestedTab) {
      resultPanelEl.innerHTML = '';
      lastTemplateResult = result;

      if (!result) {
        resultPanelEl.innerHTML = '<div class="result-empty">결과가 없습니다.</div>';
        return;
      }

      const selectedTab = normalizeTemplateTab(requestedTab);
      const card = document.createElement('section');
      card.className = 'result-card stack';

      const head = document.createElement('div');
      head.className = 'result-head';

      const title = document.createElement('h3');
      title.className = 'result-title';
      title.textContent = '[' + result.keyword + '] ' + result.typeLabel;
      head.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = '분석 대상: ' + result.templateCount + '개 / 수집일: ' + result.collectedAt;

      card.appendChild(head);
      card.appendChild(meta);
      card.appendChild(createTemplateTabButtons(result, selectedTab));
      card.appendChild(buildTemplateTabContent(result, selectedTab));

      resultPanelEl.appendChild(card);
    }

    function setSelectedTemplateType(value) {
      const config = resolveTemplateTypeConfig(value);
      if (!config) return;
      selectedTemplateTypeValue = config.value;
      updateSelectedTemplateTypeText();
      renderTemplateTypePanel();
    }

    function updateSelectedTemplateTypeText() {
      if (!selectedTemplateTypeTextEl) return;

      const selected = TEMPLATE_TYPE_INDEX.get(selectedTemplateTypeValue);
      if (!selected) {
        selectedTemplateTypeTextEl.textContent = '선택됨: 없음';
        return;
      }

      const pathLabels = Array.isArray(selected.pathLabels) ? [...selected.pathLabels] : [selected.label];
      if (pathLabels[0] === selected.group) {
        pathLabels.shift();
      }
      const pathText = pathLabels.join(' > ');
      selectedTemplateTypeTextEl.textContent = '선택됨: ' + selected.group + ' > ' + pathText;
    }

    function createTemplateFilterTabs() {
      if (!templateTypeTabsEl) return;
      templateTypeTabsEl.innerHTML = '';

      TEMPLATE_FILTER_TABS.forEach((tab) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'type-filter-tab' + (tab.key === currentTemplateFilterTab ? ' active' : '');
        btn.textContent = tab.label;
        btn.addEventListener('click', () => {
          currentTemplateFilterTab = tab.key;
          renderTemplateTypePanel();
          createTemplateFilterTabs();
        });
        templateTypeTabsEl.appendChild(btn);
      });
    }

    function toggleTemplateGroup(groupKey) {
      if (expandedTemplateGroups.has(groupKey)) {
        expandedTemplateGroups.delete(groupKey);
      } else {
        expandedTemplateGroups.add(groupKey);
      }
      renderTemplateTypePanel();
    }

    function matchesTemplateFilterTab(item) {
      return currentTemplateFilterTab === 'all' || item.group === currentTemplateFilterTab;
    }

    function itemMatchesTemplateSearch(item) {
      const searchText = currentTemplateSearchText.toLowerCase();
      if (!searchText) return true;

      const pathText = Array.isArray(item.pathLabels) ? item.pathLabels.join(' ') : '';
      return (
        item.label.toLowerCase().includes(searchText) ||
        item.group.toLowerCase().includes(searchText) ||
        pathText.toLowerCase().includes(searchText)
      );
    }

    function itemHasMatchingDescendant(item) {
      if (!Array.isArray(item.children) || item.children.length === 0) {
        return itemMatchesTemplateSearch(item);
      }

      if (itemMatchesTemplateSearch(item)) {
        return true;
      }

      return item.children.some((child) => itemHasMatchingDescendant(child));
    }

    function appendTemplateNode(parentEl, item, depth = 0, groupKey = item.value) {
      const hasSearchText = currentTemplateSearchText.length > 0;
      const selfMatchesSearch = itemMatchesTemplateSearch(item);
      const descendantMatchesSearch = itemHasMatchingDescendant(item);
      const visibleBySearch = !hasSearchText || selfMatchesSearch || descendantMatchesSearch;
      const visibleByTab = matchesTemplateFilterTab(item);

      if (!visibleByTab || !visibleBySearch) {
        return;
      }

      if (Array.isArray(item.children) && item.children.length > 0) {
        const shouldExpand = hasSearchText
          ? selfMatchesSearch || descendantMatchesSearch || expandedTemplateGroups.has(groupKey)
          : expandedTemplateGroups.has(groupKey);
        const parentBtn = document.createElement('button');
        parentBtn.type = 'button';
        parentBtn.className = 'type-parent-btn';

        const meta = document.createElement('div');
        meta.className = 'type-parent-meta';

        const label = document.createElement('span');
        label.textContent = item.label;

        const marker = document.createElement('span');
        marker.textContent = shouldExpand ? '접기' : '펼치기';

        meta.appendChild(label);
        meta.appendChild(marker);
        parentBtn.appendChild(meta);
        parentBtn.addEventListener('click', () => toggleTemplateGroup(groupKey));
        parentEl.appendChild(parentBtn);

        if (shouldExpand) {
          const childList = document.createElement('div');
          childList.className = 'type-child-list';

          item.children.forEach((child, index) => {
            appendTemplateNode(
              childList,
              child,
              depth + 1,
              groupKey + ':' + index + ':' + child.label
            );
          });

          if (childList.childElementCount > 0) {
            parentEl.appendChild(childList);
          }
        }

        return;
      }

      const optionBtn = document.createElement('button');
      optionBtn.type = 'button';
      optionBtn.className =
        'type-option-btn' +
        (item.value === selectedTemplateTypeValue ? ' active' : '');
      optionBtn.textContent = item.label;
      optionBtn.addEventListener('click', () => setSelectedTemplateType(item.value));
      parentEl.appendChild(optionBtn);
    }

    function renderTemplateTypePanel() {
      if (!templateTypePanelEl) return;
      templateTypePanelEl.innerHTML = '';

      const visibleGroups = TEMPLATE_FILTER_TABS
        .filter((tab) => tab.key !== 'all')
        .map((tab) => tab.key);

      const groupsToRender =
        currentTemplateFilterTab === 'all'
          ? [...new Set(FLAT_TEMPLATE_TYPE_OPTIONS.map((item) => item.group))]
          : [currentTemplateFilterTab];

      let renderedAny = false;

      groupsToRender.forEach((groupName) => {
        const groupSection = document.createElement('section');
        groupSection.className = 'type-group';

        const heading = document.createElement('div');
        heading.className = 'type-group-title';
        heading.textContent = groupName;
        groupSection.appendChild(heading);

        const list = document.createElement('div');
        list.className = 'type-option-list';

        const topLevelItems = TEMPLATE_TYPE_OPTIONS.filter((item) => item.group === groupName);
        topLevelItems.forEach((item, index) => {
          if (item.label === groupName && Array.isArray(item.children) && item.children.length > 0) {
            item.children.forEach((child, childIndex) => {
              appendTemplateNode(list, child, 0, groupName + ':' + index + ':' + childIndex + ':' + child.label);
            });
            return;
          }

          appendTemplateNode(list, item, 0, groupName + ':' + index + ':' + item.label);
        });

        if (list.childElementCount > 0) {
          renderedAny = true;
          groupSection.appendChild(list);
          templateTypePanelEl.appendChild(groupSection);
        }
      });

      if (!renderedAny) {
        templateTypePanelEl.innerHTML = '<div class="result-empty">검색 결과가 없습니다.</div>';
      }
    }

    function initializeTemplateTypePanel(defaultValue) {
      if (!templateTypePanelEl || !templateTypeTabsEl) return;

      const config = resolveTemplateTypeConfig(defaultValue);
      if (config) {
        selectedTemplateTypeValue = config.value;
      }

      createTemplateFilterTabs();
      updateSelectedTemplateTypeText();
      renderTemplateTypePanel();
    }

    async function loadElementResultPage() {
      const currentUrl = new URL(window.location.href);
      const keyword = cleanText(currentUrl.searchParams.get('q'));
      const category = normalizeMiricanvasCategory(currentUrl.searchParams.get('category'));

      if (!keyword) {
        resultPanelEl.innerHTML = '<div class="result-empty">분석할 키워드가 없습니다.</div>';
        setStatus('대기 중');
        return;
      }

      if (keywordEl) {
        keywordEl.value = keyword;
      }

      if (categoryEl) {
        categoryEl.value = category;
      }

      setStatus('미리캔버스 API 호출 중...');
      resultPanelEl.innerHTML = '<div class="result-empty">처리 중...</div>';
      lastResults = [];

      try {
        const response = await fetch('/api/collect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keyword,
            category,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || '요청 실패');
        }

        const result = data?.results?.[0] || data || null;
        renderElementResults(result);
        setStatus('1개 키워드 분석 완료');
      } catch (error) {
        resultPanelEl.innerHTML = '<div class="result-empty">오류: ' + (error?.message || String(error)) + '</div>';
        setStatus('실패');
      }
    }

    async function loadTemplateResultPage() {
      const currentUrl = new URL(window.location.href);
      const keyword = cleanText(currentUrl.searchParams.get('q'));
      const typeValue = cleanText(currentUrl.searchParams.get('type'));
      const selectedTab = normalizeTemplateTab(currentUrl.searchParams.get('tab'));

      initializeTemplateTypePanel(typeValue || 'presentation');

      if (!keyword || !typeValue) {
        resultPanelEl.innerHTML = '<div class="result-empty">키워드와 템플릿 종류를 입력하면 결과가 여기에 표시됩니다.</div>';
        setStatus('대기 중');
        return;
      }

      const typeConfig = resolveTemplateTypeConfig(typeValue);
      if (!typeConfig) {
        resultPanelEl.innerHTML = '<div class="result-empty">유효한 템플릿 종류를 선택하세요.</div>';
        setStatus('실패');
        return;
      }

      selectedTemplateTypeValue = typeConfig.value;
      updateSelectedTemplateTypeText();
      renderTemplateTypePanel();

      const canonicalUrl = buildTemplateResultUrl(keyword, typeConfig.value, selectedTab);
      if (window.location.pathname + window.location.search !== canonicalUrl) {
        window.history.replaceState({}, '', canonicalUrl);
      }

      if (templateKeywordEl) {
        templateKeywordEl.value = keyword;
      }

      setStatus('템플릿 분석 중...');
      resultPanelEl.innerHTML = '<div class="result-empty">처리 중...</div>';
      lastTemplateResult = null;

      try {
        const response = await fetch('/api/template-trend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keyword,
            type: typeValue,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || '요청 실패');
        }

        renderTemplateResult(data, selectedTab);
        setStatus('템플릿 분석 완료');
      } catch (error) {
        resultPanelEl.innerHTML = '<div class="result-empty">' + (error?.message || String(error)) + '</div>';
        setStatus('실패');
      }
    }

    if (templateTypeSearchEl) {
      templateTypeSearchEl.addEventListener('input', () => {
        currentTemplateSearchText = cleanText(templateTypeSearchEl.value);
        renderTemplateTypePanel();
      });
    }

    if (runBtn) {
      runBtn.addEventListener('click', () => {
        const keyword = cleanText(keywordEl?.value);
        const category = normalizeMiricanvasCategory(categoryEl?.value);

        if (!keyword) {
          setStatus('키워드를 입력하세요.');
          return;
        }

        window.location.href = buildElementResultUrl(keyword, category);
      });
    }

    if (templateRunBtn) {
      templateRunBtn.addEventListener('click', () => {
        try {
          const keyword = parseSingleKeywordInput(templateKeywordEl.value);
          const typeValue = cleanText(selectedTemplateTypeValue);

          const typeConfig = resolveTemplateTypeConfig(typeValue);
          if (!typeConfig) {
            throw new Error('유효한 템플릿 종류를 선택하세요.');
          }

          debugLog(
            '[template:selected]',
            JSON.stringify({
              label: typeConfig.label,
              value: typeConfig.value,
              apiValue: typeConfig.apiValue || typeConfig.value,
              purpose: typeConfig.purpose || (typeConfig.group === '동영상' ? 'VIDEO' : typeConfig.group === '인쇄' ? 'PRINT' : 'WEB'),
              tier: typeConfig.tier || 'PREMIUM',
            })
          );

          window.location.href = buildTemplateResultUrl(keyword, typeConfig.value, 'titleKeywords');
        } catch (error) {
          setStatus(error.message || String(error));
        }
      });
    }

    if (CURRENT_PATH === '/miricanvas/template') {
      initializeTemplateTypePanel('presentation');
    }

    if (rankingPanelEl) {
      loadMonthlyRankings();
    }

    if (CURRENT_PATH === '/miricanvas/tag') {
      loadElementResultPage();
    } else if (CURRENT_PATH === '/miricanvas/template') {
      loadTemplateResultPage();
    }
  </script>
</body>
</html>`;
}


  return {
    buildBreadcrumbItems,
    buildPageSeo,
    buildStructuredData,
    htmlPage,
  };
}
