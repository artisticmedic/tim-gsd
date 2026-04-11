# Goal-Backward Verification Method

## Core Principle

Task completion does not equal goal achievement.

A developer can complete every task in a plan and still miss the goal. Tasks are means, not ends. Verification starts from the outcome and works backward.

## The Three Questions

For every claim about what was built:

1. **What must be TRUE for this goal to be achieved?**
   - These are observable behaviors, not implementation details
   - "Users can log in" not "login function exists"

2. **What must EXIST for those truths to hold?**
   - Files, functions, components, routes, database tables, env vars
   - These are the artifacts that make the truth possible

3. **What must be WIRED for those artifacts to function?**
   - Imports, route registrations, component rendering, middleware chains
   - An artifact that exists but isn't connected is dead code

## Verification Levels

### Level 1: Exists
The artifact is present in the codebase.
- File exists at expected path
- Function/class/component is defined
- Route is declared
- Database migration exists

**How to check:** Glob for file paths, Grep for function/class names.

### Level 2: Wired
The artifact is connected to the rest of the system.
- Imported by another module
- Rendered in a parent component
- Registered as a route
- Called in a handler or middleware

**How to check:** Grep for imports, references, registrations. Follow the chain from entry point to artifact.

### Level 3: Works
The artifact produces correct behavior.
- Build/compile succeeds
- Tests pass
- Endpoint returns expected response
- Component renders without errors

**How to check:** Run build, run tests, curl endpoints, check for runtime errors.

## Common Failure Patterns

- **Orphan artifact** — File exists but nothing imports it. Level 1 passes, Level 2 fails.
- **Partial implementation** — Function exists but only handles the happy path. Edge cases from spec are missing.
- **Broken wiring** — Component is imported but never rendered. Route is declared but middleware blocks it.
- **Silent failure** — Everything looks wired but the logic is wrong. Tests would catch this but don't exist.
- **Scope gap** — 8 of 10 spec requirements are implemented. The missing 2 are the hard ones.

## Mindset

Be skeptical. Don't trust what was said — trust what you can observe. If a SUMMARY.md says "authentication is complete," verify that:
1. Login endpoint exists and accepts credentials
2. Token/session is issued on success
3. Protected routes check for auth
4. Unauthorized requests get rejected
5. The frontend actually calls the login endpoint

"It's done" is a claim. Verification is evidence.
