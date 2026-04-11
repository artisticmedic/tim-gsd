---
description: Get Stuff Done — structured build pipeline with deep interview, requirements traceability, roadmap, per-phase discussion/research/planning/execution, and goal-backward verification. Use when the user says "build", "let's build", "I want to build", "spec this out", "scope this", "deep work", "plan and build", "start a project", "new feature", "get stuff done", "gsd", or activates /gsd with a project idea. Produces structured artifacts (.planning/) that persist across sessions. Supports --auto (fully autonomous) and --chain (interactive discuss, auto plan+execute).
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, AskUserQuestion
argument-hint: [idea or description] [--auto] [--chain]
---

# Get Stuff Done (gsd)

Structured pipeline with full traceability. Each step produces persistent artifacts so context never gets lost, decisions are never re-asked, and every requirement is tracked from spec to verification.

## This skill includes

- `references/interview-guide.md` — Questioning philosophy, gray area extraction, scope creep handling
- `references/artifact-formats.md` — All artifact templates with full examples
- `references/context-budget.md` — Degradation tiers, agent delegation rules, checkpoint triggers
- `references/plan-checker.md` — Pre-execution plan verification
- `references/execution-rules.md` — Deviation handling, agent behavior rules during execution
- `templates/spec-template.md` — SPEC.md skeleton

## CLI helper tool

A Node.js CLI at `~/.claude/gsd/gsd-tools.js` handles deterministic state operations reliably. Pure stdlib, zero dependencies, auditable. Use it for STATE.md and config.json reads/writes instead of parsing markdown inline.

**Common calls:**
```bash
# Compound state query — use this at the start of each phase
node ~/.claude/gsd/gsd-tools.js init phase <N>

# Initialize new project
node ~/.claude/gsd/gsd-tools.js state init "Project Name"
node ~/.claude/gsd/gsd-tools.js config init

# Update progress
node ~/.claude/gsd/gsd-tools.js state update-progress <N> <step> <status>
# step: discuss | plan | execute | verify
# status: done | in progress | passed | failed

# Create phase directory
node ~/.claude/gsd/gsd-tools.js phase create <N> "<name>"

# Check phase artifacts
node ~/.claude/gsd/gsd-tools.js phase status <N>

# Add decisions and log them
node ~/.claude/gsd/gsd-tools.js state add-decision D-01 "Use session cookies for auth"

# Config management
node ~/.claude/gsd/gsd-tools.js config set granularity coarse
node ~/.claude/gsd/gsd-tools.js config get workflow.research
```

Run `node ~/.claude/gsd/gsd-tools.js help` for the full command list.

**When to use the CLI vs inline operations:**
- State transitions, config changes, phase directory creation → always use the CLI (reliable, atomic writes)
- Reading SPEC.md, CONTEXT.md, agent prompts, content generation → inline reads are fine
- The CLI is for structured data. Content stays in Claude.

## Flags

- `--auto` — Fully autonomous. After config questions, runs research → requirements → roadmap → discuss → plan → execute → verify with recommended defaults. No interaction after config.
- `--chain` — Interactive discuss (you answer questions), then auto plan → execute → verify. Best of both: you control decisions, Claude handles execution.
- No flags — Fully interactive. Checkpoints at every step.

## Before starting

### Resume detection

1. Run `node ~/.claude/gsd/gsd-tools.js init overview` to get the full project state in one call. Check `planning_exists`, `state.build`, `state.current_phase`.

2. If state exists, present: "Found build: [state.build], currently at [state.current_phase]. Resume or start fresh?"

3. Check if `.planning/phases/*/NN-DISCUSS-CHECKPOINT.json` exists. If discussion was interrupted:
   - "Found interrupted discussion for Phase [N] ({X} of {Y} areas completed). Resume from checkpoint?"

4. If starting fresh, the CLI will create `.planning/` when you call `state init`.

### Brownfield detection

Check for existing code in the project (look for `src/`, `app/`, `lib/`, `package.json`, `Cargo.toml`, etc.):

