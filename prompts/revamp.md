# World-Class Website Revamp, UX Audit & Production Engineering

You are acting as a **Principal Product Designer + Staff Frontend Engineer + UX Engineer + Design Systems Architect + Performance Engineer**.

Your task is to completely audit, redesign, modernize, and production-harden the existing website/codebase.

The objective is NOT simply to change colors or add animations.

The objective is to transform the existing product into a **world-class developer-focused SaaS/product experience** with the visual quality of products such as:

* Vercel
* Linear
* React documentation
* shadcn/ui
* Claude
* Raycast
* Warp
* Supabase
* Stripe
* Mintlify
* modern GitHub developer tooling

Use these products only as **design inspiration**, not as something to clone.

---

# 1. FIRST: AUDIT THE ENTIRE EXISTING CODEBASE

Before modifying anything:

* inspect the complete repository
* understand the application architecture
* identify framework and rendering strategy
* inspect routing
* inspect layouts
* inspect components
* inspect API integration
* inspect state management
* inspect authentication
* inspect forms
* inspect tables
* inspect modals
* inspect navigation
* inspect responsive behavior
* inspect loading states
* inspect error states
* inspect empty states
* inspect animations
* inspect theme implementation
* inspect accessibility
* inspect performance bottlenecks
* inspect duplicated components
* inspect unused dependencies
* inspect dead code
* inspect broken imports
* inspect inconsistent naming
* inspect inconsistent spacing
* inspect inconsistent typography
* inspect inconsistent colors
* inspect hardcoded values
* inspect duplicated business logic
* inspect unnecessary client components
* inspect unnecessary state
* inspect unnecessary effects
* inspect unnecessary API requests
* inspect expensive rendering
* inspect image optimization
* inspect bundle size

Do NOT immediately rewrite the application.

First understand what already exists.

Preserve working business logic unless there is a clear reason to change it.

---

# 2. FUNCTIONALITY COMES BEFORE BEAUTY

Every existing feature must continue to work.

For every page and component verify:

* navigation works
* buttons actually work
* forms submit correctly
* validation works
* loading states exist
* errors are handled
* empty states exist
* API failures are handled
* authentication flows work
* modals open/close correctly
* dropdowns work
* tabs work
* filters work
* pagination works
* search works
* sorting works
* keyboard navigation works
* responsive layouts work

Do not create fake UI.

Do not create decorative buttons that do nothing.

Do not replace functional components with static mockups.

If functionality is broken, fix the underlying implementation.

---

# 3. ESTABLISH A REAL DESIGN SYSTEM

Create a centralized design system instead of styling every component independently.

Define:

## Colors

Create semantic tokens:

* background
* foreground
* muted
* muted foreground
* border
* primary
* secondary
* accent
* destructive
* success
* warning
* info
* card
* popover
* input
* ring

Do NOT scatter raw colors throughout the codebase.

Use CSS variables/design tokens.

---

# 4. MULTI-THEME SYSTEM

Build a genuinely polished theme engine.

Minimum themes:

### Light

Clean documentation/SaaS appearance.

### Dark

Premium developer-tool appearance.

### AMOLED

Almost-black backgrounds with extremely subtle borders.

### High Contrast

Accessibility-focused theme.

### Custom Accent

Allow users to select an accent color.

The theme system must affect:

* backgrounds
* text
* borders
* buttons
* cards
* code blocks
* charts
* terminal UI
* navigation
* focus states
* selection states
* hover states

Avoid excessive gradients.

Themes should feel like completely different product identities while still belonging to the same design system.

Persist theme preference.

Respect:

`prefers-color-scheme`

Avoid flash of incorrect theme during initial load.

---

# 5. TYPOGRAPHY

Use a professional typography system.

Prefer:

* Geist
* Inter
* IBM Plex Sans
* IBM Plex Mono
* JetBrains Mono

Use a maximum of two primary font families.

Example:

UI:

Geist / Inter

Code:

Geist Mono / JetBrains Mono

Create a consistent type scale:

* display
* h1
* h2
* h3
* h4
* body
* small
* caption
* code

Typography should feel closer to a premium developer product than a generic Bootstrap website.

---

# 6. COMPONENT LIBRARY

