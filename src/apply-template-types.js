import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const VERIFIED_JSON_PATH = path.join(ROOT_DIR, 'verified-template-types.json');
const TEMPLATE_TYPE_MAP_PATH = path.join(ROOT_DIR, 'src', 'templateTypeMap.js');

function getLineEnding(source) {
  return source.includes('\r\n') ? '\r\n' : '\n';
}

function parseObjectBlock(source, exportName) {
  const blockPattern = new RegExp(
    `export const ${exportName} = \\{([\\s\\S]*?)\\r?\\n\\};`,
    'm',
  );
  const match = source.match(blockPattern);

  if (!match) {
    return null;
  }

  return {
    body: match[1],
    fullMatch: match[0],
    start: match.index,
    end: match.index + match[0].length,
  };
}

function parseApiMapEntries(body) {
  const entries = [];
  const entryPattern = /^\s*([A-Za-z0-9_]+):\s*(\[[^\n]*\]|'[^']*'),\s*$/gm;

  let match = entryPattern.exec(body);
  while (match) {
    const rawValue = match[2];

    if (rawValue.startsWith('[')) {
      const values = [...rawValue.matchAll(/'([^']+)'/g)].map((item) => item[1]);
      entries.push([match[1], values]);
    } else {
      entries.push([match[1], rawValue.slice(1, -1)]);
    }

    match = entryPattern.exec(body);
  }

  return entries;
}

function parseBooleanObjectEntries(body) {
  const entries = [];
  const entryPattern = /^\s*([A-Za-z0-9_]+):\s*(true|false),\s*$/gm;

  let match = entryPattern.exec(body);
  while (match) {
    entries.push([match[1], match[2] === 'true']);
    match = entryPattern.exec(body);
  }

  return entries;
}

function normalizeApiValues(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return [String(value ?? '').trim()].filter(Boolean);
}

function toOrderedStringMap(existingEntries, updates) {
  const map = new Map(existingEntries);

  for (const [key, value] of updates) {
    map.set(key, value);
  }

  return map;
}

function toOrderedBooleanMap(existingEntries, updates) {
  const map = new Map(existingEntries);

  for (const [key, value] of updates) {
    map.set(key, value);
  }

  return map;
}

function formatApiMapObject(exportName, entryMap, lineEnding) {
  const lines = [`export const ${exportName} = {`];

  for (const [key, value] of entryMap.entries()) {
    if (Array.isArray(value)) {
      const formattedArray = value.map((item) => `'${item}'`).join(', ');
      lines.push(`  ${key}: [${formattedArray}],`);
      continue;
    }

    lines.push(`  ${key}: '${value}',`);
  }

  lines.push('};');
  return lines.join(lineEnding);
}

function formatBooleanObject(exportName, entryMap, lineEnding) {
  const lines = [`export const ${exportName} = {`];

  for (const [key, value] of entryMap.entries()) {
    lines.push(`  ${key}: ${value ? 'true' : 'false'},`);
  }

  lines.push('};');
  return lines.join(lineEnding);
}

function getSuccessfulEntries(verifiedJson) {
  if (Array.isArray(verifiedJson.results)) {
    return verifiedJson.results
      .filter((item) => item && item.value && item.verifiedApiValue)
      .map((item) => ({
        value: item.value,
        apiValue: item.verifiedApiValue,
      }));
  }

  if (verifiedJson.verified && typeof verifiedJson.verified === 'object') {
    return Object.entries(verifiedJson.verified).map(([value, apiValue]) => ({
      value,
      apiValue,
    }));
  }

  return [];
}

async function applyVerifiedTemplateTypes() {
  const [verifiedJsonRaw, templateTypeMapSource] = await Promise.all([
    fs.readFile(VERIFIED_JSON_PATH, 'utf8'),
    fs.readFile(TEMPLATE_TYPE_MAP_PATH, 'utf8'),
  ]);

  const verifiedJson = JSON.parse(verifiedJsonRaw);
  const successEntries = getSuccessfulEntries(verifiedJson);

  if (successEntries.length === 0) {
    throw new Error('verified-template-types.json에 반영할 success 항목이 없습니다.');
  }

  const lineEnding = getLineEnding(templateTypeMapSource);

  const apiMapBlock = parseObjectBlock(templateTypeMapSource, 'TEMPLATE_TYPE_API_VALUE_MAP');
  if (!apiMapBlock) {
    throw new Error('TEMPLATE_TYPE_API_VALUE_MAP 블록을 찾을 수 없습니다.');
  }

  const verifiedBlock = parseObjectBlock(templateTypeMapSource, 'VERIFIED_TEMPLATE_TYPES');

  const currentApiMapEntries = parseApiMapEntries(apiMapBlock.body);
  const currentVerifiedEntries = verifiedBlock
    ? parseBooleanObjectEntries(verifiedBlock.body)
    : [];

  const apiMapUpdates = successEntries.map(({ value, apiValue }) => [value, apiValue]);
  const verifiedUpdates = successEntries.flatMap(({ apiValue }) =>
    normalizeApiValues(apiValue).map((value) => [value, true]),
  );

  const nextApiMap = toOrderedStringMap(currentApiMapEntries, apiMapUpdates);
  const nextVerifiedMap = toOrderedBooleanMap(currentVerifiedEntries, verifiedUpdates);

  const nextApiMapBlock = formatApiMapObject(
    'TEMPLATE_TYPE_API_VALUE_MAP',
    nextApiMap,
    lineEnding,
  );
  const nextVerifiedBlock = formatBooleanObject(
    'VERIFIED_TEMPLATE_TYPES',
    nextVerifiedMap,
    lineEnding,
  );

  let nextSource = templateTypeMapSource.replace(apiMapBlock.fullMatch, nextApiMapBlock);

  if (verifiedBlock) {
    nextSource = nextSource.replace(verifiedBlock.fullMatch, nextVerifiedBlock);
  } else {
    nextSource = nextSource.replace(
      nextApiMapBlock,
      `${nextApiMapBlock}${lineEnding}${lineEnding}${nextVerifiedBlock}`,
    );
  }

  await fs.writeFile(TEMPLATE_TYPE_MAP_PATH, nextSource, 'utf8');

  console.log('[apply:template-types] success entries:', successEntries.length);
  console.log('[apply:template-types] updated map:', TEMPLATE_TYPE_MAP_PATH);
}

applyVerifiedTemplateTypes().catch((error) => {
  console.error('[apply:template-types] failed:', error.message);
  process.exitCode = 1;
});
