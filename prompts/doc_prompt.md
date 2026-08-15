# REVAMP MY WEBSITE INTO A WORLD-CLASS DEVELOPER PLATFORM

You are a **Principal Frontend Engineer + Product Designer + Developer Experience (DX) Engineer + Design Systems Architect**.

I want you to completely audit and revamp my existing website/codebase.

The goal is to make it feel like a **beautiful, mature, world-class developer library / framework / open-source ecosystem website**.

Do NOT make it look like a generic SaaS dashboard.

Do NOT make it look like a random Tailwind landing-page template.

The visual and UX direction should be inspired by the best developer documentation ecosystems such as:

* Sequelize
* Socket.IO
* React
* Next.js
* Prisma
* Zod
* TanStack
* Docusaurus
* Nextra
* Fumadocs
* Vercel
* Stripe
* Supabase
* shadcn/ui

Also study modern developer tools such as:

* Claude / Claude Code
* Cursor
* Raycast
* Warp
* GitHub
* Linear

Use these products as **UX and design references only**.

Do NOT clone their branding, layouts, logos, illustrations, or exact visual identity.

The final product must have its own strong visual identity.

---

# 1. FIRST — UNDERSTAND THE EXISTING CODEBASE

Before changing anything, inspect the entire repository.

Understand:

* framework
* routing
* layouts
* components
* pages
* APIs
* authentication
* state management
* data fetching
* forms
* tables
* documentation
* navigation
* themes
* styling
* assets
* animations
* dependencies
* build system
* environment configuration
* testing
* performance

Create an internal map of the application.

Do not immediately rewrite the application.

Preserve working business logic.

---

# 2. AUDIT EVERY PAGE

For every route determine:

* What is this page supposed to do?
* Is it functional?
* Is the UX intuitive?
* Is the navigation logical?
* Is the information hierarchy good?
* Is the page responsive?
* Is the page accessible?
* Are loading states implemented?
* Are error states implemented?
* Are empty states implemented?
* Are interactions actually functional?
* Are there unnecessary components?
* Are there duplicated patterns?

Do not create fake functionality.

If a button exists, it should perform a meaningful action.

If functionality is broken, fix the actual root cause.

---

# 3. THE CORE DESIGN DIRECTION

The website should feel like:

**Sequelize / Socket.IO documentation ergonomics**

*

**React / Next.js documentation hierarchy**

*

**Vercel visual polish**

*

**Linear-level interaction quality**

*

**Claude Code / Raycast developer-tool aesthetics**

*

**our own design system**

The final result should feel like a serious:

> Developer platform / framework / SDK / CLI / open-source ecosystem.

Not a marketing template.

---

# 4. WEBSITE STRUCTURE

Create a clear separation between:

```text
PRODUCT
│
├── Home
├── Features
├── Pricing
├── Examples
├── Playground
└── Changelog


DOCUMENTATION
│
├── Introduction
├── Getting Started
├── Installation
├── Concepts
├── Guides
├── API Reference
├── SDK
├── CLI
├── Configuration
├── Examples
└── Troubleshooting


DEVELOPER
│
├── GitHub
├── Community
├── Releases
├── Changelog
└── Contributing
```

Adapt this structure to the actual product.

Do NOT create routes that have no real purpose.

---

# 5. DOCUMENTATION UI

Build a real documentation experience.

Desktop layout:

```text
┌───────────────────────────────────────────────────────────────┐
│ LOGO       Docs    API    Examples    GitHub     Search  ◎   │
├──────────────┬───────────────────────────────┬───────────────┤
│              │                               │               │
│ Introduction │  Documentation                │ On this page  │
│ Getting      │                               │               │
│ Started      │  Introduction                 │ Introduction  │
│              │                               │ Installation  │
│ Installation │  Explanation                  │ Configuration │
│              │                               │ Usage         │
│ Guides       │  Code examples                │               │
│              │                               │               │
│ API          │  Examples                     │               │
│              │                               │               │
│ CLI          │                               │               │
│              │                               │               │
└──────────────┴───────────────────────────────┴───────────────┘
```

The documentation content must remain readable.

Do not make the content area excessively wide.

Use typography and whitespace intelligently.

---

# 6. DOCUMENTATION NAVIGATION

Implement:

