import { PLATFORM_CONFIGS, getCurrentMonthNumber, getMonthLabel, getMonthTopic } from './config/siteConfig.js';
import { getStockWorkPeriod } from './config/siteConfig.js';
import {
  buildRobotsTxt,
  buildSitemapXml,
  serveAdsTxt,
  serveFaviconAsset,
} from './routes/static.js';
import {
  htmlPage,
  renderAboutPage,
  renderCalendarPage,
  renderContactPage,
  renderFaqPage,
  renderHomePage,
  renderKeywordAnalysisPage,
  renderPrivacyPage,
  renderTemplateAnalysisPage,
  renderMonthlyTopics,
  renderPlatformPage,
  renderRankingsPage,
  renderTermsPage,
} from './views/html.js';
import { getMiricanvasKeywordResult, getMiricanvasTemplateResult } from './services/miricanvas.js';
import { getCrowdpicKeywordResult } from './services/crowdpic.js';
import { getTooldiKeywordResult, getTooldiTemplateResult } from './services/tooldi.js';
import { sanitizeKeywords } from './utils/keywords.js';
import { getMonthlyRankingResult, logSearchEvent } from './services/supabase.js';

function cleanText(value) {
  return String(value ?? '').trim();
}


function getOptionLabel(options, value) {
  const normalizedValue = cleanText(value);
  const option = (Array.isArray(options) ? options : []).find((item) => (
    cleanText(typeof item === 'string' ? item : item?.value) === normalizedValue
  ));
  return cleanText(typeof option === 'string' ? option : option?.label) || normalizedValue;
}

function getContentTypeLogValue(config, value) {
  const inputValue = cleanText(value);
  const option = (Array.isArray(config?.contentTypeOptions) ? config.contentTypeOptions : []).find((item) => (
    cleanText(item?.inputValue ?? item?.label ?? item?.value) === inputValue
  ));

  return {
    value: cleanText(option?.value) || inputValue,
    label: cleanText(option?.label) || inputValue,
  };
}

async function logSuccessfulSearch({ config, feature, result }) {
  const query = cleanText(result?.query);
  if (!query) return;

  const isTemplate = feature === 'template';
  const contentType = getContentTypeLogValue(config, result?.contentType);
  try {
    await logSearchEvent({
      platform: config.id,
      feature,
      query,
      typeValue: isTemplate ? cleanText(result?.templateTypeId) : contentType.value,
      typeLabel: isTemplate
        ? getOptionLabel(config?.templateSearchOptions?.contentTypes, result?.templateTypeId)
        : contentType.label,
    });
  } catch (error) {
    console.error('Failed to save search log:', error?.message || String(error));
  }
}

function parseMonthFromPath(pathname) {
  const match = pathname.match(/^\/calendar\/(\d{1,2})$/);
  return match ? Number(match[1]) : null;
}

