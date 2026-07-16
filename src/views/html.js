import {
  SITE_INFO,
  getCurrentMonthNumber,
  getMonthLabel,
  getMonthTopic,
  getStockWorkPeriod,
} from '../config/siteConfig.js';
import { renderStyles } from './styles.js';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));

const toArray = (value) => (Array.isArray(value) ? value : []);

const serializeJsonLd = (value) =>
  JSON.stringify(value).replace(/</g, '\\u003c');


const normalizeOptions = (value) =>
  toArray(value).map((item) => (
    typeof item === 'string'
      ? { value: item, label: item }
      : {
          value: item?.value ?? item?.id ?? item?.key ?? '',
          label: item?.label ?? item?.name ?? item?.title ?? item?.value ?? '',
        }
  ));

function renderSectionHeader(title, description = '') {
  return `
    <div class="section-header">
      <div>
        <h2 class="section-title">${escapeHtml(title)}</h2>
        ${description
          ? `<p class="section-description">${escapeHtml(description)}</p>`
          : ''}
      </div>
    </div>
  `;
}

function renderPlatformCard(title, description, href = '#') {
  const isPlaceholder = href === '#';

  return `
    <article class="platform-card">
      <a
        class="platform-card-link"
        href="${escapeHtml(href)}"
        ${isPlaceholder ? 'aria-disabled="true"' : ''}
      >
        <h3 class="platform-card-title">${escapeHtml(title)}</h3>
        <p class="platform-card-description">${escapeHtml(description)}</p>
      </a>
    </article>
  `;
}

function renderSidebarLink({
  activeMenu,
  id,
  href,
  label,
}) {
  const isActive = activeMenu === id;

  return `
    <a
      class="sidebar-link${isActive ? ' is-active' : ''}"
      href="${escapeHtml(href)}"
      ${isActive ? 'aria-current="page"' : ''}
    >
      <span class="sidebar-link-dot" aria-hidden="true"></span>
      <span>${escapeHtml(label)}</span>
    </a>
  `;
}

function renderSidebar(activeMenu) {
  return `
    <aside class="sidebar" id="site-sidebar" aria-label="주요 메뉴">
      <a class="sidebar-brand" href="/">
        <span class="brand-mark" aria-hidden="true">
          <img
            class="brand-logo"
            src="/android-chrome-192x192.png"
            alt=""
            width="30"
            height="30"
          >
        </span>
        <span class="brand-name">StockKeyword</span>
      </a>

      <p class="sidebar-section-label">WORKSPACE</p>

      <nav class="sidebar-nav">
        <div class="sidebar-menu-group">
          ${renderSidebarLink({
            activeMenu,
            id: 'home',
            href: '/',
            label: '홈',
          })}
        </div>

        <div class="sidebar-menu-group sidebar-menu-group-platforms">
          ${renderSidebarLink({
            activeMenu,
            id: 'miricanvas',
            href: '/miricanvas',
            label: '미리캔버스',
          })}
          ${renderSidebarLink({
            activeMenu,
            id: 'crowdpic',
            href: '/crowdpic',
            label: '크라우드픽',
          })}
          ${renderSidebarLink({
            activeMenu,
            id: 'tooldi',
            href: '/tooldi',
            label: '툴디',
          })}
        </div>

        <div class="sidebar-divider" aria-hidden="true"></div>

        <div class="sidebar-menu-group">
          ${renderSidebarLink({
            activeMenu,
            id: 'calendar',
            href: '/calendar',
            label: '월별 작업 캘린더',
          })}
        </div>

        <div class="sidebar-divider" aria-hidden="true"></div>

        <div class="sidebar-menu-group">
          ${renderSidebarLink({
            activeMenu,
            id: 'faq',
            href: '/faq',
            label: 'FAQ',
          })}
        </div>

        <div class="sidebar-divider" aria-hidden="true"></div>

        <div class="sidebar-menu-group">
          ${renderSidebarLink({
            activeMenu,
            id: 'about',
            href: '/about',
            label: '소개',
          })}
          ${renderSidebarLink({
            activeMenu,
            id: 'privacy',
            href: '/privacy',
            label: '개인정보처리방침',
          })}
          ${renderSidebarLink({
            activeMenu,
            id: 'terms',
            href: '/terms',
            label: '이용약관',
          })}
          ${renderSidebarLink({
            activeMenu,
            id: 'contact',
            href: '/contact',
            label: '문의',
          })}
        </div>
      </nav>
    </aside>
  `;
}

