import assert from 'node:assert/strict';
import test from 'node:test';

import { requestHandler } from '../src/app.js';
import { buildSitemapXml } from '../src/routes/static.js';

function createResponse() {
  return {
    headersSent: false,
    writableEnded: false,
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
      this.headersSent = true;
    },
    end(body) {
      this.body = body == null ? '' : String(body);
      this.writableEnded = true;
    },
  };
}

test('/updates renders the sidebar menu and July 22 update details', async () => {
  const response = createResponse();

  await requestHandler({
    method: 'GET',
    url: '/updates',
    headers: { host: 'localhost:3000' },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /href="\/updates"/);
  assert.match(response.body, /aria-current="page"/);
  assert.match(response.body, /2026\.07\.22/);
  assert.match(response.body, /서비스 이용 안내 및 플랫폼 정보 개선/);
  assert.match(response.body, /처음 사용하시나요/);
  assert.match(response.body, /한 작품으로 더 많은 플랫폼에 도전하시나요/);
  assert.match(response.body, /툴디 관련 기능 비공개 전환/);
});

test('public sitemap includes updates and excludes hidden platform routes', () => {
  const sitemap = buildSitemapXml('https://www.stockkeyword.com');

  assert.match(sitemap, /https:\/\/www\.stockkeyword\.com\/updates/);
  assert.doesNotMatch(sitemap, /\/tooldi(?:<|\/)/);
  assert.doesNotMatch(sitemap, /\/crowdpic(?:<|\/)/);
});

test('public pages no longer present hidden platforms as supported', async () => {
  for (const path of ['/faq', '/about']) {
    const response = createResponse();

    await requestHandler({
      method: 'GET',
      url: path,
      headers: { host: 'localhost:3000' },
    }, response);

    assert.equal(response.statusCode, 200);
    assert.doesNotMatch(response.body, /툴디에서는 어떤 콘텐츠를 분석할 수 있나요/);
    assert.doesNotMatch(response.body, /<strong>툴디:<\/strong>/);
    assert.doesNotMatch(response.body, /크라우드픽|crowdpic/i);
  }
});


test('Crowdpic routes return 404 and do not render HTML', async () => {
  for (const path of ['/crowdpic', '/crowdpic/tag', '/crowdpic/rankings']) {
    const response = createResponse();

    await requestHandler({
      method: 'GET',
      url: path,
      headers: { host: 'localhost:3000' },
    }, response);

    assert.equal(response.statusCode, 404);
    assert.equal(response.body, 'not found');
  }
});
