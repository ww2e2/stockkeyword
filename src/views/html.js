import { renderClientScript } from './clientScript.js';
import { renderStyles } from './styles.js';

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
  ${renderStyles()}
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

  ${renderClientScript({
    DEBUG,
    MAX_KEYWORDS_PER_REQUEST,
    MIRICANVAS_CATEGORY_OPTIONS,
    TEMPLATE_FILTER_TABS,
    TEMPLATE_RESULT_TABS,
    TEMPLATE_TYPE_MAP,
  })}
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