function renderTopbar(title, description) {
  return `
    <header class="topbar">
      <div class="topbar-inner">
        <button
          class="mobile-menu-button"
          type="button"
          data-sidebar-toggle
          aria-controls="site-sidebar"
          aria-expanded="false"
          aria-label="메뉴 열기"
        >
          <span aria-hidden="true">☰</span>
        </button>

        <div class="topbar-copy">
          <h1 class="page-title">${escapeHtml(title)}</h1>
          ${description
            ? `<p class="page-description">${escapeHtml(description)}</p>`
            : ''}
        </div>
      </div>
    </header>
  `;
}

function renderMonthNavigation(month) {
  const currentMonth = Number(month);
  const previousMonth = currentMonth > 1 ? currentMonth - 1 : null;
  const nextMonth = currentMonth < 12 ? currentMonth + 1 : null;

  return `
    <nav class="month-navigation" aria-label="월별 소재 이동">
      ${previousMonth
        ? `
          <a
            class="month-navigation-edge"
            href="/calendar/${previousMonth}"
            aria-label="${previousMonth}월로 이동"
          >
            ← ${previousMonth}월
          </a>
        `
        : '<span class="month-navigation-edge is-disabled" aria-hidden="true">← 이전 달</span>'}

      ${nextMonth
        ? `
          <a
            class="month-navigation-edge"
            href="/calendar/${nextMonth}"
            aria-label="${nextMonth}월로 이동"
          >
            ${nextMonth}월 →
          </a>
        `
        : '<span class="month-navigation-edge is-disabled" aria-hidden="true">다음 달 →</span>'}
    </nav>
  `;
}

function renderTopicItem(topic, index, month) {
  const title = typeof topic === 'string' ? topic : topic?.title;
  const keywords = typeof topic === 'object'
    ? toArray(topic?.keywords).slice(0, 10)
    : [];
  const panelId = `topic-panel-${month}-${index}`;

  return `
    <article class="topic-grid-item">
      <button
        class="topic-card"
        type="button"
        data-topic-toggle
        data-topic-keywords="${escapeHtml(keywords.join(', '))}"
        aria-expanded="false"
        aria-controls="${panelId}"
      >
        <span class="topic-title">${escapeHtml(title)}</span>
        <span class="topic-arrow" aria-hidden="true">▼</span>
      </button>

      <div
        class="topic-panel"
        id="${panelId}"
        data-topic-panel
        hidden
      >
        ${keywords.length
          ? `
            <ul class="topic-keyword-list">
              ${keywords
                .map((keyword) => `<li>${escapeHtml(keyword)}</li>`)
                .join('')}
            </ul>
          `
          : '<p class="empty-state">등록된 소주제가 없습니다.</p>'}
      </div>
    </article>
  `;
}

export function renderMonthlyTopics({
  month = Number(getCurrentMonthNumber()),
  monthData = getMonthTopic(month),
  title,
  description,
  showNavigation = false,
} = {}) {
  const topics = toArray(monthData?.topics);
  const resolvedTitle = title || `${getMonthLabel(month)} 추천 소재`;
  const resolvedDescription =
    description || '이번 달 스톡 작업에 활용하기 좋은 소재';

  return `
    <section class="monthly-topics-section">
      ${showNavigation ? renderMonthNavigation(month) : ''}
      ${renderSectionHeader(resolvedTitle, resolvedDescription)}

      <div class="monthly-topics-grid">
        ${topics.length
          ? topics
              .map((topic, index) => renderTopicItem(topic, index, month))
              .join('')
          : '<p class="empty-state">이번 달 추천 소재가 없습니다.</p>'}
      </div>
    </section>
  `;
}

