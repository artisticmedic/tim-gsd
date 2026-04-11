# Execution Rules

Rules for execution agents during the build phase. Include this in every execution agent prompt.

## Deviation Handling

While executing, agents WILL discover unplanned work. These rules apply automatically:

### Rule 1: Auto-Fix Bugs
Code doesn't work as intended. Fix inline, don't ask.
- Track as deviation: `[Rule 1 - Bug] Fixed [description]`
- This is expected — plans can't anticipate every edge case

### Rule 2: Flag Scope Creep
Agent notices something that would be nice to add but isn't in the plan.
- DO NOT implement it
- Note in SUMMARY.md deviations: `[Rule 2 - Scope] Noticed [feature] would improve [thing] — not in plan, noted for user`
- Continue with planned work

### Rule 3: Adapt to Reality
Plan says "modify file X" but file X doesn't exist, or has a different structure than expected.
- Adapt the approach to match reality
- Track as deviation: `[Rule 3 - Adapt] [file] had different structure, adjusted approach to [description]`
- The plan is guidance, not scripture — reality wins

### Rule 4: Escalate Blockers
Agent encounters something it genuinely can't resolve:
- Missing credentials or API keys
- Dependency that won't install
- Architecture decision that contradicts the spec
- Write to SUMMARY.md: `[Rule 4 - Blocker] Cannot proceed with [task] because [reason]. Needs: [what would unblock]`
- Continue to next task

### Rule 5: Don't Gold-Plate
Implement what the plan says. Don't add extra error handling, logging, comments, tests, or configuration that isn't in the task.
- The plan was checked by the plan-checker. Trust it.
- If something feels missing, note it as a deviation, don't add it

## Commit Discipline

- One commit per task. Not one at the end.
- Commit message format: `[phase N, plan P, task T] [description]`
- Don't commit files that contain secrets (.env, credentials)
- If a task fails verification, don't commit the broken state — fix first, then commit

## Agent Context Rules

- Read CLAUDE.md first — it has project conventions
- Read CONTEXT.md for this phase — it has locked decisions
- Don't re-read files you've already read in this session
- If context is getting heavy (you're reading many large files), focus on the specific sections relevant to your task

## SUMMARY.md Format

Write after all tasks complete:

```markdown
# Phase [N], Plan [P] Summary

## Status: [complete | partial | blocked]

## Tasks Completed
- Task 1: [description] — [done criteria met]
- Task 2: [description] — [done criteria met]

## Requirements Addressed
- [REQ-ID]: [How it was implemented]

## Deviations
- [Rule N - Type] [Description]

## Files Changed
- [path] — [created | modified | deleted]

## Blockers (if any)
- [Blocker description and what would unblock it]

## Notes for Next Phase
- [Anything the next phase needs to know]
```
