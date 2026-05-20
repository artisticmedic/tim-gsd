---
description: Structured build pipeline — interview, spec, roadmap, per-phase plan+execute, goal-backward verify. Trigger on /gsd, "build", "let's build", "spec this", "scope this", "new feature", "plan and build". Supports --auto, --chain.
disable-model-invocation: true
allowed-tools: Read, Bash, Glob, Grep, Agent, AskUserQuestion
argument-hint: [idea or description] [--auto] [--chain]
---

# Get Stuff Done (gsd)

Structured pipeline with full traceability. Each step produces persistent artifacts so context never gets lost, decisions are never re-asked, and every requirement is tracked from spec to verification.

## Trigger Surface

Invoke when the user says: "build", "let's build", "I want to build", "spec this out", "scope this", "deep work", "plan and build", "start a project", "new feature", "get stuff done", "gsd", or activates /gsd with a project idea. Produces structured artifacts in `.planning/` that persist across sessions. Modes: `--auto` (fully autonomous), `--chain` (interactive discuss, auto plan+execute).

## This skill includes

- `references/interview-guide.md` — Questioning philosophy, gray area extraction, scope creep handling
- `references/artifact-formats.md` — All artifact templates with full examples
- `references/context-budget.md` — Degradation tiers, agent delegation rules, checkpoint triggers
- `references/plan-checker.md` — Pre-execution plan verification
- `references/execution-rules.md` — Deviation handling, agent behavior rules during execution
- `templates/spec-template.md` — SPEC.md skeleton

## CLI helper tool

