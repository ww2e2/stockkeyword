import { SITE_INFO } from '../../config/siteConfig.js';
import { renderSectionHeader } from '../viewComponents.js';
import { escapeHtml, serializeJsonLd } from '../viewUtils.js';

const FAQ_SECTIONS = [
  {
    id: 'common',
    title: '서비스 공통',
    description: 'StockKeyword의 이용 방식과 추천 원리를 설명합니다.',
    items: [
      {
        question: 'StockKeyword는 어떤 서비스인가요?',
        answer: 'StockKeyword는 스톡 콘텐츠 제작자가 미리캔버스, 크라우드픽, 툴디의 검색 흐름을 분석하고 작업용 키워드와 월별 소재를 찾도록 돕는 무료 리서치 도구입니다.',
      },
      {
        question: '회원가입 없이 사용할 수 있나요?',
        answer: '네. 현재 제공되는 키워드 분석, 템플릿 분석, 월간 검색 순위와 작업 캘린더는 회원가입 없이 사용할 수 있습니다.',
      },
      {
        question: 'StockKeyword는 무료인가요?',
        answer: '네. 현재 공개된 분석 기능은 무료로 제공됩니다. 기능이나 운영 정책이 변경되면 사이트에서 별도로 안내합니다.',
      },
      {
        question: '추천 키워드는 어떻게 만들어지나요?',
        answer: '선택한 플랫폼의 실제 검색 결과에 포함된 키워드를 수집한 뒤 중복, 비어 있는 값, 형식이 깨진 값을 제거하고 반복 빈도가 높은 순서로 정리합니다.',
      },
      {
        question: '같은 검색어인데 플랫폼마다 결과가 다른 이유는 무엇인가요?',
        answer: '플랫폼마다 콘텐츠 수, 검색 정렬 방식, 카테고리 구조와 등록 키워드가 다르기 때문에 같은 검색어라도 추천 결과가 달라집니다.',
      },
    ],
  },
  {
    id: 'miricanvas',
    title: '미리캔버스',
    description: '미리캔버스 키워드와 템플릿 분석에 관한 질문입니다.',
    items: [
      {
        question: '미리캔버스에서는 어떤 콘텐츠를 분석할 수 있나요?',
        answer: '요소, 사진, 배경의 키워드를 분석할 수 있으며, 템플릿은 지원 유형별로 기획 키워드, 페이지 수 분포와 상위 제목을 확인할 수 있습니다.',
      },
      {
        question: '미리캔버스 템플릿 분석은 어떤 콘텐츠를 기준으로 하나요?',
        answer: '현재 템플릿 분석은 검색 결과에서 확인되는 유료 템플릿을 기준으로 집계합니다. 무료 템플릿은 분석 대상에서 제외합니다.',
      },
      {
        question: '미리캔버스 템플릿의 페이지 수는 어떻게 계산하나요?',
        answer: '분석 대상 템플릿의 실제 페이지 수를 같은 값끼리 합산하고 전체 템플릿에서 차지하는 비율을 함께 표시합니다.',
      },
    ],
  },
  {
    id: 'crowdpic',
    title: '크라우드픽',
    description: '크라우드픽 키워드 분석에 관한 질문입니다.',
    items: [
      {
        question: '크라우드픽에서는 어떤 카테고리를 분석할 수 있나요?',
        answer: '전체, 사진, 일러스트, 캘리그라피, 아이콘과 목업 카테고리를 선택해 검색 결과의 키워드를 분석할 수 있습니다.',
      },
      {
        question: '크라우드픽 추천 키워드가 검색마다 달라질 수 있나요?',
        answer: '네. 크라우드픽의 실시간 검색 결과와 작품 등록 상태가 달라지면 수집되는 키워드와 추천 순서도 달라질 수 있습니다.',
      },
      {
        question: '크라우드픽 검색 결과가 없으면 다른 카테고리로 대체하나요?',
        answer: '아니요. 선택한 카테고리에서 결과가 없으면 0개로 표시하며 다른 카테고리의 결과를 임의로 섞지 않습니다.',
      },
    ],
  },
  {
    id: 'tooldi',
    title: '툴디',
    description: '툴디 키워드와 템플릿 분석에 관한 질문입니다.',
    items: [
      {
        question: '툴디에서는 어떤 콘텐츠를 분석할 수 있나요?',
        answer: '사진, 요소와 배경의 키워드를 분석할 수 있으며, 모든 템플릿 검색 결과를 기준으로 기획 키워드, 페이지 수와 상위 제목을 확인할 수 있습니다.',
      },
      {
        question: '툴디 템플릿 분석은 무료 템플릿도 포함하나요?',
        answer: '아니요. 현재 툴디 템플릿 분석은 유료 사용 대상 템플릿만 수집합니다.',
      },
      {
        question: '툴디 템플릿은 몇 개까지 분석하나요?',
        answer: '중복을 제거한 유료 템플릿을 최대 20개까지 분석합니다. 20개에 미치지 못하면 실제 수집된 수량만 사용합니다.',
      },
    ],
  },
  {
    id: 'results',
    title: '검색 결과와 월간 순위',
    description: '결과 수, 복사 기능과 통계 집계 방식에 관한 질문입니다.',
    items: [
      {
        question: '추천 키워드 수가 항상 최대 개수로 나오지 않는 이유는 무엇인가요?',
        answer: '유료 콘텐츠 수가 적거나 중복 키워드가 많거나 유효하지 않은 값이 제거되면 최대 개수보다 적게 표시됩니다. 관련성이 낮은 단어로 강제로 채우지 않습니다.',
      },
      {
        question: '추천 키워드를 일부 삭제한 뒤 복사할 수 있나요?',
        answer: '네. 결과 칩의 삭제 버튼으로 필요 없는 키워드를 제거하면 선택 개수와 복사용 문자열이 즉시 갱신됩니다.',
      },
      {
        question: '이번 달 인기 검색 순위는 어떻게 집계하나요?',
        answer: 'StockKeyword에서 해당 월에 실행된 검색을 플랫폼, 검색어와 콘텐츠 유형별로 집계해 최대 20위까지 표시합니다.',
      },
      {
        question: '월별 작업 캘린더는 무엇인가요?',
        answer: '1월부터 12월까지 계절, 기념일과 작업 수요를 고려한 대표 소재와 실제 요소나 이미지로 제작할 수 있는 세부 주제를 정리한 페이지입니다.',
      },
    ],
  },
];

