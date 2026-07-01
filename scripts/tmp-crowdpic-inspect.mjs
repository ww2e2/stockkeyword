const url = 'https://www.crowdpic.net/photos/search?keyword=%EB%94%B8%EA%B8%B0&category=photo';

const html = await (await fetch(url)).text();

const patterns = [
  'adlib_trk_data',
  'p_tag',
  '/photos/',
  '/photo/',
  '/detail/',
  'data-tag',
  'keyword',
];

for (const pattern of patterns) {
  const index = html.indexOf(pattern);
  console.log(JSON.stringify({
    pattern,
    found: index >= 0,
    index,
    snippet: index >= 0 ? html.slice(Math.max(0, index - 220), index + 700) : null,
  }, null, 2));
}

const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
const uniqueHrefs = [...new Set(hrefs)];
console.log(JSON.stringify({
  hrefCount: uniqueHrefs.length,
  photoHrefs: uniqueHrefs.filter((href) => href.includes('/photos/')).slice(0, 80),
}, null, 2));
