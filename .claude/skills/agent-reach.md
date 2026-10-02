---
name: agent-reach
description: Multi-agent coordination, tool orchestration across distributed environments, subagent routing, and remote API reaching.
---

# Agent-Reach — Distributed Agent Coordination & Tool Outreach

Protocol for orchestrating subagents, parallel workflows, and cross-session delegation.

## Core Rules
1. **Parallel Tool Dispatching**:
   - Dispatch independent tool calls in parallel within a single turn to minimize wall-clock latency.
   - For interdependent chains, execute sequentially and validate intermediate output before proceeding.
2. **Subagent Specialization & Delegation**:
   - Fork context for heavy research or multi-file inspections to keep the main conversation lean.
   - Summarize subagent findings tersely; relay only actionable decisions and diffs.
3. **External Reach & API Resilience**:
   - Implement graceful fallbacks for external network calls (Brevo SMTP, Supabase REST, Redis cache).
   - Never let a failed auxiliary service crash core user workflows.
