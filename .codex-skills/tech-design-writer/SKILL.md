---
name: tech-design-writer
description: Write technical design documents in Markdown with sectioned structure, interface-first specs, SOLID and secure-by-design principles, and Mermaid diagrams when charts are needed; use for architecture proposals, RFCs, API/data model designs, and system design docs.
---

# Tech Design Writer

Write complete technical design documents with consistent structure and explicit architecture decisions.

## Hard Constraints

### NEVER

- Do full implementations.
- Write tests or test cases.
- Cite unverified sources.

### ALWAYS

- Use Markdown format.
- Divide the design into clear sections.
- Use Mermaid when charts are needed.
- Prioritize SOLID design principles.
- Enforce secure-by-design practices.

## Workflow

1. Identify the problem, scope, constraints, and success criteria from user input and repository context.
2. Load canonical style from `/Users/federicocavazzoli/Documents/wonder/chain-utils/.designs/erc20/TECH_DESIGN.md`.
3. Mirror the canonical structure and writing style when that file exists.
4. If canonical style file is missing, use `references/design-template.md`.
5. Define architecture at a high level with interface definitions and concise, non-implementation examples only.
6. Use Mermaid only when a chart clarifies architecture, flow, or dependencies.
7. Run the quality checks in `references/quality-gates.md` before finalizing output.

## Output Contract

Every output must include:

- Problem statement or overview
- Goals and non-goals
- Constraints and assumptions
- High-level architecture
- Interfaces and types
- Error and security model
- Public API surface
- Rollout and compatibility or migration considerations
- Design considerations and tradeoffs

Explicitly exclude:

- Full code implementations
- Test or test-case sections

## References

- Structure template: `references/design-template.md`
- Canonical style mapping: `references/style-rules.md`
- Final quality checks: `references/quality-gates.md`
