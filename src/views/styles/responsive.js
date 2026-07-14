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
    }

    @media (max-width: 760px) {
      .home-platform-grid {
        grid-template-columns: repeat(2, 215px);
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

      .calendar-month-card-link {
        grid-template-columns: 82px minmax(0, 1fr);
        gap: 18px;
        padding: 20px;
      }

      .calendar-month-badge {
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

      .home-platform-grid,
      .monthly-topics-grid {
        grid-template-columns: 1fr;
        justify-items: center;
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
