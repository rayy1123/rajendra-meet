---
name: ecc
description: Enterprise Code Craft — strict code consistency, robust error boundaries, zero-regression guarantees, and production durability.
---

# ECC — Enterprise Code Craft Standard

High-discipline engineering standard for production systems where data integrity and uptime are non-negotiable.

## Pillars of Craft
1. **Zero-Regression Mandate**:
   - Every modified feature must maintain 100% test passing rate (`npm test`) and zero compilation errors (`npm run build`).
2. **Defensive Boundaries**:
   - Validate and sanitize external input at runtime (Form input, URL search params, JSON payloads).
   - Enforce database transaction atomicity and row-level security constraints.
3. **Auditability & Logging**:
   - Critical mutations (financial approvals, race results modification, account role changes) must write structured audit entries.
4. **Resilience & Fallbacks**:
   - Fall back to local verified stores or cached responses when upstream cloud services experience transient rate-limits.
