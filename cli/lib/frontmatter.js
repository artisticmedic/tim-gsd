// frontmatter.js — Minimal YAML frontmatter parser
//
// Handles the subset of YAML we actually use in gsd artifacts:
//   - Scalar values: phase: 2, wave: 1
//   - String values: plan: "01", name: Auth Foundation
//   - Array values: depends_on: [], requirements: [AUTH-01, AUTH-02]
//   - Boolean values: autonomous: true
//   - Nested keys (one level): must_haves.truths: [...]
//
// For complex YAML, this will return strings as-is. Not a full YAML parser.

const { readFile, writeFile } = require('./util');

// Parse frontmatter block from markdown content.
// Returns { frontmatter: object, body: string, raw: string }
function parse(content) {
  if (!content || !content.startsWith('---')) {
    return { frontmatter: {}, body: content || '', raw: '' };
  }

  const endMatch = content.indexOf('\n---', 3);
  if (endMatch === -1) {
    return { frontmatter: {}, body: content, raw: '' };
  }

  const raw = content.slice(4, endMatch).trim();
  const body = content.slice(endMatch + 4).replace(/^\n/, '');

  const frontmatter = parseYamlSubset(raw);
  return { frontmatter, body, raw };
}

// Parse YAML subset. Returns flat object with dot-notation keys for nesting.
function parseYamlSubset(yamlText) {
  const result = {};
  const lines = yamlText.split('\n');
  let currentKey = null;
  let currentIndent = 0;

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const indent = line.match(/^ */)[0].length;
    const trimmed = line.trim();

    // Key: value pattern
    const kvMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (kvMatch) {
      const [, key, rawValue] = kvMatch;
      const value = rawValue.trim();

      if (indent === 0) {
        currentKey = key;
        currentIndent = 0;
        if (value === '' || value === '{}') {
          result[key] = {};
        } else {
          result[key] = parseValue(value);
        }
      } else if (currentKey && indent > currentIndent) {
        // Nested key — store as dot notation
        if (typeof result[currentKey] !== 'object' || Array.isArray(result[currentKey])) {
          result[currentKey] = {};
        }
        result[currentKey][key] = parseValue(value);
      }
    }
  }

  return result;
}

// Parse a single YAML value into JS type
function parseValue(value) {
  if (value === '' || value === null || value === undefined) return '';
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);

  // Array: [a, b, c] or ["a", "b"]
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map(s => parseValue(s.trim().replace(/^["']|["']$/g, '')));
  }

  // Quoted string
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  return value;
}

// Serialize frontmatter object back to YAML
function stringify(frontmatter) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(frontmatter)) {
    if (value === null || value === undefined) {
      lines.push(`${key}:`);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const [subKey, subVal] of Object.entries(value)) {
        lines.push(`  ${subKey}: ${serializeValue(subVal)}`);
      }
    } else {
      lines.push(`${key}: ${serializeValue(value)}`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

function serializeValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return '[' + value.map(v => serializeValue(v)).join(', ') + ']';
  }
  if (typeof value === 'string') {
    // Quote if contains special chars
    if (/[:,\[\]{}#&*!|>'"%@`]/.test(value)) return `"${value.replace(/"/g, '\\"')}"`;
    return value;
  }
  return String(value);
}

// Get frontmatter from a file
function getFromFile(filePath) {
  const content = readFile(filePath);
  if (content === null) return null;
  return parse(content).frontmatter;
}

// Update a single frontmatter field in a file
function setInFile(filePath, key, value) {
  const content = readFile(filePath);
  if (content === null) return false;
  const { frontmatter, body } = parse(content);
  frontmatter[key] = value;
  const newContent = stringify(frontmatter) + '\n\n' + body;
  writeFile(filePath, newContent);
  return true;
}

module.exports = {
  parse,
  stringify,
  getFromFile,
  setInFile,
};
