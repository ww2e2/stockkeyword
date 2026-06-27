import http from 'http';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';
import { TEMPLATE_TYPE_MAP } from './templateTypeMap.js';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const DEBUG = String(process.env.DEBUG || 'false').toLowerCase() === 'true';
const MIRICANVAS_API_URL = process.env.MIRICANVAS_API_URL || '';
const MIRICANVAS_API_METHOD = (process.env.MIRICANVAS_API_METHOD || 'GET').toUpperCase();
const MIRICANVAS_API_HEADERS_JSON = process.env.MIRICANVAS_API_HEADERS_JSON || '';
const MIRICANVAS_TEAM_IDX = process.env.MIRICANVAS_TEAM_IDX || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TIME_ZONE = process.env.TIME_ZONE || 'Asia/Seoul';
const MAX_KEYWORDS_PER_REQUEST = 5;
const TEMPLATE_API_URL = 'https://api.miricanvas.com/template/api/p/template-pages/search';
const TEMPLATE_TYPE_FAILURE_MESSAGE = '해당 템플릿 종류의 분석 결과를 불러오지 못했습니다.';

const MIRICANVAS_TYPES = [
  'ILLUST',
  'BITMAP',
  'FIGURE',
  'LINE',
  'ANI',
  'FRAME',
  'PRESET_FRAME',
  'MOCKUP_GRID',
  'MOCKUP_TEXT',
  'CHART',
];

const TEMPLATE_FILTER_TABS = [
  { key: 'all', label: '전체' },
  { key: '웹', label: '웹' },
  { key: '동영상', label: '동영상' },
  { key: '인쇄', label: '인쇄' },
];

const TEMPLATE_RESULT_TABS = [
  { key: 'titleKeywords', label: '제목 키워드' },
  { key: 'pageCount', label: '페이지 수' },
  { key: 'topTitles', label: '상위 제목' },
];

const TEMPLATE_PURPOSE_BY_GROUP = {
  '웹': 'WEB',
  '동영상': 'VIDEO',
  '인쇄': 'PRINT',
};

const DEFAULT_TEMPLATE_TIER = 'PREMIUM';
const ADS_TXT_CONTENT = 'google.com, pub-3386559853644133, DIRECT, f08c47fec0942fa0';
const SEARCH_PLATFORM = 'miricanvas';
const FAVICON_FILE_MAP = new Map([
  ['/favicon.ico', { file: 'favicon.ico', contentType: 'image/x-icon' }],
  ['/favicon-16x16.png', { file: 'favicon-16x16.png', contentType: 'image/png' }],
  ['/favicon-32x32.png', { file: 'favicon-32x32.png', contentType: 'image/png' }],
  ['/apple-touch-icon.png', { file: 'apple-touch-icon.png', contentType: 'image/png' }],
  ['/android-chrome-192x192.png', { file: 'android-chrome-192x192.png', contentType: 'image/png' }],
  ['/android-chrome-512x512.png', { file: 'android-chrome-512x512.png', contentType: 'image/png' }],
  ['/site.webmanifest', { file: 'site.webmanifest', contentType: 'application/manifest+json; charset=utf-8' }],
]);

function debugLog(...args) {
  if (!DEBUG) return;
  console.log(...args);
}

function debugWarn(...args) {
  if (!DEBUG) return;
  console.warn(...args);
}

function debugError(...args) {
  if (!DEBUG) return;
  console.error(...args);
}

function normalizeTemplateApiValues(apiValue, fallbackValue = '') {
  const values = Array.isArray(apiValue) ? apiValue : [apiValue || fallbackValue];
  return values.map(cleanText).filter(Boolean);
}

function getTemplatePurpose(typeConfig) {
  return cleanText(typeConfig?.purpose) || TEMPLATE_PURPOSE_BY_GROUP[typeConfig?.group] || 'WEB';
}

function getTemplateTier(typeConfig) {
  return cleanText(typeConfig?.tier) || DEFAULT_TEMPLATE_TIER;
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

const FLAT_TEMPLATE_TYPE_MAP = flattenTemplateTypeItems(TEMPLATE_TYPE_MAP);
const TEMPLATE_TYPE_INDEX = new Map(FLAT_TEMPLATE_TYPE_MAP.map((item) => [item.value, item]));
const TEMPLATE_TYPE_API_INDEX = new Map();
for (const item of FLAT_TEMPLATE_TYPE_MAP) {
  const apiKeys = normalizeTemplateApiValues(item.apiValue, item.value);
  for (const apiKey of apiKeys) {
    if (!TEMPLATE_TYPE_API_INDEX.has(apiKey)) {
      TEMPLATE_TYPE_API_INDEX.set(apiKey, item);
    }
  }
}
const TEMPLATE_RESULT_TAB_INDEX = new Map(TEMPLATE_RESULT_TABS.map((item) => [item.key, item]));

function cleanText(value) {
  return String(value ?? '').replace(/\uFEFF/g, '').trim();
}

function getCollectedDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function getCollectedMonth() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
}

function buildRobotsTxt(origin) {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
  ].join('\n');
}

function buildSitemapXml(origin) {
  const lastmod = getCollectedDate();
  const urls = ['/', '/miricanvas', '/miricanvas/tag', '/miricanvas/template', '/canva', '/adobe-stock', '/about', '/privacy', '/terms', '/contact'];
  const urlset = urls.map((path) => {
    const loc = `${origin}${path === '/' ? '/' : path}`;
    return [
      '  <url>',
      `    <loc>${escapeHtml(loc)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      '  </url>',
    ].join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlset,
    '</urlset>',
  ].join('\n');
}

async function serveFaviconAsset(reqPath, res) {
  const asset = FAVICON_FILE_MAP.get(reqPath);
  if (!asset) {
    return false;
  }

  const fileBuffer = await readFile(new URL(`../favicon_io/${asset.file}`, import.meta.url));
  res.writeHead(200, {
    'Content-Type': asset.contentType,
    'Cache-Control': 'public, max-age=86400',
  });
  res.end(fileBuffer);
  return true;
}

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function buildSupabaseHeaders(extraHeaders = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extraHeaders,
  };
}

async function logSearchEvent(event) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const payload = {
    source_platform: SEARCH_PLATFORM,
    search_type: event.searchType,
    keyword: cleanText(event.keyword),
    template_type_value: cleanText(event.templateTypeValue),
    template_type_label: cleanText(event.templateTypeLabel),
    search_month: getCollectedMonth(),
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/search_logs`, {
    method: 'POST',
    headers: buildSupabaseHeaders({
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify([payload]),
  });

  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(`Supabase log insert failed: ${response.status} ${response.statusText} ${text}`.trim());
  }

  debugLog('[supabase:log:success]', JSON.stringify({
    searchType: payload.search_type,
    keyword: payload.keyword,
    templateTypeValue: payload.template_type_value,
    templateTypeLabel: payload.template_type_label,
    response: text,
  }));
}

async function safeLogSearchEvent(event) {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    await logSearchEvent(event);
  } catch (error) {
    console.error('[supabase:log:error]', JSON.stringify({
      message: error?.message || String(error),
      searchType: cleanText(event?.searchType),
      keyword: cleanText(event?.keyword),
      templateTypeValue: cleanText(event?.templateTypeValue),
      templateTypeLabel: cleanText(event?.templateTypeLabel),
      hasSupabaseUrl: Boolean(SUPABASE_URL),
      hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
    }));
  }
}

async function fetchMonthlySearchLogs(searchMonth = getCollectedMonth()) {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const params = new URLSearchParams();
  params.set('select', 'search_type,keyword,template_type_value,template_type_label,search_month');
  params.set('source_platform', `eq.${SEARCH_PLATFORM}`);
  params.set('search_month', `eq.${searchMonth}`);
  params.set('order', 'created_at.desc');
  params.set('limit', '5000');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/search_logs?${params.toString()}`, {
    headers: buildSupabaseHeaders(),
  });

  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(`Supabase monthly logs fetch failed: ${response.status} ${response.statusText} ${text}`.trim());
  }

  if (!text.trim()) {
    return [];
  }

  return JSON.parse(text);
}

function buildTopRankings(entries, buildItem, limit = 20) {
  return [...entries.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'ko'))
    .slice(0, limit)
    .map(([value, count], index) => buildItem(value, count, index));
}

function aggregateMonthlyRankings(logs, searchMonth = getCollectedMonth()) {
  const keywordCounts = new Map();
  const templateTypeCounts = new Map();
  const templateKeywordCounts = new Map();

  for (const log of logs) {
    const searchType = cleanText(log?.search_type);
    const keyword = cleanText(log?.keyword);
    const templateTypeLabel = cleanText(log?.template_type_label);
    const templateTypeValue = cleanText(log?.template_type_value);

    if (searchType === 'keyword' && keyword) {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    }

    if (searchType === 'template') {
      if (templateTypeLabel || templateTypeValue) {
        const templateKey = templateTypeLabel || templateTypeValue;
        templateTypeCounts.set(templateKey, (templateTypeCounts.get(templateKey) || 0) + 1);
      }

      if (keyword) {
        templateKeywordCounts.set(keyword, (templateKeywordCounts.get(keyword) || 0) + 1);
      }
    }
  }

  return {
    searchMonth,
    keywordSearchTop20: buildTopRankings(keywordCounts, (keyword, count, index) => ({
      rank: index + 1,
      keyword,
      count,
    })),
    templateTypeTop20: buildTopRankings(templateTypeCounts, (label, count, index) => ({
      rank: index + 1,
      label,
      count,
    })),
    templateKeywordTop20: buildTopRankings(templateKeywordCounts, (keyword, count, index) => ({
      rank: index + 1,
      keyword,
      count,
    })),
  };
}

async function getMonthlyRankings() {
  const searchMonth = getCollectedMonth();
  const logs = await fetchMonthlySearchLogs(searchMonth);
  return aggregateMonthlyRankings(logs, searchMonth);
}

function parseJsonObject(raw, label) {
  if (!raw) return {};

  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object`);
  }

  return parsed;
}