function getPlatformConfigFromPath(pathname) {
  const platformId = String(pathname || '').replace(/^\//, '');
  return platformId && !platformId.includes('/')
    ? PLATFORM_CONFIGS[platformId] || null
    : null;
}

function getPlatformConfigForPage(pathname, pageName) {
  const match = String(pathname || '').match(/^\/([^/]+)\/([^/]+)$/);
  if (!match || match[2] !== pageName) {
    return null;
  }

  return PLATFORM_CONFIGS[match[1]] || null;
}

export function getPageMeta(pathname, date = new Date()) {
  if (pathname === '/') {
    return { title: 'StockKeyword | 홈', description: '스톡 작가를 위한 키워드와 월별 소재를 정리합니다.' };
  }
  const platformConfig = getPlatformConfigFromPath(pathname);
  if (platformConfig) {
    return {
      title: platformConfig.name,
      description: platformConfig.description,
    };
  }
  if (pathname === '/calendar' || pathname.startsWith('/calendar/')) {
    if (pathname === '/calendar') {
      const { currentMonth, targetMonth } = getStockWorkPeriod(date);
      return {
        title: `${getMonthLabel(targetMonth)} | 월별 작업 캘린더`,
        description: `${getMonthLabel(currentMonth)}에는 ${getMonthLabel(targetMonth)} 스톡 소재를 미리 준비해보세요.`,
      };
    }

    const month = parseMonthFromPath(pathname) || Number(getCurrentMonthNumber());
    return { title: `${getMonthLabel(month)} | 월별 작업 캘린더`, description: `${getMonthLabel(month)} 스톡 작업에 활용하기 좋은 소재를 확인하세요.` };
  }

  if (pathname === '/faq') {
    return {
      title: 'FAQ | StockKeyword',
      description: 'StockKeyword의 키워드 추천 방식과 플랫폼별 분석 기능을 확인하세요.',
    };
  }

  if (pathname === '/about') {
    return {
      title: '서비스 소개 | StockKeyword',
      description: '스톡 작가를 위한 키워드·템플릿 리서치 도구 StockKeyword를 소개합니다.',
    };
  }

  if (pathname === '/privacy' || pathname === '/privacy-policy') {
    return {
      title: '개인정보처리방침 | StockKeyword',
      description: 'StockKeyword의 개인정보 처리와 이용 기록 관리 기준을 안내합니다.',
    };
  }

  if (pathname === '/terms' || pathname === '/terms-of-service') {
    return {
      title: '이용약관 | StockKeyword',
      description: 'StockKeyword의 서비스 이용 조건과 운영 기준을 안내합니다.',
    };
  }

  if (pathname === '/contact') {
    return {
      title: '문의 | StockKeyword',
      description: 'StockKeyword 오류 제보, 기능 제안과 제휴 문의 방법을 안내합니다.',
    };
  }


  const keywordPlatformConfig = getPlatformConfigForPage(pathname, 'tag');
  if (keywordPlatformConfig) {
    return {
      title: keywordPlatformConfig.keywordPageTitle,
      description: keywordPlatformConfig.keywordPageDescription,
    };
  }

  const rankingPlatformConfig = getPlatformConfigForPage(pathname, 'rankings');
  if (rankingPlatformConfig) {
    return {
      title: '\uC774\uBC88 \uB2EC \uC778\uAE30 \uAC80\uC0C9 \uC21C\uC704',
      description: rankingPlatformConfig.name + '\uC758 \uC774\uBC88 \uB2EC \uAC80\uC0C9 \uD750\uB984\uC744 \uD655\uC778\uD569\uB2C8\uB2E4.',
    };
  }

  if (pathname === '/miricanvas/template') {
    return {
      title: '템플릿 분석',
      description: '미리캔버스 템플릿의 제목과 구성 패턴을 분석합니다',
    };
  }

  if (pathname === '/tooldi/template') {
    return {
      title: '템플릿 분석',
      description: '툴디 템플릿의 기획 키워드와 제목 패턴을 분석합니다',
    };
  }

  if (pathname.startsWith('/miricanvas')) {
    return { title: '미리캔버스 | StockKeyword', description: '미리캔버스 전용 분석 화면입니다.' };
  }

  if (pathname.startsWith('/crowdpic')) {
    return { title: '크라우드픽 | StockKeyword', description: '크라우드픽 전용 분석 화면입니다.' };
  }

  if (pathname.startsWith('/tooldi')) {
    return { title: '툴디 | StockKeyword', description: '툴디 전용 분석 화면입니다.' };
  }

  return { title: 'StockKeyword', description: '스톡 작가를 위한 분석 도구입니다.' };
}

function getSampleKeywordResult(pathname, searchParams) {
  const requestedQuery = cleanText(searchParams.get('q'));


  const query = requestedQuery || (pathname === '/crowdpic/tag' ? '여행' : '명절');


  if (pathname === '/crowdpic/tag') {
    return {
      query,
      keywords: ['여행', '여행 사진', '휴가', '풍경', '해변', '가족 여행', '비행기', '호텔', '렌터카', '캐리어', '바다', '일몰'],
      recommendedCount: 12,
      collectedAt: '2026-07-08',
    };
  }

  return {
    query,
    keywords: ['명절', '한복', '선물', '가족', '전통', '추석', '설날', '차례', '송편', '복주머니'],
    recommendedCount: 10,
    collectedAt: '2026-07-08',
  };
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

async function renderPage(pathname, origin, requestUrl) {
  if (pathname === '/tag') {
    return renderPage('/miricanvas/tag', origin, requestUrl);
  }

  if (pathname === '/result') {
    return renderPage('/miricanvas/tag', origin, requestUrl);
  }

  if (pathname === '/template') {
    return renderPage('/miricanvas/template', origin, requestUrl);
  }

  if (pathname === '/') {
    return htmlPage(pathname, origin, {
      activeMenu: 'home',
      ...getPageMeta(pathname),
      contentHtml: renderHomePage(),
    });
  }

  if (pathname === '/calendar') {
    return htmlPage(pathname, origin, {
      activeMenu: 'calendar',
      ...getPageMeta(pathname),
      contentHtml: renderCalendarPage(),
    });
  }

  if (pathname === '/faq') {
    return htmlPage(pathname, origin, {
      activeMenu: 'faq',
      ...getPageMeta(pathname),
      contentHtml: renderFaqPage(),
    });
  }

  if (pathname === '/about') {
    return htmlPage(pathname, origin, {
      activeMenu: 'about',
      ...getPageMeta(pathname),
      contentHtml: renderAboutPage(),
    });
  }

  if (pathname === '/privacy' || pathname === '/privacy-policy') {
    return htmlPage(pathname, origin, {
      activeMenu: 'privacy',
      ...getPageMeta(pathname),
      contentHtml: renderPrivacyPage(),
    });
  }

  if (pathname === '/terms' || pathname === '/terms-of-service') {
    return htmlPage(pathname, origin, {
      activeMenu: 'terms',
      ...getPageMeta(pathname),
      contentHtml: renderTermsPage(),
    });
  }

  if (pathname === '/contact') {
    return htmlPage(pathname, origin, {
      activeMenu: 'contact',
      ...getPageMeta(pathname),
      contentHtml: renderContactPage(),
    });
  }


  if (pathname.startsWith('/calendar/')) {
    const month = parseMonthFromPath(pathname) || Number(getCurrentMonthNumber());
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
    const rawResult = keywordPlatformConfig.id === 'miricanvas'
      ? await getMiricanvasKeywordResult({
          keyword: requestUrl.searchParams.get('q'),
          contentType: requestUrl.searchParams.get('contentType'),
        })
      : keywordPlatformConfig.id === 'crowdpic'
        ? await getCrowdpicKeywordResult({
            keyword: requestUrl.searchParams.get('q'),
            contentType: requestUrl.searchParams.get('contentType'),
          })
        : keywordPlatformConfig.id === 'tooldi'
          ? await getTooldiKeywordResult({ keyword: requestUrl.searchParams.get('q'), contentType: requestUrl.searchParams.get('contentType') })
          : getSampleKeywordResult(pathname, requestUrl.searchParams);
    const result = sanitizeKeywordResult(rawResult);
    await logSuccessfulSearch({
      config: keywordPlatformConfig,
      feature: 'keyword',
      result,
    });
    return htmlPage(pathname, origin, {
      activeMenu: keywordPlatformConfig.id,
      ...getPageMeta(pathname),
      contentHtml: renderKeywordAnalysisPage(keywordPlatformConfig, result),
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

  if (pathname === '/tooldi/template') {
    const config = PLATFORM_CONFIGS.tooldi;
    const defaultTemplateTypeId =
      config.templateSearchOptions.contentTypes[0]?.value || 'all';

    const result = await getTooldiTemplateResult({
      keyword: requestUrl.searchParams.get('q'),
      templateTypeId:
        requestUrl.searchParams.get('contentType')
        || defaultTemplateTypeId,
    });

    await logSuccessfulSearch({
      config,
      feature: 'template',
      result,
    });

    return htmlPage(pathname, origin, {
      activeMenu: 'tooldi',
      ...getPageMeta(pathname),
      contentHtml: renderTemplateAnalysisPage(
        config,
        sanitizeKeywordResult(result),
      ),
    });
  }

  if (pathname === '/miricanvas/template') {
    const config = PLATFORM_CONFIGS.miricanvas;
    const defaultTemplateTypeId = config.templateSearchOptions.contentTypes[0]?.value;
    const result = await getMiricanvasTemplateResult({
      keyword: requestUrl.searchParams.get('q'),
      templateTypeId: requestUrl.searchParams.get('contentType') || defaultTemplateTypeId,
    });
    await logSuccessfulSearch({
      config,
      feature: 'template',
      result,
    });
    return htmlPage(pathname, origin, {
      activeMenu: 'miricanvas',
      ...getPageMeta(pathname),
      contentHtml: renderTemplateAnalysisPage(config, sanitizeKeywordResult(result)),
    });
  }

  if (pathname === '/miricanvas/template') {
    const key = pathname.split('/')[1];
    const config = PLATFORM_CONFIGS[key];
    return htmlPage(pathname, origin, {
      activeMenu: key,
      ...getPageMeta(pathname),
      contentHtml: renderPlatformPage(config),
    });
  }

  return htmlPage(pathname, origin, {
    activeMenu: 'home',
    title: '페이지를 찾을 수 없습니다',
    description: '요청하신 페이지를 찾을 수 없습니다.',
    contentHtml: renderHomePage(),
  });
}

export async function requestHandler(req, res) {
  try {
    const protocol = cleanText(req.headers['x-forwarded-proto']) || 'http';
    const host = cleanText(req.headers.host) || 'localhost';
    const requestUrl = new URL(req.url, `${protocol}://${host}`);
    if (req.method === 'GET' && requestUrl.pathname === '/ads.txt') {
      if (!serveAdsTxt(res)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('not found');
      }
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(buildRobotsTxt(requestUrl.origin));
      return;
    }


    if (req.method === 'GET' && requestUrl.pathname === '/sitemap.xml') {
      res.writeHead(200, {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      });
      res.end(buildSitemapXml(requestUrl.origin));
      return;
    }

    if (req.method === 'GET' && serveFaviconAsset(requestUrl.pathname, res)) {
      return;
    }

    if (req.method === 'GET') {
      const content = await renderPage(requestUrl.pathname, requestUrl.origin, requestUrl);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found');
    return;
  } catch (error) {
    console.error('Request failed:', error?.message || String(error));

    if (!res.headersSent && !res.writableEnded) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: error?.message || String(error) }));
    }
  }
}

export default requestHandler;
