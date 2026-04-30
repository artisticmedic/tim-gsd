# gsd — Get Stuff Done

Hi 👋 — this is the structured-build skill I use when I want Claude Code to actually finish a project instead of vibing through it. It's a `/gsd` slash command for [Claude Code](https://claude.com/claude-code) that walks you from a fuzzy idea to a shipped feature, with persistent artifacts so a `/clear` doesn't cost you the project.

This is a **spiritual fork** of [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done). Same idea — interview → spec → roadmap → per-phase plan + execute + verify, with everything written to `.planning/` so it survives across sessions. Different opinion on how to ship it.

You're welcome to clone this, fork it, or just lift the parts that look useful.

## Why a fork?

The upstream project is great. It's also grown to **85 skills + 33 agents + 6 hooks** that install globally and load their descriptions on every Claude Code turn — about 12K tokens of system-prompt overhead before any conversation starts. For someone using `/gsd` once a week instead of every day, that's a lot of always-on cost.

This version is intentionally smaller:

- **One skill** (`/gsd`) instead of 85.
- **One CLI helper** (`~/.claude/gsd/gsd-tools.js`, ~370 lines, zero dependencies) instead of an SDK.
- **Zero hooks.** Nothing fires on every tool call.
- **Pure Node stdlib + pure markdown.** No `npm install`, no daemons, no MCP servers.

If you want the full upstream experience — 30+ specialist agents, automatic update checks, plan-bounce review loops, knowledge graphs, the works — go install [the real gsd](https://github.com/gsd-build/get-shit-done). It's actively maintained and a much bigger surface. This repo is for people who want a smaller, opinionated version they can read in one sitting.

## What it does

You type:

```
/gsd let's build a CLI that lists my Linear issues
```

And `/gsd` walks through:

1. **Interview** — open-ended questioning until WHAT / WHY / WHO / DONE are locked.
2. **Spec** — writes `.planning/builds/<slug>/SPEC.md`.
3. **Requirements** — turns the spec into traceable REQ-IDs by category.
4. **Research** — spawns 4 parallel agents (stack, features, architecture, pitfalls).
5. **Spike** *(optional)* — 2-3 parallel micro-experiments so you can compare directions before locking the roadmap.
6. **Roadmap** — dependency-ordered phases with 100% requirement coverage.
7. **Per-phase loop** — discuss gray areas → plan → execute → verify.
8. **Verify** — checks that artifacts exist, are wired, and work. Auto-retries one round of fix agents if anything fails.

Everything is written to `.planning/` so you can `/clear` between phases and resume without losing context.

## Modes

The first verb in your prompt decides where `/gsd` stops:

- **"take a look / spec / scope"** → stop after SPEC. No roadmap, no execution.
- **"draft / sketch / mock"** → stop after roadmap. No execution.
- **"apply / build / ship"** → full chain. (Default if no verb.)
- **"plan"** → run plan-phase for Phase 1, then stop.

There are also two flags:

- `/gsd --auto <idea>` — fully autonomous. Uses recommended defaults, picks recommended options at every choice point.
- `/gsd --chain <idea>` — interactive discuss, then auto plan + execute.

If you paste a multi-line block (numbered lists, headings, "Implement the following plan:"), `/gsd` notices and offers to skip the interview and use your text as SPEC directly.

## Install

```bash
git clone https://github.com/artisticmedic/tim-gsd.git ~/projects/gsd
cd ~/projects/gsd
./install.sh
```

The default install mode is **symlink** — changes in this repo reflect immediately in Claude Code. For a standalone copy use `./install.sh --copy`. To remove: `./install.sh --uninstall`.

After install, restart Claude Code (or just open a new session). `/gsd` and `/verify` should both appear in your skill list.

> ⚠️ If you also have the upstream `gsd-build/get-shit-done` installed globally, **don't park files matching `gsd-*` in `~/.claude/skills/`**. Upstream's uninstaller globs `~/.claude/skills/gsd-*` and `rm -rf`'s the lot — including any custom backup folder you happened to name `gsd-legacy`. (Ask me how I know.) This fork installs to `~/.claude/skills/gsd/` and `~/.claude/skills/verify/` only.

## What's in the repo

```
gsd/
├── cli/                    Node CLI helper (zero deps, pure stdlib)
│   ├── gsd-tools.js        Entry + command router
│   └── lib/                state, config, phase, frontmatter, util
├── skills/
│   ├── gsd/                The /gsd skill
│   │   ├── SKILL.md        Pipeline definition
│   │   ├── references/     Interview, discuss-phase, plan-checker, spike-phase, etc.
│   │   └── templates/      SPEC.md skeleton
│   └── verify/             /verify — standalone goal-backward verification
├── install.sh              Install to ~/.claude/ (symlink, copy, or uninstall)
└── README.md
```

## Useful CLI calls

You'll mostly never run these directly — the skill calls them for you. But if you want to poke at state outside a Claude session:

```bash
node ~/.claude/gsd/gsd-tools.js help               # full command list

# Compound queries (return full state in one JSON blob)
node ~/.claude/gsd/gsd-tools.js init overview
node ~/.claude/gsd/gsd-tools.js init phase 2

# Resume detection
node ~/.claude/gsd/gsd-tools.js builds list

# Cross-phase deferred ideas (post-phase carousel feeds off this)
node ~/.claude/gsd/gsd-tools.js phase deferred
```

## Design choices

A few opinions baked in:

- **The skill is the spec.** Every behavioral rule lives in `SKILL.md` or a referenced doc, not in CLI code. The CLI handles structured data (state, config, phase directories); content stays in markdown.
- **Atomic writes.** All CLI writes go through `.tmp` + rename so interrupted writes don't corrupt state.
- **Orchestrator stays lean.** Heavy work (planning, execution, verification) is delegated to spawned agents with fresh context windows. The main `/gsd` session reads frontmatter and summaries, not full agent outputs.
- **Full traceability.** SPEC → REQUIREMENTS → ROADMAP → CONTEXT → PLAN → SUMMARY → VERIFICATION, with REQ-IDs threaded through every artifact.
- **Confidence-scored gray areas.** Each ambiguity gets a 1-5 score before discussion and re-scored after, so `--auto` mode can skip already-locked decisions.

## Credit

The architectural shape (interview → spec → roadmap → phased plan + execute → verify) comes directly from [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done) by TÂCHES. Their CLI design and artifact-formats thinking shaped this fork's approach. If this repo is useful to you, theirs probably will be too — go check it out.

The 4-wave improvement set in this version (mode signals, spike phase, ambiguity scoring, canonical refs as frontmatter, deferred-ideas carousel, verification gap-closure loop, etc.) was developed independently and is documented in commit history.

## License

MIT. Take anything you like.
