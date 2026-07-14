import { sanitizeKeywords } from '../utils/keywords.js';

const CROWDPIC_ORIGIN = 'https://www.crowdpic.net';
const RECOMMENDED_LIMIT = 50;

const CATEGORY_CODE_BY_CONTENT_TYPE = {
  전체: 'all',
  사진: 'photo',
  일러스트: 'graphic',
  캘리그래피: 'calli',
  아이콘: 'icon',
  목업: 'mockup',
};

function cleanText(value) {
  return String(value ?? '').trim();
}

function getCategoryCode(contentType) {
  return CATEGORY_CODE_BY_CONTENT_TYPE[contentType] || CATEGORY_CODE_BY_CONTENT_TYPE.전체;
}

function buildHeaders() {
  return {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    'User-Agent': 'Mozilla/5.0 (compatible; StockKeyword/1.0)',
  };
}

function extractDetailUrls(html) {
  const urls = new Set();

  for (const match of String(html ?? '').matchAll(/href=["']([^"']+)["']/gi)) {
    try {
      const url = new URL(match[1], CROWDPIC_ORIGIN);
      if (url.origin === CROWDPIC_ORIGIN && /^\/photo\/[^/]+/i.test(url.pathname)) {
        urls.add(url.toString());
      }
    } catch {
      // Ignore malformed result links.
    }
  }

  return [...urls];
}

function splitCrowdpicKeywords(value) {
  return String(value ?? '')
    .split(/[|,/\r\n]+/)
    .map(cleanText)
    .filter(Boolean);
}

function extractKeywordsFromDetailHtml(html) {
  const source = String(html ?? '');
  const explicitPatterns = [
    /data-tag=["']([^"']+)["']/gi,
    /adlib_trk_data\.p_tag\s*[:=]\s*["']([^"']+)["']/gi,
  ];
  const metaPatterns = [
    /<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+property=["']og:keywords["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
  ];

  for (const patterns of [explicitPatterns, metaPatterns]) {
    const values = [];
    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) values.push(...splitCrowdpicKeywords(match[1]));
    }

    const keywords = sanitizeKeywords(values.map((value) => value.replace(/^#/, '').trim()));
    if (keywords.length > 0) return keywords;
  }

  return [];
}

function rankKeywords(keywords) {
  const frequency = new Map();
  const firstAppearance = new Map();
  let order = 0;

  for (const keyword of keywords) {
    if (!firstAppearance.has(keyword)) firstAppearance.set(keyword, order++);
    frequency.set(keyword, (frequency.get(keyword) || 0) + 1);
  }

  return [...frequency.keys()]
    .sort((left, right) => (
      frequency.get(right) - frequency.get(left)
      || firstAppearance.get(left) - firstAppearance.get(right)
    ))
    .slice(0, RECOMMENDED_LIMIT);
}

export async function getCrowdpicKeywordResult({ keyword, contentType }) {
  const query = cleanText(keyword);
  const category = CATEGORY_CODE_BY_CONTENT_TYPE[contentType] ? contentType : '전체';
  if (!query) return null;

  const categoryCode = getCategoryCode(category);
  const searchUrl = new URL(`/photos/category/${categoryCode}&q=${encodeURIComponent(query)}`, CROWDPIC_ORIGIN);
  const searchResponse = await fetch(searchUrl, { headers: buildHeaders() });
  if (!searchResponse.ok) {
    return {
      query,
      contentType: category,
      keywords: [],
      recommendedCount: 0,
      recommendedLimit: RECOMMENDED_LIMIT,
      collectedAt: new Date().toISOString().slice(0, 10),
    };
  }
  await searchResponse.text();

  const body = new URLSearchParams({
    page: '1', keyword: query, theme: '', category: categoryCode, start: '', end: '',
    section: 'photo', search_flag: 'category', order: '', type: '', commercial: '', usage: '', orientation: '',
    exception: '', contain: '', code: '', all_count_state: 'ing', all_count: '', view_type: 'pc',
    suggest_keyword: query, sbi: '', lang: 'ko',
  });
  const resultResponse = await fetch(new URL('/controller/search/elasticsearch_get_data.php', CROWDPIC_ORIGIN), {
    method: 'POST',
    headers: {
      ...buildHeaders(),
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: searchUrl.toString(),
    },
    body,
  });
  const resultPayload = resultResponse.ok ? await resultResponse.json().catch(() => null) : null;
  const detailUrls = Number(resultPayload?.rows) > 0 ? extractDetailUrls(resultPayload.result) : [];

  const detailKeywords = await Promise.all(detailUrls.slice(0, 30).map(async (detailUrl) => {
    try {
      const response = await fetch(detailUrl, { headers: { ...buildHeaders(), Referer: searchUrl.toString() } });
      return response.ok ? extractKeywordsFromDetailHtml(await response.text()) : [];
    } catch {
      return [];
    }
  }));

  const keywords = rankKeywords(detailKeywords.flat());
  return {
    query,
    contentType: category,
    keywords,
    recommendedCount: keywords.length,
    recommendedLimit: RECOMMENDED_LIMIT,
    collectedAt: new Date().toISOString().slice(0, 10),
  };
}

export { CATEGORY_CODE_BY_CONTENT_TYPE, RECOMMENDED_LIMIT };