# Artifact Formats

Standard formats for all `.planning/` artifacts. Designed to be readable by both humans and downstream agents. Every artifact has a specific purpose in the traceability chain.

## Traceability Chain

```
SPEC.md → REQUIREMENTS.md → ROADMAP.md → CONTEXT.md → PLAN.md → SUMMARY.md → VERIFICATION.md
  ↑ vision    ↑ REQ-IDs        ↑ phases      ↑ decisions   ↑ tasks     ↑ outcomes    ↑ proof
```

STATE.md tracks position across this chain.

---

## SPEC.md

The vision document. Written during the interview. This is the user's intent — never modify without asking.

```markdown
# [Project/Feature Name]

## Vision
[2-3 sentences: what this is and why it matters]

## Who It's For
[Target user/audience — be specific]

## Core Requirements
[High-level capabilities — these get refined into REQUIREMENTS.md with REQ-IDs]

1. [Requirement] — [Why it matters]
2. [Requirement] — [Why it matters]

## Design Direction
- Reference points: [apps, sites, styles referenced]
- Tone: [emotional quality]
- Density: [spacious/dense/balanced]
- Key interactions: [hover states, transitions, patterns]

## Technical Decisions
[Stack, integrations, data sources, constraints]

## Locked Decisions
- D-01: [Decision]
- D-02: [Decision]

## Deferred Ideas
- [Idea] — revisit after v1

## Done Looks Like
[Concrete definition of success]
```

---

## REQUIREMENTS.md

Traceable, testable requirements with IDs. Every v1 requirement maps to a roadmap phase.

```markdown
# Requirements

## v1 Requirements

### Authentication
- [ ] **AUTH-01:** User can create account with email/password
- [ ] **AUTH-02:** User can log in and stay logged in across sessions
- [ ] **AUTH-03:** User can reset password via email link

### Content
- [ ] **CONT-01:** User can create posts with text and images
- [ ] **CONT-02:** User can edit their own posts

### Navigation
- [ ] **NAV-01:** User can navigate between main sections via sidebar

## v2 (Deferred)
- SOCIAL-01: User can follow other users — deferred, not table stakes for v1
- CONT-05: User can schedule posts — nice to have, not core

## Out of Scope
- Real-time collaboration — too complex for v1, revisit in v2
- Native mobile app — web-first approach

## Traceability
| REQ-ID | Phase | Plan | Status |
|--------|-------|------|--------|
| AUTH-01 | 1 | 01-01 | pending |
| AUTH-02 | 1 | 01-01 | pending |
| CONT-01 | 2 | 02-01 | pending |

*Updated by roadmap creation and verification.*
```

---

## ROADMAP.md

Dependency-ordered phases mapped to requirements with success criteria.

```markdown
# Roadmap

## Overview
**[N] phases** | **[X] requirements** | All v1 requirements covered

## Phases

| # | Phase | Goal | Requirements | Criteria |
|---|-------|------|--------------|----------|
| 1 | Auth Foundation | User can sign up, log in, reset password | AUTH-01, AUTH-02, AUTH-03 | 3 |
| 2 | Content Core | User can create and edit posts | CONT-01, CONT-02 | 4 |
| 3 | Navigation | User can move between sections | NAV-01 | 2 |

## Phase Details

### Phase 1: Auth Foundation
**Goal:** Users can create accounts and authenticate
**Requirements:** AUTH-01, AUTH-02, AUTH-03
**Depends on:** nothing (foundational)
**Success Criteria:**
1. User can sign up with email/password and receive confirmation
2. User can log in and session persists across browser restarts
3. User can request and complete password reset via email

### Phase 2: Content Core
**Goal:** Users can create and manage their own content
**Requirements:** CONT-01, CONT-02
**Depends on:** Phase 1 (auth required for content ownership)
**Success Criteria:**
1. Authenticated user can create a post with text
2. User can upload and attach images to posts
3. User can edit text and images of their own posts
4. Edits are saved and visible immediately

## Traceability Matrix
| REQ-ID | Phase | Status |
|--------|-------|--------|
| AUTH-01 | 1 | pending |
| AUTH-02 | 1 | pending |
| AUTH-03 | 1 | pending |
| CONT-01 | 2 | pending |
| CONT-02 | 2 | pending |
| NAV-01 | 3 | pending |

*100% coverage verified.*
```

---

## CONTEXT.md (per phase)

Located at `.planning/phases/NN-name/NN-CONTEXT.md`. Captures decisions so downstream agents never guess.

