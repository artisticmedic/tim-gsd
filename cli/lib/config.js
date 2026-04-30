// config.js — .planning/config.json CRUD
//
// Supports dot-notation for nested keys: workflow.research, execution.parallel

const { planningPaths, readFile, writeFile, ensureDir, fileExists } = require('./util');

const DEFAULTS = {
  granularity: 'standard',        // coarse | standard | fine
  research: true,
  plan_check: true,
  verification: true,
  execution: 'parallel',          // parallel | sequential
  commit_planning_docs: false,
  context_window_tokens: 200000,
  spike: false,                   // run Step 4.5 spike phase between Research and Roadmap
};

function load(cwd, build = null) {
  const configPath = planningPaths(cwd, build).config;
  const content = readFile(configPath);
  if (content === null) return { exists: false, config: { ...DEFAULTS } };

  try {
    const config = JSON.parse(content);
    return { exists: true, config: { ...DEFAULTS, ...config } };
  } catch (e) {
    return { exists: false, error: `Invalid JSON in config.json: ${e.message}` };
  }
}

function save(cwd, config, build = null) {
  const paths = planningPaths(cwd, build);
  ensureDir(paths.root);
  writeFile(paths.config, JSON.stringify(config, null, 2) + '\n');
  return { success: true, path: paths.config };
}

function init(cwd, overrides = {}, build = null) {
  const paths = planningPaths(cwd, build);
  if (fileExists(paths.config)) {
    return { success: false, error: 'config.json already exists' };
  }
  const config = { ...DEFAULTS, ...overrides };
  return save(cwd, config, build);
}

// Get a value by dot-notation key
function get(cwd, key, build = null) {
  const { config } = load(cwd, build);
  if (!key) return config;

  const parts = key.split('.');
  let value = config;
  for (const part of parts) {
    if (value === null || value === undefined) return null;
    value = value[part];
  }
  return value;
}

// Set a value by dot-notation key
function set(cwd, key, value, build = null) {
  const { exists, config, error } = load(cwd, build);
  if (error) return { success: false, error };

  // Parse value: try JSON first (handles booleans, numbers, arrays), fall back to string
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    parsed = value;
  }

  const parts = key.split('.');
  let target = config;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof target[parts[i]] !== 'object' || target[parts[i]] === null) {
      target[parts[i]] = {};
    }
    target = target[parts[i]];
  }
  target[parts[parts.length - 1]] = parsed;

  return save(cwd, config, build);
}

module.exports = {
  DEFAULTS,
  load,
  save,
  init,
  get,
  set,
};
