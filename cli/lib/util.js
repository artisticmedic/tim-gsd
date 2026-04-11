// util.js — Shared utilities for gsd-tools
// Pure functions, no side effects except file I/O where noted.

const fs = require('fs');
const path = require('path');

// ---------- Paths ----------

function planningDir(cwd = process.cwd()) {
  return path.join(cwd, '.planning');
}

function phasesDir(cwd = process.cwd()) {
  return path.join(planningDir(cwd), 'phases');
}

function planningPaths(cwd = process.cwd()) {
  const root = planningDir(cwd);
  return {
    root,
    spec: path.join(root, 'SPEC.md'),
    requirements: path.join(root, 'REQUIREMENTS.md'),
    roadmap: path.join(root, 'ROADMAP.md'),
    state: path.join(root, 'STATE.md'),
    config: path.join(root, 'config.json'),
    research: path.join(root, 'research'),
    codebase: path.join(root, 'CODEBASE.md'),
    phases: path.join(root, 'phases'),
  };
}

// ---------- Slug generation ----------

function generateSlug(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')              // strip quotes
    .replace(/[^a-z0-9\s-]/g, '')      // strip punctuation
    .replace(/\s+/g, '-')              // spaces → hyphens
    .replace(/-+/g, '-')               // collapse consecutive hyphens
    .replace(/^-|-$/g, '')             // trim leading/trailing hyphens
    .slice(0, 50);                     // cap length
}

// Pad phase number to 2 digits: 1 → "01", 12 → "12"
function padPhase(num) {
  return String(num).padStart(2, '0');
}

// ---------- Timestamps ----------

function timestamp(format = 'iso') {
  const now = new Date();
  if (format === 'date') return now.toISOString().slice(0, 10);      // 2026-04-10
  if (format === 'filename') return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return now.toISOString();                                           // full ISO
}

// ---------- File helpers ----------

function fileExists(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

function dirExists(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

// Atomic write: write to .tmp, then rename. Prevents corruption if interrupted.
function writeFile(p, content) {
  const dir = path.dirname(p);
  if (!dirExists(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = p + '.tmp';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, p);
}

function ensureDir(p) {
  if (!dirExists(p)) fs.mkdirSync(p, { recursive: true });
}

// ---------- Output helpers ----------

function outputJson(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

function errorJson(msg, details = {}) {
  process.stderr.write(JSON.stringify({ error: msg, ...details }, null, 2) + '\n');
  process.exit(1);
}

module.exports = {
  planningDir,
  phasesDir,
  planningPaths,
  generateSlug,
  padPhase,
  timestamp,
  fileExists,
  dirExists,
  readFile,
  writeFile,
  ensureDir,
  outputJson,
  errorJson,
};
