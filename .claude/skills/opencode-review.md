---
name: opencode-review
description: Open-source grade deep adversarial code review, type safety verification, vulnerability auditing, and performance profiling.
---

# OpenCode-Review — Deep Adversarial Review Standard

Rigorous review standard inspired by Linux kernel and high-impact open-source systems.

## Review Matrix
1. **Correctness & Edge Cases**:
   - Off-by-one errors in loops, slices, pagination, and date comparisons.
   - Nullable/undefined checks across database joins and external JSON parses.
   - Race conditions, concurrent writes, and idempotency key enforcement.
2. **Type Safety & Schema Integrity**:
   - Zero `any` casting unless isolating third-party runtime inconsistencies.
   - Exhaustive union switch statements (`never` default branch).
3. **Security & Data Sanitization**:
   - SQL/PostgREST injection protection, XSS escaping in template strings.
   - Authorization checks at the server action / route handler boundary (never trust client state).
4. **Performance & Memory**:
   - Eliminate N+1 queries by batching or joining.
   - Wrap heavy client calculations in `useMemo` / `useCallback`.
   - Prevent memory leaks in event listeners, WebSockets, and timers (`clearInterval` on unmount).
