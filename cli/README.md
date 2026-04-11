# gsd-tools

CLI helper for the `/gsd` skill. Handles deterministic operations that shouldn't be left to markdown parsing in Claude prompts.

## Design

- **Zero dependencies.** Pure Node.js stdlib (`fs`, `path`). No `npm install` needed.
- **Single file, modular.** `gsd-tools.js` entry point + `lib/` modules.
- **No daemons.** Each invocation runs, outputs JSON, exits. Same as any CLI tool.
- **Auditable.** ~600 lines total, all in one directory.
- **Atomic writes.** Uses `.tmp` + rename pattern to prevent corruption on interrupted writes.

## Usage

```bash
node ~/.claude/gsd/gsd-tools.js <command> [args...]
```

Run with no args to see the full command list.

## Files

```
~/.claude/gsd/
├── gsd-tools.js          # Entry point and command router
├── lib/
│   ├── util.js           # Paths, slugs, timestamps, file I/O
│   ├── frontmatter.js    # Minimal YAML frontmatter parser
│   ├── state.js          # STATE.md read/write
│   ├── config.js         # config.json CRUD
│   └── phase.js          # Phase directory and roadmap operations
└── README.md             # This file
```

## What it handles

- **State**: Reading and updating `.planning/STATE.md` fields and progress tables
- **Config**: CRUD for `.planning/config.json` with dot-notation keys
- **Phases**: Finding, creating, and inspecting phase directories
- **Frontmatter**: Parsing and updating YAML frontmatter in PLAN.md files
- **Init queries**: Single-call "what's the state?" responses for the skill

## What it doesn't handle

- No git operations (skill uses Bash git commands directly)
- No network calls
- No execution of arbitrary code
- No telemetry, no analytics, no phone-home

## Called by

The `/gsd` skill at `~/.claude/skills/gsd/SKILL.md`. The skill invokes commands via Bash:

```bash
INIT=$(node ~/.claude/gsd/gsd-tools.js init phase 2)
```

## Testing manually

```bash
# In any directory with .planning/
node ~/.claude/gsd/gsd-tools.js init overview
node ~/.claude/gsd/gsd-tools.js phase list
node ~/.claude/gsd/gsd-tools.js state load
```
