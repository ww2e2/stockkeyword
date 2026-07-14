import { sanitizeKeywords } from '../utils/keywords.js';

const TOOLDI_ORIGIN = 'https://api.tooldi.com';
const RESULT_LIMIT = 30;
const KEYWORD_LIMIT = 20;
const SEARCH_PAGE_LIMIT = 2;
const TEMPLATE_RESULT_LIMIT = 20;
const TEMPLATE_SEARCH_PAGE_LIMIT = 2;

function cleanText(value) { return String(value ?? '').trim(); }

const TEMPLATE_DESIGN_ONLY_KEYWORDS = new Set([
  // 색상
  '빨강', '빨간색', '레드',
  '주황', '주황색', '오렌지',
  '노랑', '노란색', '옐로우',
  '연두', '연두색', '라임',
  '초록', '초록색', '녹색', '그린',
  '청록', '청록색', '민트',
  '파랑', '파란색', '블루',
  '남색', '네이비',
  '보라', '보라색', '퍼플',
  '분홍', '분홍색', '핑크',
  '자주', '자주색', '마젠타',
  '갈색', '브라운',
  '베이지', '아이보리', '크림',
  '하양', '흰색', '화이트',
  '검정', '검은색', '블랙',
  '회색', '그레이',
  '금색', '골드', '은색', '실버',
  '무채색', '컬러풀', '파스텔',

  // 스타일·분위기
  '미니멀', '미니멀리즘', '미니멀한',
  '모던', '모던한',
  '심플', '심플한',
  '깔끔', '깔끔한',
  '밝은', '어두운',
  '트렌디', '트렌디한',
  '감성', '감성적인',
  '세련', '세련된',
  '고급', '고급스러운',
  '귀여운', '캐주얼',
  '빈티지', '레트로', '클래식',
  '러블리', '힙한', '키치',
  '화려한', '차분한',
  '역동적', '역동적인',
  '생동감', '생동감있는', '생동감 있는',
  '자연스러운', '현대적', '현대적인',
  '미래적', '미래적인',
]);

function normalizePlanningKeyword(value) {
  return cleanText(value).toLocaleLowerCase('ko');
}

function isPlanningKeyword(value) {
  return !TEMPLATE_DESIGN_ONLY_KEYWORDS.has(normalizePlanningKeyword(value));
}
function getData(payload) { return Array.isArray(payload?.data) ? payload.data : []; }
function extractKeywordValues(value) {
  if (Array.isArray(value)) {
    return value.flatMap(extractKeywordValues);
  }

  if (value && typeof value === 'object') {
    const candidate =
      value.keyword
      ?? value.name
      ?? value.title
      ?? value.label
      ?? value.value
      ?? value.tag
      ?? value.text;

    return candidate == null ? [] : extractKeywordValues(candidate);
  }

  return cleanText(value)
    .split(/\|:\||\|/)
    .map(cleanText)
    .filter(Boolean);
}

function getItemKeywords(item, contentType) {
  if (contentType === 'background') {
    return extractKeywordValues(item?.keywords ?? item?.keyword);
  }

  return extractKeywordValues(item?.keywords ?? item?.keyword);
}

function getItemIdentity(item, contentType, pageIndex, itemIndex) {
  const directId = cleanText(
    item?.id
    ?? item?.idx
    ?? item?.contentId
    ?? item?.contentIdx
    ?? item?.pictureId
    ?? item?.shapeId
    ?? item?.backgroundId
    ?? item?.uuid
  );

  if (directId) return `${contentType}:${directId}`;

  const source = cleanText(
    item?.url
    ?? item?.imageUrl
    ?? item?.thumbnailUrl
    ?? item?.src
    ?? item?.title
    ?? item?.name
  );

  return `${contentType}:${source}:${pageIndex}:${itemIndex}`;
}
function getPriceType(item) {
  return cleanText(item?.priceType ?? item?.price_type);
}
function isPaidItem(item) {
  return getPriceType(item) === 'paid';
}
function isPaidTemplate(item) {
  const priceType = getPriceType(item);
  return priceType === 'paid' || priceType === 'partialPaid';
}

function getTemplateIdentity(item, pageIndex, itemIndex) {
  const identity = cleanText(
    item?.serial
    ?? item?.code
    ?? item?.id
    ?? item?.idx
    ?? item?.templateId
  );

  return identity || `template:${pageIndex}:${itemIndex}`;
}

function getTemplateTitle(item) {
  return cleanText(
    item?.title
    ?? item?.templateTitle
    ?? item?.templateName
    ?? item?.displayName
    ?? item?.name
    ?? item?.subject
    ?? item?.template?.title
    ?? item?.template?.name
  );
}

function getTemplatePageCount(item) {
  const pageCount = Number(
    item?.pages
    ?? item?.pageCount
    ?? item?.templatePageCount
    ?? item?.slideCount
    ?? item?.page_count
  );

  return Number.isFinite(pageCount) && pageCount > 0
    ? pageCount
    : null;
}

function formatPercentage(count, total) {
  if (!total) return 0;

  const percentage = (count / total) * 100;
  return Number.isInteger(percentage)
    ? percentage
    : Number(percentage.toFixed(1));
}

function buildTemplatePageCounts(items) {
  const counts = new Map();

  for (const item of items) {
    const pageCount = getTemplatePageCount(item);
    if (pageCount == null) continue;

    counts.set(pageCount, (counts.get(pageCount) || 0) + 1);
  }

  const total = [...counts.values()]
    .reduce((sum, count) => sum + count, 0);

  return [...counts.entries()]
    .sort(([left], [right]) => left - right)
    .map(([pageCount, count]) => ({
      pageCount,
      count,
      percentage: formatPercentage(count, total),
    }));
}

