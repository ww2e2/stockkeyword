const ADOBE_LANGUAGE_OPTIONS = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'ja', label: '日本語' },
  { value: 'pl', label: 'Polski' },
];

const ADOBE_REGION_BY_LANGUAGE = {
  ko: 'kr',
  kr: 'kr',
  en: '',
  fr: 'fr',
  de: 'de',
  es: 'es',
  it: 'it',
  pt: 'pt',
  ja: 'jp',
  jp: 'jp',
  pl: 'pl',
};

const ADOBE_SEARCH_TYPES = [
  { value: 'all', label: '전체' },
  { value: 'image', label: '콘텐츠' },
  { value: 'video', label: '비디오' },
  { value: 'template', label: '템플릿' },
  { value: '3d', label: '3D' },
];

const ADOBE_SEARCH_TYPE_LABELS = Object.fromEntries(ADOBE_SEARCH_TYPES.map((item) => [item.value, item.label]));

const ADOBE_COLLECTION_OPTIONS = [
  '자연',
  '동물',
  '그림',
  '로고',
  'PNG',
  '기술',
  '배경',
  '건축',
  '교육',
  '모형',
  '실루엣',
  '텍스처',
  '동영상 효과',
  '비즈니스',
  '가족',
  '인물',
  '스포츠',
  '여행',
  '동영상 템플릿',
  '클립아트',
  '아이콘',
  '식물 및 꽃',
  '여름',
  '바탕화면',
];

const ADOBE_COLLECTION_QUERY_MAP = {
  '자연': 'nature',
  '동물': 'animal',
  '그림': 'illustration',
  '로고': 'logo',
  'PNG': 'png',
  '기술': 'technology',
  '배경': 'background',
  '건축': 'architecture',
  '교육': 'education',
  '모형': 'mockup',
  '실루엣': 'silhouette',
  '텍스처': 'texture',
  '동영상 효과': 'motion graphics',
  '비즈니스': 'business',
  '가족': 'family',
  '인물': 'people',
  '스포츠': 'sports',
  '여행': 'travel',
  '동영상 템플릿': 'video template',
  '클립아트': 'clipart',
  '아이콘': 'icon',
  '식물 및 꽃': 'plants flowers',
  '여름': 'summer',
  '바탕화면': 'wallpaper',
};

const ADOBE_MONTHLY_TOP_TABS = [
  { key: 'keywordSearchTop20', label: '검색 키워드 TOP20' },
  { key: 'searchTypeTop20', label: '검색 타입 TOP20' },
  { key: 'collectionKeywordTop20', label: '컬렉션 키워드 TOP20' },
  { key: 'collectionTop20', label: '컬렉션 TOP20' },
];

function cleanText(value) {
  return String(value ?? '').replace(/\uFEFF/g, '').trim();
}

function normalizeAdobeLanguage(value) {
  const normalized = cleanText(value).toLowerCase();
  if (normalized === 'kr') return 'ko';
  if (normalized === 'jp') return 'ja';
  return ADOBE_REGION_BY_LANGUAGE[normalized] !== undefined ? normalized : 'en';
}

function getAdobeRegion(language) {
  return ADOBE_REGION_BY_LANGUAGE[normalizeAdobeLanguage(language)] ?? '';
}

function getAdobeSearchTypeLabel(searchType) {
  return ADOBE_SEARCH_TYPE_LABELS[cleanText(searchType).toLowerCase()] || '전체';
}

function normalizeAdobeSearchType(value) {
  const normalized = cleanText(value).toLowerCase();
  return ADOBE_SEARCH_TYPES.some((item) => item.value === normalized) ? normalized : 'all';
}

function normalizeAdobeCollection(value) {
  const normalized = cleanText(value);
  return ADOBE_COLLECTION_OPTIONS.includes(normalized) ? normalized : ADOBE_COLLECTION_OPTIONS[0];
}