function parseKeywordsInput(input) {
  const lines = String(input ?? '')
    .split(/\r?\n/)
    .map(cleanText)
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
  return String(rawQuery ?? '')
    .split(',')
    .map(cleanText)
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);
}

function validateKeywordsLimit(keywords) {
  if (keywords.length > MAX_KEYWORDS_PER_REQUEST) {
    throw new Error('한 번에 최대 5개 키워드까지 분석할 수 있습니다.');
  }
}

function parseSingleKeyword(input) {
  const keywords = parseKeywordsInput(input);

  if (keywords.length === 0) {
    throw new Error('키워드를 입력하세요.');
  }

  if (keywords.length > 1) {
    throw new Error('템플릿 분석은 키워드 1개만 입력할 수 있습니다.');
  }

  return keywords[0];
}

function getTemplateTypeConfig(typeValue) {
  const value = cleanText(typeValue);
  const config = TEMPLATE_TYPE_INDEX.get(value) || TEMPLATE_TYPE_API_INDEX.get(value);

  if (!config) {
    throw new Error('유효한 템플릿 종류를 선택하세요.');
  }

  return config;
}

function normalizeTemplateTab(tabKey) {
  const value = cleanText(tabKey);
  if (TEMPLATE_RESULT_TAB_INDEX.has(value)) {
    return value;
  }
  return TEMPLATE_RESULT_TABS[0].key;
}

function extractTagList(keywordsField) {
  const raw = Array.isArray(keywordsField)
    ? keywordsField.join('|')
    : String(keywordsField ?? '');

  return raw
    .split('|')
    .map(cleanText)
    .filter(Boolean);
}

function countFrequency(items) {
  const counts = new Map();

  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }

  return counts;
}

function includesKeyword(item, keyword) {
  const normalizedKeyword = cleanText(keyword);
  if (!normalizedKeyword) return false;

  const name = cleanText(item?.name);
  const keywordsText = cleanText(item?.keywords);
  return name.includes(normalizedKeyword) || keywordsText.includes(normalizedKeyword);
}

function buildMiricanvasUrl(keyword) {
  const params = new URLSearchParams();
  params.set('status', 'ACTIVE');
  params.set('keyword', keyword);

  for (const type of MIRICANVAS_TYPES) {
    params.append('typeList', type);
  }

  params.set('color', '');
  params.set('includePresetV2', 'true');
  params.set('page', '1');
  params.set('pageSize', '30');
  params.set('tier', 'PREMIUM');
  params.set('domain', 'production');
  params.set('language', 'ko');

  if (MIRICANVAS_TEAM_IDX) {
    params.set('teamIdx', MIRICANVAS_TEAM_IDX);
  }

  return `${MIRICANVAS_API_URL}?${params.toString()}`;
}

function buildTemplateSearchUrl(keyword, typeValue) {
  const typeConfig = getTemplateTypeConfig(typeValue);
  const params = new URLSearchParams();
  const apiValues = normalizeTemplateApiValues(typeConfig.apiValue, typeConfig.value);
  const purpose = getTemplatePurpose(typeConfig);
  const tier = getTemplateTier(typeConfig);

  params.set('color', '');
  params.set('tier', tier);
  params.set('strictLanguage', 'true');
  params.append('categoryList', 'TEMPLATE');
  params.append('categoryList', 'CREATOR');
  params.set('status', 'ACTIVE');
  params.set('isPageSearch', 'false');
  params.set('includeTemplateV2', 'true');
  params.set('language', 'ko');
  params.set('page', '1');
  params.set('pageSize', '30');
  params.set('domain', 'production');
  params.set('purpose', purpose);
  params.set('keyword', keyword);
  for (const apiValue of apiValues) {
    params.append('templateTypeIdList', apiValue);
  }

  debugLog('[template:apiValue]', JSON.stringify(apiValues));

  return `${TEMPLATE_API_URL}?${params.toString()}`;
}

function getLogSnippet(value, maxLength = 500) {
  const text = cleanText(value);
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

async function fetchJson(url, purpose) {
  const headers = parseJsonObject(MIRICANVAS_API_HEADERS_JSON, 'MIRICANVAS_API_HEADERS_JSON');
  const init = {
    method: MIRICANVAS_API_METHOD,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  const response = await fetch(url, init);
  const text = await response.text().catch(() => '');

  debugLog(
    `[${String(purpose).toLowerCase()}:response]`,
    JSON.stringify({
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      bodySnippet: getLogSnippet(text),
    })
  );

  if (!response.ok) {
    const error = new Error(`${purpose} request failed: ${response.status} ${response.statusText} ${text}`.trim());
    error.status = response.status;
    error.statusText = response.statusText;
    error.responseText = text;
    error.requestUrl = url;
    error.requestPurpose = purpose;
    throw error;
  }

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    const parseError = new Error(`${purpose} response parse failed: ${error.message || String(error)}`);
    parseError.status = response.status;
    parseError.statusText = response.statusText;
    parseError.responseText = text;
    parseError.requestUrl = url;
    parseError.requestPurpose = purpose;
    throw parseError;
  }
}

async function fetchMiricanvas(keyword) {
  if (!MIRICANVAS_API_URL) {
    throw new Error('MIRICANVAS_API_URL is required');
  }

  const url = buildMiricanvasUrl(keyword);
  debugLog('[miricanvas:url]', url);
  debugLog('[miricanvas:keyword]', JSON.stringify(keyword), 'encoded=', encodeURIComponent(keyword));

  return fetchJson(url, 'Miricanvas');
}

async function fetchTemplateSearch(keyword, typeValue) {
  const typeConfig = getTemplateTypeConfig(typeValue);
  const url = buildTemplateSearchUrl(keyword, typeValue);
  const apiValues = normalizeTemplateApiValues(typeConfig.apiValue, typeConfig.value);
  const purpose = getTemplatePurpose(typeConfig);
  const tier = getTemplateTier(typeConfig);
  debugLog('[template:url]', url);
  debugLog('[template:keyword]', JSON.stringify(keyword), 'encoded=', encodeURIComponent(keyword));
  debugLog(
    '[template:request-config]',
    JSON.stringify({
      selectedType: cleanText(typeValue),
      label: typeConfig.label,
      value: typeConfig.value,
      apiValue: typeConfig.apiValue || typeConfig.value,
      apiValues,
      purpose,
      tier,
      group: typeConfig.group,
      page: 1,
      pageSize: 30,
      templateTypeIdList: apiValues,
    })
  );

  try {
    return await fetchJson(url, 'Template');
  } catch (error) {
    debugError(
      '[template:error]',
      JSON.stringify({
        status: error?.status || null,
        label: typeConfig.label,
        value: typeConfig.value,
        apiValue: typeConfig.apiValue || typeConfig.value,
        apiValues,
        purpose,
        tier,
        group: typeConfig.group,
        url,
        message: error?.message || String(error),
        bodySnippet: getLogSnippet(error?.responseText || ''),
      })
    );

    throw new Error(TEMPLATE_TYPE_FAILURE_MESSAGE);
  }
}

async function collectTopTags(keyword) {
  const response = await fetchMiricanvas(keyword);
  const list = Array.isArray(response?.data?.list) ? response.data.list : [];
  const matchedList = list.filter((item) => includesKeyword(item, keyword));
  const analysisList = matchedList.length >= 5 ? matchedList : list;

  const allTags = [];
  for (const item of analysisList) {
    allTags.push(...extractTagList(item?.keywords));
  }

  const counts = countFrequency(allTags);
  const topTags = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .slice(0, 30)
    .map(([tag]) => tag);

  const topNames = list
    .map((item) => cleanText(item?.name))
    .filter(Boolean)
    .slice(0, 5);

  debugLog('[miricanvas:top-names-5]', topNames);
  debugLog(
    '[miricanvas:counts]',
    JSON.stringify({
      keyword,
      totalResultCount: list.length,
      matchedResultCount: matchedList.length,
      usedResultCount: analysisList.length,
    })
  );

  if (list.length > 0 && matchedList.length === 0) {
    debugWarn('[miricanvas:warning] keyword-related matches are missing. Falling back to the full result list.');
  }

  await safeLogSearchEvent({
    searchType: 'keyword',
    keyword,
  });

  return {
    keyword,
    listCount: list.length,
    matchedCount: matchedList.length,
    usedCount: analysisList.length,
    topTags,
    metaTagString: topTags.join(', '),
    collectedAt: getCollectedDate(),
  };
}

async function collectTopTagsForKeywords(keywords) {
  const results = [];

  for (const keyword of keywords) {
    results.push(await collectTopTags(keyword));
  }

  return {
    keywordCount: keywords.length,
    results,
  };
}

function tokenizeTitle(title) {
  return cleanText(title)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/)
    .map((token) => token.toLowerCase())
    .filter(Boolean)
    .filter((token) => token.length >= 2);
}

function buildRatioEntries(countsMap, total, buildLabel) {
  return [...countsMap.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'ko'))
    .map(([value, count]) => ({
      value,
      label: buildLabel(value),
      count,
      percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
    }));
}