* collapsible sidebar
* nested navigation
* active route highlighting
* breadcrumbs
* previous/next navigation
* table of contents
* sticky navigation where appropriate
* mobile navigation drawer
* version selector if applicable
* language selector if applicable
* GitHub/edit link if applicable

Navigation should feel similar in quality to mature open-source documentation.

---

# 7. GLOBAL SEARCH

Implement a powerful documentation/product search.

Support:

* documentation
* guides
* API
* CLI commands
* examples
* pages
* settings
* relevant entities

Keyboard shortcut:

`⌘ K`

and

`Ctrl K`

Search UI should feel like a developer tool.

Use `cmdk` or an equivalent high-quality implementation.

Include:

* recent searches
* keyboard navigation
* categories
* shortcuts
* highlighted results
* instant navigation

---

# 8. COMMAND PALETTE

Create a global command palette.

Example:

```text
┌──────────────────────────────────────────────┐
│ Search documentation, commands, pages...     │
├──────────────────────────────────────────────┤
│ Navigation                                   │
│   → Introduction                             │
│   → Getting Started                          │
│   → API Reference                            │
│                                              │
│ Actions                                      │
│   → Toggle Dark Mode                         │
│   → Change Theme                             │
│   → Copy Installation Command                │
│                                              │
│ Recent                                       │
│   → Authentication Guide                     │
└──────────────────────────────────────────────┘
```

Make it feel fast and polished.

---

# 9. CODE BLOCKS

Code examples are a first-class part of the product.

Use **Shiki** or an equivalent excellent syntax-highlighting system.

Support common languages such as:

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

Every code block should support:

* syntax highlighting
* copy button
* language label
* optional line numbers
* highlighted lines
* horizontal scrolling
* responsive layout

---

# 10. CODE TABS

Support:

```text
JavaScript | TypeScript
```

and:

```text
npm | pnpm | yarn | bun
```

Example:

```text
┌─────────────────────────────────────────────┐
│ TypeScript                                  │
├─────────────────────────────────────────────┤
│                                             │
│ import { Client } from "package";           │
│                                             │
│ const client = new Client();                │
│                                             │
│ const result = await client.connect();      │
│                                             │
│                                      Copy   │
└─────────────────────────────────────────────┘
```

Make these reusable MDX components.

---

# 11. TERMINAL / CLI COMPONENTS

Create a premium terminal component.

It should support:

* commands
* output
* copy
* optional run interaction
* status indicators
* streaming output where applicable
* light/dark theme integration

Example:

```text
$ package init my-project

◇ Creating project

✓ Configuration created
✓ Dependencies installed
✓ Environment configured

Your project is ready.
```

Do NOT make it look like a cheesy hacker terminal.

Keep it sophisticated.

---

# 12. INTERACTIVE DOCUMENTATION

Where technically possible, create interactive examples.

Potentially use:

* Sandpack
* live React examples
* interactive API examples
* playgrounds
* request builders
* JSON viewers
* terminal simulations

Example:

```text
┌──────────────────────────┬──────────────────────────┐
│ CODE                     │ OUTPUT                   │
│                          │                          │
│ const client = ...       │ Connected                │
│                          │                          │
│ client.connect()         │ Request successful       │
│                          │                          │
│                 [Run]    │ Response: {...}          │
└──────────────────────────┴──────────────────────────┘
```

Only implement genuine functionality.

Do not fake live execution.

---

# 13. API REFERENCE

Create a professional API reference experience.

Example:

```text
Client
────────────────────────────────

new Client(options?)

Parameters

options
  apiKey       string
  timeout      number
  environment  string


Methods

connect()
disconnect()
request()
subscribe()


Returns

Promise<Response>
```

Use:

* parameter tables
* type information
* descriptions
* examples
* return types
* errors
* expandable details

If the project already has API schemas/types, derive documentation from those where possible.

Do not manually duplicate information unnecessarily.

---

# 14. CALLOUTS

Create beautiful reusable documentation callouts:

* Note
* Tip
* Warning
* Danger
* Important
* Experimental

Example:

```text
┌──────────────────────────────────────────────┐
│ TIP                                          │
│                                              │
│ You can use the CLI to generate this        │
│ configuration automatically.                │
└──────────────────────────────────────────────┘
```

---

# 15. DOCUMENTATION CONTENT SYSTEM

If documentation is currently hardcoded, create a scalable content architecture.

Prefer:

