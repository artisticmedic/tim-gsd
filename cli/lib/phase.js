// phase.js — Phase directory and artifact operations
//
// Phase directories live at .planning/phases/NN-slug/
// Each phase has: CONTEXT.md, NN-PP-PLAN.md files, NN-PP-SUMMARY.md files, VERIFICATION.md

const fs = require('fs');
const path = require('path');
const { planningPaths, phasesDir, padPhase, generateSlug, readFile, ensureDir, dirExists, fileExists } = require('./util');

// Find phase directory by number. Returns null if not found.
function findDir(cwd, phaseNum, build = null) {
  const pDir = phasesDir(cwd, build);
  if (!dirExists(pDir)) return null;

  const padded = padPhase(phaseNum);
  try {
    const entries = fs.readdirSync(pDir);
    const match = entries.find(e => e.startsWith(padded + '-'));
    return match ? path.join(pDir, match) : null;
  } catch {
    return null;
  }
}

// Create a phase directory with given number and name
function createDir(cwd, phaseNum, phaseName, build = null) {
  const padded = padPhase(phaseNum);
  const slug = generateSlug(phaseName);
  const dir = path.join(phasesDir(cwd, build), `${padded}-${slug}`);

  if (dirExists(dir)) {
    return { success: false, error: 'Phase directory already exists', path: dir };
  }

  ensureDir(dir);
  return { success: true, path: dir, padded, slug };
}

// Inspect a phase directory and return status of its artifacts
function status(cwd, phaseNum, build = null) {
  const dir = findDir(cwd, phaseNum, build);
  if (!dir) {
    return { found: false, phase: phaseNum };
  }

  const padded = padPhase(phaseNum);
  const name = path.basename(dir).slice(3); // strip "NN-"

  // List files in the phase directory
  let files = [];
  try { files = fs.readdirSync(dir); } catch {}

  const contextFile = files.find(f => f === `${padded}-CONTEXT.md`);
  const discussLog = files.find(f => f === `${padded}-DISCUSSION-LOG.md`);
  const checkpoint = files.find(f => f === `${padded}-DISCUSS-CHECKPOINT.json`);
  const verification = files.find(f => f === `${padded}-VERIFICATION.md`);

  const planFiles = files.filter(f => /^\d{2}-\d{2}-PLAN\.md$/.test(f)).sort();
  const summaryFiles = files.filter(f => /^\d{2}-\d{2}-SUMMARY\.md$/.test(f)).sort();

  return {
    found: true,
    phase: phaseNum,
    padded,
    name,
    dir: path.relative(cwd, dir),
    has_context: !!contextFile,
    has_discussion_log: !!discussLog,
    has_checkpoint: !!checkpoint,
    has_verification: !!verification,
    plan_count: planFiles.length,
    summary_count: summaryFiles.length,
    plans: planFiles,
    summaries: summaryFiles,
    files,
  };
}

// List all phases by scanning the phases directory
function list(cwd, build = null) {
  const pDir = phasesDir(cwd, build);
  if (!dirExists(pDir)) return [];

  let entries = [];
  try { entries = fs.readdirSync(pDir); } catch { return []; }

  const phases = [];
  for (const entry of entries) {
    const match = entry.match(/^(\d{2})-(.+)$/);
    if (!match) continue;
    const [, paddedNum, slug] = match;
    const num = parseInt(paddedNum, 10);
    phases.push({
      number: num,
      padded: paddedNum,
      slug,
      dir: path.relative(cwd, path.join(pDir, entry)),
    });
  }

  return phases.sort((a, b) => a.number - b.number);
}

// Parse ROADMAP.md to extract phase info
function parseRoadmap(cwd, build = null) {
  const roadmapPath = planningPaths(cwd, build).roadmap;
  const content = readFile(roadmapPath);
  if (content === null) return { exists: false, phases: [] };

  const phases = [];

  // Parse the phase table: | # | Phase | Goal | Requirements | Criteria |
  const tableMatch = content.match(/\|\s*#\s*\|\s*Phase\s*\|[\s\S]*?(?=\n\n|\n##|$)/);
  if (tableMatch) {
    const rows = tableMatch[0].split('\n').filter(l => l.match(/^\|\s*\d+\s*\|/));
    for (const row of rows) {
      const cols = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length >= 4) {
        phases.push({
          number: parseInt(cols[0], 10),
          name: cols[1],
          goal: cols[2],
          requirements: cols[3].split(',').map(s => s.trim()),
        });
      }
    }
  }

  return { exists: true, phases, content };
}

// Scan all phase CONTEXT.md files for deferred ideas. Returns flat list with
// per-idea phase context so the orchestrator can present a milestone-boundary
// carousel without re-reading every file in main context.
function gatherDeferredIdeas(cwd, build = null) {
  const phases = list(cwd, build);
  const ideas = [];

  for (const p of phases) {
    const contextPath = path.join(cwd, p.dir, `${p.padded}-CONTEXT.md`);
    const content = readFile(contextPath);
    if (content === null) continue;

    // Extract the "## Deferred Ideas" section body until the next H2 or EOF.
    const sectionMatch = content.match(/##\s+Deferred Ideas\s*\n([\s\S]*?)(?=\n##\s|\n*$)/);
    if (!sectionMatch) continue;

    const body = sectionMatch[1].trim();
    if (!body) continue;

    // Split on bullet lines. Tolerant of "- ", "* ", or numbered.
    const bullets = body.split('\n')
      .map(l => l.replace(/^\s*[-*\d.]+\s+/, '').trim())
      .filter(l => l.length > 0);

    for (const idea of bullets) {
      ideas.push({
        phase: p.number,
        phase_slug: p.slug,
        idea,
      });
    }
  }

  return { count: ideas.length, ideas };
}

module.exports = {
  findDir,
  createDir,
  status,
  list,
  parseRoadmap,
  gatherDeferredIdeas,
};
