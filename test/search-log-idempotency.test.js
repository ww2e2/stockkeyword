import assert from 'node:assert/strict';
import test from 'node:test';

import { logSearchEvent } from '../src/services/supabase.js';
import {
  htmlPage,
  renderKeywordAnalysisPage,
} from '../src/views/html.js';

function createMockClient(insertedRows) {
  return {
    from(table) {
      assert.equal(table, 'search_logs');
      return {
        async insert(row) {
          insertedRows.push(row);
          return { error: null };
        },
      };
    },
  };
}

test('each supported search type inserts once for a duplicated request', async () => {
  const cases = [
    ['miricanvas', 'keyword'],
    ['miricanvas', 'template'],
    ['crowdpic', 'keyword'],
    ['tooldi', 'keyword'],
    ['tooldi', 'template'],
  ];

  for (const [platform, feature] of cases) {
    const insertedRows = [];
    const client = createMockClient(insertedRows);
    const event = {
      platform,
      feature,
      query: 'summer',
      typeValue: 'all',
      typeLabel: 'All',
      requestId: `${platform}-${feature}-request`,
    };

    const results = await Promise.all([
      logSearchEvent(event, { client, now: () => 1_000 }),
      logSearchEvent(event, { client, now: () => 1_000 }),
    ]);

    assert.equal(insertedRows.length, 1);
    assert.equal(results.filter((result) => result.logged).length, 1);
    assert.equal(
      results.filter((result) => result.reason === 'duplicate-request').length,
      1,
    );

    await logSearchEvent(
      { ...event, requestId: `${event.requestId}-later` },
      { client, now: () => 1_100 },
    );
    assert.equal(insertedRows.length, 2);
  }
});

test('legacy requests are only deduplicated inside the short fallback window', async () => {
  const insertedRows = [];
  const client = createMockClient(insertedRows);
  const event = {
    platform: 'miricanvas',
    feature: 'keyword',
    query: 'legacy-search',
    typeValue: 'element',
  };

  await logSearchEvent(event, { client, now: () => 5_000 });
  const duplicate = await logSearchEvent(event, { client, now: () => 5_500 });
  await logSearchEvent(event, { client, now: () => 7_001 });

  assert.equal(duplicate.reason, 'duplicate-request');
  assert.equal(insertedRows.length, 2);
});

test('search forms include a request id and a duplicate-submit guard', () => {
  const contentHtml = renderKeywordAnalysisPage({
    searchOptions: { contentTypes: ['All'] },
  });
  const pageHtml = htmlPage('/miricanvas/tag', 'http://localhost:3000', {
    contentHtml,
  });

  assert.match(contentHtml, /name="requestId" value="[0-9a-f-]{36}"/);
  assert.match(pageHtml, /searchSubmitting/);
});
