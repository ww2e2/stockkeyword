const CROWDPIC_STATUS = normalizeStatus(process.env.CROWDPIC_STATUS || '개발중');
const CROWDPIC_ENABLED = String(process.env.CROWDPIC_ENABLED || 'true').toLowerCase() !== 'false';
const ADOBE_STOCK_ENABLED = String(process.env.ADOBE_STOCK_ENABLED || 'false').toLowerCase() === 'true';
const CROWDPIC_ORIGIN = String(process.env.CROWDPIC_ORIGIN || 'https://www.crowdpic.net').trim() || 'https://www.crowdpic.net';
const CROWDPIC_API_URL = String(process.env.CROWDPIC_API_URL || '').trim();
const CROWDPIC_API_METHOD = String(process.env.CROWDPIC_API_METHOD || 'GET').toUpperCase();
const CROWDPIC_API_HEADERS_JSON = String(process.env.CROWDPIC_API_HEADERS_JSON || '').trim();
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const TIME_ZONE = String(process.env.TIME_ZONE || 'Asia/Seoul').trim() || 'Asia/Seoul';
const SEARCH_PLATFORM = 'crowdpic';
const MAX_RECOMMENDED_TAGS = 50;
const DEFAULT_SEARCH_PAGE_SIZE = 30;
const CROWDPIC_COOKIE_CACHE = new Map();

const CROWDPIC_CATEGORIES = ['전체', '사진', '그래픽·일러스트', '캘리그래피', '아이콘', '목업'];
const CATEGORY_CODE_BY_LABEL = new Map([
  ['전체', 'all'],
  ['사진', 'photo'],
  ['그래픽·일러스트', 'graphic'],
  ['캘리그래피', 'calli'],
  ['아이콘', 'icon'],
  ['목업', 'mockup'],
]);
const CATEGORY_LABEL_BY_CODE = new Map([...CATEGORY_CODE_BY_LABEL.entries()].map(([label, code]) => [code, label]));

const SEARCH_URL_TEMPLATES = [
  '/photos/category/{category}&q={keyword}&page={page}&sort={sort}',
  '/photos/category/{category}?q={keyword}&page={page}&sort={sort}',
  '/photos/category/{category}&keyword={keyword}&page={page}&sort={sort}',
  '/photos/category/{category}?keyword={keyword}&page={page}&sort={sort}',
  '/photos/category/{category}&search={keyword}&page={page}&sort={sort}',
  '/photos/category/{category}?search={keyword}&page={page}&sort={sort}',
  '/photos/category/{category}&q={keyword}',
  '/photos/category/{category}?q={keyword}',
];

const SEARCH_RESULT_ENDPOINTS = [
  '/controller/search/elasticsearch_get_data.php',
  '/controller/search/search_get_data.php',
];

function cleanText(value) {
  return String(value ?? '').replace(/\uFEFF/g, '').trim();
}