A Node.js CLI shipped with this plugin (run as `gsd-tools` — it's added to PATH automatically when the plugin is enabled) handles deterministic state operations reliably. Pure stdlib, zero dependencies, auditable. Use it for STATE.md and config.json reads/writes instead of parsing markdown inline.

**Named builds:** Multiple builds can coexist in `.planning/builds/<slug>/`. Each build is isolated — its own STATE.md, config.json, phases/, etc. Use `--build <name>` to target a specific build. If only one build exists, it auto-selects.

**Planning root resolution:** Reads walk upward from cwd looking for a directory containing `.planning/`. If your build repo lives one level below the planning root (a recommended pattern that keeps planning artifacts out of public repos), you can run `gsd-tools` from inside the build repo and it will find the planning dir in an ancestor. The CLI prints a one-line `Note:` to stderr whenever the resolved root differs from cwd, and `Wrote <path>` after every write — if you ever stop seeing those, the run isn't touching what you think it is. When no `.planning/` exists in any ancestor, `builds list` exits non-zero rather than returning an empty array silently. Pass `--quiet` to suppress the breadcrumbs in scripts.

**Common calls:**
```bash
# List all builds
gsd-tools builds list

# Initialize a new build (creates .planning/builds/<slug>/)
gsd-tools state init "Project Name"
gsd-tools --build project-name config init

# Compound state query — use this at the start of each phase
gsd-tools --build project-name init phase <N>

# Update progress
gsd-tools --build project-name state update-progress <N> <step> <status>

# Create phase directory
gsd-tools --build project-name phase create <N> "<name>"

# Config management
gsd-tools --build project-name config set granularity coarse
```

Run `gsd-tools help` for the full command list.

**When to use the CLI vs inline operations:**
- State transitions, config changes, phase directory creation → always use the CLI (reliable, atomic writes)
- Reading SPEC.md, CONTEXT.md, agent prompts, content generation → inline reads are fine
- The CLI is for structured data. Content stays in Claude.
- Always pass `--build <name>` when multiple builds exist in the same directory

## Flags

- `--auto` — Fully autonomous. After config questions, runs research → requirements → roadmap → discuss → plan → execute → verify with recommended defaults. No interaction after config.
- `--chain` — Interactive discuss (you answer questions), then auto plan → execute → verify. Best of both: you control decisions, Claude handles execution.
- No flags — Fully interactive. Checkpoints at every step.

## Before starting

### Resume detection

Run `gsd-tools init overview` and act on the JSON. It returns existing builds, current phase, and any interrupted discussion checkpoints.

- Zero builds → fresh start. Run `state init "Name"` to create `.planning/builds/<slug>/`.
- One build → "Found build: [name], currently at [phase]. Resume or start fresh?"
- Multiple builds → present via AskUserQuestion, then re-run with `--build <slug>` for the selected one.
- Interrupted discussion → "Found interrupted discussion for Phase [N] ({X} of {Y} areas completed). Resume from checkpoint?"

### Brownfield detection

Check for existing code in the project (look for `src/`, `app/`, `lib/`, `package.json`, `Cargo.toml`, etc.):

If existing code detected:
- "I see existing code. Want me to map the codebase first? This helps me understand what's reusable."
- **Map codebase** (recommended) — Spawn parallel agents to analyze stack, architecture, conventions, concerns. Write to `.planning/CODEBASE.md`.
- **Skip** — Proceed without mapping.

### Initial input

If `$ARGUMENTS` contains an idea, use it as seed. If blank: "What are we building?"

---

## Step 1: Interview — Vision Extraction

Read `references/interview-guide.md` before starting.

**Goal:** Extract enough clarity to write a SPEC and define requirements that downstream phases can act on without asking the user again.

**Read `references/interview-guide.md` for the questioning philosophy and question types.** It's the canonical source — apply it throughout this step. Don't re-derive the principles inline.

### Pre-written plan detection

If `$ARGUMENTS` is a multi-line block with structure (numbered lists, headings, "Phase 1 / Phase 2", or "Implement the following plan:"), the user already did the thinking. Offer:

> "This looks like a pre-written plan. Skip the interview and use it as SPEC?"

If yes: copy `$ARGUMENTS` verbatim into `.planning/builds/<slug>/SPEC.md` body, populate the frontmatter and Vision sections from context, then jump to Step 3 (Requirements). Don't re-derive what they already wrote.

### Mode signals

Parse the user's verb at the start of `$ARGUMENTS` to decide where to stop:

- **"take a look / scan / look into / audit / check / spec / scope"** → stop after SPEC. Don't proceed to roadmap. Print the SPEC and ask if they want more.
- **"draft / propose / sketch / mock"** → stop after roadmap. Don't enter the per-phase loop.
- **"apply / build / do / fix / ship / make it"** → full chain (default).
- **"plan"** → run through plan-phase for Phase 1, then stop.

If no verb is present, treat as default (full chain).

### Procedure

1. **Reflect back** for fuzzy or voice-input prompts. "So what I'm hearing is…" — gives the user a chance to correct without feeling interrogated.
2. **Apply interview-guide.md** to extract WHAT / WHY / WHO / DONE. Follow the thread; don't run a checklist.
3. **Surface gray areas proactively** in the user's described domain. Present as structured choices via AskUserQuestion (2-4 concrete options each). Categorize by domain (UI / API / content / org).
4. **Park scope creep.** "Great idea — parking that for later so we stay focused." Track in deferred ideas. Don't lose, don't act.
5. **Stop when WHAT / WHY / WHO / DONE are locked.** Don't over-interview.

**Output:** Write `.planning/builds/<name>/SPEC.md` using `templates/spec-template.md`.

After writing:
- If mode signal = stop-after-spec → present SPEC and stop.
- Otherwise: ask "Continue to requirements, or save the spec and stop?" Honor the answer.

---

## Step 2: Config

**If `--auto` is set:** skip the questions. Run `gsd-tools --build <slug> config init` — it writes the DEFAULTS (standard granularity, parallel execution, research+plan-check+verification all on). Proceed to research.

**Otherwise**, ask workflow preferences via AskUserQuestion (2 rounds):

**Round 1:**
1. **Granularity:** Coarse (3-5 phases, recommended for small projects) / Standard (5-8) / Fine (8-12)
2. **Execution:** Parallel (recommended) / Sequential

**Round 2:**
1. **Research:** Research domain before planning each phase? Yes (recommended) / No
2. **Plan-check:** Verify plans achieve goals before execution? Yes (recommended) / No
3. **Verification:** Verify outcomes after each phase? Yes (recommended) / No

Store in the build's `config.json` via the CLI. Respect throughout the build.

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

**Output:** Write the build's `REQUIREMENTS.md`. Update STATE.md.

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

## Step 4.5: Spike & Sketch (optional)

**Skip this step unless one of these is true:**
- `config.spike` is `true`
- SPEC contains design-heavy keywords ("explore", "variants", "directions", "options", "sketch", "prototype", "iterate")
- `$ARGUMENTS` explicitly says "spike", "sketch", or "explore three takes on …"

**Goal:** Run 2-3 parallel micro-experiments so the user picks a direction before the roadmap locks in.

**Read `references/spike-phase.md` for the full procedure.** Outline:

1. Identify 2-3 dimensions worth exploring (UI layout, data shape, flow, tech choice).
2. Spawn parallel spike agents. Each writes a sketch artifact to `.planning/spikes/NN-<slug>.html` (UI) or `.md` (architecture/data) plus `NN-<slug>-NOTES.md`.
3. Present variants via AskUserQuestion (single-select). User picks one, asks for more, or rejects all.
4. Lock the chosen direction in SPEC.md `## Locked Decisions` and `## Design Direction`. Roadmapper picks it up automatically.
5. Archive non-chosen spikes (don't delete — useful for retrospectives).

**If --auto:** Run spikes only if `config.spike: true`. Auto-pick the spike whose NOTES.md flags "what works" highest count and "what would be hard" lowest count. Log the choice.

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

**Read `references/discuss-phase.md` for the full procedure.** Outline:

1. Load prior context via `gsd-tools init phase <N>` (returns prior CONTEXT paths + locked decisions).
2. Scout codebase (read `.planning/CODEBASE.md` or targeted grep).
3. Identify 3-4 concrete gray areas for THIS phase.
4. Present via AskUserQuestion (multiSelect). With `--auto`, select all + recommended options.
5. Discuss each area (2-4 questions, concrete options, annotate with code context).
6. Track canonical refs whenever user cites a doc.
7. Checkpoint per area to `NN-DISCUSS-CHECKPOINT.json` for session resume.
8. Summarize, write `NN-CONTEXT.md` (canonical) + `NN-DISCUSSION-LOG.md` (audit trail).
9. Clean up checkpoint, navigate to plan phase.

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

**Plan-check** (if enabled in config): Spawn a **plan-checker agent** using the canonical prompt at `references/plan-checker-prompt.md`. The checker runs five verification dimensions (requirement coverage, task completeness, dependency correctness, key links, scope sanity) and returns a structured PASS/FAIL/NEEDS-REVISION report.

If `Overall: NEEDS REVISION` → feed the checker's report back to the planner verbatim, re-run planner, re-run checker. Max 3 iterations. After 3, present remaining issues to user.

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

After each agent completes, read SUMMARY.md (frontmatter + Deviations section only — don't pull the body into orchestrator context):

- **Significant deviations** (Rule 1 bug fixes affecting multiple files, Rule 3 plan-vs-reality mismatches that changed scope) → present to user via AskUserQuestion: "Continue / Roll back this plan / Split deviation into next phase". Don't silently absorb structural changes.
- **Minor deviations** (single-file Rule 1 fixes, Rule 5 gold-plate avoidance) → log only, don't interrupt.
- **Blockers** → surface immediately for user decision; don't proceed to next wave.
- **Notes for next phase** → carry forward into the next phase's CONTEXT.md `## Specific Ideas` section.

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

5. If FAILEDs: enter the **gap-closure loop**. Spawn one fix agent per FAILED truth (parallel), each with the specific gap and the artifact paths it must reach. After fix agents complete, re-verify. If still FAILED after 2 rounds, stop and present remaining gaps to user with `gaps_found: <count>` in VERIFICATION.md frontmatter — don't loop forever.

6. If all VERIFIED: phase complete. Update STATE.md. Mark REQ-IDs as verified in ROADMAP.md traceability.

7. **Deferred-ideas carousel** (milestone boundary): run `gsd-tools --build <slug> phase deferred` to scan all CONTEXT.md files. If `count > 0`, present the top 3-5 ideas via AskUserQuestion: **promote to next phase** / **keep deferred** / **drop**. Update the relevant CONTEXT.md `## Deferred Ideas` sections accordingly. Skip if count is 0.

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
- Always present explicit next steps with /clear recommendation between heavy phases.

(Execution-time rules — atomic commits, scope-creep parking, deviation handling — live in `references/execution-rules.md` and apply to executor agents, not the orchestrator.)

## Input

$ARGUMENTS
