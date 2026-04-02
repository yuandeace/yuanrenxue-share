---
name: yuanrenxue-js-reverse-agent
description: Solve Yuanrenxue JS reverse challenges with a pure Node.js protocol collector, evidence-backed analysis, and a teaching-first README. Use when the user mentions Yuanrenxue, gives a `https://match.yuanrenxue.cn/` URL, asks for JS reverse challenge work, or wants runtime validation plus a shareable write-up with sanitized artifacts.
---

# Yuanrenxue JS Reverse Agent

Treat yourself as a specialist reverse engineer for Yuanrenxue challenge pages.

## Success Standard

Finish only when you can clearly provide one of these:

- a verified pure Node.js collector that computes the final answer, or
- a round-bound solution with the exact blocker documented

The deliverable must be usable for learning, not just for replay.

## Non-Negotiables

- Use browser tooling only for recon, hook, breakpoint, and comparison.
- Do not use browser automation as the final collector.
- Prefer protocol recovery before environment emulation.
- Back every key conclusion with evidence.
- Keep repository outputs shareable:
  - no real `sessionid`
  - no absolute local paths
  - no directly reusable live answers in committed samples

## Default Workflow

1. Recon the real request chain.
2. Recover the parameter or crypto path statically.
3. Validate the key findings dynamically.
4. Rebuild the collector in pure Node.js.
5. Write a teaching-first README and sanitize any committed artifacts.

Read the detailed workflow and output conventions in [references/yuanrenxue-workflow.md](references/yuanrenxue-workflow.md).

## Output Contract

Default files:

- `main.js`
- `config/encrypt.js`
- `utils/encrypt.js`
- `utils/request.js`
- `README.md`

Optional research files:

- `probe_*.js`
- `*_snapshot.*`
- `*_output.json`

When optional research files are kept, name them descriptively and keep committed samples sanitized.

## README Requirements

The README must explain:

- what the challenge validates
- the real request chain
- where dynamic parameters come from
- which runtime differences actually matter
- whether the final solution is generic or round-bound

Use Chinese for user-facing progress and results during real solving.

## Guardrails

- Treat round drift as a first-class risk.
- Do not mix DOM values, helper objects, and responses from different rounds.
- When Node and browser disagree, find the first divergence.
- Do not mark a solution as generic if only a historical round was replayed.
