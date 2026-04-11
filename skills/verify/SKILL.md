---
description: Goal-backward verification — checks whether build outcomes actually exist and work in the codebase. Use when the user says "verify", "check the build", "did it work", "verify the spec", "does it actually work", "check outcomes", "goal check", or after completing a /build pipeline. Also usable standalone after any manual work session.
allowed-tools: Read, Glob, Grep, Bash, Write, Agent
argument-hint: [spec file path — or blank to auto-detect .planning/SPEC.md]
---

# Verify

Goal-backward verification. Starts from what SHOULD exist, confirms it ACTUALLY exists in the codebase. Not "did tasks complete" — "does the outcome work."

## This skill includes

- `references/verification-method.md` — The goal-backward verification process

## Process

### 1. Find the spec

Check in order:
1. If `$ARGUMENTS` contains a file path, use that as the spec
2. If `.planning/SPEC.md` exists, use that
3. If `.planning/phases/*-PLAN.md` files exist, use the success criteria from those
4. If none of the above: ask the user "What should I verify? Describe what should be true."

### 2. Extract must-be-true statements

From the spec or plan, extract every concrete claim about what the build delivers. These become verification targets.

For each requirement in the spec, derive:
- **Truth:** What must be observably true? (e.g., "Users can log in with email and password")
- **Artifact:** What file/function/component/route proves it? (e.g., `src/app/api/auth/login/route.ts`)
- **Wiring:** Is the artifact connected to the rest of the system? (e.g., imported in middleware, called from login form)

### 3. Verify each truth

For each must-be-true statement, check three levels:

**Level 1 — Artifact exists:**
- Use Glob/Grep to find the expected files, functions, components, routes
- Does the file exist? Does the function exist in the file?

**Level 2 — Artifact is wired:**
- Is it imported/used somewhere?
- Is the route registered? Is the component rendered? Is the function called?
- Use Grep to find imports, references, route registrations

**Level 3 — Artifact works:**
- Can we run a build/compile without errors?
- Do tests pass (if tests exist)?
- Can we curl an endpoint? Can we verify a component renders?
- Use Bash for build checks, test runs, curl commands

Classify each truth as:
- **VERIFIED** — All three levels pass
- **FAILED** — One or more levels fail (note which)
- **UNCERTAIN** — Can't determine automatically (needs manual check)

### 4. Write the report

Write `.planning/VERIFICATION.md` (or display inline if no `.planning/` directory exists):

```markdown
# Verification Report

## Spec: [Name]
## Date: [YYYY-MM-DD]

## Results

| # | Must Be True | Status | Evidence |
|---|-------------|--------|----------|
| 1 | [Statement] | VERIFIED | [file exists, imported in X, build passes] |
| 2 | [Statement] | FAILED | [file exists but not imported anywhere] |
| 3 | [Statement] | UNCERTAIN | [can't verify without running the app] |

## Failed Items

### [Item N]: [Statement]
**What's wrong:** [Specific failure]
**Fix:** [What would resolve it]

## Summary
- Verified: N/M
- Failed: N/M  
- Uncertain: N/M
- Overall: PASS / FAIL
```

### 5. Offer remediation

If there are FAILED items:
- Present the failures with specific fixes
- Ask: "Want me to fix these?" (yes / no / fix specific ones)
- If yes, execute the fixes and re-verify

If all VERIFIED:
- "Build verified. Everything in the spec exists and works in the codebase."
- Update `.planning/STATE.md` if it exists (set verification to "passed")

## Standalone usage

This skill works without `/build`. Common standalone scenarios:

- **After manual coding:** "I just built the auth system — /verify it matches what we discussed"
- **After another agent's work:** "An agent built this feature — /verify the spec"
- **Spot check:** "Does our API actually have all the endpoints the docs claim?"

When used standalone without a spec file, ask the user to describe what should be true, then verify those claims against the codebase.

## Constraints

- Never trust summaries or claims about what was built. Verify against the actual codebase.
- Don't count "file exists" as verified — check that it's wired up and functional.
- Be honest about UNCERTAIN items. Don't mark something VERIFIED if you can't actually confirm it.
- If verification requires running the app (which you can't do visually), mark as UNCERTAIN and note what the user should manually check.

## Input

$ARGUMENTS
