# Task <N>: <Short actionable title>

## Goal
<One sentence describing the outcome of this task.>

## Scope
- <What is included>
- <Keep scope tight and PR-reviewable>

## Files expected to change (max 10)
1. `<path/to/file-1>` - <reason>
2. `<path/to/file-2>` - <reason>

## Prompt
Use this prompt when delegating implementation to another LLM:

```text
You are implementing Task <N>: <title> in an existing codebase.

Context:
- <Key business/technical context from the design>
- <Important constraints>
- <Relevant modules and interfaces>

What to do:
1. <Implementation step 1>
2. <Implementation step 2>
3. <Implementation step 3>

Expected output:
- <Code changes expected>
- <Tests to add/update>
- <Any docs/config updates required>

Constraints:
- Change no more than 10 files.
- Keep backward compatibility unless explicitly stated otherwise.
- Do not include unrelated refactors.
```

## Test cases (descriptions only)
1. <Happy path behavior>
2. <Failure or validation behavior>
3. <Regression-sensitive scenario>

## Acceptance criteria
- <Measurable condition 1>
- <Measurable condition 2>

## Out of scope
- <Explicit non-goals for this task>

## Dependencies
- Depends on: <Task IDs or "None">
- Blocks: <Task IDs or "None">
