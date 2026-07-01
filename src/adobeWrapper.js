import { requestHandler as baseRequestHandler } from './app.js';
import { normalizeAdobeLanguage, normalizeAdobeSearchType } from './adobeStock.js';
import { runAdobePlaywrightSearchDebug } from './adobePlaywrightDebug.js';

const ADOBE_STOCK_ENABLED = String(process.env.ADOBE_STOCK_ENABLED || 'false').toLowerCase() === 'true';

function cleanText(value) {
  return String(value ?? '').replace(/\uFEFF/g, '').trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildCaptureResponse(resolve) {
  const chunks = [];
  let statusCode = 200;
  let headers = {};

  return {
    writeHead(code, responseHeaders = {}) {
      statusCode = code;
      headers = { ...headers, ...responseHeaders };
    },
    setHeader(name, value) {
      headers[name] = value;
    },
    end(chunk) {
      if (chunk) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      }
      resolve({
        statusCode,
        headers,
        body: Buffer.concat(chunks).toString('utf8'),
      });
    },
  };
}

async function captureHtml(pathname, origin, search = '') {
  const req = {
    method: 'GET',
    url: `${pathname}${search}`,
    headers: {
      host: new URL(origin).host,
      'x-forwarded-proto': new URL(origin).protocol.replace(':', ''),
    },
  };

  return new Promise((resolve) => {
    const res = buildCaptureResponse(resolve);
    Promise.resolve(baseRequestHandler(req, res)).catch((error) => {
      resolve({
        statusCode: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: error?.stack || error?.message || String(error),
      });
    });
  });
}

