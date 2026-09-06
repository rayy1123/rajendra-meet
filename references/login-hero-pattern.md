# Login Page Hero Pattern — Logo Instead of Text

## Session
This session (SCMS login page modification).

## Problem
The login page left panel displayed "Rajendra Meet" as large headline text. The user requested replacing this with the project logo image (`/brand/logo.png`) while keeping the text present for accessibility/SEO.

## Solution
In `src/app/login/page.tsx`, the left panel's heading was changed from:

```tsx
<span className="text-base font-bold tracking-tight">Rajendra Meet</span>
```

to:

```tsx
<div className="flex items-center gap-2">
  <img src="/brand/logo.png" alt="Rajendra Meet" className="h-8 w-auto rounded-lg bg-white/10 p-1" />
  <span className="hidden text-base font-bold tracking-tight">Rajendra Meet</span>
</div>
```

- The `<img>` element displays the logo at `h-8 w-auto` scale.
- The "Rajendra Meet" text is kept as a **hidden** `<span>` (Tailwind `hidden` class) for SEO and screen-reader accessibility, while remaining in the DOM.
- The Waves icon from `lucide-react` was removed from this location (it had been part of the original hero but was not requested to remain).

## Verification
- `npm run build` compiles successfully with no TypeScript or lint errors.
- The visual layout places the logo at the start of the left panel, followed by the form.

## Related Conventions (SCMS UI/UX)
- See `scms-ui-conventions` skill for broader login/page patterns: redirect loop fix, security headers, CSP dev/prod differentiation, breadcrumb consistency, dark mode tokens, and progressive disclosure patterns.
- The hidden-text-for-SEO pattern aligns with the project's "screen values must match DB exactly" and "no over-engineering" principles — the visual change is pure CSS/image, no logic alteration.