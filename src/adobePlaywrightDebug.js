import { chromium } from 'playwright';
import { buildAdobeSearchUrl, getAdobeRegion, normalizeAdobeLanguage, normalizeAdobeSearchType } from './adobeStock.js';

function cleanText(value) {
  return String(value ?? '').replace(/\uFEFF/g, '').trim();
}

function buildAdobeSearchPageUrl({ keyword, language }) {
  const normalizedLanguage = normalizeAdobeLanguage(language);
  const region = getAdobeRegion(normalizedLanguage);
  const params = new URLSearchParams();
  params.set('k', cleanText(keyword));
  return region
    ? 'https://stock.adobe.com/' + region + '/search?' + params.toString()
    : 'https://stock.adobe.com/search?' + params.toString();
}


const ADOBE_SEARCH_URL_COMPARE_KEYS = [
  'k',
  'order',
  'sort',
  'search_type',
  'filters[content_type:image]',
  'filters[content_type:photo]',
  'filters[content_type:illustration]',
  'filters[content_type:vector]',
  'filters[is_free]',
  'filters[has_transparency]',
  'filters[content_level]',
  'filters[premium]',
  'limit',
  'get_facets',
];

function isAdobeAjaxSearchUrl(value) {
  try {
    const url = new URL(value);
    return /(^|\.)stock\.adobe\.com$/i.test(url.hostname) && /\/Ajax\/Search$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function getUrlParamValue(url, key) {
  try {
    return new URL(url).searchParams.get(key) || '';
  } catch {
    return '';
  }
}

function compareAdobeSearchUrls(currentUrl, actualUrl) {
  return ADOBE_SEARCH_URL_COMPARE_KEYS.map((key) => ({
    key,
    current: getUrlParamValue(currentUrl, key),
    actual: getUrlParamValue(actualUrl, key),
  })).filter((row) => row.current || row.actual || row.current !== row.actual);
}

function pickObservedAdobeSearchUrl(urls, searchType) {
  const candidates = urls.filter(isAdobeAjaxSearchUrl);
  if (candidates.length === 0) {
    return '';
  }

  const normalizedSearchType = normalizeAdobeSearchType(searchType);
  const withKeyword = candidates.filter((url) => getUrlParamValue(url, 'k'));
  const base = withKeyword.length > 0 ? withKeyword : candidates;

  if (normalizedSearchType !== 'all') {
    const exact = base.filter((url) => getUrlParamValue(url, `filters[content_type:${normalizedSearchType}]`) === '1');
    if (exact.length > 0) {
      return exact[exact.length - 1];
    }
  }

  return base[base.length - 1];
}

function buildDefaultDiagnostics() {
  return {
    totalMs: 0,
    pageLoadMs: 0,
    ajaxMs: 0,
    detailMs: 0,
    titleCount: 0,
    rawKeywordCount: 0,
    uniqueKeywordCount: 0,
    finalKeywordCount: 0,
    failedDetailCount: 0,
  };
}


async function collectDomResultItems(page, limit = 30) {
  const maxScrolls = 12;
  for (let attempt = 0; attempt < maxScrolls; attempt += 1) {
    const items = await page.evaluate((limit) => {
      function cleanText(value) {
        return String(value || '').replace(/\uFEFF/g, '').trim();
      }

      function getContentId(value) {
        const match = String(value || '').match(/\d{6,}/);
        return match ? match[0] : '';
      }

      function absolutizeUrl(value) {
        const source = cleanText(value);
        if (!source) return '';
        try {
          return new URL(source, window.location.origin).toString();
        } catch {
          return source;
        }
      }

      function pickTitle(element, anchor) {
        const candidates = [
          anchor?.getAttribute('aria-label'),
          anchor?.getAttribute('title'),
          anchor?.querySelector('img')?.getAttribute('alt'),
          anchor?.querySelector('img')?.getAttribute('title'),
          element?.getAttribute('aria-label'),
          element?.getAttribute('title'),
          element?.querySelector('img')?.getAttribute('alt'),
          element?.querySelector('img')?.getAttribute('title'),
        ];

        for (const candidate of candidates) {
          const title = cleanText(candidate);
          if (title && !/^Adobe Stock$/i.test(title)) {
            return title;
          }
        }

        return '';
      }

      const selectors = [
        '[data-content-id]',
        '[data-id]',
        'a[href*="/stock-photo/"]',
        'a[href*="/stock-illustration/"]',
        'a[href*="/stock-vector/"]',
        'a[href*="/images/"]',
        'a[href*="/detail/"]',
        'a[href*="/Search"]',
      ];
      const nodes = Array.from(document.querySelectorAll(selectors.join(',')));
      const results = [];
      const seen = new Set();

      for (const node of nodes) {
        const anchor = node.matches('a[href]') ? node : node.querySelector('a[href]') || node.closest('a[href]');
        const href = absolutizeUrl(anchor?.getAttribute('href') || '');
        const contentId = getContentId(node.getAttribute('data-content-id'))
          || getContentId(node.getAttribute('data-id'))
          || getContentId(anchor?.getAttribute('data-content-id'))
          || getContentId(anchor?.getAttribute('data-id'))
          || getContentId(href);

        if (!contentId || seen.has(contentId)) continue;
        seen.add(contentId);
        results.push({
          content_id: contentId,
          contentId,
          id: contentId,
          content_url: href,
          contentUrl: href,
          url: href,
          href,
          title: pickTitle(node, anchor),
        });

        if (results.length >= limit) break;
      }

      return results;
    }, limit).catch(() => []);

    if (items.length >= limit) {
      return items.slice(0, limit);
    }

    await page.evaluate(() => window.scrollBy(0, Math.max(window.innerHeight * 0.85, 700))).catch(() => {});
    await page.waitForTimeout(900);
  }

  return page.evaluate((limit) => {
    function cleanText(value) {
      return String(value || '').replace(/\uFEFF/g, '').trim();
    }

    function getContentId(value) {
      const match = String(value || '').match(/\d{6,}/);
      return match ? match[0] : '';
    }

    function absolutizeUrl(value) {
      const source = cleanText(value);
      if (!source) return '';
      try {
        return new URL(source, window.location.origin).toString();
      } catch {
        return source;
      }
    }

    const results = [];
    const seen = new Set();
    document.querySelectorAll('[data-content-id], [data-id], a[href]').forEach((node) => {
      const anchor = node.matches('a[href]') ? node : node.querySelector('a[href]') || node.closest('a[href]');
      const href = absolutizeUrl(anchor?.getAttribute('href') || '');
      const contentId = getContentId(node.getAttribute('data-content-id')) || getContentId(node.getAttribute('data-id')) || getContentId(href);
      if (!contentId || seen.has(contentId)) return;
      seen.add(contentId);
      results.push({ content_id: contentId, contentId, id: contentId, content_url: href, contentUrl: href, url: href, href });
    });
    return results.slice(0, limit);
  }, limit).catch(() => []);
}

async function runAdobePlaywrightSearchDebug({ keyword = 'apple', language = 'ko', searchType = 'image' } = {}) {
  const runStartedAt = Date.now();
  const normalizedKeyword = cleanText(keyword) || 'apple';
  const normalizedLanguage = normalizeAdobeLanguage(language);
  const normalizedSearchType = normalizeAdobeSearchType(searchType);
  const searchPageUrl = buildAdobeSearchPageUrl({ keyword: normalizedKeyword, language: normalizedLanguage });
  const ajaxUrl = buildAdobeSearchUrl({
    keyword: normalizedKeyword,
    language: normalizedLanguage,
    searchType: normalizedSearchType,
    collection: '',
  });

  // Local debug only: this launches a visible Chromium browser and must not be used for production or deployment flows.
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const observedAdobeSearchUrls = [];
  let manualAjaxFetchStarted = false;

  const pageAjaxRequestPromise = page.waitForRequest((request) => isAdobeAjaxSearchUrl(request.url()), {
    timeout: 8000,
  }).catch(() => null);

  page.on('request', (request) => {
    const requestUrl = request.url();
    if (isAdobeAjaxSearchUrl(requestUrl) && !manualAjaxFetchStarted) {
      observedAdobeSearchUrls.push(requestUrl);
      console.log('[Adobe Playwright] observed Adobe Search Ajax Request URL:', requestUrl);
    }
  });

  try {
    const pageLoadStartedAt = Date.now();
    await page.goto(searchPageUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(5000);
    const domResultItems = await collectDomResultItems(page, 30);
    const pageAjaxRequest = await pageAjaxRequestPromise;
    const pageLoadMs = Date.now() - pageLoadStartedAt;
    const pageAjaxUrlFromWait = pageAjaxRequest?.url() || '';
    if (pageAjaxUrlFromWait && !observedAdobeSearchUrls.includes(pageAjaxUrlFromWait)) {
      observedAdobeSearchUrls.push(pageAjaxUrlFromWait);
    }
    const actualPageAjaxUrl = pickObservedAdobeSearchUrl(observedAdobeSearchUrls, normalizedSearchType);
    const pageContentIdOrder = domResultItems.map((item) => item.content_id).filter(Boolean);
    const effectiveAjaxUrl = actualPageAjaxUrl || ajaxUrl;
    const ajaxUrlDiff = actualPageAjaxUrl ? compareAdobeSearchUrls(ajaxUrl, actualPageAjaxUrl) : [];

    console.log('[Adobe Playwright] current code Ajax URL:', ajaxUrl);
    console.log('[Adobe Playwright] actual page Ajax URL:', actualPageAjaxUrl || '(not captured)');
    console.log('[Adobe Playwright] effective Ajax URL:', effectiveAjaxUrl);
    console.log('[Adobe Playwright] Ajax URL parameter diff:', ajaxUrlDiff);
    console.log('[Adobe Playwright] DOM result item count:', domResultItems.length);
    console.log('[Adobe Playwright] page content_id order sample:', pageContentIdOrder.slice(0, 30));
    manualAjaxFetchStarted = true;

    const result = await page.evaluate(async ({ url, pageContentIdOrder, domResultItems }) => {
      function cleanText(value) {
        return String(value ?? '').replace(/\uFEFF/g, '').trim();
      }

      function getAdobeItemOrderValue(item) {
        const candidates = [
          item?.order_key,
          item?.orderKey,
          item?.position,
          item?.rank,
          item?.search_position,
          item?.searchPosition,
        ];

        for (const candidate of candidates) {
          const value = Number(candidate);
          if (Number.isFinite(value)) {
            return value;
          }
        }

        return Number.POSITIVE_INFINITY;
      }

      function getJsonObjectTextForProperty(source, propertyName) {
        const marker = '"' + propertyName + '"';
        const markerIndex = source.indexOf(marker);
        if (markerIndex === -1) {
          return '';
        }

        const colonIndex = source.indexOf(':', markerIndex + marker.length);
        if (colonIndex === -1) {
          return '';
        }

        const openIndex = source.indexOf('{', colonIndex + 1);
        if (openIndex === -1) {
          return '';
        }

        let depth = 0;
        let inString = false;
        let escaped = false;

        for (let index = openIndex; index < source.length; index += 1) {
          const char = source[index];

          if (inString) {
            if (escaped) {
              escaped = false;
            } else if (char === '\\') {
              escaped = true;
            } else if (char === '"') {
              inString = false;
            }
            continue;
          }

          if (char === '"') {
            inString = true;
            continue;
          }

          if (char === '{') {
            depth += 1;
          } else if (char === '}') {
            depth -= 1;
            if (depth === 0) {
              return source.slice(openIndex, index + 1);
            }
          }
        }

        return '';
      }

      function extractObjectKeyOrder(objectText) {
        const keys = [];
        let depth = 0;
        let inString = false;
        let escaped = false;
        let keyStart = -1;
        let lastString = '';

        for (let index = 0; index < objectText.length; index += 1) {
          const char = objectText[index];

          if (inString) {
            if (escaped) {
              escaped = false;
            } else if (char === '\\') {
              escaped = true;
            } else if (char === '"') {
              inString = false;
              lastString = objectText.slice(keyStart, index);
            }
            continue;
          }

          if (char === '"') {
            inString = true;
            keyStart = index + 1;
            continue;
          }

          if (char === '{') {
            depth += 1;
            continue;
          }

          if (char === '}') {
            depth -= 1;
            continue;
          }

          if (char === ':' && depth === 1 && lastString) {
            keys.push(lastString.replace(/\\"/g, '"'));
            lastString = '';
          }
        }

        return keys;
      }

      function sortAdobeItemsByBestKnownOrder(items) {
        const rows = items.map((item, index) => ({ item, index, order: getAdobeItemOrderValue(item) }));
        const hasExplicitOrder = rows.some((row) => Number.isFinite(row.order));
        if (!hasExplicitOrder) {
          return items;
        }

        return rows
          .sort((a, b) => {
            const aOrder = Number.isFinite(a.order) ? a.order : Number.POSITIVE_INFINITY;
            const bOrder = Number.isFinite(b.order) ? b.order : Number.POSITIVE_INFINITY;
            return aOrder - bOrder || a.index - b.index;
          })
          .map(({ item }) => item);
      }

      function objectItemsToOrderedList(objectItems, rawText, propertyName = 'items') {
        const entries = Object.entries(objectItems);
        const sourceKeys = extractObjectKeyOrder(getJsonObjectTextForProperty(rawText, propertyName));
        const sourceOrder = new Map(sourceKeys.map((key, index) => [key, index]));
        const orderedItems = entries
          .map(([key, item], index) => ({ key, item, index }))
          .sort((a, b) => {
            const aOrder = sourceOrder.has(a.key) ? sourceOrder.get(a.key) : Number.POSITIVE_INFINITY;
            const bOrder = sourceOrder.has(b.key) ? sourceOrder.get(b.key) : Number.POSITIVE_INFINITY;
            return aOrder - bOrder || a.index - b.index;
          })
          .map(({ item }) => item);

        return sortAdobeItemsByBestKnownOrder(orderedItems);
      }

      function parseAdobeItems(payload, rawText = '') {
        const candidates = [
          ['results', payload?.results],
          ['results', payload?.data?.results],
          ['items', payload?.data?.items],
          ['items', payload?.result?.items],
          ['assets', payload?.assets],
          ['items', payload?.items],
        ];

        for (const [propertyName, candidate] of candidates) {
          if (Array.isArray(candidate)) {
            return sortAdobeItemsByBestKnownOrder(candidate);
          }

          if (candidate && typeof candidate === 'object') {
            return objectItemsToOrderedList(candidate, rawText, propertyName);
          }
        }

        return [];
      }

      function getAdobeItemTitle(item) {
        return cleanText(item?.title || item?.name || item?.content_name || item?.display_name || item?.keyword);
      }

      function getAdobeItemContentId(item) {
        const candidates = [
          item?.content_id,
          item?.contentId,
          item?.id,
          item?.asset_id,
          item?.assetId,
          item?.content_url,
          item?.contentUrl,
          item?.url,
          item?.href,
        ];

        for (const candidate of candidates) {
          const match = String(candidate ?? '').match(/\d{6,}/);
          if (match) {
            return match[0];
          }
        }

        return '';
      }

      function sortAdobeItemsByPageContentOrder(items, contentIdOrder) {
        if (!Array.isArray(contentIdOrder) || contentIdOrder.length === 0) {
          return items;
        }

        const contentOrder = new Map(contentIdOrder.map((id, index) => [String(id), index]));
        return items
          .map((item, index) => {
            const contentId = getAdobeItemContentId(item);
            return {
              item,
              index,
              contentOrder: contentOrder.has(contentId) ? contentOrder.get(contentId) : Number.POSITIVE_INFINITY,
            };
          })
          .sort((a, b) => a.contentOrder - b.contentOrder || a.index - b.index)
          .map(({ item }) => item);
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

      function buildKeywordList(keywords) {
        const counts = new Map();
        for (const keyword of keywords) {
          const value = cleanText(keyword);
          if (!value) continue;
          counts.set(value, (counts.get(value) || 0) + 1);
        }

        const keywordList = [...counts.entries()]
          .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'ko'))
          .slice(0, 60)
          .map(([value]) => value);

        return {
          keywordList,
          uniqueKeywordCount: counts.size,
        };
      }

      async function fetchItemKeywords(item, diagnostics) {
        const direct = normalizeKeywordList(item?.keywords || item?.keywordList || item?.keyword_list);
        if (direct.length > 0) {
          return direct;
        }

        const detailUrl = cleanText(item?.content_url || item?.contentUrl || item?.url || item?.href || item?.detail_url);
        if (!detailUrl) {
          diagnostics.failedDetailCount += 1;
          return [];
        }

        try {
          const response = await fetch(detailUrl, {
            method: 'GET',
            credentials: 'include',
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
            // HTML detail responses are expected.
          }
        } catch {
          diagnostics.failedDetailCount += 1;
          return [];
        }

        diagnostics.failedDetailCount += 1;
        return [];
      }

      async function mapWithConcurrency(items, limit, mapper) {
        const results = new Array(items.length);
        let nextIndex = 0;

        async function worker() {
          while (true) {
            const currentIndex = nextIndex;
            nextIndex += 1;

            if (currentIndex >= items.length) {
              return;
            }

            results[currentIndex] = await mapper(items[currentIndex], currentIndex);
          }
        }

        const workerCount = Math.max(1, Math.min(limit, items.length));
        await Promise.all(Array.from({ length: workerCount }, () => worker()));
        return results;
      }

      const diagnostics = {
        totalMs: 0,
        pageLoadMs: 0,
        ajaxMs: 0,
        detailMs: 0,
        titleCount: 0,
        rawKeywordCount: 0,
        uniqueKeywordCount: 0,
        finalKeywordCount: 0,
        failedDetailCount: 0,
      };

      try {
        const ajaxStartedAt = Date.now();
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json,text/plain,*/*',
            'X-Requested-With': 'XMLHttpRequest',
          },
        });
        diagnostics.ajaxMs = Date.now() - ajaxStartedAt;

        const body = await response.text();
        const baseResult = {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          body500: body.slice(0, 500),
          hasCaptcha: /captcha|interstitial/i.test(body),
          titleList: [],
          keywordList: [],
          diagnostics,
        };

        if (!response.ok) {
          return baseResult;
        }

        const parsed = JSON.parse(body);
        const ajaxItems = parseAdobeItems(parsed, body);
        const ajaxByContentId = new Map(ajaxItems.map((item) => [getAdobeItemContentId(item), item]).filter(([contentId]) => contentId));
        const hasDomTop30 = Array.isArray(domResultItems) && domResultItems.length >= 30;
        const items = hasDomTop30
          ? domResultItems.slice(0, 30).map((domItem) => ({
              ...(ajaxByContentId.get(getAdobeItemContentId(domItem)) || {}),
              ...domItem,
            }))
          : sortAdobeItemsByPageContentOrder(ajaxItems, pageContentIdOrder).slice(0, 30);
        const sourceMode = hasDomTop30 ? 'dom' : 'ajax-fallback';
        const titleList = [];
        const allKeywords = [];
        const detailStartedAt = Date.now();

        for (const item of items) {
          const title = getAdobeItemTitle(item);
          if (title) {
            titleList.push(title);
          }
        }

        const keywordGroups = await mapWithConcurrency(items, 5, async (item) => {
          return fetchItemKeywords(item, diagnostics);
        });

        for (const keywords of keywordGroups) {
          if (Array.isArray(keywords) && keywords.length > 0) {
            allKeywords.push(...keywords);
          }
        }

        diagnostics.detailMs = Date.now() - detailStartedAt;
        diagnostics.titleCount = titleList.length;
        diagnostics.rawKeywordCount = allKeywords.length;

        const { keywordList, uniqueKeywordCount } = buildKeywordList(allKeywords);
        diagnostics.uniqueKeywordCount = uniqueKeywordCount;
        diagnostics.finalKeywordCount = keywordList.length;

        return {
          ...baseResult,
          ok: true,
          titleList,
          keywordList,
          sourceMode,
          diagnostics,
        };
      } catch (error) {
        return {
          ok: false,
          status: 'FETCH_ERROR',
          statusText: error?.name || 'Error',
          body500: String(error?.message || error).slice(0, 500),
          hasCaptcha: false,
          titleList: [],
          keywordList: [],
          diagnostics,
        };
      }
    }, { url: effectiveAjaxUrl, pageContentIdOrder, domResultItems });

    const diagnostics = {
      ...buildDefaultDiagnostics(),
      ...(result?.diagnostics || {}),
      totalMs: Date.now() - runStartedAt,
      pageLoadMs,
      ajaxMs: Number(result?.diagnostics?.ajaxMs || 0),
      detailMs: Number(result?.diagnostics?.detailMs || 0),
      titleCount: Array.isArray(result?.titleList) ? result.titleList.length : Number(result?.diagnostics?.titleCount || 0),
      rawKeywordCount: Number(result?.diagnostics?.rawKeywordCount || 0),
      uniqueKeywordCount: Number(result?.diagnostics?.uniqueKeywordCount || 0),
      finalKeywordCount: Array.isArray(result?.keywordList) ? result.keywordList.length : Number(result?.diagnostics?.finalKeywordCount || 0),
      failedDetailCount: Number(result?.diagnostics?.failedDetailCount || 0),
    };

    return {
      ok: result.ok,
      localOnly: true,
      searchPageUrl,
      ajaxUrl: effectiveAjaxUrl,
      currentCodeAjaxUrl: ajaxUrl,
      actualPageAjaxUrl,
      ajaxUrlDiff,
      observedAdobeSearchUrls,
      pageContentIdOrder,
      sourceMode: result.sourceMode || 'ajax-fallback',
      language: normalizedLanguage,
      searchType: normalizedSearchType,
      keyword: normalizedKeyword,
      status: result.status,
      statusText: result.statusText,
      hasCaptcha: result.hasCaptcha,
      body500: result.body500,
      titleList: Array.isArray(result.titleList) ? result.titleList : [],
      keywordList: Array.isArray(result.keywordList) ? result.keywordList : [],
      diagnostics,
    };
  } catch (error) {
    return {
      ok: false,
      localOnly: true,
      searchPageUrl,
      ajaxUrl,
      currentCodeAjaxUrl: ajaxUrl,
      actualPageAjaxUrl: '',
      ajaxUrlDiff: [],
      observedAdobeSearchUrls,
      pageContentIdOrder: [],
      sourceMode: 'ajax-fallback',
      language: normalizedLanguage,
      searchType: normalizedSearchType,
      keyword: normalizedKeyword,
      status: 'PLAYWRIGHT_ERROR',
      statusText: error?.name || 'Error',
      hasCaptcha: false,
      body500: String(error?.message || error).slice(0, 500),
      titleList: [],
      keywordList: [],
      diagnostics: {
        ...buildDefaultDiagnostics(),
        totalMs: Date.now() - runStartedAt,
      },
    };
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

export { runAdobePlaywrightSearchDebug };
