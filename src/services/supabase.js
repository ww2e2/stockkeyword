function getSupabaseUrl() {
  return process.env.SUPABASE_URL || '';
}

function getSupabaseServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());
}

function buildSupabaseHeaders(extraHeaders = {}) {
  const serviceRoleKey = getSupabaseServiceRoleKey();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    ...extraHeaders,
  };
}

export async function logSearchEvent(event, dependencies) {
  const {
    cleanText,
    debugLog,
    getCollectedMonth,
    searchPlatform,
  } = dependencies;

  if (!isSupabaseConfigured()) {
    return;
  }

  const payload = {
    source_platform: searchPlatform,
    search_type: event.searchType,
    keyword: cleanText(event.keyword),
    template_type_value: cleanText(event.templateTypeValue),
    template_type_label: cleanText(event.templateTypeLabel),
    search_month: getCollectedMonth(),
  };

  const response = await fetch(`${getSupabaseUrl()}/rest/v1/search_logs`, {
    method: 'POST',
    headers: buildSupabaseHeaders({
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    }),
    body: JSON.stringify([payload]),
  });

  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(`Supabase log insert failed: ${response.status} ${response.statusText} ${text}`.trim());
  }

  debugLog('[supabase:log:success]', JSON.stringify({
    searchType: payload.search_type,
    keyword: payload.keyword,
    templateTypeValue: payload.template_type_value,
    templateTypeLabel: payload.template_type_label,
    response: text,
  }));
}

export async function safeLogSearchEvent(event, dependencies) {
  const {
    cleanText,
    getCollectedMonth,
    debugLog,
    searchPlatform,
  } = dependencies;

  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    await logSearchEvent(event, {
      cleanText,
      debugLog,
      getCollectedMonth,
      searchPlatform,
    });
  } catch (error) {
    console.error('[supabase:log:error]', JSON.stringify({
      message: error?.message || String(error),
      searchType: cleanText(event?.searchType),
      keyword: cleanText(event?.keyword),
      templateTypeValue: cleanText(event?.templateTypeValue),
      templateTypeLabel: cleanText(event?.templateTypeLabel),
      hasSupabaseUrl: Boolean(getSupabaseUrl()),
      hasServiceRoleKey: Boolean(getSupabaseServiceRoleKey()),
    }));
  }
}

export async function fetchMonthlySearchLogs(searchMonth, { searchPlatform }) {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const params = new URLSearchParams();
  params.set('select', 'search_type,keyword,template_type_value,template_type_label,search_month');
  params.set('source_platform', `eq.${searchPlatform}`);
  params.set('search_month', `eq.${searchMonth}`);
  params.set('order', 'created_at.desc');
  params.set('limit', '5000');

  const response = await fetch(`${getSupabaseUrl()}/rest/v1/search_logs?${params.toString()}`, {
    headers: buildSupabaseHeaders(),
  });

  const text = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(`Supabase monthly logs fetch failed: ${response.status} ${response.statusText} ${text}`.trim());
  }

  if (!text.trim()) {
    return [];
  }

  return JSON.parse(text);
}