function writeJson(res, payload, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

function serializeScriptJson(value) {
  return JSON.stringify(value ?? null)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(new RegExp(String.fromCharCode(0x2028), 'g'), '\\u2028')
    .replace(new RegExp(String.fromCharCode(0x2029), 'g'), '\\u2029');
}
function isLocalDebugRequest(host) {
  const value = cleanText(host).toLowerCase();
  return value.startsWith('127.0.0.1') || value.startsWith('localhost');
}

function replaceSection(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

function setAdobeMenuActive(html) {
  return html
    .replace('href="/miricanvas" class="active"', 'href="/miricanvas" class=""')
    .replace('href="/adobe-stock" class=""', 'href="/adobe-stock" class="active"');
}

function replaceSeoAndHero(html, origin, pathname, title, description) {
  let next = html;
  const canonical = `${origin}${pathname}`;

  next = replaceSection(next, /<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  next = replaceSection(next, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`);
  next = replaceSection(next, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  next = replaceSection(next, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  next = replaceSection(next, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  next = replaceSection(next, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  next = replaceSection(next, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  next = replaceSection(next, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  next = replaceSection(next, /<h1>[^<]*<\/h1>/, '<h1>Adobe Stock 검색 키워드 분석</h1>');
  next = replaceSection(next, /<p class="desc">[\s\S]*?<\/p>/, '<p class="desc">기존 미리캔버스 검색 페이지 스타일을 유지한 상태로 브라우저에서 직접 Adobe Ajax Search URL을 fetch해 CORS 가능 여부를 확인합니다.</p>');

  return next;
}

function buildAdobeHomeCardHtml() {
  return `
        <article class="feature-card platform-card">
          <div class="platform-head">
            <div class="platform-badges">
              <span class="status-badge coming">\uC900\uBE44\uC911</span>
            </div>
          </div>
          <h2>\uC5B4\uB3C4\uBE44 \uC2A4\uD1A1</h2>
          <p>\uC900\uBE44\uC911</p>
        </article>`;
}

function replaceAdobeHomeCard(html) {
  const lines = html.split(/\r?\n/);
  const firstComingBadgeIndex = lines.findIndex((line, index) => line.includes('status-badge coming') && index > 0);
  if (firstComingBadgeIndex === -1) {
    return html;
  }

  let firstCardStart = firstComingBadgeIndex;
  while (firstCardStart > 0 && !lines[firstCardStart].includes('<article class="feature-card platform-card">')) {
    firstCardStart -= 1;
  }

  let firstCardEnd = firstComingBadgeIndex;
  while (firstCardEnd < lines.length && !lines[firstCardEnd].trim().startsWith('</article>')) {
    firstCardEnd += 1;
  }

  const secondComingBadgeIndex = lines.findIndex((line, index) => index > firstCardEnd && line.includes('status-badge coming'));
  if (secondComingBadgeIndex === -1) {
    return html;
  }

  let secondCardStart = secondComingBadgeIndex;
  while (secondCardStart > 0 && !lines[secondCardStart].includes('<article class="feature-card platform-card">')) {
    secondCardStart -= 1;
  }

  let secondCardEnd = secondComingBadgeIndex;
  while (secondCardEnd < lines.length && !lines[secondCardEnd].trim().startsWith('</article>')) {
    secondCardEnd += 1;
  }

  lines.splice(secondCardStart, secondCardEnd - secondCardStart + 1, ...buildAdobeHomeCardHtml().trimEnd().split(/\r?\n/));
  return lines.join('\n');
}

function buildLanguageOptions(selectedValue) {
  const options = [
    ['ko', '한국어'],
    ['en', 'English'],
    ['fr', 'Français'],
    ['de', 'Deutsch'],
    ['es', 'Español'],
    ['it', 'Italiano'],
    ['pt', 'Português'],
    ['ja', '日本語'],
    ['pl', 'Polski'],
  ];

  return options
    .map(([value, label]) => `<option value="${value}"${value === selectedValue ? ' selected' : ''}>${label}</option>`)
    .join('');
}

function buildSearchTypeOptions(selectedValue) {
  const options = [
    ['all', '전체'],
    ['image', '콘텐츠'],
    ['video', '비디오'],
    ['template', '템플릿'],
    ['3d', '3D'],
  ];

  return options
    .map(([value, label]) => `<option value="${value}"${value === selectedValue ? ' selected' : ''}>${label}</option>`)
    .join('');
}

function buildAdobeSearchKeywordScript() {
  return `
    <script>
      (() => {
        const formEl = document.getElementById('adobeSearchForm');
        const languageEl = document.getElementById('adobeLanguage');
        const searchTypeEl = document.getElementById('adobeSearchType');
        const keywordEl = document.getElementById('adobeKeyword');
        const statusEl = document.getElementById('adobeFetchStatus');
        const resultPanelEl = document.getElementById('adobeSearchResultPanel');

        if (!formEl || !languageEl || !searchTypeEl || !keywordEl || !statusEl || !resultPanelEl) {
          return;
        }

        function readInitialResult() {
          const scriptEl = document.getElementById('initialAdobeResult');
          if (!scriptEl) {
            return null;
          }

          try {
            return JSON.parse(scriptEl.textContent || 'null');
          } catch (error) {
            console.error('[Adobe search page] initialResult JSON parse error:', error);
            return null;
          }
        }

        const initialResult = readInitialResult();
        console.log('[Adobe search page] initialResult:', initialResult, {
          ok: initialResult?.ok,
          titleCount: Array.isArray(initialResult?.titleList) ? initialResult.titleList.length : 0,
          keywordCount: Array.isArray(initialResult?.keywordList) ? initialResult.keywordList.length : 0,
        });
        const state = {
          result: null,
          activeKeywords: [],
        };

        function cleanText(value) {
          return String(value ?? '').replace(/\uFEFF/g, '').trim();
        }

        function escapeHtml(value) {
          return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function normalizeLanguage(value) {
          const normalized = cleanText(value).toLowerCase();
          if (normalized === 'kr') return 'ko';
          if (normalized === 'jp') return 'ja';
          return ['ko', 'en', 'fr', 'de', 'es', 'it', 'pt', 'ja', 'pl'].includes(normalized) ? normalized : 'en';
        }

        function normalizeSearchType(value) {
          const normalized = cleanText(value).toLowerCase();
          return ['all', 'image', 'video', 'template', '3d'].includes(normalized) ? normalized : 'all';
        }

        function setStatus(message) {
          statusEl.textContent = message;
        }

        function updateLocation(language, searchType, keyword) {
          const pageUrl = new URL(window.location.href);
          pageUrl.searchParams.set('language', language);
          pageUrl.searchParams.set('searchType', searchType);
          pageUrl.searchParams.set('q', keyword);
          window.history.replaceState({}, '', pageUrl.toString());
        }

        function buildDebugUrl(language, searchType, keyword) {
          const url = new URL('/debug/adobe-playwright-search', window.location.origin);
          url.searchParams.set('q', keyword);
          url.searchParams.set('language', language);
          url.searchParams.set('searchType', searchType);
          return url.toString();
        }

        const progressSteps = [
          {
            title: '\uD83D\uDD0D \uac80\uc0c9 \uacb0\uacfc\ub97c \ubd84\uc11d\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4.',
            description: '\uc57d 10~15\ucd08 \uc815\ub3c4 \uc18c\uc694\ub429\ub2c8\ub2e4.',
          },
          {
            title: '\uD83D\uDCC4 \uad00\ub828 \ucf58\ud150\uce20\ub97c \ubd84\uc11d\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4.',
            description: '\uc7a0\uc2dc\ub9cc \uae30\ub2e4\ub824 \uc8fc\uc138\uc694.',
          },
          {
            title: '\uD83C\uDFF7\uFE0F \ucd94\ucc9c \ud0a4\uc6cc\ub4dc\ub97c \uc0dd\uc131\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4.',
            description: '\uac70\uc758 \uc644\ub8cc\ub418\uc5c8\uc2b5\ub2c8\ub2e4.',
          },
          {
            title: '\u2728 \ubd84\uc11d \uacb0\uacfc\ub97c \uc815\ub9ac\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4.',
            description: '\uacb0\uacfc\ub97c \ud45c\uc2dc\ud558\uace0 \uc788\uc2b5\ub2c8\ub2e4.',
          },
        ];
        let progressTimer = null;

        function stopProgress() {
          if (progressTimer) {
            window.clearInterval(progressTimer);
            progressTimer = null;
          }
        }

        function renderProgress(activeIndex) {
          const activeStep = progressSteps[activeIndex];
          const stepItems = progressSteps.map((step, index) => {
            const opacity = index <= activeIndex ? '1' : '0.55';
            const weight = index === activeIndex ? '700' : '500';
            return '<li style="opacity:' + opacity + '; font-weight:' + weight + '; margin:6px 0;">' + escapeHtml(step.title) + '</li>';
          }).join('');

          resultPanelEl.innerHTML = '' +
            '<div class="result-empty">' +
              (activeStep.description ? '<div style="margin-bottom:12px; opacity:0.85;">' + escapeHtml(activeStep.description) + '</div>' : '') +
              '<ol style="text-align:left; display:inline-block; margin:0 auto; padding-left:22px;">' + stepItems + '</ol>' +
            '</div>';
        }

        function startProgress() {
          stopProgress();
          let activeIndex = 0;
          setStatus(progressSteps[activeIndex].title);
          renderProgress(activeIndex);
          progressTimer = window.setInterval(() => {
            activeIndex = Math.min(activeIndex + 1, progressSteps.length - 1);
            setStatus(progressSteps[activeIndex].title);
            renderProgress(activeIndex);
            if (activeIndex === progressSteps.length - 1) {
              stopProgress();
            }
          }, 2500);
        }

        function renderEmpty(message) {
          resultPanelEl.innerHTML = '<div class="result-empty">' + escapeHtml(message) + '</div>';
        }

        function renderError(detail) {
          const detailHtml = cleanText(detail)
            ? '<div class="result-empty" style="margin-top:10px; font-size:13px; opacity:0.85;">' + escapeHtml(detail) + '</div>'
            : '';
          resultPanelEl.innerHTML = '<div class="result-empty">분석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.</div>' + detailHtml;
        }

        async function copyText(text, successMessage) {
          if (!cleanText(text)) {
            setStatus('복사할 데이터가 없습니다.');
            return;
          }

          try {
            await navigator.clipboard.writeText(text);
            setStatus(successMessage);
          } catch (error) {
            console.error('[Adobe search] copy error:', error);
            setStatus('복사에 실패했습니다.');
          }
        }

        function removeKeyword(index) {
          state.activeKeywords.splice(index, 1);
          renderResult();
        }

        function setAdobeResultTab(activeTab) {
          resultPanelEl.querySelectorAll('[data-adobe-result-panel]').forEach((panel) => {
            panel.style.display = panel.getAttribute('data-adobe-result-panel') === activeTab ? '' : 'none';
          });

          resultPanelEl.querySelectorAll('[data-adobe-result-tab]').forEach((button) => {
            const isActive = button.getAttribute('data-adobe-result-tab') === activeTab;
            button.className = isActive ? 'primary' : 'secondary';
          });
        }

        function bindResultActions() {
          const titleCopyBtn = document.getElementById('adobeTitleCopyBtn');
          const keywordCopyBtn = document.getElementById('adobeKeywordCopyBtn');

          if (titleCopyBtn) {
            titleCopyBtn.addEventListener('click', () => {
              const titleList = Array.isArray(state.result?.titleList) ? state.result.titleList : [];
              copyText(titleList.join('\\n'), '\uc81c\ubaa9\uc744 \ubcf5\uc0ac\ud588\uc2b5\ub2c8\ub2e4.');
            });
          }

          if (keywordCopyBtn) {
            keywordCopyBtn.addEventListener('click', () => {
              copyText(state.activeKeywords.join(', '), '\ud0a4\uc6cc\ub4dc\ub97c \ubcf5\uc0ac\ud588\uc2b5\ub2c8\ub2e4.');
            });
          }

          resultPanelEl.querySelectorAll('[data-adobe-result-tab]').forEach((button) => {
            button.addEventListener('click', () => {
              setAdobeResultTab(button.getAttribute('data-adobe-result-tab') || 'keywords');
            });
          });

          resultPanelEl.querySelectorAll('[data-adobe-remove-index]').forEach((button) => {
            button.addEventListener('click', () => {
              const index = Number(button.getAttribute('data-adobe-remove-index'));
              if (Number.isFinite(index)) {
                removeKeyword(index);
              }
            });
          });
        }

        function renderResult() {
          const result = state.result || {};
          const titleList = Array.isArray(result.titleList) ? result.titleList : [];
          console.log('[Adobe search page] renderResult called:', {
            ok: result?.ok,
            titleCount: titleList.length,
            keywordCount: Array.isArray(state.activeKeywords) ? state.activeKeywords.length : 0,
          });

          if (titleList.length === 0) {
            renderEmpty('\ubd84\uc11d \uacb0\uacfc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.');
            return;
          }

          const keywordTags = state.activeKeywords.map((keyword, index) => {
            return '' +
              '<span class="tag">' +
                '<span class="tag-label">' + escapeHtml(keyword) + '</span>' +
                '<button type="button" class="tag-remove" data-adobe-remove-index="' + index + '" aria-label="' + escapeHtml(keyword + ' \uc0ad\uc81c') + '">X</button>' +
              '</span>';
          }).join('');
          const keyword = cleanText(result.keyword || keywordEl.value || '');
          const collectedAt = new Date().toLocaleDateString('en-CA');

          resultPanelEl.innerHTML = '' +
            '<section class="result-card stack">' +
              '<section class="summary-card">' +
                '<div class="result-head">' +
                  '<div>' +
                    '<h3 class="result-title">[' + escapeHtml(keyword) + ']</h3>' +
                    '<div class="meta">\ubd84\uc11d \ub300\uc0c1: ' + titleList.length + '\uac1c / \uc218\uc9d1\uc77c: ' + escapeHtml(collectedAt) + '</div>' +
                  '</div>' +
                '</div>' +
                '<div class="actions" style="margin-top:14px;">' +
                  '<button type="button" class="primary" data-adobe-result-tab="keywords">\ucd94\ucc9c \ud0a4\uc6cc\ub4dc</button>' +
                  '<button type="button" class="secondary" data-adobe-result-tab="titles">\uc0c1\uc704 \uc81c\ubaa9</button>' +
                '</div>' +
                '<div data-adobe-result-panel="keywords" style="margin-top:16px;">' +
                  '<div class="result-head">' +
                    '<h3 class="result-title">\ucd94\ucc9c \ud0a4\uc6cc\ub4dc 60\uac1c</h3>' +
                    '<button id="adobeKeywordCopyBtn" type="button" class="secondary copy-chip">\ud0a4\uc6cc\ub4dc \ubcf5\uc0ac</button>' +
                  '</div>' +
                  (state.activeKeywords.length > 0
                    ? '<div class="tags">' + keywordTags + '</div>'
                    : '<div class="result-empty">\ubd84\uc11d \uacb0\uacfc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4.</div>') +
                '</div>' +
                '<div data-adobe-result-panel="titles" style="display:none; margin-top:16px;">' +
                  '<div class="result-head">' +
                    '<h3 class="result-title">\uc0c1\uc704 \uc81c\ubaa9 TOP30</h3>' +
                    '<button id="adobeTitleCopyBtn" type="button" class="secondary copy-chip">\uc81c\ubaa9 \ubcf5\uc0ac</button>' +
                  '</div>' +
                  '<ol class="title-list">' + titleList.map((title) => '<li>' + escapeHtml(title) + '</li>').join('') + '</ol>' +
                '</div>' +
              '</section>' +
            '</section>';

          bindResultActions();
          setAdobeResultTab('keywords');
        }

        async function runSearch() {
          const language = normalizeLanguage(languageEl.value);
          const searchType = normalizeSearchType(searchTypeEl.value);
          const keyword = cleanText(keywordEl.value);

          if (!keyword) {
            setStatus('검색 언어, 검색 타입, 키워드를 입력하면 결과가 표시됩니다.');
            renderEmpty('검색 언어, 검색 타입, 키워드를 입력하면 결과가 표시됩니다.');
            return;
          }

          updateLocation(language, searchType, keyword);
          const debugUrl = buildDebugUrl(language, searchType, keyword);

          startProgress();

          try {
            const response = await fetch(debugUrl, { method: 'GET' });
            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data?.ok) {
              const detail = cleanText(data?.body500 || data?.message || data?.statusText || '');
              stopProgress();
              setStatus('\ubd84\uc11d \uc911 \ubb38\uc81c\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.');
              renderError(detail);
              return;
            }

            stopProgress();
            state.result = data;
            state.activeKeywords = Array.isArray(data.keywordList) ? [...data.keywordList] : [];
            setStatus('\ubd84\uc11d\uc774 \uc644\ub8cc\ub418\uc5c8\uc2b5\ub2c8\ub2e4.');
            renderResult();
          } catch (error) {
            stopProgress();
            console.error('[Adobe search] error:', error);
            setStatus('\ubd84\uc11d \uc911 \ubb38\uc81c\uac00 \ubc1c\uc0dd\ud588\uc2b5\ub2c8\ub2e4. \uc7a0\uc2dc \ud6c4 \ub2e4\uc2dc \uc2dc\ub3c4\ud574 \uc8fc\uc138\uc694.');
            renderError(error?.message || String(error));
          }
        }
        formEl.addEventListener('submit', (event) => {
          const language = normalizeLanguage(languageEl.value);
          const searchType = normalizeSearchType(searchTypeEl.value);
          const keyword = cleanText(keywordEl.value);

          event.preventDefault();

          if (!keyword) {
            setStatus('\uac80\uc0c9 \uc5b8\uc5b4, \uac80\uc0c9 \ud0c0\uc785, \uac80\uc0c9\uc5b4\ub97c \uc785\ub825\ud558\uba74 \uacb0\uacfc\uac00 \ud45c\uc2dc\ub429\ub2c8\ub2e4.');
            renderEmpty('\uac80\uc0c9 \uc5b8\uc5b4, \uac80\uc0c9 \ud0c0\uc785, \uac80\uc0c9\uc5b4\ub97c \uc785\ub825\ud558\uba74 \uacb0\uacfc\uac00 \ud45c\uc2dc\ub429\ub2c8\ub2e4.');
            return;
          }

          languageEl.value = language;
          searchTypeEl.value = searchType;
          keywordEl.value = keyword;
          runSearch();
        });

        if (initialResult) {
          if (initialResult.ok) {
            state.result = initialResult;
            state.activeKeywords = Array.isArray(initialResult.keywordList) ? [...initialResult.keywordList] : [];
            setStatus('분석이 완료되었습니다.');
            console.log('[Adobe search page] renderResult(initialResult) before call');
            try {
              renderResult();
              console.log('[Adobe search page] renderResult(initialResult) after call');
            } catch (error) {
              console.error('[Adobe search page] renderResult(initialResult) error:', error);
              renderError(error?.message || String(error));
            }
          } else {
            setStatus('분석 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
            renderError('');
          }
        } else if (cleanText(keywordEl.value)) {
          runSearch();
        } else {
          renderEmpty('검색 언어, 검색 타입, 키워드를 입력하면 결과가 표시됩니다.');
          setStatus('검색 언어, 검색 타입, 키워드를 입력하면 결과가 표시됩니다.');
        }
      })();
    </script>
  `;
}

function buildAdobeSearchKeywordMain(searchParams, initialResult = null) {
  const language = normalizeAdobeLanguage(searchParams.get('language') || 'ko');
  const searchType = normalizeAdobeSearchType(searchParams.get('searchType') || 'all');
  const keyword = cleanText(searchParams.get('q') || '');

  return `
    <!-- Local/VPS only: this page currently depends on the local debug Playwright API and is not intended for Vercel deployment yet. -->
    <div class="grid">
      <section class="card">
        <label for="adobeLanguage">검색 언어</label>
        <form id="adobeSearchForm" method="GET" action="/adobe-stock/search-keyword">
          <select id="adobeLanguage" name="language" class="text-input">
            ${buildLanguageOptions(language)}
          </select>

          <label for="adobeSearchType" style="display:block; margin-top:16px;">검색 타입</label>
          <select id="adobeSearchType" name="searchType" class="text-input">
            ${buildSearchTypeOptions(searchType)}
          </select>

          <label for="adobeKeyword" style="display:block; margin-top:16px;">키워드</label>
          <input id="adobeKeyword" name="q" class="text-input" type="text" value="${escapeHtml(keyword)}" placeholder="검색 키워드를 입력하세요" />

          <div class="actions">
            <button class="primary" type="submit">검색</button>
          </div>
          <div id="adobeFetchStatus" class="status">검색 언어, 검색 타입, 키워드를 입력하면 결과가 표시됩니다.</div>
        </form>
      </section>

      <section class="card">
        <label>결과</label>
        <div id="adobeSearchResultPanel" class="result-panel">
          <div class="result-empty">검색 언어, 검색 타입, 키워드를 입력하면 결과가 표시됩니다.</div>
        </div>
      </section>
    </div>
    <script id="initialAdobeResult" type="application/json">${serializeScriptJson(initialResult)}</script>
    ${buildAdobeSearchKeywordScript()}
  `;
}
function replaceMain(html, mainHtml) {
  return html.replace(/<main>[\s\S]*?<\/main>/, `<main>\n      ${mainHtml.trim()}\n    </main>`);
}

async function renderHomePage(origin) {
  const shell = await captureHtml('/', origin);
  return replaceAdobeHomeCard(shell.body);
}

function buildAdobeComingSoonMain() {
  return `
    <section class="card stack">
      <span class="status-badge coming">\uC900\uBE44\uC911</span>
      <h2>\uC5B4\uB3C4\uBE44 \uC2A4\uD1A1 \uBD84\uC11D \uB3C4\uAD6C\uB294 \uC900\uBE44\uC911\uC785\uB2C8\uB2E4.</h2>
      <p class="desc">\uD604\uC7AC Adobe Stock \uACF5\uC2DD API \uAC80\uD1A0\uC640 \uC548\uC815\uC131 \uD655\uC778\uC744 \uC9C4\uD589\uD558\uACE0 \uC788\uC2B5\uB2C8\uB2E4. \uC900\uBE44\uAC00 \uC644\uB8CC\uB418\uAE30 \uC804\uAE4C\uC9C0\uB294 \uBD84\uC11D \uAE30\uB2A5\uC774 \uB178\uCD9C\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.</p>
      <div class="result-empty">\uBBF8\uB9AC\uCE94\uBC84\uC2A4 \uBD84\uC11D \uAE30\uB2A5\uC740 \uACC4\uC18D \uC815\uC0C1 \uC774\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.</div>
    </section>
  `;
}

async function renderAdobeComingSoonPage(origin, pathname = '/adobe-stock') {
  const shell = await captureHtml('/miricanvas/tag', origin);
  const withMenu = setAdobeMenuActive(shell.body);
  const withSeo = replaceSeoAndHero(
    withMenu,
    origin,
    pathname,
    '\uC5B4\uB3C4\uBE44 \uC2A4\uD1A1 \uBD84\uC11D \uB3C4\uAD6C \uC900\uBE44\uC911 | \uBBF8\uB9AC\uCE94\uBC84\uC2A4 \uD0A4\uC6CC\uB4DC \uBD84\uC11D \uC0AC\uC774\uD2B8',
    '\uC5B4\uB3C4\uBE44 \uC2A4\uD1A1 \uBD84\uC11D \uB3C4\uAD6C\uB294 \uD604\uC7AC \uC900\uBE44\uC911\uC785\uB2C8\uB2E4.'
  );
  const withComingSoonHero = replaceSection(
    replaceSection(withSeo, /<h1>[^<]*<\/h1>/, '<h1>\uC5B4\uB3C4\uBE44 \uC2A4\uD1A1 \uBD84\uC11D \uB3C4\uAD6C \uC900\uBE44\uC911</h1>'),
    /<p class="desc">[\s\S]*?<\/p>/,
    '<p class="desc">\uC900\uBE44\uAC00 \uC644\uB8CC\uB418\uAE30 \uC804\uAE4C\uC9C0 \uBD84\uC11D \uAE30\uB2A5\uC740 \uB178\uCD9C\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.</p>'
  );

  return replaceMain(withComingSoonHero, buildAdobeComingSoonMain());
}

async function renderAdobeSearchKeywordPage(origin, searchParams) {
  if (!ADOBE_STOCK_ENABLED) {
    return renderAdobeComingSoonPage(origin, '/adobe-stock/search-keyword');
  }

  const keyword = cleanText(searchParams.get('q') || '');
  const language = normalizeAdobeLanguage(searchParams.get('language') || 'ko');
  const searchType = normalizeAdobeSearchType(searchParams.get('searchType') || 'all');
  let initialResult = null;

  console.log('[Adobe search page server] query:', {
    hasKeyword: Boolean(keyword),
    keyword,
    language,
    searchType,
  });

  if (keyword) {
    try {
      console.log('[Adobe search page server] before runAdobePlaywrightSearchDebug:', {
        keyword,
        language,
        searchType,
      });
      initialResult = await runAdobePlaywrightSearchDebug({
        keyword,
        language,
        searchType,
      });
      console.log('[Adobe search page server] after runAdobePlaywrightSearchDebug:', {
        ok: initialResult?.ok,
        titleListLength: Array.isArray(initialResult?.titleList) ? initialResult.titleList.length : 0,
        keywordListLength: Array.isArray(initialResult?.keywordList) ? initialResult.keywordList.length : 0,
      });
    } catch (error) {
      console.error('[Adobe search page server] runAdobePlaywrightSearchDebug error:', error);
      initialResult = {
        ok: false,
        titleList: [],
        keywordList: [],
        message: error?.message || String(error),
      };
    }
  }

  console.log('[Adobe search page server] inject initialResult:', {
    ok: initialResult?.ok,
    titleListLength: Array.isArray(initialResult?.titleList) ? initialResult.titleList.length : 0,
    keywordListLength: Array.isArray(initialResult?.keywordList) ? initialResult.keywordList.length : 0,
  });

  const shell = await captureHtml('/miricanvas/tag', origin);
  const withMenu = setAdobeMenuActive(shell.body);
  const withSeo = replaceSeoAndHero(
    withMenu,
    origin,
    '/adobe-stock/search-keyword',
    'Adobe Stock 검색 키워드 분석 | 미리캔버스 키워드 분석 사이트',
    '브라우저에서 직접 Adobe Ajax Search URL을 fetch해 CORS 가능 여부와 응답 상태를 확인하는 페이지입니다.'
  );

  return replaceMain(withSeo, buildAdobeSearchKeywordMain(searchParams, initialResult));
}

export async function requestHandler(req, res) {
  try {
    const protocol = cleanText(req.headers['x-forwarded-proto']) || 'http';
    const host = cleanText(req.headers.host) || 'localhost';
    const requestUrl = new URL(req.url, `${protocol}://${host}`);
    const pathname = requestUrl.pathname;

    if (pathname === '/debug/adobe-playwright-search') {
      if (!isLocalDebugRequest(host) || cleanText(process.env.VERCEL) || cleanText(process.env.NODE_ENV).toLowerCase() === 'production') {
        writeJson(res, {
          ok: false,
          localOnly: true,
          message: 'This debug route is available only in local development.',
        }, 403);
        return;
      }

      try {
        const result = await runAdobePlaywrightSearchDebug({
          keyword: requestUrl.searchParams.get('q') || 'apple',
          language: requestUrl.searchParams.get('language') || 'ko',
          searchType: requestUrl.searchParams.get('searchType') || 'image',
        });
        writeJson(res, result, 200);
        return;
      } catch (error) {
        writeJson(res, {
          ok: false,
          localOnly: true,
          status: 'PLAYWRIGHT_ERROR',
          statusText: error?.name || 'Error',
          hasCaptcha: false,
          body500: String(error?.message || error).slice(0, 500),
          titleList: [],
        }, 200);
        return;
      }
    }

    if (pathname === '/') {
      const html = await renderHomePage(requestUrl.origin);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    if (pathname === '/adobe-stock' || pathname === '/adobe-stock/search-keyword' || pathname === '/adobe-stock/collection-keyword' || pathname === '/adobe-stock/monthly-top20') {
      if (!ADOBE_STOCK_ENABLED) {
        const html = await renderAdobeComingSoonPage(requestUrl.origin, pathname);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }
    }

    if (pathname === '/adobe-stock/search-keyword') {
      const html = await renderAdobeSearchKeywordPage(requestUrl.origin, requestUrl.searchParams);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }

    return baseRequestHandler(req, res);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: error?.message || String(error) }));
  }
}

export default requestHandler;


