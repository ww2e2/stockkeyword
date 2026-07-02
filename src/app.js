import http from 'http';
import { readFile } from 'fs/promises';
import dotenv from 'dotenv';
import { TEMPLATE_TYPE_MAP } from './templateTypeMap.js';
import { handleCrowdpicRequest } from './crowdpicPages.js';
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

const MIRICANVAS_CATEGORY_OPTIONS = [
  { value: 'element', label: '요소' },
  { value: 'photo', label: '사진' },
  { value: 'background', label: '배경' },
];

const MIRICANVAS_CATEGORY_TYPE_MAP = {
  element: [
    'ILLUST',
    'BITMAP',
    'FIGURE',
    'LINE',
    'ANI',
    'ELEMENT_COLLECTION',
    'DESIGNRESOURCE_COLLECTION',
    'FRAME',
    'PRESET_FRAME',
    'MOCKUP_GRID',
    'MOCKUP_TEXT',
    'CHART',
    'EXTERNAL_ILLUST',
    'EXTERNAL_BITMAP',
    'EXTERNAL_ANI',
  ],
  photo: ['PICTURE'],
  background: ['BACKGROUND_PICTURE'],
};

const MIRICANVAS_CATEGORY_LABEL_MAP = {
  element: '요소',
  photo: '사진',
  background: '배경',
};

const TEMPLATE_FILTER_TABS = [
  { key: 'all', label: '전체' },
  { key: 'photo', label: '사진' },
  { key: 'video', label: '동영상' },
  { key: 'print', label: '인쇄' },
];

const TEMPLATE_RESULT_TABS = [
  { key: 'titleKeywords', label: '제목 키워드' },
  { key: 'pageCount', label: '페이지 수' },
  { key: 'topTitles', label: '상위 제목' },
];

const TEMPLATE_PURPOSE_BY_GROUP = {
  photo: 'WEB',
  video: 'VIDEO',
  print: 'PRINT',
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
  const urls = ['/', '/miricanvas', '/miricanvas/tag', '/miricanvas/template', '/miricanvas/rankings', '/crowdpic', '/crowdpic/tag', '/crowdpic/rankings', '/about', '/privacy', '/terms', '/contact'];
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
  const contentTypeCounts = new Map();

  for (const log of logs) {
    const searchType = cleanText(log?.search_type);
    const keyword = cleanText(log?.keyword);
    const templateTypeLabel = cleanText(log?.template_type_label);
    const templateTypeValue = cleanText(log?.template_type_value);
    const contentTypeLabel = cleanText(log?.template_type_label || log?.template_type_value);

    if (searchType === 'keyword' && keyword) {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);

      if (contentTypeLabel && contentTypeLabel.toUpperCase() !== 'EMPTY') {
        contentTypeCounts.set(contentTypeLabel, (contentTypeCounts.get(contentTypeLabel) || 0) + 1);
      }
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
    contentTypeTop20: buildTopRankings(contentTypeCounts, (label, count, index) => ({
      rank: index + 1,
      label,
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
  const logs = await fetchMonthlySearchLogs(searchMonth, {
    searchPlatform: SEARCH_PLATFORM,
  });
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
    answer: '이 서비스는 스톡 작가와 디지털 크리에이터를 위한 분석 도구입니다. 스톡 콘텐츠와 템플릿 데이터를에서 키워드 분석과 템플릿 분석을 빠르게 확인할 수 있도록 구성되어 있습니다.',
  },
  {
    question: '어떤 플랫폼을 지원하나요?',
    answer: '현재는 미리캔버스와 크라우드픽 기능을 제공하고 있습니다. 플랫폼별 특성에 맞는 분석 기능을 같은 구조로 사용할 수 있도록 발전시키고 있습니다.',
  },
  {
    question: '키워드 분석은 어떤 기능인가요?',
    answer: '키워드 분석은 특정 키워드와 관련된 상위 콘텐츠를 분석해 가장 많이 사용되는 키워드를 추천하는 기능입니다. 업로드 전 키워드를 정리하거나 상위 노출용 키워드를 빠르게 확인할 때 유용합니다.',
  },
  {
    question: '이번달 인기 검색 순위는 무엇인가요?',
    answer: '이번달 인기 검색 순위는 최근 검색 데이터를 바탕으로 많이 찾는 키워드와 카테고리 흐름을 정리해 보여주는 기능입니다. 콘텐츠 제작 방향이나 업로드 주제를 정할 때 참고할 수 있습니다.',
  },
  {
    question: '스톡 작가에게 어떤 도움이 되나요?',
    answer: '스톡 작가에게 반복적으로 필요한 키워드 조사와 제목 패턴 확인 시간을 줄여줍니다. 이를 통해 콘텐츠 기획과 제작 효율을 높이고, 업로드 전략을 더 빠르게 세울 수 있습니다.',
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
    answer: '인기 템플릿의 제목 키워드와 상위 노출 패턴을 분석하는 도구입니다. 자주 노출되는 제목 패턴과 페이지 수를 참고해 콘텐츠 기획이나 템플릿 제작 방향을 잡는 데 도움이 됩니다.',
  },
  {
    question: '스톡 작가에게 어떤 도움이 되나요?',
    answer: '반복적인 조사 시간을 줄이고, 실제로 많이 보이는 키워드와 제목 패턴을 데이터 기반으로 빠르게 확인할 수 있습니다. 이를 통해 업로드 준비와 제작 방향 설정이 더 쉬워집니다.',
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
    title: '서비스 소개 | 스톡 크리에이터 분석 플랫폼',
    description: '스톡 크리에이터를 위한 분석 도구 서비스 소개 페이지입니다.',
    content: `
      <section class="page-card stack">
        <h2>서비스 소개</h2>
        <p>스톡 크리에이터를 위한 분석 도구 서비스입니다.</p>
      </section>
    `,
  },
  '/privacy': {
    title: '개인정보처리방침 | 스톡 크리에이터 분석 플랫폼',
    description: '서비스의 개인정보처리방침을 안내합니다.',
    content: `
      <section class="page-card stack">
        <h2>개인정보처리방침</h2>
        <p>서비스의 개인정보처리방침을 안내합니다.</p>
      </section>
    `,
  },
  '/terms': {
    title: '이용약관 | 스톡 크리에이터 분석 플랫폼',
    description: '서비스의 이용약관을 안내합니다.',
    content: `
      <section class="page-card stack">
        <h2>이용약관</h2>
        <p>서비스의 이용약관을 안내합니다.</p>
      </section>
    `,
  },
  '/contact': {
    title: '문의 | 스톡 크리에이터 분석 플랫폼',
    description: '서비스 문의 페이지입니다.',
    content: `
      <section class="page-card stack">
        <h2>문의</h2>
        <p>서비스 문의 페이지입니다.</p>
      </section>
    `,
  },
};
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

    if (req.method === 'GET' && req.url?.startsWith('/api/collect')) {
      const url = new URL(req.url, 'http://localhost');
      const keyword = cleanText(url.searchParams.get('keyword'));
      const category = normalizeMiricanvasCategory(url.searchParams.get('category'));

      if (!keyword) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'keyword is required' }));
        return;
      }

      const result = await collectTopTags(keyword, category);
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

      try {
        const keyword = parseSingleKeyword(body?.keyword);
        const category = normalizeMiricanvasCategory(body?.category);
        const result = await collectTopTags(keyword, category);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          keywordCount: 1,
          results: [result],
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: error.message || String(error) }));
      }
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















