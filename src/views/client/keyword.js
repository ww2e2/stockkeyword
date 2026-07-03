export function renderKeywordClientCore() {
  return `

    function getEditableTags(item) {
      if (!Array.isArray(item.editableTopTags)) {
        item.editableTopTags = [...(item.topTags || [])];
      }

      return item.editableTopTags;
    }

    function buildMetaTagString(tags) {
      return tags.join(', ');
    }

    function renderTags(tags, onRemove) {
      const wrap = document.createElement('div');
      wrap.className = 'tags';

      for (const [index, tag] of tags.entries()) {
        const chip = document.createElement('span');
        chip.className = 'tag';

        const label = document.createElement('span');
        label.className = 'tag-label';
        label.textContent = tag;
        chip.appendChild(label);

        if (typeof onRemove === 'function') {
          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'tag-remove';
          removeBtn.textContent = 'x';
          removeBtn.setAttribute('aria-label', tag + ' 삭제');
          removeBtn.addEventListener('click', () => {
            onRemove(index);
          });
          chip.appendChild(removeBtn);
        }

        wrap.appendChild(chip);
      }

      return wrap;
    }

    function createElementResultCard(item) {
      const editableTags = getEditableTags(item);
      const metaTagString = buildMetaTagString(editableTags);
      const card = document.createElement('section');
      card.className = 'result-card';

      const head = document.createElement('div');
      head.className = 'result-head';

      const title = document.createElement('h3');
      title.className = 'result-title';
      title.textContent = '[' + item.keyword + ']';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'secondary copy-chip';
      copyBtn.textContent = '복사하기';
      copyBtn.addEventListener('click', async () => {
        await copyText(metaTagString || '', item.keyword + ' 복사 완료');
      });

      head.appendChild(title);
      head.appendChild(copyBtn);

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = '추천 키워드: ' + editableTags.length + '개 / 수집일: ' + item.collectedAt;

      const text = document.createElement('div');
      text.className = 'result-text';
      text.textContent = metaTagString || '(추천 키워드 없음)';

      card.appendChild(head);
      card.appendChild(meta);
      card.appendChild(text);
      card.appendChild(renderTags(editableTags, (tagIndex) => {
        editableTags.splice(tagIndex, 1);
        renderElementResults(lastResults[0] || null);
      }));

      return card;
    }

    function renderElementResults(result) {
      resultPanelEl.innerHTML = '';
      lastResults = result ? [result] : [];

      if (!result) {
        resultPanelEl.innerHTML = '<div class="result-empty">분석할 키워드가 없습니다.</div>';
        return;
      }

      getEditableTags(result);
      resultPanelEl.appendChild(createElementResultCard(result));
    }

`;
}

export function renderKeywordClientInit() {
  return `

    async function loadElementResultPage() {
      const currentUrl = new URL(window.location.href);
      const keyword = cleanText(currentUrl.searchParams.get('q'));
      const category = normalizeMiricanvasCategory(currentUrl.searchParams.get('category'));

      if (!keyword) {
        resultPanelEl.innerHTML = '<div class="result-empty">분석할 키워드가 없습니다.</div>';
        setStatus('대기 중');
        return;
      }

      if (keywordEl) {
        keywordEl.value = keyword;
      }

      if (categoryEl) {
        categoryEl.value = category;
      }

      setStatus('미리캔버스 API 호출 중...');
      resultPanelEl.innerHTML = '<div class="result-empty">처리 중...</div>';
      lastResults = [];

      try {
        const response = await fetch('/api/collect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keyword,
            category,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || '요청 실패');
        }

        const result = data?.results?.[0] || data || null;
        renderElementResults(result);
        setStatus('1개 키워드 분석 완료');
      } catch (error) {
        resultPanelEl.innerHTML = '<div class="result-empty">오류: ' + (error?.message || String(error)) + '</div>';
        setStatus('실패');
      }
    }
`;
}
