import http from 'http';
import dotenv from 'dotenv';
import { TEMPLATE_TYPE_MAP } from './templateTypeMap.js';
import { handleCrowdpicRequest } from './crowdpicPages.js';
import {
  ADS_TXT_CONTENT,
  DEFAULT_TEMPLATE_TIER,
  HOME_FAQ_ITEMS,
  MIRICANVAS_CATEGORY_LABEL_MAP,
  MIRICANVAS_CATEGORY_OPTIONS,
  MIRICANVAS_CATEGORY_TYPE_MAP,
  MIRICANVAS_FAQ_ITEMS,
  SEARCH_PLATFORM,
  STATIC_PAGE_CONTENT,
  TEMPLATE_FILTER_TABS,
  TEMPLATE_PURPOSE_BY_GROUP,
  TEMPLATE_RESULT_TABS,
} from './config/siteConfig.js';
import {
  buildRobotsTxt,
  buildSitemapXml,
  serveFaviconAsset,
} from './routes/static.js';
import { createMiricanvasApiRoutes } from './routes/miricanvas.js';
import { createRankingsService } from './services/rankings.js';
import {
  fetchMonthlySearchLogs,
  safeLogSearchEvent,
} from './services/supabase.js';
import { createMiricanvasService } from './services/miricanvas.js';
import { createHtmlView } from './views/html.js';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const DEBUG = String(process.env.DEBUG || 'false').toLowerCase() === 'true';
const MIRICANVAS_API_URL = process.env.MIRICANVAS_API_URL || '';
const MIRICANVAS_API_METHOD = (process.env.MIRICANVAS_API_METHOD || 'GET').toUpperCase();
const MIRICANVAS_API_HEADERS_JSON = process.env.MIRICANVAS_API_HEADERS_JSON || '';
const MIRICANVAS_TEAM_IDX = process.env.MIRICANVAS_TEAM_IDX || '';
const TIME_ZONE = process.env.TIME_ZONE || 'Asia/Seoul';
const MAX_KEYWORDS_PER_REQUEST = 5;
const TEMPLATE_API_URL = 'https://api.miricanvas.com/template/api/p/template-pages/search';
const TEMPLATE_TYPE_FAILURE_MESSAGE = '대상 템플릿 종류 분석 결과를 불러오지 못했습니다.';

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
    throw new Error('키워드 1개만 입력할 수 있습니다.');
  }

  return keywords[0];
}

function getTemplateTypeConfig(typeValue) {
  const value = cleanText(typeValue);
  const config = TEMPLATE_TYPE_INDEX.get(value) || TEMPLATE_TYPE_API_INDEX.get(value);

  if (!config) {
    throw new Error('?좏슚???쒗뵆由?醫낅쪟瑜??좏깮?섏꽭??');
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

function normalizeMiricanvasCategory(category) {
  const normalized = cleanText(category);
  return Object.prototype.hasOwnProperty.call(MIRICANVAS_CATEGORY_TYPE_MAP, normalized)
    ? normalized
    : MIRICANVAS_CATEGORY_OPTIONS[0].value;
}

const {
  fetchMiricanvas,
  fetchTemplateSearch,
  collectTopTags,
  collectTopTagsForKeywords,
  collectTemplateTrend,
} = createMiricanvasService({
  MIRICANVAS_API_HEADERS_JSON,
  MIRICANVAS_API_METHOD,
  MIRICANVAS_API_URL,
  MIRICANVAS_CATEGORY_LABEL_MAP,
  MIRICANVAS_CATEGORY_OPTIONS,
  MIRICANVAS_CATEGORY_TYPE_MAP,
  MIRICANVAS_TEAM_IDX,
  SEARCH_PLATFORM,
  TEMPLATE_API_URL,
  TEMPLATE_TYPE_FAILURE_MESSAGE,
  cleanText,
  debugError,
  debugLog,
  debugWarn,
  getCollectedDate,
  getCollectedMonth,
  getTemplatePurpose,
  getTemplateTier,
  getTemplateTypeConfig,
  normalizeMiricanvasCategory,
  normalizeTemplateApiValues,
  parseJsonObject,
  safeLogSearchEvent,
});

const { getMonthlyRankings } = createRankingsService({
  cleanText,
  fetchMonthlySearchLogs,
  getCollectedMonth,
  searchPlatform: SEARCH_PLATFORM,
});

async function readJsonBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const bodyText = Buffer.concat(chunks).toString('utf8');
  if (!bodyText.trim()) return {};

  return JSON.parse(bodyText);
}

const { handleMiricanvasApiRequest } = createMiricanvasApiRoutes({
  cleanText,
  collectTemplateTrend,
  collectTopTags,
  getMonthlyRankings,
  getTemplateTypeConfig,
  normalizeMiricanvasCategory,
  parseSingleKeyword,
  readJsonBody,
});

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
    key: 'crowdpic',
    path: '/crowdpic',
    label: '크라우드픽',
    description: '크라우드픽 전용 키워드 분석과 이번달 인기 키워드를 제공하는 독립 모듈입니다.',
    status: '개발중',
    available: false,
    buttonLabel: '분석 시작',
  },
  {
    key: 'canva',
    path: '/canva',
    label: '캔바',
    description: '향후 키워드 분석과 템플릿 분석, 카테고리 분석을 지원할 예정인 준비중 플랫폼입니다.',
    status: '준비중',
    available: false,
    buttonLabel: '준비중 안내 보기',
  },
  {
    key: 'adobe-stock',
    path: '/adobe-stock',
    label: '어도비 스톡',
    description: '향후 콘텐츠 검색과 콘텐츠 수집 기능을 지원할 예정인 준비중 플랫폼입니다.',
    status: '준비중',
    available: false,
    buttonLabel: '준비중 안내 보기',
  },
];
const {
  buildBreadcrumbItems,
  buildPageSeo,
  buildStructuredData,
  htmlPage,
} = createHtmlView({
  DEBUG,
  HOME_FAQ_ITEMS,
  MAX_KEYWORDS_PER_REQUEST,
  MIRICANVAS_CATEGORY_OPTIONS,
  MIRICANVAS_FAQ_ITEMS,
  STATIC_PAGE_CONTENT,
  TEMPLATE_FILTER_TABS,
  TEMPLATE_RESULT_TABS,
  TEMPLATE_TYPE_MAP,
  escapeHtml,
});

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

    if (await handleCrowdpicRequest(req, res, requestUrl, htmlPage, readJsonBody)) {
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/sitemap.xml') {
      res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
      res.end(buildSitemapXml(requestUrl.origin, { escapeHtml, getCollectedDate }));
      return;
    }

    if (
      req.method === 'GET' &&
      (
        requestUrl.pathname === '/' ||
        requestUrl.pathname === '/miricanvas' ||
        requestUrl.pathname === '/miricanvas/tag' ||
        requestUrl.pathname === '/miricanvas/template' ||
        requestUrl.pathname === '/miricanvas/rankings' ||
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
    if (await handleMiricanvasApiRequest(req, res)) {
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















