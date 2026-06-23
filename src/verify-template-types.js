import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { TEMPLATE_TYPE_MAP, TEMPLATE_TYPE_API_VALUE_MAP } from './templateTypeMap.js';

dotenv.config();

const TEMPLATE_API_URL = 'https://api.miricanvas.com/template/api/p/template-pages/search';
const DEFAULT_KEYWORD = process.env.TEMPLATE_VERIFY_KEYWORD || '6월';
const OUTPUT_PATH = path.resolve(process.cwd(), 'verified-template-types.json');
const MIRICANVAS_API_METHOD = (process.env.MIRICANVAS_API_METHOD || 'GET').toUpperCase();
const MIRICANVAS_API_HEADERS_JSON = process.env.MIRICANVAS_API_HEADERS_JSON || '';
const REQUEST_DELAY_MS = Number(process.env.TEMPLATE_VERIFY_DELAY_MS || 150);
const TEMPLATE_PURPOSE_BY_GROUP = {
  '웹': 'WEB',
  '동영상': 'VIDEO',
  '인쇄': 'PRINT',
};
const DEFAULT_TEMPLATE_TIER = 'PREMIUM';

function cleanText(value) {
  return String(value ?? '').replace(/\uFEFF/g, '').trim();
}

function parseJsonObject(raw, label) {
  if (!raw) return {};

  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object`);
  }

  return parsed;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTemplateApiValues(apiValue, fallbackValue = '') {
  const values = Array.isArray(apiValue) ? apiValue : [apiValue || fallbackValue];
  return values.map(cleanText).filter(Boolean);
}

function getTemplatePurpose(item) {
  return cleanText(item?.purpose) || TEMPLATE_PURPOSE_BY_GROUP[item?.group] || 'WEB';
}

function getTemplateTier(item) {
  return cleanText(item?.tier) || DEFAULT_TEMPLATE_TIER;
}

function serializeCandidate(candidate) {
  return JSON.stringify(normalizeTemplateApiValues(candidate));
}

function flattenTemplateItems(items, parentPath = []) {
  const flattened = [];

  for (const item of items) {
    const currentPath = [...parentPath, item.label];
    if (Array.isArray(item.children) && item.children.length > 0) {
      flattened.push(...flattenTemplateItems(item.children, currentPath));
      continue;
    }

    flattened.push({
      ...item,
      pathLabels: currentPath,
    });
  }

  return flattened;
}

function tokenizeKey(value) {
  const normalized = cleanText(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase();

  const rawTokens = normalized.split(/\s+/).filter(Boolean);
  const tokens = [];

  for (const token of rawTokens) {
    if (token === 'cardnews') {
      tokens.push('card', 'news');
      continue;
    }

    if (token === 'detailpage') {
      tokens.push('detail', 'page');
      continue;
    }

    if (token === 'logoprofile') {
      tokens.push('logo', 'profile');
      continue;
    }

    tokens.push(token);
  }

  return tokens;
}

function dedupeConsecutive(tokens) {
  return tokens.filter((token, index) => index === 0 || token !== tokens[index - 1]);
}

function joinCandidate(tokens) {
  return dedupeConsecutive(tokens.filter(Boolean)).join('_');
}

function makeCandidateSet() {
  const seen = new Set();
  const values = [];
  return {
    add(candidate) {
      if (Array.isArray(candidate)) {
        const normalized = candidate.map((item) => cleanText(item).replace(/__+/g, '_')).filter(Boolean);
        if (normalized.length === 0) return;
        const key = JSON.stringify(normalized);
        if (seen.has(key)) return;
        seen.add(key);
        values.push(normalized);
        return;
      }

      const value = cleanText(candidate).replace(/__+/g, '_');
      if (!value) return;
      if (seen.has(value)) return;
      seen.add(value);
      values.push(value);
    },
    values() {
      return [...values];
    },
  };
}

function buildCandidatesForValue(value, item) {
  const baseTokens = tokenizeKey(value);
  const candidates = makeCandidateSet();
  const explicitApiValues = normalizeTemplateApiValues(item?.apiValue, value);

  candidates.add(joinCandidate(baseTokens));
  if (explicitApiValues.length > 1) {
    candidates.add(explicitApiValues);
  }
  for (const explicitApiValue of explicitApiValues) {
    candidates.add(explicitApiValue);
  }
  if (Array.isArray(TEMPLATE_TYPE_API_VALUE_MAP[value])) {
    candidates.add(TEMPLATE_TYPE_API_VALUE_MAP[value]);
  }
  for (const mappedValue of normalizeTemplateApiValues(TEMPLATE_TYPE_API_VALUE_MAP[value], value)) {
    candidates.add(mappedValue);
  }

  const orientationVariantMap = {
    horizontal: ['horizontal', 'hor'],
    vertical: ['vertical', 'ver'],
  };

  const tokenVariants = baseTokens.map((token) => {
    if (orientationVariantMap[token]) {
      return orientationVariantMap[token];
    }

    if (token === 'poster') {
      return ['poster', 'post'];
    }

    return [token];
  });

  function buildCartesian(currentIndex, currentTokens) {
    if (currentIndex >= tokenVariants.length) {
      candidates.add(joinCandidate(currentTokens));
      return;
    }

    for (const token of tokenVariants[currentIndex]) {
      buildCartesian(currentIndex + 1, [...currentTokens, token]);
    }
  }

  buildCartesian(0, []);

  const hasHorizontal = baseTokens.includes('horizontal');
  const hasVertical = baseTokens.includes('vertical');
  const hasOrientation = hasHorizontal || hasVertical;
  const orientationShort = hasHorizontal ? 'hor' : hasVertical ? 'ver' : '';
  const prefixTokens = baseTokens.filter((token) => token !== 'horizontal' && token !== 'vertical' && token !== 'poster');

  if (hasOrientation && prefixTokens.length > 0) {
    candidates.add(joinCandidate([...prefixTokens, orientationShort, 'poster']));
    candidates.add(joinCandidate([...prefixTokens, 'post', orientationShort, 'poster']));
    candidates.add(joinCandidate([...prefixTokens, 'poster', orientationShort]));
    candidates.add(joinCandidate([...prefixTokens, 'post', hasHorizontal ? 'horizontal' : 'vertical']));
  }

  const pathLabels = Array.isArray(item?.pathLabels) ? item.pathLabels : [];
  const inVideoGroup = pathLabels.includes('동영상');
  const platformToken = baseTokens[0];

  if (inVideoGroup && platformToken && !baseTokens.includes('video')) {
    const suffixTokens = baseTokens.slice(1);
    candidates.add(joinCandidate([platformToken, 'video', ...suffixTokens]));
  }

  if (pathLabels.includes('유튜브') && pathLabels.includes('쇼츠')) {
    candidates.add('youtube_video_shorts');
  }

  if (pathLabels.includes('카드뉴스')) {
    candidates.add('card_news');
  }

  if (pathLabels.includes('웹 포스터') && pathLabels.includes('가로형')) {
    candidates.add('web_post_hor_poster');
    candidates.add('web_hor_poster');
  }

  if (pathLabels.includes('웹 포스터') && pathLabels.includes('세로형')) {
    candidates.add('web_post_ver_poster');
    candidates.add('web_ver_poster');
  }

  return candidates.values();
}

function buildTemplateSearchUrl(keyword, apiValue, item) {
  const params = new URLSearchParams();
  const apiValues = normalizeTemplateApiValues(apiValue);
  const purpose = getTemplatePurpose(item);
  const tier = getTemplateTier(item);
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
  params.set('pageSize', '1');
  params.set('domain', 'production');
  params.set('purpose', purpose);
  params.set('keyword', keyword);
  for (const value of apiValues) {
    params.append('templateTypeIdList', value);
  }
  return `${TEMPLATE_API_URL}?${params.toString()}`;
}

async function validateCandidate(keyword, apiValue, item) {
  const url = buildTemplateSearchUrl(keyword, apiValue, item);
  const headers = parseJsonObject(MIRICANVAS_API_HEADERS_JSON, 'MIRICANVAS_API_HEADERS_JSON');

  const response = await fetch(url, {
    method: MIRICANVAS_API_METHOD,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return {
    url,
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    data,
    rawText: text,
    success: response.ok && Array.isArray(data?.data?.list) && data.data.list.length > 0,
  };
}

function selectVerificationTargets() {
  return flattenTemplateItems(TEMPLATE_TYPE_MAP)
    .filter((item) => cleanText(item.value))
    .sort((a, b) => {
      const pathA = Array.isArray(a.pathLabels) ? a.pathLabels.join(' > ') : a.label;
      const pathB = Array.isArray(b.pathLabels) ? b.pathLabels.join(' > ') : b.label;
      return pathA.localeCompare(pathB, 'ko');
    });
}

async function verifyTemplateTypes(keyword) {
  const targets = selectVerificationTargets();
  const verified = {};
  const results = [];
  const failed = [];
  const validationCache = new Map();

  for (const item of targets) {
    const path = Array.isArray(item.pathLabels) ? item.pathLabels.join(' > ') : item.label;
    const displayLabel = path || item.label;
    const candidates = buildCandidatesForValue(item.value, item);
    let successResult = null;
    let lastFailure = null;

    for (const candidate of candidates) {
      const cacheKey = `${keyword}::${serializeCandidate(candidate)}`;
      let validation = validationCache.get(cacheKey);
      if (!validation) {
        validation = await validateCandidate(keyword, candidate, item);
        validationCache.set(cacheKey, validation);
        await delay(REQUEST_DELAY_MS);
      }

      if (validation.success) {
        successResult = {
          candidate,
          url: validation.url,
          status: validation.status,
        };
        verified[item.value] = candidate;
        break;
      }

      lastFailure = {
        candidate,
        url: validation.url,
        status: validation.status,
        statusText: validation.statusText,
        message: cleanText(validation?.data?.message || validation?.rawText),
      };
    }

    const baseResult = {
      label: item.label,
      displayLabel,
      value: item.value,
      group: item.group,
      purpose: getTemplatePurpose(item),
      tier: getTemplateTier(item),
      path,
      candidates,
    };

    if (successResult) {
      results.push({
        ...baseResult,
        verifiedApiValue: successResult.candidate,
        status: successResult.status,
        url: successResult.url,
      });
      console.log(`${displayLabel}: ${successResult.candidate} ✅`);
    } else {
      const failureResult = {
        ...baseResult,
        verifiedApiValue: null,
        lastFailure,
      };
      failed.push(failureResult);
      results.push(failureResult);
      console.log(`${displayLabel}: 실패 ❌`);
    }

  }

  return {
    generatedAt: new Date().toISOString(),
    keyword,
    templateApiUrl: TEMPLATE_API_URL,
    totalTargets: targets.length,
    verifiedCount: Object.keys(verified).length,
    failedCount: failed.length,
    verified,
    results,
    failed,
  };
}

async function main() {
  const keyword = cleanText(process.argv[2] || DEFAULT_KEYWORD);
  if (!keyword) {
    throw new Error('검증용 키워드를 입력하세요. 예: node src/verify-template-types.js 6월');
  }

  console.log('[verify-template-types] keyword=', keyword);
  const report = await verifyTemplateTypes(keyword);
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log('[verify-template-types] saved:', OUTPUT_PATH);
  console.log(
    '[verify-template-types] summary:',
    JSON.stringify({
      totalTargets: report.totalTargets,
      verifiedCount: report.verifiedCount,
      failedCount: report.failedCount,
    })
  );
}

main().catch((error) => {
  console.error('[verify-template-types:error]', error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