export function renderHomePage(date = new Date()) {
  const { targetMonth } = getStockWorkPeriod(date);

  return `
    <div class="home-page">
      <section class="home-platform-section">
        ${renderSectionHeader('플랫폼 바로가기')}

        <div class="home-platform-grid">
          ${renderPlatformCard(
            '미리캔버스',
            '키워드 분석 · 템플릿 분석 · 월간 순위',
            '/miricanvas',
          )}
          ${renderPlatformCard(
            '크라우드픽',
            '키워드 분석 · 월간 순위',
            '/crowdpic',
          )}
          ${renderPlatformCard(
            '툴디',
            '키워드 분석 · 템플릿 분석 · 월간 순위',
            '/tooldi',
          )}
        </div>
      </section>

      ${renderMonthlyTopics({
        month: targetMonth,
        title: '이번 달 추천 소재',
        description: '이번 달 스톡 작업에 활용하기 좋은 소재',
      })}

    </div>
  `;
}

function getPlatformId(config = {}) {
  const directId =
    config.id ||
    config.slug ||
    config.key ||
    config.platform ||
    config.code ||
    '';

  if (directId) {
    return String(directId).toLowerCase();
  }

  const source = String(
    config.title ||
    config.name ||
    config.label ||
    '',
  ).toLowerCase();

  if (source.includes('미리캔버스') || source.includes('miricanvas')) {
    return 'miricanvas';
  }

  if (source.includes('크라우드픽') || source.includes('crowdpic')) {
    return 'crowdpic';
  }

  if (source.includes('툴디') || source.includes('tooldi')) {
    return 'tooldi';
  }

  return '';
}

export function renderPlatformPage(config = {}) {
  const platformId = getPlatformId(config);

  const platformTools = {
    miricanvas: [
      {
        label: '키워드 분석',
        description: '검색어에서 실시간 키워드를 추출합니다.',
        href: '/miricanvas/tag',
      },
      {
        label: '템플릿 분석',
        description: '상위 템플릿의 키워드와 구성 흐름을 분석합니다.',
        href: '/miricanvas/template',
      },
      {
        label: '이번 달 인기 검색 순위',
        description: '이번 달 누적 검색어와 콘텐츠 유형 순위를 확인합니다.',
        href: '/miricanvas/rankings',
      },
    ],
    crowdpic: [
      {
        label: '키워드 분석',
        description: '검색어에 맞는 크라우드픽 키워드를 추출합니다.',
        href: '/crowdpic/tag',
      },
      {
        label: '이번 달 인기 검색 순위',
        description: '이번 달 누적 검색어와 콘텐츠 유형 순위를 확인합니다.',
        href: '/crowdpic/rankings',
      },
    ],
    tooldi: [
      {
        label: '키워드 분석',
        description: '검색어에서 실시간 키워드를 추출합니다.',
        href: '/tooldi/tag',
      },
      {
        label: '템플릿 분석',
        description: '툴디 템플릿의 키워드 흐름을 분석합니다.',
        href: '/tooldi/template',
      },
      {
        label: '이번 달 인기 검색 순위',
        description: '이번 달 누적 검색어와 템플릿 순위를 확인합니다.',
        href: '/tooldi/rankings',
      },
    ],
  };

  const configuredTools = toArray(config?.tools);
  const tools = platformTools[platformId] || configuredTools;

  const cards = tools
    .map((tool) => renderPlatformCard(
      tool?.label || tool?.title || '기능',
      tool?.description || tool?.summary || '',
      tool?.href || '#',
    ))
    .join('');

  return `
    <div class="section-stack platform-page">
      <section class="platform-tools-section">
        ${renderSectionHeader(
          '기능 선택',
          config?.summary || '원하는 기능을 선택하세요.',
        )}
        <div class="home-platform-grid platform-tools-grid">
          ${cards || '<p class="empty-state">사용 가능한 기능이 없습니다.</p>'}
        </div>
      </section>
    </div>
  `;
}

