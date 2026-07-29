import {
  PLATFORM_CONFIGS,
  getCurrentMonthNumber,
  getMonthLabel,
  getMonthTopic,
} from '../config/siteConfig.js';
import {
  getMiricanvasKeywordResult,
  getMiricanvasTemplateResult,
} from '../services/miricanvas.js';
import {
  getMonthlyRankingResult,
  logSearchEvent,
} from '../services/supabase.js';
import {
  getTooldiKeywordResult,
  getTooldiTemplateResult,
} from '../services/tooldi.js';
import { sanitizeKeywords } from '../utils/keywords.js';
import {
  htmlPage,
  renderAboutPage,
  renderCalendarPage,
  renderContactPage,
  renderFaqPage,
  renderHomePage,
  renderKeywordAnalysisPage,
  renderMonthlyTopics,
  renderPlatformPage,
  renderPrivacyPage,
  renderRankingsPage,
  renderTemplateAnalysisPage,
  renderTermsPage,
  renderUpdatesPage,
} from '../views/html.js';
import {
  getPageMeta,
  getPlatformConfigForPage,
  getPlatformConfigFromPath,
  parseMonthFromPath,
} from './pageMeta.js';

function cleanText(value) {
  return String(value ?? '').trim();
}

function getOptionLabel(options, value) {
  const normalizedValue = cleanText(value);
  const option = (Array.isArray(options) ? options : []).find((item) => (
    cleanText(typeof item === 'string' ? item : item?.value) === normalizedValue
  ));
  return cleanText(typeof option === 'string' ? option : option?.label)
    || normalizedValue;
}

function getContentTypeLogValue(config, value) {
  const inputValue = cleanText(value);
  const option = (Array.isArray(config?.contentTypeOptions)
    ? config.contentTypeOptions
    : []).find((item) => (
    cleanText(item?.inputValue ?? item?.label ?? item?.value) === inputValue
  ));

  return {
    value: cleanText(option?.value) || inputValue,
    label: cleanText(option?.label) || inputValue,
  };
}

async function logSuccessfulSearch({ config, feature, result, requestId }) {
  const query = cleanText(result?.query);
  if (!query) return;

  const isTemplate = feature === 'template';
  const contentType = getContentTypeLogValue(config, result?.contentType);

  try {
    await logSearchEvent({
      platform: config.id,
      feature,
      query,
      typeValue: isTemplate
        ? cleanText(result?.templateTypeId)
        : contentType.value,
      typeLabel: isTemplate
        ? getOptionLabel(
            config?.templateSearchOptions?.contentTypes,
            result?.templateTypeId,
          )
        : contentType.label,
      requestId,
    });
  } catch (error) {
    console.error('Failed to save search log:', error?.message || String(error));
  }
}

function sanitizeKeywordResult(result) {
  if (!result) return null;
  const keywords = sanitizeKeywords(result?.keywords);
  return {
    ...result,
    keywords,
    recommendedCount: keywords.length,
  };
}

async function getKeywordResult(config, searchParams) {
  const input = {
    keyword: searchParams.get('q'),
    contentType: searchParams.get('contentType'),
  };

  if (config.id === 'miricanvas') return getMiricanvasKeywordResult(input);
  if (config.id === 'tooldi') return getTooldiKeywordResult(input);
  return null;
}


async function getPopularSearches(config, feature) {
  try {
    const rankingResult = await getMonthlyRankingResult(config);
    const rows = feature === 'template'
      ? rankingResult?.template?.topQueries
      : rankingResult?.keyword?.topQueries;

    return (Array.isArray(rows) ? rows : [])
      .map((item) => cleanText(item?.label ?? item?.query ?? item))
      .filter(Boolean)
      .slice(0, 3);
  } catch (error) {
    console.error(
      'Failed to load popular searches:',
      error?.message || String(error),
    );
    return [];
  }
}

function renderStaticContentPage(pathname, origin, activeMenu, renderer) {
  return htmlPage(pathname, origin, {
    activeMenu,
    ...getPageMeta(pathname),
    contentHtml: renderer(),
  });
}

