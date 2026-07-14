import { sanitizeKeywords } from '../utils/keywords.js';

const MIRICANVAS_ELEMENT_ENDPOINT = 'https://api.miricanvas.com/designresource/api/d/element';
const MIRICANVAS_TEMPLATE_SEARCH_ENDPOINT = 'https://api.miricanvas.com/template/api/p/template-pages/search';
const MIRICANVAS_TEMPLATE_DETAIL_ENDPOINT = 'https://api.miricanvas.com/api/template';
const RECOMMENDED_LIMIT = 30;
const TEMPLATE_RESULT_LIMIT = 30;
const TEMPLATE_SEARCH_PAGE_SIZE = 30;
const TEMPLATE_SEARCH_MAX_PAGES = 20;
const TEMPLATE_KEYWORD_LIMIT = 20;
const SUPPORTED_TEMPLATE_TYPE_IDS = new Set([
  'card_news',
  'presentation',
  'youtube_thumb',
  'youtube_cover',
  'detail_page',
  'web_post_ver_poster',
  'web_post_hor_poster',
]);

const TYPE_LIST_BY_CONTENT_TYPE = {
  요소: ['ILLUST', 'BITMAP', 'FIGURE', 'PRESET_FIGURE'],
  사진: ['PICTURE'],
  배경: ['BACKGROUND_PICTURE'],
};

function cleanText(value) {
  return String(value ?? '').trim();
}

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

function getTier(item) {
  return cleanText(
    item?.tier
    ?? item?.template?.tier
    ?? item?.designResource?.tier
    ?? item?.data?.tier
    ?? item?.data?.template?.tier
  ).toUpperCase();
}

function isPremiumItem(item) {
  return getTier(item) === 'PREMIUM';
}

function getTemplateIdentity(template, page, index) {
  const idx = cleanText(
    template?.idx
    ?? template?.templateIdx
    ?? template?.template?.idx
  );

  if (idx) return idx;

  const title = cleanText(template?.title ?? template?.template?.title);
  const pageCount = cleanText(
    template?.pageCount
    ?? template?.template?.pageCount
  );

  return `${page}:${index}:${title}:${pageCount}`;
}

function splitKeywords(value) {
  if (Array.isArray(value)) return value.flatMap(splitKeywords);
  return cleanText(value).split('|').map(cleanText).filter(Boolean);
}

function getElements(payload) {
  const data = payload?.data ?? payload;
  return [data?.content, data?.elements, data?.items, data?.results, data?.list, data?.data?.content]
    .find(Array.isArray) || [];
}


function getTemplatePages(payload) {
  const data = payload?.data ?? payload;
  return [data?.content, data?.templatePages, data?.items, data?.results, data?.list, data?.data?.content]
    .find(Array.isArray) || [];
}

function getTemplateKeywordList(payload) {
  const data = payload?.data ?? payload;
  return [data?.keywordList, data?.template?.keywordList, data?.data?.keywordList]
    .find(Array.isArray) || [];
}

function collectKeywords(elements) {
  const keywords = [];
  for (const element of elements) {
    keywords.push(...splitKeywords(element?.keywords), ...splitKeywords(element?.originKeywords));
  }
  return sanitizeKeywords(keywords);
}

function getRecommendedKeywords(elements, limit = RECOMMENDED_LIMIT) {
  const frequencyByKeyword = new Map();
  const firstAppearanceByKeyword = new Map();
  let appearanceIndex = 0;

  for (const element of elements) {
    const keywordsInElement = sanitizeKeywords(splitKeywords(element?.keywords));

    for (const keyword of keywordsInElement) {
      if (!firstAppearanceByKeyword.has(keyword)) {
        firstAppearanceByKeyword.set(keyword, appearanceIndex++);
      }

      frequencyByKeyword.set(keyword, (frequencyByKeyword.get(keyword) || 0) + 1);
    }
  }

  return [...frequencyByKeyword.keys()]
    .sort((left, right) => (
      frequencyByKeyword.get(right) - frequencyByKeyword.get(left)
      || firstAppearanceByKeyword.get(left) - firstAppearanceByKeyword.get(right)
    ))
    .slice(0, limit);
}

