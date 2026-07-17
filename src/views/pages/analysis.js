import { randomUUID } from 'node:crypto';

import { escapeHtml, normalizeOptions, toArray } from '../viewUtils.js';

function renderSearchForm(config = {}, query = '', selected = '') {
  const contentTypes = normalizeOptions(
    config?.contentTypes ?? config?.options ?? [],
  );
  const inputPlaceholder =
    config?.placeholder || '분석할 키워드를 입력하세요.';
  const requestId = randomUUID();

  return `
    <form class="search-form" method="get">
      <input type="hidden" name="requestId" value="${requestId}">
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
