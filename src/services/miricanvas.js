export function createMiricanvasService(dependencies) {
  const {
    MIRICANVAS_API_HEADERS_JSON,
    MIRICANVAS_API_METHOD,
    MIRICANVAS_API_URL,
    MIRICANVAS_CATEGORY_LABEL_MAP,
    MIRICANVAS_CATEGORY_OPTIONS,
    MIRICANVAS_CATEGORY_TYPE_MAP,
    MIRICANVAS_TEAM_IDX,
    SEARCH_PLATFORM,
    TEMPLATE_API_URL,
    TEMPLATE_TYPE_FAILURE_MESSAGE,
    cleanText,
    debugError,
    debugLog,
    debugWarn,
    getCollectedDate,
    getCollectedMonth,
    getTemplatePurpose,
    getTemplateTier,
    getTemplateTypeConfig,
    normalizeMiricanvasCategory,
    normalizeTemplateApiValues,
    parseJsonObject,
    safeLogSearchEvent,
  } = dependencies;

  function extractTagList(keywordsField) {
    const raw = Array.isArray(keywordsField)
      ? keywordsField.join('|')
      : String(keywordsField ?? '');

    return raw
      .split('|')
      .map(cleanText)
      .filter(Boolean);
  }

  function countFrequency(items) {
    const counts = new Map();

    for (const item of items) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }

    return counts;
  }

  function includesKeyword(item, keyword) {
    const normalizedKeyword = cleanText(keyword);
    if (!normalizedKeyword) return false;

    const name = cleanText(item?.name);
    const keywordsText = cleanText(item?.keywords);
    return name.includes(normalizedKeyword) || keywordsText.includes(normalizedKeyword);
  }

  function buildMiricanvasUrl(keyword, category = MIRICANVAS_CATEGORY_OPTIONS[0].value) {
    const normalizedCategory = normalizeMiricanvasCategory(category);
    const params = new URLSearchParams();
    params.set('status', 'ACTIVE');
    params.set('keyword', keyword);

    for (const type of MIRICANVAS_CATEGORY_TYPE_MAP[normalizedCategory]) {
      params.append('typeList', type);
    }

    params.set('color', '');
    params.set('includePresetV2', 'true');
    params.set('page', '1');
    params.set('pageSize', '30');
    params.set('tier', 'PREMIUM');
    params.set('domain', 'production');
    params.set('language', 'ko');

    if (MIRICANVAS_TEAM_IDX) {
      params.set('teamIdx', MIRICANVAS_TEAM_IDX);
    }

    return MIRICANVAS_API_URL + '?' + params.toString();
  }

  function buildTemplateSearchUrl(keyword, typeValue) {
    const typeConfig = getTemplateTypeConfig(typeValue);
    const params = new URLSearchParams();
    const apiValues = normalizeTemplateApiValues(typeConfig.apiValue, typeConfig.value);
    const purpose = getTemplatePurpose(typeConfig);
    const tier = getTemplateTier(typeConfig);

    params.set('color', '');
    params.set('tier', tier);
    params.set('strictLanguage', 'true');
    params.append('categoryList', 'TEMPLATE');
    params.append('categoryList', 'CREATOR');
    params.set('status', 'ACTIVE');
    params.set('isPageSearch', 'false');
    params.set('includeTemplateV2', 'true');
    params.set('language', 'ko');
    params.set('page', '1');
    params.set('pageSize', '30');
    params.set('domain', 'production');
    params.set('purpose', purpose);
    params.set('keyword', keyword);
    for (const apiValue of apiValues) {
      params.append('templateTypeIdList', apiValue);
    }

    debugLog('[template:apiValue]', JSON.stringify(apiValues));

    return TEMPLATE_API_URL + '?' + params.toString();
  }

  function getLogSnippet(value, maxLength = 500) {
    const text = cleanText(value);
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength) + '...';
  }

  async function fetchJson(url, purpose) {
    const headers = parseJsonObject(MIRICANVAS_API_HEADERS_JSON, 'MIRICANVAS_API_HEADERS_JSON');
    const init = {
      method: MIRICANVAS_API_METHOD,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const response = await fetch(url, init);
    const text = await response.text().catch(() => '');

    debugLog(
      '[' + String(purpose).toLowerCase() + ':response]',
      JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        bodySnippet: getLogSnippet(text),
      })
    );

    if (!response.ok) {
      const error = new Error((purpose + ' request failed: ' + response.status + ' ' + response.statusText + ' ' + text).trim());
      error.status = response.status;
      error.statusText = response.statusText;
      error.responseText = text;
      error.requestUrl = url;
      error.requestPurpose = purpose;
      throw error;
    }

    if (!text.trim()) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      const parseError = new Error(purpose + ' response parse failed: ' + (error.message || String(error)));
      parseError.status = response.status;
      parseError.statusText = response.statusText;
      parseError.responseText = text;
      parseError.requestUrl = url;
      parseError.requestPurpose = purpose;
      throw parseError;
    }
  }

  async function fetchMiricanvas(keyword, category = MIRICANVAS_CATEGORY_OPTIONS[0].value) {
    if (!MIRICANVAS_API_URL) {
      throw new Error('MIRICANVAS_API_URL is required');
    }

    const normalizedCategory = normalizeMiricanvasCategory(category);
    const url = buildMiricanvasUrl(keyword, normalizedCategory);
    debugLog('[miricanvas:url]', url);
    debugLog('[miricanvas:keyword]', JSON.stringify(keyword), 'encoded=', encodeURIComponent(keyword));
    debugLog('[miricanvas:category]', normalizedCategory, MIRICANVAS_CATEGORY_TYPE_MAP[normalizedCategory]);

    return fetchJson(url, 'Miricanvas');
  }

  async function fetchTemplateSearch(keyword, typeValue) {
    const typeConfig = getTemplateTypeConfig(typeValue);
    const url = buildTemplateSearchUrl(keyword, typeValue);
    const apiValues = normalizeTemplateApiValues(typeConfig.apiValue, typeConfig.value);
    const purpose = getTemplatePurpose(typeConfig);
    const tier = getTemplateTier(typeConfig);
    debugLog('[template:url]', url);
    debugLog('[template:keyword]', JSON.stringify(keyword), 'encoded=', encodeURIComponent(keyword));
    debugLog(
      '[template:request-config]',
      JSON.stringify({
        selectedType: cleanText(typeValue),
        label: typeConfig.label,
        value: typeConfig.value,
        apiValue: typeConfig.apiValue || typeConfig.value,
        apiValues,
        purpose,
        tier,
        group: typeConfig.group,
        page: 1,
        pageSize: 30,
        templateTypeIdList: apiValues,
      })
    );

    try {
      return await fetchJson(url, 'Template');
    } catch (error) {
      debugError(
        '[template:error]',
        JSON.stringify({
          status: error?.status || null,
          label: typeConfig.label,
          value: typeConfig.value,
          apiValue: typeConfig.apiValue || typeConfig.value,
          apiValues,
          purpose,
          tier,
          group: typeConfig.group,
          url,
          message: error?.message || String(error),
          bodySnippet: getLogSnippet(error?.responseText || ''),
        })
      );

      throw new Error(TEMPLATE_TYPE_FAILURE_MESSAGE);
    }
  }

  async function collectTopTags(keyword, category = MIRICANVAS_CATEGORY_OPTIONS[0].value) {
    const normalizedCategory = normalizeMiricanvasCategory(category);
    const response = await fetchMiricanvas(keyword, normalizedCategory);
    const list = Array.isArray(response?.data?.list) ? response.data.list : [];
    const matchedList = list.filter((item) => includesKeyword(item, keyword));
    const analysisList = matchedList.length >= 5 ? matchedList : list;

    const allTags = [];
    for (const item of analysisList) {
      allTags.push(...extractTagList(item?.keywords));
    }

    const counts = countFrequency(allTags);
    const topTags = [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
      .slice(0, 30)
      .map(([tag]) => tag);

    const topNames = list
      .map((item) => cleanText(item?.name))
      .filter(Boolean)
      .slice(0, 5);

    debugLog('[miricanvas:top-names-5]', topNames);
    debugLog(
      '[miricanvas:counts]',
      JSON.stringify({
        keyword,
        category: normalizedCategory,
        typeList: MIRICANVAS_CATEGORY_TYPE_MAP[normalizedCategory],
        totalResultCount: list.length,
        matchedResultCount: matchedList.length,
        usedResultCount: analysisList.length,
      })
    );

    if (list.length > 0 && matchedList.length === 0) {
      debugWarn('[miricanvas:warning] keyword-related matches are missing. Falling back to the full result list.');
    }

    await safeLogSearchEvent({
      searchType: 'keyword',
      keyword,
      templateTypeValue: normalizedCategory,
      templateTypeLabel: MIRICANVAS_CATEGORY_LABEL_MAP[normalizedCategory] || '',
    }, {
      cleanText,
      debugLog,
      getCollectedMonth,
      searchPlatform: SEARCH_PLATFORM,
    });

    return {
      keyword,
      category: normalizedCategory,
      listCount: list.length,
      matchedCount: matchedList.length,
      usedCount: analysisList.length,
      topTags,
      metaTagString: topTags.join(', '),
      collectedAt: getCollectedDate(),
    };
  }

  async function collectTopTagsForKeywords(keywords) {
    const results = [];

    for (const keyword of keywords) {
      results.push(await collectTopTags(keyword));
    }

    return {
      keywordCount: keywords.length,
      results,
    };
  }

  function tokenizeTitle(title) {
    return cleanText(title)
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(/\s+/)
      .map((token) => token.toLowerCase())
      .filter(Boolean)
      .filter((token) => token.length >= 2);
  }

  function buildRatioEntries(countsMap, total, buildLabel) {
    return [...countsMap.entries()]
      .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'ko'))
      .map(([value, count]) => ({
        value,
        label: buildLabel(value),
        count,
        percentage: total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0,
      }));
  }

  async function collectTemplateTrend(keyword, typeValue) {
    const typeConfig = getTemplateTypeConfig(typeValue);
    const response = await fetchTemplateSearch(keyword, typeValue);
    const rawList = Array.isArray(response?.data?.list) ? response.data.list : [];
    const list = rawList.slice(0, 30);

    debugLog(
      '[template:response-shape]',
      JSON.stringify({
        hasData: Boolean(response?.data),
        listIsArray: Array.isArray(response?.data?.list),
        listLength: rawList.length,
        firstTitle: cleanText(rawList[0]?.title),
        firstPageCount: rawList[0]?.pageCount ?? null,
      })
    );

    const titles = list
      .map((item) => cleanText(item?.title))
      .filter(Boolean);

    const titleTokens = titles.flatMap(tokenizeTitle);
    const titleKeywordTop10 = [...countFrequency(titleTokens).entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
      .slice(0, 10)
      .map(([value, count]) => ({
        value,
        count,
        percentage: titles.length > 0 ? Number(((count / titles.length) * 100).toFixed(1)) : 0,
      }));

    const pageCounts = new Map();
    for (const item of list) {
      const pageCount = Number(item?.pageCount);
      if (!Number.isFinite(pageCount) || pageCount <= 0) continue;
      pageCounts.set(pageCount, (pageCounts.get(pageCount) || 0) + 1);
    }

    const pageCountRatios = buildRatioEntries(pageCounts, list.length, (value) => String(value) + '\uD398\uC774\uC9C0');

    debugLog(
      '[template:counts]',
      JSON.stringify({
        keyword,
        typeValue,
        templateCount: list.length,
        titleKeywordCount: titleTokens.length,
      })
    );

    await safeLogSearchEvent({
      searchType: 'template',
      keyword,
      templateTypeValue: typeConfig.value,
      templateTypeLabel: typeConfig.label,
    }, {
      cleanText,
      debugLog,
      getCollectedMonth,
      searchPlatform: SEARCH_PLATFORM,
    });

    return {
      keyword,
      typeValue: typeConfig.value,
      typeLabel: typeConfig.label,
      typeGroup: typeConfig.group,
      typePathText: (() => {
        const pathLabels = Array.isArray(typeConfig.pathLabels) ? [...typeConfig.pathLabels] : [typeConfig.label];
        if (pathLabels[0] === typeConfig.group) {
          pathLabels.shift();
        }
        return typeConfig.group + ' > ' + pathLabels.join(' > ');
      })(),
      templateCount: list.length,
      titleKeywordTop10,
      pageCountRatios,
      topTemplateTitles: titles,
      collectedAt: getCollectedDate(),
    };
  }

  return {
    fetchMiricanvas,
    fetchTemplateSearch,
    collectTopTags,
    collectTopTagsForKeywords,
    collectTemplateTrend,
  };
}
