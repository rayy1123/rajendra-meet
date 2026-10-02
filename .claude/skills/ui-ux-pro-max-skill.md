---
name: ui-ux-pro-max-skill
description: Elite UI/UX engineering — high-end aquatic glassmorphism, 60fps micro-interactions, mobile-first responsive layout, and polished typography.
---

# UI/UX Pro Max — Elite Interface Design Standard

World-class visual craftsmanship adhering strictly to the *Modern Aquatic Glassmorphism* design system.

## Visual & Interaction Standards
1. **Light-Only Translucency**:
   - Translucent frosted glass panels (`.glass-panel`, `.glass-card`) with crisp sub-pixel borders (`border-[var(--m-border)]` / `border-slate-200`).
   - Strict light-only theme: No dark mode regressions, no muddy gray backgrounds.
2. **Typography & Data Legibility**:
   - High-contrast slate typography (`text-[var(--m-ink)]`, `text-slate-900`) with clear hierarchy.
   - Numerical data, seed times, stopwatch timings, and ranking numbers must use `tabular-nums font-mono font-bold`.
3. **Micro-Interactions & Transitions**:
   - Tactile hover feedback (`hover:-translate-y-0.5 hover:shadow-pop transition-all duration-200`).
   - Smooth dialog/modal entries (`animate-in fade-in zoom-in-95`).
4. **Mobile Touch Ergonomics**:
   - Touch targets >= 44x44px for touchscreens.
   - Adaptive grids (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/4`) without horizontal overflows.
