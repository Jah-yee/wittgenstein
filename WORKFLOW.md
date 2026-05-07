---
# Wittgenstein orchestration workflow contract.
#
# Symphony-spec-shaped (https://github.com/openai/symphony/blob/main/SPEC.md).
# We adopt the contract; the runtime stays unspecified.
#
# Ratified by ADR-0017. Verdict and rationale: docs/research/briefs/K_orchestration_prior_art.md.
# Tracked in: Issue #146. Handoff brief: docs/handoff/workflow-md-spec.md.

tracker:
  kind: github-issues
  repo: p-to-q/wittgenstein
  active_states: [open]
  terminal_states: [closed]
  agent_eligible_labels: [enhancement, bug]
  agent_excluded_labels: [tracker, discussion, horizon-spike, blocked]

polling:
  interval_ms: 60000

workspace:
  root: ~/wittgenstein_workspaces
  per_issue_subdir_pattern: "issue-{identifier}"
  name_charset: "[A-Za-z0-9._-]"

agent:
  max_concurrent_agents: 2
  max_turns: 30
  max_retry_backoff_ms: 300000
  stall_timeout_ms: 600000

hooks:
  before_run: |
    pnpm install --frozen-lockfile
    git fetch upstream main
  after_run: ""
  before_remove: ""
  timeout_ms: 120000

runtime:
  kind: unspecified-at-v0.3
  candidates: [symphony, github-actions, bash]
---

# Wittgenstein orchestration workflow

Wittgenstein is a multimodal harness with strong reproducibility and review-discipline contracts. This file defines the **agent-dispatch contract** an orchestrator (Symphony, GitHub Actions, or hand-rolled) must respect when running coding agents against open GitHub issues.

It is the contract; the runtime is **unspecified at v0.3**. Until issue volume crosses ~50 simultaneous open or a contributor opens an RFC, the file is consumed by humans pairing with Codex / Claude Code / etc. by hand.