function renderFaqItem(item) {
  return `
    <details class="faq-item">
      <summary>
        <span>${escapeHtml(item.question)}</span>
        <span class="faq-toggle-icon" aria-hidden="true">+</span>
      </summary>
      <div class="faq-answer">
        <p>${escapeHtml(item.answer)}</p>
      </div>
    </details>
  `;
}

function renderFaqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_SECTIONS.flatMap((section) =>
      section.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    ),
  };
}

export function renderFaqPage() {
  return `
    <div class="content-page faq-page">
      <nav class="faq-category-nav" aria-label="FAQ 분류">
        ${FAQ_SECTIONS.map((section) => `
          <a href="#${escapeHtml(section.id)}">${escapeHtml(section.title)}</a>
        `).join('')}
      </nav>

      <div class="faq-section-list">
        ${FAQ_SECTIONS.map((section) => `
          <section class="faq-section" id="${escapeHtml(section.id)}">
            ${renderSectionHeader(section.title, section.description)}
            <div class="faq-list">
              ${section.items.map(renderFaqItem).join('')}
            </div>
          </section>
        `).join('')}
      </div>

      <script type="application/ld+json">
        ${serializeJsonLd(renderFaqSchema())}
      </script>
    </div>
  `;
}

function renderContentIntro(title, description) {
  return `
    <section class="content-card content-intro-card">
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(description)}</p>
    </section>
  `;
}

export function renderAboutPage() {
  return `
    <div class="content-page">
      ${renderContentIntro(
        '스톡 작업의 검색 시간을 줄이는 도구',
        'StockKeyword는 플랫폼별 검색 결과와 월별 작업 소재를 한곳에서 확인할 수 있도록 만든 스톡 작가용 리서치 워크벤치입니다.',
      )}

      <section class="content-card content-section">
        <h2>현재 지원 기능</h2>
        <ul class="content-list">
          <li><strong>미리캔버스:</strong> 요소·사진·배경 키워드, 템플릿 분석, 월간 순위</li>
          <li><strong>크라우드픽:</strong> 카테고리별 키워드 분석, 월간 순위</li>
          <li><strong>툴디:</strong> 사진·요소·배경 키워드, 유료 템플릿 분석, 월간 순위</li>
          <li><strong>월별 작업 캘린더:</strong> 1월부터 12월까지 대표 소재와 제작 가능한 세부 주제</li>
        </ul>
      </section>

      <section class="content-card content-section">
        <h2>운영 원칙</h2>
        <p>검색 결과를 임의로 다른 카테고리와 섞지 않고, 실제 수집된 데이터 안에서 중복과 비정상 값을 제거해 표시합니다.</p>
        <p>플랫폼의 검색 결과와 정책이 바뀌면 분석 결과도 달라질 수 있으며, StockKeyword는 각 플랫폼의 공식 서비스가 아닙니다.</p>
      </section>
    </div>
  `;
}

