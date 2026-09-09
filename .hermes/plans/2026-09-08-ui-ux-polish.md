# SCMS UI/UX Polish Plan

> **For Hermes:** Use opencode skill + manual patches to implement this plan task-by-task.

**Goal:** Rapihkan konsistensi UI/UX SCMS: mobile menu menjadi sidebar/drawer yang konsisten, light theme di semua halaman, spacing seragam, header jelas, dan live/scoreboard lebih nyaman dibaca.

**Architecture:** Fokus pada komponen layout yang sudah ada (`LandingShell`, `PublicShell`, `DashboardLayout`, `LandingDrawer`). Tidak ubah struktur routing atau data fetching yang sudah ada.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui, lucide-react.

---

## Phase 1: Mobile Navigation Consistency
### Task 1.1: Update LandingDrawer to auth-aware sidebar
**Objective:** Drawer mobile menampilkan menu publik + auth actions yang sesuai login state, dengan satu tombol menu di header.

**Files:**
- Modify: `src/components/layout/landing-nav.tsx`
- Modify: `src/components/layout/public-shell.tsx`
- Modify: `src/components/layout/landing-shell.tsx`

**Changes:**
1. `LandingDrawer` accepts `authActions` slot and renders it in drawer footer.
2. Remove inline auth actions from mobile header in both shells.
3. Add divider and label "Akun" before auth actions in drawer.

### Task 1.2: Standardize drawer width and animation
**Objective:** Drawer mobile konsisten di semua shell.

**Files:**
- Modify: `src/components/layout/landing-nav.tsx`

**Changes:**
1. Use `w-[82vw] max-w-[320px]` for drawer.
2. Add transition-transform for smoother open/close.

---

## Phase 2: Dashboard Pages Light Theme Cleanup
### Task 2.1: Events page glassmorphism
**Objective:** Ganti Card biasa menjadi glass-panel di events page.

**Files:**
- Modify: `src/app/(dashboard)/events/page.tsx`

**Changes:**
1. Remove `Card` import.
2. Use `glass-panel` for event cards.
3. Standardize button styles: primary = `bg-[var(--m-aqua)] text-white`, secondary = `border border-[var(--m-border)] bg-white`.

### Task 2.2: Event detail page spacing
**Objective:** Rapikan spacing dan breadcrumb di event detail.

**Files:**
- Modify: `src/app/(dashboard)/events/[id]/page.tsx`

**Changes:**
1. Move breadcrumb before PageHeader.
2. Use `space-y-5` consistently.
3. Button group uses consistent rounded-xl and gap-3.

### Task 2.3: HeatLane page consistency
**Objective:** Samakan header dan table styling dengan pola dashboard lain.

**Files:**
- Modify: `src/app/(dashboard)/heat-lane/page.tsx`

**Changes:**
1. Move Breadcrumb before PageHeader.
2. Table header uses `bg-[var(--m-soft)]`.
3. Status badges use consistent aqua tokens.

---

## Phase 3: Public Pages Header Consistency
### Task 3.1: Scoreboard page event info
**Objective:** Tampilkan info event terpilih dengan jelas sebelum board.

**Files:**
- Modify: `src/app/scoreboard/page.tsx`

**Changes:**
1. Event info block with label, name, date/location.
2. RouteEventSelect aligned to right on desktop.
3. Lane/pool chips below selectors.

### Task 3.2: Live page selector layout
**Objective:** Jadikan selector sebagai kontrol utama dengan label yang jelas.

**Files:**
- Modify: `src/app/live/page.tsx`

**Changes:**
1. Remove redundant "Buka Scoreboard" button.
2. LiveBoard handles all selectors internally.
3. Page subtitle explains selection flow.

---

## Phase 4: Viewer Dashboard Comfort
### Task 4.1: Dashboard viewer card layout
**Objective:** Tambah ringkasan event dan comfort cards.

**Files:**
- Modify: `src/app/dashboard-viewer/page.tsx`

**Changes:**
1. Add upcoming event card with CTA to Daftar Lomba.
2. Add summary card with athlete/registration/bill counts.
3. Use `glass-panel` for both cards.

---

## Phase 5: Global Spacing & Typography
### Task 5.1: Standardize dashboard wrapper
**Objective:** Semua dashboard pages pakai `mx-auto max-w-7xl space-y-6 p-6`.

**Files:**
- Modify all `src/app/(dashboard)/*/page.tsx` files

**Changes:**
1. Ensure consistent wrapper classes.
2. Breadcrumb always before PageHeader.
3. Empty states use `pub-card` with centered content.

---

## Verification
- Run `npm run build` after each phase.
- Run `npm run lint` if available.
- Manual check: mobile header shows single menu button, drawer contains nav + auth.
- Manual check: all dashboard pages use light theme tokens.

## Risks
- OpenCode may not respect existing code style; review patches before applying.
- Some pages may have unique data fetching patterns; avoid changing logic.
- Mobile drawer state management must stay consistent across shells.

---

## OpenCode Execution Plan
Use opencode run for each task:
```bash
opencode run 'Implement Task 1.1: update LandingDrawer and shells for auth-aware sidebar' --model openrouter/qwen/qwen3.7-plus
```

For parallel tasks, use separate worktrees:
```bash
git worktree add /tmp/scms-nav phase1-nav
git worktree add /tmp/scms-dashboard phase2-dashboard
```
