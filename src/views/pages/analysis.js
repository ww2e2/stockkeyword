import { randomUUID } from 'node:crypto';

import { PLATFORM_CONFIGS } from '../../config/siteConfig.js';
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

function getExampleQuery(formConfig = {}, feature = 'keyword') {
  const placeholder = String(formConfig?.placeholder || '')
    .replace(/^\s*예\)\s*/, '')
    .trim();

  if (placeholder) return placeholder;
  return feature === 'template' ? '여름 여행' : '테니스';
}

function getOptionSummary(formConfig = {}) {
  const options = normalizeOptions(
    formConfig?.contentTypes ?? formConfig?.options ?? [],
  );
  const labels = options.map((item) => item.label).filter(Boolean);

  if (labels.length <= 3) return labels.join(' · ');
  return `${labels.slice(0, 3).join(' · ')} 외 ${labels.length - 3}개`;
}

function getAnalysisPath(config = {}, feature = 'keyword') {
  const platformId = String(config?.id || '').trim();
  if (!platformId) return '#';
  return `/${platformId}/${feature === 'template' ? 'template' : 'tag'}`;
}

function renderGuideStep(number, title, content, { description = false } = {}) {
  return `
    <div class="analysis-guide-step">
      <div class="analysis-guide-step-heading">
        <span class="analysis-guide-step-number" aria-hidden="true">${number}</span>
        <h3>${escapeHtml(title)}</h3>
      </div>
      ${description
        ? `<p class="analysis-guide-step-description">${escapeHtml(content)}</p>`
        : `<span class="analysis-guide-step-value">${escapeHtml(content)}</span>`}
    </div>
  `;
}

