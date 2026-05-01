// util.js — Shared utilities for gsd-tools
// Pure functions, no side effects except file I/O where noted.

const fs = require('fs');
const path = require('path');

// ---------- Paths ----------

// Walk upward from startDir looking for a directory that contains a usable
// `.planning/` (either `.planning/builds/` or a legacy `.planning/STATE.md`).
// Returns the containing directory (the one with `.planning/` as a child),
// or null if nothing is found before the filesystem root.
//
// This makes the CLI cwd-tolerant: callers can run from inside a build repo
// whose `.planning/` lives in an ancestor (a documented pattern — keeps
// planning artifacts out of the public repo).
function findPlanningRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    const planning = path.join(dir, '.planning');
    if (dirExists(planning)) {
      const builds = path.join(planning, 'builds');
      const legacyState = path.join(planning, 'STATE.md');
      if (dirExists(builds) || fileExists(legacyState)) {
        return dir;
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function buildsDir(cwd = process.cwd()) {
  return path.join(cwd, '.planning', 'builds');
}

function planningDir(cwd = process.cwd(), buildName = null) {
  if (buildName) {
    return path.join(buildsDir(cwd), generateSlug(buildName));
  }
  // Legacy flat layout fallback
  return path.join(cwd, '.planning');
}

function phasesDir(cwd = process.cwd(), buildName = null) {
  return path.join(planningDir(cwd, buildName), 'phases');
}

function planningPaths(cwd = process.cwd(), buildName = null) {
  const root = planningDir(cwd, buildName);
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

// List all named builds in .planning/builds/
function listBuilds(cwd = process.cwd()) {
  const bDir = buildsDir(cwd);
  if (!dirExists(bDir)) return [];
  try {
    return fs.readdirSync(bDir)
      .filter(e => {
        try { return fs.statSync(path.join(bDir, e)).isDirectory(); } catch { return false; }
      })
      .map(slug => {
        const statePath = path.join(bDir, slug, 'STATE.md');
        const content = readFile(statePath);
        let name = slug;
        if (content) {
          const match = content.match(/\*\*Build:\*\*\s*(.+)/);
          if (match) name = match[1].trim();
        }
        return { slug, name, dir: path.join(bDir, slug) };
      });
  } catch { return []; }
}

// Resolve which build to use. Returns the build slug.
// If buildName given → use it. If only one build exists → auto-select. If multiple → error with list.
function resolveBuild(cwd, buildName) {
  if (buildName) return generateSlug(buildName);

  // Check for legacy flat layout
  const legacyState = path.join(cwd, '.planning', 'STATE.md');
  const hasLegacy = fileExists(legacyState) && !dirExists(buildsDir(cwd));
  if (hasLegacy) return null; // Signal legacy mode

  const builds = listBuilds(cwd);
  if (builds.length === 0) return null;
  if (builds.length === 1) return builds[0].slug;

  // Multiple builds — can't auto-select
  const list = builds.map(b => `  - ${b.slug} ("${b.name}")`).join('\n');
  throw new Error(`Multiple builds found. Use --build <name> to select:\n${list}`);
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
  buildsDir,
  planningDir,
  phasesDir,
  planningPaths,
  listBuilds,
  resolveBuild,
  findPlanningRoot,
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