function normalizeStatus(value) {
  const normalized = cleanText(value);
  if (!normalized) {
    return '개발중';
  }
  return /운영/i.test(normalized) ? '운영중' : '개발중';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseJsonObject(rawValue, label) {
  const text = cleanText(rawValue);
  if (!text) {
    return {};
  }
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON object`);
    }
    return parsed;
  } catch (error) {
    throw new Error(`${label} parse failed: ${error.message || String(error)}`);
  }
}

function normalizeCategory(value) {
  const normalized = cleanText(value);
  if (!normalized) {
    return CROWDPIC_CATEGORIES[0];
  }

  const aliases = new Map([
    ['all', '전체'],
    ['전체', '전체'],
    ['photo', '사진'],
    ['photography', '사진'],
    ['사진', '사진'],
    ['graphic', '그래픽·일러스트'],
    ['illustration', '그래픽·일러스트'],
    ['그래픽', '그래픽·일러스트'],
    ['일러스트', '그래픽·일러스트'],
    ['graphic·illustration', '그래픽·일러스트'],
    ['calli', '캘리그래피'],
    ['calligraphy', '캘리그래피'],
    ['캘리그라피', '캘리그래피'],
    ['캘리그래피', '캘리그래피'],
    ['icon', '아이콘'],
    ['mockup', '목업'],
    ['목업', '목업'],
  ]);

  return aliases.get(normalized.toLowerCase()) || (CROWDPIC_CATEGORIES.includes(normalized) ? normalized : CROWDPIC_CATEGORIES[0]);
}

function getCategoryCode(category) {
  return CATEGORY_CODE_BY_LABEL.get(normalizeCategory(category)) || 'photo';
}

function getCategoryLabel(code) {
  return CATEGORY_LABEL_BY_CODE.get(cleanText(code).toLowerCase()) || CROWDPIC_CATEGORIES[0];
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

function countFrequency(values) {
  const counts = new Map();
  for (const value of values) {
    const key = cleanText(value);
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

function sortFrequencyEntries(entries, limit = MAX_RECOMMENDED_TAGS) {
  return [...entries]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'ko'))
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function buildSupabaseHeaders(extraHeaders = {}) {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    ...extraHeaders,
  };
}

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function getCookieHeaderValue(setCookieHeader) {
  const text = cleanText(setCookieHeader);
  if (!text) return '';
  const sessionMatch = text.match(/PHPSESSID=[^;]+/i);
  return sessionMatch ? sessionMatch[0] : '';
}

async function ensureCrowdpicSessionCookie(origin) {
  const normalizedOrigin = new URL(origin).origin;
  if (CROWDPIC_COOKIE_CACHE.has(normalizedOrigin)) {
    return CROWDPIC_COOKIE_CACHE.get(normalizedOrigin);
  }

  const response = await fetch(normalizedOrigin, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    },
  });

  const cookieHeader = getCookieHeaderValue(response.headers.get('set-cookie'));
  CROWDPIC_COOKIE_CACHE.set(normalizedOrigin, cookieHeader);
  return cookieHeader;
}

async function getCrowdpicCookieHeader(origin) {
  return ensureCrowdpicSessionCookie(origin);
}

function buildSearchUrls(origin, keyword, category, page = 1, sort = 'sale') {
  const encodedKeyword = encodeURIComponent(cleanText(keyword));
  const encodedCategory = encodeURIComponent(getCategoryCode(category));
  const encodedSort = encodeURIComponent(cleanText(sort) || 'sale');

  return SEARCH_URL_TEMPLATES.map((template) => {
    const path = template
      .replace('{keyword}', encodedKeyword)
      .replace('{category}', encodedCategory)
      .replace('{page}', String(page))
      .replace('{sort}', encodedSort);
    return new URL(path, origin).toString();
  });
}

function buildCandidateDetailUrlPatterns() {
  return [
    /\/detail\/[^?#]+/i,
    /\/photo\/[^?#]+/i,
    /\/photos\/theme\/[^?#]+/i,
    /\/photos\/[^?#]+/i,
    /\/image\/[^?#]+/i,
    /\/item\/[^?#]+/i,
    /\/contents\/[^?#]+/i,
    /\/stock\/[^?#]+/i,
    /\/works?\/[^?#]+/i,
  ];
}

function extractHiddenInputs(html) {
  const source = cleanText(html);
  if (!source) return {};

  const hiddenInputs = {};
  for (const match of source.matchAll(/<input\b[^>]*type=["']hidden["'][^>]*>/gi)) {
    const tag = match[0];
    const nameMatch = tag.match(/\bname=["']([^"']+)["']/i);
    if (!nameMatch) continue;
    const valueMatch = tag.match(/\bvalue=["']([^"']*)["']/i);
    hiddenInputs[cleanText(nameMatch[1])] = cleanText(valueMatch?.[1] || '');
  }
  return hiddenInputs;
}

function extractSearchStateFromHtml(html) {
  const hiddenInputs = extractHiddenInputs(html);
  const source = cleanText(html);
  const endpointMatch = source.match(/\/controller\/search\/(?:elasticsearch_get_data|search_get_data)\.php/i);
  return {
    endpoint: endpointMatch ? endpointMatch[0] : '',
    hiddenKeyword: hiddenInputs.hidden_keyword || '',
    hiddenCategory: hiddenInputs.hidden_category || '',
    hiddenSearchFlag: hiddenInputs.hidden_search_flag || '',
    sort: hiddenInputs.sort || hiddenInputs.orderby || hiddenInputs.order || 'sale',
    page: hiddenInputs.page || '1',
    section: hiddenInputs.hidden_category || hiddenInputs.section || '',
    searchFlag: hiddenInputs.hidden_search_flag || '',
  };
}

function buildSearchRequestBody({ keyword, category, page, sort, hiddenState, endpoint }) {
  const params = new URLSearchParams();
  const categoryCode = getCategoryCode(category);
  const keywordText = cleanText(keyword);
  const pageText = String(page || 1);
  const sortText = cleanText(sort || hiddenState.sort || 'sale') || 'sale';

  params.set('keyword', keywordText);
  params.set('q', keywordText);
  params.set('search_keyword', keywordText);
  params.set('hidden_keyword', hiddenState.hiddenKeyword || keywordText);
  params.set('category', categoryCode);
  params.set('hidden_category', hiddenState.hiddenCategory || categoryCode);
  params.set('hidden_search_flag', hiddenState.hiddenSearchFlag || 'category');
  params.set('search_flag', hiddenState.hiddenSearchFlag || 'category');
  params.set('section', hiddenState.section || categoryCode);
  params.set('page', pageText);
  params.set('sort', sortText);
  params.set('all_count_state', 'N');
  params.set('track_page', pageText);
  params.set('page_state', pageText);
  params.set('list_type', 'photo');
  params.set('from', 'search');
  params.set('endpoint', endpoint);

  return params.toString();
}

function extractUrlsFromHtml(html, origin) {
  const source = cleanText(html);
  if (!source) return [];

  const hrefMatches = [...source.matchAll(/href=["']([^"']+)["']/gi)].map((match) => match[1]);
  const detailPatterns = buildCandidateDetailUrlPatterns();
  const originUrl = new URL(origin);
  const seen = new Set();
  const urls = [];

  for (const href of hrefMatches) {
    let resolved;
    try {
      resolved = new URL(href, origin);
    } catch {
      continue;
    }

    if (resolved.origin !== originUrl.origin) continue;

    const path = `${resolved.pathname}${resolved.search}`;
    if (/\.(?:png|jpe?g|gif|webp|svg|css|js|ico|woff2?)$/i.test(path)) continue;
    if (/^\/(?:[a-z]{2}\/)?photos\/category\//i.test(path)) continue;
    if (/^\/(?:$|search|ranking|login|logout|signup|join|help|guide|notice|faq|magazine|editor|edit|about|privacy|terms|contact)/i.test(path)) continue;
    if (!detailPatterns.some((pattern) => pattern.test(path))) continue;

    const normalized = resolved.toString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    urls.push(normalized);
  }

  return urls;
}

function extractTextListFromDelimitedValue(value) {
  return String(value ?? '')
    .split(/[|,/\n\r]+/g)
    .map(cleanText)
    .filter(Boolean);
}

function extractKeywordsFromText(text) {
  const source = cleanText(text);
  if (!source) return [];

  const patterns = [
    /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+property=["']og:keywords["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /<meta[^>]+property=["']article:tag["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    /"keywords"\s*:\s*\[(.*?)\]/is,
    /"keywords"\s*:\s*"([^"]+)"/is,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (!match) continue;
    const values = extractTextListFromDelimitedValue(match[1]);
    if (values.length > 0) return [...new Set(values)];
  }

  const collected = [];
  const classPatterns = [
    /class=["'][^"']*(?:tag|keyword)[^"']*["'][^>]*>([^<]+)</gi,
    /<a[^>]+(?:class=["'][^"']*(?:tag|keyword)[^"']*["'][^>]*)?>([^<]{1,80})<\/a>/gi,
    /<span[^>]+(?:class=["'][^"']*(?:tag|keyword)[^"']*["'][^>]*)?>([^<]{1,80})<\/span>/gi,
    /<li[^>]+(?:class=["'][^"']*(?:tag|keyword)[^"']*["'][^>]*)?>([^<]{1,80})<\/li>/gi,
  ];

  for (const pattern of classPatterns) {
    for (const match of source.matchAll(pattern)) {
      const value = cleanText(match[1]);
      if (value) collected.push(value);
    }
  }

  return [...new Set(collected)];
}

function extractTagsFromDetailHtml(html) {
  const source = cleanText(html);
  if (!source) return [];

  const adlibTagMatch = source.match(/adlib_trk_data\.p_tag\s*[:=]\s*["']([^"']+)["']/i);
  const dataTagMatch = source.match(/data-tag=["']([^"']+)["']/i);
  const explicitTags = [
    ...(adlibTagMatch ? extractTextListFromDelimitedValue(adlibTagMatch[1]) : []),
    ...(dataTagMatch ? extractTextListFromDelimitedValue(dataTagMatch[1]) : []),
  ]
    .map((tag) => tag.replace(/^#/, '').replace(/^,/, '').trim())
    .filter(Boolean);

  if (explicitTags.length > 0) {
    return [...new Set(explicitTags)];
  }

  const metaTags = extractKeywordsFromText(source);
  const anchorTags = [...source.matchAll(/<a[^>]+(?:class=["'][^"']*(?:tag|keyword)[^"']*["'][^>]*)?>([^<]{1,80})<\/a>/gi)].map((m) => cleanText(m[1])).filter(Boolean);
  const spanTags = [...source.matchAll(/<span[^>]+(?:class=["'][^"']*(?:tag|keyword)[^"']*["'][^>]*)?>([^<]{1,80})<\/span>/gi)].map((m) => cleanText(m[1])).filter(Boolean);
  const listTags = [...source.matchAll(/<li[^>]+(?:class=["'][^"']*(?:tag|keyword)[^"']*["'][^>]*)?>([^<]{1,80})<\/li>/gi)].map((m) => cleanText(m[1])).filter(Boolean);

  return [...new Set([...metaTags, ...anchorTags, ...spanTags, ...listTags])]
    .map((tag) => tag.replace(/^#/, '').replace(/^,/, '').trim())
    .filter(Boolean);
}

function extractCandidateUrlsFromApiItem(item, origin) {
  const values = [item?.detailUrl, item?.detail_url, item?.url, item?.link, item?.href, item?.pageUrl, item?.page_url, item?.contentUrl, item?.content_url];
  const originUrl = new URL(origin);
  const urls = [];

  for (const rawValue of values) {
    const value = cleanText(rawValue);
    if (!value) continue;
    try {
      const resolved = new URL(value, origin);
      if (resolved.origin === originUrl.origin) urls.push(resolved.toString());
    } catch {
      continue;
    }
  }

  return [...new Set(urls)];
}

function extractTagsFromApiItem(item) {
  const values = [item?.tags, item?.tagList, item?.tag_string, item?.tagString, item?.keywords, item?.keywordList, item?.keyword_string, item?.keywordString];
  const tags = [];
  for (const value of values) {
    const raw = Array.isArray(value) ? value.join('|') : String(value ?? '');
    tags.push(...extractTextListFromDelimitedValue(raw));
  }
  return [...new Set(tags)];
}

async function fetchText(url, init = {}) {
  const response = await fetch(url, init);
  const text = await response.text().catch(() => '');
  if (!response.ok) {
    const error = new Error(`Crowdpic request failed: ${response.status} ${response.statusText} ${text}`.trim());
    error.status = response.status;
    error.statusText = response.statusText;
    error.responseText = text;
    error.requestUrl = url;
    throw error;
  }
  return text;
}

async function fetchJson(url, init = {}) {
  const text = await fetchText(url, init);
  if (!cleanText(text)) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    const parseError = new Error(`Crowdpic response parse failed: ${error.message || String(error)}`);
    parseError.responseText = text;
    parseError.requestUrl = url;
    throw parseError;
  }
}

async function fetchCrowdpicApi(keyword, category, page = 1) {
  if (!CROWDPIC_API_URL) return null;

  const url = new URL(CROWDPIC_API_URL);
  url.searchParams.set('keyword', cleanText(keyword));
  url.searchParams.set('category', getCategoryCode(category));
  url.searchParams.set('page', String(page));
  url.searchParams.set('pageSize', String(DEFAULT_SEARCH_PAGE_SIZE));

  const headers = parseJsonObject(CROWDPIC_API_HEADERS_JSON, 'CROWDPIC_API_HEADERS_JSON');
  const response = await fetchJson(url.toString(), {
    method: CROWDPIC_API_METHOD,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  const list = Array.isArray(response?.data?.list)
    ? response.data.list
    : Array.isArray(response?.data?.items)
      ? response.data.items
      : Array.isArray(response?.list)
        ? response.list
        : Array.isArray(response?.results)
          ? response.results
          : Array.isArray(response?.items)
            ? response.items
            : [];

  if (list.length === 0) return null;
  return { response, list, requestUrl: url.toString() };
}

async function fetchCrowdpicSearchPage(origin, keyword, category, page = 1, sort = 'sale') {
  const urls = buildSearchUrls(origin, keyword, category, page, sort);
  const cookie = await getCrowdpicCookieHeader(origin);
  const baseHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    ...(cookie ? { Cookie: cookie } : {}),
  };
  let lastError = null;

  for (const url of urls) {
    try {
      const text = await fetchText(url, {
        method: 'GET',
        headers: {
          ...baseHeaders,
          Referer: origin,
        },
      });

      const pageDetailUrls = extractUrlsFromHtml(text, origin);
      const hiddenState = extractSearchStateFromHtml(text);
      const endpointCandidates = hiddenState.endpoint ? [hiddenState.endpoint, ...SEARCH_RESULT_ENDPOINTS] : SEARCH_RESULT_ENDPOINTS;
      for (const endpoint of [...new Set(endpointCandidates)]) {
        const endpointUrl = new URL(endpoint, origin).toString();
        const body = buildSearchRequestBody({ keyword, category, page, sort, hiddenState, endpoint });
        try {
          const responseText = await fetchText(endpointUrl, {
            method: 'POST',
            headers: {
              ...baseHeaders,
              Origin: new URL(origin).origin,
              Referer: url,
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'X-Requested-With': 'XMLHttpRequest',
            },
            body,
          });

          let responseHtml = responseText;
          let responseJson = null;
          try {
            responseJson = JSON.parse(responseText);
            if (responseJson && typeof responseJson.result === 'string') {
              responseHtml = responseJson.result;
            }
          } catch {
            responseJson = null;
          }

          const responseDetailUrls = extractUrlsFromHtml(responseHtml, origin);
          if (responseDetailUrls.length > 0) {
            return { url: endpointUrl, text: responseHtml, rawText: responseText, detailUrls: responseDetailUrls, hiddenState, responseJson };
          }
        } catch (error) {
          lastError = error;
        }
      }

      if (cleanText(text)) {
        return { url, text, detailUrls: pageDetailUrls, hiddenState };
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('Crowdpic search page could not be fetched');
}

async function fetchCrowdpicDetailTags(detailUrl) {
  const parsed = new URL(detailUrl);
  const cookie = await getCrowdpicCookieHeader(parsed.origin);
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    ...(cookie ? { Cookie: cookie } : {}),
    Referer: `${parsed.origin}/`,
  };

  const html = await fetchText(detailUrl, { method: 'GET', headers });
  return { detailUrl, tags: extractTagsFromDetailHtml(html), html };
}

async function collectTagsFromApi(keyword, category, origin) {
  const apiResult = await fetchCrowdpicApi(keyword, category, 1);
  if (!apiResult) return null;

  const tagPool = [];
  const detailUrls = [];
  for (const item of apiResult.list.slice(0, 30)) {
    tagPool.push(...extractTagsFromApiItem(item));
    detailUrls.push(...extractCandidateUrlsFromApiItem(item, origin));
  }

  for (const detailUrl of [...new Set(detailUrls)].slice(0, 30)) {
    try {
      const result = await fetchCrowdpicDetailTags(detailUrl);
      tagPool.push(...result.tags);
    } catch {
      continue;
    }
  }

  const counts = countFrequency(tagPool);
  const topTags = sortFrequencyEntries(counts.entries(), MAX_RECOMMENDED_TAGS).map((item) => item.label);
  if (topTags.length === 0) return null;

  return {
    keyword: cleanText(keyword),
    category: normalizeCategory(category),
    searchUrl: apiResult.requestUrl,
    detailCount: apiResult.list.length,
    topTags,
    metaTagString: topTags.join(', '),
    collectedAt: getCollectedDate(),
    source: 'api',
  };
}

async function collectTagsFromHtml(keyword, category, origin) {
  const searchResults = [];
  const seenDetailUrls = new Set();
  const detailUrls = [];

  for (let page = 1; page <= 3; page += 1) {
    const searchResult = await fetchCrowdpicSearchPage(origin, keyword, category, page, 'sale');
    searchResults.push(searchResult);

    for (const detailUrl of searchResult.detailUrls || []) {
      if (seenDetailUrls.has(detailUrl)) continue;
      seenDetailUrls.add(detailUrl);
      detailUrls.push(detailUrl);
      if (detailUrls.length >= 30) break;
    }

    if (detailUrls.length >= 30) break;
  }

  const tagPool = [];
  for (const detailUrl of detailUrls.slice(0, 30)) {
    try {
      const result = await fetchCrowdpicDetailTags(detailUrl);
      tagPool.push(...result.tags);
      if (tagPool.length >= 300) break;
    } catch {
      continue;
    }
  }

  if (tagPool.length === 0 && searchResults.length > 0) {
    tagPool.push(...extractTagsFromDetailHtml(searchResults[0].text));
  }

  const counts = countFrequency(tagPool);
  const topTags = sortFrequencyEntries(counts.entries(), MAX_RECOMMENDED_TAGS).map((item) => item.label);
  if (topTags.length === 0) {
    throw new Error('Crowdpic 검색 결과에서 추천 키워드를 추출하지 못했습니다.');
  }

  return {
    keyword: cleanText(keyword),
    category: normalizeCategory(category),
    searchUrl: searchResults[0]?.url || '',
    detailCount: detailUrls.length,
    topTags,
    metaTagString: topTags.join(', '),
    collectedAt: getCollectedDate(),
    source: 'html',
  };
}

async function logCrowdpicSearchEvent(event) {
  if (!isSupabaseConfigured()) return;

  const payload = {
    source_platform: SEARCH_PLATFORM,
    search_type: 'keyword',
    keyword: cleanText(event.keyword),
    template_type_value: cleanText(event.category),
    template_type_label: cleanText(event.category),
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
    throw new Error(`Crowdpic log insert failed: ${response.status} ${response.statusText} ${text}`.trim());
  }
}

async function collectCrowdpicTags(keyword, category, origin = CROWDPIC_ORIGIN) {
  const cleanKeyword = cleanText(keyword);
  const cleanCategory = normalizeCategory(category);
  if (!cleanKeyword) {
    throw new Error('키워드를 입력해 주세요.');
  }

  try {
    const apiResult = await collectTagsFromApi(cleanKeyword, cleanCategory, origin);
    if (apiResult) {
      await logCrowdpicSearchEvent({ keyword: cleanKeyword, category: cleanCategory });
      return apiResult;
    }
  } catch {
    // API가 없거나 브라우저 요청과 다르면 HTML 수집으로 내려간다.
  }

  const htmlResult = await collectTagsFromHtml(cleanKeyword, cleanCategory, origin);
  await logCrowdpicSearchEvent({ keyword: cleanKeyword, category: cleanCategory });
  return htmlResult;
}

async function getMonthlyRankings() {
  if (!isSupabaseConfigured()) {
    return {
      searchMonth: getCollectedMonth(),
      keywordSearchTop20: [],
      categoryTop20: [],
    };
  }

  const searchMonth = getCollectedMonth();
  const params = new URLSearchParams();
  params.set('select', 'search_type,keyword,template_type_value,template_type_label,search_month');
  params.set('source_platform', 'eq.crowdpic');
  params.set('search_month', `eq.${searchMonth}`);
  params.set('order', 'search_month.desc');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/search_logs?${params.toString()}`, {
    headers: buildSupabaseHeaders(),
  });

  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(`Crowdpic monthly rankings request failed: ${response.status} ${response.statusText} ${text}`.trim());
  }

  const logs = cleanText(text) ? JSON.parse(text) : [];
  const keywordCounts = new Map();
  const categoryCounts = new Map();

  for (const log of Array.isArray(logs) ? logs : []) {
    const keyword = cleanText(log?.keyword);
    const category = cleanText(log?.template_type_label || log?.template_type_value);

    if (keyword) keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    if (category) categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  }

  return {
    searchMonth,
    keywordSearchTop20: sortFrequencyEntries(keywordCounts.entries(), 20).map((item, index) => ({
      rank: index + 1,
      keyword: item.label,
      count: item.count,
    })),
    categoryTop20: sortFrequencyEntries(categoryCounts.entries(), 20).map((item, index) => ({
      rank: index + 1,
      label: item.label,
      count: item.count,
    })),
  };
}

export {
  ADOBE_STOCK_ENABLED,
  CROWDPIC_API_METHOD,
  CROWDPIC_API_URL,
  CROWDPIC_CATEGORIES,
  CROWDPIC_ENABLED,
  CROWDPIC_ORIGIN,
  CROWDPIC_STATUS,
  MAX_RECOMMENDED_TAGS,
  SEARCH_PLATFORM,
  buildSearchUrls,
  buildSupabaseHeaders,
  cleanText,
  collectCrowdpicTags,
  countFrequency,
  escapeHtml,
  extractCandidateUrlsFromApiItem,
  extractTagsFromApiItem,
  extractTagsFromDetailHtml,
  extractUrlsFromHtml,
  fetchCrowdpicApi,
  fetchCrowdpicDetailTags,
  fetchCrowdpicSearchPage,
  fetchJson,
  fetchText,
  getCategoryCode,
  getCollectedDate,
  getCollectedMonth,
  getMonthlyRankings,
  isSupabaseConfigured,
  logCrowdpicSearchEvent,
  normalizeCategory,
  normalizeStatus,
  parseJsonObject,
  sortFrequencyEntries,
};




