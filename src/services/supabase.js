import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

const SEARCH_LOGS_TABLE = 'search_logs';
const KOREA_TIME_ZONE = 'Asia/Seoul';
let supabaseClient = null;

function cleanText(value) {
  return String(value ?? '').trim();
}

function loadLocalEnvironment() {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile('.env');
    } catch {
      // The subsequent validation returns the user-safe configuration error.
    }
  }
}

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  loadLocalEnvironment();
  const url = cleanText(process.env.SUPABASE_URL);
  const serviceRoleKey = cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase server environment variables are required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  supabaseClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket },
  });
  return supabaseClient;
}

function getKoreaMonthParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: KOREA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { year: Number(values.year), month: Number(values.month) };
}

function getMonthStartIso(date = new Date()) {
  const { year, month } = getKoreaMonthParts(date);
  return new Date(Date.UTC(year, month - 1, 1) - (9 * 60 * 60 * 1000)).toISOString();
}

function getSearchMonth(date = new Date()) {
  const { year, month } = getKoreaMonthParts(date);
  return `${year}-${String(month).padStart(2, '0')}`;
}

function normalizeLegacyTypeLabel(value) {
  const label = cleanText(value);
  return label === '\uADF8\uB798\uD53D\u00B7\uC77C\uB7EC\uC2A4\uD2B8'
    ? '\uC77C\uB7EC\uC2A4\uD2B8'
    : label;
}

function getOptionLabel(options, value, fallbackLabel = '') {
  const normalizedValue = cleanText(value);
  const option = (Array.isArray(options) ? options : []).find((item) => (
    cleanText(typeof item === 'string' ? item : item?.value) === normalizedValue
  ));
  const configuredLabel = cleanText(typeof option === 'string' ? option : option?.label);
  return configuredLabel || normalizeLegacyTypeLabel(fallbackLabel) || normalizedValue;
}

function rankValues(rows, column, options = [], limit = 20, fallbackColumn = '') {
  const counts = new Map();

  for (const row of rows) {
    const value = cleanText(row?.[column]);
    const fallbackLabel = cleanText(fallbackColumn ? row?.[fallbackColumn] : '');
    if (!value && !fallbackLabel) continue;

    const key = value ? 'value:' + value : 'label:' + fallbackLabel;
    const current = counts.get(key) || { value, fallbackLabel, count: 0 };
    current.count += 1;
    counts.set(key, current);
  }

  return [...counts.values()]
    .map((item) => ({
      label: getOptionLabel(options, item.value, item.fallbackLabel),
      count: item.count,
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, 'ko'))
    .slice(0, limit);
}

async function getMonthlyRows(platform) {
  const client = getSupabaseClient();
  const rows = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await client
      .from(SEARCH_LOGS_TABLE)
      .select('source_platform, search_type, keyword, template_type_value, template_type_label, created_at')
      .eq('source_platform', platform)
      .eq('search_month', getSearchMonth())
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Supabase monthly ranking query failed: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
    from += pageSize;
  }
}

export async function logSearchEvent({ platform, feature, query, typeValue = '', typeLabel = '' }) {
  const normalizedQuery = cleanText(query);
  if (!normalizedQuery) return { logged: false, reason: 'missing-query' };

  const row = {
    source_platform: cleanText(platform),
    search_type: cleanText(feature),
    keyword: normalizedQuery,
    template_type_value: cleanText(typeValue),
    template_type_label: cleanText(typeLabel),
    search_month: getSearchMonth(),
  };

  const { error } = await getSupabaseClient()
    .from(SEARCH_LOGS_TABLE)
    .insert(row);

  if (error) throw new Error(`Supabase search log write failed: ${error.message}`);
  return { logged: true };
}

export async function getMonthlyRankingResult(config) {
  const rows = await getMonthlyRows(config?.id);
  const keywordRows = rows.filter((row) => row.search_type === 'keyword');
  const templateRows = rows.filter((row) => row.search_type === 'template');
  const contentTypeOptions = config?.contentTypeOptions || config?.searchOptions?.contentTypes || [];
  const templateTypeOptions = config?.templateSearchOptions?.contentTypes || [];

  return {
    keyword: {
      topQueries: rankValues(keywordRows, 'keyword'),
      contentTypes: rankValues(keywordRows, 'template_type_value', contentTypeOptions, 20, 'template_type_label'),
    },
    template: config?.rankingFeatures?.template
      ? {
          topQueries: rankValues(templateRows, 'keyword'),
          templateTypes: rankValues(templateRows, 'template_type_value', templateTypeOptions, 20, 'template_type_label'),
        }
      : null,
  };
}