export function buildMiricanvasElementUrl({ keyword, contentType = '요소' }) {
  const url = new URL(MIRICANVAS_ELEMENT_ENDPOINT);
  const params = url.searchParams;
  params.set('status', 'ACTIVE');
  params.set('keyword', cleanText(keyword));
  params.set('includePresetV2', 'true');
  params.set('teamIdx', '11530479');
  params.set('page', '1');
  params.set('pageSize', '30');
  params.set('tier', 'PREMIUM');
  params.set('domain', 'production');
  params.set('language', 'ko');
  for (const type of TYPE_LIST_BY_CONTENT_TYPE[contentType] || TYPE_LIST_BY_CONTENT_TYPE.요소) params.append('typeList', type);
  return url;
}

export async function getMiricanvasKeywordResult({ keyword, contentType }) {
  const query = cleanText(keyword);
  if (!query) return null;
  const response = await fetch(buildMiricanvasElementUrl({ keyword: query, contentType }), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`미리캔버스 검색 API 요청에 실패했습니다. (${response.status})`);
  const elements = getElements(await response.json())
    .filter(isPremiumItem);
  const allKeywords = collectKeywords(elements);
  const keywords = getRecommendedKeywords(elements);
  return {
    query,
    contentType: TYPE_LIST_BY_CONTENT_TYPE[contentType] ? contentType : '요소',
    keywords,
    recommendedCount: keywords.length,
    recommendedLimit: RECOMMENDED_LIMIT,
    totalKeywordCount: allKeywords.length,
    collectedAt: new Date().toISOString().slice(0, 10),
  };
}


export function buildMiricanvasTemplateSearchUrl({
  keyword,
  templateTypeId,
  page = 1,
  pageSize = TEMPLATE_SEARCH_PAGE_SIZE,
}) {
  const url = new URL(MIRICANVAS_TEMPLATE_SEARCH_ENDPOINT);
  const params = url.searchParams;
  params.set('keyword', cleanText(keyword));
  params.set('templateTypeIdList', cleanText(templateTypeId));
  params.set('purpose', 'WEB');
  params.set('strictLanguage', 'true');
  params.append('categoryList', 'TEMPLATE');
  params.append('categoryList', 'CREATOR');
  params.set('status', 'ACTIVE');
  params.set('isPageSearch', 'false');
  params.set('includeTemplateV2', 'true');
  params.set('language', 'ko');
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  params.set('domain', 'production');
  return url;
}

export function buildMiricanvasTemplateDetailUrl(idx) {
  const url = new URL(`${MIRICANVAS_TEMPLATE_DETAIL_ENDPOINT}/${encodeURIComponent(cleanText(idx))}`);
  url.searchParams.set('language', 'ko');
  url.searchParams.set('domain', 'production');
  return url;
}

function collectTopTemplateKeywords(keywordLists) {
  const frequencyByKeyword = new Map();
  const firstAppearanceByKeyword = new Map();
  let appearanceIndex = 0;

  for (const keywordList of keywordLists) {
    const planningKeywords = sanitizeKeywords(keywordList)
      .filter(isPlanningKeyword);

    for (const keyword of planningKeywords) {
      if (!firstAppearanceByKeyword.has(keyword)) {
        firstAppearanceByKeyword.set(keyword, appearanceIndex++);
      }

      frequencyByKeyword.set(
        keyword,
        (frequencyByKeyword.get(keyword) || 0) + 1,
      );
    }
  }

  return [...frequencyByKeyword.keys()]
    .sort((left, right) => (
      frequencyByKeyword.get(right) - frequencyByKeyword.get(left)
      || firstAppearanceByKeyword.get(left) - firstAppearanceByKeyword.get(right)
    ))
    .slice(0, TEMPLATE_KEYWORD_LIMIT);
}

