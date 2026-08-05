import {
  getCurrentMonthNumber,
  getMonthLabel,
  getMonthTopic,
  getStockWorkPeriod,
} from '../../config/siteConfig.js';
import { renderSectionHeader } from '../viewComponents.js';
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
      <section class="home-service-notice" aria-labelledby="service-notice-title">
        <span class="home-service-notice-label">서비스 안내</span>
        <h2 id="service-notice-title">플랫폼 관련 기능 지원 종료 안내</h2>
        <p>플랫폼 정책상 앞으로는 관련 기능 지원이 어려울 것 같습니다.</p>
        <p>키워드 분석, 템플릿 분석, 월간 인기 검색 순위와 관련 URL을 모두 비활성화했으며 신규 데이터 수집도 중단했습니다.</p>
        <a class="home-service-notice-link" href="/updates">자세한 변경 내용 확인하기 →</a>
      </section>

      ${renderMonthlyTopics({
        month: targetMonth,
        title: '이번 달 추천 소재',
        description: '이번 달 스톡 작업에 활용하기 좋은 소재',
      })}
    </div>
  `;
}

export function renderPlatformPage() {
  return '';
}
