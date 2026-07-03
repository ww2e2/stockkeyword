import { renderCommonClientScript } from './client/common.js';
import { renderRankingsClientScript } from './client/rankings.js';
import { renderKeywordClientCore, renderKeywordClientInit } from './client/keyword.js';
import { renderTemplateClientCore, renderTemplateClientInit } from './client/template.js';

export function renderClientScript(dependencies) {
  const {
    DEBUG,
    MAX_KEYWORDS_PER_REQUEST,
    MIRICANVAS_CATEGORY_OPTIONS,
    TEMPLATE_FILTER_TABS,
    TEMPLATE_RESULT_TABS,
    TEMPLATE_TYPE_MAP,
  } = dependencies;

  return `
<script>
${renderCommonClientScript({ DEBUG, MAX_KEYWORDS_PER_REQUEST, MIRICANVAS_CATEGORY_OPTIONS, TEMPLATE_FILTER_TABS, TEMPLATE_RESULT_TABS, TEMPLATE_TYPE_MAP })}${renderRankingsClientScript()}${renderKeywordClientCore()}${renderTemplateClientCore()}${renderKeywordClientInit()}${renderTemplateClientInit()}
</script>`;
}
