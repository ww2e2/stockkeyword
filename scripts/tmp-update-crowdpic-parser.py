from pathlib import Path
import re

path = Path(r"C:\projects\miricanvas-tag-saas\src\crowdpic.js")
s = path.read_text(encoding="utf-8")

s = s.replace(
    "    /\\/photo\\/[^?#]+/i,\n    /\\/image\\/[^?#]+/i,",
    "    /\\/photo\\/[^?#]+/i,\n    /\\/photos\\/theme\\/[^?#]+/i,\n    /\\/photos\\/[^?#]+/i,\n    /\\/image\\/[^?#]+/i,",
)

s = s.replace(
    "    if (/^\\/(?:$|search|ranking|login|logout|signup|join|help|guide|notice|faq|magazine|editor|edit|about|privacy|terms|contact)/i.test(path)) {\n      continue;\n    }",
    "    if (/^\\/(?:$|search|ranking|login|logout|signup|join|help|guide|notice|faq|magazine|editor|edit|about|privacy|terms|contact)/i.test(path)) {\n      continue;\n    }\n\n    if (/^\\/photos\\/category\\//i.test(path)) {\n      continue;\n    }",
)

s = s.replace(
    "  const metaTags = extractKeywordsFromText(source);\n  const anchorTags = [...source.matchAll(/<a[^>]+(?:class=[\"'][^\"']*(?:tag|keyword)[^\"']*[\"'][^>]*)?>([^<]{1,80})<\\/a>/gi)]",
    "  const metaTags = extractKeywordsFromText(source);\n  const adlibTagMatch = source.match(/adlib_trk_data\\.p_tag\\s*=\\s*[\"']([^\"']+)[\"']/i);\n  const dataTagMatch = source.match(/data-tag=[\"']([^\"']+)[\"']/i);\n  const adlibTags = adlibTagMatch ? extractTextListFromDelimitedValue(adlibTagMatch[1]) : [];\n  const dataTags = dataTagMatch ? extractTextListFromDelimitedValue(dataTagMatch[1]) : [];\n  const anchorTags = [...source.matchAll(/<a[^>]+(?:class=[\"'][^\"']*(?:tag|keyword)[^\"']*[\"'][^>]*)?>([^<]{1,80})<\\/a>/gi)]",
)

s = s.replace(
    "  return [...new Set([...metaTags, ...anchorTags, ...spanTags, ...listTags])]",
    "  return [...new Set([...metaTags, ...adlibTags, ...dataTags, ...anchorTags, ...spanTags, ...listTags])]",
)

path.write_text(s, encoding="utf-8")
