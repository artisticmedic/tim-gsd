// Regression test for the cwd-sensitive builds-lookup bug
// (skills/gsd/bugs/2026-04-30-cwd-sensitive-builds-lookup.md).
//
// Verifies:
//   - `builds list` from a descendant of a .planning/ directory finds the build
//   - `state update-progress` from that descendant writes to the resolved STATE.md
//   - `builds list` with no .planning/ in any ancestor exits non-zero
//
// Pure stdlib. Run with: node --test tests/cwd-resolution.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CLI = path.resolve(__dirname, '..', 'cli', 'gsd-tools.js');

function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-'));
}

function rmTmp(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function runOk(cwd, args) {
  const r = spawnSync('node', [CLI, ...args], { cwd, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`gsd-tools exited ${r.status}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
  }
  return { stdout: r.stdout, stderr: r.stderr };
}

function runFail(cwd, args) {
  const r = spawnSync('node', [CLI, ...args], { cwd, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

test('builds list from a descendant directory finds the build', () => {
  const root = mkTmp();
  try {
    runOk(root, ['state', 'init', 'Test Project']);

    const deep = path.join(root, 'sibling-repo', 'nested', 'deeper');
    fs.mkdirSync(deep, { recursive: true });

    const { stdout, stderr } = runOk(deep, ['builds', 'list']);
    const result = JSON.parse(stdout);

    assert.equal(result.count, 1, 'should find the one build via upward walk');
    assert.equal(result.builds[0].slug, 'test-project');
    assert.match(stderr, /resolved planning root/, 'should announce the resolution on stderr');
  } finally {
    rmTmp(root);
  }
});

test('state update-progress from a descendant writes to the resolved STATE.md', () => {
  const root = mkTmp();
  try {
    runOk(root, ['state', 'init', 'Test Project']);

    const deep = path.join(root, 'app');
    fs.mkdirSync(deep, { recursive: true });

    const statePath = path.join(root, '.planning', 'builds', 'test-project', 'STATE.md');
    const before = fs.readFileSync(statePath, 'utf8');

    runOk(deep, ['--build', 'test-project', 'state', 'update-progress', '7', 'execute', 'completed']);

    const after = fs.readFileSync(statePath, 'utf8');
    assert.notEqual(before, after, 'STATE.md must change');
    assert.match(after, /\|\s*7\s*\|/, 'phase 7 row must be present');
    assert.match(after, /completed/, 'execute=completed must be reflected');
  } finally {
    rmTmp(root);
  }
});

test('builds list with no .planning/ in any ancestor exits non-zero', () => {
  // Use an isolated tmp dir whose ancestors will not contain .planning/.
  // /tmp is fine on macOS/linux; we make a fresh nested dir so cwd has none.
  const root = mkTmp();
  try {
    const deep = path.join(root, 'no-planning-here');
    fs.mkdirSync(deep, { recursive: true });

    const { status, stderr } = runFail(deep, ['builds', 'list']);
    assert.notEqual(status, 0, 'should exit non-zero');
    assert.match(stderr, /No \.planning\//, 'stderr should explain what was searched');
  } finally {
    rmTmp(root);
  }
});

test('writes from the planning root cwd still work (no regression)', () => {
  const root = mkTmp();
  try {
    runOk(root, ['state', 'init', 'Test Project']);
    const r = runOk(root, ['--build', 'test-project', 'state', 'update-progress', '1', 'discuss', 'done']);
    const result = JSON.parse(r.stdout);
    assert.equal(result.success, true);
  } finally {
    rmTmp(root);
  }
});
