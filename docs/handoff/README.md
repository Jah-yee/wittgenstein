# Handoff briefings

Self-contained briefings for picking up a single bounded slice of work cold. Each file is the **only** doc the contributor / agent needs to read to land that slice.

A handoff doc is **not** a brief, RFC, ADR, or exec-plan. It is the executable summary that points at all four. When the slice ships, the handoff doc closes (move to `archive/` or delete; the underlying briefs / ADRs / exec-plans remain canonical).

## How `WORKFLOW.md` consumes this surface

[`WORKFLOW.md`](../../WORKFLOW.md) §4 (the prompt template) auto-loads the matching handoff brief for an issue if one exists at `docs/handoff/<slice>.md`. That makes per-issue context self-contained: the agent reads the handoff brief and stops.

If the issue does not have a matching handoff brief, the agent falls back to `AGENTS.md` + `docs/engineering-discipline.md` + the issue body alone.

## Current handoffs

- [`workflow-md-spec.md`](workflow-md-spec.md) — Symphony-shaped `WORKFLOW.md` orchestration contract. **Closed**: the WORKFLOW.md it specified now lives at the repo root (ratified by ADR-0017).

## When to add a handoff

- The slice has clear inputs (briefs / ADRs / prior PRs) and clear acceptance gates.
- Multiple contributors / agents may pick it up; the briefing should not assume conversational context.
- Adding the doc costs less than re-explaining the slice in three issue comments.

When in doubt, do **not** add a handoff doc — the issue body should be enough. Handoff docs exist for the cases where the issue body would balloon past the point of being skimmable.