export function renderPrivacyPage() {
  return `
    <div class="content-page">
      ${renderContentIntro(
        '개인정보처리방침',
        `${SITE_INFO.serviceName}는 서비스 제공에 필요한 최소한의 정보만 처리합니다. 시행일: ${SITE_INFO.policyEffectiveDate}`,
      )}

      <section class="content-card content-section">
        <h2>1. 처리하는 정보</h2>
        <ul class="content-list">
          <li>사용자가 입력한 검색어, 선택한 플랫폼과 콘텐츠 유형</li>
          <li>검색 시각과 월간 검색 순위 산출에 필요한 이용 기록</li>
          <li>접속 환경, 페이지 이용 기록과 쿠키 정보(분석·광고 도구가 활성화된 경우)</li>
        </ul>
        <p>현재 회원가입 기능이 없으므로 이름, 비밀번호와 결제 정보는 직접 수집하지 않습니다.</p>
      </section>

      <section class="content-card content-section">
        <h2>2. 이용 목적과 보관</h2>
        <p>검색 결과 제공, 오류 확인, 월간 검색 순위 산출과 서비스 개선을 위해 이용합니다.</p>
        <p>검색 로그는 월간 통계 산출에 필요한 기간 동안 보관한 뒤 초기화하거나 비식별 집계 형태로 처리합니다.</p>
      </section>

      <section class="content-card content-section">
        <h2>3. 외부 서비스와 쿠키</h2>
        <p>방문 통계와 광고 제공을 위해 Google Analytics 또는 Google AdSense와 같은 외부 서비스를 사용할 수 있습니다. 해당 서비스는 자체 정책에 따라 쿠키와 접속 정보를 처리할 수 있습니다.</p>
      </section>

      <section class="content-card content-section">
        <h2>4. 문의와 권리 행사</h2>
        <p>개인정보 관련 문의, 열람 또는 삭제 요청은 <a class="inline-link" href="mailto:${escapeHtml(SITE_INFO.contactEmail)}">${escapeHtml(SITE_INFO.contactEmail)}</a>로 접수할 수 있습니다.</p>
      </section>
    </div>
  `;
}

export function renderTermsPage() {
  return `
    <div class="content-page">
      ${renderContentIntro(
        '이용약관',
        `${SITE_INFO.serviceName} 이용 조건과 운영 기준을 안내합니다. 시행일: ${SITE_INFO.policyEffectiveDate}`,
      )}

      <section class="content-card content-section">
        <h2>1. 서비스의 목적</h2>
        <p>StockKeyword는 스톡 콘텐츠 제작자가 플랫폼 검색 흐름과 작업 소재를 조사할 수 있도록 분석 결과를 제공합니다.</p>
      </section>

      <section class="content-card content-section">
        <h2>2. 이용자의 책임</h2>
        <ul class="content-list">
          <li>검색 결과는 참고 자료로 사용하며 최종 키워드 선택과 콘텐츠 등록 책임은 이용자에게 있습니다.</li>
          <li>자동화된 과도한 요청, 서비스 방해, 데이터의 무단 재판매와 법령을 위반하는 이용을 금지합니다.</li>
          <li>각 플랫폼을 사용할 때는 해당 플랫폼의 이용약관과 등록 규정을 함께 준수해야 합니다.</li>
        </ul>
      </section>

      <section class="content-card content-section">
        <h2>3. 결과와 서비스 변경</h2>
        <p>플랫폼의 검색 결과, API, 정책 또는 네트워크 상태에 따라 추천 결과가 달라지거나 일시적으로 제공되지 않을 수 있습니다.</p>
        <p>기능, 제공 범위와 약관이 변경되면 사이트에서 변경 내용을 안내합니다.</p>
      </section>
    </div>
  `;
}

export function renderContactPage() {
  return `
    <div class="content-page">
      ${renderContentIntro(
        '문의',
        '오류 제보, 기능 제안, 제휴와 개인정보 관련 문의를 접수합니다.',
      )}

      <section class="content-card contact-card">
        <p class="contact-label">이메일</p>
        <a class="contact-email" href="mailto:${escapeHtml(SITE_INFO.contactEmail)}">
          ${escapeHtml(SITE_INFO.contactEmail)}
        </a>
        <p class="contact-help">문의 시 사용한 플랫폼, 검색어, 발생한 화면과 재현 방법을 함께 적으면 확인이 빨라집니다.</p>
      </section>
    </div>
  `;
}

