const API_KEY = process.env.ADOBE_STOCK_API_KEY || process.env.ADOBE_API_KEY || '';
const ACCESS_TOKEN = process.env.ADOBE_STOCK_ACCESS_TOKEN || '';
const PRODUCT = process.env.ADOBE_STOCK_PRODUCT || 'miricanvas-tag-saas-official-api-test';
const BASE_URL = 'https://stock.adobe.io/Rest/Media/1';

const RESULT_COLUMNS = ['id', 'title', 'keywords', 'thumbnail_url', 'content_type'];
const LOCALES = ['ko_KR', 'en_US'];
const FILTER_TESTS = [
  { label: 'all', filterKeys: [] },
  {
    label: 'image-photo-illustration-vector',
    filterKeys: ['content_type:photo', 'content_type:illustration', 'content_type:vector'],
  },
  { label: 'video', filterKeys: ['content_type:video'] },
  { label: 'template', filterKeys: ['content_type:template'] },
  { label: '3d', filterKeys: ['content_type:3d'] },
];

let keywordsSupported = false;

function createHeaders() {
  const headers = {
    'x-api-key': API_KEY,
    'X-Product': PRODUCT,
    Accept: 'application/json',
  };

  if (ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${ACCESS_TOKEN}`;
  }

  return headers;
}

function appendResultColumns(searchParams) {
  for (const column of RESULT_COLUMNS) {
    searchParams.append('result_columns[]', column);
  }
}

function buildSearchUrl({ locale, filterKeys }) {
  const url = new URL(`${BASE_URL}/Search/Files`);
  url.searchParams.set('locale', locale);
  url.searchParams.set('search_parameters[words]', 'apple');
  url.searchParams.set('search_parameters[limit]', '30');
  appendResultColumns(url.searchParams);

  for (const filterKey of filterKeys) {
    url.searchParams.set(`search_parameters[filters][${filterKey}]`, '1');
  }

  return url;
}

function buildMetadataUrls(contentId) {
  const urls = [
    new URL(`${BASE_URL}/Files/${encodeURIComponent(contentId)}`),
    new URL(`${BASE_URL}/Files`),
    new URL(`${BASE_URL}/Files`),
  ];

  urls[1].searchParams.set('ids', String(contentId));
  urls[2].searchParams.set('content_id', String(contentId));

  for (const url of urls) {
    appendResultColumns(url.searchParams);
  }

  return urls;
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: createHeaders() });
  const bodyText = await response.text();
  let json = null;

  try {
    json = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    // Keep body500 for non-JSON auth or gateway errors.
  }

  return {
    status: response.status,
    statusText: response.statusText,
    body500: bodyText.slice(0, 500),
    json,
  };
}

function extractFiles(payload) {
  if (!payload) return [];
  if (Array.isArray(payload.files)) return payload.files;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data?.files)) return payload.data.files;
  if (payload.files && typeof payload.files === 'object') return Object.values(payload.files);
  if (payload.items && typeof payload.items === 'object') return Object.values(payload.items);
  return [];
}

function pickFirstValue(item, keys) {
  for (const key of keys) {
    if (item?.[key] !== undefined && item[key] !== null) return item[key];
  }
  return null;
}

function describeKeywords(item) {
  if (!item || !Object.prototype.hasOwnProperty.call(item, 'keywords')) {
    return { hasKeywordsField: false, keywordsType: 'missing', keywordCount: 0 };
  }

  if (Array.isArray(item.keywords)) {
    return {
      hasKeywordsField: true,
      keywordsType: 'array',
      keywordCount: item.keywords.length,
      sample: item.keywords.slice(0, 10),
    };
  }

  if (typeof item.keywords === 'string') {
    return {
      hasKeywordsField: true,
      keywordsType: 'string',
      keywordCount: item.keywords.trim() ? item.keywords.split(',').length : 0,
      sample: item.keywords.slice(0, 200),
    };
  }

  return {
    hasKeywordsField: true,
    keywordsType: item.keywords === null ? 'null' : typeof item.keywords,
    keywordCount: 0,
    sample: item.keywords,
  };
}

function hasUsableKeywords(files) {
  return files.some((file) => {
    const description = describeKeywords(file);
    return description.hasKeywordsField && description.keywordCount > 0;
  });
}

function summarizeFile(item) {
  return {
    id: pickFirstValue(item, ['id', 'content_id', 'asset_id']),
    title: pickFirstValue(item, ['title', 'name']),
    thumbnail_url: pickFirstValue(item, ['thumbnail_url', 'thumbnail', 'thumbnail_240_url']),
    content_type: pickFirstValue(item, ['content_type', 'content_type_id']),
    keywords: describeKeywords(item),
  };
}

function printFirstThreeFileDiagnostics(files) {
  files.slice(0, 3).forEach((file, index) => {
    console.log(`file_${index + 1}_keys:`, Object.keys(file));
    console.log(`file_${index + 1}_keywords:`, JSON.stringify(describeKeywords(file), null, 2));
  });
}

function summarizeAvailability(files) {
  const rows = files.map(summarizeFile);
  return {
    count: files.length,
    hasId: rows.some((row) => row.id),
    hasTitle: rows.some((row) => row.title),
    hasKeywords: hasUsableKeywords(files),
    hasThumbnailUrl: rows.some((row) => row.thumbnail_url),
    hasContentType: rows.some((row) => row.content_type),
    samples: rows.slice(0, 3),
  };
}

async function runSearchTest(locale, filterTest) {
  const url = buildSearchUrl({ locale, filterKeys: filterTest.filterKeys });
  console.log('\n--- Search/Files test ---');
  console.log('locale:', locale);
  console.log('filter:', filterTest.label);
  console.log('url:', url.toString());

  const result = await fetchJson(url);
  const files = extractFiles(result.json);
  keywordsSupported ||= hasUsableKeywords(files);

  console.log('status:', result.status, result.statusText);
  console.log('availability:', JSON.stringify(summarizeAvailability(files), null, 2));
  printFirstThreeFileDiagnostics(files);

  if (!result.json) {
    console.log('body500:', result.body500);
  }

  return files;
}

async function runMetadataTest(contentId) {
  console.log('\n--- Files metadata endpoint keyword candidates ---');
  console.log('id:', contentId);

  for (const url of buildMetadataUrls(contentId)) {
    console.log('\nurl:', url.toString());
    const result = await fetchJson(url);
    const files = extractFiles(result.json);
    keywordsSupported ||= hasUsableKeywords(files);

    console.log('status:', result.status, result.statusText);

    if (files.length > 0) {
      console.log('availability:', JSON.stringify(summarizeAvailability(files), null, 2));
      printFirstThreeFileDiagnostics(files);
    } else if (result.json) {
      console.log('jsonKeys:', Object.keys(result.json));
      console.log('jsonPreview:', JSON.stringify(result.json).slice(0, 500));
      console.log('keywords:', JSON.stringify(describeKeywords(result.json), null, 2));
      keywordsSupported ||= hasUsableKeywords([result.json]);
    } else {
      console.log('body500:', result.body500);
    }
  }
}

async function main() {
  if (!API_KEY) {
    console.error('ADOBE_STOCK_API_KEY or ADOBE_API_KEY is required.');
    console.error('PowerShell: $env:ADOBE_STOCK_API_KEY="YOUR_API_KEY"; npm run test:adobe-official-api');
    console.log('\nkeywords_supported: false');
    process.exitCode = 1;
    return;
  }

  console.log('Adobe Stock official API keywords test');
  console.log('auth:', ACCESS_TOKEN ? 'x-api-key + OAuth bearer token' : 'x-api-key only');
  console.log('product:', PRODUCT);
  console.log('result_columns:', RESULT_COLUMNS.join(', '));

  let firstId = null;
  let searchHadKeywords = false;

  for (const locale of LOCALES) {
    for (const filterTest of FILTER_TESTS) {
      const files = await runSearchTest(locale, filterTest);
      searchHadKeywords ||= hasUsableKeywords(files);

      const firstFile = files.find(Boolean);
      firstId ||= pickFirstValue(firstFile, ['id', 'content_id', 'asset_id']);
    }
  }

  if (!searchHadKeywords && firstId) {
    console.log('\nSearch/Files did not return usable keywords. Trying Files metadata endpoints...');
    await runMetadataTest(firstId);
  } else if (!firstId) {
    console.log('\nNo id was found for Files metadata endpoint testing.');
  } else {
    console.log('\nSearch/Files returned usable keywords. Metadata fallback is not required.');
  }

  console.log(`\nkeywords_supported: ${keywordsSupported ? 'true' : 'false'}`);
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  console.log('\nkeywords_supported: false');
  process.exitCode = 1;
});

