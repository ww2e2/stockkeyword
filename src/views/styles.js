import { renderCommonStyles } from './styles/common.js';
import { renderLayoutStyles } from './styles/layout.js';
import { renderComponentStyles } from './styles/components.js';
import { renderResponsiveStyles } from './styles/responsive.js';

export function renderStyles() {
  return `
<style>
${renderCommonStyles()}${renderLayoutStyles()}${renderComponentStyles()}${renderResponsiveStyles()}
</style>`;
}
