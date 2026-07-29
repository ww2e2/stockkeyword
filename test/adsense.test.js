import assert from 'node:assert/strict';
import test from 'node:test';

import { requestHandler } from '../src/app.js';
import { htmlPage } from '../src/views/html.js';

test('all common pages render one AdSense account and script', () => {
  const paths = ['/', '/calendar', '/miricanvas', '/tooldi'];

  for (const pathname of paths) {
    const pageHtml = htmlPage(pathname, 'http://localhost:3000');

    assert.equal((pageHtml.match(/google-adsense-account/g) || []).length, 1);
    assert.equal((pageHtml.match(/pagead\/js\/adsbygoogle\.js/g) || []).length, 1);
    assert.equal((pageHtml.match(/ca-pub-3386559853644133/g) || []).length, 2);
    assert.equal((pageHtml.match(/GTM-THGZ9WD3/g) || []).length, 2);
  }
});

test('/ads.txt returns the publisher record as plain text', async () => {
  const response = {
    headersSent: false,
    writableEnded: false,
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
      this.headersSent = true;
    },
    end(body) {
      this.body = String(body);
      this.writableEnded = true;
    },
  };

  await requestHandler({
    method: 'GET',
    url: '/ads.txt',
    headers: { host: 'localhost:3000' },
  }, response);

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['Content-Type'], /^text\/plain/);
  assert.equal(
    response.body.trim(),
    'google.com, pub-3386559853644133, DIRECT, f08c47fec0942fa0',
  );
});