async function renderTemplatePage(pathname, origin, requestUrl) {
  const isTooldi = pathname === '/tooldi/template';
  const config = isTooldi
    ? PLATFORM_CONFIGS.tooldi
    : PLATFORM_CONFIGS.miricanvas;
  const defaultTemplateTypeId =
    config.templateSearchOptions.contentTypes[0]?.value
    || (isTooldi ? 'all' : '');
  const input = {
    keyword: requestUrl.searchParams.get('q'),
    templateTypeId:
      requestUrl.searchParams.get('contentType')
      || defaultTemplateTypeId,
  };
  const result = isTooldi
    ? await getTooldiTemplateResult(input)
    : await getMiricanvasTemplateResult(input);

  await logSuccessfulSearch({
    config,
    feature: 'template',
    result,
    requestId: requestUrl.searchParams.get('requestId'),
  });

  const sanitizedResult = sanitizeKeywordResult(result);
  const popularSearches = sanitizedResult
    ? []
    : await getPopularSearches(config, 'template');

  return htmlPage(pathname, origin, {
    activeMenu: config.id,
    ...getPageMeta(pathname),
    contentHtml: renderTemplateAnalysisPage(
      config,
      sanitizedResult,
      { popularSearches },
    ),
  });
}

export async function renderPage(pathname, origin, requestUrl) {
  const aliases = {
    '/tag': '/miricanvas/tag',
    '/result': '/miricanvas/tag',
    '/template': '/miricanvas/template',
  };
  if (aliases[pathname]) {
    return renderPage(aliases[pathname], origin, requestUrl);
  }

  if (pathname === '/') {
    return renderStaticContentPage(pathname, origin, 'home', renderHomePage);
  }
  if (pathname === '/calendar') {
    return renderStaticContentPage(pathname, origin, 'calendar', renderCalendarPage);
  }
  if (pathname === '/faq') {
    return renderStaticContentPage(pathname, origin, 'faq', renderFaqPage);
  }
  if (pathname === '/updates') {
    return renderStaticContentPage(pathname, origin, 'updates', renderUpdatesPage);
  }
  if (pathname === '/about') {
    return renderStaticContentPage(pathname, origin, 'about', renderAboutPage);
  }
  if (pathname === '/privacy' || pathname === '/privacy-policy') {
    return renderStaticContentPage(pathname, origin, 'privacy', renderPrivacyPage);
  }
  if (pathname === '/terms' || pathname === '/terms-of-service') {
    return renderStaticContentPage(pathname, origin, 'terms', renderTermsPage);
  }
  if (pathname === '/contact') {
    return renderStaticContentPage(pathname, origin, 'contact', renderContactPage);
  }

  if (pathname.startsWith('/calendar/')) {
    const month = parseMonthFromPath(pathname)
      || Number(getCurrentMonthNumber());
    const monthData = getMonthTopic(month);
    return htmlPage(pathname, origin, {
      activeMenu: 'calendar',
      ...getPageMeta(pathname),
      contentHtml: renderMonthlyTopics({
        month,
        monthData,
        title: `${getMonthLabel(month)} 추천 소재`,
        description: '이번 달 스톡 작업에 활용하기 좋은 대표 소재를 확인하세요.',
        showNavigation: true,
      }),
    });
  }

  const platformConfig = getPlatformConfigFromPath(pathname);
  if (platformConfig) {
    return htmlPage(pathname, origin, {
      activeMenu: platformConfig.id,
      ...getPageMeta(pathname),
      contentHtml: renderPlatformPage(platformConfig),
    });
  }

  const keywordPlatformConfig = getPlatformConfigForPage(pathname, 'tag');
  if (keywordPlatformConfig) {
    const result = sanitizeKeywordResult(
      await getKeywordResult(keywordPlatformConfig, requestUrl.searchParams),
    );
    await logSuccessfulSearch({
      config: keywordPlatformConfig,
      feature: 'keyword',
      result,
      requestId: requestUrl.searchParams.get('requestId'),
    });
    const popularSearches = result
      ? []
      : await getPopularSearches(keywordPlatformConfig, 'keyword');

    return htmlPage(pathname, origin, {
      activeMenu: keywordPlatformConfig.id,
      ...getPageMeta(pathname),
      contentHtml: renderKeywordAnalysisPage(
        keywordPlatformConfig,
        result,
        { popularSearches },
      ),
    });
  }

  const rankingPlatformConfig = getPlatformConfigForPage(pathname, 'rankings');
  if (rankingPlatformConfig) {
    return htmlPage(pathname, origin, {
      activeMenu: rankingPlatformConfig.id,
      ...getPageMeta(pathname),
      contentHtml: renderRankingsPage(
        rankingPlatformConfig,
        await getMonthlyRankingResult(rankingPlatformConfig),
      ),
    });
  }

  if (pathname === '/miricanvas/template' || pathname === '/tooldi/template') {
    return renderTemplatePage(pathname, origin, requestUrl);
  }

  return htmlPage(pathname, origin, {
    activeMenu: 'home',
    title: '페이지를 찾을 수 없습니다',
    description: '요청하신 페이지를 찾을 수 없습니다.',
    contentHtml: renderHomePage(),
  });
}
