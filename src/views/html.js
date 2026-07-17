import { renderClientScript } from './clientScript.js';
import { renderSidebar, renderTopbar, resolveTopbarContent } from './layout.js';
import { renderStyles } from './styles.js';
import { escapeHtml } from './viewUtils.js';

export { renderHomePage, renderMonthlyTopics, renderPlatformPage } from './pages/home.js';
export { renderKeywordAnalysisPage, renderTemplateAnalysisPage } from './pages/analysis.js';
export { renderFaqPage, renderAboutPage, renderPrivacyPage, renderTermsPage, renderContactPage } from './pages/content.js';
export { renderRankingsPage } from './pages/rankings.js';
export { renderCalendarPage } from './pages/calendar.js';

export function htmlPage(pathname, origin, opts = {}) {
  const title = opts?.title || 'StockKeyword';
  const description =
    opts?.description ||
    '스톡 작가를 위한 키워드와 월별 소재를 정리합니다.';
  const topbar = resolveTopbarContent(
    pathname,
    opts,
    title,
    description,
  );

  return `
    <!doctype html>
    <html lang="ko">
      <head>
        <!-- Google Tag Manager -->
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-THGZ9WD3');</script>
        <!-- End Google Tag Manager -->
        <meta charset="utf-8">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >
        <meta name="description" content="${escapeHtml(description)}">
        <meta name="google-adsense-account" content="ca-pub-3386559853644133">
        <script async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3386559853644133"
          crossorigin="anonymous">
        </script>
        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="manifest" href="/site.webmanifest">
        <title>${escapeHtml(title)}</title>
        ${renderStyles()}
      </head>

      <body${pathname === '/calendar' ? ' class="calendar-overview"' : ''}>
        <!-- Google Tag Manager (noscript) -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-THGZ9WD3"
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        <!-- End Google Tag Manager (noscript) -->
        <div class="app-shell">
          ${renderSidebar(opts?.activeMenu || 'home')}

          <button
            class="sidebar-backdrop"
            type="button"
            aria-label="메뉴 닫기"
            hidden
          ></button>

          <main class="main">
            ${renderTopbar(topbar.title, topbar.description)}
            <div class="page-content">
              ${opts?.contentHtml || ''}
            </div>
          </main>
        </div>

        ${renderClientScript()}
      </body>
    </html>
  `;
}
