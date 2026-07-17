import { escapeHtml, toArray } from '../viewUtils.js';

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

