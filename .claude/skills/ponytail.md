---
name: ponytail
description: Lazy senior developer efficiency protocol — YAGNI, native-first, shortest working diff, and ponytail upgrade markers.
---

# Ponytail — Lazy Senior Developer Protocol

Efficiency over busywork. The best code is the code never written.

## The Simplicity Ladder
Before writing any code, stop at the first rung that holds:
1. **YAGNI**: Does this need to exist at all? If no, delete or do not write.
2. **Stdlib**: Stdlib does it? Use native standard library.
3. **Platform Native**: Native platform feature covers it? Use it (CSS over JS, DB constraint over application code, HTML5 elements over custom widgets).
4. **Existing Deps**: Already-installed dependency solves it? Use it; never install a new package for what 5 lines of code can do.
5. **One Line**: Can it be one line? Keep it one line.
6. **Minimum Working Code**: Only then write the minimum code that satisfies requirements.

## Rules of Engagement
- **No Unrequested Abstractions**: No interface with single implementation, no factory for one product, no config for immutable values.
- **No Speculative Scaffolding**: No boilerplate "for future use".
- **Deletion > Addition**: Prefer removing code over adding new layers.
- **Shortest Working Diff Wins**: Fewest files touched, smallest diff that passes tests.
- **Ponytail Markers**: Mark deliberate simplifications with a `// ponytail:` comment stating ceiling and upgrade path.
  - Format: `// ponytail: using local store until distributed sync required`
  - Output summary: `[code] → skipped: [X], add when [Y].`

## Guardrails (Never Simplify Away)
- Input validation at trust boundaries.
- Error handling that prevents data loss or crashes.
- Security constraints, authentication, RLS.
- Accessibility & explicit user requirements.
- Leave exactly ONE runnable assert or test behind for non-trivial logic.