function renderSearchForm(config = {}, query = '', selected = '') {
  const contentTypes = normalizeOptions(
    config?.contentTypes ?? config?.options ?? [],
  );
  const inputPlaceholder =
    config?.placeholder || '분석할 키워드를 입력하세요.';

  return `
    <form class="search-form" method="get">
      <label class="sr-only" for="search-query">검색어</label>
      <input
        class="search-input"
        id="search-query"
        name="q"
        value="${escapeHtml(query)}"
        placeholder="${escapeHtml(inputPlaceholder)}"
        autocomplete="off"
      >

      ${contentTypes.length
        ? `
          <label class="sr-only" for="content-type">콘텐츠 유형</label>
          <select class="search-select" id="content-type" name="contentType">
            ${contentTypes
              .map((item) => `
                <option
                  value="${escapeHtml(item.value)}"
                  ${String(item.value) === String(selected) ? 'selected' : ''}
                >
                  ${escapeHtml(item.label)}
                </option>
              `)
              .join('')}
          </select>
        `
        : `
          <input
            type="hidden"
            name="contentType"
            value="${escapeHtml(selected)}"
          >
        `}

      <button class="button button-primary" type="submit">
        분석하기
      </button>
    </form>
  `;
}

function renderKeywordResult(result = {}, { embedded = false } = {}) {
  const words = toArray(result?.keywords);
  const recommendedCount =
    result?.recommendedCount ?? words.length;

  return `
    <section class="${embedded ? 'keyword-result-embedded' : 'result-card keyword-result'}">
      <div class="result-card-body">
        <div class="result-heading">
          <div>
            <h2 class="result-title">추천 키워드 ${escapeHtml(recommendedCount)}개</h2>
            <p class="result-description">
              선택된 키워드
              <span data-selected-keyword-count>${words.length}개</span>
            </p>
          </div>

          <button
            class="button button-secondary"
            type="button"
            data-copy-keywords
          >
            복사하기
          </button>
        </div>

        <div class="keyword-chip-list">
          ${words
            .map((word) => `
              <span class="keyword-chip">
                <span class="keyword-chip-label">${escapeHtml(word)}</span>
                <button
                  type="button"
                  data-keyword-remove
                  aria-label="${escapeHtml(word)} 제거"
                >
                  ×
                </button>
              </span>
            `)
            .join('')}
        </div>

        <div class="keyword-string-box" data-keyword-string>
          ${escapeHtml(words.join(', '))}
        </div>
      </div>
    </section>
  `;
}

export function renderKeywordAnalysisPage(config = {}, result = null) {
  const formConfig = config?.searchOptions || config;

  return `
    <div class="analysis-page">
      ${renderSearchForm(
        formConfig,
        result?.query,
        result?.contentType,
      )}
      ${result ? renderKeywordResult(result) : ''}
    </div>
  `;
}

function renderMetricList(items, renderer) {
  return items?.length
    ? `<div class="metric-list">${items.map(renderer).join('')}</div>`
    : '<p class="empty-state">분석 결과가 없습니다.</p>';
}

export function renderTemplateAnalysisPage(config = {}, result = null) {
  const formConfig = config?.templateSearchOptions || config;
  const words =
    result?.keywords ||
    result?.planningKeywords ||
    [];
  const pages =
    result?.pageCounts ||
    result?.pageCountDistribution ||
    [];
  const titles =
    result?.topTemplateTitles ||
    result?.titles ||
    result?.topTitles ||
    [];

  return `
    <div class="analysis-page">
      ${renderSearchForm(
        formConfig,
        result?.query,
        result?.templateTypeId,
      )}

      ${result
        ? `
          <section class="result-card template-result" data-template-result>
            <div class="result-card-body">
              <div class="result-tabs" role="tablist" aria-label="템플릿 분석 결과">
                <button
                  class="tab-button is-active"
                  type="button"
                  role="tab"
                  aria-selected="true"
                  data-template-tab="planning"
                >
                  기획 키워드
                </button>
                <button
                  class="tab-button"
                  type="button"
                  role="tab"
                  aria-selected="false"
                  data-template-tab="pages"
                >
                  페이지 수
                </button>
                <button
                  class="tab-button"
                  type="button"
                  role="tab"
                  aria-selected="false"
                  data-template-tab="titles"
                >
                  상위 제목
                </button>
              </div>

              <div data-template-panel="planning">
                ${renderKeywordResult(
                  { ...result, keywords: words },
                  { embedded: true },
                )}
              </div>

              <div data-template-panel="pages" hidden>
                ${renderMetricList(
                  pages,
                  (item) => `
                    <div class="metric-row">
                      <span>${escapeHtml(
                        item?.pageCount ?? item?.page ?? item,
                      )}페이지</span>
                      <strong>
                        ${escapeHtml(item?.count ?? '')}개
                        ${item?.percentage != null
                          ? ` · ${escapeHtml(item.percentage)}%`
                          : ''}
                      </strong>
                    </div>
                  `,
                )}
              </div>

              <div data-template-panel="titles" hidden>
                ${renderMetricList(
                  titles,
                  (item, index) => `
                    <div class="metric-row">
                      <span>${index + 1}. ${escapeHtml(item?.title ?? item)}</span>
                    </div>
                  `,
                )}
              </div>
            </div>
          </section>
        `
        : ''}
    </div>
  `;
}


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


