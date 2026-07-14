export function renderCommonStyles() {
  return `
    :root {
      --brand: #3157d5;
      --brand-strong: #2449c4;
      --brand-soft: #eef2ff;
      --text: #141b2d;
      --text-muted: #6f7a91;
      --line: #dfe4ec;
      --line-strong: #cfd6e2;
      --surface: #ffffff;
      --surface-soft: #f7f8fa;
      --page: #f2f4f8;
      --sidebar-width: 184px;
      --content-max: 1148px;
      --radius-sm: 8px;
      --radius-md: 10px;
      --shadow-card: 0 1px 2px rgba(20, 27, 45, 0.04);
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      min-width: 320px;
      color: var(--text);
      background: var(--page);
      font-family:
        Pretendard,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      line-height: 1.5;
      word-break: keep-all;
    }

    body.sidebar-open {
      overflow: hidden;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    button,
    input,
    select {
      font: inherit;
    }

    button,
    select {
      cursor: pointer;
    }

    button:focus-visible,
    a:focus-visible,
    input:focus-visible,
    select:focus-visible {
      outline: 3px solid rgba(49, 87, 213, 0.24);
      outline-offset: 2px;
    }

    [hidden] {
      display: none !important;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .empty-state {
      margin: 0;
      color: var(--text-muted);
      font-size: 14px;
    }

    .button {
      min-height: 42px;
      padding: 0 18px;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      font-weight: 700;
      transition:
        background-color 160ms ease,
        border-color 160ms ease,
        color 160ms ease;
    }

    .button-primary {
      color: #ffffff;
      background: var(--brand);
      border-color: var(--brand);
    }

    .button-primary:hover {
      background: var(--brand-strong);
      border-color: var(--brand-strong);
    }

    .button-secondary {
      color: var(--brand);
      background: #ffffff;
      border-color: var(--line-strong);
    }

    .button-secondary:hover {
      background: var(--brand-soft);
      border-color: var(--brand);
    }
  `;
}
