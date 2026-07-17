import { MONTHLY_TOPICS } from './monthlyTopics.js';

export const SITE_INFO = {
  serviceName: 'StockKeyword',
  siteUrl: 'https://www.stockkeyword.com',
  contactEmail: 'contact@stockkeyword.com',
  policyEffectiveDate: '2026-07-13',
};

export const PLATFORM_CONFIGS = {
  miricanvas: {
    contentTypeOptions: [
      { value: 'element', label: '요소', inputValue: '요소' },
      { value: 'photo', label: '사진', inputValue: '사진' },
      { value: 'background', label: '배경', inputValue: '배경' },
    ],
    id: 'miricanvas',
    name: '미리캔버스',
    description: '검색 · 템플릿 · 월간 흐름을 한눈에 필요한 정보만 빠르게 확인합니다.',
    keywordPageTitle: '키워드 분석',
    keywordPageDescription: '미리캔버스에서 실시간으로 키워드를 추출합니다',
    rankingFeatures: { keyword: true, template: true },
    features: [
      { title: '키워드 분석', href: '/miricanvas/tag', description: '검색에서 실시간 키워드를 추출합니다.' },
      { title: '템플릿 분석', href: '/miricanvas/template', description: '템플릿 흐름과 제목 패턴을 확인합니다.' },
      { title: '이번 달 인기 검색 순위', href: '/miricanvas/rankings', description: '이번 달 누적 검색 흐름을 봅니다.' },
    ],
    searchOptions: {
      placeholder: '예) 테니스',
      buttonLabel: '분석하기',
      contentTypeLabel: '요소',
      contentTypes: ['요소', '사진', '배경'],
    },
    templateSearchOptions: {
      placeholder: '예) 여름 여행',
      buttonLabel: '분석하기',
      contentTypes: [
        { label: '카드뉴스', value: 'card_news' },
        { label: '프레젠테이션', value: 'presentation' },
        { label: '유튜브 썸네일', value: 'youtube_thumb' },
        { label: '유튜브 채널 아트', value: 'youtube_cover' },
        { label: '상세페이지', value: 'detail_page' },
        { label: '포스터 세로형', value: 'web_post_ver_poster' },
        { label: '포스터 가로형', value: 'web_post_hor_poster' },
      ],
    },
  },
  crowdpic: {
    contentTypeOptions: [
      { value: 'all', label: '전체', inputValue: '전체' },
      { value: 'photo', label: '사진', inputValue: '사진' },
      { value: 'graphic', label: '일러스트', inputValue: '일러스트' },
      { value: 'calli', label: '캘리그라피', inputValue: '캘리그라피' },
      { value: 'icon', label: '아이콘', inputValue: '아이콘' },
      { value: 'mockup', label: '목업', inputValue: '목업' },
    ],
    id: 'crowdpic',
    name: '크라우드픽',
    description: '크라우드픽에 필요한 분석 기능을 빠르게 확인합니다.',
    keywordPageTitle: '키워드 분석',
    keywordPageDescription: '크라우드픽에서 실시간으로 키워드를 추출합니다',
    rankingFeatures: { keyword: true, template: false },
    features: [
      { title: '키워드 분석', href: '/crowdpic/tag', description: '크라우드픽 결과를 분석합니다.' },
      { title: '이번 달 인기 검색 순위', href: '/crowdpic/rankings', description: '이번 달 검색 흐름을 확인합니다.' },
    ],
    searchOptions: {
      placeholder: '예) 여행',
      buttonLabel: '분석하기',
      contentTypeLabel: '카테고리',
      contentTypes: ['전체', '사진', '일러스트', '캘리그라피', '아이콘', '목업'],
    },
  },
  tooldi: {
    contentTypeOptions: [
      { value: 'all', label: '전체', inputValue: '전체' },
      { value: 'element', label: '요소', inputValue: 'shape' },
      { value: 'photo', label: '사진', inputValue: 'picture' },
      { value: 'background', label: '배경', inputValue: 'background' },
    ],
    id: 'tooldi',
    name: '툴디',
    description: '툴디에 필요한 분석 기능을 빠르게 확인합니다.',
    keywordPageTitle: '키워드 분석',
    keywordPageDescription: '툴디에서 실시간으로 키워드를 추출합니다',
    rankingFeatures: { keyword: true, template: true },
    features: [
      { title: '키워드 분석', href: '/tooldi/tag', description: '툴디 추출 결과를 분석합니다.' },
      { title: '템플릿 분석', href: '/tooldi/template', description: '유료 템플릿의 기획 키워드와 제목을 분석합니다.' },
      { title: '이번 달 인기 검색 순위', href: '/tooldi/rankings', description: '툴디 검색 흐름을 확인합니다.' },
    ],
    searchOptions: {
      placeholder: '\uC608) \uBA85\uC808',
      buttonLabel: '\uBD84\uC11D\uD558\uAE30',
      contentTypeLabel: '\uCE74\uD14C\uACE0\uB9AC',
      contentTypes: [
        { label: '\uC0AC\uC9C4', value: 'picture' },
        { label: '\uC694\uC18C', value: 'shape' },
        { label: '\uBC30\uACBD', value: 'background' },
      ],
    },
    templateSearchOptions: {
      placeholder: '예) 명절',
      buttonLabel: '분석하기',
      contentTypeLabel: '템플릿 유형',
      contentTypes: [
        { label: '모든 템플릿', value: 'all' },
      ],
    },
  },
};

export const PLATFORM_MENU = [
  { key: 'home', label: '홈', href: '/' },
  { key: 'miricanvas', label: '미리캔버스', href: '/miricanvas' },
  { key: 'crowdpic', label: '크라우드픽', href: '/crowdpic' },
  { key: 'tooldi', label: '툴디', href: '/tooldi' },
  { key: 'calendar', label: '월별 작업 캘린더', href: '/calendar' },
];

export { MONTHLY_TOPICS };
export function getMonthTopic(month) {
  const monthNumber = Number(month);
  return MONTHLY_TOPICS[monthNumber] || MONTHLY_TOPICS[1];
}

export function getStockWorkPeriod(date = new Date()) {
  const koreaDateParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date);
  const currentYear = Number(
    koreaDateParts.find((part) => part.type === 'year')?.value,
  );
  const currentMonth = Number(
    koreaDateParts.find((part) => part.type === 'month')?.value,
  );
  const targetDate = new Date(Date.UTC(currentYear, currentMonth + 1, 1));

  return {
    currentYear,
    currentMonth,
    targetYear: targetDate.getUTCFullYear(),
    targetMonth: targetDate.getUTCMonth() + 1,
  };
}

export function getCurrentMonthNumber(date = new Date()) {
  return String(getStockWorkPeriod(date).currentMonth);
}

export function getMonthLabel(month) {
  return `${Number(month)}월`;
}
