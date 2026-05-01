# Bug: gsd-tools.js silently fails to find builds when cwd is below the planning directory

**Filed:** 2026-04-30
**Reporter:** Tim Gailey (via Claude Opus 4.7 session)
**Severity:** High — causes STATE.md and progress tracking to silently no-op throughout multi-phase builds
**Affects:** `~/.claude/gsd/gsd-tools.js`, all subcommands that read or write build state
**Status:** Fixed 2026-04-30 — Fix 1 + Fix 2 landed (upward walk + loud failure + per-write stderr breadcrumb). Regression test at `~/.claude/gsd/tests/cwd-resolution.test.js`.

## Summary

`gsd-tools.js` resolves the `.planning/builds/` directory relative to the process cwd. When a project keeps planning artifacts *outside* the build repo (a documented pattern — see "planning artifacts outside the skill repo" convention in many CLAUDE.md files), running gsd-tools from inside the build repo silently returns empty results instead of either (a) walking up to find the planning dir, or (b) failing loudly so the caller knows progress isn't being tracked.

## Symptoms

- `gsd-tools builds list` returns `{"builds": [], "count": 0}` despite a valid build existing in a parent directory.
- `gsd-tools state update-progress …` and similar write commands appear to succeed but write to a different STATE.md (or none at all).
- STATE.md sits at its post-init defaults across an entire build because every progress update fired during execute/verify phases hit nothing.
- No warning, no error, no log line — the operator only discovers the gap when manually reading STATE.md long after the build is done.

## Concrete reproduction

Layout:

```
projects/design-shaped/
├── .planning/
│   └── builds/
│       └── portfolio-rx/
│           ├── STATE.md
│           ├── SPEC.md
│           └── ...
└── portfolio-rx/                  # the skill repo (its own git repo)
    ├── .git/
    ├── SKILL.md
    └── ...
```

Repro:

```bash
cd projects/design-shaped/portfolio-rx
node ~/.claude/gsd/gsd-tools.js builds list
# → {"builds": [], "count": 0}
node ~/.claude/gsd/gsd-tools.js --build portfolio-rx state update-progress 7 execute completed
# → silently no-ops; STATE.md unchanged
```

Working invocation (workaround):

```bash
cd projects/design-shaped
node ~/.claude/gsd/gsd-tools.js builds list
# → returns the portfolio-rx build correctly
```

## Root cause

The CLI's path resolution looks for `./.planning/builds/<slug>/` (or similar) relative to `process.cwd()`. There is no upward walk to discover a planning directory in an ancestor, and no error path when zero builds are found — the empty array is treated as a successful "no builds" response.

This collides with the recommended pattern of keeping planning artifacts outside the build repo so the public repo stays clean. The pattern is correct (it prevents .planning bleed into shipped artifacts); the CLI just doesn't know about it.

## Real-world impact (this session)

Portfolio Rx ran 13 phases (P0–P12) across 3 milestones. STATE.md showed `not started` and `(populated during interview)` placeholders the entire time because every `state update-progress` call was issued from the skill repo cwd. The reporter noticed only after M3 shipped to a private GitHub remote. Reconstruction required reading git log, every per-phase verification doc, and the M2/M3 SPECs to rebuild STATE.md by hand.

If a build had been resumed by a fresh agent mid-execution, that agent would have used STATE.md as ground truth and concluded the build was at P0 — re-running completed work or skipping context the operator had already provided.

## Proposed fixes

Pick one. They're independent.

### Fix 1 — Walk upward for `.planning/`

When the cwd has no `.planning/` directory, walk up the path until one is found or the filesystem root is reached. Stop at the first match.

- **Pros:** Transparent to callers. Matches user mental model ("I'm in my project, find my planning artifacts").
- **Cons:** Could match an unrelated `.planning/` if directory hierarchies are unusual. Mitigate by validating the discovered path actually contains a `builds/` subdir with valid `STATE.md` files.

### Fix 2 — Fail loudly when zero builds found

If `builds list` (or any command that takes `--build <slug>`) returns no matches, print a stderr warning naming the resolved planning directory and exit non-zero unless the operator explicitly passed `--quiet` or similar.

- **Pros:** Smallest change. Surfaces the bug immediately the next time it happens.
- **Cons:** Doesn't fix the underlying lookup; just makes the failure visible.

### Fix 3 — Honor an env var or config setting

Support `GSD_PLANNING_DIR=/absolute/path/to/.planning` so callers can pin the planning root regardless of cwd. Document it in the gsd CLAUDE.md / SKILL.md so the recommended setup for projects with externalized `.planning/` is to set this env var in their shell rc.

- **Pros:** Most flexible; lets users opt into custom layouts.
- **Cons:** Adds another config surface. Discoverability problem unless the docs flag it prominently.

## Recommended combination

Implement **Fix 1 + Fix 2** together:

1. Walk up looking for `.planning/builds/`. If found, use it.
2. If not found (after walking to filesystem root), print a stderr warning naming what was searched and exit non-zero.
3. Add a one-line warning when the discovered planning dir is in an *ancestor* of cwd, just so the operator notices the cross-directory resolution happened (avoids surprise when they were inside a sibling repo and didn't realize gsd-tools was reaching outward).

Skip Fix 3 unless real demand emerges — env var adds surface area without solving the immediate problem.

## Acceptance criteria

- [ ] `gsd-tools builds list` invoked from any descendant of a directory containing `.planning/builds/<slug>/` returns those builds.
- [ ] `gsd-tools builds list` invoked from a directory with no `.planning/` ancestor returns non-zero with a stderr message naming the searched paths.
- [ ] `gsd-tools state update-progress` writes to the discovered STATE.md and prints the resolved path on success (one-line stderr at minimum).
- [ ] Repeated cwd patterns (running from cwd that *is* the planning root, or from a deep descendant) all resolve identically.
- [ ] No regression for cwd that already contains `.planning/builds/<slug>/` — that case still works.
- [ ] Add a regression test: a fixture project with `.planning/builds/<slug>/` two levels up from cwd, plus an invocation from cwd, asserting the build is found.

## Files likely touched

- `~/.claude/gsd/gsd-tools.js` — path resolution helper(s) at the top of the CLI
- `~/.claude/skills/gsd/SKILL.md` — document the upward-walk behavior so callers know it happens
- `~/.claude/skills/gsd/references/context-budget.md` or similar — note the env-var escape hatch if Fix 3 lands

## Context for the fixing agent

- The skill CLI is pure stdlib Node, zero dependencies. Keep it that way.
- The CLI already has a `--build <slug>` flag — preserve its semantics. The bug is in *finding* the planning root, not in selecting which build inside it.
- This skill was hand-recovered earlier today (see `01-log/2026-04-30.md`); be careful not to regress its existing behavior. Read `SKILL.md` and the `references/` directory before changing the CLI.
- If a regression test framework isn't present yet, scaffolding `tests/` with a single Node `--test` runner case is the smallest path.

## Out of scope

- Migrating existing builds with stale STATE.md to current state. (Manual reconstruction, like the one done for portfolio-rx today, stays operator-driven.)
- Changing the `.planning/builds/<slug>/` directory layout itself. The bug is purely in CLI lookup, not in the artifact convention.
