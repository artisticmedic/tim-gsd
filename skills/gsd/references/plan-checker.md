# Plan Checker

Pre-execution verification of plans. Catches gaps before burning tokens on execution. Run after the planner creates PLAN.md files, before spawning execution agents.

## Why This Exists

A planner can produce plans that look complete but miss the goal:
- Key requirements have no tasks
- Dependencies are broken or circular
- Artifacts are planned but wiring between them isn't
- Scope exceeds context budget

The plan-checker catches these before execution starts.

## Five Verification Dimensions

### 1. Requirement Coverage
Does every REQ-ID assigned to this phase have task(s) addressing it?

- Extract REQ-IDs from ROADMAP.md for this phase
- Check each appears in at least one plan's `requirements` field
- **FAIL** if any REQ-ID is absent from all plans

### 2. Task Completeness
Does every task have the four required fields?

- **Files** — what to create or modify
- **Action** — specific implementation instructions (not vague)
- **Verify** — how to confirm the task worked
- **Done** — one sentence: what's true when complete

**FAIL** if any field is missing or vague ("implement appropriately" is not an action).

### 3. Dependency Correctness
Are plan dependencies valid and acyclic?

- Parse `depends_on` from each plan
- Build dependency graph
- Check for cycles (A→B→C→A)
- Check for missing references (depends on plan that doesn't exist)
- **FAIL** if cycles or broken references found

### 4. Key Links Planned
Are artifacts wired together, not just created?

- From `must_haves.key_links`, verify each link has a corresponding task
- Example: if a component must be rendered in a page, there should be a task that imports and renders it — not just a task that creates the component
- **FAIL** if key links have no implementing task

### 5. Scope Sanity
Will plans complete within context budget?

| Metric | Target | Warning | Blocker |
|--------|--------|---------|---------|
| Tasks per plan | 2-3 | 4 | 5+ |
| Files per task | 1-3 | 4-5 | 6+ |
| Total plans | varies | — | — |

**WARN** if tasks are too broad. **FAIL** if plans are clearly too large for a single agent context.

## Checker Output

The checker produces a structured report:

```markdown
## Plan Check: Phase [N]

### Requirement Coverage: PASS/FAIL
[Details — which REQ-IDs are covered, which are missing]

### Task Completeness: PASS/FAIL
[Details — which tasks have gaps]

### Dependency Correctness: PASS/FAIL
[Details — graph analysis]

### Key Links: PASS/FAIL
[Details — which links lack implementing tasks]

### Scope Sanity: PASS/WARN/FAIL
[Details — task counts, file counts]

### Overall: PASS / NEEDS REVISION
[If NEEDS REVISION: specific items to fix]
```

## Revision Loop

If the checker finds issues:

1. Feed the checker's report back to the planner
2. Planner revises plans to address gaps
3. Re-run checker
4. Max 3 iterations — after that, present remaining issues to user for decision

The goal is plans that will actually achieve the phase goal, not plans that merely look complete.
