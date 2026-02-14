---
name: split-design-into-pr-tasks
description: Break a technical design into small, reviewable implementation tasks that fit a single pull request each. Use when a user provides a design doc, architecture proposal, RFC, or feature plan and needs markdown task breakdowns with LLM-ready prompts, test-case descriptions, and a strict cap of 10 changed files per task.
---

# Split Design Into Pr Tasks

Produce a markdown implementation plan from a tech design, split into tiny PR-ready tasks.

## Workflow

1. Read the input design and list:
   - goals and non-goals
   - constraints and assumptions
   - major components affected
   - integration points and risks
2. Derive implementation slices that can be merged independently.
3. Enforce these hard limits for every task:
   - max 10 changed files
   - one coherent user-visible or platform-visible outcome
   - clear test scope with descriptive test cases
4. Order tasks by dependency:
   - foundations first (types/contracts/scaffolding)
   - core behavior next
   - polish, observability, and docs last
5. Emit output in markdown using `references/task-template.md`.

## Splitting Rules

- Prefer vertical slices over horizontal refactors.
- Keep migration/refactor work in dedicated tasks when it could hide regressions.
- Isolate risky changes (storage schema, API contract, security logic) into standalone tasks.
- If a task would exceed 10 files, split by:
  - feature flag boundary
  - component/module boundary
  - read path vs write path
  - backend contract vs frontend consumption
- Include a small assumptions section when design details are missing.

## Required Output Contract

For each task, include all sections from the template:
- `Title`
- `Goal`
- `Scope`
- `Files expected to change` (must be 10 or fewer)
- `Prompt` (for another LLM; include context, exact work, expected deliverables)
- `Test cases` (descriptions only, no code)
- `Acceptance criteria`
- `Out of scope`
- `Dependencies`

Reject incomplete output. If any task misses `Prompt` or `Test cases`, rewrite before returning.

## Quality Checks Before Returning

- Verify each task can be reviewed in one PR without cross-task hidden coupling.
- Verify every task has explicit, testable acceptance criteria.
- Verify test cases cover happy path, failure path, and regression-sensitive behavior.
- Verify all tasks are in markdown and consistently formatted.
