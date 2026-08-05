import { SITE_INFO } from '../../config/siteConfig.js';
import { renderSectionHeader } from '../viewComponents.js';
import { escapeHtml, serializeJsonLd } from '../viewUtils.js';

const FAQ_SECTIONS = [
  {
    id: 'status',
    title: '서비스 운영 상태',
    description: '현재 제공되는 기능과 중단된 기능을 안내합니다.',
    items: [
      {
        question: '플랫폼 분석 기능은 왜 종료되었나요?',
        answer: '플랫폼 정책상 외부 서비스에서 검색 결과와 메타데이터를 수집·분석·제공하기 어려워 관련 기능 지원을 종료했습니다.',
      },
      {
        question: '기존 플랫폼 분석 URL은 계속 사용할 수 있나요?',
        answer: '아니요. 키워드 분석, 템플릿 분석, 월간 인기 검색 순위와 관련 직접 접근 URL은 모두 비활성화되었습니다.',
      },
      {
        question: '관련 데이터 수집도 중단되었나요?',
        answer: '네. 플랫폼 관련 신규 데이터 수집과 검색 로그 생성은 중단된 상태입니다.',
      },
    ],
  },
  {
    id: 'calendar',
    title: '월별 작업 캘린더',
    description: '현재 공개 중인 월별 소재 기능을 안내합니다.',
    items: [
      {
        question: '월별 작업 캘린더는 무엇인가요?',
        answer: '1월부터 12월까지 계절, 기념일과 작업 수요를 고려한 대표 소재와 실제 요소나 이미지로 제작할 수 있는 세부 주제를 정리한 페이지입니다.',
      },
      {
        question: '월별 작업 캘린더는 계속 이용할 수 있나요?',
        answer: '네. 플랫폼 데이터를 사용하지 않는 월별 작업 캘린더와 서비스 공지 페이지는 계속 공개됩니다.',
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

export function renderUpdatesPage() {
  return `
    <div class="content-page updates-page">
      ${renderContentIntro(
        '서비스 변경 내역',
        'StockKeyword에 새로 추가되거나 변경된 기능을 날짜별로 안내합니다.',
      )}

      <article class="content-card content-section update-entry">
        <header class="update-entry-header">
          <time class="update-date" datetime="2026-08-05">2026.08.05</time>
          <h2>플랫폼 관련 기능 지원 종료 안내</h2>
          <p>플랫폼 정책상 앞으로는 관련 기능 지원이 어려울 것 같습니다. 이에 따라 플랫폼 데이터를 사용하는 기능과 공개 경로를 비활성화했습니다.</p>
        </header>

        <section class="update-detail-section">
          <h3>플랫폼 분석 기능 종료</h3>
          <p>키워드 분석, 템플릿 분석과 월간 인기 검색 순위 기능을 종료했으며 관련 신규 데이터 수집도 중단했습니다.</p>
        </section>

        <section class="update-detail-section">
          <h3>공개 메뉴 및 URL 비활성화</h3>
          <p>홈페이지와 사이드바에서 플랫폼 항목을 제거하고 관련 공개 페이지, 이전 주소와 직접 접근 URL을 모두 비활성화했습니다.</p>
        </section>

        <section class="update-detail-section">
          <h3>홈페이지 공지 추가</h3>
          <p>서비스 이용자가 변경 내용을 바로 확인할 수 있도록 홈페이지 메인 화면에 지원 종료 안내를 게시했습니다.</p>
        </section>

        <section class="update-detail-section update-summary-section">
          <h3>변경사항 요약</h3>
          <ul class="content-list">
            <li>플랫폼 키워드 분석 기능 종료</li>
            <li>플랫폼 템플릿 분석 기능 종료</li>
            <li>플랫폼 월간 인기 검색 순위 기능 종료</li>
            <li>홈페이지와 사이드바의 플랫폼 항목 제거</li>
            <li>관련 공개 페이지와 직접 접근 URL 비활성화</li>
            <li>관련 신규 데이터 수집 중단</li>
          </ul>
        </section>
      </article>

      <article class="content-card content-section update-entry">
        <header class="update-entry-header">
          <time class="update-date" datetime="2026-07-29">2026.07.29</time>
          <h2>크라우드픽 관련 서비스 종료 안내</h2>
          <p>크라우드픽 운영 정책 확인 결과에 따라 StockKeyword에서 제공하던 크라우드픽 관련 기능과 안내 페이지의 운영을 종료했습니다.</p>
        </header>

        <section class="update-detail-section">
          <h3>크라우드픽 관련 기능 종료</h3>
          <p>크라우드픽 키워드 분석과 월간 인기 검색 순위 기능을 종료했으며, 관련 신규 데이터 수집도 중단했습니다.</p>
        </section>

        <section class="update-detail-section">
          <h3>공개 메뉴 및 페이지 비활성화</h3>
          <p>홈페이지와 사이드바에서 크라우드픽 항목을 제거하고, 크라우드픽 관련 공개 페이지와 직접 접근 URL을 비활성화했습니다.</p>
        </section>

        <section class="update-detail-section update-summary-section">
          <h3>변경사항 요약</h3>
          <ul class="content-list">
            <li>크라우드픽 키워드 분석 기능 종료</li>
            <li>크라우드픽 월간 인기 검색 순위 기능 종료</li>
            <li>홈페이지와 사이드바의 크라우드픽 항목 제거</li>
            <li>크라우드픽 관련 공개 페이지 및 URL 비활성화</li>
            <li>관련 신규 데이터 수집 중단</li>
          </ul>
        </section>
      </article>

      <article class="content-card content-section update-entry">
        <header class="update-entry-header">
          <time class="update-date" datetime="2026-07-22">2026.07.22</time>
          <h2>서비스 이용 안내 및 플랫폼 정보 개선</h2>
          <p>처음 방문한 사용자도 분석 방법과 플랫폼별 특징을 쉽게 확인할 수 있도록 안내 영역을 보완했습니다.</p>
        </header>

        <section class="update-detail-section">
          <h3>플랫폼 소개 추가</h3>
          <p>기능 선택 페이지에 콘텐츠 등록 방식, 지원 콘텐츠 유형과 제공 중인 분석 기능을 확인할 수 있는 소개 영역을 추가했습니다.</p>
        </section>

        <section class="update-detail-section">
          <h3>‘처음 사용하시나요?’ 이용 안내 추가</h3>
          <p>키워드 분석 페이지에 검색어 입력, 콘텐츠 유형 선택, 추천 키워드 확인 및 복사 순서를 단계별로 안내하는 영역을 추가했습니다. 최근 인기 검색어도 함께 확인할 수 있습니다.</p>
        </section>

        <section class="update-detail-section">
          <h3>‘한 작품으로 더 많은 플랫폼에 도전하시나요?’ 추가</h3>
          <p>완성한 작품을 다른 플랫폼에서도 활용할 수 있도록 플랫폼별 수익 방식, 라이선스 형태와 AI 콘텐츠 등록 가능 여부를 확인하고 해당 키워드 분석 페이지로 이동할 수 있는 영역을 추가했습니다.</p>
        </section>

        <section class="update-detail-section">
          <h3>툴디 관련 기능 비공개 전환</h3>
          <p>툴디의 외부 서비스 연동 운영 방침에 따라 툴디 키워드 분석, 템플릿 분석과 월간 인기 검색 순위 기능을 비공개로 전환했습니다. 관련 신규 데이터 수집도 중단했습니다.</p>
        </section>

        <section class="update-detail-section update-summary-section">
          <h3>변경사항 요약</h3>
          <ul class="content-list">
            <li>플랫폼별 소개 영역 추가</li>
            <li>처음 사용자를 위한 키워드 분석 방법 안내 추가</li>
            <li>다른 플랫폼 탐색 및 분석 페이지 이동 영역 추가</li>
            <li>툴디 관련 기능과 공개 페이지 비공개 전환</li>
            <li>사이드바에 업데이트 메뉴 추가</li>
          </ul>
        </section>
      </article>
    </div>
  `;
}

export function renderAboutPage() {
  return `
    <div class="content-page">
      ${renderContentIntro(
        'StockKeyword 운영 안내',
        '플랫폼 정책 변경에 따라 플랫폼 데이터를 사용하는 분석 기능은 종료되었으며, 현재는 서비스 공지와 월별 작업 캘린더를 제공합니다.',
      )}

      <section class="content-card content-section">
        <h2>현재 공개 중인 기능</h2>
        <ul class="content-list">
          <li><strong>월별 작업 캘린더:</strong> 1월부터 12월까지 대표 소재와 제작 가능한 세부 주제</li>
          <li><strong>서비스 공지:</strong> 기능 종료와 운영 변경 내역</li>
        </ul>
      </section>

      <section class="content-card content-section">
        <h2>종료된 기능</h2>
        <p>플랫폼 검색 결과와 메타데이터를 이용하던 키워드 분석, 템플릿 분석과 월간 인기 검색 순위 기능은 모두 종료했습니다.</p>
        <p>관련 공개 URL과 신규 데이터 수집도 비활성화된 상태입니다.</p>
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
          <li>접속 환경, 페이지 이용 기록과 쿠키 정보(분석·광고 도구가 활성화된 경우)</li>
          <li>이메일 문의 시 사용자가 직접 제공한 연락처와 문의 내용</li>
        </ul>
        <p>현재 회원가입, 결제와 플랫폼 검색 기능을 제공하지 않으므로 이름, 비밀번호, 결제 정보와 신규 검색 로그를 직접 수집하지 않습니다.</p>
      </section>

      <section class="content-card content-section">
        <h2>2. 이용 목적과 보관</h2>
        <p>사이트 운영 상태 확인, 오류 대응, 문의 처리와 서비스 개선을 위해 필요한 범위에서 이용합니다.</p>
        <p>문의 정보는 처리 목적이 달성된 뒤 관련 법령과 운영상 필요한 기간에 따라 삭제하거나 비식별 처리합니다.</p>
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
        <p>StockKeyword는 서비스 운영 공지와 스톡 작업에 참고할 수 있는 월별 소재 정보를 제공합니다.</p>
      </section>

      <section class="content-card content-section">
        <h2>2. 이용자의 책임</h2>
        <ul class="content-list">
          <li>월별 소재 정보는 참고 자료로 사용하며 최종 콘텐츠 제작과 등록 책임은 이용자에게 있습니다.</li>
          <li>자동화된 과도한 요청, 서비스 방해, 콘텐츠의 무단 재판매와 법령을 위반하는 이용을 금지합니다.</li>
        </ul>
      </section>

      <section class="content-card content-section">
        <h2>3. 서비스 변경</h2>
        <p>운영 정책과 제공 범위는 변경될 수 있으며, 중요한 변경 사항은 홈페이지와 업데이트 페이지에서 안내합니다.</p>
      </section>
    </div>
  `;
}

export function renderContactPage() {
  return `
    <div class="content-page">
      ${renderContentIntro(
        '문의',
        '서비스 변경, 개인정보와 기타 운영 관련 문의를 접수합니다.',
      )}

      <section class="content-card contact-card">
        <p class="contact-label">이메일</p>
        <a class="contact-email" href="mailto:${escapeHtml(SITE_INFO.contactEmail)}">
          ${escapeHtml(SITE_INFO.contactEmail)}
        </a>
        <p class="contact-help">문의 내용과 확인이 필요한 페이지 주소를 함께 적어 보내주세요.</p>
      </section>
    </div>
  `;
}
