#!/usr/bin/env node
// gsd-tools.js — CLI for the /gsd skill
//
// Pure Node, zero dependencies. Auditable in one pass.
// Each invocation runs, outputs JSON, exits. No daemons, no servers.
//
// Usage: node gsd-tools.js <command> [subcommand] [args...]
//
// Run with no args to see the full command list.

const state = require('./lib/state');
const config = require('./lib/config');
const phase = require('./lib/phase');
const frontmatter = require('./lib/frontmatter');
const util = require('./lib/util');

const { outputJson, errorJson } = util;
const CWD = process.cwd();

// ---------- Command router ----------

const args = process.argv.slice(2);
if (args.length === 0) {
  printHelp();
  process.exit(0);
}

const [cmd, ...rest] = args;

try {
  switch (cmd) {
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    case 'state':
      handleState(rest);
      break;
    case 'config':
      handleConfig(rest);
      break;
    case 'phase':
      handlePhase(rest);
      break;
    case 'frontmatter':
      handleFrontmatter(rest);
      break;
    case 'init':
      handleInit(rest);
      break;
    case 'slug':
      handleSlug(rest);
      break;
    case 'timestamp':
      handleTimestamp(rest);
      break;
    default:
      errorJson(`Unknown command: ${cmd}. Run 'gsd-tools help' for usage.`);
  }
} catch (e) {
  errorJson(`Unhandled error: ${e.message}`, { stack: e.stack });
}

// ---------- Command handlers ----------

function handleState(args) {
  const [sub, ...rest] = args;
  switch (sub) {
    case 'load':
    case 'get':
      outputJson(state.load(CWD));
      break;
    case 'init': {
      const projectName = rest.join(' ');
      if (!projectName) errorJson('state init requires a project name');
      outputJson(state.init(CWD, projectName));
      break;
    }
    case 'set-field': {
      const [field, ...valueParts] = rest;
      if (!field || valueParts.length === 0) errorJson('state set-field requires field name and value');
      outputJson(state.setField(CWD, field, valueParts.join(' ')));
      break;
    }
    case 'update-progress': {
      const [phaseNum, step, status] = rest;
      if (!phaseNum || !step || !status) errorJson('state update-progress requires: <phase> <step> <status>');
      outputJson(state.updatePhaseProgress(CWD, phaseNum, step, status));
      break;
    }
    case 'add-decision': {
      const [decisionId, ...textParts] = rest;
      if (!decisionId || textParts.length === 0) errorJson('state add-decision requires: <decision-id> <text>');
      outputJson(state.addDecision(CWD, decisionId, textParts.join(' ')));
      break;
    }
    default:
      errorJson(`Unknown state subcommand: ${sub}. Use: load | init | set-field | update-progress | add-decision`);
  }
}

function handleConfig(args) {
  const [sub, ...rest] = args;
  switch (sub) {
    case 'load':
    case 'get':
      if (rest[0]) {
        outputJson({ key: rest[0], value: config.get(CWD, rest[0]) });
      } else {
        outputJson(config.load(CWD));
      }
      break;
    case 'init':
      outputJson(config.init(CWD));
      break;
    case 'set': {
      const [key, ...valueParts] = rest;
      if (!key || valueParts.length === 0) errorJson('config set requires: <key> <value>');
      outputJson(config.set(CWD, key, valueParts.join(' ')));
      break;
    }
    default:
      errorJson(`Unknown config subcommand: ${sub}. Use: get [key] | set <key> <value> | init`);
  }
}

function handlePhase(args) {
  const [sub, ...rest] = args;
  switch (sub) {
    case 'list':
      outputJson({ phases: phase.list(CWD) });
      break;
    case 'find': {
      const [num] = rest;
      if (!num) errorJson('phase find requires a phase number');
      const dir = phase.findDir(CWD, num);
      outputJson({ found: !!dir, phase: num, dir });
      break;
    }
    case 'status': {
      const [num] = rest;
      if (!num) errorJson('phase status requires a phase number');
      outputJson(phase.status(CWD, num));
      break;
    }
    case 'create': {
      const [num, ...nameParts] = rest;
      if (!num || nameParts.length === 0) errorJson('phase create requires: <number> <name>');
      outputJson(phase.createDir(CWD, num, nameParts.join(' ')));
      break;
    }
    case 'roadmap':
      outputJson(phase.parseRoadmap(CWD));
      break;
    default:
      errorJson(`Unknown phase subcommand: ${sub}. Use: list | find | status | create | roadmap`);
  }
}