async function getPaidTemplateItems(keyword) {
  const collected = [];
  const seenIds = new Set();

  for (
    let page = 0;
    page < TEMPLATE_SEARCH_PAGE_LIMIT
      && collected.length < TEMPLATE_RESULT_LIMIT;
    page += 1
  ) {
    const pageItems = await postTooldiSearch(
      '/editor/get_templates',
      { keyword, page },
    );

    if (!pageItems.length) break;

    for (let index = 0; index < pageItems.length; index += 1) {
      const item = pageItems[index];

      if (!isPaidTemplate(item)) continue;

      const identity = getTemplateIdentity(item, page, index);
      if (seenIds.has(identity)) continue;

      seenIds.add(identity);
      collected.push(item);

      if (collected.length >= TEMPLATE_RESULT_LIMIT) break;
    }
  }

  return collected;
}
function collectKeywords(
  items,
  extractKeywords,
  includeKeyword = () => true,
) {
  const frequency = new Map();
  const firstAppearance = new Map();
  let order = 0;
  for (const item of items) {
    const keywords = sanitizeKeywords(extractKeywords(item))
      .filter(includeKeyword);

    for (const keyword of keywords) {
      if (!firstAppearance.has(keyword)) {
        firstAppearance.set(keyword, order++);
      }

      frequency.set(
        keyword,
        (frequency.get(keyword) || 0) + 1,
      );
    }
  }
  return [...frequency.keys()]
    .sort((left, right) => frequency.get(right) - frequency.get(left) || firstAppearance.get(left) - firstAppearance.get(right))
    .slice(0, KEYWORD_LIMIT);
}
async function fetchTooldi(path) {
  const response = await fetch(new URL(path, TOOLDI_ORIGIN), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Tooldi API request failed: ${response.status}`);
  return response.json();
}
async function postTooldiSearch(path, body) {
  const response = await fetch(new URL(path, TOOLDI_ORIGIN), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Tooldi API request failed: ${response.status}`);
  const payload = await response.json();
  if (!payload || payload.result === false) throw new Error('Tooldi API returned an invalid response');
  return getData(payload);
}
function getSearchItems(keyword, contentType, pageIndex) {
  if (contentType === 'shape') {
    return fetchTooldi(
      '/editor/get_shapes?type=total&keyword='
      + encodeURIComponent(keyword)
      + '&page='
      + pageIndex,
    ).then(getData);
  }

  if (contentType === 'background') {
    return postTooldiSearch('/editor/get_background_contents', {
      type: 'pattern',
      keyword,
      page: pageIndex + 1,
      source: 'search',
    });
  }

  return postTooldiSearch('/editor/get_pictures', {
    keyword,
    orientation: '',
    price: '',
    follow: false,
    backgroundRemoval: false,
    page: pageIndex,
    source: 'search',
  });
}

async function getPaidSearchItems(keyword, contentType) {
  const collectedItems = [];
  const seenItemIds = new Set();

  for (
    let pageIndex = 0;
    pageIndex < SEARCH_PAGE_LIMIT
      && collectedItems.length < RESULT_LIMIT;
    pageIndex += 1
  ) {
    const pageItems = await getSearchItems(
      keyword,
      contentType,
      pageIndex,
    );

    if (!pageItems.length) break;

    for (let itemIndex = 0; itemIndex < pageItems.length; itemIndex += 1) {
      const item = pageItems[itemIndex];

      if (!isPaidItem(item)) continue;

      const identity = getItemIdentity(
        item,
        contentType,
        pageIndex,
        itemIndex,
      );

      if (seenItemIds.has(identity)) continue;

      seenItemIds.add(identity);
      collectedItems.push(item);

      if (collectedItems.length >= RESULT_LIMIT) break;
    }
  }

  return collectedItems;
}
function getEmptyResult(query, fields = {}) {
  return { query, keywords: [], recommendedCount: 0, collectedAt: new Date().toISOString().slice(0, 10), ...fields };
}
export async function getTooldiKeywordResult({ keyword, contentType }) {
  const query = cleanText(keyword);
  const type = ['picture', 'shape', 'background'].includes(contentType) ? contentType : 'picture';
  if (!query) return null;
  try {
    const items = await getPaidSearchItems(query, type);
    const keywords = collectKeywords(
      items,
      (item) => getItemKeywords(item, type),
    );

    return {
      query,
      contentType: type,
      keywords,
      recommendedCount: keywords.length,
      collectedAt: new Date().toISOString().slice(0, 10),
    };
  } catch {
    return getEmptyResult(query, { contentType: type, errorState: true });
  }
}
export async function getTooldiTemplateResult({
  keyword,
  templateTypeId = 'all',
}) {
  const query = cleanText(keyword);
  const selectedTemplateType = cleanText(templateTypeId) || 'all';

  if (!query) return null;

  try {
    const items = await getPaidTemplateItems(query);

    const keywords = collectKeywords(
      items,
      (item) => extractKeywordValues(
        item?.keywords ?? item?.keyword,
      ),
      isPlanningKeyword,
    );

    const topTemplateTitles = items
      .map(getTemplateTitle)
      .filter(Boolean);

    const pageCounts = buildTemplatePageCounts(items);

    return {
      query,
      templateTypeId: selectedTemplateType,
      contentType: selectedTemplateType,
      keywords,
      recommendedCount: keywords.length,
      pageCounts,
      topTemplateTitles,
      templateCount: items.length,
      collectedAt: new Date().toISOString().slice(0, 10),
    };
  } catch {
    return getEmptyResult(query, {
      templateTypeId: selectedTemplateType,
      contentType: selectedTemplateType,
      pageCounts: [],
      topTemplateTitles: [],
      templateCount: 0,
      errorState: true,
    });
  }
}
