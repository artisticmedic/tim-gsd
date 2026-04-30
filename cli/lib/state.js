// state.js — STATE.md read/write operations
//
// STATE.md format:
//   # Build State
//
//   ## Current State
//   - **Build:** [name]
//   - **Current Phase:** [N] — [step]
//   - **Last updated:** [timestamp]
//
//   ## Config
//   ...
//
//   ## Progress
//   | Phase | Discuss | Plan | Execute | Verify | Status |
//   ...

const { planningPaths, readFile, writeFile, timestamp, ensureDir, fileExists } = require('./util');

// Read STATE.md and extract structured fields
function load(cwd, build = null) {
  const statePath = planningPaths(cwd, build).state;
  const content = readFile(statePath);
  if (content === null) {
    return { exists: false, path: statePath };
  }

  return {
    exists: true,
    path: statePath,
    build: extractField(content, 'Build'),
    current_phase: extractField(content, 'Current Phase'),
    last_updated: extractField(content, 'Last updated'),
    content,
  };
}

// Extract a bold field: **Field:** value
function extractField(content, fieldName) {
  const escaped = fieldName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const pattern = new RegExp(`\\*\\*${escaped}:\\*\\*\\s*(.+)`, 'i');
  const match = content.match(pattern);
  return match ? match[1].trim() : null;
}

// Update a bold field in STATE.md
function setField(cwd, fieldName, value, build = null) {
  const statePath = planningPaths(cwd, build).state;
  let content = readFile(statePath);
  if (content === null) {
    return { success: false, error: 'STATE.md does not exist — call state init first' };
  }

  const escaped = fieldName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const pattern = new RegExp(`(\\*\\*${escaped}:\\*\\*\\s*).+`, 'i');

  if (!pattern.test(content)) {
    return { success: false, error: `Field "${fieldName}" not found in STATE.md` };
  }

  content = content.replace(pattern, `$1${value}`);
  writeFile(statePath, content);
  return { success: true };
}

// Initialize a new STATE.md with given project name
function init(cwd, projectName, buildSlug = null, force = false) {
  const paths = planningPaths(cwd, buildSlug);
  ensureDir(paths.root);

  if (fileExists(paths.state) && !force) {
    return { success: false, error: `Build "${buildSlug || 'default'}" already exists. Use --force to overwrite.`, path: paths.state, build: buildSlug };
  }

  const now = timestamp();
  const template = `# Build State

## Current State
- **Build:** ${projectName}
- **Current Phase:** — (interview)
- **Last updated:** ${now}

## Config
- Granularity: (not set)
- Research: (not set)
- Plan-check: (not set)
- Verification: (not set)
- Execution: (not set)

## Progress
| Phase | Discuss | Plan | Execute | Verify | Status |
|-------|---------|------|---------|--------|--------|
| — | — | — | — | — | not started |

## Decisions Log
(populated during interview)

## Deferred Ideas
(populated as scope creep is parked)

## Phase History
| Phase | Step | Date | Notes |
|-------|------|------|-------|
| — | init | ${timestamp('date')} | Build initialized |
`;

  writeFile(paths.state, template);
  return { success: true, path: paths.state, build: buildSlug };
}

// Update the Progress table row for a given phase
function updatePhaseProgress(cwd, phaseNum, step, status, build = null) {
  const statePath = planningPaths(cwd, build).state;
  let content = readFile(statePath);
  if (content === null) {
    return { success: false, error: 'STATE.md not found' };
  }

  // Find the progress table, update or insert the row
  const phaseStr = String(phaseNum);
  const rowPattern = new RegExp(`^\\|\\s*${phaseStr}\\s*\\|[^\\n]+$`, 'm');

  if (rowPattern.test(content)) {
    // Update existing row: just replace the step column
    // Columns: Phase | Discuss | Plan | Execute | Verify | Status
    const stepIndex = { discuss: 1, plan: 2, execute: 3, verify: 4 }[step.toLowerCase()];
    if (stepIndex === undefined) {
      return { success: false, error: `Unknown step: ${step}. Use: discuss, plan, execute, verify` };
    }

    content = content.replace(rowPattern, (row) => {
      const cols = row.split('|').map(c => c.trim());
      // cols = ['', phase, discuss, plan, execute, verify, status, '']
      cols[stepIndex + 1] = status;
      // Update overall status based on verify
      if (stepIndex === 4 && status === 'passed') {
        cols[6] = 'complete';
      } else if (cols[6] === 'not started' || cols[6] === '—') {
        cols[6] = 'active';
      }
      return cols.join(' | ').replace(/^\s*\|/, '|').replace(/\|\s*$/, '|');
    });
  } else {
    // Append new row before the closing of the progress table
    const newRow = `| ${phaseStr} | ${step === 'discuss' ? status : '—'} | ${step === 'plan' ? status : '—'} | ${step === 'execute' ? status : '—'} | ${step === 'verify' ? status : '—'} | active |`;
    // Find progress table and append
    content = content.replace(
      /(## Progress\n\|[^\n]+\n\|[^\n]+\n)((?:\|[^\n]+\n)*)/,
      (match, header, rows) => `${header}${rows}${newRow}\n`
    );
  }

  // Update last_updated timestamp
  content = content.replace(
    /(\*\*Last updated:\*\*\s*).+/,
    `$1${timestamp()}`
  );

  writeFile(statePath, content);
  return { success: true };
}

// Append a decision to the Decisions Log
function addDecision(cwd, decisionId, text, build = null) {
  const statePath = planningPaths(cwd, build).state;
  let content = readFile(statePath);
  if (content === null) {
    return { success: false, error: 'STATE.md not found' };
  }

  const line = `- ${decisionId}: ${text}`;
  content = content.replace(
    /(## Decisions Log\n)([^#]*?)(\n## )/,
    (match, header, body, nextHeader) => {
      // Remove placeholder if present, trim whitespace, add new line
      const cleaned = body
        .replace(/^\(populated during interview\)\n?/m, '')
        .replace(/\n+$/, '');
      const newBody = cleaned ? `${cleaned}\n${line}` : line;
      return `${header}${newBody}\n${nextHeader}`;
    }
  );

  writeFile(statePath, content);
  return { success: true };
}

module.exports = {
  load,
  setField,
  init,
  updatePhaseProgress,
  addDecision,
};