async function collectTemplateTrend(keyword, typeValue) {
  const typeConfig = getTemplateTypeConfig(typeValue);
  const response = await fetchTemplateSearch(keyword, typeValue);
  const rawList = Array.isArray(response?.data?.list) ? response.data.list : [];
  const list = rawList.slice(0, 30);

  debugLog(
    '[template:response-shape]',
    JSON.stringify({
      hasData: Boolean(response?.data),
      listIsArray: Array.isArray(response?.data?.list),
      listLength: rawList.length,
      firstTitle: cleanText(rawList[0]?.title),
      firstPageCount: rawList[0]?.pageCount ?? null,
    })
  );

  const titles = list
    .map((item) => cleanText(item?.title))
    .filter(Boolean);

  const titleTokens = titles.flatMap(tokenizeTitle);
  const titleKeywordTop10 = [...countFrequency(titleTokens).entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .slice(0, 10)
    .map(([value, count]) => ({
      value,
      count,
      percentage: titles.length > 0 ? Number(((count / titles.length) * 100).toFixed(1)) : 0,
    }));

  const pageCounts = new Map();
  for (const item of list) {
    const pageCount = Number(item?.pageCount);
    if (!Number.isFinite(pageCount) || pageCount <= 0) continue;
    pageCounts.set(pageCount, (pageCounts.get(pageCount) || 0) + 1);
  }

  const pageCountRatios = buildRatioEntries(pageCounts, list.length, (value) => `${value}페이지`);

  debugLog(
    '[template:counts]',
    JSON.stringify({
      keyword,
      typeValue,
      templateCount: list.length,
      titleKeywordCount: titleTokens.length,
    })
  );

  await safeLogSearchEvent({
    searchType: 'template',
    keyword,
    templateTypeValue: typeConfig.value,
    templateTypeLabel: typeConfig.label,
  });

  return {
    keyword,
    typeValue: typeConfig.value,
    typeLabel: typeConfig.label,
    typeGroup: typeConfig.group,
    typePathText: (() => {
      const pathLabels = Array.isArray(typeConfig.pathLabels) ? [...typeConfig.pathLabels] : [typeConfig.label];
      if (pathLabels[0] === typeConfig.group) {
        pathLabels.shift();
      }
      return `${typeConfig.group} > ${pathLabels.join(' > ')}`;
    })(),
    templateCount: list.length,
    titleKeywordTop10,
    pageCountRatios,
    topTemplateTitles: titles,
    collectedAt: getCollectedDate(),
  };
}

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const bodyText = Buffer.concat(chunks).toString('utf8');
  if (!bodyText.trim()) return {};

  return JSON.parse(bodyText);
}

const HOME_FAQ_ITEMS = [
  {
    question: '이 서비스는 무엇인가요?',
    answer: '이 서비스는 스톡 작가와 디지털 크리에이터를 위한 분석 도구입니다. 스톡 이미지, 스톡 콘텐츠, 템플릿 데이터에서 키워드 분석과 템플릿 분석을 할 수 있도록 설계되어 있습니다.',
  },
  {
    question: '어떤 플랫폼을 분석하나요?',
    answer: '현재는 미리캔버스 기반 분석 기능을 제공하고 있습니다. 키워드 분석과 템플릿 분석 기능이 미리캔버스 응답 데이터를 바탕으로 동작하며, 향후 다양한 스톡 플랫폼 분석 기능으로 확장할 예정입니다.',
  },
  {
    question: '템플릿 분석은 무엇인가요?',
    answer: '템플릿 분석은 상위 템플릿 데이터를 기준으로 제목 키워드, 페이지 수, 제목 패턴을 파악하는 기능입니다. 상위권에 자주 노출되는 템플릿 제목 키워드를 참고할 때 활용할 수 있습니다.',
  },
  {
    question: '키워드 분석은 어떻게 활용하나요?',
    answer: '키워드 분석은 특정 키워드와 관련된 실시간 상위 요소를 분석해 가장 많이 사용되는 키워드를 추천합니다. 스톡 이미지 업로드 전 키워드 전략을 세우거나 상위 노출용 키워드를 정리할 때 유용합니다.',
  },
  {
    question: '스톡 작가에게 어떤 도움이 되나요?',
    answer: '스톡 작가는 반복적으로 발생하는 키워드 조사와 제목 패턴 확인 시간을 줄일 수 있습니다. 이를 통해 스톡 콘텐츠 기획과 콘텐츠 제작 효율 개선에 도움을 받을 수 있습니다.',
  },
];

const MIRICANVAS_FAQ_ITEMS = [
  {
    question: '미리캔버스 분석 도구는 무엇인가요?',
    answer: '미리캔버스에서 스톡 콘텐츠를 제작하는 크리에이터를 위해 만든 분석 도구 묶음입니다. 현재는 키워드 분석과 템플릿 분석 기능을 제공합니다.',
  },
  {
    question: '키워드 분석은 어떤 용도인가요?',
    answer: '실시간 상위 요소를 바탕으로 많이 사용되는 키워드를 빠르게 확인하는 용도입니다. 자주 쓰이는 키워드를 정리해 업로드 전략이나 키워드 설계에 활용할 수 있습니다.',
  },
  {
    question: '템플릿 분석은 어떤 용도인가요?',
    answer: '인기 템플릿의 제목 키워드를 분석하는 도구입니다. 상위권에 자주 노출되는 제목 패턴과 페이지 수를 참고해 콘텐츠 기획이나 템플릿 제작 방향을 잡는 데 도움이 됩니다.',
  },
  {
    question: '스톡 작가에게 어떤 도움이 되나요?',
    answer: '스톡 작가는 반복적인 조사 시간을 줄이고, 실제로 많이 보이는 키워드와 제목 패턴을 데이터 기반으로 확인할 수 있습니다. 이를 통해 업로드 전 기획과 제작 효율을 높일 수 있습니다.',
  },
];

const PLATFORM_CARDS = [
  {
    key: 'miricanvas',
    path: '/miricanvas',
    label: '미리캔버스',
    description: '미리캔버스 기반 키워드 분석과 템플릿 분석을 제공하는 현재 운영 중인 플랫폼입니다.',
    status: '사용 가능',
    available: true,
    buttonLabel: '플랫폼 보기',
  },
  {
    key: 'canva',
    path: '/canva',
    label: '캔바',
    description: '향후 키워드 분석, 템플릿 분석, 카테고리 분석을 지원할 예정인 준비중 플랫폼입니다.',
    status: '준비중',
    available: false,
    buttonLabel: '준비중 안내 보기',
  },
  {
    key: 'adobe-stock',
    path: '/adobe-stock',
    label: '어도비 스톡',
    description: '향후 스톡 이미지와 콘텐츠 성과 데이터를 분석할 수 있도록 확장 예정인 준비중 플랫폼입니다.',
    status: '준비중',
    available: false,
    buttonLabel: '준비중 안내 보기',
  },
];

