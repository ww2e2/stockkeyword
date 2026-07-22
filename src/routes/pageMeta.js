import {
  PLATFORM_CONFIGS,
  getCurrentMonthNumber,
  getMonthLabel,
  getStockWorkPeriod,
} from '../config/siteConfig.js';

export function parseMonthFromPath(pathname) {
  const match = String(pathname || '').match(/^\/calendar\/(\d{1,2})$/);
  return match ? Number(match[1]) : null;
}

export function getPlatformConfigFromPath(pathname) {
  const platformId = String(pathname || '').replace(/^\//, '');
  return platformId && !platformId.includes('/')
    ? PLATFORM_CONFIGS[platformId] || null
    : null;
}

export function getPlatformConfigForPage(pathname, pageName) {
  const match = String(pathname || '').match(/^\/([^/]+)\/([^/]+)$/);
  if (!match || match[2] !== pageName) return null;
  return PLATFORM_CONFIGS[match[1]] || null;
}

export function getPageMeta(pathname, date = new Date()) {
  if (pathname === '/') {
    return {
      title: 'StockKeyword | 홈',
      description: '스톡 작가를 위한 키워드와 월별 소재를 정리합니다.',
    };
  }

  const platformConfig = getPlatformConfigFromPath(pathname);
  if (platformConfig) {
    return {
      title: `${platformConfig.name} | 기능 선택 | StockKeyword`,
      topbarTitle: platformConfig.name,
      description: platformConfig.description,
    };
  }

  if (pathname === '/calendar' || pathname.startsWith('/calendar/')) {
    if (pathname === '/calendar') {
      const { currentMonth, targetMonth } = getStockWorkPeriod(date);
      return {
        title: '월별 작업 캘린더 | StockKeyword',
        topbarTitle: `${getMonthLabel(targetMonth)} | 월별 작업 캘린더`,
        description: `${getMonthLabel(currentMonth)}에는 ${getMonthLabel(targetMonth)} 스톡 소재를 미리 준비해보세요.`,
      };
    }

    const month = parseMonthFromPath(pathname)
      || Number(getCurrentMonthNumber(date));
    return {
      title: `${getMonthLabel(month)} 추천 소재 | 월별 작업 캘린더 | StockKeyword`,
      topbarTitle: `${getMonthLabel(month)} | 월별 작업 캘린더`,
      description: `${getMonthLabel(month)} 스톡 작업에 활용하기 좋은 소재를 확인하세요.`,
    };
  }

  const staticMeta = {
    '/faq': {
      title: 'FAQ | StockKeyword',
      description: 'StockKeyword의 키워드 추천 방식과 플랫폼별 분석 기능을 확인하세요.',
    },
    '/updates': {
      title: '업데이트 | StockKeyword',
      topbarTitle: '업데이트',
      description: 'StockKeyword의 새로운 기능과 서비스 변경 내용을 확인하세요.',
    },
    '/about': {
      title: '소개 | StockKeyword',
      topbarTitle: '서비스 소개 | StockKeyword',
      description: '스톡 작가를 위한 키워드·템플릿 리서치 도구 StockKeyword를 소개합니다.',
    },
    '/privacy': {
      title: '개인정보처리방침 | StockKeyword',
      description: 'StockKeyword의 개인정보 처리와 이용 기록 관리 기준을 안내합니다.',
    },
    '/privacy-policy': {
      title: '개인정보처리방침 | StockKeyword',
      description: 'StockKeyword의 개인정보 처리와 이용 기록 관리 기준을 안내합니다.',
    },
    '/terms': {
      title: '이용약관 | StockKeyword',
      description: 'StockKeyword의 서비스 이용 조건과 운영 기준을 안내합니다.',
    },
    '/terms-of-service': {
      title: '이용약관 | StockKeyword',
      description: 'StockKeyword의 서비스 이용 조건과 운영 기준을 안내합니다.',
    },
    '/contact': {
      title: '문의 | StockKeyword',
      description: 'StockKeyword 오류 제보, 기능 제안과 제휴 문의 방법을 안내합니다.',
    },
  };

  if (staticMeta[pathname]) return staticMeta[pathname];

  const keywordPlatformConfig = getPlatformConfigForPage(pathname, 'tag');
  if (keywordPlatformConfig) {
    return {
      title: `${keywordPlatformConfig.name} | 키워드 분석 | StockKeyword`,
      topbarTitle: keywordPlatformConfig.keywordPageTitle,
      description: keywordPlatformConfig.keywordPageDescription,
    };
  }

  const rankingPlatformConfig = getPlatformConfigForPage(pathname, 'rankings');
  if (rankingPlatformConfig) {
    return {
      title: `${rankingPlatformConfig.name} | 월간 인기 검색 순위 | StockKeyword`,
      topbarTitle: '이번 달 인기 검색 순위',
      description: `${rankingPlatformConfig.name}의 이번 달 검색 흐름을 확인합니다.`,
    };
  }

  if (pathname === '/miricanvas/template') {
    return {
      title: '미리캔버스 | 템플릿 분석 | StockKeyword',
      topbarTitle: '템플릿 분석',
      description: '미리캔버스 템플릿의 제목과 구성 패턴을 분석합니다',
    };
  }

  if (pathname === '/tooldi/template') {
    return {
      title: '툴디 | 템플릿 분석 | StockKeyword',
      topbarTitle: '템플릿 분석',
      description: '툴디 템플릿의 기획 키워드와 제목 패턴을 분석합니다',
    };
  }

  const platformFallbacks = [
    ['miricanvas', '미리캔버스'],
    ['crowdpic', '크라우드픽'],
    ['tooldi', '툴디'],
  ];
  const fallback = platformFallbacks.find(([id]) => pathname.startsWith(`/${id}`));
  if (fallback) {
    return {
      title: `${fallback[1]} | StockKeyword`,
      description: `${fallback[1]} 전용 분석 화면입니다.`,
    };
  }

  return {
    title: 'StockKeyword',
    description: '스톡 작가를 위한 분석 도구입니다.',
  };
}
