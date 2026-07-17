import { getMonthTopic, getStockWorkPeriod } from '../../config/siteConfig.js';
import { escapeHtml } from '../viewUtils.js';

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