* MDX
* typed metadata
* reusable documentation components
* generated navigation
* frontmatter
* searchable content

Potential architecture:

```text
content/
├── docs/
│   ├── introduction.mdx
│   ├── getting-started.mdx
│   ├── installation.mdx
│   ├── guides/
│   ├── concepts/
│   ├── api/
│   ├── cli/
│   └── examples/
│
└── changelog/
```

Adapt this to the existing architecture.

---

# 16. MULTI-THEME DESIGN SYSTEM

Do not limit themes to light and dark.

Implement:

### Theme 1

Light

### Theme 2

Dark

### Theme 3

AMOLED

### Theme 4

High Contrast

And allow configurable accent colors.

Example:

```text
Appearance

System
Light
Dark
AMOLED
High Contrast

Accent

Violet
Blue
Cyan
Green
Orange
Rose
```

Themes should affect:

* UI
* borders
* backgrounds
* code blocks
* terminal
* buttons
* links
* charts
* selection
* focus states

Persist the preference.

Respect system preferences.

Prevent theme flash on initial page load.

---

# 17. CODE THEME

Allow code themes to integrate with the application theme.

Possible code themes:

* GitHub
* Dracula
* One Dark
* Nord
* Tokyo Night

Do not expose unnecessary complexity if the product doesn't need it.

---

# 18. TYPOGRAPHY

Use professional developer-product typography.

Possible fonts:

* Geist
* Inter
* IBM Plex Sans
* IBM Plex Mono
* Geist Mono
* JetBrains Mono

Use a consistent hierarchy.

Documentation body text must prioritize readability.

Code must have a proper monospace font.

---

# 19. DESIGN SYSTEM

Create centralized design tokens for:

* colors
* typography
* spacing
* radius
* shadows
* borders
* transitions
* breakpoints
* z-index

Use semantic CSS variables.

Never scatter arbitrary colors throughout components.

---

# 20. COMPONENT SYSTEM

Use high-quality primitives.

Preferred:

* shadcn/ui
* Radix UI
* Lucide
* Motion
* Sonner
* cmdk
* React Hook Form
* Zod
* TanStack
* Shiki

Potentially:

* Fumadocs
* Nextra
* Docusaurus
* Sandpack
* Mermaid

However:

**DO NOT INSTALL EVERY LIBRARY.**

Before adding a dependency:

1. Check whether it already exists.
2. Check whether existing primitives can solve the problem.
3. Check bundle impact.
4. Check maintenance quality.
5. Check whether it is actually necessary.

---

# 21. VISUAL STYLE

The visual style should have:

* excellent typography
* subtle borders
* restrained shadows
* clean spacing
* strong hierarchy
* beautiful code blocks
* elegant terminal UI
* subtle gradients
* subtle animation
* developer-oriented controls
* beautiful dark mode

Avoid:

* excessive glassmorphism
* giant gradients
* random neon colors
* excessive rounded cards
* generic illustrations
* excessive floating elements
* animation everywhere
* meaningless dashboard widgets

---

# 22. MICRO INTERACTIONS

Implement polished interactions.

Examples:

Copy:

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

Navigation:

```text
normal
↓
hover
↓
active
```

Sidebar:

```text
collapsed
↓
expanded
```

Theme:

```text
theme changing
↓
smooth transition
```

Respect:

`prefers-reduced-motion`

---

# 23. RESPONSIVE DESIGN

Test:

* 320px
* 375px
* 390px
* 430px
* tablet
* laptop
* desktop
* ultrawide

Mobile documentation should use:

* drawer navigation
* sticky mobile header
* horizontal code scrolling
* collapsible TOC
* touch-friendly controls

Do not simply shrink the desktop layout.

---

# 24. ACCESSIBILITY

Target WCAG 2.2 AA.

Ensure:

* semantic HTML
* keyboard navigation
* visible focus
* accessible dialogs
* accessible dropdowns
* accessible tabs
* screen-reader labels
* contrast
* reduced motion

Test important flows without using a mouse.

---

# 25. PERFORMANCE

Do not sacrifice performance for visual polish.

Audit:

* bundle size
* hydration
* client components
* unnecessary state
* unnecessary effects
* unnecessary API calls
* images
* fonts
* code splitting
* lazy loading
* rendering
* network requests

Use server components where appropriate.

Do not blindly add `useMemo` or `useCallback`.

Measure first.

---