Use high-quality existing primitives wherever appropriate.

Preferred stack:

* shadcn/ui
* Radix UI
* Lucide
* TanStack
* Motion / Framer Motion
* Sonner
* cmdk
* Vaul where mobile drawers are appropriate
* React Hook Form
* Zod

Do NOT install libraries just because they are popular.

Every dependency must have a reason.

Avoid dependency bloat.

If shadcn/Radix can solve something cleanly, prefer that over introducing another UI framework.

---

# 7. NAVIGATION

Build a sophisticated developer-product navigation system.

Desktop:

```text
Logo
│
├── Overview
├── Documentation
├── Guides
├── API
├── SDK
├── CLI
├── Examples
├── Changelog
└── Settings
```

Use a collapsible sidebar where appropriate.

Sidebar requirements:

* keyboard navigation
* active route highlighting
* nested navigation
* smooth expand/collapse
* persistent collapsed state
* tooltips
* mobile drawer
* proper accessibility

Do not make the sidebar visually noisy.

---

# 8. COMMAND PALETTE

Implement a premium command palette.

Shortcut:

`⌘ K`

and

`Ctrl K`

It should support:

* navigation
* search
* actions
* theme switching
* page search
* settings
* recent pages
* shortcuts

Example:

```text
┌──────────────────────────────────────────┐
│ Search anything...                       │
├──────────────────────────────────────────┤
│ Navigation                               │
│   → Dashboard                            │
│   → Documentation                        │
│   → API                                  │
│                                          │
│ Actions                                  │
│   → Toggle Dark Mode                     │
│   → Create Project                       │
│                                          │
│ Recent                                   │
│   → Authentication Guide                 │
└──────────────────────────────────────────┘
```

Use `cmdk` or an equivalent robust implementation.

---

# 9. CLI / TERMINAL EXPERIENCE

Wherever the product deals with developers, introduce an elegant terminal aesthetic.

Create reusable:

* Terminal component
* Command block
* CLI output
* Copy button
* Run button
* Code block
* JSON viewer
* Logs viewer

Example:

```text
$ npm install @product/sdk

✓ Resolving packages
✓ Downloaded dependencies
✓ Installation complete

Ready.
```

Terminal UI should feel inspired by modern tools like Claude Code, Warp and Raycast.

Do not overuse green text or fake hacker aesthetics.

Keep it sophisticated.

---

# 10. CODE BLOCKS

Use a proper syntax-highlighting engine such as Shiki.

Support:

* JavaScript
* TypeScript
* JSX
* TSX
* JSON
* Bash
* SQL
* Python
* YAML
* Dockerfile

Code blocks must include:

* language indicator
* copy button
* optional line numbers
* highlighted lines
* horizontal scrolling
* responsive behavior

Code blocks should feel like premium documentation.

---

# 11. INTERACTIONS

Use Motion / Framer Motion selectively.

Implement:

* page transitions
* modal animations
* dropdown animations
* sidebar transitions
* card hover states
* subtle entrance animations
* command palette transitions
* skeleton transitions

Avoid:

* excessive bouncing
* unnecessary parallax
* animation on every element
* slow transitions
* distracting gradients

The website should feel:

**fast → responsive → intentional**

not:

**animated → heavy → flashy**

---

# 12. MICRO-INTERACTIONS

Every important interaction should have feedback.

Examples:

Button:

```text
idle
↓
hover
↓
pressed
↓
loading
↓
success/error
```

Copy button:

```text
Copy
↓
Copied ✓
```

Save:

```text
Saving...
↓
Saved ✓
```

Delete:

```text
Delete
↓
Confirmation
↓
Deleting...
↓
Deleted
```

Use toast notifications where appropriate.

Use Sonner or an equivalent.

---

# 13. CARDS

Avoid generic:

```text
┌──────────────┐
│ Card         │
│ Description  │
│ Button       │
└──────────────┘
```

Instead create visually meaningful information hierarchy.

Use:

* subtle borders
* layered backgrounds
* controlled shadows
* hover states
* contextual icons
* compact metadata
* progressive disclosure

Cards should feel closer to Linear/Vercel/Supabase than generic SaaS templates.

---

