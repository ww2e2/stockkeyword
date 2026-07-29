import assert from 'node:assert/strict';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

import { getPageMeta } from '../src/app.js';
import { getStockWorkPeriod } from '../src/config/siteConfig.js';
import {
  htmlPage,
  renderCalendarPage,
  renderHomePage,
} from '../src/views/html.js';

test('7월에는 홈 문구는 이번 달로 표시하고 소재와 캘린더는 9월 기준이다', () => {
  const date = new Date('2026-07-16T03:00:00.000Z');
  const homeHtml = renderHomePage(date);
  const calendarHtml = renderCalendarPage(date);
  const calendarMeta = getPageMeta('/calendar', date);
  const cards = [...calendarHtml.matchAll(/<article[\s\S]*?<\/article>/g)]
    .map((match) => match[0]);
  const julyCard = cards.find((card) => card.includes('>7월<'));
  const septemberCard = cards.find((card) => card.includes('>9월<'));

  assert.match(homeHtml, /이번 달 추천 소재/);
  assert.match(homeHtml, /이번 달 스톡 작업에 활용하기 좋은 소재/);
  assert.doesNotMatch(homeHtml, /9월 추천 소재/);
  assert.match(homeHtml, />가을</);
  assert.doesNotMatch(homeHtml, />장마</);
  assert.equal(calendarMeta.title, '월별 작업 캘린더 | StockKeyword');
  assert.equal(
    calendarMeta.description,
    '7월에는 9월 스톡 소재를 미리 준비해보세요.',
  );
  assert.equal(cards.length, 12);
  assert.ok(septemberCard?.includes('is-target'));
  assert.ok(septemberCard?.includes('data-work-target'));
  assert.ok(!julyCard?.includes('is-target'));
  assert.ok(julyCard?.includes('현재 월'));
});

test('11월의 작업 대상 월은 다음 해 1월이다', () => {
  assert.deepEqual(
    getStockWorkPeriod(new Date('2026-11-15T03:00:00.000Z')),
    {
      currentYear: 2026,
      currentMonth: 11,
      targetYear: 2027,
      targetMonth: 1,
    },
  );
});

test('12월의 작업 대상 월은 다음 해 2월이다', () => {
  assert.deepEqual(
    getStockWorkPeriod(new Date('2026-12-15T03:00:00.000Z')),
    {
      currentYear: 2026,
      currentMonth: 12,
      targetYear: 2027,
      targetMonth: 2,
    },
  );
});

test('한국 시간 기준으로 현재 월을 계산한다', () => {
  assert.deepEqual(
    getStockWorkPeriod(new Date('2026-06-30T15:30:00.000Z')),
    {
      currentYear: 2026,
      currentMonth: 7,
      targetYear: 2026,
      targetMonth: 9,
    },
  );
});
test('모든 공통 페이지에 GTM 컨테이너만 한 번씩 렌더링한다', () => {
  const paths = ['/', '/calendar', '/miricanvas', '/tooldi'];

  for (const pathname of paths) {
    const pageHtml = htmlPage(pathname, 'http://localhost:3000', {
      contentHtml: '<main>test</main>',
    });

    assert.equal((pageHtml.match(/GTM-THGZ9WD3/g) || []).length, 2);
    assert.equal((pageHtml.match(/googletagmanager\.com\/gtm\.js/g) || []).length, 1);
    assert.equal((pageHtml.match(/googletagmanager\.com\/ns\.html/g) || []).length, 1);
    assert.doesNotMatch(pageHtml, /gtag\/js|function gtag|G-5J443L4F10/);
  }
});

test('GTM bootstrap creates dataLayer and inserts the container request', () => {
  const pageHtml = htmlPage('/', 'http://localhost:3000');
  const inlineScript = pageHtml.match(
    /<!-- Google Tag Manager -->\s*<script>([\s\S]*?)<\/script>/,
  )?.[1];
  const insertedUrls = [];
  const firstScript = {
    parentNode: {
      insertBefore(script) {
        insertedUrls.push(script.src);
      },
    },
  };
  const browserWindow = {};
  const browserDocument = {
    getElementsByTagName: () => [firstScript],
    createElement: () => ({}),
  };

  assert.ok(inlineScript);
  runInNewContext(inlineScript, {
    window: browserWindow,
    document: browserDocument,
    Date,
  });

  assert.equal(Array.isArray(browserWindow.dataLayer), true);
  assert.equal(browserWindow.dataLayer.length, 1);
  assert.equal(browserWindow.dataLayer[0].event, 'gtm.js');
  assert.deepEqual(insertedUrls, [
    'https://www.googletagmanager.com/gtm.js?id=GTM-THGZ9WD3',
  ]);
});