```markdown
# Phase [X]: [Name] — Context

**Gathered:** [date]
**Status:** Ready for planning

## Phase Boundary
[Clear statement of what this phase delivers — scope anchor]

## Implementation Decisions

### [Category discussed]
- **D-01:** [Locked decision — non-negotiable downstream]
- **D-02:** [Another locked decision]

### [Category discussed]
- **D-03:** [Decision with rationale]

### Claude's Discretion
[Areas where user said "you decide" — Claude has flexibility]

## Existing Code Insights

### Reusable Assets
- [Component/hook/utility]: [How it applies to this phase]

### Established Patterns
- [Pattern]: [How it constrains or enables this phase]

### Integration Points
- [Where new code connects to existing system]

## Specific Ideas
[References, examples, "I want it like X" moments]

## Deferred Ideas
[Ideas that came up but belong in other phases]
```

---

## PLAN.md (per plan within a phase)

Located at `.planning/phases/NN-name/NN-PP-PLAN.md`. Each plan is a prompt for an execution agent.

```markdown
---
phase: NN-name
plan: PP
wave: N
depends_on: []
files_modified: []
requirements: [AUTH-01, AUTH-02]
must_haves:
  truths: ["User can log in with email/password"]
  artifacts: ["src/app/api/auth/login/route.ts"]
  key_links: ["Login route called from login form component"]
---

# Phase [N], Plan [P]: [Name]

## Objective
[What this plan accomplishes and why]

## Context
- `.planning/SPEC.md`
- `.planning/phases/NN-name/NN-CONTEXT.md`
- [Relevant source files]

## Tasks

### Task 1: [Name]
- **Files:** [paths to create or modify]
- **Action:** [Specific instructions — not vague]
- **Verify:** [Command to run, check to make, behavior to observe]
- **Done:** [One sentence: what's true when complete]

### Task 2: [Name]
- **Files:** [paths]
- **Action:** [Specific instructions]
- **Verify:** [How to confirm]
- **Done:** [Completion criteria]

## Success Criteria
- [ ] [Measurable outcome tied to requirements]
- [ ] [Another measurable outcome]
```

---

## SUMMARY.md (per plan)

Written by the execution agent after completing a plan.

```markdown
# Phase [N], Plan [P] Summary

## What Was Built
- [Bullet list of what was implemented]

## Requirements Addressed
- AUTH-01: [How it was implemented]
- AUTH-02: [How it was implemented]

## Deviations from Plan
- [What changed during execution and why]

## Files Changed
- [List of files created or modified]

## Notes for Next Phase
- [Gotchas, setup, state the next phase needs to know]
```

---

## VERIFICATION.md (per phase)

```markdown
# Verification Report — Phase [N]: [Name]

**Date:** [YYYY-MM-DD]
**Spec:** [Project Name]

## Results

| # | Must Be True | REQ-ID | Status | Evidence |
|---|-------------|--------|--------|----------|
| 1 | User can log in with email/password | AUTH-01 | VERIFIED | Route exists, called from form, returns 200 |
| 2 | Session persists across restarts | AUTH-02 | VERIFIED | httpOnly cookie set, middleware checks it |
| 3 | Password reset works via email | AUTH-03 | FAILED | Route exists but not wired to email service |

## Failed Items

### AUTH-03: Password reset via email
**What's wrong:** Reset route exists but `sendResetEmail()` is a stub — no email service configured
**Fix:** Wire up email service (Resend/SendGrid) in reset route

## Summary
- Verified: 2/3
- Failed: 1/3
- Overall: NEEDS REMEDIATION
```

---

## STATE.md

Cross-session state tracker. Updated after every phase transition.

```markdown
# Build State

## Current State
- **Build:** [project name]
- **Current Phase:** [N] — [discuss | plan | execute | verify]
- **Last updated:** [YYYY-MM-DD HH:MM]

## Config
- Granularity: [coarse | standard | fine]
- Research: [on | off]
- Plan-check: [on | off]
- Verification: [on | off]
- Execution: [parallel | sequential]

## Progress
| Phase | Discuss | Plan | Execute | Verify | Status |
|-------|---------|------|---------|--------|--------|
| 1 | done | done | done | passed | complete |
| 2 | done | in progress | — | — | active |
| 3 | — | — | — | — | pending |

## Decisions Log
- D-01: [Key decision from interview]
- D-02: [Key decision]

## Deferred Ideas
- [Idea] — revisit after v1

## Phase History
| Phase | Step | Date | Notes |
|-------|------|------|-------|
| — | interview | 2026-04-10 | Spec written |
| — | requirements | 2026-04-10 | 12 REQ-IDs defined |
| — | roadmap | 2026-04-10 | 4 phases, 100% coverage |
| 1 | discuss | 2026-04-10 | 4 decisions locked |
| 1 | plan | 2026-04-10 | 2 plans, checker passed |
| 1 | execute | 2026-04-10 | 2/2 plans complete |
| 1 | verify | 2026-04-10 | 3/3 verified |
```

---

## config.json

Workflow preferences. Asked once, respected throughout.

```json
{
  "granularity": "standard",
  "research": true,
  "plan_check": true,
  "verification": true,
  "execution": "parallel",
  "commit_planning_docs": false
}
```