const STATIC_PAGE_CONTENT = {
  '/canva': {
    title: '캔바 분석 도구 | 스톡 크리에이터 분석 플랫폼',
    description: '캔바 분석 도구는 현재 준비중입니다.',
    content: `
      <section class="page-card stack">
        <h2>현재 준비중입니다.</h2>
        <p>캔바 분석 도구는 현재 준비중입니다.</p>
      </section>
    `,
  },
  '/adobe-stock': {
    title: '어도비 스톡 분석 도구 | 스톡 크리에이터 분석 플랫폼',
    description: '어도비 스톡 분석 도구는 현재 준비중입니다.',
    content: `
      <section class="page-card stack">
        <h2>현재 준비중입니다.</h2>
        <p>어도비 스톡 분석 도구는 현재 준비중입니다.</p>
      </section>
    `,
  },
  '/about': {
    title: '서비스 소개 | 스톡 크리에이터 분석 도구',
    description: '스톡 작가와 디지털 크리에이터를 위한 키워드 분석, 템플릿 분석 서비스 소개 페이지입니다.',
    content: `
      <section class="page-card stack">
        <h2>서비스 소개</h2>
        <p>스톡 크리에이터 분석 도구는 스톡 작가, 디지털 크리에이터, 템플릿 제작자, 디자인 실무자가 더 빠르게 키워드 분석과 템플릿 분석을 수행할 수 있도록 돕는 데이터 기반 서비스입니다. 스톡 이미지나 스톡 콘텐츠를 업로드할 때는 어떤 키워드가 자주 쓰이는지, 어떤 제목 패턴이 반복되는지, 어떤 형식의 템플릿이 많이 보이는지 파악하는 작업이 중요합니다. 하지만 실제 제작 과정에서는 이 조사 작업이 많은 시간을 차지하기 때문에, 본 서비스는 그 과정을 단순화하는 데 초점을 맞추고 있습니다.</p>
        <p>현재 제공 중인 핵심 기능은 미리캔버스 기반 분석입니다. 키워드 분석은 특정 키워드에 대해 미리캔버스 요소 데이터를 분석해 자주 사용되는 태그와 키워드 패턴을 보여주고, 템플릿 분석은 미리캔버스 템플릿 데이터를 바탕으로 제목 키워드, 페이지 수, 상위 제목 구성을 정리합니다. 이는 단순 검색 결과 모음이 아니라, 상위권 노출을 목표로 키워드를 정리할 때 빠르게 참고할 수 있는 실무형 요약 정보에 가깝습니다.</p>
        <p>서비스의 장기적인 방향은 특정 플랫폼 전용 도구에 머무르지 않는 것입니다. 앞으로는 스톡 이미지, 디자인 템플릿, 디지털 다운로드 상품, 콘텐츠 제작 데이터를 다루는 다양한 플랫폼의 분석 기능을 순차적으로 지원하는 것을 목표로 하고 있습니다. 즉, 현재는 미리캔버스 기반 기능을 제공하지만, 서비스 전체 포지셔닝은 스톡 크리에이터를 위한 분석 플랫폼입니다. 제작자는 이 도구를 통해 상위 노출 키워드, 제목 패턴, 태그 구성을 더 체계적으로 파악하고, 콘텐츠 제작 전략을 빠르게 세울 수 있습니다.</p>
      </section>
    `,
  },
  '/privacy': {
    title: '개인정보처리방침 | 스톡 크리에이터 분석 도구',
    description: '수집 정보가 거의 없는 구조에 맞춘 스톡 크리에이터 분석 도구의 개인정보처리방침입니다.',
    content: `
      <section class="page-card stack">
        <h2>개인정보처리방침</h2>
        <p>스톡 크리에이터 분석 도구는 회원가입, 프로필 생성, 결제 기능을 제공하지 않는 경량형 서비스입니다. 따라서 이름, 이메일 주소, 전화번호, 생년월일과 같은 직접 식별 가능한 개인정보를 기본적으로 수집하지 않습니다. 본 서비스는 사용자가 입력한 키워드를 바탕으로 미리캔버스 기반 분석 요청을 처리하는 구조이며, 결과 화면 역시 별도의 사용자 계정 없이 즉시 제공됩니다.</p>
        <p>서비스 운영 과정에서는 안정적인 제공과 오류 대응을 위해 최소한의 기술 로그가 생성될 수 있습니다. 예를 들어 사용자가 입력한 검색 키워드, 요청 시각, 응답 상태 코드, 분석 실패 메시지 등이 일시적으로 기록될 수 있습니다. 이러한 정보는 서비스 품질 개선, 장애 원인 확인, 비정상 요청 탐지 목적에 한해 사용되며, 광고성 활용이나 제3자 판매를 위해 사용되지 않습니다.</p>
        <p>쿠키, 광고 식별자, 개인 맞춤형 프로필링과 같은 고도화된 추적 기술은 현재 기본 기능 범위에서 적극적으로 사용하지 않습니다. 다만 향후 애드센스, 방문 통계, 운영 모니터링 도구가 연결될 경우 관련 범위와 목적은 본 방침을 통해 추가 고지할 예정입니다. 법령상 보관 의무가 없는 임시 로그와 운영 데이터는 필요 기간이 지나면 정리하며, 정책이 변경될 경우 본 페이지를 통해 업데이트합니다.</p>
      </section>
    `,
  },
  '/terms': {
    title: '이용약관 | 스톡 크리에이터 분석 도구',
    description: '스톡 크리에이터 분석 도구 이용 시 적용되는 기본 SaaS 이용약관입니다.',
    content: `
      <section class="page-card stack">
        <h2>이용약관</h2>
        <p>본 서비스는 스톡 작가와 디지털 크리에이터를 위한 키워드 분석, 템플릿 분석 기능을 제공하는 온라인 SaaS형 도구입니다. 사용자는 본 서비스를 합법적이고 정상적인 범위에서 이용해야 하며, 서비스 운영을 방해하거나 외부 분석 대상 플랫폼에 과도한 부하를 주는 방식의 자동화 사용은 제한될 수 있습니다.</p>
        <p>본 서비스가 제공하는 분석 결과는 외부 플랫폼 응답 데이터를 가공한 참고 정보입니다. 따라서 특정 검색 노출, 판매 성과, 승인 결과, 업로드 성과를 보장하지 않으며, 사용자는 결과를 자신의 제작 및 업로드 전략에 맞게 판단하여 활용해야 합니다. 운영자는 데이터 구조 변경, 외부 API 정책 변경, 서비스 점검, 기능 개선 등의 사유로 제공 화면이나 결과 형식을 수정할 수 있습니다.</p>
        <p>사용자는 본 서비스에서 생성된 결과를 내부 참고 자료로 활용할 수 있으나, 서비스 자체를 재판매하거나 무단 복제하여 별도 상업 서비스로 제공해서는 안 됩니다. 무료 제공 범위 내에서 운영되는 현재 서비스 특성상, 서비스 중단, 일시 장애, 외부 플랫폼 응답 오류, 데이터 누락으로 인해 발생하는 간접적 손해에 대해서는 책임을 지지 않습니다. 다만 운영자는 가능한 범위에서 안정적인 서비스 제공과 오류 개선을 위해 지속적으로 노력합니다.</p>
      </section>
    `,
  },
  '/contact': {
    title: '문의 | 스톡 크리에이터 분석 도구',
    description: '서비스 문의 방법, 응답 안내, 서비스 소개를 담은 문의 페이지입니다.',
    content: `
      <section class="page-card stack">
        <h2>문의</h2>
        <p>스톡 크리에이터 분석 도구는 스톡 작가, 스톡 이미지 제작자, 디지털 크리에이터를 위한 키워드 분석 및 템플릿 분석 서비스를 운영하고 있습니다. 현재는 미리캔버스 기반 기능을 중심으로 제공하고 있으며, 서비스 안정화와 콘텐츠 확장을 함께 진행하고 있습니다.</p>
        <p>문의 방법은 현재 정식 접수 채널을 정리 중인 단계입니다. 향후 이메일 또는 문의 폼이 준비되면 본 페이지에서 공식 접수 방법을 안내할 예정입니다. 기능 오류, 데이터 이상, 서비스 제안, 제휴 문의가 필요한 경우에는 우선 서비스 소개, 개인정보처리방침, 이용약관을 참고해 주시기 바랍니다.</p>
        <p>응답 안내 기준은 문의 채널이 정식 오픈된 이후 별도로 공지됩니다. 기본적으로 서비스 운영, 기능 개선, 정책 안내와 관련된 문의를 우선 검토할 예정이며, 반복적이거나 기술적으로 재현이 어려운 요청은 확인 시간이 더 소요될 수 있습니다. 본 페이지는 향후 공식 문의 채널과 운영 소식을 연결하는 안내 허브 역할을 합니다.</p>
      </section>
    `,
  },
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPageSeo(pathname) {
  if (pathname === '__404__') {
    return {
      title: '페이지를 찾을 수 없습니다 | 스톡 크리에이터 분석 도구',
      description: '요청하신 페이지를 찾을 수 없습니다. 스톡 크리에이터 분석 도구의 홈 또는 분석 도구 페이지로 이동해 주세요.',
    };
  }

  if (pathname === '/') {
    return {
      title: '스톡 작가를 위한 분석 도구 | 미리캔버스, 캔바, 어도비 스톡',
      description: '스톡 작가를 위한 분석 도구입니다. 현재는 미리캔버스 기반 키워드 분석과 템플릿 분석을 제공하며, 캔바와 어도비 스톡으로 확장할 예정입니다.',
    };
  }

  if (pathname === '/miricanvas') {
    return {
      title: '미리캔버스 분석 도구 | 스톡 크리에이터 분석 플랫폼',
      description: '미리캔버스 스톡 작가를 위한 키워드 분석 및 템플릿 분석 도구 모음입니다.',
    };
  }

  if (pathname === '/miricanvas/tag') {
    return {
      title: '키워드 분석 | 미리캔버스 분석 도구 | 스톡 크리에이터 분석 플랫폼',
      description: '실시간 상위 요소를 분석하여 가장 많이 사용되는 키워드를 추천하는 도구입니다. 스톡 콘텐츠 키워드 전략 수립에 활용할 수 있습니다.',
    };
  }

  if (pathname === '/miricanvas/template') {
    return {
      title: '템플릿 분석 | 미리캔버스 분석 도구 | 스톡 크리에이터 분석 플랫폼',
      description: '미리캔버스 스톡 작가를 위한 템플릿 분석 도구입니다.',
    };
  }

  return {
    title: STATIC_PAGE_CONTENT[pathname]?.title || '스톡 크리에이터 분석 도구',
    description: STATIC_PAGE_CONTENT[pathname]?.description || '스톡 작가와 디지털 크리에이터를 위한 분석 도구입니다.',
  };
}

function buildStructuredData(pathname, origin, canonicalUrl) {
  const items = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: '스톡 크리에이터 분석 도구',
      url: `${origin}/`,
      description: '스톡 작가와 디지털 크리에이터를 위한 키워드 분석, 템플릿 분석 도구',
      inLanguage: 'ko-KR',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: '스톡 크리에이터 분석 도구',
      url: `${origin}/`,
      description: '미리캔버스 기반 기능을 시작으로 확장 중인 스톡 크리에이터 분석 플랫폼',
    },
  ];

  if (pathname === '/') {
    items.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: HOME_FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  if (pathname === '/miricanvas') {
    items.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: MIRICANVAS_FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  items.push({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: buildPageSeo(pathname).title,
    url: canonicalUrl,
    description: buildPageSeo(pathname).description,
    inLanguage: 'ko-KR',
  });

  return items.map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`).join('\n');
}

function buildBreadcrumbItems(pathname) {
  if (pathname === '/miricanvas') {
    return [
      { label: '홈', href: '/' },
      { label: '미리캔버스', href: '/miricanvas' },
    ];
  }

  if (pathname === '/miricanvas/tag') {
    return [
      { label: '홈', href: '/' },
      { label: '미리캔버스', href: '/miricanvas' },
      { label: '키워드 분석', href: '/miricanvas/tag' },
    ];
  }

  if (pathname === '/miricanvas/template') {
    return [
      { label: '홈', href: '/' },
      { label: '미리캔버스', href: '/miricanvas' },
      { label: '템플릿 분석', href: '/miricanvas/template' },
    ];
  }

  if (pathname === '/canva') {
    return [
      { label: '홈', href: '/' },
      { label: '캔바', href: '/canva' },
    ];
  }

  if (pathname === '/adobe-stock') {
    return [
      { label: '홈', href: '/' },
      { label: '어도비 스톡', href: '/adobe-stock' },
    ];
  }

  return [];
}

function htmlPage(pathname, origin, options = {}) {
  const isNotFoundPage = Boolean(options.notFound);
  const staticPage = STATIC_PAGE_CONTENT[pathname] || null;
  const isHomePage = pathname === '/' && !isNotFoundPage;
  const isMiricanvasPage = pathname === '/miricanvas';
  const isTemplatePage = pathname === '/miricanvas/template';
  const isElementPage = pathname === '/miricanvas/tag';
  const activeMenu = pathname.startsWith('/miricanvas')
    ? 'miricanvas'
    : pathname === '/canva'
      ? 'canva'
        : pathname === '/adobe-stock'
          ? 'adobe-stock'
          : 'home';
  const seo = buildPageSeo(isNotFoundPage ? '__404__' : pathname);
  const canonicalPath = pathname === '/' ? '/' : pathname;
  const canonicalUrl = `${origin}${canonicalPath}`;
  const heroTitle = isNotFoundPage
    ? '페이지를 찾을 수 없습니다'
    : isHomePage
    ? '스톡 작가를 위한 분석 도구'
    : isMiricanvasPage
      ? '미리캔버스 분석 도구'
    : staticPage?.title?.split(' | ')[0] || (isTemplatePage ? '템플릿 분석' : '키워드 분석');
  const heroDesc = isNotFoundPage
    ? '요청하신 페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.'
    : isHomePage
    ? '스톡 콘텐츠 제작에 필요한 상위 노출 키워드를 분석합니다.'
    : isMiricanvasPage
      ? '미리캔버스에서 스톡 콘텐츠를 제작하는 크리에이터를 위한 분석 도구입니다.'
    : staticPage?.description || (isTemplatePage
      ? '상위 템플릿 데이터를 분석하여 제목 키워드, 페이지 수, 제목 패턴을 확인할 수 있는 템플릿 분석 도구입니다.'
      : '실시간 상위 요소를 분석하여 가장 많이 사용되는 키워드를 추천하는 키워드 분석 도구입니다.');
  const structuredDataScripts = buildStructuredData(isNotFoundPage ? '__404__' : pathname, origin, canonicalUrl);
  const breadcrumbItems = isNotFoundPage ? [] : buildBreadcrumbItems(pathname);
  const breadcrumbHtml = breadcrumbItems.length > 0
    ? `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        ${breadcrumbItems.map((item, index) => `
          ${index > 0 ? '<span class="breadcrumb-sep">></span>' : ''}
          <a href="${item.href}">${item.label}</a>
        `).join('')}
      </nav>
    `
    : '';

  const toolHtml = isTemplatePage
    ? `
      <section class="card">
        <label for="templateKeyword">키워드</label>
        <input id="templateKeyword" class="text-input" type="text" placeholder="예) 6월" />

        <label for="templateTypeSearch" style="margin-top: 16px;">템플릿 종류 검색</label>
        <input id="templateTypeSearch" class="text-input" type="text" placeholder="템플릿 종류를 검색하세요." />

        <div class="type-panel">
          <div class="type-filter-tabs" id="templateTypeTabs"></div>
          <div class="type-panel-list" id="templateTypePanel"></div>
        </div>

        <div class="selected-type" id="selectedTemplateTypeText">선택됨: 웹 > 프레젠테이션</div>

        <div class="actions">
          <button class="primary" id="templateRunBtn">템플릿 분석</button>
        </div>
        <div class="status" id="status">대기 중</div>
      </section>
    `
    : `
      <section class="card">
        <label for="keyword">키워드</label>
        <textarea id="keyword" placeholder="키워드를 한 줄에 하나씩 입력하세요.

예)
수박
빙수
아이스크림"></textarea>
        <div class="actions">
          <button class="primary" id="runBtn">키워드 분석</button>
        </div>
        <div class="status" id="status">대기 중</div>
      </section>
    `;

  const homeHtml = `
    <div class="page-grid">
      <section class="page-card stack">
        <div class="eyebrow">Platform Vision</div>
        <h2>플랫폼 중심으로 확장되는 스톡 작가를 위한 분석 도구</h2>
        <p>스톡 작가와 디지털 크리에이터가 상위권에 노출되는 키워드와 템플릿 제목 패턴을 더 빠르게 파악할 수 있도록 돕는 서비스입니다.</p>
        <p>플랫폼별 특성에 맞춰 키워드 분석, 템플릿 분석, 콘텐츠 전략 수립을 지원하는 구조로 발전시키는 것이 목표입니다. 지금은 미리캔버스가 사용 가능한 상태이며, 나머지 플랫폼은 준비중 페이지에서 향후 제공 방향을 안내합니다.</p>
      </section>

      <section class="platform-grid">
        <article class="feature-card platform-card">
          <div class="platform-head">
            <div class="platform-badges">
              <span class="status-badge available">운영중</span>
              <span class="status-badge available">사용 가능</span>
            </div>
          </div>
          <h2>미리캔버스</h2>
          <p>미리캔버스 스톡 콘텐츠 제작자를 위한 분석 도구입니다.</p>
          <ul class="feature-list feature-checklist">
            <li>키워드 분석</li>
            <li>템플릿 분석</li>
          </ul>
          <a class="cta-link" href="/miricanvas">분석 시작</a>
        </article>

        <article class="feature-card platform-card">
          <div class="platform-head">
            <div class="platform-badges">
              <span class="status-badge coming">준비중</span>
            </div>
          </div>
          <h2>캔바</h2>
          <p>준비중</p>
        </article>

        <article class="feature-card platform-card">
          <div class="platform-head">
            <div class="platform-badges">
              <span class="status-badge coming">준비중</span>
            </div>
          </div>
          <h2>어도비 스톡</h2>
          <p>준비중</p>
        </article>
      </section>

      <section class="page-card stack">
        <div class="eyebrow">Monthly Rankings</div>
        <h2>이번달 인기 검색 순위</h2>
        <p>이번달 사용자 검색 데이터를 기준으로 많이 찾은 키워드와 템플릿을 정리합니다.</p>
        <div class="summary-grid" id="rankingPanel">
          <section class="summary-card">
            <h2>이번달 키워드 검색 순위 TOP 20</h2>
            <div class="result-empty">불러오는 중...</div>
          </section>
          <section class="summary-card">
            <h2>이번달 템플릿 종류 검색 순위 TOP 20</h2>
            <div class="result-empty">불러오는 중...</div>
          </section>
          <section class="summary-card">
            <h2>이번달 템플릿 키워드 검색 순위 TOP 20</h2>
            <div class="result-empty">불러오는 중...</div>
          </section>
        </div>
      </section>

      <section class="page-card stack">
        <div class="eyebrow">FAQ</div>
        <h2>자주 묻는 질문</h2>
        ${HOME_FAQ_ITEMS.map((item) => `
          <article class="faq-item">
            <h3>${item.question}</h3>
            <p>${item.answer}</p>
          </article>
        `).join('')}
      </section>
    </div>
  `;

  const miricanvasHtml = `
    <div class="page-grid">
      <section class="page-card stack">
        <div class="eyebrow">Miricanvas Platform</div>
        <h2>미리캔버스에서 스톡 콘텐츠를 제작하는 크리에이터를 위한 분석 도구</h2>
        <p>미리캔버스 분석 도구는 스톡 작가와 디지털 크리에이터가 상위 노출 키워드와 인기 템플릿 제목 패턴을 빠르게 파악할 수 있도록 설계되어 있습니다.</p>
      </section>

      <section class="home-grid">
        <article class="feature-card">
          <div class="eyebrow">Keyword Analysis</div>
          <h2>키워드 분석</h2>
          <p>실시간 상위 요소를 분석하여 가장 많이 사용되는 키워드를 추천합니다.</p>
          <a class="cta-link" href="/miricanvas/tag">키워드 분석 시작</a>
        </article>
        <article class="feature-card">
          <div class="eyebrow">Template Analysis</div>
          <h2>템플릿 분석</h2>
          <p>인기 템플릿의 제목 키워드와 상위 노출 패턴을 분석합니다.</p>
          <a class="cta-link" href="/miricanvas/template">템플릿 분석 시작</a>
        </article>
      </section>

      <section class="page-card stack">
        <div class="eyebrow">FAQ</div>
        <h2>자주 묻는 질문</h2>
        ${MIRICANVAS_FAQ_ITEMS.map((item) => `
          <article class="faq-item">
            <h3>${item.question}</h3>
            <p>${item.answer}</p>
          </article>
        `).join('')}
      </section>
    </div>
  `;

  const notFoundHtml = `
    <div class="page-grid">
      <section class="page-card stack">
        <div class="eyebrow">404 Not Found</div>
        <h2>페이지를 찾을 수 없습니다</h2>
        <p>요청하신 페이지가 삭제되었거나 주소가 변경되었을 수 있습니다.</p>
        <div class="actions">
          <a class="cta-link" href="/">홈으로 이동</a>
          <a class="ghost-link" href="/miricanvas/tag">키워드 분석</a>
          <a class="ghost-link" href="/miricanvas/template">템플릿 분석</a>
        </div>
      </section>
    </div>
  `;

  const contentHtml = isNotFoundPage
    ? notFoundHtml
    : isHomePage
      ? homeHtml
    : isMiricanvasPage
      ? miricanvasHtml
    : staticPage
      ? `<div class="page-grid">${staticPage.content}</div>`
      : `
        <div class="grid">
          ${toolHtml}

          <section class="card">
            <label>결과</label>
            <div class="result-panel" id="resultPanel">
              <div class="result-empty">아직 결과가 없습니다.</div>
            </div>
          </section>
        </div>
      `;

  return `<!doctype html>
<html lang="ko">
<head>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-THGZ9WD3');</script>
  <!-- End Google Tag Manager -->
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="google-adsense-account" content="ca-pub-3386559853644133" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <title>${escapeHtml(seo.title)}</title>
  <meta name="description" content="${escapeHtml(seo.description)}" />
  <meta name="robots" content="${isNotFoundPage ? 'noindex' : 'index,follow'}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <meta property="og:type" content="website" />
  <meta property="og:locale" content="ko_KR" />
  <meta property="og:site_name" content="스톡 크리에이터 분석 도구" />
  <meta property="og:title" content="${escapeHtml(seo.title)}" />
  <meta property="og:description" content="${escapeHtml(seo.description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${escapeHtml(seo.title)}" />
  <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-5J443L4F10"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-5J443L4F10');
  </script>
  ${structuredDataScripts}
  <style>
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

      .summary-grid {
        grid-template-columns: 1fr;
      }

      .hero {
        padding: 22px;
      }

      .tabs {
        margin-left: -2px;
        margin-right: -2px;
      }

      .menu {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-THGZ9WD3"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->
  <div class="wrap">
    <div class="topbar">
      <nav class="menu" aria-label="서비스 메뉴">
        <a href="/" class="${activeMenu === 'home' ? 'active' : ''}">홈</a>
        <a href="/miricanvas" class="${activeMenu === 'miricanvas' ? 'active' : ''}">미리캔버스</a>
        <a href="/canva" class="${activeMenu === 'canva' ? 'active' : ''}">캔바</a>
        <a href="/adobe-stock" class="${activeMenu === 'adobe-stock' ? 'active' : ''}">어도비 스톡</a>
      </nav>
    </div>

    ${breadcrumbHtml}

    <section class="hero">
      <h1>${heroTitle}</h1>
      <p class="desc">${heroDesc}</p>
    </section>

    <main>
      ${contentHtml}
    </main>

    <footer class="site-footer">
      <div class="footer-brand">스톡 크리에이터 분석 도구</div>
      <nav class="footer-links" aria-label="하단 정보 링크">
        <a href="/about">서비스 소개</a>
        <a href="/privacy">개인정보처리방침</a>
        <a href="/terms">이용약관</a>
        <a href="/contact">문의</a>
      </nav>
    </footer>
  </div>

  <script>
    const CURRENT_PATH = window.location.pathname;
    const DEBUG = ${JSON.stringify(DEBUG)};
    const TEMPLATE_TYPE_OPTIONS = ${JSON.stringify(TEMPLATE_TYPE_MAP)};
    const TEMPLATE_FILTER_TABS = ${JSON.stringify(TEMPLATE_FILTER_TABS)};
    const TEMPLATE_RESULT_TABS = ${JSON.stringify(TEMPLATE_RESULT_TABS)};
    const MAX_KEYWORDS = ${MAX_KEYWORDS_PER_REQUEST};
    const resultPanelEl = document.getElementById('resultPanel');
    const statusEl = document.getElementById('status');
    const keywordEl = document.getElementById('keyword');
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

    function buildElementResultUrl(keywords, activeTab) {
      const q = keywords.map((keyword) => encodeURIComponent(keyword)).join(',');
      let url = '/miricanvas/tag?q=' + q;

      if (activeTab) {
        url += '&tab=' + encodeURIComponent(activeTab);
      }

      return url;
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

    function createRankingCard(titleText, items, valueKey) {
      const card = document.createElement('section');
      card.className = 'summary-card';

      const heading = document.createElement('h3');
      heading.textContent = titleText;
      card.appendChild(heading);

      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'result-empty';
        empty.textContent = '이번달 데이터가 아직 없습니다.';
        card.appendChild(empty);
        return card;
      }

      const list = document.createElement('ol');
      list.className = 'rank-list';

      items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'rank-item';

        const rank = document.createElement('span');
        rank.className = 'rank-order';
        rank.textContent = String(index + 1);

        const label = document.createElement('span');
        label.className = 'rank-label';
        label.textContent = item[valueKey] || '-';

        const count = document.createElement('span');
        count.className = 'rank-count';
        count.textContent = (item.count || 0) + '회';

        li.appendChild(rank);
        li.appendChild(label);
        li.appendChild(count);
        list.appendChild(li);
      });

      card.appendChild(list);
      return card;
    }

    function renderMonthlyRankings(data) {
      if (!rankingPanelEl) return;
      rankingPanelEl.innerHTML = '';

      rankingPanelEl.appendChild(
        createRankingCard('이번달 키워드 검색 순위 TOP 20', data.keywordSearchTop20 || [], 'keyword')
      );
      rankingPanelEl.appendChild(
        createRankingCard('이번달 템플릿 종류 검색 순위 TOP 20', data.templateTypeTop20 || [], 'label')
      );
      rankingPanelEl.appendChild(
        createRankingCard('이번달 템플릿 키워드 검색 순위 TOP 20', data.templateKeywordTop20 || [], 'keyword')
      );
    }

    async function loadMonthlyRankings() {
      if (!rankingPanelEl) return;

      try {
        const response = await fetch('/api/monthly-rankings');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || '랭킹 요청 실패');
        }

        renderMonthlyRankings(data);
      } catch (error) {
        rankingPanelEl.innerHTML = '';
        const card = document.createElement('section');
        card.className = 'summary-card';
        const heading = document.createElement('h3');
        heading.textContent = '이번달 인기 검색 순위';
        const empty = document.createElement('div');
        empty.className = 'result-empty';
        empty.textContent = error?.message || String(error);
        card.appendChild(heading);
        card.appendChild(empty);
        rankingPanelEl.appendChild(card);
      }
    }

    function getEditableTags(item) {
      if (!Array.isArray(item.editableTopTags)) {
        item.editableTopTags = [...(item.topTags || [])];
      }

      return item.editableTopTags;
    }

    function buildMetaTagString(tags) {
      return tags.join(', ');
    }

    function renderTags(tags, onRemove) {
      const wrap = document.createElement('div');
      wrap.className = 'tags';

      for (const [index, tag] of tags.entries()) {
        const chip = document.createElement('span');
        chip.className = 'tag';

        const label = document.createElement('span');
        label.className = 'tag-label';
        label.textContent = tag;
        chip.appendChild(label);

        if (typeof onRemove === 'function') {
          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'tag-remove';
          removeBtn.textContent = 'x';
          removeBtn.setAttribute('aria-label', tag + ' 삭제');
          removeBtn.addEventListener('click', () => {
            onRemove(index);
          });
          chip.appendChild(removeBtn);
        }

        wrap.appendChild(chip);
      }

      return wrap;
    }

    function createElementResultCard(item, selectedIndex) {
      const editableTags = getEditableTags(item);
      const metaTagString = buildMetaTagString(editableTags);
      const card = document.createElement('section');
      card.className = 'result-card';

      const head = document.createElement('div');
      head.className = 'result-head';

      const title = document.createElement('h3');
      title.className = 'result-title';
      title.textContent = '[' + item.keyword + ']';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'secondary copy-chip';
      copyBtn.textContent = '복사하기';
      copyBtn.addEventListener('click', async () => {
        await copyText(metaTagString || '', item.keyword + ' 복사 완료');
      });

      head.appendChild(title);
      head.appendChild(copyBtn);

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = '메타태그: ' + editableTags.length + '개 / 수집일: ' + item.collectedAt;

      const text = document.createElement('div');
      text.className = 'result-text';
      text.textContent = metaTagString || '(메타태그 없음)';

      card.appendChild(head);
      card.appendChild(meta);
      card.appendChild(text);
      card.appendChild(renderTags(editableTags, (tagIndex) => {
        editableTags.splice(tagIndex, 1);
        renderElementResults(lastResults, selectedIndex);
      }));

      return card;
    }

    function renderElementResults(results, selectedIndex = 0) {
      resultPanelEl.innerHTML = '';
      lastResults = results;

      results.forEach((item) => {
        getEditableTags(item);
      });

      if (!results.length) {
        resultPanelEl.innerHTML = '<div class="result-empty">결과가 없습니다.</div>';
        return;
      }

      const tabs = document.createElement('div');
      tabs.className = 'tabs';

      results.forEach((item, index) => {
        const tabBtn = document.createElement('button');
        tabBtn.className = 'tab-btn' + (index === selectedIndex ? ' active' : '');
        tabBtn.textContent = '[' + item.keyword + ']';
        tabBtn.addEventListener('click', () => {
          const nextUrl = buildElementResultUrl(results.map((result) => result.keyword), item.keyword);
          window.history.replaceState({}, '', nextUrl);
          renderElementResults(lastResults, index);
        });
        tabs.appendChild(tabBtn);
      });

      resultPanelEl.appendChild(tabs);
      resultPanelEl.appendChild(createElementResultCard(results[selectedIndex], selectedIndex));
    }

    function createMetricBlock(titleText, rows) {
      const block = document.createElement('section');
      block.className = 'metric-block';

      const title = document.createElement('h3');
      title.className = 'metric-title';
      title.textContent = titleText;
      block.appendChild(title);

      if (!rows.length) {
        const empty = document.createElement('div');
        empty.className = 'result-empty';
        empty.textContent = '분석 가능한 데이터가 없습니다.';
        block.appendChild(empty);
        return block;
      }

      const list = document.createElement('div');
      list.className = 'metric-list';

      rows.forEach((row) => {
        list.appendChild(row);
      });

      block.appendChild(list);
      return block;
    }

    function createMetricRow(leftText, rightText) {
      const row = document.createElement('div');
      row.className = 'metric-row';

      const left = document.createElement('span');
      left.textContent = leftText;

      const right = document.createElement('span');
      right.textContent = rightText;

      row.appendChild(left);
      row.appendChild(right);
      return row;
    }

    function createTitleListBlock(titleText, items) {
      const block = document.createElement('section');
      block.className = 'metric-block';

      const heading = document.createElement('h3');
      heading.className = 'metric-title';
      heading.textContent = titleText;
      block.appendChild(heading);

      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'result-empty';
        empty.textContent = '분석 가능한 데이터가 없습니다.';
        block.appendChild(empty);
        return block;
      }

      const list = document.createElement('ol');
      list.className = 'title-list';

      items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });

      block.appendChild(list);
      return block;
    }

    function createTemplateTabButtons(result, selectedTab) {
      const tabs = document.createElement('div');
      tabs.className = 'tabs';

      TEMPLATE_RESULT_TABS.forEach((tab) => {
        const tabBtn = document.createElement('button');
        tabBtn.className = 'tab-btn' + (tab.key === selectedTab ? ' active' : '');
        tabBtn.textContent = tab.label;
        tabBtn.addEventListener('click', () => {
          const nextTab = normalizeTemplateTab(tab.key);
          const nextUrl = buildTemplateResultUrl(result.keyword, result.typeValue, nextTab);
          window.history.replaceState({}, '', nextUrl);
          renderTemplateResult(lastTemplateResult, nextTab);
        });
        tabs.appendChild(tabBtn);
      });

      return tabs;
    }

    function buildTemplateTabContent(result, selectedTab) {
      if (selectedTab === 'pageCount') {
        const rows = (result.pageCountRatios || []).map((item) =>
          createMetricRow(item.label, item.count + '개 / ' + item.percentage + '%')
        );
        return createMetricBlock('페이지 수 비율', rows);
      }

      if (selectedTab === 'topTitles') {
        return createTitleListBlock('상위 템플릿 제목 30개', result.topTemplateTitles || []);
      }

      const rows = (result.titleKeywordTop10 || []).map((item) =>
        createMetricRow(item.value, item.count + '회 / ' + item.percentage + '%')
      );
      return createMetricBlock('제목 키워드 TOP 10', rows);
    }

    function renderTemplateResult(result, requestedTab) {
      resultPanelEl.innerHTML = '';
      lastTemplateResult = result;

      if (!result) {
        resultPanelEl.innerHTML = '<div class="result-empty">결과가 없습니다.</div>';
        return;
      }

      const selectedTab = normalizeTemplateTab(requestedTab);
      const card = document.createElement('section');
      card.className = 'result-card stack';

      const head = document.createElement('div');
      head.className = 'result-head';

      const title = document.createElement('h3');
      title.className = 'result-title';
      title.textContent = '[' + result.keyword + '] ' + result.typeLabel;
      head.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = '분석 대상: ' + result.templateCount + '개 / 수집일: ' + result.collectedAt;

      card.appendChild(head);
      card.appendChild(meta);
      card.appendChild(createTemplateTabButtons(result, selectedTab));
      card.appendChild(buildTemplateTabContent(result, selectedTab));

      resultPanelEl.appendChild(card);
    }

    function setSelectedTemplateType(value) {
      const config = resolveTemplateTypeConfig(value);
      if (!config) return;
      selectedTemplateTypeValue = config.value;
      updateSelectedTemplateTypeText();
      renderTemplateTypePanel();
    }

    function updateSelectedTemplateTypeText() {
      if (!selectedTemplateTypeTextEl) return;

      const selected = TEMPLATE_TYPE_INDEX.get(selectedTemplateTypeValue);
      if (!selected) {
        selectedTemplateTypeTextEl.textContent = '선택됨: 없음';
        return;
      }

      const pathLabels = Array.isArray(selected.pathLabels) ? [...selected.pathLabels] : [selected.label];
      if (pathLabels[0] === selected.group) {
        pathLabels.shift();
      }
      const pathText = pathLabels.join(' > ');
      selectedTemplateTypeTextEl.textContent = '선택됨: ' + selected.group + ' > ' + pathText;
    }

    function createTemplateFilterTabs() {
      if (!templateTypeTabsEl) return;
      templateTypeTabsEl.innerHTML = '';

      TEMPLATE_FILTER_TABS.forEach((tab) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'type-filter-tab' + (tab.key === currentTemplateFilterTab ? ' active' : '');
        btn.textContent = tab.label;
        btn.addEventListener('click', () => {
          currentTemplateFilterTab = tab.key;
          renderTemplateTypePanel();
          createTemplateFilterTabs();
        });
        templateTypeTabsEl.appendChild(btn);
      });
    }

    function toggleTemplateGroup(groupKey) {
      if (expandedTemplateGroups.has(groupKey)) {
        expandedTemplateGroups.delete(groupKey);
      } else {
        expandedTemplateGroups.add(groupKey);
      }
      renderTemplateTypePanel();
    }

    function matchesTemplateFilterTab(item) {
      return currentTemplateFilterTab === 'all' || item.group === currentTemplateFilterTab;
    }

    function itemMatchesTemplateSearch(item) {
      const searchText = currentTemplateSearchText.toLowerCase();
      if (!searchText) return true;

      const pathText = Array.isArray(item.pathLabels) ? item.pathLabels.join(' ') : '';
      return (
        item.label.toLowerCase().includes(searchText) ||
        item.group.toLowerCase().includes(searchText) ||
        pathText.toLowerCase().includes(searchText)
      );
    }

    function itemHasMatchingDescendant(item) {
      if (!Array.isArray(item.children) || item.children.length === 0) {
        return itemMatchesTemplateSearch(item);
      }

      if (itemMatchesTemplateSearch(item)) {
        return true;
      }

      return item.children.some((child) => itemHasMatchingDescendant(child));
    }

    function appendTemplateNode(parentEl, item, depth = 0, groupKey = item.value) {
      const hasSearchText = currentTemplateSearchText.length > 0;
      const selfMatchesSearch = itemMatchesTemplateSearch(item);
      const descendantMatchesSearch = itemHasMatchingDescendant(item);
      const visibleBySearch = !hasSearchText || selfMatchesSearch || descendantMatchesSearch;
      const visibleByTab = matchesTemplateFilterTab(item);

      if (!visibleByTab || !visibleBySearch) {
        return;
      }

      if (Array.isArray(item.children) && item.children.length > 0) {
        const shouldExpand = hasSearchText
          ? selfMatchesSearch || descendantMatchesSearch || expandedTemplateGroups.has(groupKey)
          : expandedTemplateGroups.has(groupKey);
        const parentBtn = document.createElement('button');
        parentBtn.type = 'button';
        parentBtn.className = 'type-parent-btn';

        const meta = document.createElement('div');
        meta.className = 'type-parent-meta';

        const label = document.createElement('span');
        label.textContent = item.label;

        const marker = document.createElement('span');
        marker.textContent = shouldExpand ? '접기' : '펼치기';

        meta.appendChild(label);
        meta.appendChild(marker);
        parentBtn.appendChild(meta);
        parentBtn.addEventListener('click', () => toggleTemplateGroup(groupKey));
        parentEl.appendChild(parentBtn);

        if (shouldExpand) {
          const childList = document.createElement('div');
          childList.className = 'type-child-list';

          item.children.forEach((child, index) => {
            appendTemplateNode(
              childList,
              child,
              depth + 1,
              groupKey + ':' + index + ':' + child.label
            );
          });

          if (childList.childElementCount > 0) {
            parentEl.appendChild(childList);
          }
        }

        return;
      }

      const optionBtn = document.createElement('button');
      optionBtn.type = 'button';
      optionBtn.className =
        'type-option-btn' +
        (item.value === selectedTemplateTypeValue ? ' active' : '');
      optionBtn.textContent = item.label;
      optionBtn.addEventListener('click', () => setSelectedTemplateType(item.value));
      parentEl.appendChild(optionBtn);
    }

    function renderTemplateTypePanel() {
      if (!templateTypePanelEl) return;
      templateTypePanelEl.innerHTML = '';

      const visibleGroups = TEMPLATE_FILTER_TABS
        .filter((tab) => tab.key !== 'all')
        .map((tab) => tab.key);

      const groupsToRender =
        currentTemplateFilterTab === 'all'
          ? [...new Set(FLAT_TEMPLATE_TYPE_OPTIONS.map((item) => item.group))]
          : [currentTemplateFilterTab];

      let renderedAny = false;

      groupsToRender.forEach((groupName) => {
        const groupSection = document.createElement('section');
        groupSection.className = 'type-group';

        const heading = document.createElement('div');
        heading.className = 'type-group-title';
        heading.textContent = groupName;
        groupSection.appendChild(heading);

        const list = document.createElement('div');
        list.className = 'type-option-list';

        const topLevelItems = TEMPLATE_TYPE_OPTIONS.filter((item) => item.group === groupName);
        topLevelItems.forEach((item, index) => {
          if (item.label === groupName && Array.isArray(item.children) && item.children.length > 0) {
            item.children.forEach((child, childIndex) => {
              appendTemplateNode(list, child, 0, groupName + ':' + index + ':' + childIndex + ':' + child.label);
            });
            return;
          }

          appendTemplateNode(list, item, 0, groupName + ':' + index + ':' + item.label);
        });

        if (list.childElementCount > 0) {
          renderedAny = true;
          groupSection.appendChild(list);
          templateTypePanelEl.appendChild(groupSection);
        }
      });

      if (!renderedAny) {
        templateTypePanelEl.innerHTML = '<div class="result-empty">검색 결과가 없습니다.</div>';
      }
    }

    function initializeTemplateTypePanel(defaultValue) {
      if (!templateTypePanelEl || !templateTypeTabsEl) return;

      const config = resolveTemplateTypeConfig(defaultValue);
      if (config) {
        selectedTemplateTypeValue = config.value;
      }

      createTemplateFilterTabs();
      updateSelectedTemplateTypeText();
      renderTemplateTypePanel();
    }

    async function loadElementResultPage() {
      const currentUrl = new URL(window.location.href);
      const keywords = parseKeywordsQuery(currentUrl.searchParams.get('q'));
      const activeTab = currentUrl.searchParams.get('tab');

      if (keywords.length === 0) {
        resultPanelEl.innerHTML = '<div class="result-empty">분석할 키워드가 없습니다.</div>';
        setStatus('대기 중');
        return;
      }

      try {
        validateKeywordsLimit(keywords);
      } catch (error) {
        resultPanelEl.innerHTML = '<div class="result-empty">' + (error.message || String(error)) + '</div>';
        setStatus('실패');
        return;
      }

      if (keywordEl) {
        keywordEl.value = keywords.join('\\n');
      }

      setStatus('미리캔버스 API 호출 중...');
      resultPanelEl.innerHTML = '<div class="result-empty">처리 중...</div>';
      lastResults = [];

      try {
        const response = await fetch('/api/collect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keywordsText: keywords.join('\\n'),
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || '요청 실패');
        }

        const results = data.results || [];
        const selectedIndex = Math.max(0, results.findIndex((item) => item.keyword === activeTab));
        renderElementResults(results, selectedIndex >= 0 ? selectedIndex : 0);
        setStatus((data.keywordCount || 0) + '개 키워드 분석 완료');
      } catch (error) {
        resultPanelEl.innerHTML = '<div class="result-empty">오류: ' + (error?.message || String(error)) + '</div>';
        setStatus('실패');
      }
    }

    async function loadTemplateResultPage() {
      const currentUrl = new URL(window.location.href);
      const keyword = cleanText(currentUrl.searchParams.get('q'));
      const typeValue = cleanText(currentUrl.searchParams.get('type'));
      const selectedTab = normalizeTemplateTab(currentUrl.searchParams.get('tab'));

      initializeTemplateTypePanel(typeValue || 'presentation');

      if (!keyword || !typeValue) {
        resultPanelEl.innerHTML = '<div class="result-empty">키워드와 템플릿 종류를 입력하면 결과가 여기에 표시됩니다.</div>';
        setStatus('대기 중');
        return;
      }

      const typeConfig = resolveTemplateTypeConfig(typeValue);
      if (!typeConfig) {
        resultPanelEl.innerHTML = '<div class="result-empty">유효한 템플릿 종류를 선택하세요.</div>';
        setStatus('실패');
        return;
      }

      selectedTemplateTypeValue = typeConfig.value;
      updateSelectedTemplateTypeText();
      renderTemplateTypePanel();

      const canonicalUrl = buildTemplateResultUrl(keyword, typeConfig.value, selectedTab);
      if (window.location.pathname + window.location.search !== canonicalUrl) {
        window.history.replaceState({}, '', canonicalUrl);
      }

      if (templateKeywordEl) {
        templateKeywordEl.value = keyword;
      }

      setStatus('템플릿 분석 중...');
      resultPanelEl.innerHTML = '<div class="result-empty">처리 중...</div>';
      lastTemplateResult = null;

      try {
        const response = await fetch('/api/template-trend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keyword,
            type: typeValue,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || '요청 실패');
        }

        renderTemplateResult(data, selectedTab);
        setStatus('템플릿 분석 완료');
      } catch (error) {
        resultPanelEl.innerHTML = '<div class="result-empty">' + (error?.message || String(error)) + '</div>';
        setStatus('실패');
      }
    }

    if (templateTypeSearchEl) {
      templateTypeSearchEl.addEventListener('input', () => {
        currentTemplateSearchText = cleanText(templateTypeSearchEl.value);
        renderTemplateTypePanel();
      });
    }

    if (runBtn) {
      runBtn.addEventListener('click', () => {
        const keywords = parseKeywordsInput(keywordEl.value);

        if (keywords.length === 0) {
          setStatus('키워드를 입력하세요.');
          return;
        }

        try {
          validateKeywordsLimit(keywords);
        } catch (error) {
          setStatus(error.message || String(error));
          return;
        }

        window.location.href = buildElementResultUrl(keywords);
      });
    }

    if (templateRunBtn) {
      templateRunBtn.addEventListener('click', () => {
        try {
          const keyword = parseSingleKeywordInput(templateKeywordEl.value);
          const typeValue = cleanText(selectedTemplateTypeValue);

          const typeConfig = resolveTemplateTypeConfig(typeValue);
          if (!typeConfig) {
            throw new Error('유효한 템플릿 종류를 선택하세요.');
          }

          debugLog(
            '[template:selected]',
            JSON.stringify({
              label: typeConfig.label,
              value: typeConfig.value,
              apiValue: typeConfig.apiValue || typeConfig.value,
              purpose: typeConfig.purpose || (typeConfig.group === '동영상' ? 'VIDEO' : typeConfig.group === '인쇄' ? 'PRINT' : 'WEB'),
              tier: typeConfig.tier || 'PREMIUM',
            })
          );

          window.location.href = buildTemplateResultUrl(keyword, typeConfig.value, 'titleKeywords');
        } catch (error) {
          setStatus(error.message || String(error));
        }
      });
    }

    if (CURRENT_PATH === '/miricanvas/template') {
      initializeTemplateTypePanel('presentation');
    }

    if (rankingPanelEl) {
      loadMonthlyRankings();
    }

    if (CURRENT_PATH === '/miricanvas/tag') {
      loadElementResultPage();
    } else if (CURRENT_PATH === '/miricanvas/template') {
      loadTemplateResultPage();
    }
  </script>