function normalizeRankingRow(item) {
  if (typeof item === 'string') {
    return { label: item, count: '' };
  }

  return {
    label:
      item?.label ??
      item?.query ??
      item?.keyword ??
      item?.name ??
      item?.title ??
      '',
    count:
      item?.count ??
      item?.searchCount ??
      item?.total ??
      '',
  };
}

function renderRankingCard(title, rows = []) {
  return `
    <section class="ranking-card">
      <h2 class="result-title">${escapeHtml(title)}</h2>

      ${rows.length
        ? `
          <ol class="ranking-list">
            ${rows
              .map((row) => {
                const normalized = normalizeRankingRow(row);
                return `
                  <li>
                    <span>${escapeHtml(normalized.label)}</span>
                    ${normalized.count !== ''
                      ? `<strong>${escapeHtml(normalized.count)}회</strong>`
                      : ''}
                  </li>
                `;
              })
              .join('')}
          </ol>
        `
        : '<p class="empty-state">분석 결과가 없습니다.</p>'}
    </section>
  `;
}

export function renderRankingsPage(config = {}, result = {}) {
  const keyword = result?.keyword || {};
  const template = result?.template || {};
  const supportsTemplate = Boolean(
    config?.rankingFeatures?.template ||
    config?.features?.template,
  );

  return `
    <section class="result-card ranking-result" data-ranking-result>
      <div class="result-card-body">
        <div class="result-tabs" role="tablist" aria-label="월간 순위">
          <button
            class="tab-button is-active"
            type="button"
            role="tab"
            aria-selected="true"
            data-ranking-tab="keyword"
          >
            키워드
          </button>

          ${supportsTemplate
            ? `
              <button
                class="tab-button"
                type="button"
                role="tab"
                aria-selected="false"
                data-ranking-tab="template"
              >
                템플릿
              </button>
            `
            : ''}
        </div>

        <div class="ranking-panel-grid" data-ranking-panel="keyword">
          ${renderRankingCard(
            '이번 달 키워드 검색 순위 TOP 20',
            toArray(keyword?.topQueries),
          )}
          ${renderRankingCard(
            '이번 달 콘텐츠 유형 검색 순위',
            toArray(keyword?.contentTypes),
          )}
        </div>

        ${supportsTemplate
          ? `
            <div
              class="ranking-panel-grid"
              data-ranking-panel="template"
              hidden
            >
              ${renderRankingCard(
                '이번 달 템플릿 키워드 검색 순위 TOP 20',
                toArray(template?.topQueries),
              )}
              ${renderRankingCard(
                '이번 달 템플릿 종류 검색 순위 TOP 20',
                toArray(template?.templateTypes),
              )}
            </div>
          `
          : ''}
      </div>
    </section>
  `;
}


function renderCalendarMonthCard(month, currentMonth, targetMonth) {
  const monthData = getMonthTopic(month);
  const isCurrent = month === currentMonth;
  const isTarget = month === targetMonth;

  return `
    <article
      class="calendar-month-card${isTarget ? ' is-target' : ''}"
      ${isTarget ? 'data-work-target' : ''}
    >
      <a class="calendar-month-card-link" href="/calendar/${month}">
        <span class="calendar-month-badge-group">
          <span class="calendar-month-badge">${month}월</span>
          ${isCurrent ? '<span class="calendar-current-month-label">현재 월</span>' : ''}
        </span>

        <div class="calendar-month-copy">
          <h2 class="calendar-month-title">${escapeHtml(monthData?.title)}</h2>
          <p class="calendar-month-summary">${escapeHtml(monthData?.summary)}</p>
        </div>
      </a>
    </article>
  `;
}

