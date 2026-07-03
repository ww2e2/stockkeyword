export function renderComponentStyles() {
  return `
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

`;
}