If existing code detected:
- "I see existing code. Want me to map the codebase first? This helps me understand what's reusable."
- **Map codebase** (recommended) — Spawn parallel agents to analyze stack, architecture, conventions, concerns. Write to `.planning/CODEBASE.md`.
- **Skip** — Proceed without mapping.

4. If `$ARGUMENTS` contains an idea, use it as seed. If blank: "What are we building?"

---

## Step 1: Interview — Vision Extraction

Read `references/interview-guide.md` before starting.

**Goal:** Extract enough clarity to write a SPEC and define requirements that downstream phases can act on without asking the user again.

**Process:**

1. **Open-ended start.** Let them dump their mental model. Don't interrupt.

2. **Follow energy.** Dig into what excited them. What problem sparked this?

3. **Challenge vagueness.** Never accept fuzzy answers. "Clean UI" → clean how? "Users" → who specifically? "Simple" → simple to use, build, or maintain?

4. **Make abstract concrete.** "Walk me through using this." "What does that look like on screen?" "Give me an example."

5. **Surface gray areas proactively.** Based on what they described, identify decisions not yet made. Present them as structured choices via AskUserQuestion. Categorize by domain:
   - Visual features → layout, density, interactions, empty states
   - APIs/CLIs → response format, flags, error handling
   - Content systems → structure, tone, depth, flow
   - Organization tasks → grouping criteria, naming, exceptions

6. **For each gray area:** dig until the answer is specific enough to implement. Use AskUserQuestion with 2-4 concrete options when possible.

7. **Park scope creep.** "Great idea — parking that for later so we stay focused." Track in deferred ideas. Don't lose the idea, don't act on it.

8. **Know when to stop.** When you understand WHAT, WHY, WHO, and DONE → offer to proceed.

**Output:** Write `.planning/SPEC.md` using `templates/spec-template.md`.

After writing, ask:
- **Continue to requirements** — define v1 scope and build
- **Just save the spec** — stop here (design briefs, prototype specs)

---

## Step 2: Config

Ask workflow preferences via AskUserQuestion (2 rounds):

**Round 1:**
1. **Granularity:** Coarse (3-5 phases, recommended for small projects) / Standard (5-8) / Fine (8-12)
2. **Execution:** Parallel (recommended) / Sequential

**Round 2:**
1. **Research:** Research domain before planning each phase? Yes (recommended) / No
2. **Plan-check:** Verify plans achieve goals before execution? Yes (recommended) / No
3. **Verification:** Verify outcomes after each phase? Yes (recommended) / No

Store in `.planning/config.json`. Respect throughout the build.

---

## Step 3: Requirements Definition

**Goal:** Turn the spec into traceable, testable requirements with IDs.

**Process:**

1. Extract capabilities from the spec. Group by category (Auth, Content, Navigation, etc.).

2. For each category, present features to the user via AskUserQuestion (multiSelect):
   - "Which [category] features are in v1?"
   - Selected → v1 requirements
   - Unselected but expected → v2
   - Explicitly excluded → out of scope with reason

3. Assign **REQ-IDs**: `[CATEGORY]-[NUMBER]` (AUTH-01, CONT-02, NAV-03).

4. Validate requirement quality — each must be:
   - **Specific and testable:** "User can reset password via email link" not "Handle password reset"
   - **User-centric:** "User can X" not "System does Y"
   - **Atomic:** One capability per requirement
   - Reject vague requirements. Push for specificity.

5. Ask: "Any requirements I missed? Features specific to your vision?" Capture additions.

6. Present full requirements list for approval.

**If --auto:** Auto-include all table stakes, include features from the spec, skip per-category selection.

**Output:** Write `.planning/REQUIREMENTS.md`. Update STATE.md.

---

## Step 4: Research (if enabled in config)

**Goal:** Investigate domain, stack, and codebase so planning is grounded in reality.

**Process:**

Spawn **4 parallel research agents** using the Agent tool:

**Agent 1 — Stack:**
"Research the standard tech stack for [domain]. Specific libraries with versions, rationale for each choice, what NOT to use and why. Write findings to `.planning/research/STACK.md`."

