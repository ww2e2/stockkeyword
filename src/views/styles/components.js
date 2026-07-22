export function renderComponentStyles() {
  return `
    .home-platform-grid {
      display: grid;
      grid-template-columns: repeat(5, 215px);
      gap: 18px;
      align-items: start;
      justify-content: start;
    }

    .platform-card {
      width: 215px;
      height: 115px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
      box-shadow: var(--shadow-card);
      overflow: hidden;
      transition:
        border-color 160ms ease,
        box-shadow 160ms ease,
        transform 160ms ease;
    }

    .platform-card:hover {
      border-color: rgba(49, 87, 213, 0.52);
      box-shadow: 0 8px 24px rgba(20, 27, 45, 0.08);
      transform: translateY(-2px);
    }

    .platform-card-link {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      width: 100%;
      height: 100%;
      padding: 24px 18px 18px;
    }

    .platform-card-link[aria-disabled="true"] {
      cursor: default;
    }

    .platform-card-title {
      min-height: 22px;
      margin: 0;
      font-size: 16px;
      line-height: 1.35;
      letter-spacing: -0.02em;
    }

    .platform-card-description {
      margin: 6px 0 0;
      color: var(--text-muted);
      font-size: 12px;
      line-height: 1.45;
    }

    .home-page > .monthly-topics-section {
      margin-top: 108px;
    }

    .monthly-topics-grid {
      display: grid;
      grid-template-columns: repeat(5, 200px);
      column-gap: 24px;
      row-gap: 61px;
      align-items: start;
      justify-content: start;
    }

    .topic-grid-item {
      width: 200px;
      min-width: 0;
    }

    .topic-card {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      width: 200px;
      height: 75px;
      padding: 0 16px;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
      box-shadow: var(--shadow-card);
      font-weight: 750;
      transition:
        color 160ms ease,
        background-color 160ms ease,
        border-color 160ms ease;
    }

    .topic-card:hover,
    .topic-card[aria-expanded="true"] {
      color: var(--brand);
      background: var(--brand-soft);
      border-color: rgba(49, 87, 213, 0.48);
    }

    .topic-title {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .topic-arrow {
      color: #718096;
      font-size: 12px;
      transition: transform 160ms ease;
    }

    .topic-card[aria-expanded="true"] .topic-arrow {
      transform: rotate(180deg);
    }

    .topic-panel {
      width: 200px;
      margin-top: 12px;
      padding: 14px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
      box-shadow: var(--shadow-card);
    }

    .topic-keyword-list {
      display: grid;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
      counter-reset: topic-keyword;
    }

    .topic-keyword-list li {
      position: relative;
      min-width: 0;
      padding-left: 22px;
      color: var(--text);
      font-size: 13px;
      line-height: 1.4;
      overflow-wrap: anywhere;
      counter-increment: topic-keyword;
    }

    .topic-keyword-list li::before {
      position: absolute;
      left: 0;
      color: var(--brand);
      font-weight: 800;
      content: counter(topic-keyword) ".";
    }

    .month-navigation {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: min(100%, 1096px);
      margin: 0 0 22px;
    }

    .month-navigation-edge {
      display: inline-flex;
      align-items: center;
      min-height: 38px;
      color: var(--brand);
      font-size: 13px;
      font-weight: 750;
      white-space: nowrap;
    }

    .month-navigation-edge:hover {
      color: var(--brand-strong);
    }

    .month-navigation-edge.is-disabled {
      color: #aeb6c6;
    }

    .calendar-overview-page {
      display: grid;
      gap: 28px;
    }

    .calendar-intro-card {
      padding: 34px 36px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 12px;
      box-shadow: var(--shadow-card);
    }

    .calendar-intro-card h2 {
      margin: 0;
      font-size: 22px;
      line-height: 1.35;
      letter-spacing: -0.03em;
    }

    .calendar-intro-card p {
      margin: 8px 0 0;
      color: var(--text-muted);
      font-size: 13px;
    }

    .calendar-year-list {
      display: grid;
      gap: 18px;
    }

    .calendar-month-card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 12px;
      box-shadow: var(--shadow-card);
      transition:
        border-color 160ms ease,
        box-shadow 160ms ease,
        transform 160ms ease;
    }

    .calendar-month-card:hover {
      border-color: rgba(49, 87, 213, 0.5);
      box-shadow: 0 10px 26px rgba(20, 27, 45, 0.07);
      transform: translateY(-1px);
    }

    .calendar-month-card.is-target {
      border-color: rgba(49, 87, 213, 0.5);
      box-shadow: 0 0 0 2px rgba(49, 87, 213, 0.08);
    }

    .calendar-month-card-link {
      display: grid;
      grid-template-columns: 112px minmax(0, 1fr);
      align-items: center;
      gap: 24px;
      min-height: 118px;
      padding: 22px 28px;
    }

    .calendar-month-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 92px;
      height: 58px;
      color: var(--text);
      background: var(--surface-soft);
      border: 1px solid var(--line);
      border-radius: 10px;
      font-size: 18px;
      font-weight: 800;
    }

    .calendar-month-badge-group {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      width: 92px;
    }

    .calendar-current-month-label {
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 750;
      line-height: 1;
    }

    .calendar-month-card.is-target .calendar-month-badge {
      color: #ffffff;
      background: var(--brand);
      border-color: var(--brand);
    }

    .calendar-month-copy {
      min-width: 0;
    }

    .calendar-month-title {
      margin: 0;
      font-size: 16px;
      line-height: 1.35;
      letter-spacing: -0.02em;
    }

    .calendar-month-summary {
      margin: 7px 0 0;
      color: var(--text-muted);
      font-size: 12px;
      line-height: 1.55;
      overflow-wrap: anywhere;
    }

    .analysis-page {
      display: grid;
      gap: 24px;
    }

    .analysis-guide-card,
    .analysis-cross-platform-card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
      box-shadow: var(--shadow-card);
    }

    .analysis-guide-card {
      padding: 28px;
    }

    .analysis-guide-header h2,
    .analysis-cross-platform-copy h2 {
      margin: 0;
      color: var(--text);
      font-size: 19px;
      line-height: 1.4;
      letter-spacing: -0.025em;
    }

    .analysis-guide-header p,
    .analysis-cross-platform-copy p {
      margin: 6px 0 0;
      color: var(--text-muted);
      font-size: 13px;
      line-height: 1.6;
    }

    .analysis-guide-steps {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-top: 28px;
    }

    .analysis-guide-step {
      min-width: 0;
      padding: 4px 28px;
      border-left: 1px solid var(--line);
    }

    .analysis-guide-step:first-child {
      padding-left: 0;
      border-left: 0;
    }

    .analysis-guide-step:last-child {
      padding-right: 0;
    }

    .analysis-guide-step-heading {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .analysis-guide-step-heading h3 {
      margin: 0;
      color: var(--text);
      font-size: 15px;
      line-height: 1.4;
    }

    .analysis-guide-step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      flex: 0 0 34px;
      color: var(--brand);
      background: var(--brand-soft);
      border-radius: 50%;
      font-size: 15px;
      font-weight: 800;
    }

    .analysis-guide-step-value {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      max-width: 100%;
      margin: 14px 0 0 46px;
      padding: 0 12px;
      color: var(--text);
      background: var(--surface-soft);
      border: 1px solid var(--line);
      border-radius: 8px;
      font-size: 13px;
      overflow-wrap: anywhere;
    }

    .analysis-guide-step-description {
      margin: 11px 0 0 46px;
      color: var(--text-muted);
      font-size: 13px;
      line-height: 1.6;
    }

    .analysis-guide-footer {
      display: flex;
      align-items: center;
      gap: 28px;
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid var(--line);
    }

    .analysis-example-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
    }

    .analysis-popular-searches {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .analysis-popular-label {
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }

    .analysis-popular-chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .analysis-popular-chip {
      display: inline-flex;
      align-items: center;
      min-height: 34px;
      padding: 0 12px;
      color: var(--text);
      background: var(--surface-soft);
      border: 1px solid var(--line);
      border-radius: 8px;
      font-size: 13px;
      font-weight: 650;
      transition:
        color 160ms ease,
        background-color 160ms ease,
        border-color 160ms ease;
    }

    .analysis-popular-chip:hover {
      color: var(--brand);
      background: var(--brand-soft);
      border-color: rgba(49, 87, 213, 0.45);
    }

    .analysis-cross-platform-card {
      padding: 24px;
    }

    .analysis-cross-platform-copy {
      min-width: 0;
    }

    .analysis-cross-platform-copy h2 {
      font-size: 17px;
    }

    .analysis-platform-list {
      display: grid;
      margin-top: 18px;
    }

    .analysis-platform-row {
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr) auto;
      align-items: center;
      gap: 16px;
      min-width: 0;
      padding: 18px 8px;
      background: transparent;
      border: 0;
      border-bottom: 1px solid var(--line);
      border-radius: 0;
    }

    .analysis-platform-row:first-child {
      padding-top: 10px;
    }

    .analysis-platform-row:last-child {
      padding-bottom: 4px;
      border-bottom: 0;
    }

    .analysis-platform-row.is-sponsored {
      margin: 6px 0;
      padding: 16px 12px;
      background: rgba(49, 87, 213, 0.035);
      border: 1px solid rgba(49, 87, 213, 0.22);
      border-radius: 8px;
      box-shadow: none;
    }

    .analysis-platform-logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      overflow: hidden;
      color: var(--brand);
      background: var(--brand-soft);
      border: 1px solid rgba(49, 87, 213, 0.14);
      border-radius: 10px;
      font-size: 14px;
      font-weight: 800;
    }

    .analysis-platform-logo img {
      display: block;
      width: 40px;
      height: 40px;
      object-fit: contain;
      border-radius: 8px;
    }

    .analysis-platform-logo-fallback {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .analysis-platform-content {
      min-width: 0;
    }

    .analysis-platform-title-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .analysis-platform-title-row h3 {
      margin: 0;
      color: var(--text);
      font-size: 15px;
      line-height: 1.4;
    }

    .analysis-platform-sponsored {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      padding: 0 8px;
      color: var(--brand);
      background: var(--brand-soft);
      border: 1px solid rgba(49, 87, 213, 0.18);
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
    }

    .analysis-platform-content > p {
      margin: 5px 0 0;
      color: var(--text-muted);
      font-size: 13px;
      line-height: 1.6;
    }

    .analysis-platform-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 9px;
    }

    .analysis-platform-badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 9px;
      border: 1px solid var(--line);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 750;
    }

    .analysis-platform-badge.is-brand {
      color: var(--brand);
      background: var(--brand-soft);
      border-color: rgba(49, 87, 213, 0.18);
    }

    .analysis-platform-badge.is-positive {
      color: #227346;
      background: #eef9f2;
      border-color: #caead6;
    }

    .analysis-platform-badge.is-negative {
      color: #a54242;
      background: #fff3f3;
      border-color: #f0cccc;
    }

    .analysis-platform-badge.is-neutral {
      color: var(--text-muted);
      background: var(--surface-soft);
    }

    .analysis-platform-action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      padding: 0 14px;
      white-space: nowrap;
    }

    .search-form {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 180px auto;
      gap: 10px;
      padding: 18px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
    }

    .search-input,
    .search-select {
      width: 100%;
      min-height: 42px;
      color: var(--text);
      background: #ffffff;
      border: 1px solid var(--line-strong);
      border-radius: 8px;
    }

    .search-input {
      padding: 0 14px;
    }

    .search-select {
      padding: 0 36px 0 12px;
    }

    .result-card,
    .ranking-card {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 10px;
    }

    .result-card-body {
      padding: 22px;
    }

    .result-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    .result-title {
      margin: 0;
      font-size: 17px;
      line-height: 1.4;
    }

    .result-description {
      margin: 5px 0 0;
      color: var(--text-muted);
      font-size: 13px;
    }

    .keyword-chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .keyword-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 34px;
      padding: 0 10px 0 12px;
      color: var(--brand);
      background: var(--brand-soft);
      border: 1px solid rgba(49, 87, 213, 0.18);
      border-radius: 999px;
      font-size: 13px;
      font-weight: 650;
    }

    .keyword-chip button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      padding: 0;
      color: var(--brand);
      background: transparent;
      border: 0;
      border-radius: 50%;
    }

    .keyword-chip button:hover {
      background: rgba(49, 87, 213, 0.12);
    }

    .keyword-string-box,
    .metric-row {
      margin-top: 16px;
      padding: 14px;
      color: var(--text);
      background: var(--surface-soft);
      border: 1px solid var(--line);
      border-radius: 8px;
      font-size: 13px;
      overflow-wrap: anywhere;
    }

    .keyword-result-embedded .result-card-body {
      padding: 0;
    }

    .result-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
    }

    .tab-button {
      min-height: 38px;
      padding: 0 14px;
      color: var(--text-muted);
      background: #ffffff;
      border: 1px solid var(--line);
      border-radius: 8px;
      font-weight: 750;
    }

    .tab-button:hover,
    .tab-button.is-active {
      color: #ffffff;
      background: var(--brand);
      border-color: var(--brand);
    }

    .metric-list {
      display: grid;
      gap: 10px;
    }

    .metric-list .metric-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 0;
    }

    .ranking-panel-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .ranking-card {
      padding: 20px;
    }

    .ranking-list {
      display: grid;
      gap: 10px;
      margin: 16px 0 0;
      padding-left: 22px;
    }

    .ranking-list li {
      padding-left: 4px;
    }

    .ranking-list li::marker {
      color: var(--brand);
      font-weight: 800;
    }

    .ranking-list li > span {
      margin-right: 8px;
    }

    .ranking-list strong {
      color: var(--text-muted);
      font-size: 12px;
    }
    .content-page {
      display: grid;
      gap: 24px;
    }

    .content-card,
    .faq-section {
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 12px;
      box-shadow: var(--shadow-card);
    }

    .content-intro-card,
    .content-section,
    .contact-card {
      padding: 28px;
    }

    .content-intro-card h2,
    .content-section h2 {
      margin: 0;
      font-size: 20px;
      line-height: 1.4;
      letter-spacing: -0.025em;
    }

    .content-intro-card p,
    .content-section p,
    .contact-help {
      margin: 10px 0 0;
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.75;
    }

    .content-section p + p {
      margin-top: 12px;
    }

    .content-list {
      display: grid;
      gap: 10px;
      margin: 16px 0 0;
      padding-left: 20px;
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.7;
    }

    .content-list strong {
      color: var(--text);
    }

    .inline-link {
      color: var(--brand);
      font-weight: 700;
    }

    .faq-category-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 12px;
    }

    .faq-category-nav a {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      padding: 0 13px;
      color: var(--text-muted);
      background: var(--surface-soft);
      border: 1px solid var(--line);
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
    }

    .faq-category-nav a:hover {
      color: var(--brand);
      border-color: rgba(49, 87, 213, 0.45);
    }

    .faq-section-list {
      display: grid;
      gap: 24px;
    }

    .faq-section {
      padding: 26px;
      scroll-margin-top: 24px;
    }

    .faq-list {
      display: grid;
      gap: 10px;
    }

    .faq-item {
      background: var(--surface-soft);
      border: 1px solid var(--line);
      border-radius: 10px;
      overflow: hidden;
    }

    .faq-item summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      min-height: 58px;
      padding: 14px 18px;
      color: var(--text);
      font-size: 14px;
      font-weight: 750;
      cursor: pointer;
      list-style: none;
    }

    .faq-item summary::-webkit-details-marker {
      display: none;
    }

    .faq-item[open] summary {
      color: var(--brand);
      background: var(--brand-soft);
    }

    .faq-toggle-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      flex: 0 0 24px;
      color: var(--brand);
      font-size: 18px;
      transition: transform 160ms ease;
    }

    .faq-item[open] .faq-toggle-icon {
      transform: rotate(45deg);
    }

    .faq-answer {
      padding: 0 18px 18px;
      background: #ffffff;
    }

    .faq-answer p {
      margin: 0;
      padding-top: 16px;
      color: var(--text-muted);
      border-top: 1px solid var(--line);
      font-size: 14px;
      line-height: 1.75;
    }


    .update-entry {
      display: grid;
      gap: 0;
    }

    .update-entry-header {
      padding-bottom: 24px;
      border-bottom: 1px solid var(--line);
    }

    .update-date {
      display: inline-flex;
      align-items: center;
      min-height: 28px;
      padding: 0 10px;
      margin-bottom: 12px;
      color: var(--brand);
      background: var(--brand-soft);
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
    }

    .update-entry-header h2 {
      margin: 0;
    }

    .update-entry-header p,
    .update-detail-section p {
      margin: 10px 0 0;
      color: var(--text-muted);
      font-size: 14px;
      line-height: 1.75;
    }

    .update-detail-section {
      padding: 24px 0;
      border-bottom: 1px solid var(--line);
    }

    .update-detail-section:last-child {
      padding-bottom: 0;
      border-bottom: 0;
    }

    .update-detail-section h3 {
      margin: 0;
      font-size: 16px;
      line-height: 1.4;
      letter-spacing: -0.02em;
    }

    .update-summary-section .content-list {
      margin-top: 14px;
    }

    .contact-label {
      margin: 0;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 700;
    }

    .contact-email {
      display: inline-block;
      margin-top: 6px;
      color: var(--brand);
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }


    .platform-page {
      gap: 44px;
    }

    .platform-tools-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-auto-rows: 1fr;
      align-items: stretch;
      gap: 18px;
      width: min(100%, 960px);
    }

    .platform-tools-grid.is-two-columns {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      width: min(100%, 632px);
    }

    .platform-tools-grid .platform-card {
      width: 100%;
      height: 100%;
      min-height: 180px;
    }

    .platform-tools-grid .platform-card-link {
      position: relative;
      height: 100%;
      padding: 30px 28px 54px;
    }

    .platform-tools-grid .platform-card-link::after {
      position: absolute;
      right: 26px;
      bottom: 22px;
      color: var(--text);
      font-size: 22px;
      line-height: 1;
      content: '→';
      transition: transform 160ms ease;
    }

    .platform-tools-grid .platform-card:hover .platform-card-link::after {
      transform: translateX(3px);
    }

    .platform-tools-grid .platform-card-title {
      display: block;
      min-height: 0;
      margin: 0;
      font-size: clamp(17px, 1.45vw, 19px);
      line-height: 1.35;
      word-break: keep-all;
      overflow-wrap: normal;
    }

    .platform-tools-grid .platform-card-description {
      max-width: 250px;
      margin: 12px 0 0;
      font-size: 13px;
      line-height: 1.7;
      word-break: keep-all;
      overflow-wrap: break-word;
    }

    .platform-overview-card {
      padding: 26px 28px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 12px;
      box-shadow: var(--shadow-card);
    }

    .platform-overview-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .platform-overview-item {
      min-width: 0;
      padding: 2px 24px;
      border-right: 1px solid var(--line);
    }

    .platform-overview-item:first-child {
      padding-left: 0;
    }

    .platform-overview-item:last-child {
      padding-right: 0;
      border-right: 0;
    }

    .platform-overview-item h3 {
      margin: 0;
      font-size: 15px;
      line-height: 1.4;
      letter-spacing: -0.02em;
    }

    .platform-overview-item p {
      margin: 8px 0 0;
      color: var(--text-muted);
      font-size: 12px;
      line-height: 1.65;
    }

  `;
}
