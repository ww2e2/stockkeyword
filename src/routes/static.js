import fs from 'fs';
import path from 'path';

const FAVICON_DIR = path.resolve(process.cwd(), 'favicon_io');
const ADS_TXT_PATH = path.resolve(process.cwd(), 'ads.txt');

export function serveAdsTxt(res) {
  if (!fs.existsSync(ADS_TXT_PATH)) return false;

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(fs.readFileSync(ADS_TXT_PATH));
  return true;
}


export function buildRobotsTxt(origin) {
  return [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}


const SITEMAP_PATHS = [
  '/',

  '/miricanvas',
  '/miricanvas/tag',
  '/miricanvas/template',
  '/miricanvas/rankings',

  '/crowdpic',
  '/crowdpic/tag',
  '/crowdpic/rankings',

  '/calendar',
  ...Array.from(
    { length: 12 },
    (_, index) => `/calendar/${index + 1}`,
  ),

  '/faq',
  '/updates',
  '/about',
  '/privacy',
  '/terms',
  '/contact',
];

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSitemapXml(origin) {
  const baseUrl = String(origin ?? '').replace(/\/+$/, '');

  const urls = SITEMAP_PATHS
    .map((pathname) => `
  <url>
    <loc>${escapeXml(`${baseUrl}${pathname}`)}</loc>
  </url>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>
`;
}

export function serveFaviconAsset(pathname, res) {
  const fileMap = {
    '/favicon.ico': 'favicon.ico',
    '/favicon-32x32.png': 'favicon-32x32.png',
    '/favicon-16x16.png': 'favicon-16x16.png',
    '/apple-touch-icon.png': 'apple-touch-icon.png',
    '/android-chrome-192x192.png': 'android-chrome-192x192.png',
    '/android-chrome-512x512.png': 'android-chrome-512x512.png',
    '/site.webmanifest': 'site.webmanifest',
  };

  const fileName = fileMap[pathname];
  if (!fileName) return false;

  const filePath = path.join(FAVICON_DIR, fileName);
  if (!fs.existsSync(filePath)) return false;

  const contentType = fileName.endsWith('.png')
    ? 'image/png'
    : fileName.endsWith('.ico')
      ? 'image/x-icon'
      : fileName.endsWith('.webmanifest')
        ? 'application/manifest+json'
        : 'text/plain';

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(fs.readFileSync(filePath));
  return true;
}