export function renderCalendarPage(date = new Date()) {
  const { currentMonth, targetMonth } = getStockWorkPeriod(date);

  return `
    <div class="calendar-overview-page">
      <section class="calendar-intro-card">
        <h2>한 해의 작업 소재를 미리 준비하세요</h2>
        <p>각 월의 대표 소재를 고르고 세부 작업 주제를 확인할 수 있습니다.</p>
      </section>

      <div class="calendar-year-list">
        ${Array.from({ length: 12 }, (_, index) => index + 1)
          .map((month) => renderCalendarMonthCard(
            month,
            currentMonth,
            targetMonth,
          ))
          .join('')}
      </div>
    </div>
  `;
}

function renderClientScript() {
  return `
    <script>
      (() => {
        const query = (selector, root = document) =>
          root.querySelector(selector);
        const queryAll = (selector, root = document) =>
          Array.from(root.querySelectorAll(selector));

        const workTargetCard = query('[data-work-target]');
        if (workTargetCard) {
          window.requestAnimationFrame(() => {
            const topbarHeight =
              query('.topbar')?.getBoundingClientRect().height || 0;
            const targetTop =
              workTargetCard.getBoundingClientRect().top + window.scrollY;

            window.scrollTo({
              top: Math.max(0, targetTop - topbarHeight - 24),
              behavior: 'smooth',
            });
          });
        }

        const sidebarToggle = query('[data-sidebar-toggle]');
        const sidebarBackdrop = query('.sidebar-backdrop');

        const setSidebarOpen = (isOpen) => {
          document.body.classList.toggle('sidebar-open', isOpen);

          if (sidebarToggle) {
            sidebarToggle.setAttribute('aria-expanded', String(isOpen));
            sidebarToggle.setAttribute(
              'aria-label',
              isOpen ? '메뉴 닫기' : '메뉴 열기',
            );
          }

          if (sidebarBackdrop) {
            sidebarBackdrop.hidden = !isOpen;
          }
        };

        sidebarToggle?.addEventListener('click', () => {
          setSidebarOpen(!document.body.classList.contains('sidebar-open'));
        });

        sidebarBackdrop?.addEventListener('click', () => {
          setSidebarOpen(false);
        });

        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') {
            setSidebarOpen(false);
          }
        });

        const copyText = async (text) => {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return;
          }

          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          textarea.remove();
        };

        document.addEventListener('click', async (event) => {
          const sidebarLink = event.target.closest('.sidebar-link');
          if (sidebarLink && window.matchMedia('(max-width: 900px)').matches) {
            setSidebarOpen(false);
          }

          const removeButton = event.target.closest('[data-keyword-remove]');
          if (removeButton) {
            const result = removeButton.closest(
              '.keyword-result, .keyword-result-embedded',
            );
            removeButton.closest('.keyword-chip')?.remove();

            if (result) {
              const keywords = queryAll('.keyword-chip-label', result)
                .map((item) => item.textContent.trim());
              const count = query('[data-selected-keyword-count]', result);
              const keywordString = query('[data-keyword-string]', result);

              if (count) count.textContent = keywords.length + '개';
              if (keywordString) keywordString.textContent = keywords.join(', ');
            }
            return;
          }

          const copyButton = event.target.closest('[data-copy-keywords]');
          if (copyButton) {
            const result = copyButton.closest(
              '.keyword-result, .keyword-result-embedded',
            );
            const keywordString = query('[data-keyword-string]', result);
            const text = keywordString?.textContent?.trim() || '';

            if (!text) return;

            try {
              await copyText(text);
              const originalText = copyButton.textContent;
              copyButton.textContent = '복사 완료';

              window.setTimeout(() => {
                copyButton.textContent = originalText;
              }, 1200);
            } catch {
              copyButton.textContent = '복사 실패';
            }
            return;
          }

          const templateTab = event.target.closest('[data-template-tab]');
          const templateResult = templateTab?.closest('[data-template-result]');

          if (templateTab && templateResult) {
            const target = templateTab.dataset.templateTab;

            queryAll('[data-template-panel]', templateResult)
              .forEach((panel) => {
                panel.hidden = panel.dataset.templatePanel !== target;
              });

            queryAll('[data-template-tab]', templateResult)
              .forEach((tab) => {
                const isActive = tab === templateTab;
                tab.classList.toggle('is-active', isActive);
                tab.setAttribute('aria-selected', String(isActive));
              });
            return;
          }

          const rankingTab = event.target.closest('[data-ranking-tab]');
          const rankingResult = rankingTab?.closest('[data-ranking-result]');

          if (rankingTab && rankingResult) {
            const target = rankingTab.dataset.rankingTab;

            queryAll('[data-ranking-panel]', rankingResult)
              .forEach((panel) => {
                panel.hidden = panel.dataset.rankingPanel !== target;
              });

            queryAll('[data-ranking-tab]', rankingResult)
              .forEach((tab) => {
                const isActive = tab === rankingTab;
                tab.classList.toggle('is-active', isActive);
                tab.setAttribute('aria-selected', String(isActive));
              });
            return;
          }

          const topicToggle = event.target.closest('[data-topic-toggle]');

          if (topicToggle) {
            const panelId = topicToggle.getAttribute('aria-controls');
            const panel = panelId
              ? document.getElementById(panelId)
              : query('[data-topic-panel]', topicToggle.parentElement);
            const willOpen =
              topicToggle.getAttribute('aria-expanded') !== 'true';

            topicToggle.setAttribute('aria-expanded', String(willOpen));

            if (panel) {
              panel.hidden = !willOpen;
            }
          }
        });
      })();
    </script>
  `;
}


