export function renderLayoutStyles() {
  return `
    .app-shell {
      display: grid;
      grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
      min-height: 100vh;
    }

    .sidebar {
      position: sticky;
      top: 0;
      z-index: 30;
      width: var(--sidebar-width);
      height: 100vh;
      padding: 28px 18px;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      background: var(--surface);
      border-right: 1px solid var(--line);
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 26px;
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      flex: 0 0 30px;
    }

    .brand-logo {
      display: block;
      width: 30px;
      height: 30px;
      object-fit: contain;
    }

    .brand-name {
      white-space: nowrap;
    }

    .sidebar-section-label {
      margin: 0 0 6px;
      color: #98a2b6;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.06em;
    }

    .sidebar-nav,
    .sidebar-menu-group {
      display: grid;
      gap: 4px;
    }

    .sidebar-nav {
      flex: 1 1 auto;
      min-height: 0;
      align-content: start;
    }

    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 148px;
      height: 40px;
      padding: 0 10px;
      color: var(--text);
      border-radius: 8px;
      font-size: 14px;
      font-weight: 650;
      transition:
        color 160ms ease,
        background-color 160ms ease;
    }

    .sidebar-link:hover,
    .sidebar-link.is-active {
      color: var(--brand);
      background: var(--brand-soft);
    }

    .sidebar-link-dot {
      width: 8px;
      height: 8px;
      flex: 0 0 8px;
      background: #d2d8e3;
      border-radius: 50%;
      transition: background-color 160ms ease;
    }

    .sidebar-link:hover .sidebar-link-dot,
    .sidebar-link.is-active .sidebar-link-dot {
      background: var(--brand);
    }

    .sidebar-divider {
      width: 100%;
      margin: 14px 0;
      border-top: 1px dashed #cfd7e6;
    }

    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      z-index: 20;
      padding: 0;
      background: rgba(20, 27, 45, 0.42);
      border: 0;
    }

    .main {
      min-width: 0;
    }

    .topbar {
      min-height: 70px;
      background: var(--surface);
      border-bottom: 1px solid var(--line);
    }

    .calendar-overview .topbar {
      position: sticky;
      top: 0;
      z-index: 15;
    }

    .topbar-inner {
      display: flex;
      align-items: center;
      width: min(100%, 1256px);
      min-height: 70px;
      margin: 0 auto;
      padding: 16px 28px;
    }

    .topbar-copy {
      min-width: 0;
      flex: 1 1 auto;
    }

    .page-title {
      margin: 0;
      font-size: 22px;
      line-height: 1.25;
      letter-spacing: -0.03em;
    }

    .page-description {
      margin: 3px 0 0;
      color: var(--text-muted);
      font-size: 12px;
    }

    .mobile-menu-button {
      display: none;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      margin-right: 12px;
      color: var(--brand);
      background: var(--brand-soft);
      border: 0;
      border-radius: 8px;
      font-size: 20px;
    }

    .page-content {
      width: min(100%, 1256px);
      max-width: 1256px;
      margin: 0 auto;
      padding: 28px;
    }

    .section-stack {
      display: grid;
      gap: 32px;
    }

    .section-header {
      margin-bottom: 16px;
    }

    .section-title {
      margin: 0;
      color: var(--text);
      font-size: 17px;
      line-height: 1.3;
      letter-spacing: -0.025em;
    }

    .section-description {
      margin: 4px 0 0;
      color: var(--text-muted);
      font-size: 12px;
    }

  `;
}