function renderPopularSearches(popularSearches = [], analysisPath = '#') {
  const keywords = toArray(popularSearches)
    .map((item) => String(item?.label ?? item ?? '').trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!keywords.length) return '';

  return `
    <div class="analysis-popular-searches">
      <span class="analysis-popular-label">이번 달 인기 검색어</span>
      <div class="analysis-popular-chip-list">
        ${keywords.map((keyword) => `
          <a
            class="analysis-popular-chip"
            href="${escapeHtml(analysisPath)}?q=${encodeURIComponent(keyword)}"
          >
            ${escapeHtml(keyword)}
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

function platformSupportsFeature(platform = {}, feature = 'keyword') {
  if (feature === 'template') {
    return Boolean(
      platform?.rankingFeatures?.template
      && platform?.templateSearchOptions,
    );
  }

  return Boolean(
    platform?.rankingFeatures?.keyword
    && platform?.searchOptions,
  );
}

function getPromotionEntries(config = {}, feature = 'keyword') {
  const currentPlatformId = String(config?.id || '').trim();

  return Object.values(PLATFORM_CONFIGS)
    .filter((platform) => (
      platform?.id
      && platform.id !== 'tooldi'
      && platform.id !== currentPlatformId
      && platformSupportsFeature(platform, feature)
    ))
    .map((platform) => {
      const promotion = platform?.promotion || {};
      const sponsorship = promotion?.sponsorship || {};

      return {
        id: platform.id,
        name: platform.name,
        href: getAnalysisPath(platform, feature),
        logoUrl: promotion.logoUrl || '',
        logoFallback: promotion.logoFallback || platform.name?.slice(0, 1) || '',
        description:
          promotion?.descriptions?.[feature]
          || promotion?.description
          || platform.description
          || '',
        badges: toArray(promotion?.badges),
        displayOrder: Number(promotion?.displayOrder) || 999,
        isSponsored: Boolean(sponsorship?.enabled),
        sponsorPriority: Number(sponsorship?.priority) || 0,
      };
    })
    .sort((left, right) => (
      Number(right.isSponsored) - Number(left.isSponsored)
      || right.sponsorPriority - left.sponsorPriority
      || left.displayOrder - right.displayOrder
      || left.name.localeCompare(right.name, 'ko')
    ));
}

function renderPlatformLogo(entry = {}) {
  const fallback = `
    <span
      class="analysis-platform-logo-fallback"
      ${entry.logoUrl ? 'hidden' : ''}
      aria-hidden="true"
    >
      ${escapeHtml(entry.logoFallback)}
    </span>
  `;

  return `
    <span class="analysis-platform-logo" aria-hidden="true">
      ${entry.logoUrl
        ? `
          <img
            src="${escapeHtml(entry.logoUrl)}"
            alt=""
            width="40"
            height="40"
            loading="lazy"
            referrerpolicy="no-referrer"
            onerror="this.hidden=true;this.nextElementSibling.hidden=false"
          >
        `
        : ''}
      ${fallback}
    </span>
  `;
}

function renderPromotionBadge(badge = {}) {
  const label = typeof badge === 'string' ? badge : badge?.label;
  if (!label) return '';

  const allowedTones = new Set(['brand', 'positive', 'negative', 'neutral']);
  const requestedTone = typeof badge === 'string' ? 'neutral' : badge?.tone;
  const tone = allowedTones.has(requestedTone) ? requestedTone : 'neutral';

  return `
    <span class="analysis-platform-badge is-${tone}">
      ${escapeHtml(label)}
    </span>
  `;
}

function renderCrossPlatformCard(config = {}, feature = 'keyword') {
  const entries = getPromotionEntries(config, feature);
  if (!entries.length) return '';

  const buttonLabel = feature === 'template' ? '템플릿 분석' : '키워드 분석';

  return `
    <section class="analysis-cross-platform-card">
      <div class="analysis-cross-platform-copy">
        <h2>한 작품으로 더 많은 플랫폼에 도전하시나요?</h2>
        <p>플랫폼별 수익 방식과 업로드 정책을 함께 확인해보세요.</p>
      </div>

      <div class="analysis-platform-list">
        ${entries.map((entry) => `
          <article class="analysis-platform-row${entry.isSponsored ? ' is-sponsored' : ''}">
            ${renderPlatformLogo(entry)}

            <div class="analysis-platform-content">
              <div class="analysis-platform-title-row">
                <h3>${escapeHtml(entry.name)}</h3>
                ${entry.isSponsored
                  ? '<span class="analysis-platform-sponsored">스폰서</span>'
                  : ''}
              </div>

              <p>${escapeHtml(entry.description)}</p>

              ${entry.badges.length
                ? `
                  <div class="analysis-platform-badges">
                    ${entry.badges.map(renderPromotionBadge).join('')}
                  </div>
                `
                : ''}
            </div>

            <a
              class="button button-secondary analysis-platform-action"
              href="${escapeHtml(entry.href)}"
            >
              ${buttonLabel}
            </a>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

function renderAnalysisGuide({
  config = {},
  formConfig = {},
  feature = 'keyword',
  popularSearches = [],
} = {}) {
  const isTemplate = feature === 'template';
  const exampleQuery = getExampleQuery(formConfig, feature);
  const optionSummary = getOptionSummary(formConfig);
  const analysisPath = getAnalysisPath(config, feature);
  const guideDescription = isTemplate
    ? '제작할 주제를 입력하고 템플릿 유형을 선택하면 제목과 키워드를 확인할 수 있습니다.'
    : '검색어를 입력하고 콘텐츠 유형을 선택하면 추천 키워드를 확인할 수 있습니다.';

  return `
    <section class="analysis-guide-card">
      <div class="analysis-guide-header">
        <h2>처음 사용하시나요?</h2>
        <p>${escapeHtml(guideDescription)}</p>
      </div>

      <div class="analysis-guide-steps">
        ${renderGuideStep(
          1,
          isTemplate ? '주제 입력' : '검색어 입력',
          exampleQuery,
        )}
        ${renderGuideStep(
          2,
          isTemplate ? '템플릿 유형 선택' : '콘텐츠 유형 선택',
          optionSummary,
        )}
        ${renderGuideStep(
          3,
          isTemplate ? '제목과 키워드 확인' : '추천 키워드 확인 및 복사',
          isTemplate
            ? '상위 템플릿에서 자주 사용된 표현과 키워드를 참고하세요.'
            : '분석 결과에서 필요한 키워드를 한 번에 복사하세요.',
          { description: true },
        )}
      </div>

      <div class="analysis-guide-footer">
        <a
          class="button button-secondary analysis-example-link"
          href="${escapeHtml(analysisPath)}?q=${encodeURIComponent(exampleQuery)}"
        >
          ${escapeHtml(exampleQuery)}로 확인하기
        </a>
        ${renderPopularSearches(popularSearches, analysisPath)}
      </div>
    </section>
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

export function renderKeywordAnalysisPage(
  config = {},
  result = null,
  { popularSearches = [] } = {},
) {
  const formConfig = config?.searchOptions || config;

  return `
    <div class="analysis-page">
      ${renderSearchForm(
        formConfig,
        result?.query,
        result?.contentType,
      )}
      ${result
        ? renderKeywordResult(result)
        : renderAnalysisGuide({
            config,
            formConfig,
            feature: 'keyword',
            popularSearches,
          })}
      ${renderCrossPlatformCard(config, 'keyword')}
    </div>
  `;
}

function renderMetricList(items, renderer) {
  return items?.length
    ? `<div class="metric-list">${items.map(renderer).join('')}</div>`
    : '<p class="empty-state">분석 결과가 없습니다.</p>';
}

export function renderTemplateAnalysisPage(
  config = {},
  result = null,
  { popularSearches = [] } = {},
) {
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
        : renderAnalysisGuide({
            config,
            formConfig,
            feature: 'template',
            popularSearches,
          })}
      ${renderCrossPlatformCard(config, 'template')}
    </div>
  `;
}