# 14. DOCUMENTATION EXPERIENCE

If the product contains documentation:

Create a proper documentation system.

Desktop:

```text
┌─────────────┬─────────────────────────────┬─────────────┐
│ Navigation  │ Main Documentation          │ On this page│
│             │                             │             │
│ Getting     │ Introduction                │ Introduction│
│ Started     │                             │ Installation│
│             │ Explanation...              │ Usage       │
│ API         │                             │ Examples    │
│             │ Code examples               │             │
│ Guides      │                             │             │
└─────────────┴─────────────────────────────┴─────────────┘
```

Include:

* breadcrumbs
* table of contents
* previous/next navigation
* code examples
* copy buttons
* search
* command palette
* version selector if relevant
* edit link if relevant

---

# 15. RESPONSIVE DESIGN

Do NOT treat mobile as an afterthought.

Design specifically for:

* 320px
* 375px
* 390px
* 430px
* tablet
* laptop
* desktop
* ultrawide

Mobile should have:

* drawer navigation
* bottom sheets where appropriate
* optimized tables
* horizontal code scrolling
* touch-friendly controls
* responsive command palette
* simplified navigation

Nothing should overflow horizontally accidentally.

---

# 16. ACCESSIBILITY

Target WCAG 2.2 AA where practical.

Implement:

* semantic HTML
* keyboard navigation
* focus-visible states
* ARIA only where necessary
* screen-reader labels
* sufficient contrast
* reduced-motion support
* accessible dialogs
* accessible dropdowns
* accessible forms

Test the application using keyboard only.

---

# 17. PERFORMANCE

The redesigned application must remain fast.

Prioritize:

* server components where appropriate
* minimal client components
* lazy loading
* code splitting
* image optimization
* font optimization
* caching
* memoization only where useful
* avoiding unnecessary state
* avoiding unnecessary effects
* minimizing re-renders
* virtualization for large datasets

Do not solve performance problems by blindly adding `useMemo` and `useCallback`.

Measure first.

---

# 18. LOADING STATES

Every asynchronous UI must have an intentional loading state.

Create reusable:

* skeletons
* spinners
* progress indicators
* optimistic states
* streaming states

Avoid blank screens.

Never make users wonder whether the application is frozen.

---

# 19. ERROR STATES

Design proper error experiences.

Examples:

```text
Something went wrong.

We couldn't load this project.

[Try again]
```

For API errors:

```text
Request failed

Unable to connect to the server.

Retry
```

For permissions:

```text
You don't have access to this resource.

Go back
```

---

# 20. EMPTY STATES

Never leave blank pages.

Create meaningful empty states:

```text
No projects yet.

Create your first project to get started.

[Create project]
```

Each empty state should explain:

1. what is missing
2. why it matters
3. what the user should do next

---

# 21. DATA-DENSE INTERFACES

For tables and dashboards use TanStack Table where appropriate.

Support:

* sorting
* filtering
* pagination
* column visibility
* search
* row actions
* responsive behavior
* loading states
* empty states

Do not render giant datasets directly.

Use virtualization when required.

---

# 22. DASHBOARD DESIGN

Dashboard pages should prioritize information hierarchy.

Structure:

```text
Page title
Description
Primary action

Key metrics

┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Metric │ │ Metric │ │ Metric │ │ Metric │
└────────┘ └────────┘ └────────┘ └────────┘

Primary visualization

Recent activity

Quick actions
```

Do not fill the screen with unnecessary charts.

Every visualization must answer a question.

---

# 23. SEARCH

Create global search.

Support:

* pages
* documentation
* projects
* commands
* users
* settings
* relevant application entities

Search should feel instantaneous.

Use keyboard navigation.

---

# 24. ICONOGRAPHY

Use Lucide or another coherent icon system.

Never mix random icon packs.

Icons must have consistent:

* stroke width
* size
* visual weight

Avoid icons inside every single button unless they improve comprehension.

---

# 25. VISUAL LANGUAGE

The final visual language should have:

* subtle 1px borders
* restrained shadows
* strong typography
* generous but intentional whitespace
* beautiful code blocks
* subtle gradients
* elegant hover states
* compact developer-oriented controls
* strong information hierarchy
* polished empty states
* excellent dark mode

