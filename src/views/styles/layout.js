export function renderLayoutStyles() {
  return `
    .page-grid {
      display: grid;
      gap: 20px;
      margin-top: 20px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
    }

    .card {
      background: var(--panel-strong);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 20px;
      box-shadow: var(--shadow);
    }

`;
}
