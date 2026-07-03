export function renderCommonStyles() {
  return `
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

`;
}
