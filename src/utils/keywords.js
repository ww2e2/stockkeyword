function cleanKeyword(value) {
  return String(value ?? '').trim();
}

export function hasBalancedParentheses(value) {
  let balance = 0;

  for (const character of String(value ?? '')) {
    if (character === '(') balance += 1;

    if (character === ')') {
      balance -= 1;
      if (balance < 0) return false;
    }
  }

  return balance === 0;
}

export function sanitizeKeyword(value) {
  const keyword = cleanKeyword(value);
  return keyword && hasBalancedParentheses(keyword) ? keyword : null;
}

export function sanitizeKeywords(values) {
  const seen = new Set();
  const keywords = [];

  for (const value of Array.isArray(values) ? values : [values]) {
    const keyword = sanitizeKeyword(value);

    if (keyword && !seen.has(keyword)) {
      seen.add(keyword);
      keywords.push(keyword);
    }
  }

  return keywords;
}
