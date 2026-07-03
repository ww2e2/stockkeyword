export function createMiricanvasApiRoutes(dependencies) {
  const {
    cleanText,
    collectTemplateTrend,
    collectTopTags,
    getMonthlyRankings,
    getTemplateTypeConfig,
    normalizeMiricanvasCategory,
    parseSingleKeyword,
    readJsonBody,
  } = dependencies;

  function writeJson(res, payload, statusCode = 200) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
  }

  async function handleMiricanvasApiRequest(req, res) {
    if (req.method === 'GET' && req.url?.startsWith('/api/collect')) {
      const url = new URL(req.url, 'http://localhost');
      const keyword = cleanText(url.searchParams.get('keyword'));
      const category = normalizeMiricanvasCategory(url.searchParams.get('category'));

      if (!keyword) {
        writeJson(res, { error: 'keyword is required' }, 400);
        return true;
      }

      const result = await collectTopTags(keyword, category);
      writeJson(res, result);
      return true;
    }

    if (req.method === 'GET' && req.url === '/api/monthly-rankings') {
      try {
        const result = await getMonthlyRankings();
        writeJson(res, result);
      } catch (error) {
        writeJson(res, { error: error?.message || String(error) }, 500);
      }
      return true;
    }

    if (req.method === 'POST' && req.url === '/api/collect') {
      const body = await readJsonBody(req);

      try {
        const keyword = parseSingleKeyword(body?.keyword);
        const category = normalizeMiricanvasCategory(body?.category);
        const result = await collectTopTags(keyword, category);

        writeJson(res, {
          keywordCount: 1,
          results: [result],
        });
      } catch (error) {
        writeJson(res, { error: error.message || String(error) }, 400);
      }
      return true;
    }

    if (req.method === 'POST' && req.url === '/api/template-trend') {
      const body = await readJsonBody(req);

      try {
        const keyword = parseSingleKeyword(body?.keyword);
        const typeConfig = getTemplateTypeConfig(body?.type);
        const result = await collectTemplateTrend(keyword, typeConfig.value);

        writeJson(res, result);
      } catch (error) {
        writeJson(res, { error: error.message || String(error) }, 400);
      }
      return true;
    }

    return false;
  }

  return {
    handleMiricanvasApiRequest,
  };
}
