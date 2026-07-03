export function renderTemplateClientCore() {
  return `
    function createMetricBlock(titleText, rows) {
      const block = document.createElement('section');
      block.className = 'metric-block';

      const title = document.createElement('h3');
      title.className = 'metric-title';
      title.textContent = titleText;
      block.appendChild(title);

      if (!rows.length) {
        const empty = document.createElement('div');
        empty.className = 'result-empty';
        empty.textContent = '분석 가능한 데이터가 없습니다.';
        block.appendChild(empty);
        return block;
      }

      const list = document.createElement('div');
      list.className = 'metric-list';

      rows.forEach((row) => {
        list.appendChild(row);
      });

      block.appendChild(list);
      return block;
    }

    function createMetricRow(leftText, rightText) {
      const row = document.createElement('div');
      row.className = 'metric-row';

      const left = document.createElement('span');
      left.textContent = leftText;

      const right = document.createElement('span');
      right.textContent = rightText;

      row.appendChild(left);
      row.appendChild(right);
      return row;
    }

    function createTitleListBlock(titleText, items) {
      const block = document.createElement('section');
      block.className = 'metric-block';

      const heading = document.createElement('h3');
      heading.className = 'metric-title';
      heading.textContent = titleText;
      block.appendChild(heading);

      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'result-empty';
        empty.textContent = '분석 가능한 데이터가 없습니다.';
        block.appendChild(empty);
        return block;
      }

      const list = document.createElement('ol');
      list.className = 'title-list';

      items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
      });

      block.appendChild(list);
      return block;
    }

    function createTemplateTabButtons(result, selectedTab) {
      const tabs = document.createElement('div');
      tabs.className = 'tabs';

      TEMPLATE_RESULT_TABS.forEach((tab) => {
        const tabBtn = document.createElement('button');
        tabBtn.className = 'tab-btn' + (tab.key === selectedTab ? ' active' : '');
        tabBtn.textContent = tab.label;
        tabBtn.addEventListener('click', () => {
          const nextTab = normalizeTemplateTab(tab.key);
          const nextUrl = buildTemplateResultUrl(result.keyword, result.typeValue, nextTab);
          window.history.replaceState({}, '', nextUrl);
          renderTemplateResult(lastTemplateResult, nextTab);
        });
        tabs.appendChild(tabBtn);
      });

      return tabs;
    }

    function buildTemplateTabContent(result, selectedTab) {
      if (selectedTab === 'pageCount') {
        const rows = (result.pageCountRatios || []).map((item) =>
          createMetricRow(item.label, item.count + '개 / ' + item.percentage + '%')
        );
        return createMetricBlock('페이지 수 비율', rows);
      }

      if (selectedTab === 'topTitles') {
        return createTitleListBlock('상위 템플릿 제목 30개', result.topTemplateTitles || []);
      }

      const rows = (result.titleKeywordTop10 || []).map((item) =>
        createMetricRow(item.value, item.count + '회 / ' + item.percentage + '%')
      );
      return createMetricBlock('제목 키워드 TOP 10', rows);
    }

    function renderTemplateResult(result, requestedTab) {
      resultPanelEl.innerHTML = '';
      lastTemplateResult = result;

      if (!result) {
        resultPanelEl.innerHTML = '<div class="result-empty">결과가 없습니다.</div>';
        return;
      }

      const selectedTab = normalizeTemplateTab(requestedTab);
      const card = document.createElement('section');
      card.className = 'result-card stack';

      const head = document.createElement('div');
      head.className = 'result-head';

      const title = document.createElement('h3');
      title.className = 'result-title';
      title.textContent = '[' + result.keyword + '] ' + result.typeLabel;
      head.appendChild(title);

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = '분석 대상: ' + result.templateCount + '개 / 수집일: ' + result.collectedAt;

      card.appendChild(head);
      card.appendChild(meta);
      card.appendChild(createTemplateTabButtons(result, selectedTab));
      card.appendChild(buildTemplateTabContent(result, selectedTab));

      resultPanelEl.appendChild(card);
    }

    function setSelectedTemplateType(value) {
      const config = resolveTemplateTypeConfig(value);
      if (!config) return;
      selectedTemplateTypeValue = config.value;
      updateSelectedTemplateTypeText();
      renderTemplateTypePanel();
    }

    function updateSelectedTemplateTypeText() {
      if (!selectedTemplateTypeTextEl) return;

      const selected = TEMPLATE_TYPE_INDEX.get(selectedTemplateTypeValue);
      if (!selected) {
        selectedTemplateTypeTextEl.textContent = '선택됨: 없음';
        return;
      }

      const pathLabels = Array.isArray(selected.pathLabels) ? [...selected.pathLabels] : [selected.label];
      if (pathLabels[0] === selected.group) {
        pathLabels.shift();
      }
      const pathText = pathLabels.join(' > ');
      selectedTemplateTypeTextEl.textContent = '선택됨: ' + selected.group + ' > ' + pathText;
    }

    function createTemplateFilterTabs() {
      if (!templateTypeTabsEl) return;
      templateTypeTabsEl.innerHTML = '';

      TEMPLATE_FILTER_TABS.forEach((tab) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'type-filter-tab' + (tab.key === currentTemplateFilterTab ? ' active' : '');
        btn.textContent = tab.label;
        btn.addEventListener('click', () => {
          currentTemplateFilterTab = tab.key;
          renderTemplateTypePanel();
          createTemplateFilterTabs();
        });
        templateTypeTabsEl.appendChild(btn);
      });
    }

    function toggleTemplateGroup(groupKey) {
      if (expandedTemplateGroups.has(groupKey)) {
        expandedTemplateGroups.delete(groupKey);
      } else {
        expandedTemplateGroups.add(groupKey);
      }
      renderTemplateTypePanel();
    }

    function matchesTemplateFilterTab(item) {
      return currentTemplateFilterTab === 'all' || item.group === currentTemplateFilterTab;
    }

    function itemMatchesTemplateSearch(item) {
      const searchText = currentTemplateSearchText.toLowerCase();
      if (!searchText) return true;

      const pathText = Array.isArray(item.pathLabels) ? item.pathLabels.join(' ') : '';
      return (
        item.label.toLowerCase().includes(searchText) ||
        item.group.toLowerCase().includes(searchText) ||
        pathText.toLowerCase().includes(searchText)
      );
    }

    function itemHasMatchingDescendant(item) {
      if (!Array.isArray(item.children) || item.children.length === 0) {
        return itemMatchesTemplateSearch(item);
      }

      if (itemMatchesTemplateSearch(item)) {
        return true;
      }

      return item.children.some((child) => itemHasMatchingDescendant(child));
    }

    function appendTemplateNode(parentEl, item, depth = 0, groupKey = item.value) {
      const hasSearchText = currentTemplateSearchText.length > 0;
      const selfMatchesSearch = itemMatchesTemplateSearch(item);
      const descendantMatchesSearch = itemHasMatchingDescendant(item);
      const visibleBySearch = !hasSearchText || selfMatchesSearch || descendantMatchesSearch;
      const visibleByTab = matchesTemplateFilterTab(item);

      if (!visibleByTab || !visibleBySearch) {
        return;
      }

      if (Array.isArray(item.children) && item.children.length > 0) {
        const shouldExpand = hasSearchText
          ? selfMatchesSearch || descendantMatchesSearch || expandedTemplateGroups.has(groupKey)
          : expandedTemplateGroups.has(groupKey);
        const parentBtn = document.createElement('button');
        parentBtn.type = 'button';
        parentBtn.className = 'type-parent-btn';

        const meta = document.createElement('div');
        meta.className = 'type-parent-meta';

        const label = document.createElement('span');
        label.textContent = item.label;

        const marker = document.createElement('span');
        marker.textContent = shouldExpand ? '접기' : '펼치기';

        meta.appendChild(label);
        meta.appendChild(marker);
        parentBtn.appendChild(meta);
        parentBtn.addEventListener('click', () => toggleTemplateGroup(groupKey));
        parentEl.appendChild(parentBtn);

        if (shouldExpand) {
          const childList = document.createElement('div');
          childList.className = 'type-child-list';

          item.children.forEach((child, index) => {
            appendTemplateNode(
              childList,
              child,
              depth + 1,
              groupKey + ':' + index + ':' + child.label
            );
          });

          if (childList.childElementCount > 0) {
            parentEl.appendChild(childList);
          }
        }

        return;
      }

      const optionBtn = document.createElement('button');
      optionBtn.type = 'button';
      optionBtn.className =
        'type-option-btn' +
        (item.value === selectedTemplateTypeValue ? ' active' : '');
      optionBtn.textContent = item.label;
      optionBtn.addEventListener('click', () => setSelectedTemplateType(item.value));
      parentEl.appendChild(optionBtn);
    }

    function renderTemplateTypePanel() {
      if (!templateTypePanelEl) return;
      templateTypePanelEl.innerHTML = '';

      const visibleGroups = TEMPLATE_FILTER_TABS
        .filter((tab) => tab.key !== 'all')
        .map((tab) => tab.key);

      const groupsToRender =
        currentTemplateFilterTab === 'all'
          ? [...new Set(FLAT_TEMPLATE_TYPE_OPTIONS.map((item) => item.group))]
          : [currentTemplateFilterTab];

      let renderedAny = false;

      groupsToRender.forEach((groupName) => {
        const groupSection = document.createElement('section');
        groupSection.className = 'type-group';

        const heading = document.createElement('div');
        heading.className = 'type-group-title';
        heading.textContent = groupName;
        groupSection.appendChild(heading);

        const list = document.createElement('div');
        list.className = 'type-option-list';

        const topLevelItems = TEMPLATE_TYPE_OPTIONS.filter((item) => item.group === groupName);
        topLevelItems.forEach((item, index) => {
          if (item.label === groupName && Array.isArray(item.children) && item.children.length > 0) {
            item.children.forEach((child, childIndex) => {
              appendTemplateNode(list, child, 0, groupName + ':' + index + ':' + childIndex + ':' + child.label);
            });
            return;
          }

          appendTemplateNode(list, item, 0, groupName + ':' + index + ':' + item.label);
        });

        if (list.childElementCount > 0) {
          renderedAny = true;
          groupSection.appendChild(list);
          templateTypePanelEl.appendChild(groupSection);
        }
      });

      if (!renderedAny) {
        templateTypePanelEl.innerHTML = '<div class="result-empty">검색 결과가 없습니다.</div>';
      }
    }

    function initializeTemplateTypePanel(defaultValue) {
      if (!templateTypePanelEl || !templateTypeTabsEl) return;

      const config = resolveTemplateTypeConfig(defaultValue);
      if (config) {
        selectedTemplateTypeValue = config.value;
      }

      createTemplateFilterTabs();
      updateSelectedTemplateTypeText();
      renderTemplateTypePanel();
    }
`;
}

