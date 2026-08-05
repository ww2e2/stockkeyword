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

test('/updates renders the platform shutdown notice and previous update details', async () => {
  const response = createResponse();

  await requestHandler({
    method: 'GET',
    url: '/updates',
    headers: { host: 'localhost:3000' },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /href="\/updates"/);
  assert.match(response.body, /aria-current="page"/);
  assert.match(response.body, /2026\.08\.05/);
  assert.match(response.body, /플랫폼 관련 기능 지원 종료 안내/);
  assert.match(response.body, /플랫폼 정책상 앞으로는 관련 기능 지원이 어려울 것 같습니다/);
  assert.match(response.body, /공개 메뉴 및 URL 비활성화/);
  assert.match(response.body, /2026\.07\.29/);
  assert.match(response.body, /크라우드픽 관련 서비스 종료 안내/);
  assert.match(response.body, /크라우드픽 관련 기능 종료/);
  assert.match(response.body, /공개 메뉴 및 페이지 비활성화/);
  assert.match(response.body, /관련 신규 데이터 수집 중단/);
  assert.match(response.body, /2026\.07\.22/);
  assert.match(response.body, /서비스 이용 안내 및 플랫폼 정보 개선/);
  assert.match(response.body, /처음 사용하시나요/);
  assert.match(response.body, /한 작품으로 더 많은 플랫폼에 도전하시나요/);
  assert.match(response.body, /툴디 관련 기능 비공개 전환/);
});

test('public sitemap includes updates and excludes hidden platform routes', () => {
  const sitemap = buildSitemapXml('https://www.stockkeyword.com');

  assert.match(sitemap, /https:\/\/www\.stockkeyword\.com\/updates/);
  assert.doesNotMatch(sitemap, /\/miricanvas(?:<|\/)/);
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


test('homepage shows the shutdown notice without platform navigation', async () => {
  const response = createResponse();

  await requestHandler({
    method: 'GET',
    url: '/',
    headers: { host: 'localhost:3000' },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.match(response.body, /플랫폼 정책상 앞으로는 관련 기능 지원이 어려울 것 같습니다/);
  assert.match(response.body, /관련 URL을 모두 비활성화/);
  assert.doesNotMatch(response.body, /href="\/miricanvas/);
  assert.doesNotMatch(response.body, />미리캔버스</);
});


test('disabled platform routes and legacy aliases return 404', async () => {
  for (const path of [
    '/miricanvas',
    '/miricanvas/tag',
    '/miricanvas/template',
    '/miricanvas/rankings',
    '/tag',
    '/result',
    '/template',
    '/crowdpic',
    '/crowdpic/tag',
    '/crowdpic/rankings',
  ]) {
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
