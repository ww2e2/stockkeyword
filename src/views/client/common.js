export function renderCommonClientScript({ DEBUG, MAX_KEYWORDS_PER_REQUEST, MIRICANVAS_CATEGORY_OPTIONS, TEMPLATE_FILTER_TABS, TEMPLATE_RESULT_TABS, TEMPLATE_TYPE_MAP }) {
  return `
    const CURRENT_PATH = window.location.pathname;
    const DEBUG = ${JSON.stringify(DEBUG)};
    const TEMPLATE_TYPE_OPTIONS = ${JSON.stringify(TEMPLATE_TYPE_MAP)};
    const TEMPLATE_FILTER_TABS = ${JSON.stringify(TEMPLATE_FILTER_TABS)};
    const TEMPLATE_RESULT_TABS = ${JSON.stringify(TEMPLATE_RESULT_TABS)};
    const MIRICANVAS_CATEGORY_OPTIONS = ${JSON.stringify(MIRICANVAS_CATEGORY_OPTIONS)};
    const MAX_KEYWORDS = ${MAX_KEYWORDS_PER_REQUEST};
    const resultPanelEl = document.getElementById('resultPanel');
    const statusEl = document.getElementById('status');
    const keywordEl = document.getElementById('keyword');
    const categoryEl = document.getElementById('category');
    const runBtn = document.getElementById('runBtn');
    const templateKeywordEl = document.getElementById('templateKeyword');
    const templateTypeSearchEl = document.getElementById('templateTypeSearch');
    const templateTypeTabsEl = document.getElementById('templateTypeTabs');
    const templateTypePanelEl = document.getElementById('templateTypePanel');
    const selectedTemplateTypeTextEl = document.getElementById('selectedTemplateTypeText');
    const templateRunBtn = document.getElementById('templateRunBtn');
    const rankingPanelEl = document.getElementById('rankingPanel');

    function debugLog(...args) {
      if (!DEBUG) return;
      console.log(...args);
    }

    function cleanText(value) {
      return String(value ?? '').replace(/\\uFEFF/g, '').trim();
    }

    function normalizeTemplateApiValues(apiValue, fallbackValue = '') {
      const values = Array.isArray(apiValue) ? apiValue : [apiValue || fallbackValue];
      return values.map((value) => cleanText(value)).filter(Boolean);
    }

    function flattenTemplateTypeItems(items, parentPath = []) {
      const flattened = [];

      for (const item of items) {
        const currentPath = [...parentPath, item.label];

        if (Array.isArray(item.children) && item.children.length > 0) {
          flattened.push(...flattenTemplateTypeItems(item.children, currentPath));
          continue;
        }

        flattened.push({
          ...item,
          pathLabels: currentPath,
        });
      }

      return flattened;
    }

    const FLAT_TEMPLATE_TYPE_OPTIONS = flattenTemplateTypeItems(TEMPLATE_TYPE_OPTIONS);
    const TEMPLATE_TYPE_INDEX = new Map(FLAT_TEMPLATE_TYPE_OPTIONS.map((item) => [item.value, item]));
    const TEMPLATE_TYPE_API_INDEX = new Map();
    for (const item of FLAT_TEMPLATE_TYPE_OPTIONS) {
      const apiKeys = normalizeTemplateApiValues(item.apiValue, item.value);
      for (const apiKey of apiKeys) {
        if (!TEMPLATE_TYPE_API_INDEX.has(apiKey)) {
          TEMPLATE_TYPE_API_INDEX.set(apiKey, item);
        }
      }
    }
    const TEMPLATE_RESULT_TAB_INDEX = new Map(TEMPLATE_RESULT_TABS.map((item) => [item.key, item]));

    let lastResults = [];
    let lastTemplateResult = null;
    let selectedTemplateTypeValue = 'presentation';
    let currentTemplateFilterTab = 'all';
    let currentTemplateSearchText = '';
    const expandedTemplateGroups = new Set();

    function parseKeywordsInput(input) {
      const lines = String(input || '')
        .split(/\\r?\\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const seen = new Set();
      const keywords = [];

      for (const line of lines) {
        if (seen.has(line)) continue;
        seen.add(line);
        keywords.push(line);
      }

      return keywords;
    }

    function parseKeywordsQuery(rawQuery) {
      return String(rawQuery || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((value, index, array) => array.indexOf(value) === index);
    }

    function validateKeywordsLimit(keywords) {
      if (keywords.length > MAX_KEYWORDS) {
        throw new Error('한 번에 최대 5개 키워드까지 분석할 수 있습니다.');
      }
    }

    function parseSingleKeywordInput(input) {
      const keywords = parseKeywordsInput(input);

      if (keywords.length === 0) {
        throw new Error('키워드를 입력하세요.');
      }

      if (keywords.length > 1) {
        throw new Error('템플릿 분석은 키워드 1개만 입력할 수 있습니다.');
      }

      return keywords[0];
    }

    function normalizeTemplateTab(tabKey) {
      const value = cleanText(tabKey);
      if (TEMPLATE_RESULT_TAB_INDEX.has(value)) {
        return value;
      }
      return TEMPLATE_RESULT_TABS[0].key;
    }

    function resolveTemplateTypeConfig(value) {
      const normalized = cleanText(value);
      return TEMPLATE_TYPE_INDEX.get(normalized) || TEMPLATE_TYPE_API_INDEX.get(normalized) || null;
    }

    function setStatus(text) {
      statusEl.textContent = text;
    }

    async function copyText(text, successMessage) {
      await navigator.clipboard.writeText(text);
      setStatus(successMessage);
    }

    function normalizeMiricanvasCategory(value) {
      const normalized = cleanText(value);
      return MIRICANVAS_CATEGORY_OPTIONS.some((item) => item.value === normalized)
        ? normalized
        : MIRICANVAS_CATEGORY_OPTIONS[0].value;
    }

    function buildElementResultUrl(keyword, category) {
      return (
        '/miricanvas/tag?q=' +
        encodeURIComponent(keyword) +
        '&category=' +
        encodeURIComponent(normalizeMiricanvasCategory(category))
      );
    }

    function buildTemplateResultUrl(keyword, type, tab) {
      return (
        '/miricanvas/template?q=' +
        encodeURIComponent(keyword) +
        '&type=' +
        encodeURIComponent(type) +
        '&tab=' +
        encodeURIComponent(normalizeTemplateTab(tab))
      );
    }
`;
}
