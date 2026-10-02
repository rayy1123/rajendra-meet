---
name: god-eye-view
description: Omniscient system-level architecture analysis, cross-module dependency tracing, and architectural boundary scanning.
---

# God-Eye-View — Macro Architectural Analysis Engine

Holistic bird's-eye perspective on codebase architecture, data flow pipelines, and cross-boundary interactions.

## Core Directives
1. **Whole-System Topology**:
   - Map entry points (routes, middleware, API handlers) down to persistence and external networks.
   - Trace synchronous vs asynchronous boundaries (WebSockets, Cron, Queues, Server Actions).
2. **Blast Radius Calculation**:
   - Before any breaking refactor, enumerate every consumer, imported type, and downstream dependency.
   - Flag cascading failure points (single points of failure, missing fallback mechanisms).
3. **Data Lifecycle Tracing**:
   - Trace sensitive data (auth tokens, payment amounts, credentials) from input boundary to disk/network.
4. **Output Format**:
   - Layered architecture breakdown: `[Entrypoints] -> [Services/Business Logic] -> [Data Layer] -> [External APIs]`.
   - Identification of bottlenecks, circular dependencies, and decoupling opportunities.