Avoid:

* excessive rounded cards
* rainbow gradients
* giant glassmorphism
* excessive blur
* generic SaaS illustrations
* giant meaningless hero sections
* random animations

---

# 26. DESIGN TOKENS

Centralize:

```text
spacing
radius
font sizes
font weights
line heights
colors
shadows
z-index
transitions
breakpoints
```

Create reusable tokens.

Do not hardcode these values repeatedly.

---

# 27. ROUTE-BY-ROUTE AUDIT

For EVERY route:

1. understand its purpose
2. verify functionality
3. redesign layout
4. improve hierarchy
5. improve responsive behavior
6. improve loading state
7. improve empty state
8. improve error state
9. improve accessibility
10. improve performance

Do not redesign only the homepage.

The entire product must feel like one cohesive system.

---

# 28. COMPONENT ARCHITECTURE

Create reusable components such as:

```text
components/
├── ui/
├── navigation/
├── command/
├── documentation/
├── terminal/
├── code/
├── forms/
├── tables/
├── charts/
├── feedback/
├── loading/
├── empty-state/
├── error-state/
├── theme/
└── layout/
```

Avoid giant monolithic components.

Keep business logic separate from presentation wherever appropriate.

---

# 29. LIBRARY USAGE POLICY

You are explicitly allowed to use high-quality libraries.

However:

DO NOT install libraries just to make the project look sophisticated.

Before installing a package ask:

* Does it solve a real problem?
* Is it maintained?
* Does it duplicate something already installed?
* Does it increase bundle size significantly?
* Can the same result be achieved using existing primitives?

Prefer a smaller number of excellent dependencies.

---

# 30. FINAL QUALITY BAR

The final product should make someone think:

> "This looks like a serious developer platform."

Not:

> "Someone added a dark theme to a normal website."

The interface should feel:

* premium
* technical
* modern
* fast
* trustworthy
* polished
* cohesive
* accessible
* responsive
* developer-friendly

---

# 31. IMPLEMENTATION PROCESS

Follow this exact sequence:

### Phase 1 — Audit

Analyze the entire codebase.

Do not modify anything yet.

Produce:

* architecture overview
* route inventory
* component inventory
* dependency audit
* UX problems
* functional problems
* performance problems
* accessibility problems
* design inconsistencies
* technical debt

### Phase 2 — Design System

Create:

* theme system
* design tokens
* typography
* spacing
* colors
* buttons
* inputs
* cards
* dialogs
* dropdowns
* tabs
* tables
* code blocks
* terminal
* navigation
* command palette
* toast system

### Phase 3 — Core Shell

Implement:

* root layout
* navbar
* sidebar
* mobile navigation
* command palette
* theme switcher
* global search
* notification system

### Phase 4 — Page-by-Page Redesign

Redesign every route.

Do not skip existing routes.

### Phase 5 — Functional QA

Test every interaction.

### Phase 6 — Responsive QA

Test mobile, tablet, desktop and ultrawide.

### Phase 7 — Accessibility QA

Keyboard navigation, focus management, contrast and semantic structure.

### Phase 8 — Performance QA

Inspect:

* bundle size
* rendering
* network requests
* API calls
* image loading
* hydration
* unnecessary client components
* unnecessary re-renders

### Phase 9 — Final Polish

Add only the animations and micro-interactions that genuinely improve UX.

---

# 32. IMPORTANT RULE

DO NOT destroy existing functionality merely to achieve a visual redesign.

If something already works:

preserve it → improve it → refactor only when necessary.

If something is broken:

identify the root cause → fix it → test it.

If something is ugly:

redesign it.

If something is duplicated:

consolidate it.

If something is unnecessary:

remove it.

If something is missing:

implement it.

---

# 33. FINAL DELIVERABLE

When finished, provide:

1. complete audit summary
2. architectural changes
3. dependency changes
4. design-system changes
5. theme system
6. route-by-route changes
7. component changes
8. performance improvements
9. accessibility improvements
10. remaining technical debt
11. testing performed
12. recommended next improvements

Do not claim something works unless you actually verified it.

The final result must be **production-quality**, not a visual prototype.
