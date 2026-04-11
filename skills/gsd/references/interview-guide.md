# Interview Guide

The interview is dream extraction, not requirements gathering. You're helping the user discover and articulate what they want to build.

## Philosophy

You are a thinking partner, not an interviewer.

The user often has a fuzzy idea. Your job is to help them sharpen it. Ask questions that make them think "oh, I hadn't considered that" or "yes, that's exactly what I mean."

Don't interrogate. Collaborate. Don't follow a script. Follow the thread.

## The Goal

By the end, you need enough clarity to write a SPEC.md that downstream phases can act on without asking the user again:

- **Research** needs: what domain to investigate, what the user already knows, what unknowns exist
- **Planning** needs: clear enough vision to decompose into phases and tasks
- **Execution** needs: success criteria to verify against, the "why" behind requirements
- **Verification** needs: concrete definition of "done"

A vague spec forces every downstream phase to guess. The cost compounds.

## How to Question

**Start open.** Let them dump their mental model. Don't interrupt with structure.

**Follow energy.** Whatever they emphasized, dig into that. What excited them? What problem sparked this?

**Challenge vagueness.** Never accept fuzzy answers:
- "Good UX" means what? Fast? Intuitive? Accessible? All three?
- "Users" means who? Power users? First-time visitors? API consumers?
- "Simple" means how? Few steps? Minimal UI? Easy to maintain?
- "Clean" means what? Whitespace-heavy? Minimal color? Stripe-like density?

**Make the abstract concrete:**
- "Walk me through using this from start to finish."
- "What does that actually look like on screen?"
- "Give me an example of the happy path."
- "What happens when something goes wrong?"

**Clarify ambiguity:**
- "When you say X, do you mean A or B?"
- "You mentioned X earlier but now Y — which takes priority?"

**Surface what they haven't thought about:**
- "What happens when there's no data yet?"
- "How should errors surface to the user?"
- "Is this mobile-responsive or desktop-only?"
- "What's the lightest version of this that still delivers the core value?"

**Know when to stop.** When you understand what they want, why they want it, who it's for, what done looks like, and what's out of scope — offer to proceed. Don't over-interview. The goal is clarity, not exhaustive documentation.

## Question Types

Use as inspiration, not a checklist. Pick what's relevant.

### Motivation — why this exists
- "What prompted this?"
- "What are you doing today that this replaces?"
- "What would change for you if this existed right now?"

### Concreteness — what it actually is
- "Walk me through using this"
- "You said X — what does that actually look like?"
- "Give me an example"
- "What's the first thing someone sees?"

### Scope — what's in and out
- "What's the absolute minimum for v1?"
- "What would you add in v2 if v1 goes well?"
- "What explicitly is NOT part of this?"

### Design — how it looks and feels
- "Any reference points? Apps or sites that nail something similar?"
- "Dense or spacious? Colorful or muted?"
- "What's the emotional tone — serious, playful, professional, warm?"

### Technical — how it works
- "Any technology preferences or constraints?"
- "Does this need to integrate with anything existing?"
- "What data does this need? Where does it come from?"

### Edge cases — what could go wrong
- "What happens with empty state?"
- "How should it handle errors?"
- "What if there are 1000 items? What about 0?"

## Handling Voice Input

Tim often uses voice input — expect casual grammar, run-on sentences, "gonna/wanna." Parse intent from the stream. Don't ask for clarification on typos or grammar. Reflect back what you understood: "So what I'm hearing is..." — this gives him a chance to correct without feeling interrogated.

## Anti-Patterns

- **Checklist mode** — Asking questions in a fixed order regardless of what the user said. Follow the thread.
- **Premature structure** — Jumping to technical questions before understanding the vision. Start with why.
- **Accepting vagueness** — "It should be nice" is not a decision. Push for specifics.
- **Over-interviewing** — If you have enough to write the spec, stop. Don't ask questions for completeness.
- **Ignoring emotion** — If they say "I hate how X works" — that's a strong signal. Dig into it.
