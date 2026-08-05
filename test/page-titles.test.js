import assert from 'node:assert/strict';
import test from 'node:test';

import { getPageMeta } from '../src/app.js';
import { htmlPage } from '../src/views/html.js';

const FIXED_DATE = new Date('2026-07-17T03:00:00.000Z');

function renderPageShell(pathname) {
  const meta = getPageMeta(pathname, FIXED_DATE);
  const activeMenu = pathname.split('/').filter(Boolean)[0] || 'home';
  return htmlPage(pathname, 'http://localhost:3000', {
    activeMenu,
    ...meta,
  });
}

function extractTagText(html, tagName) {
  return html.match(new RegExp(`<${tagName}[^>]*>([^<]+)</${tagName}>`))?.[1];
}

test('major routes render unique document titles', () => {
  const expectedTitles = new Map([
    ['/', 'StockKeyword | 서비스 안내'],
    ['/miricanvas', '\uBBF8\uB9AC\uCE94\uBC84\uC2A4 | \uAE30\uB2A5 \uC120\uD0DD | StockKeyword'],
    ['/miricanvas/tag', '\uBBF8\uB9AC\uCE94\uBC84\uC2A4 | \uD0A4\uC6CC\uB4DC \uBD84\uC11D | StockKeyword'],
    ['/miricanvas/template', '\uBBF8\uB9AC\uCE94\uBC84\uC2A4 | \uD15C\uD50C\uB9BF \uBD84\uC11D | StockKeyword'],
    ['/miricanvas/rankings', '\uBBF8\uB9AC\uCE94\uBC84\uC2A4 | \uC6D4\uAC04 \uC778\uAE30 \uAC80\uC0C9 \uC21C\uC704 | StockKeyword'],
    ['/tooldi', '\uD234\uB514 | \uAE30\uB2A5 \uC120\uD0DD | StockKeyword'],
    ['/tooldi/tag', '\uD234\uB514 | \uD0A4\uC6CC\uB4DC \uBD84\uC11D | StockKeyword'],
    ['/tooldi/template', '\uD234\uB514 | \uD15C\uD50C\uB9BF \uBD84\uC11D | StockKeyword'],
    ['/tooldi/rankings', '\uD234\uB514 | \uC6D4\uAC04 \uC778\uAE30 \uAC80\uC0C9 \uC21C\uC704 | StockKeyword'],
    ['/calendar', '\uC6D4\uBCC4 \uC791\uC5C5 \uCE98\uB9B0\uB354 | StockKeyword'],
    ['/calendar/9', '9\uC6D4 \uCD94\uCC9C \uC18C\uC7AC | \uC6D4\uBCC4 \uC791\uC5C5 \uCE98\uB9B0\uB354 | StockKeyword'],
    ['/faq', 'FAQ | StockKeyword'],
    ['/updates', '\uC5C5\uB370\uC774\uD2B8 | StockKeyword'],
    ['/about', '\uC18C\uAC1C | StockKeyword'],
    ['/privacy', '\uAC1C\uC778\uC815\uBCF4\uCC98\uB9AC\uBC29\uCE68 | StockKeyword'],
    ['/terms', '\uC774\uC6A9\uC57D\uAD00 | StockKeyword'],
    ['/contact', '\uBB38\uC758 | StockKeyword'],
  ]);

  const actualTitles = [];

  for (const [pathname, expectedTitle] of expectedTitles) {
    const title = extractTagText(renderPageShell(pathname), 'title');
    assert.equal(title, expectedTitle, pathname);
    actualTitles.push(title);
  }

  assert.equal(new Set(actualTitles).size, actualTitles.length);
});

test('document title changes do not alter existing page headings', () => {
  const expectedHeadings = new Map([
    ['/', '서비스 안내'],
    ['/miricanvas', '\uBBF8\uB9AC\uCE94\uBC84\uC2A4'],
    ['/miricanvas/tag', '\uD0A4\uC6CC\uB4DC \uBD84\uC11D'],
    ['/miricanvas/template', '\uD15C\uD50C\uB9BF \uBD84\uC11D'],
    ['/miricanvas/rankings', '\uC774\uBC88 \uB2EC \uC778\uAE30 \uAC80\uC0C9 \uC21C\uC704'],
    ['/calendar', '9\uC6D4 | \uC6D4\uBCC4 \uC791\uC5C5 \uCE98\uB9B0\uB354'],
    ['/updates', '\uC5C5\uB370\uC774\uD2B8'],
    ['/about', '\uC11C\uBE44\uC2A4 \uC18C\uAC1C | StockKeyword'],
  ]);

  for (const [pathname, expectedHeading] of expectedHeadings) {
    assert.equal(
      extractTagText(renderPageShell(pathname), 'h1'),
      expectedHeading,
      pathname,
    );
  }
});
