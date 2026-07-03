export function renderResponsiveStyles() {
  return `
    @media (max-width: 920px) {
      .grid {
        grid-template-columns: 1fr;
      }

      .home-grid {
        grid-template-columns: 1fr;
      }

      .platform-grid {
        grid-template-columns: 1fr;
      }

      .miricanvas-tool-grid {
        grid-template-columns: 1fr;
      }

      .summary-grid {
        grid-template-columns: 1fr;
`;
}
