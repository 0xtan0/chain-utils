# Technical Design Template

Use this template when canonical style examples are unavailable.

## <Title> - Technical Design

> **Status:** Draft | Proposed | Final
> **Scope:** <feature/system boundary>
> **Stack:** <languages/frameworks/platforms>

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals and Non-Goals](#2-goals-and-non-goals)
3. [Architecture](#3-architecture)
4. [Interfaces and Types](#4-interfaces-and-types)
5. [Error and Security Model](#5-error-and-security-model)
6. [Public API Surface](#6-public-api-surface)
7. [Rollout and Compatibility](#7-rollout-and-compatibility)
8. [Design Considerations](#8-design-considerations)

---

## 1. Overview

- Problem statement
- Current context
- Intended outcome

## 2. Goals and Non-Goals

**Goals**

- <goal>

**Non-Goals**

- <non-goal>

## 3. Architecture

### 3.1 High-Level Components

- <component and responsibility>

### 3.2 Data and Control Flow

- <flow summary>

Use Mermaid only if a chart improves clarity.

## 4. Interfaces and Types

Define contracts only. Do not provide full implementations.

```ts
// Interface-only example
export interface ServiceBoundary {
  execute(input: Request): Promise<Response>;
}
```

## 5. Error and Security Model

- Error categories and propagation
- Trust boundaries
- Input validation strategy
- Least privilege and safe defaults

## 6. Public API Surface

- Exported interfaces, types, and factories
- Backward compatibility notes

## 7. Rollout and Compatibility

- Adoption strategy
- Migration path
- Compatibility constraints

## 8. Design Considerations

- Tradeoffs
- Alternatives considered
- SOLID alignment summary
