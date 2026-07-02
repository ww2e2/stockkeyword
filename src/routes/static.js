import { readFile } from 'fs/promises';

export const FAVICON_FILE_MAP = new Map([
  ['/favicon.ico', { file: 'favicon.ico', contentType: 'image/x-icon' }],
  ['/favicon-16x16.png', { file: 'favicon-16x16.png', contentType: 'image/png' }],
  ['/favicon-32x32.png', { file: 'favicon-32x32.png', contentType: 'image/png' }],
  ['/apple-touch-icon.png', { file: 'apple-touch-icon.png', contentType: 'image/png' }],
  ['/android-chrome-192x192.png', { file: 'android-chrome-192x192.png', contentType: 'image/png' }],
  ['/android-chrome-512x512.png', { file: 'android-chrome-512x512.png', contentType: 'image/png' }],
  ['/site.webmanifest', { file: 'site.webmanifest', contentType: 'application/manifest+json; charset=utf-8' }],
]);

export function buildRobotsTxt(origin) {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
  ].join('\n');
}

export function buildSitemapXml(origin, { escapeHtml, getCollectedDate }) {
  const lastmod = getCollectedDate();
  const urls = ['/', '/miricanvas', '/miricanvas/tag', '/miricanvas/template', '/miricanvas/rankings', '/crowdpic', '/crowdpic/tag', '/crowdpic/rankings', '/about', '/privacy', '/terms', '/contact'];
  const urlset = urls.map((path) => {
    const loc = `${origin}${path === '/' ? '/' : path}`;
    return [
      '  <url>',
      `    <loc>${escapeHtml(loc)}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      '  </url>',
    ].join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlset,
    '</urlset>',
  ].join('\n');
}

export async function serveFaviconAsset(reqPath, res) {
  const asset = FAVICON_FILE_MAP.get(reqPath);
  if (!asset) {
    return false;
  }

  const fileBuffer = await readFile(new URL(`../favicon_io/${asset.file}`, import.meta.url));
  res.writeHead(200, {
    'Content-Type': asset.contentType,
    'Cache-Control': 'public, max-age=86400',
  });
  res.end(fileBuffer);
  return true;
}
