'use strict';

function normalizeJsonLike(candidate) {
  let result = '';
  let inDouble = false;
  let inSingle = false;
  let escapeNext = false;

  for (let i = 0; i < candidate.length; i += 1) {
    const char = candidate[i];

    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }

    if (inDouble) {
      result += char;
      if (char === '"') {
        inDouble = false;
      }
      continue;
    }

    if (inSingle) {
      if (char === "'") {
        let j = i + 1;
        while (j < candidate.length && /\s/.test(candidate[j])) {
          j += 1;
        }

        const nextChar = candidate[j];
        const isClosingQuote = nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === ':' || nextChar === undefined;

        if (isClosingQuote) {
          result += '"';
          inSingle = false;
        } else {
          result += char;
        }
        continue;
      }

      if (char === '"') {
        result += '\\"';
        continue;
      }

      result += char;
      continue;
    }

    if (char === '"') {
      inDouble = true;
      result += char;
      continue;
    }

    if (char === "'") {
      inSingle = true;
      result += '"';
      continue;
    }

    result += char;
  }

  return result;
}

/**
 * Strip markdown fences and extract the first complete JSON object
 * from a raw model response string.
 */
function extractJson(rawText) {
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  const start   = cleaned.indexOf('{');
  const end     = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('No JSON object found in model output');
  }

  const candidate = cleaned.slice(start, end + 1);

  try {
    return JSON.parse(candidate);
  } catch {
    const normalized = normalizeJsonLike(candidate);

    return JSON.parse(normalized);
  }
}

module.exports = { extractJson };