# 26. LOADING / ERROR / EMPTY STATES

Every asynchronous page must have polished states.

Loading:

```text
Skeleton
```

Error:

```text
Something went wrong.

Unable to load this page.

[Try again]
```

Empty:

```text
Nothing here yet.

Create your first resource to get started.

[Create]
```

Never leave users staring at a blank screen.

---

# 27. MOBILE DOCUMENTATION

Mobile must feel intentionally designed.

Example:

```text
┌─────────────────────────────┐
│ ☰   Logo            Search │
├─────────────────────────────┤
│                             │
│ Introduction                │
│                             │
│ Documentation content       │
│                             │
│ Code block                  │
│                             │
│ ┌─────────────────────────┐ │
│ │ npm install package     │ │
│ └─────────────────────────┘ │
│                             │
│ Previous       Next         │
└─────────────────────────────┘
```

---

# 28. PRODUCT + DOCS MUST FEEL LIKE ONE PRODUCT

The marketing/product pages and documentation must share:

* typography
* color system
* themes
* navigation language
* buttons
* icons
* motion
* code styling
* spacing
* visual identity

Do not create two completely unrelated websites.

---

# 29. DON'T OVERDESIGN THE DOCUMENTATION

This is extremely important.

Documentation is primarily for **reading and learning**.

Prioritize:

1. readability
2. navigation
3. discoverability
4. code examples
5. search
6. API reference
7. visual polish

Do not let animations, cards, gradients or decorative elements interfere with documentation.

---

# 30. CREATE A REAL DESIGN LANGUAGE

Do not simply reproduce another website.

After studying the references, define our own:

* typography
* color palette
* spacing
* radius
* iconography
* code theme
* terminal style
* navigation
* animation language
* component language

The result must be recognizable as OUR product.

---

# 31. IMPLEMENTATION PHASES

## Phase 1 — Repository Audit

Analyze everything.

Output:

* architecture
* route map
* component map
* dependency map
* current design system
* technical debt
* broken functionality
* UX problems

---

## Phase 2 — Reference Analysis

Study the UX patterns of:

* Sequelize
* Socket.IO
* React
* Next.js
* Prisma
* Zod
* TanStack
* Docusaurus
* Nextra
* Fumadocs

Extract patterns for:

* navigation
* sidebar
* API reference
* search
* code blocks
* versioning
* page layout
* content hierarchy

Do not copy their branding.

---

## Phase 3 — Design System

Implement:

* tokens
* themes
* typography
* buttons
* inputs
* cards
* tabs
* dialogs
* navigation
* code blocks
* terminal
* callouts
* tables
* command palette
* search

---

## Phase 4 — Application Shell

Implement:

* navbar
* sidebar
* documentation shell
* mobile navigation
* command palette
* search
* theme selector

---

## Phase 5 — Documentation

Implement:

* MDX architecture
* navigation
* code blocks
* API reference
* guides
* examples
* CLI documentation
* TOC
* breadcrumbs
* previous/next

---

## Phase 6 — Product Pages

Revamp the existing product pages while maintaining their functionality.

---

## Phase 7 — Functional QA

Verify every:

* button
* form
* link
* modal
* dropdown
* tab
* API request
* search
* filter
* navigation
* command
* authentication flow

---

## Phase 8 — Responsive QA

Verify mobile → desktop.

---

## Phase 9 — Accessibility QA

Verify keyboard, screen reader semantics, focus and contrast.

---

## Phase 10 — Performance QA

Measure and optimize.

---

# 32. FINAL QUALITY BAR

When finished, the website should give this impression:

> "This looks like a mature open-source developer ecosystem."

It should NOT feel like:

> "Someone generated a fancy SaaS landing page."

The experience should be:

**Beautiful.**

**Fast.**

**Technical.**

**Readable.**

**Developer-first.**

**Professional.**

**Highly navigable.**

**Multi-theme.**

**Production-ready.**

---

# 33. FINAL RULE

DO NOT JUST CHANGE THE CSS.

Understand the product.

Understand the information architecture.

Understand the developer workflow.

Then redesign the experience around that workflow.

Preserve working functionality.

Fix broken functionality.

Remove unnecessary complexity.

Create reusable primitives.

Avoid fake interactions.

Do not claim something works unless you actually verified it.

The final result should feel like a **real developer ecosystem maintained by a serious engineering organization**, not an AI-generated template.
