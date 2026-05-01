# gsd-tools

CLI helper for the `gsd` skill. Handles deterministic operations that shouldn't be left to markdown parsing in Claude prompts.

## Design

- **Zero dependencies.** Pure Node.js stdlib (`fs`, `path`). No `npm install` needed.
- **Single file, modular.** `gsd-tools.js` entry point + `lib/` modules.
- **No daemons.** Each invocation runs, outputs JSON, exits. Same as any CLI tool.
- **Auditable.** ~600 lines total, all in one directory.
- **Atomic writes.** Uses `.tmp` + rename pattern to prevent corruption on interrupted writes.

## Usage

When installed as a Claude Code plugin, the wrapper at `bin/gsd-tools` is on `$PATH`:

```bash
gsd-tools <command> [args...]
```

For direct invocation outside the plugin context:

```bash
node cli/gsd-tools.js <command> [args...]
```

Run with no args to see the full command list.

## Files

```
cli/
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

The `gsd` skill at `skills/gsd/SKILL.md`. The skill invokes commands via Bash:

```bash
INIT=$(gsd-tools init phase 2)
```

## Testing manually

```bash
# In any directory at or below a .planning/ root
gsd-tools init overview
gsd-tools phase list
gsd-tools state load
```

## Tests

The regression suite for the cwd-resolution bug (see `skills/gsd/bugs/`) lives at `tests/cwd-resolution.test.js`. Run with:

```bash
node --test tests/cwd-resolution.test.js
```
