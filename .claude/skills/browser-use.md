---
name: browser-use
description: Headless browser automation, DOM querying, end-to-end user flow verification, visual testing, and screenshot capture.
---

# Browser-Use — Headless Browser & DOM Automation

Standard for automated user journeys, visual validation, and web scraping verification.

## Execution Rules
1. **End-to-End Golden Paths**:
   - Verify critical user flows: Registration -> OTP Verification -> Login -> Entry Form -> PDF Print.
   - Assert visual elements are rendered, non-overlapping, and interactive.
2. **DOM Selectors & Robust Querying**:
   - Prefer role and accessible text queries (`getByRole`, `aria-label`, `data-testid`) over brittle CSS classes.
   - Wait for explicit network-idle or DOM readiness states rather than arbitrary sleeps.
3. **Print & Layout Testing**:
   - Validate `@media print` stylesheets via viewport emulation (A4 Portrait/Landscape, `@page` constraints).
   - Ensure sidebars, headers, and modal overlays are strictly hidden during print capture.