function resolveTopbarContent(pathname, opts, documentTitle, description) {
  const normalizedPath = String(pathname || '/').split('?')[0];
  const activeMenu = opts?.activeMenu || 'home';

  if (normalizedPath === '/') {
    return {
      title: '작업 홈',
      description: '스톡 작가를 위한 키워드·템플릿 리서치 워크벤치',
    };
  }

  const titleWithoutBrand = String(documentTitle || '')
    .replace(/^\s*StockKeyword\s*[|·\-–—]\s*/i, '')
    .trim();

  const fallbackTitles = {
    home: '작업 홈',
    miricanvas: '미리캔버스',
    crowdpic: '크라우드픽',
    tooldi: '툴디',
    calendar: '월별 작업 캘린더',
    faq: 'FAQ',
    about: '소개',
    privacy: '개인정보처리방침',
    terms: '이용약관',
    contact: '문의',
  };

  return {
    title:
      titleWithoutBrand && titleWithoutBrand !== 'StockKeyword'
        ? titleWithoutBrand
        : fallbackTitles[activeMenu] || 'StockKeyword',
    description,
  };
}

export function htmlPage(pathname, origin, opts = {}) {
  const title = opts?.title || 'StockKeyword';
  const description =
    opts?.description ||
    '스톡 작가를 위한 키워드와 월별 소재를 정리합니다.';
  const topbar = resolveTopbarContent(
    pathname,
    opts,
    title,
    description,
  );

  return `
    <!doctype html>
    <html lang="ko">
      <head>
        <!-- Google Tag Manager -->
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-THGZ9WD3');</script>
        <!-- End Google Tag Manager -->
        <meta charset="utf-8">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >
        <meta name="description" content="${escapeHtml(description)}">
        <meta name="google-adsense-account" content="ca-pub-3386559853644133">
        <script async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3386559853644133"
          crossorigin="anonymous">
        </script>
        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="manifest" href="/site.webmanifest">
        <title>${escapeHtml(title)}</title>
        ${renderStyles()}
      </head>

      <body${pathname === '/calendar' ? ' class="calendar-overview"' : ''}>
        <!-- Google Tag Manager (noscript) -->
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-THGZ9WD3"
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
        <!-- End Google Tag Manager (noscript) -->
        <div class="app-shell">
          ${renderSidebar(opts?.activeMenu || 'home')}

          <button
            class="sidebar-backdrop"
            type="button"
            aria-label="메뉴 닫기"
            hidden
          ></button>

          <main class="main">
            ${renderTopbar(topbar.title, topbar.description)}
            <div class="page-content">
              ${opts?.contentHtml || ''}
            </div>
          </main>
        </div>

        ${renderClientScript()}
      </body>
    </html>
  `;
}
