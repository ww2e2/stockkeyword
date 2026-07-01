from pathlib import Path

path = Path(r"C:\projects\miricanvas-tag-saas\src\crowdpic.js")
s = path.read_text(encoding="utf-8")

s = s.replace(
    "const DEFAULT_SEARCH_PAGE_SIZE = 30;\n",
    "const DEFAULT_SEARCH_PAGE_SIZE = 30;\nconst CROWDPIC_COOKIE_CACHE = new Map();\n",
)

insert_after = """function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}
"""
cookie_helpers = """function getCookieHeaderValue(setCookieHeader) {
  const text = cleanText(setCookieHeader);
  if (!text) {
    return '';
  }

  const sessionMatch = text.match(/PHPSESSID=[^;]+/i);
  return sessionMatch ? sessionMatch[0] : '';
}

async function ensureCrowdpicSessionCookie(origin) {
  const normalizedOrigin = new URL(origin).origin;
  if (CROWDPIC_COOKIE_CACHE.has(normalizedOrigin)) {
    return CROWDPIC_COOKIE_CACHE.get(normalizedOrigin);
  }

  const response = await fetch(normalizedOrigin, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    },
  });

  const cookieHeader = getCookieHeaderValue(response.headers.get('set-cookie'));
  CROWDPIC_COOKIE_CACHE.set(normalizedOrigin, cookieHeader);
  return cookieHeader;
}

async function getCrowdpicCookieHeader(origin) {
  return ensureCrowdpicSessionCookie(origin);
}
"""
s = s.replace(insert_after, insert_after + "\n" + cookie_helpers)

old_search_headers = """  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  };
"""
new_search_headers = """  const cookie = await getCrowdpicCookieHeader(origin);
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    ...(cookie ? { Cookie: cookie } : {}),
  };
"""
s = s.replace(old_search_headers, new_search_headers)

old_detail_headers = """  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  };
"""
new_detail_headers = """  const cookie = await getCrowdpicCookieHeader(detailUrl);
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    ...(cookie ? { Cookie: cookie } : {}),
  };
"""
# only the first occurrence is search headers; replace the second manually
first_index = s.find(old_search_headers)
if first_index != -1:
  second_index = s.find(old_detail_headers, first_index + len(new_search_headers))
  if second_index != -1:
    s = s[:second_index] + new_detail_headers + s[second_index + len(old_detail_headers):]

path.write_text(s, encoding="utf-8")
