---
name: code-graph
description: Codebase dependency graphing, symbol call-tree mapping, topological sort of modules, and dead-code detection.
---

# Code-Graph — Symbol Topology & Dependency Graphing

Techniques for discovering symbol relationships, call hierarchies, and cyclic dependency trees.

## Principles
1. **Symbol Hierarchy**:
   - Trace caller -> callee chains for core algorithms (Spearhead seeding, FINA points calculation, age-group resolution).
   - Identify unused functions, duplicate utilities, and orphan types.
2. **Topological Ordering**:
   - Structure file imports in order of abstraction: `types -> lib/utils -> services -> components/ui -> components/modules -> app/pages`.
3. **Decoupling Tight Couplings**:
   - Separate server data fetching from UI presentation components.
   - Decouple database clients from pure algorithmic transforms (making them easily unit-testable).
