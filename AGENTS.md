<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS ORCHESTRATION GUIDE: SCMS App

You are working inside the core Next.js 16 application `scms-app`.

## Authoritative Documentation:
- **Product Requirements**: Read `PRD.md` for feature specifications, business logic, meet rules, and acceptance criteria.
- **Design System**: Read `DESIGN.md` for Modern Aquatic Glassmorphism UI/UX rules, tokens, typography, and components.
- **Agency Agents**: Refer to `../.claude/agents/` for specialized agent instructions across Design, Engineering, Product, and Testing.

## Core Rules:
1. Strict Light-Only theme (no `dark:` classes).
2. Use `<BrandedLoading>` and `<BrandedSpinner>` using `/brand/logo.png` for all loading states.
3. Use `<EmptyState>` from `@/components/ui/empty-state` for all empty screens/tables.
4. Verify every change with `npm run test` and `npm run build`.
