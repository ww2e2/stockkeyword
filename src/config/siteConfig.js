export const MIRICANVAS_CATEGORY_OPTIONS = [
  { value: 'element', label: '요소' },
  { value: 'photo', label: '사진' },
  { value: 'background', label: '배경' },
];

export const MIRICANVAS_CATEGORY_TYPE_MAP = {
  element: [
    'ILLUST',
    'BITMAP',
    'FIGURE',
    'LINE',
    'ANI',
    'ELEMENT_COLLECTION',
    'DESIGNRESOURCE_COLLECTION',
    'FRAME',
    'PRESET_FRAME',
    'MOCKUP_GRID',
    'MOCKUP_TEXT',
    'CHART',
    'EXTERNAL_ILLUST',
    'EXTERNAL_BITMAP',
    'EXTERNAL_ANI',
  ],
  photo: ['PICTURE'],
  background: ['BACKGROUND_PICTURE'],
};

export const MIRICANVAS_CATEGORY_LABEL_MAP = {
  element: '요소',
  photo: '사진',
  background: '배경',
};

export const TEMPLATE_FILTER_TABS = [
  { key: 'all', label: '전체' },
  { key: 'photo', label: '사진' },
  { key: 'video', label: '동영상' },
  { key: 'print', label: '인쇄' },
];

export const TEMPLATE_RESULT_TABS = [
  { key: 'titleKeywords', label: '제목 키워드' },
  { key: 'pageCount', label: '페이지 수' },
  { key: 'topTitles', label: '상위 제목' },
];

export const TEMPLATE_PURPOSE_BY_GROUP = {
  photo: 'WEB',
  video: 'VIDEO',
  print: 'PRINT',
};

export const DEFAULT_TEMPLATE_TIER = 'PREMIUM';
export const ADS_TXT_CONTENT = 'google.com, pub-3386559853644133, DIRECT, f08c47fec0942fa0';
export const SEARCH_PLATFORM = 'miricanvas';

export const HOME_FAQ_ITEMS = [
  {
    question: '이 서비스는 무엇인가요?',
    answer: '이 서비스는 스톡 작가와 디지털 크리에이터를 위한 분석 도구입니다. 스톡 콘텐츠와 템플릿 데이터를에서 키워드 분석과 템플릿 분석을 빠르게 확인할 수 있도록 구성되어 있습니다.',
  },
  {
    question: '어떤 플랫폼을 지원하나요?',
    answer: '현재는 미리캔버스와 크라우드픽 기능을 제공하고 있습니다. 플랫폼별 특성에 맞는 분석 기능을 같은 구조로 사용할 수 있도록 발전시키고 있습니다.',
  },
  {
    question: '키워드 분석은 어떤 기능인가요?',
    answer: '키워드 분석은 특정 키워드와 관련된 상위 콘텐츠를 분석해 가장 많이 사용되는 키워드를 추천하는 기능입니다. 업로드 전 키워드를 정리하거나 상위 노출용 키워드를 빠르게 확인할 때 유용합니다.',
  },
  {
    question: '이번달 인기 검색 순위는 무엇인가요?',
    answer: '이번달 인기 검색 순위는 최근 검색 데이터를 바탕으로 많이 찾는 키워드와 카테고리 흐름을 정리해 보여주는 기능입니다. 콘텐츠 제작 방향이나 업로드 주제를 정할 때 참고할 수 있습니다.',
  },
  {
    question: '스톡 작가에게 어떤 도움이 되나요?',
    answer: '스톡 작가에게 반복적으로 필요한 키워드 조사와 제목 패턴 확인 시간을 줄여줍니다. 이를 통해 콘텐츠 기획과 제작 효율을 높이고, 업로드 전략을 더 빠르게 세울 수 있습니다.',
  },
];

export const MIRICANVAS_FAQ_ITEMS = [
  {
    question: '미리캔버스 분석 도구는 무엇인가요?',
    answer: '미리캔버스에서 스톡 콘텐츠를 제작하는 크리에이터를 위해 만든 분석 도구 묶음입니다. 현재는 키워드 분석과 템플릿 분석 기능을 제공합니다.',
  },
  {
    question: '키워드 분석은 어떤 용도인가요?',
    answer: '실시간 상위 요소를 바탕으로 많이 사용되는 키워드를 빠르게 확인하는 용도입니다. 자주 쓰이는 키워드를 정리해 업로드 전략이나 키워드 설계에 활용할 수 있습니다.',
  },
  {
    question: '템플릿 분석은 어떤 용도인가요?',
    answer: '인기 템플릿의 제목 키워드와 상위 노출 패턴을 분석하는 도구입니다. 자주 노출되는 제목 패턴과 페이지 수를 참고해 콘텐츠 기획이나 템플릿 제작 방향을 잡는 데 도움이 됩니다.',
  },
  {
    question: '스톡 작가에게 어떤 도움이 되나요?',
    answer: '반복적인 조사 시간을 줄이고, 실제로 많이 보이는 키워드와 제목 패턴을 데이터 기반으로 빠르게 확인할 수 있습니다. 이를 통해 업로드 준비와 제작 방향 설정이 더 쉬워집니다.',
  },
];

export const STATIC_PAGE_CONTENT = {
  '/canva': {
    title: '캔바 분석 도구 | 스톡 크리에이터 분석 플랫폼',
    description: '캔바 분석 도구는 현재 준비중입니다.',
    content: `
      <section class="page-card stack">
        <h2>현재 준비중입니다.</h2>
        <p>캔바 분석 도구는 현재 준비중입니다.</p>
      </section>
    `,
  },
  '/adobe-stock': {
    title: '어도비 스톡 분석 도구 | 스톡 크리에이터 분석 플랫폼',
    description: '어도비 스톡 분석 도구는 현재 준비중입니다.',
    content: `
      <section class="page-card stack">
        <h2>현재 준비중입니다.</h2>
        <p>어도비 스톡 분석 도구는 현재 준비중입니다.</p>
      </section>
    `,
  },
  '/about': {
    title: '서비스 소개 | 스톡 크리에이터 분석 플랫폼',
    description: '스톡 크리에이터를 위한 분석 도구 서비스 소개 페이지입니다.',
    content: `
      <section class="page-card stack">
        <h2>서비스 소개</h2>
        <p>스톡 크리에이터를 위한 분석 도구 서비스입니다.</p>
      </section>
    `,
  },
  '/privacy': {
    title: '개인정보처리방침 | 스톡 크리에이터 분석 플랫폼',
    description: '서비스의 개인정보처리방침을 안내합니다.',
    content: `
      <section class="page-card stack">
        <h2>개인정보처리방침</h2>
        <p>서비스의 개인정보처리방침을 안내합니다.</p>
      </section>
    `,
  },
  '/terms': {
    title: '이용약관 | 스톡 크리에이터 분석 플랫폼',
    description: '서비스의 이용약관을 안내합니다.',
    content: `
      <section class="page-card stack">
        <h2>이용약관</h2>
        <p>서비스의 이용약관을 안내합니다.</p>
      </section>
    `,
  },
  '/contact': {
    title: '문의 | 스톡 크리에이터 분석 플랫폼',
    description: '서비스 문의 페이지입니다.',
    content: `
      <section class="page-card stack">
        <h2>문의</h2>
        <p>서비스 문의 페이지입니다.</p>
      </section>
    `,
  },
};
