# Context Budget

Rules for keeping the orchestrator lean and agents effective.

## Why This Matters

Quality degrades as context fills up. This isn't theoretical — Claude gets vaguer, skips steps, and produces incomplete work as it approaches context limits. The build skill combats this by:

1. Delegating heavy work to subagents with fresh context
2. Keeping the orchestrator (main conversation) lean
3. Writing decisions to files instead of keeping them in chat

## Rules

### Orchestrator Stays Lean
- Don't read entire agent outputs back into main context. Read the SUMMARY.md or frontmatter only.
- Don't inline large files into agent prompts. Tell agents to read files from disk.
- The orchestrator routes and coordinates. It doesn't execute.

### Agents Get Fresh Context
- Each agent starts with a full context window. This is the key advantage.
- Agent prompts must be self-contained — include everything the agent needs to know. It has no memory of your conversation.
- Include: the plan, file paths to read, project conventions (tell it to read CLAUDE.md), and clear success criteria.

### Degradation Tiers

| Context Usage | Quality | Behavior |
|---------------|---------|----------|
| 0-30% | Peak | Full operations. Read bodies, spawn agents, inline results. |
| 30-50% | Good | Normal ops. Prefer reading summaries over full outputs. |
| 50-70% | Degrading | Economize. Warn user about budget. Delegate aggressively. |
| 70%+ | Poor | Checkpoint immediately. No new reads unless critical. |

### Warning Signs
- Agent claims task is done but implementation is incomplete
- Increasing vagueness — "appropriate handling" instead of specific code
- Skipped steps that would normally be followed
- Repeating information already established

### When to Checkpoint
If you're deep in execution and context is getting heavy:
1. Update STATE.md with current progress
2. Tell the user: "Context is getting heavy. Recommend saving progress and continuing in a fresh session."
3. The user can `/clear` and run `/build` again — STATE.md will resume from where they left off.
