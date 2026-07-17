import {
  buildRobotsTxt,
  buildSitemapXml,
  serveAdsTxt,
  serveFaviconAsset,
} from './routes/static.js';
import { renderPage } from './routes/pages.js';

export { getPageMeta } from './routes/pageMeta.js';

function cleanText(value) {
  return String(value ?? '').trim();
}

export async function requestHandler(req, res) {
  try {
    const protocol = cleanText(req.headers['x-forwarded-proto']) || 'http';
    const host = cleanText(req.headers.host) || 'localhost';
    const requestUrl = new URL(req.url, `${protocol}://${host}`);

    if (req.method === 'GET' && requestUrl.pathname === '/ads.txt') {
      if (!serveAdsTxt(res)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('not found');
      }
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(buildRobotsTxt(requestUrl.origin));
      return;
    }

    if (req.method === 'GET' && requestUrl.pathname === '/sitemap.xml') {
      res.writeHead(200, {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      });
      res.end(buildSitemapXml(requestUrl.origin));
      return;
    }

    if (req.method === 'GET' && serveFaviconAsset(requestUrl.pathname, res)) {
      return;
    }

    if (req.method === 'GET') {
      const content = await renderPage(
        requestUrl.pathname,
        requestUrl.origin,
        requestUrl,
      );
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found');
  } catch (error) {
    console.error('Request failed:', error?.message || String(error));

    if (!res.headersSent && !res.writableEnded) {
      res.writeHead(500, {
        'Content-Type': 'application/json; charset=utf-8',
      });
      res.end(JSON.stringify({ error: error?.message || String(error) }));
    }
  }
}

export default requestHandler;