function formatPercentage(count, total) {
  if (!total) return 0;
  const percentage = (count / total) * 100;
  return Number.isInteger(percentage) ? percentage : Number(percentage.toFixed(1));
}

export function normalizeTemplatePageCounts(templates) {
  const templateList = Array.isArray(templates) ? templates : [];
  const countByPage = new Map();

  for (const template of templateList) {
    const rawPageCount = template?.pageCount ?? template?.template?.pageCount ?? 0;
    const pageCount = Number.isFinite(Number(rawPageCount)) ? Number(rawPageCount) : 0;
    countByPage.set(pageCount, (countByPage.get(pageCount) || 0) + 1);
  }

  return [...countByPage.entries()]
    .sort(([left], [right]) => left - right)
    .map(([pageCount, count]) => ({
      pageCount,
      count,
      percentage: formatPercentage(count, templateList.length),
    }));
}

async function fetchPremiumTemplateSearchResults({
  keyword,
  templateTypeId,
}) {
  const premiumTemplates = [];
  const seenTemplateIds = new Set();

  for (
    let page = 1;
    page <= TEMPLATE_SEARCH_MAX_PAGES
      && premiumTemplates.length < TEMPLATE_RESULT_LIMIT;
    page += 1
  ) {
    const searchResponse = await fetch(
      buildMiricanvasTemplateSearchUrl({
        keyword,
        templateTypeId,
        page,
        pageSize: TEMPLATE_SEARCH_PAGE_SIZE,
      }),
      { headers: { Accept: 'application/json' } },
    );

    if (!searchResponse.ok) {
      throw new Error(
        `미리캔버스 템플릿 검색 API 요청에 실패했습니다. (${searchResponse.status})`,
      );
    }

    const pageTemplates = getTemplatePages(await searchResponse.json());

    if (!pageTemplates.length) break;

    for (let index = 0; index < pageTemplates.length; index += 1) {
      const template = pageTemplates[index];

      if (!isPremiumItem(template)) continue;

      const identity = getTemplateIdentity(template, page, index);
      if (seenTemplateIds.has(identity)) continue;

      seenTemplateIds.add(identity);
      premiumTemplates.push(template);

      if (premiumTemplates.length >= TEMPLATE_RESULT_LIMIT) break;
    }

    if (pageTemplates.length < TEMPLATE_SEARCH_PAGE_SIZE) break;
  }

  return premiumTemplates;
}

export async function getMiricanvasTemplateResult({ keyword, templateTypeId }) {
  const query = cleanText(keyword);
  const typeId = cleanText(templateTypeId);
  if (!query || !SUPPORTED_TEMPLATE_TYPE_IDS.has(typeId)) return null;

  const templates = await fetchPremiumTemplateSearchResults({
    keyword: query,
    templateTypeId: typeId,
  });

  const templateDetails = await Promise.all(templates.map(async (template) => {
    const idx = template?.idx ?? template?.templateIdx ?? template?.template?.idx;

    if (!idx) return { template, keywordList: [] };

    const detailResponse = await fetch(
      buildMiricanvasTemplateDetailUrl(idx),
      { headers: { Accept: 'application/json' } },
    );

    if (!detailResponse.ok) return { template, keywordList: [] };

    return {
      template,
      keywordList: getTemplateKeywordList(await detailResponse.json()),
    };
  }));

  const analysisDetails = templateDetails;
  const analysisTemplates = analysisDetails.map(({ template }) => template);
  const keywords = collectTopTemplateKeywords(
    analysisDetails.map(({ keywordList }) => keywordList),
  );

  return {
    query,
    templateTypeId: typeId,
    contentType: typeId,
    keywords,
    recommendedCount: keywords.length,
    pageCounts: normalizeTemplatePageCounts(analysisTemplates),
    topTemplateTitles: analysisTemplates.map((template) => cleanText(template?.title ?? template?.template?.title)).filter(Boolean),
    templateCount: analysisTemplates.length,
    collectedAt: new Date().toISOString().slice(0, 10),
  };
}

export { TYPE_LIST_BY_CONTENT_TYPE };
