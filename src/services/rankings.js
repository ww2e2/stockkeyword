export function createRankingsService(dependencies) {
  const {
    cleanText,
    fetchMonthlySearchLogs,
    getCollectedMonth,
    searchPlatform,
  } = dependencies;

  function buildTopRankings(entries, buildItem, limit = 20) {
    return [...entries.entries()]
      .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), 'ko'))
      .slice(0, limit)
      .map(([value, count], index) => buildItem(value, count, index));
  }

  function aggregateMonthlyRankings(logs, searchMonth = getCollectedMonth()) {
    const keywordCounts = new Map();
    const templateTypeCounts = new Map();
    const templateKeywordCounts = new Map();
    const contentTypeCounts = new Map();

    for (const log of logs) {
      const searchType = cleanText(log?.search_type);
      const keyword = cleanText(log?.keyword);
      const templateTypeLabel = cleanText(log?.template_type_label);
      const templateTypeValue = cleanText(log?.template_type_value);
      const contentTypeLabel = cleanText(log?.template_type_label || log?.template_type_value);

      if (searchType === 'keyword' && keyword) {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);

        if (contentTypeLabel && contentTypeLabel.toUpperCase() !== 'EMPTY') {
          contentTypeCounts.set(contentTypeLabel, (contentTypeCounts.get(contentTypeLabel) || 0) + 1);
        }
      }

      if (searchType === 'template') {
        if (templateTypeLabel || templateTypeValue) {
          const templateKey = templateTypeLabel || templateTypeValue;
          templateTypeCounts.set(templateKey, (templateTypeCounts.get(templateKey) || 0) + 1);
        }

        if (keyword) {
          templateKeywordCounts.set(keyword, (templateKeywordCounts.get(keyword) || 0) + 1);
        }
      }
    }

    return {
      searchMonth,
      keywordSearchTop20: buildTopRankings(keywordCounts, (keyword, count, index) => ({
        rank: index + 1,
        keyword,
        count,
      })),
      contentTypeTop20: buildTopRankings(contentTypeCounts, (label, count, index) => ({
        rank: index + 1,
        label,
        count,
      })),
      templateTypeTop20: buildTopRankings(templateTypeCounts, (label, count, index) => ({
        rank: index + 1,
        label,
        count,
      })),
      templateKeywordTop20: buildTopRankings(templateKeywordCounts, (keyword, count, index) => ({
        rank: index + 1,
        keyword,
        count,
      })),
    };
  }

  async function getMonthlyRankings() {
    const searchMonth = getCollectedMonth();
    const logs = await fetchMonthlySearchLogs(searchMonth, {
      searchPlatform,
    });
    return aggregateMonthlyRankings(logs, searchMonth);
  }

  return {
    buildTopRankings,
    aggregateMonthlyRankings,
    getMonthlyRankings,
  };
}
