# gsd — Get Stuff Done

A personal structured build pipeline for Claude Code. Deep interview → requirements with traceability → roadmap → per-phase discuss/plan/execute/verify, with persistent artifacts that survive across sessions.

Inspired by the architectural patterns from [gsd-build/get-shit-done](https://github.com/gsd-build/get-shit-done), rewritten from scratch with zero dependencies and no third-party code.

## What's in here

```
gsd/
├── cli/                    # Node.js CLI helper (zero deps, pure stdlib)
│   ├── gsd-tools.js        # Entry point and command router
│   ├── lib/                # State, config, phase, frontmatter modules
│   └── README.md
├── skills/
│   ├── gsd/                # The /gsd Claude Code skill
│   │   ├── SKILL.md        # Main skill — pipeline definition
│   │   ├── references/     # Interview guide, artifact formats, plan-checker, etc.
│   │   └── templates/      # SPEC.md skeleton
│   └── verify/             # /verify — standalone goal-backward verification
│       ├── SKILL.md
│       └── references/
├── install.sh              # Install to ~/.claude/ (symlink or copy mode)
└── README.md               # This file
```

## Install

```bash
git clone <this repo> ~/projects/gsd
cd ~/projects/gsd
./install.sh
```

Default install mode is **symlink** — changes in this repo reflect immediately in Claude Code. For a standalone copy use `./install.sh --copy`. To remove: `./install.sh --uninstall`.

## Usage

In any project, type `/gsd` followed by a description of what you want to build. The skill will:

1. **Interview** — deep questioning to extract your vision
2. **Requirements** — turns vision into traceable REQ-IDs
3. **Research** — spawns 4 parallel agents (stack/features/architecture/pitfalls)
4. **Roadmap** — dependency-ordered phases with 100% requirement coverage
5. **Per-phase loop** — discuss → plan → execute → verify
6. **Artifacts** — everything persists in `.planning/` so you can `/clear` and resume

Run standalone verification any time with `/verify`.

Flags:
- `/gsd --auto` — fully autonomous pipeline
- `/gsd --chain` — interactive discuss, then auto plan + execute

## Design principles

- **Zero dependencies** — pure Node stdlib, pure markdown skills. No `npm install`, no daemons, no MCP servers.
- **Auditable** — ~1000 lines of CLI code, readable in one pass. Skills are ~1300 lines of markdown.
- **Atomic writes** — CLI uses `.tmp` + rename pattern so interrupted writes don't corrupt state.
- **Orchestrator stays lean** — the skill delegates heavy work (planning, execution, verification) to spawned agents with fresh context windows.
- **Full traceability** — SPEC → REQUIREMENTS → ROADMAP → CONTEXT → PLAN → SUMMARY → VERIFICATION, with REQ-IDs threaded through every step.

## CLI commands

```bash
node ~/.claude/gsd/gsd-tools.js help              # Full command list

# State
node ~/.claude/gsd/gsd-tools.js state init "Project Name"
node ~/.claude/gsd/gsd-tools.js state update-progress 1 discuss done
node ~/.claude/gsd/gsd-tools.js state add-decision D-01 "Use session cookies"

# Config
node ~/.claude/gsd/gsd-tools.js config init
node ~/.claude/gsd/gsd-tools.js config set granularity coarse

# Phases
node ~/.claude/gsd/gsd-tools.js phase create 1 "Auth Foundation"
node ~/.claude/gsd/gsd-tools.js phase status 1

# Compound queries (most useful — one call returns full state)
node ~/.claude/gsd/gsd-tools.js init overview
node ~/.claude/gsd/gsd-tools.js init phase 2
```

## License

Personal use. Not distributed.