export function renderTemplateClientInit() {
  return `

    async function loadTemplateResultPage() {
      const currentUrl = new URL(window.location.href);
      const keyword = cleanText(currentUrl.searchParams.get('q'));
      const typeValue = cleanText(currentUrl.searchParams.get('type'));
      const selectedTab = normalizeTemplateTab(currentUrl.searchParams.get('tab'));

      initializeTemplateTypePanel(typeValue || 'presentation');

      if (!keyword || !typeValue) {
        resultPanelEl.innerHTML = '<div class="result-empty">키워드와 템플릿 종류를 입력하면 결과가 여기에 표시됩니다.</div>';
        setStatus('대기 중');
        return;
      }

      const typeConfig = resolveTemplateTypeConfig(typeValue);
      if (!typeConfig) {
        resultPanelEl.innerHTML = '<div class="result-empty">유효한 템플릿 종류를 선택하세요.</div>';
        setStatus('실패');
        return;
      }

      selectedTemplateTypeValue = typeConfig.value;
      updateSelectedTemplateTypeText();
      renderTemplateTypePanel();

      const canonicalUrl = buildTemplateResultUrl(keyword, typeConfig.value, selectedTab);
      if (window.location.pathname + window.location.search !== canonicalUrl) {
        window.history.replaceState({}, '', canonicalUrl);
      }

      if (templateKeywordEl) {
        templateKeywordEl.value = keyword;
      }

      setStatus('템플릿 분석 중...');
      resultPanelEl.innerHTML = '<div class="result-empty">처리 중...</div>';
      lastTemplateResult = null;

      try {
        const response = await fetch('/api/template-trend', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keyword,
            type: typeValue,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || '요청 실패');
        }

        renderTemplateResult(data, selectedTab);
        setStatus('템플릿 분석 완료');
      } catch (error) {
        resultPanelEl.innerHTML = '<div class="result-empty">' + (error?.message || String(error)) + '</div>';
        setStatus('실패');
      }
    }

    if (templateTypeSearchEl) {
      templateTypeSearchEl.addEventListener('input', () => {
        currentTemplateSearchText = cleanText(templateTypeSearchEl.value);
        renderTemplateTypePanel();
      });
    }

    if (runBtn) {
      runBtn.addEventListener('click', () => {
        const keyword = cleanText(keywordEl?.value);
        const category = normalizeMiricanvasCategory(categoryEl?.value);

        if (!keyword) {
          setStatus('키워드를 입력하세요.');
          return;
        }

        window.location.href = buildElementResultUrl(keyword, category);
      });
    }

    if (templateRunBtn) {
      templateRunBtn.addEventListener('click', () => {
        try {
          const keyword = parseSingleKeywordInput(templateKeywordEl.value);
          const typeValue = cleanText(selectedTemplateTypeValue);

          const typeConfig = resolveTemplateTypeConfig(typeValue);
          if (!typeConfig) {
            throw new Error('유효한 템플릿 종류를 선택하세요.');
          }

          debugLog(
            '[template:selected]',
            JSON.stringify({
              label: typeConfig.label,
              value: typeConfig.value,
              apiValue: typeConfig.apiValue || typeConfig.value,
              purpose: typeConfig.purpose || (typeConfig.group === '동영상' ? 'VIDEO' : typeConfig.group === '인쇄' ? 'PRINT' : 'WEB'),
              tier: typeConfig.tier || 'PREMIUM',
            })
          );

          window.location.href = buildTemplateResultUrl(keyword, typeConfig.value, 'titleKeywords');
        } catch (error) {
          setStatus(error.message || String(error));
        }
      });
    }

    if (CURRENT_PATH === '/miricanvas/template') {
      initializeTemplateTypePanel('presentation');
    }

    if (rankingPanelEl) {
      loadMonthlyRankings();
    }

    if (CURRENT_PATH === '/miricanvas/tag') {
      loadElementResultPage();
    } else if (CURRENT_PATH === '/miricanvas/template') {
      loadTemplateResultPage();
    }
`;
}