function handleFrontmatter(args) {
  const [sub, filePath, ...rest] = args;
  if (!filePath) errorJson('frontmatter requires a file path');

  switch (sub) {
    case 'get':
      outputJson(frontmatter.getFromFile(filePath) || {});
      break;
    case 'set': {
      const [key, ...valueParts] = rest;
      if (!key || valueParts.length === 0) errorJson('frontmatter set requires: <file> <key> <value>');
      const raw = valueParts.join(' ');
      let value;
      try { value = JSON.parse(raw); } catch { value = raw; }
      const ok = frontmatter.setInFile(filePath, key, value);
      outputJson({ success: ok, file: filePath, key, value });
      break;
    }
    default:
      errorJson(`Unknown frontmatter subcommand: ${sub}. Use: get <file> | set <file> <key> <value>`);
  }
}

// Compound init query — answers "what's the state of the project?" in one call.
// This is the highest-value command. The /gsd skill calls this at the start
// of each phase to get everything it needs without multiple file reads.
function handleInit(args) {
  const [mode, phaseArg] = args;

  const statePaths = util.planningPaths(CWD);
  const cfg = config.load(CWD);
  const stateInfo = state.load(CWD);
  const roadmap = phase.parseRoadmap(CWD);

  const result = {
    project_root: CWD,
    mode: mode || 'overview',
    timestamp: util.timestamp(),
    planning_exists: util.dirExists(statePaths.root),
    artifacts: {
      spec: util.fileExists(statePaths.spec),
      requirements: util.fileExists(statePaths.requirements),
      roadmap: util.fileExists(statePaths.roadmap),
      state: util.fileExists(statePaths.state),
      config: util.fileExists(statePaths.config),
      codebase_map: util.fileExists(statePaths.codebase),
      research_dir: util.dirExists(statePaths.research),
    },
    config: cfg.config,
    state: stateInfo.exists ? {
      build: stateInfo.build,
      current_phase: stateInfo.current_phase,
      last_updated: stateInfo.last_updated,
    } : null,
    roadmap_phases: roadmap.phases.length,
  };

  // Phase-specific init: include phase details
  if (mode === 'phase' && phaseArg) {
    result.phase = phase.status(CWD, phaseArg);

    // Get prior phases (completed phases before this one)
    const phaseNum = parseInt(phaseArg, 10);
    result.prior_phases = phase.list(CWD)
      .filter(p => p.number < phaseNum)
      .map(p => {
        const s = phase.status(CWD, p.number);
        return {
          number: p.number,
          name: p.slug,
          has_context: s.has_context,
          has_verification: s.has_verification,
        };
      });

    // Get requirements for this phase from roadmap
    const roadmapPhase = roadmap.phases.find(p => p.number === phaseNum);
    if (roadmapPhase) {
      result.phase_info = roadmapPhase;
    }
  }

  outputJson(result);
}

function handleSlug(args) {
  const text = args.join(' ');
  if (!text) errorJson('slug requires text');
  outputJson({ text, slug: util.generateSlug(text) });
}

function handleTimestamp(args) {
  const [format] = args;
  outputJson({ timestamp: util.timestamp(format || 'iso'), format: format || 'iso' });
}

// ---------- Help ----------

function printHelp() {
  const help = `
gsd-tools — CLI helper for the /gsd skill

USAGE
  node gsd-tools.js <command> [subcommand] [args...]

STATE OPERATIONS
  state load                              Load STATE.md as structured JSON
  state init <project-name>               Create a new STATE.md
  state set-field <field> <value>         Update a field in STATE.md
  state update-progress <phase> <step> <status>   Update progress table row
                                          step: discuss | plan | execute | verify
                                          status: done | in progress | passed | failed
  state add-decision <id> <text>          Append a decision to the log

CONFIG OPERATIONS
  config load                             Load full config.json
  config get <key>                        Get value by dot-notation key
  config set <key> <value>                Set value (parses JSON if possible)
  config init                             Create default config.json

PHASE OPERATIONS
  phase list                              List all phase directories
  phase find <number>                     Find phase directory by number
  phase status <number>                   Check artifacts in a phase (CONTEXT, PLANs, SUMMARYs)
  phase create <number> <name>            Create a phase directory (NN-slug)
  phase roadmap                           Parse ROADMAP.md into structured phases

FRONTMATTER OPERATIONS
  frontmatter get <file>                  Extract YAML frontmatter as JSON
  frontmatter set <file> <key> <value>    Update a frontmatter field

INIT (compound query)
  init overview                           Full project state snapshot
  init phase <number>                     Phase-specific state + prior phases + requirements

UTILITIES
  slug <text>                             Convert text to URL-safe slug
  timestamp [iso|date|filename]           Get current timestamp

OUTPUT
  All commands output JSON to stdout on success.
  Errors go to stderr with exit code 1.
  Expected to be called from the /gsd skill, but safe to run manually.

EXAMPLES
  node gsd-tools.js init overview
  node gsd-tools.js init phase 2
  node gsd-tools.js state init "My Project"
  node gsd-tools.js config set granularity coarse
  node gsd-tools.js phase create 1 "Auth Foundation"
  node gsd-tools.js slug "Content Management System"
`;
  process.stdout.write(help);
}
