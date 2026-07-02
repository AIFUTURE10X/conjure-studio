---
name: frugal
description: Cost-saving build workflow — plan and review on the top model, delegate mechanical implementation to cheaper subagents (Sonnet/Haiku). Use when the user invokes /frugal with a task, or asks to "do this cheaply" / "delegate the mechanical parts". Skips delegation for small tasks where agent overhead would cost more than it saves.
---

# Frugal build workflow

Run the task described in the arguments using the cheapest model mix that
doesn't sacrifice correctness. The main conversation model (the expensive
one) does the thinking; cheap subagents do the typing.

## Step 0 — size the task first

Estimate the scope before delegating anything:

- **Small** (1–3 files, < ~150 changed lines, no new components): do it
  directly in the main loop. Spawning agents would cost more than it saves.
  Say so in one sentence and just do the work.
- **Medium/large** (new feature, multi-file wiring, repetitive edits across
  many files, big refactor): use the delegation workflow below.
- **Pure search/sweep** (find all X, list usages, audit): delegate straight
  to a `haiku` agent; no spec needed.

## Step 1 — investigate and spec (main model)

- Read the integration points yourself: existing patterns to mirror, state
  management, API contracts, naming/style rules (CLAUDE.md files).
- Write a precise implementation spec: exact file paths to create/modify,
  props/signatures, data flow, project rules the agent must follow, and the
  verification command (build/typecheck/tests).
- The spec must be self-contained — the agent starts with zero context.
  Paste in the relevant repo rules; never assume the agent can see this
  conversation.

## Step 2 — delegate implementation (cheap agents)

- Spawn a `general-purpose` agent with `model: sonnet` for implementation
  work. Use `model: haiku` for pure search, inventory, or fully mechanical
  find-and-replace-style sweeps.
- Always include in the prompt: the full spec, the reference files to read
  first, the project's style rules, the verification command to run and fix
  until green, "do NOT commit", and "return raw data: files changed, build
  result, deviations".
- Independent workstreams may run as parallel agents; keep agents off the
  same files unless isolated.

## Step 3 — review and verify (main model)

Never ship agent output unreviewed — this is where the top model earns its
cost:

- Read the diff of every changed file. Look for copied-in bugs, subtle
  logic errors, and spec drift — not just style.
- Run the verification yourself (build/typecheck/tests). If the change has
  a runtime surface, exercise it for real when the environment allows
  (dev server + Playwright with mocked externals).
- Fix small issues directly; send big misses back to the agent with
  specific corrections.

## Step 4 — finish

- Commit with a clear message and push per the repo's conventions.
- Report to the user: what was done directly vs delegated, what the review
  caught (if anything), and how the work was verified.

## Cost rules of thumb

- Exploration and mechanical edits burn most of the tokens — that's what
  gets delegated. Judgment (spec, review, tricky algorithms) stays on the
  main model.
- One well-specced agent beats three vague ones; a rewritten spec is
  cheaper than a re-run.
- If the user gives a budget hint ("quick and cheap"), bias to smaller
  scope, not skipped review.