**Agent 2 — Features:**
"Research what features [domain] products have. Categorize: table stakes (users expect), differentiators (competitive advantage), anti-features (deliberately skip). Note complexity and dependencies. Write to `.planning/research/FEATURES.md`."

**Agent 3 — Architecture:**
"Research how [domain] systems are typically structured. Component boundaries, data flow, suggested build order. Write to `.planning/research/ARCHITECTURE.md`."

**Agent 4 — Pitfalls:**
"Research common mistakes in [domain] projects. For each: warning signs, prevention strategy, which phase should address it. Write to `.planning/research/PITFALLS.md`."

Each agent prompt includes: full SPEC.md content, whether this is greenfield or brownfield, and instructions to write directly to disk.

After all 4 complete, spawn a **synthesizer agent:**
"Read all 4 research files in `.planning/research/`. Create `.planning/research/SUMMARY.md` with key findings, recommendations, and consolidated decisions."

Present key findings to user. Update STATE.md.

---

## Step 5: Roadmap

**Goal:** Create a dependency-ordered roadmap mapping every v1 requirement to exactly one phase.

**Delegate to a roadmapper agent** to keep orchestrator context lean:

"Read `.planning/SPEC.md`, `.planning/REQUIREMENTS.md`, `.planning/research/SUMMARY.md` (if exists), and `.planning/config.json`. Create a roadmap:
1. Derive phases from requirements (don't impose structure)
2. Map every v1 requirement to exactly one phase
3. Derive 2-5 success criteria per phase (observable user behaviors)
4. Validate 100% coverage — every REQ-ID assigned
5. Write `.planning/ROADMAP.md` and initialize `.planning/STATE.md` progress table
6. Update `.planning/REQUIREMENTS.md` traceability section"

Read the agent's output. Present roadmap summary inline:
- Phase count, names, goals
- Requirements per phase
- Success criteria overview

Ask for approval (approve / adjust). If adjust, re-spawn with revision notes. Loop until approved.

**If --auto:** Auto-approve.

**Navigation after approval:**
```
Roadmap approved. Next: Phase 1 discussion.

Recommend: /clear then /build (it will resume from Phase 1 discuss)
Or continue in this session.
```

---

## Step 6: Per-Phase Loop — Discuss → Plan → Execute → Verify

For each phase in the roadmap, run this loop. After each phase completes, update STATE.md and present next steps.

### 6a. Discuss Phase (Gray Area Extraction)

**Goal:** Capture implementation decisions for THIS phase so planning agents never have to guess.

**1. Load prior context:**
Read ALL prior CONTEXT.md files from completed phases. Extract locked decisions. Build internal `<prior_decisions>` context. Don't re-ask what's already decided.

**2. Scout codebase:**
If `.planning/CODEBASE.md` exists, read relevant sections. Otherwise, do targeted grep for terms related to the phase goal. Identify:
- Reusable assets (components, hooks, utilities)
- Established patterns (state management, styling, data fetching)
- Integration points (where new code connects)

**3. Identify gray areas:**
Based on the phase goal, domain, prior decisions, and code context, generate 3-4 specific ambiguities that would change the implementation. NOT generic categories — concrete decisions for THIS phase.

Annotate each with context:
- Code: "You already have a Card component with shadow/rounded variants"
- Prior decisions: "You chose infinite scroll in Phase 2 — same here or different?"

**4. Present gray areas** via AskUserQuestion (multiSelect):
"Which areas do you want to discuss for [phase name]?"
User picks which to explore. Do NOT include a "skip all" option — they ran this to discuss.

**If --auto:** Auto-select ALL areas, auto-choose recommended option for each question. Log each choice.

**5. Discuss each area:**
For each selected area, ask 2-4 targeted questions via AskUserQuestion:
- Options should be concrete, not abstract ("Cards" not "Option A")
- Annotate with code context ("reuses existing Card component — consistent with Messages")
- Include "You decide" when reasonable (captures Claude discretion)
- Each answer should inform the next question — follow the thread

**6. Track canonical refs:**
When the user references a doc, spec, or ADR during any answer ("check the MCP spec", "read adr-014", "per browse-spec.md"):
- Read the referenced doc (or confirm it exists)
- Add it to a running `canonical_refs` list with full file path
- These user-referenced docs feed into CONTEXT.md for downstream agents — they're often the most important context

**7. Checkpoint after each area:**
After each gray area is fully discussed, write a checkpoint:
`.planning/phases/NN-name/NN-DISCUSS-CHECKPOINT.json`

```json
{
  "phase": "N",
  "areas_completed": ["Area 1", "Area 2"],
  "areas_remaining": ["Area 3"],
  "decisions": { "Area 1": [{"question": "...", "answer": "..."}] },
  "canonical_refs": ["path/to/spec.md"],
  "deferred_ideas": ["..."]
}
```

This enables session resume if interrupted.

**8. After all areas:** Summarize decisions, ask "Ready to create context, or explore more gray areas?"

**9. Write CONTEXT.md:**
`.planning/phases/NN-name/NN-CONTEXT.md`

```markdown
# Phase [X]: [Name] — Context

**Gathered:** [date]

## Phase Boundary
[What this phase delivers — scope anchor]

## Implementation Decisions
### [Category]
- **D-01:** [Locked decision — non-negotiable downstream]
- **D-02:** [Another locked decision]

### Claude's Discretion
[Areas where user deferred — Claude has flexibility]

## Canonical References
**Downstream agents MUST read these before planning or implementing.**
- `path/to/spec.md` — [What it decides that's relevant]
- `path/to/adr.md` — [What this doc defines]

## Existing Code Insights
### Reusable Assets
- [Component/hook]: [How it applies]
### Established Patterns
- [Pattern]: [Constraint/enabler]
### Integration Points
- [Where new code connects]

## Deferred Ideas
[Scope creep caught and parked]
```

**10. Write DISCUSSION-LOG.md** (audit trail, not consumed by agents):
`.planning/phases/NN-name/NN-DISCUSSION-LOG.md`

For each area: options presented, what was chosen, user's notes. This is for the user to review later, not for agents.

**11. Clean up checkpoint** — CONTEXT.md is now canonical.

**12. Navigation:**
```
Context captured for Phase [N].

Next: /clear then /build (resumes at Phase [N] planning)
Or: continue in this session to plan.
```

### 6b. Plan Phase

**Goal:** Create executable plans with task breakdown, dependency analysis, and pre-execution verification.

**Delegate to a planner agent** (keeps orchestrator lean):

"Read these files: [SPEC.md, REQUIREMENTS.md, ROADMAP.md, CONTEXT.md for this phase, RESEARCH.md if exists, CODEBASE.md if exists, CLAUDE.md]. Also read all prior CONTEXT.md files for cross-phase consistency.

Create plans for Phase [N]:
- Honor locked decisions from CONTEXT.md (non-negotiable)
- Decompose into plans with 2-3 tasks each
- Each task: files, action (specific — not vague), verify, done criteria
- Each plan references which REQ-IDs it addresses
- Include must_haves: truths (observable behaviors), artifacts (files that must exist), key_links (connections between artifacts)
- Group plans into waves by dependency (Wave 1 runs in parallel, Wave 2 waits for Wave 1)
- Write plans to `.planning/phases/NN-name/NN-PP-PLAN.md`"

**Plan-check** (if enabled in config): Spawn a **plan-checker agent** (read `references/plan-checker.md`):
- Requirement coverage: every REQ-ID for this phase has tasks
- Task completeness: every task has files + action + verify + done
- Dependency correctness: no cycles, no missing references
- Key links: artifacts wired together, not just created
- Scope sanity: 2-3 tasks per plan, reasonable file counts

If checker finds gaps → feed report back to planner, re-spawn. Max 3 iterations. After 3, present remaining issues to user.

Present plan summary. Ask for approval (approve / request changes).

**If --auto or --chain:** Auto-approve after checker passes.

### 6c. Execute Phase

**Goal:** Build it. Each plan gets a fresh-context agent. Wave-based parallelism.

**Wave execution:**
- Group plans by wave (from `wave` field in PLAN.md frontmatter)
- Wave 1: spawn all Wave 1 plans in parallel
- Wait for Wave 1 to complete
- Wave 2: spawn all Wave 2 plans in parallel
- Continue until all waves done

**For each plan, spawn an execution agent:**

"Execute this plan completely. Read these files first: [PLAN.md content, CLAUDE.md path, CONTEXT.md path, relevant source files].

For each task:
1. Implement it following the action instructions exactly
2. Run the verify step to confirm it works
3. Commit with a descriptive message (atomic — one commit per task)
4. If you hit a bug while implementing: fix it inline, track as deviation
5. If you discover scope creep: note it, don't implement it
6. If a task is blocked: document the blocker, continue to next task

After all tasks: write `.planning/phases/NN-name/NN-PP-SUMMARY.md` listing what you built, deviations from plan, files changed, and notes for next phase."

After each agent completes, read SUMMARY.md:
- Deviations → flag significant ones to user
- Blockers → surface for user decision
- Notes → carry forward to next phase

Update STATE.md after each wave completes.

### 6d. Verify Phase

**Goal:** Confirm outcomes exist and work. Goal-backward — not "did tasks complete" but "does the outcome exist in the codebase."

Run `/verify` or perform inline:

1. Extract must-be-true statements from ROADMAP.md success criteria AND PLAN.md must_haves for this phase.

2. For each truth:
   - **Artifact exists?** (glob/grep for files, functions, components, routes)
   - **Artifact wired?** (imported, rendered, registered, called)
   - **Artifact works?** (build passes, tests pass, endpoint responds)

3. Classify: VERIFIED / FAILED / UNCERTAIN

4. Write `.planning/phases/NN-name/NN-VERIFICATION.md`

5. If FAILEDs: present with specific fix plan. Offer to remediate. If user agrees, spawn fix agents and re-verify.

6. If all VERIFIED: phase complete. Update STATE.md. Mark REQ-IDs as verified in ROADMAP.md traceability.

**Navigation after phase completes:**
```
Phase [N] complete. [X/Y] requirements verified.

Next: /clear then /build (resumes at Phase [N+1] discuss)

Remaining phases: [list]
```

**If --auto or --chain:** Auto-advance to next phase.

---

## Orchestrator Rules

The main conversation is the **orchestrator**. It routes and coordinates — it does NOT execute heavy work. Follow these rules to prevent context degradation:

1. **Delegate to agents.** Research, roadmapping, planning, plan-checking, execution, and verification are ALL done by spawned agents with fresh context windows. The orchestrator reads summaries, not full outputs.

2. **Don't read agent output bodies into main context** unless needed for a user-facing decision. Read frontmatter or summary sections only.

3. **Agent prompts are self-contained.** Include everything the agent needs: file paths to read, spec content, decisions, conventions. Agents have NO memory of this conversation.

4. **Tell every agent to read CLAUDE.md** in the project root for conventions and preferences.

5. **Monitor context usage:**
   - 0-30%: Peak quality. Full operations.
   - 30-50%: Good. Prefer summaries over full reads.
   - 50-70%: Degrading. Warn user. Delegate aggressively.
   - 70%+: Checkpoint immediately. Update STATE.md. Suggest /clear and resume.

## Constraints

- Never skip the interview. Even for "just build X" — minimum 3 questions to lock the spec.
- Never modify SPEC.md without asking. It's the user's vision document.
- Every v1 requirement must have a REQ-ID and map to exactly one roadmap phase.
- Plan-checker runs before execution (unless user opted out). Don't burn tokens on a bad plan.
- Atomic commits per task during execution.
- Scope creep → park it in deferred ideas, redirect to current phase boundary.
- Always present explicit next steps with /clear recommendation between heavy phases.

## Input

$ARGUMENTS
