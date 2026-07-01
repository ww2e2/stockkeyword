import { chromium } from 'playwright';

const SEARCH_PAGE_URL = 'https://stock.adobe.com/kr/search?k=apple';
const AJAX_URL = 'https://stock.adobe.com/kr/Ajax/Search?k=apple&limit=30&get_facets=0&filters%5Bcontent_type%3Aimage%5D=1';
const HEADLESS = String(process.env.PLAYWRIGHT_HEADLESS || 'true').toLowerCase() !== 'false';

async function main() {
  const browser = await chromium.launch({ headless: HEADLESS });
  const page = await browser.newPage();

  try {
    console.log('searchPage:', SEARCH_PAGE_URL);
    console.log('ajaxUrl:', AJAX_URL);
    console.log('headless:', HEADLESS);

    await page.goto(SEARCH_PAGE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(5000);

    const result = await page.evaluate(async (url) => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json,text/plain,*/*',
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        const body = await response.text();
        const body500 = body.slice(0, 500);
        const lowerBody = body500.toLowerCase();
        const hasCaptcha = lowerBody.includes('captcha') || lowerBody.includes('interstitial');

        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          body500,
          hasCaptcha,
        };
      } catch (error) {
        return {
          ok: false,
          status: 'FETCH_ERROR',
          statusText: error?.name || 'Error',
          body500: String(error?.message || error).slice(0, 500),
          hasCaptcha: false,
        };
      }
    }, AJAX_URL);

    console.log('status:', result.status);
    console.log('statusText:', result.statusText);
    console.log('hasCaptcha:', result.hasCaptcha);
    console.log('body500:', result.body500);
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error('playwrightTestError:', error);
  process.exitCode = 1;
});
