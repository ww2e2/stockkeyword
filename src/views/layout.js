import { escapeHtml } from './viewUtils.js';

function renderSidebarLink({
  activeMenu,
  id,
  href,
  label,
}) {
  const isActive = activeMenu === id;

  return `
    <a
      class="sidebar-link${isActive ? ' is-active' : ''}"
      href="${escapeHtml(href)}"
      ${isActive ? 'aria-current="page"' : ''}
    >
      <span class="sidebar-link-dot" aria-hidden="true"></span>
      <span>${escapeHtml(label)}</span>
    </a>
  `;
}

export function renderSidebar(activeMenu) {
  return `
    <aside class="sidebar" id="site-sidebar" aria-label="주요 메뉴">
      <a class="sidebar-brand" href="/">
        <span class="brand-mark" aria-hidden="true">
          <img
            class="brand-logo"
            src="/android-chrome-192x192.png"
            alt=""
            width="30"
            height="30"
          >
        </span>
        <span class="brand-name">StockKeyword</span>
      </a>

      <p class="sidebar-section-label">WORKSPACE</p>

      <nav class="sidebar-nav">
        <div class="sidebar-menu-group">
          ${renderSidebarLink({
            activeMenu,
            id: 'home',
            href: '/',
            label: '홈',
          })}
        </div>

        <div class="sidebar-menu-group sidebar-menu-group-platforms">
          ${renderSidebarLink({
            activeMenu,
            id: 'miricanvas',
            href: '/miricanvas',
            label: '미리캔버스',
          })}
        </div>

        <div class="sidebar-divider" aria-hidden="true"></div>

        <div class="sidebar-menu-group">
          ${renderSidebarLink({
            activeMenu,
            id: 'calendar',
            href: '/calendar',
            label: '월별 작업 캘린더',
          })}
        </div>

        <div class="sidebar-divider" aria-hidden="true"></div>

        <div class="sidebar-menu-group">
          ${renderSidebarLink({
            activeMenu,
            id: 'faq',
            href: '/faq',
            label: 'FAQ',
          })}
          ${renderSidebarLink({
            activeMenu,
            id: 'updates',
            href: '/updates',
            label: '업데이트',
          })}
        </div>

        <div class="sidebar-divider" aria-hidden="true"></div>

        <div class="sidebar-menu-group">
          ${renderSidebarLink({
            activeMenu,
            id: 'about',
            href: '/about',
            label: '소개',
          })}
          ${renderSidebarLink({
            activeMenu,
            id: 'privacy',
            href: '/privacy',
            label: '개인정보처리방침',
          })}
          ${renderSidebarLink({
            activeMenu,
            id: 'terms',
            href: '/terms',
            label: '이용약관',
          })}
          ${renderSidebarLink({
            activeMenu,
            id: 'contact',
            href: '/contact',
            label: '문의',
          })}
        </div>
      </nav>

    </aside>
  `;
}

export function renderTopbar(title, description) {
  return `
    <header class="topbar">
      <div class="topbar-inner">
        <button
          class="mobile-menu-button"
          type="button"
          data-sidebar-toggle
          aria-controls="site-sidebar"
          aria-expanded="false"
          aria-label="메뉴 열기"
        >
          <span aria-hidden="true">☰</span>
        </button>

        <div class="topbar-copy">
          <h1 class="page-title">${escapeHtml(title)}</h1>
          ${description
            ? `<p class="page-description">${escapeHtml(description)}</p>`
            : ''}
        </div>

      </div>
    </header>
  `;
}

export function resolveTopbarContent(pathname, opts, documentTitle, description) {
  const normalizedPath = String(pathname || '/').split('?')[0];
  const activeMenu = opts?.activeMenu || 'home';

  if (normalizedPath === '/') {
    return {
      title: '작업 홈',
      description: '스톡 작가를 위한 키워드·템플릿 리서치 워크벤치',
    };
  }

  if (opts?.topbarTitle) {
    return {
      title: opts.topbarTitle,
      description,
    };
  }

  const titleWithoutBrand = String(documentTitle || '')
    .replace(/^\s*StockKeyword\s*[|·\-–—]\s*/i, '')
    .trim();

  const fallbackTitles = {
    home: '작업 홈',
    miricanvas: '미리캔버스',
    tooldi: '툴디',
    calendar: '월별 작업 캘린더',
    faq: 'FAQ',
    updates: '업데이트',
    about: '소개',
    privacy: '개인정보처리방침',
    terms: '이용약관',
    contact: '문의',
  };

  return {
    title:
      titleWithoutBrand && titleWithoutBrand !== 'StockKeyword'
        ? titleWithoutBrand
        : fallbackTitles[activeMenu] || 'StockKeyword',
    description,
  };
}
