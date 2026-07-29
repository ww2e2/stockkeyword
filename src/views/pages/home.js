import {
  getCurrentMonthNumber,
  getMonthLabel,
  getMonthTopic,
  getStockWorkPeriod,
} from '../../config/siteConfig.js';
import { renderPlatformCard, renderSectionHeader } from '../viewComponents.js';
import { escapeHtml, toArray } from '../viewUtils.js';

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


  if (source.includes('툴디') || source.includes('tooldi')) {
    return 'tooldi';
  }

  return '';
}

function renderPlatformOverview(config = {}) {
  const overview = config?.overview || {};
  const items = toArray(overview?.items);

  if (!items.length) return '';

  return `
    <section class="platform-overview-section">
      ${renderSectionHeader(
        overview?.title || `${config?.name || '플랫폼'} 소개`,
        overview?.description || '',
      )}

      <div class="platform-overview-card">
        <div class="platform-overview-grid">
          ${items.map((item) => `
            <div class="platform-overview-item">
              <h3>${escapeHtml(item?.title || '')}</h3>
              <p>${escapeHtml(item?.description || '')}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

export function renderPlatformPage(config = {}) {
  const platformId = getPlatformId(config);

  const platformTools = {
    miricanvas: [
      {
        label: '키워드 분석',
        description: '검색어를 입력하면 상위 작품의 키워드를 분석해 추천합니다.',
        href: '/miricanvas/tag',
      },
      {
        label: '템플릿 분석',
        description: '상위 템플릿의 제목과 키워드 구성을 분석합니다.',
        href: '/miricanvas/template',
      },
      {
        label: '이번 달 인기 검색 순위',
        description: '이번 달 인기 검색어와 콘텐츠 유형 순위를 확인합니다.',
        href: '/miricanvas/rankings',
      },
    ],
    tooldi: [
      {
        label: '키워드 분석',
        description: '검색어를 입력하면 상위 콘텐츠의 키워드를 분석해 추천합니다.',
        href: '/tooldi/tag',
      },
      {
        label: '템플릿 분석',
        description: '상위 템플릿의 제목과 기획 키워드를 분석합니다.',
        href: '/tooldi/template',
      },
      {
        label: '이번 달 인기 검색 순위',
        description: '이번 달 인기 검색어와 템플릿 순위를 확인합니다.',
        href: '/tooldi/rankings',
      },
    ],
  };

  const configuredTools = toArray(config?.tools);
  const tools = platformTools[platformId] || configuredTools;
  const gridClass = tools.length === 2 ? ' is-two-columns' : '';

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
        <div class="home-platform-grid platform-tools-grid${gridClass}">
          ${cards || '<p class="empty-state">사용 가능한 기능이 없습니다.</p>'}
        </div>
      </section>

      ${renderPlatformOverview(config)}
    </div>
  `;
}
