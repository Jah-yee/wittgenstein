# 0019 Research-first development discipline — broad, borrowed, and implementation-facing

## Status

Accepted (governance lane per ADR-0014; ratifies the repo's research-first posture already visible across Briefs A–K, the active port guides, and the orchestration contract).

## Context

Wittgenstein is not a CRUD app where most engineering choices are local and reversible. The repo's value depends on choosing the right path before implementation hardens it into manifests, codec boundaries, tests, docs, and contributor habit.

That has already been true in practice:

1. **Broad path-choice research** shaped the repo's main decisions before code:
   - Brief A / G for image decoder path,
   - Brief I for audio decoder family,
   - Brief K for orchestration shape,
   - Brief E for benchmark/evaluation surface.
2. **Engineering-borrow research** determined concrete implementation practice:
   - Brief H for codec protocol engineering prior art,
   - Brief J for audio route architecture,
   - Brief D for CLI / SDK conventions.
3. **Implementation-facing investigation** has repeatedly been needed before a slice could land honestly:
   - `docs/research/m2-implementation-design-2026-04.md`,
   - `docs/research/2026-05-04-cold-checkout-verification.md`,
   - per-slice handoff briefs in `docs/handoff/`.

External harness practice points the same way. OpenAI's Symphony keeps workflow policy in-repo (`WORKFLOW.md`) so agent work is shaped by a versioned contract rather than session improvisation. Anthropic's harness-design writing makes the same underlying point from a different angle: strong execution depends on harness design and deliberate context shaping, not on telling the agent to "go code" and hoping the right architecture falls out.

The repo already says "read before write" and already has a research program, but it does not yet state the stronger cultural rule that many important tasks should be treated as **research first** rather than **code first**.

Without that rule, contributors under delivery pressure tend to do one of two bad things:

- implement the first plausible local solution without checking whether the object choice, architecture, or practice is already solved elsewhere;
- or perform ad hoc research but leave it in chat / PR context instead of converting it into a durable downstream surface.

This ADR makes the repo's intended posture explicit.

## Decision

1. **Research first is the default for non-local work.** Unless a task is a narrow bug fix, drift correction, already-ratified plumbing step, or small test/docs sync, contributors should assume the work needs some form of research before code.

2. **Wittgenstein recognizes three valid research shapes:**
   - **Broad research** — path choice, object study, decoder family selection, horizon scanning, benchmark framing, or thesis-adjacent background needed to choose a line of execution.
   - **Engineering-borrow research** — comparing mature repositories, libraries, frameworks, or docs to determine what practice to adopt, what not to copy, and where the local cut line should sit.
   - **Implementation-facing investigation** — a narrow research pass that resolves a concrete unknown inside an active slice (for example package choice, helper cut line, manifest receipt shape, or reproducibility probe design).

3. **The following work classes are presumptively research-first:**
   - decoder / backend / model-family selection,
   - external library or framework adoption,
   - benchmark / evaluation / quality-stack design,
   - shared contract changes (manifest, codec protocol, public semantics, determinism contract),
   - large structural refactors or package-boundary changes,
   - new modality lines,
   - any task whose stated goal is to approach best-in-class or state-of-the-art practice rather than merely restore correctness.

4. **Research-first does not mean "always write a broad brief."** The research surface should match the size of the question:
   - broad path choice -> brief,
   - engineering-borrow comparison -> brief or focused research note,
   - implementation-local unknown -> implementation memo, handoff brief, or issue note,
   - tiny local question -> targeted code/doc read may be enough.

   The point is not to maximize ceremony. The point is to ensure that non-local work does not skip the object-comparison / path-choice step.

5. **Necessary research should be as large as the question requires, but not a reviewer veto.** When the unknown is large — for example decoder-family selection, benchmark design, major architectural cut lines, or best-practice comparison across multiple external systems — contributors should do a correspondingly substantial research pass instead of rushing to code with a shallow scan. "Research first" is not satisfied by a quick vibe check when the decision surface is large. Size the pass by concrete signals: number of unranked external candidates, blast radius, reversibility cost, dependency/license risk, and whether the decision changes a public contract. Reviewers should ask for more research by naming the missing object comparison or decision risk, not by using "research first" as a generic veto.

6. **Every research pass must name its downstream surface and flow back into execution.** Research is only complete when it feeds a durable next object: issue, brief, RFC, ADR, exec-plan, agent guide, handoff brief, test plan, or code path. Chat-only research is not sufficient for repo memory. The expected motion is:

   ```text
   research -> durable artifact -> narrowed decision -> active execution surface
   ```

7. **Execution remains allowed without broad research when the decision is already ratified.** A contributor implementing an already-settled slice is not required to reopen the broad object study. Research-first in that case means doing the narrow investigation actually required by the slice, not relitigating doctrine.

## Consequence

- `docs/engineering-discipline.md` carries a short inline rule naming when research-first is expected and reminding contributors to leave durable downstream artifacts rather than chat-only reasoning.
- `WORKFLOW.md` tells maintainers and orchestrators to classify research-first issues before dispatch. If an issue depends on broad research or external-object comparison, the first deliverable should be the research artifact or decision note rather than code.
- `AGENTS.md` and `PROMPT.md` carry concise first-contact reminders so contributor agents do not mistake "high agency" for "jump straight to implementation."
- `docs/research/program.md` explicitly names the three research shapes and the repo's expectation that broad research, engineering-borrow research, and implementation-facing investigation all feed execution.
- `docs/research/briefs/README.md` clarifies when to write a brief versus a smaller implementation-facing note.
- This ADR does **not** create a third decision lane. Canonical decisions still land through the existing engineering or governance lanes. Research-first is the posture before those decisions and before non-local implementation, not a separate authority source.
