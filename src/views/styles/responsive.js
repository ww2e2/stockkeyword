export function renderResponsiveStyles() {
  return `
    @media (max-width: 1388px) {
      .home-platform-grid {
        grid-template-columns: repeat(4, 215px);
      }

      .monthly-topics-grid {
        grid-template-columns: repeat(4, 200px);
      }
    }

    @media (max-width: 1160px) {
      .home-platform-grid {
        grid-template-columns: repeat(3, 215px);
      }

      .monthly-topics-grid {
        grid-template-columns: repeat(3, 200px);
      }

    }

    @media (max-width: 900px) {
      .app-shell {
        display: block;
      }

      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        z-index: 30;
        transform: translateX(-100%);
        box-shadow: 16px 0 36px rgba(20, 27, 45, 0.14);
        transition: transform 180ms ease;
      }

      body.sidebar-open .sidebar {
        transform: translateX(0);
      }

      .mobile-menu-button {
        display: inline-flex;
      }

      .topbar-inner {
        padding-inline: 20px;
      }

      .page-content {
        padding: 24px 20px 40px;
      }

      .home-platform-grid {
        grid-template-columns: repeat(3, 215px);
      }

      .monthly-topics-grid {
        grid-template-columns: repeat(3, 200px);
      }

      .platform-tools-grid,
      .platform-tools-grid.is-two-columns {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        width: 100%;
      }

      .platform-overview-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .platform-overview-item {
        padding: 18px 20px;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }

      .platform-overview-item:nth-child(odd) {
        border-right: 1px solid var(--line);
      }

      .platform-overview-item:nth-last-child(-n + 2) {
        border-bottom: 0;
      }
    }

    @media (max-width: 760px) {
      .home-platform-grid {
        grid-template-columns: repeat(2, 215px);
      }

      .platform-tools-grid,
      .platform-tools-grid.is-two-columns {
        grid-template-columns: 1fr;
        grid-auto-rows: auto;
      }

      .platform-tools-grid .platform-card {
        height: auto;
        min-height: 168px;
      }

      .monthly-topics-grid {
        grid-template-columns: repeat(2, 200px);
      }

      .information-card-list,
      .ranking-panel-grid {
        grid-template-columns: 1fr;
      }

      .search-form {
        grid-template-columns: 1fr;
      }

      .search-form .button {
        width: 100%;
      }

      .analysis-guide-steps {
        grid-template-columns: 1fr;
        gap: 0;
      }

      .analysis-guide-step,
      .analysis-guide-step:first-child,
      .analysis-guide-step:last-child {
        padding: 20px 0;
        border-left: 0;
        border-top: 1px solid var(--line);
      }

      .analysis-guide-step:first-child {
        padding-top: 0;
        border-top: 0;
      }

      .analysis-guide-step-value,
      .analysis-guide-step-description {
        margin-left: 46px;
      }

      .analysis-guide-footer {
        align-items: flex-start;
        flex-direction: column;
        gap: 16px;
      }

      .analysis-popular-searches {
        align-items: flex-start;
        flex-direction: column;
        gap: 8px;
      }

      .analysis-platform-row {
        grid-template-columns: 44px minmax(0, 1fr);
        align-items: start;
      }

      .analysis-platform-logo {
        width: 44px;
        height: 44px;
      }

      .analysis-platform-logo img {
        width: 36px;
        height: 36px;
      }

      .analysis-platform-action {
        grid-column: 2;
        justify-self: start;
      }

      .calendar-month-card-link {
        grid-template-columns: 82px minmax(0, 1fr);
        gap: 18px;
        padding: 20px;
      }

      .calendar-month-badge {
        width: 72px;
      }

      .calendar-month-badge-group {
        width: 72px;
      }
    }

    @media (max-width: 500px) {
      .topbar,
      .topbar-inner {
        min-height: 66px;
      }

      .topbar-inner {
        padding-inline: 16px;
      }

      .page-title {
        font-size: 20px;
      }


      .page-content {
        padding: 22px 16px 36px;
      }

      .analysis-guide-card {
        padding: 22px 18px;
      }

      .analysis-cross-platform-card {
        padding: 20px 18px;
      }

      .analysis-example-link {
        width: 100%;
      }

      .analysis-platform-row {
        gap: 12px;
        padding: 16px 0;
      }

      .analysis-platform-row.is-sponsored {
        padding: 14px 10px;
      }

      .analysis-platform-action {
        width: auto;
      }

      .home-platform-grid,
      .monthly-topics-grid {
        grid-template-columns: 1fr;
        justify-items: center;
      }

      .home-platform-section .home-platform-grid {
        grid-template-columns: 1fr;
        width: 100%;
      }

      .home-platform-section .platform-card {
        width: 100%;
        max-width: 320px;
        height: auto;
        min-height: 128px;
      }

      .platform-tools-grid,
      .platform-tools-grid.is-two-columns {
        justify-items: stretch;
      }

      .platform-tools-grid .platform-card {
        height: auto;
        min-height: 150px;
      }

      .platform-overview-card {
        padding: 8px 18px;
      }

      .platform-overview-grid {
        grid-template-columns: 1fr;
      }

      .platform-overview-item,
      .platform-overview-item:first-child,
      .platform-overview-item:last-child,
      .platform-overview-item:nth-child(odd),
      .platform-overview-item:nth-last-child(-n + 2) {
        padding: 18px 0;
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }

      .platform-overview-item:last-child {
        border-bottom: 0;
      }

      .section-header {
        text-align: left;
      }

      .home-page > .monthly-topics-section {
        margin-top: 88px;
      }

      .monthly-topics-grid {
        row-gap: 36px;
      }

      .result-heading {
        align-items: stretch;
        flex-direction: column;
      }

      .result-heading .button {
        width: 100%;
      }

      .metric-list .metric-row {
        align-items: flex-start;
        flex-direction: column;
      }

      .month-navigation {
        width: 100%;
      }

      .content-intro-card,
      .content-section,
      .contact-card,
      .faq-section {
        padding: 22px 18px;
      }

      .faq-category-nav {
        flex-wrap: nowrap;
        overflow-x: auto;
      }

      .faq-category-nav a {
        flex: 0 0 auto;
      }

      .contact-email {
        font-size: 18px;
        overflow-wrap: anywhere;
      }

      .calendar-intro-card {
        padding: 26px 22px;
      }

      .calendar-intro-card h2 {
        font-size: 19px;
      }

      .calendar-month-card-link {
        grid-template-columns: 1fr;
      }

      .calendar-month-badge {
        width: 72px;
        height: 48px;
      }
    }
  `;
}
