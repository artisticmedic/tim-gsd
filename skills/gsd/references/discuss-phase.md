# Discuss Phase (Gray Area Extraction)

Capture implementation decisions for THIS phase so planning agents never have to guess.

## 1. Load prior context

Run the CLI to get prior phases + locked decisions in one call:
```bash
node ~/.claude/gsd/gsd-tools.js --build <slug> init phase <N>
```
The JSON returns `prior_phases`, `current_phase`, and the paths of every CONTEXT.md that's already been written. Read what's relevant; don't re-ask what's already decided.

## 2. Scout codebase

If `.planning/CODEBASE.md` exists, read relevant sections. Otherwise, do targeted grep for terms related to the phase goal. Identify:
- Reusable assets (components, hooks, utilities)
- Established patterns (state management, styling, data fetching)
- Integration points (where new code connects)

## 3. Identify gray areas

Based on the phase goal, domain, prior decisions, and code context, generate 3-4 specific ambiguities that would change the implementation. NOT generic categories — concrete decisions for THIS phase.

Annotate each with context:
- Code: "You already have a Card component with shadow/rounded variants"
- Prior decisions: "You chose infinite scroll in Phase 2 — same here or different?"

**Score each gray area's confidence (1-5)** before presenting:
- **5** — Locked decision exists in prior CONTEXT or canonical refs. Don't surface unless user asks.
- **4** — Strongly hinted in SPEC + research. Surface as a confirmation, not an open question.
- **3** — Genuine ambiguity. Default discussion target.
- **2** — Multiple credible paths. Discuss with care.
- **1** — Unknown territory. May need a spike before discussion.

Persist scores into the checkpoint so `--auto` mode can skip 4s and 5s automatically.

## 4. Present gray areas

Use AskUserQuestion (multiSelect):
"Which areas do you want to discuss for [phase name]?"

User picks which to explore. Include a **"Skip discussion, use defaults"** option as the last choice — sometimes the prior CONTEXT and codebase scout already cover everything, and the user just wants to proceed without re-litigating decisions. If they pick it, write CONTEXT.md with current decisions only and skip steps 5-8.

**If `--auto`:** Auto-select ALL areas, auto-choose recommended option for each question. Log each choice.

## 5. Discuss each area

For each selected area, ask 2-4 targeted questions via AskUserQuestion:
- Options should be concrete, not abstract ("Cards" not "Option A")
- Annotate with code context ("reuses existing Card component — consistent with Messages")
- Include "You decide" when reasonable (captures Claude discretion)
- Each answer should inform the next question — follow the thread

## 6. Track canonical refs

When the user references a doc, spec, or ADR during any answer ("check the MCP spec", "read adr-014", "per browse-spec.md"):
- Read the referenced doc (or confirm it exists)
- Add it to a running `canonical_refs` list with full file path
- These user-referenced docs feed into CONTEXT.md for downstream agents — they're often the most important context

## 7. Checkpoint after each area

After each gray area is fully discussed, write a checkpoint:
`.planning/phases/NN-name/NN-DISCUSS-CHECKPOINT.json`

```json
{
  "phase": "N",
  "areas_completed": ["Area 1", "Area 2"],
  "areas_remaining": ["Area 3"],
  "decisions": { "Area 1": [{"question": "...", "answer": "..."}] },
  "confidence": { "Area 1": { "before": 3, "after": 5 }, "Area 2": { "before": 2, "after": 4 } },
  "canonical_refs": ["path/to/spec.md"],
  "deferred_ideas": ["..."]
}
```

After discussion, re-score the area's confidence (typically rises 1-2 points). Areas that don't move significantly are signals — either the question wasn't tight enough or the user has genuine indifference. Note the latter as "Claude's discretion" in CONTEXT.md.

This enables session resume if interrupted.

## 8. After all areas

Summarize decisions, ask "Ready to create context, or explore more gray areas?"

## 9. Write CONTEXT.md

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

## 10. Write DISCUSSION-LOG.md

(audit trail, not consumed by agents):
`.planning/phases/NN-name/NN-DISCUSSION-LOG.md`

For each area: options presented, what was chosen, user's notes. This is for the user to review later, not for agents.

## 11. Clean up checkpoint

CONTEXT.md is now canonical.

## 12. Navigation

```
Context captured for Phase [N].

Next: /clear then /build (resumes at Phase [N] planning)
Or: continue in this session to plan.
```