</body>
</html>`;
}

export async function requestHandler(req, res) {
  try {
    const protocol = cleanText(req.headers['x-forwarded-proto']) || 'http';
    const host = cleanText(req.headers.host) || 'localhost';
    const requestUrl = new URL(req.url, `${protocol}://${host}`);

    if (req.method === 'GET' && requestUrl.pathname === '/tag') {
      res.writeHead(301, { Location: `/miricanvas/tag${requestUrl.search}` });
      res.end();
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/result') {
      res.writeHead(301, { Location: `/miricanvas/tag${requestUrl.search}` });
      res.end();
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/template') {
      res.writeHead(301, { Location: `/miricanvas/template${requestUrl.search}` });
      res.end();
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(buildRobotsTxt(requestUrl.origin));
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/ads.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(ADS_TXT_CONTENT);
      return;
    }

    if (req.method === 'GET' && await serveFaviconAsset(requestUrl.pathname, res)) {
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/sitemap.xml') {
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
      res.end(buildSitemapXml(requestUrl.origin));
      return;
    }

    if (
      req.method === 'GET' &&
      (
        requestUrl.pathname === '/' ||
        requestUrl.pathname === '/miricanvas' ||
        requestUrl.pathname === '/miricanvas/tag' ||
        requestUrl.pathname === '/miricanvas/template' ||
        requestUrl.pathname === '/canva' ||
        requestUrl.pathname === '/adobe-stock' ||
        requestUrl.pathname === '/about' ||
        requestUrl.pathname === '/privacy' ||
        requestUrl.pathname === '/terms' ||
        requestUrl.pathname === '/contact'
      )
    ) {
      const pathname = requestUrl.pathname;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlPage(pathname, requestUrl.origin));
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/api/collect')) {
      const url = new URL(req.url, 'http://localhost');
      const keyword = cleanText(url.searchParams.get('keyword'));

      if (!keyword) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'keyword is required' }));
        return;
      }

      const result = await collectTopTags(keyword);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
      return;
    }

    if (req.method === 'GET' && req.url === '/api/monthly-rankings') {
      try {
        const result = await getMonthlyRankings();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: error?.message || String(error) }));
      }
      return;
    }

    if (req.method === 'POST' && req.url === '/api/collect') {
      const body = await readJsonBody(req);
      const keywords = parseKeywordsInput(body?.keywordsText);

      if (keywords.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'at least one keyword is required' }));
        return;
      }

      try {
        validateKeywordsLimit(keywords);
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: error.message || String(error) }));
        return;
      }

      const result = await collectTopTagsForKeywords(keywords);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
      return;
    }

    if (req.method === 'POST' && req.url === '/api/template-trend') {
      const body = await readJsonBody(req);

      try {
        const keyword = parseSingleKeyword(body?.keyword);
        const typeConfig = getTemplateTypeConfig(body?.type);
        const result = await collectTemplateTrend(keyword, typeConfig.value);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: error.message || String(error) }));
      }
      return;
    }

    if (req.method === 'GET' && (req.url === '/health' || req.url === '/healthz')) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('ok');
      return;
    }

    if (req.method === 'GET') {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(htmlPage(requestUrl.pathname, requestUrl.origin, { notFound: true }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found');
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: error?.message || String(error) }));
  }
}

export default requestHandler;
