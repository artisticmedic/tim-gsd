# Spike & Sketch Phase

Optional phase between SPEC and ROADMAP. Runs 2-3 parallel micro-experiments before committing to a single roadmap. Use when the user wants to explore implementation directions before locking in scope.

## When to run

- Config flag `spike: true` is set, OR
- SPEC contains design-heavy keywords ("explore", "variants", "directions", "options", "sketch", "prototype", "iterate"), OR
- User explicitly says "spike", "sketch", or "explore three takes on …" in `$ARGUMENTS`.

Otherwise skip. Default for greenfield builds is off — spikes add 5-10 minutes of agent time and are wasted on simple builds.

## Procedure

### 1. Identify spike candidates

From SPEC and REQUIREMENTS, surface 2-3 dimensions worth exploring before committing. Examples:
- A UI screen with 3 layout candidates (sidebar, top-nav, command-palette)
- A data shape choice (relational vs document vs graph)
- A flow choice (modal vs inline vs full-page)
- A tech choice (server-side render vs client islands)

Each candidate gets one spike agent.

### 2. Spawn parallel spike agents

Use the Agent tool to spawn 2-3 agents in parallel. Each gets:

```
You are a spike agent for a Get Stuff Done build. Your job is rapid feasibility exploration — produce a tangible artifact that the user can compare against alternatives, not a finished implementation.

Read: `.planning/builds/<slug>/SPEC.md`, `.planning/builds/<slug>/REQUIREMENTS.md`.

Your spike:
- **Direction:** [direction name — e.g. "Sidebar-first inbox layout"]
- **Hypothesis:** [what this direction optimizes for]
- **Constraints:** [what to keep simple vs. what to actually demo]

Produce:
1. A single HTML file at `.planning/spikes/NN-<slug>.html` with the variant rendered (UI spikes) OR a markdown sketch at `.planning/spikes/NN-<slug>.md` with structure + tradeoffs (architecture/data spikes).
2. A `.planning/spikes/NN-<slug>-NOTES.md` with: what works, what would be hard to scale, what surprised you, what the next step would be if this direction wins.

Do not implement production code. Do not add tests. Do not extend scope. This is a sketch — quality bar is "Tim can compare it" not "Tim can ship it".

Write to disk and return a 3-line summary.
```

### 3. Present variants to user

After all spikes complete, present via AskUserQuestion (single-select):

"Three takes on [the question]. Pick the direction that feels right — we'll feed it into the roadmap."
- [Direction 1 name] — [one-line hypothesis] (`spikes/NN-1.html`)
- [Direction 2 name] — [one-line hypothesis] (`spikes/NN-2.html`)
- [Direction 3 name] — [one-line hypothesis] (`spikes/NN-3.html`)
- "More variants — generate 2 more in different directions"
- "None of these — talk me through what you saw and we'll re-spike"

If user picks "more variants", spawn 2 fresh spike agents with new directions informed by what was rejected. Loop max twice (don't let spike-mode run forever).

### 4. Lock the chosen direction

Update SPEC.md `## Locked Decisions` with `D-NN: Chose [direction name] from spike NN-<slug>. Rationale: [user's note].`

Append to SPEC.md `## Design Direction`:
- Reference points: `.planning/spikes/NN-<slug>.html` (canonical)

The roadmapper agent reads SPEC.md as it always does and picks up the locked direction. No special wiring needed.

### 5. Archive non-chosen spikes

Don't delete — they're useful for retrospectives and future "what if we tried" moments. Keep them at `.planning/spikes/`.

## Artifact format — spike-NOTES.md

```markdown
# Spike: [Direction Name]

**Hypothesis:** [What this direction optimizes for]
**Outcome:** chosen | not-chosen | pending

## What works
- [Concrete observation]

## What would be hard
- [Friction point]

## What surprised
- [Unexpected finding]

## Next step if this wins
- [What the first roadmap phase would do]
```

## Honest tradeoffs

- Spikes cost 5-15 minutes of parallel agent time + your decision time. Don't run them on builds that are already obvious.
- Spike artifacts are throwaway sketches, not partial implementations. Resist the urge to "just clean up the chosen one and use it" — that often imports half-baked code into the build. Re-implement properly in the execute phase.
- If two spikes look equivalent, lean on the one that makes the simplest first roadmap phase.