function getAdobeCollectionQuery(value) {
  const normalized = normalizeAdobeCollection(value);
  return ADOBE_COLLECTION_QUERY_MAP[normalized] || normalized;
}

function buildAdobeSearchUrl({ keyword, language, searchType, collection }) {
  const region = getAdobeRegion(language);
  const baseUrl = region ? `https://stock.adobe.com/${region}/Ajax/Search` : 'https://stock.adobe.com/Ajax/Search';
  const params = new URLSearchParams();
  const parts = [cleanText(keyword)];
  const collectionQuery = cleanText(collection) ? getAdobeCollectionQuery(collection) : '';

  if (collectionQuery) {
    parts.push(collectionQuery);
  }

  params.set('k', parts.filter(Boolean).join(' ').trim());
  params.set('limit', '30');
  params.set('get_facets', '0');

  const normalizedSearchType = normalizeAdobeSearchType(searchType);
  if (normalizedSearchType !== 'all') {
    params.set(`filters[content_type:${normalizedSearchType}]`, '1');
  }

  return `${baseUrl}?${params.toString()}`;
}

function buildSupabaseHeaders(serviceRoleKey, extraHeaders = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...extraHeaders,
  };
}

function getCollectedMonth(timeZone = 'Asia/Seoul') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
}

function getCollectedDate(timeZone = 'Asia/Seoul') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function parseAdobeResultList(payload) {
  const candidates = [
    payload?.results,
    payload?.data?.results,
    payload?.data?.items,
    payload?.items,
    payload?.result?.items,
    payload?.assets,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function normalizeKeywordList(rawValue) {
  const values = Array.isArray(rawValue)
    ? rawValue
    : String(rawValue ?? '')
        .split(/[|,\n;]/g)
        .map(cleanText)
        .filter(Boolean);

  return values
    .map(cleanText)
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);
}

function extractKeywordsFromText(text) {
  const source = cleanText(text);
  if (!source) {
    return [];
  }

  const patterns = [
    /"keywords"\s*:\s*\[(.*?)\]/s,
    /"keywords"\s*:\s*"([^"]+)"/s,
    /name=["']keywords["']\s+content=["']([^"']+)["']/i,
    /keywords?[:=]\s*([^<\n\r]+)/i,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (!match) continue;

    const raw = match[1] || '';
    const extracted = String(raw)
      .replace(/^\[|\]$/g, '')
      .replace(/["']/g, '')
      .split(/[|,]/g)
      .map(cleanText)
      .filter(Boolean);

    if (extracted.length > 0) {
      return extracted.filter((value, index, array) => array.indexOf(value) === index);
    }
  }

  return [];
}

function getAdobeItemTitle(item) {
  return cleanText(item?.title || item?.name || item?.content_name || item?.display_name || item?.keyword);
}

function getAdobeItemContentUrl(item) {
  return cleanText(item?.content_url || item?.contentUrl || item?.url || item?.href || item?.detail_url);
}

async function fetchAdobeItemKeywords(item, fallbackFetch = fetch) {
  const existing = normalizeKeywordList(item?.keywords || item?.keywordList || item?.keyword_list);
  if (existing.length > 0) {
    return existing;
  }

  const contentUrl = getAdobeItemContentUrl(item);
  if (!contentUrl) {
    return [];
  }

  try {
    const response = await fallbackFetch(contentUrl, {
      headers: {
        Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
      },
    });
    const text = await response.text();
    const fromText = extractKeywordsFromText(text);
    if (fromText.length > 0) {
      return fromText;
    }

    try {
      const parsed = JSON.parse(text);
      const nested = normalizeKeywordList(parsed?.keywords || parsed?.keywordList || parsed?.data?.keywords);
      if (nested.length > 0) {
        return nested;
      }
    } catch {
      // Non-JSON detail payload is expected for some Adobe pages.
    }
  } catch {
    return [];
  }

  return [];
}

function countFrequency(items) {
  const counts = new Map();
  for (const item of items) {
    const value = cleanText(item);
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return counts;
}

function buildTopRankings(entries, buildItem, limit = 20) {
  return [...entries.entries()]
    .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'ko'))
    .slice(0, limit)
    .map(([value, count], index) => buildItem(value, count, index));
}

function aggregateAdobeMonthlyLogs(logs, { timeZone = 'Asia/Seoul', language = '' } = {}) {
  const normalizedLanguage = cleanText(language).toLowerCase();
  const filteredLogs = normalizedLanguage
    ? logs.filter((log) => cleanText(log?.language).toLowerCase() === normalizedLanguage)
    : logs;

  const keywordSearchCounts = new Map();
  const searchTypeCounts = new Map();
  const collectionKeywordCounts = new Map();
  const collectionCounts = new Map();

  for (const log of filteredLogs) {
    const logPlatform = cleanText(log?.platform || log?.source_platform).toLowerCase();
    if (logPlatform && logPlatform !== 'adobe') {
      continue;
    }

    const searchType = cleanText(log?.search_type || log?.searchType);
    const keyword = cleanText(log?.keyword);
    const collection = cleanText(log?.collection || log?.template_type_label || log?.template_type_value);

    if (keyword) {
      if (collection) {
        collectionKeywordCounts.set(keyword, (collectionKeywordCounts.get(keyword) || 0) + 1);
      } else {
        keywordSearchCounts.set(keyword, (keywordSearchCounts.get(keyword) || 0) + 1);
      }
    }

    if (searchType) {
      searchTypeCounts.set(searchType, (searchTypeCounts.get(searchType) || 0) + 1);
    }

    if (collection) {
      collectionCounts.set(collection, (collectionCounts.get(collection) || 0) + 1);
    }
  }

  return {
    searchMonth: getCollectedMonth(timeZone),
    keywordSearchTop20: buildTopRankings(keywordSearchCounts, (keyword, count, index) => ({
      rank: index + 1,
      keyword,
      count,
    })),
    searchTypeTop20: buildTopRankings(searchTypeCounts, (value, count, index) => ({
      rank: index + 1,
      label: getAdobeSearchTypeLabel(value),
      value,
      count,
    })),
    collectionKeywordTop20: buildTopRankings(collectionKeywordCounts, (keyword, count, index) => ({
      rank: index + 1,
      keyword,
      count,
    })),
    collectionTop20: buildTopRankings(collectionCounts, (collection, count, index) => ({
      rank: index + 1,
      label: collection,
      value: collection,
      count,
    })),
  };
}

async function fetchAdobeSearchResults({ keyword, language, searchType, collection, fallbackFetch = fetch }) {
  const url = buildAdobeSearchUrl({ keyword, language, searchType, collection });
  const response = await fallbackFetch(url, {
    headers: {
      Accept: 'application/json,text/plain,*/*',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Adobe Stock search request failed: ${response.status} ${response.statusText} ${text}`.trim());
  }

  try {
    const parsed = JSON.parse(text);
    return { raw: parsed, text };
  } catch {
    return { raw: text, text };
  }
}

async function fetchAdobeSearchTitles({
  keyword,
  language,
  searchType,
  collection = '',
  fallbackFetch = fetch,
}) {
  const normalizedKeyword = cleanText(keyword);
  const normalizedLanguage = normalizeAdobeLanguage(language);
  const normalizedSearchType = normalizeAdobeSearchType(searchType);
  const normalizedCollection = cleanText(collection);

  if (!normalizedKeyword) {
    return {
      keyword: '',
      language: normalizedLanguage,
      searchType: normalizedSearchType,
      collection: normalizedCollection,
      titleList: [],
      keywordList: [],
      errorMessage: '',
      requestUrl: buildAdobeSearchUrl({
        keyword: '',
        language: normalizedLanguage,
        searchType: normalizedSearchType,
        collection: normalizedCollection,
      }),
    };
  }

  try {
    const { raw } = await fetchAdobeSearchResults({
      keyword: normalizedKeyword,
      language: normalizedLanguage,
      searchType: normalizedSearchType,
      collection: normalizedCollection,
      fallbackFetch,
    });

    const topResults = parseAdobeResultList(raw).slice(0, 30);
    const titleList = [];
    const allKeywords = [];

    for (const item of topResults) {
      const title = getAdobeItemTitle(item);
      if (title) {
        titleList.push(title);
      }

      const keywords = await fetchAdobeItemKeywords(item, fallbackFetch);
      if (keywords.length > 0) {
        allKeywords.push(...keywords);
      }
    }

    const keywordList = [...countFrequency(allKeywords).entries()]
      .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'ko'))
      .slice(0, 60)
      .map(([value]) => value);

    return {
      keyword: normalizedKeyword,
      language: normalizedLanguage,
      searchType: normalizedSearchType,
      collection: normalizedCollection,
      titleList,
      keywordList,
      errorMessage: '',
      requestUrl: buildAdobeSearchUrl({
        keyword: normalizedKeyword,
        language: normalizedLanguage,
        searchType: normalizedSearchType,
        collection: normalizedCollection,
      }),
    };
  } catch (error) {
    return {
      keyword: normalizedKeyword,
      language: normalizedLanguage,
      searchType: normalizedSearchType,
      collection: normalizedCollection,
      titleList: [],
      keywordList: [],
      errorMessage: error?.message || String(error),
      requestUrl: buildAdobeSearchUrl({
        keyword: normalizedKeyword,
        language: normalizedLanguage,
        searchType: normalizedSearchType,
        collection: normalizedCollection,
      }),
    };
  }
}

async function safeLogAdobeSearchEvent({ supabaseUrl, serviceRoleKey, timeZone = 'Asia/Seoul', ...event }) {
  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  const payload = {
    platform: 'adobe',
    source_platform: 'adobe',
    language: normalizeAdobeLanguage(event?.language),
    keyword: cleanText(event?.keyword),
    search_type: normalizeAdobeSearchType(event?.searchType),
    collection: normalizeAdobeCollection(event?.collection),
    search_month: getCollectedMonth(timeZone),
  };

  const response = await fetch(`${supabaseUrl}/rest/v1/search_logs`, {
    method: 'POST',
    headers: buildSupabaseHeaders(serviceRoleKey, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify([payload]),
  });

  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(`Supabase Adobe log insert failed: ${response.status} ${response.statusText} ${text}`.trim());
  }
}

async function fetchAdobeMonthlyLogs({ supabaseUrl, serviceRoleKey, timeZone = 'Asia/Seoul' }) {
  if (!supabaseUrl || !serviceRoleKey) {
    return [];
  }

  const params = new URLSearchParams();
  params.set('select', 'platform,source_platform,language,keyword,search_type,collection,template_type_value,template_type_label,search_month,created_at');
  params.set('or', '(platform.eq.adobe,source_platform.eq.adobe)');
  params.set('order', 'created_at.desc');
  params.set('limit', '5000');

  const response = await fetch(`${supabaseUrl}/rest/v1/search_logs?${params.toString()}`, {
    headers: buildSupabaseHeaders(serviceRoleKey),
  });

  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(`Supabase Adobe monthly logs fetch failed: ${response.status} ${response.statusText} ${text}`.trim());
  }

  if (!text.trim()) {
    return [];
  }

  return JSON.parse(text);
}

async function collectAdobeStockAnalysis({
  keyword,
  language,
  searchType,
  collection,
  supabaseUrl = '',
  serviceRoleKey = '',
  timeZone = 'Asia/Seoul',
  fallbackFetch = fetch,
}) {
  const normalizedLanguage = normalizeAdobeLanguage(language);
  const normalizedSearchType = normalizeAdobeSearchType(searchType);
  const normalizedCollection = normalizeAdobeCollection(collection);

  try {
    const { raw, text } = await fetchAdobeSearchResults({
      keyword,
      language: normalizedLanguage,
      searchType: normalizedSearchType,
      collection: normalizedCollection,
      fallbackFetch,
    });

    const list = parseAdobeResultList(raw);
    const topResults = list.slice(0, 30);
    const titleList = [];
    const allKeywords = [];

    for (const item of topResults) {
      const title = getAdobeItemTitle(item);
      if (title) {
        titleList.push(title);
      }

      const keywords = await fetchAdobeItemKeywords(item, fallbackFetch);
      if (keywords.length > 0) {
        allKeywords.push(...keywords);
      }
    }

    const keywordCounts = countFrequency(allKeywords);
    const topKeywords = [...keywordCounts.entries()]
      .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'ko'))
      .slice(0, 60)
      .map(([value]) => value);

    await safeLogAdobeSearchEvent({
      supabaseUrl,
      serviceRoleKey,
      timeZone,
      language: normalizedLanguage,
      keyword,
      searchType: normalizedSearchType,
      collection: normalizedCollection,
    });

    return {
      keyword: cleanText(keyword),
      language: normalizedLanguage,
      searchType: normalizedSearchType,
      searchTypeLabel: getAdobeSearchTypeLabel(normalizedSearchType),
      collection: normalizedCollection,
      titleList,
      keywordList: topKeywords,
      metaTagString: topKeywords.join(', '),
      collectedAt: getCollectedDate(timeZone),
      rawSnippet: text.slice(0, 500),
    };
  } catch (error) {
    await safeLogAdobeSearchEvent({
      supabaseUrl,
      serviceRoleKey,
      timeZone,
      language: normalizedLanguage,
      keyword,
      searchType: normalizedSearchType,
      collection: normalizedCollection,
    }).catch(() => {});

    return {
      keyword: cleanText(keyword),
      language: normalizedLanguage,
      searchType: normalizedSearchType,
      searchTypeLabel: getAdobeSearchTypeLabel(normalizedSearchType),
      collection: normalizedCollection,
      titleList: [],
      keywordList: [],
      metaTagString: '',
      collectedAt: getCollectedDate(timeZone),
      errorMessage: error?.message || String(error),
      rawSnippet: '',
    };
  }
}

async function getAdobeMonthlyTop20({ supabaseUrl = '', serviceRoleKey = '', timeZone = 'Asia/Seoul', language = '' }) {
  const logs = await fetchAdobeMonthlyLogs({ supabaseUrl, serviceRoleKey, timeZone });
  return aggregateAdobeMonthlyLogs(logs, { timeZone, language });
}

export {
  ADOBE_COLLECTION_OPTIONS,
  ADOBE_COLLECTION_QUERY_MAP,
  ADOBE_LANGUAGE_OPTIONS,
  ADOBE_MONTHLY_TOP_TABS,
  ADOBE_REGION_BY_LANGUAGE,
  ADOBE_SEARCH_TYPES,
  ADOBE_SEARCH_TYPE_LABELS,
  aggregateAdobeMonthlyLogs,
  buildAdobeSearchUrl,
  collectAdobeStockAnalysis,
  fetchAdobeMonthlyLogs,
  fetchAdobeSearchTitles,
  getAdobeCollectionQuery,
  getAdobeItemContentUrl,
  getAdobeItemTitle,
  getAdobeRegion,
  getAdobeSearchTypeLabel,
  getCollectedDate,
  getCollectedMonth,
  normalizeAdobeCollection,
  normalizeAdobeLanguage,
  normalizeAdobeSearchType,
  parseAdobeResultList,
  safeLogAdobeSearchEvent,
  getAdobeMonthlyTop20,
  renderAdobeStockPageHtml,
};
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSelectOptions(items, selectedValue, getValue = (item) => item.value, getLabel = (item) => item.label) {
  return items
    .map((item) => {
      const value = cleanText(getValue(item));
      const label = cleanText(getLabel(item));
      const selected = value === cleanText(selectedValue) ? ' selected' : '';
      return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(label)}</option>`;
    })
    .join('');
}

function buildAdobeTagHtml(tag) {
  return `
    <span class="tag" data-adobe-tag>
      <span class="tag-label">${escapeHtml(tag)}</span>
      <button type="button" class="tag-remove" data-adobe-tag-remove aria-label="${escapeHtml(tag)} 삭제">x</button>
    </span>
  `;
}

function buildAdobeResultCard(result, pageType) {
  const titleList = Array.isArray(result?.titleList) ? result.titleList : [];
  const keywordList = Array.isArray(result?.keywordList) ? result.keywordList : [];
  const subtitle = pageType === 'collection' && result?.collection
    ? `컬렉션: ${result.collection}`
    : `검색 타입: ${result?.searchTypeLabel || '전체'}`;
  const keywordCountText = `${titleList.length}개 제목 / ${keywordList.length}개 키워드`;

  return `
    <section class="result-card stack" data-adobe-tags-root>
      <div class="result-head">
        <h3 class="result-title">[${escapeHtml(result?.keyword || '')}] Adobe Stock</h3>
        <button type="button" class="secondary copy-chip" data-adobe-copy-btn>키워드 복사</button>
      </div>
      <div class="meta">${escapeHtml(subtitle)} / ${escapeHtml(keywordCountText)} / ${escapeHtml(result?.collectedAt || '')}</div>
      <div class="adobe-copy-status" data-adobe-copy-status></div>
      <section class="summary-card" style="margin-top: 14px;">
        <h3>상위 제목 30개</h3>
        ${titleList.length > 0 ? `
          <ol class="title-list">
            ${titleList.map((title) => `<li>${escapeHtml(title)}</li>`).join('')}
          </ol>
        ` : `<div class="result-empty">상위 제목이 아직 없습니다.</div>`}
      </section>
      <section class="summary-card" style="margin-top: 14px;">
        <h3>키워드 60개</h3>
        ${keywordList.length > 0 ? `<div class="tags">${keywordList.map(buildAdobeTagHtml).join('')}</div>` : `<div class="result-empty">키워드가 아직 없습니다.</div>`}
      </section>
    </section>
  `;
}

function buildAdobeLandingHtml() {
  return `
    <div class="page-grid">
      <section class="page-card stack">
        <div class="eyebrow">Adobe Stock Platform</div>
        <h2>Adobe Stock 분석 도구</h2>
        <p>검색 언어를 분리해서 Adobe Stock의 제목과 키워드를 중심으로 분석하는 도구입니다. 다운로드 수나 페이지 수는 제외하고, 검색 결과와 추천 키워드 중심으로만 보여줍니다.</p>
      </section>

      <section class="platform-grid">
        <article class="feature-card platform-card">
          <div class="platform-head">
            <div class="platform-badges">
              <span class="status-badge available">사용 가능</span>
            </div>
          </div>
          <h2>검색 키워드 분석</h2>
          <p>검색 언어와 검색 타입을 선택한 뒤 키워드를 분석합니다.</p>
          <a class="cta-link" href="/adobe-stock/search-keyword">분석 시작</a>
        </article>

        <article class="feature-card platform-card">
          <div class="platform-head">
            <div class="platform-badges">
              <span class="status-badge available">사용 가능</span>
            </div>
          </div>
          <h2>컬렉션 키워드 분석</h2>
          <p>검색 키워드와 컬렉션 조건을 함께 써서 결과를 분석합니다.</p>
          <a class="cta-link" href="/adobe-stock/collection-keyword">분석 시작</a>
        </article>

        <article class="feature-card platform-card">
          <div class="platform-head">
            <div class="platform-badges">
              <span class="status-badge available">사용 가능</span>
            </div>
          </div>
          <h2>이번 달 인기 키워드 TOP20</h2>
          <p>검색 로그를 기준으로 이번 달 Adobe Stock 인기 데이터를 확인합니다.</p>
          <a class="cta-link" href="/adobe-stock/monthly-top20">TOP20 보기</a>
        </article>
      </section>
    </div>
  `;
}

function buildAdobeSearchFormHtml({ pathname, language, searchType, collection, keyword }) {
  const isCollectionPage = pathname === '/adobe-stock/collection-keyword';
  const action = pathname;
  const selectHtml = isCollectionPage
    ? `
      <label for="adobeCollection">컬렉션</label>
      <select id="adobeCollection" name="collection" class="text-input">
        ${buildSelectOptions(ADOBE_COLLECTION_OPTIONS, collection)}
      </select>
    `
    : `
      <label for="adobeSearchType">검색 타입</label>
      <select id="adobeSearchType" name="searchType" class="text-input">
        ${buildSelectOptions(ADOBE_SEARCH_TYPES, searchType)}
      </select>
    `;

  return `
    <div class="grid">
      <section class="card stack">
        <div class="eyebrow">Adobe Stock Search</div>
        <h2>${isCollectionPage ? '컬렉션 키워드 분석' : '검색 키워드 분석'}</h2>
        <form method="GET" action="${action}">
          <label for="adobeLanguage">검색 언어</label>
          <select id="adobeLanguage" name="language" class="text-input">
            ${buildSelectOptions(ADOBE_LANGUAGE_OPTIONS, language || 'ko')}
          </select>

          ${selectHtml}

          <label for="adobeKeyword" style="margin-top: 16px;">검색 키워드</label>
          <input id="adobeKeyword" name="q" class="text-input" type="text" value="${escapeHtml(keyword || '')}" placeholder="검색할 키워드를 입력하세요" />

          <div class="actions">
            <button class="primary" type="submit">분석 시작</button>
            <a class="ghost-link" href="/adobe-stock">Adobe Stock 홈</a>
          </div>
        </form>
      </section>

      <section class="card stack">
        <label>결과</label>
        <div class="result-panel" id="adobeResultPanel">
          <div class="result-empty">${keyword ? '분석 준비 중...' : '키워드를 입력하면 결과가 표시됩니다.'}</div>
        </div>
      </section>
    </div>
  `;
}

function buildAdobeMonthlyHtml({ pathname, language, activeTab, monthlyData }) {
  const tabsHtml = ADOBE_MONTHLY_TOP_TABS.map((tab) => {
    const isActive = tab.key === activeTab;
    const url = `${pathname}?language=${encodeURIComponent(language)}&tab=${encodeURIComponent(tab.key)}`;
    return `<a class="tab-btn${isActive ? ' active' : ''}" href="${url}">${escapeHtml(tab.label)}</a>`;
  }).join('');

  const selectedItems = monthlyData?.[activeTab] || [];
  const emptyMessage = monthlyData && selectedItems.length === 0
    ? '검색 로그가 아직 없습니다.'
    : '데이터를 불러오는 중입니다.';
  const listHtml = selectedItems.length > 0
    ? `
      <ol class="rank-list">
        ${selectedItems.map((item, index) => `
          <li class="rank-item">
            <span class="rank-order">${index + 1}</span>
            <span class="rank-label">${escapeHtml(item.label || item.keyword || item.value || '-')}</span>
            <span class="rank-count">${escapeHtml(String(item.count || 0))}회</span>
          </li>
        `).join('')}
      </ol>
    `
    : `<div class="result-empty">${escapeHtml(emptyMessage)}</div>`;

  return `
    <div class="page-grid">
      <section class="page-card stack">
        <div class="eyebrow">Adobe Stock Monthly</div>
        <h2>이번 달 인기 키워드 TOP20</h2>
        <p>검색 로그가 있으면 내부 데이터를 우선 집계하고, 아직 없으면 빈 상태를 보여줍니다.</p>
      </section>

      <section class="card stack">
        <form method="GET" action="${pathname}">
          <label for="adobeMonthlyLanguage">검색 언어</label>
          <select id="adobeMonthlyLanguage" name="language" class="text-input">
            ${buildSelectOptions(ADOBE_LANGUAGE_OPTIONS, language || 'ko')}
          </select>
          <input type="hidden" name="tab" value="${escapeHtml(activeTab)}" />
          <div class="actions">
            <button class="primary" type="submit">불러오기</button>
            <a class="ghost-link" href="/adobe-stock">Adobe Stock 홈</a>
          </div>
        </form>
      </section>

      <section class="summary-grid">
        <section class="summary-card">
          <h3>이번 달 인기 검색 TOP20</h3>
          <div class="tabs" style="margin-bottom: 14px;">${tabsHtml}</div>
          ${listHtml}
        </section>
      </section>
    </div>
  `;
}

async function renderAdobeStockPageHtml({ pathname, searchParams, origin, supabaseUrl = '', serviceRoleKey = '', timeZone = 'Asia/Seoul' }) {
  const language = normalizeAdobeLanguage(searchParams?.get('language') || 'ko');
  const keyword = cleanText(searchParams?.get('q'));
  const searchType = normalizeAdobeSearchType(searchParams?.get('searchType'));
  const collection = normalizeAdobeCollection(searchParams?.get('collection'));
  const activeTab = searchParams?.get('tab') || 'keywordSearchTop20';

  if (pathname === '/adobe-stock') {
    return buildAdobeLandingHtml();
  }

  if (pathname === '/adobe-stock/monthly-top20') {
    const monthlyData = await getAdobeMonthlyTop20({ supabaseUrl, serviceRoleKey, timeZone, language });
    return buildAdobeMonthlyHtml({ pathname, language, activeTab, monthlyData });
  }

  if (pathname === '/adobe-stock/search-keyword' || pathname === '/adobe-stock/collection-keyword') {
    const pageType = pathname === '/adobe-stock/collection-keyword' ? 'collection' : 'search';
    const result = keyword
      ? await collectAdobeStockAnalysis({
          keyword,
          language,
          searchType: pageType === 'collection' ? 'all' : searchType,
          collection: pageType === 'collection' ? collection : '',
          supabaseUrl,
          serviceRoleKey,
          timeZone,
        })
      : null;

    return `
      <div class="page-grid">
        <section class="page-card stack">
          <div class="eyebrow">Adobe Stock Platform</div>
          <h2>${pageType === 'collection' ? '컬렉션 키워드 분석' : '검색 키워드 분석'}</h2>
          <p>검색 언어와 UI 언어를 분리해서 Adobe Stock 결과를 분석합니다. 상위 제목 30개와 키워드 60개만 보여줍니다.</p>
        </section>

        ${buildAdobeSearchFormHtml({ pathname, language, searchType, collection, keyword })}

        ${result ? buildAdobeResultCard(result, pageType) : ''}
      </div>
      <script>
        (function () {
          const root = document.querySelector('[data-adobe-tags-root]');
          if (!root) return;

          document.addEventListener('click', async (event) => {
            const removeBtn = event.target.closest('[data-adobe-tag-remove]');
            if (removeBtn) {
              const tag = removeBtn.closest('[data-adobe-tag]');
              if (tag) tag.remove();
              return;
            }

            const copyBtn = event.target.closest('[data-adobe-copy-btn]');
            if (!copyBtn) return;

            const tags = Array.from(document.querySelectorAll('[data-adobe-tag] .tag-label'))
              .map((el) => el.textContent.trim())
              .filter(Boolean);
            const text = tags.join(', ');
            const status = document.querySelector('[data-adobe-copy-status]');

            try {
              await navigator.clipboard.writeText(text);
              if (status) status.textContent = '복사 완료';
            } catch (error) {
              if (status) status.textContent = '복사 실패';
            }
          });
        })();
      </script>
    `;
  }

  return buildAdobeLandingHtml();
}