The shape borrows from [OpenAI Symphony](https://github.com/openai/symphony/blob/main/SPEC.md) (Apache-2.0). Verdict and rationale live in [Brief K](docs/research/briefs/K_orchestration_prior_art.md), ratified by ADR-0017. Adopting the contract — not the runtime — is a deliberate scale choice (Brief K §K.2).

---

## 1. `tracker` — what counts as agent-eligible work

GitHub Issues is the source of truth. An open issue is **agent-eligible** iff it carries at least one label in `agent_eligible_labels` and **no** label in `agent_excluded_labels`.

The exclusion list is load-bearing. Each excluded label has a semantic contract per [`docs/labels.md`](docs/labels.md) (ratified by ADR-0012) that auto-dispatch would violate:

- `tracker` — issue waits on a named external event (e.g. Brief A H3 / Issue #109 waiting on a usable-license LFQ-family decoder release). Auto-running ignores the gating event.
- `discussion` — issue is the deliberation; outcome should be a brief, RFC, or spike, not a code change. Auto-running short-circuits the deliberation.
- `horizon-spike` — issue is a Brief-C hypothesis turned into a time-boxed experiment. Time-boxing is a human responsibility; auto-running it as a normal task discards the kill-criteria framing.
- `blocked` — issue cites an internal blocker. Auto-running is a no-op until the blocker resolves; spinning agents wastes runs.

An orchestrator that does not honor this list is non-conformant.

Queue labels introduced by ADR-0019 (`priority/*`, `size/*`, `stage/*`) are
triage metadata only. They may help an orchestrator rank work, but they never
make an issue agent-eligible and they never override the exclusion list.

## 2. `polling` — how often to look

`interval_ms: 60000` (1 minute). Symphony's default is 30s; ours is 60s because the repo's commit cadence already produces multiple events per minute and a faster poll buys nothing.

## 3. `workspace` — per-issue isolation

Every agent run gets a per-issue isolated workspace under `workspace.root`. The Symphony safety invariant is preserved verbatim: workspace path **must stay inside `workspace.root`** after path normalization, and the per-issue subdirectory name is restricted to `[A-Za-z0-9._-]`.

The `per_issue_subdir_pattern` is `issue-{identifier}` where `{identifier}` is the GitHub issue number (e.g. `issue-116`). Agents may use `git worktree` for parallel branch isolation per the existing `docs/engineering-discipline.md` worktree pattern.

## 4. `prompt_template`

The orchestrator substitutes the following template per dispatched issue. Variables follow the Symphony Liquid-style shape; the auto-load list is Wittgenstein-specific.

```liquid
You are running on issue {{ issue.identifier }}: {{ issue.title }}.

Labels: {{ issue.labels | join: ", " }}
Attempt: {{ attempt }}
Prior runs: {{ prior_run_summaries }}   # placeholder at v0.3; see Brief K §K.4 for the v0.4 journal plan

Read these files in order, then stop:

1. AGENTS.md — vendor-neutral primer + locked vocabulary + two-decision-lane summary
2. docs/engineering-discipline.md — operating manual (read-before-write, smallest-effective-change, no-drive-by-refactor, etc.)
3. {{ handoff_brief_path }} — if a matching handoff brief exists at docs/handoff/<slice>.md, this is the only doc you need beyond the issue body; its "Reads (in order, then stop)" section overrides this template's read order
4. docs/exec-plans/active/codec-v2-port.md §M{N} — if the issue title matches an M-phase pattern (e.g. "[M2] ..."), read the matching milestone section; otherwise skip

Issue body follows.

---

{{ issue.body }}

---

When you finish, follow the Reporting section of docs/engineering-discipline.md.
Open the PR per the standard branch / PR conventions (Engineering lane: Brief → RFC → ADR → exec-plan → code).
```

The handoff-brief auto-discovery rule (`docs/handoff/<slice>.md`) is the load-bearing piece: when an issue has a paired handoff brief, that brief is the only doc the agent needs beyond the issue body. This makes per-issue context self-contained and survives orchestrator changes.

## 5. `agent` — concurrency, turn budget, retry policy

```yaml
max_concurrent_agents: 2 # matches the maintainer pair in CODEOWNERS
max_turns: 30 # generous for codec ports, tight for refactors
max_retry_backoff_ms: 300000 # Symphony default — 5 minutes
stall_timeout_ms: 600000 # 10 minutes — single-step turns can be slow on cold checkouts
```

**Why 2 concurrent agents:** review capacity is the binding constraint, not compute. We have 2 maintainers per CODEOWNERS; review-vs-execution backpressure should match. If maintainer count grows, this number grows; not before.

**Why 600 s stall timeout:** the cold-checkout verification (PR #127, 2026-05-04) measured 40 s for a fresh `pnpm install + typecheck + lint + test`. Adding a single substantive turn brings that to multi-minute territory; 10 minutes is the right threshold for "definitely stalled, not just slow."

## 6. `hooks` — pre/post-run discipline

```yaml
before_run: |
  pnpm install --frozen-lockfile
  git fetch upstream main
after_run: ""
before_remove: ""
timeout_ms: 120000
```

`before_run` ensures every agent run starts from a clean install and a fresh upstream main. This closes the "stale fork" failure mode that the cold-checkout audit caught in PR #127 (where fork drift caused an absolute-path leak).

`after_run` is intentionally empty. Per Symphony's spec boundary: **the orchestrator does not mutate PRs.** Ticket writes, PR transitions, conflict resolution, and CI watching live with the agent's own tooling, not orchestrator business logic. This matches our existing discipline (Codex / Claude Code agents drive their PRs themselves; the orchestrator only dispatches).

## 7. `runtime` — deliberately unspecified at v0.3

```yaml
kind: unspecified-at-v0.3
candidates: [symphony, github-actions, bash]
```

The contract above is what matters. The orchestrator runtime is a separate adoption decision deferred to v0.4 or later. Recommended evaluation triggers:

- **Issue volume crosses ~50 simultaneously open** — at our current 16 open, the polling-and-reconciliation loop pays for itself only if there is a real queue. Below the threshold, a human dispatching by hand to Codex / Claude Code is cheaper than the orchestrator.
- **A contributor opens an RFC for a specific runtime** — the choice goes through the engineering lane. Until then, the contract stands and the runtime is the consumer's choice.

If you are pairing with an agent today, **you** are the orchestrator. The contract above is what you owe the agent (correct workspace, correct prompt template, correct retry policy if it stalls). It is also what the agent owes the repo (no PR mutation rules outside the agent's own tooling, no auto-dispatch on excluded labels).

---

## What this file is not

- Not a runtime. There is no daemon, no service, no scheduled job consuming this file at v0.3.
- Not an exhaustive agent prompt. The prompt template above is the smallest correct briefing; the agent then reads `AGENTS.md`, `docs/engineering-discipline.md`, and the matching handoff brief.
- Not a doctrine override. Brief → RFC → ADR → exec-plan → code (engineering lane) and `(Governance Note →) ADR → inline summary` (governance lane) per ADR-0014 still govern what changes the agent can make.
- Not a credential surface. Per Brief K §K.5, orchestrator-level credential isolation is a v0.4 MCP concern; this file does not specify it.

## Cross-references

- [Brief K](docs/research/briefs/K_orchestration_prior_art.md) — verdict, primitive mapping, kill criteria.
- [docs/handoff/workflow-md-spec.md](docs/handoff/workflow-md-spec.md) — the handoff brief that drove this file.
- [docs/labels.md](docs/labels.md) — semantic contract for the exclusion list.
- [docs/exec-plans/active/codec-v2-port.md](docs/exec-plans/active/codec-v2-port.md) — M-phase reference for the auto-load rule in §4.
- [ADR-0013](docs/adrs/0013-independent-ratification-for-doctrine-prs.md) — independent-ratification rule (this file's amendments are doctrine-bearing).
- [ADR-0014](docs/adrs/0014-governance-lane-for-meta-process-doctrine.md) — governance lane this file landed through.
- [ADR-0017](docs/adrs/0017-orchestration-workflow-contract.md) — ratification ADR for this contract.
