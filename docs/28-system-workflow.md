# 28. System Workflow Document: End-to-End Business Lifecycles

This document details the complete end-to-end operational lifecycles for CodeGuard's subscriber platform, customer portal, and admin management system.

---

## Flow 1 — Individual Student (Local Intelligence)

```text
1. Registration: Student signs up with .edu or personal email.
2. Email Verification: Account confirmed.
3. Classification: User selects "Student & Academic" customer segment.
4. Plan Selection: "Basic / Student Plan" ($0/mo Free Forever) activated.
5. CLI Download: Student installs `@codeguard/cli` on local laptop (`pnpm install -g @codeguard/cli`).
6. Local Setup: Runs `codeguard init` and `codeguard scan` in their Git project.
7. Local Execution: Local AST parser extracts symbols, builds dependency graph, and detects secrets offline.
8. Usage Check: Meter tracks `28 / 100` local reviews for the month.
```

---

## Flow 2 — Working Professional (Cloud PR Reviews & AI Governance)

```text
1. Registration: Professional engineer registers account (`pro@codeguard.dev`).
2. Plan Selection: Chooses "Pro Plan" ($29/mo) with 14-day free trial.
3. Payment Setup: Mock / Stripe provider creates customer record and issues `INV-PRO-2026-001`.
4. Git Provider Linking: Connects GitHub App to repositories.
5. Automated PR Review: Developer opens Pull Request #42 on GitHub.
6. Cloud Webhook: Webhook worker receives `pull_request.opened` event.
7. Verification & AI: Entitlement engine verifies `AI_CODE_REVIEW` is enabled -> Gemini 3.7 Flash executes multi-stage verification -> Comments posted to PR.
8. Quota Metering: Usage record increments: `42 / 100` PR reviews, `180 / 500` AI reviews.
```

---

## Flow 3 — Organization Enterprise (Team & Seat Governance)

```text
1. Organization Signup: VP of Engineering signs up `Acme Payments Corp`.
2. Plan Activation: Chooses "Organization / Enterprise Plan" ($199/mo, 50 user seats).
3. Central Admin Dashboard: Owner accesses Organization Portal (`/app/organization`).
4. Member Invitations: Owner invites 24 engineers with roles (`OWNER`, `ADMIN`, `MEMBER`, `SECURITY_LEAD`).
5. Policy Deployment: Organization creates global zero-trust policy blocking merge on critical vulnerabilities.
6. Repository Sync: 14 microservices connected with branch protection status checks.
```

---

## Flow 4 — Admin Broadcasts Platform Announcement

```text
1. Admin Login: Super Admin accesses `/admin`.
2. Audience Broadcaster: Admin opens Notification Composer (`/admin/notifications`).
3. Targeting Query: Selects target audience (e.g. "Pro Tier Only" or "Everyone").
4. Audience Preview: System resolves recipients and returns "Estimated recipients: 4,283".
5. Composition: Admin enters title, body, priority ("HIGH"), and channels (`IN_APP`, `EMAIL`).
6. Dispatch: Batch inserts notification records in queue; banner appears on customer portals.
```

---

## Flow 5 — Self-Service Plan Upgrade

```text
1. Discovery: Student or Pro user clicks "Upgrade Plan" or attempts to use an Enterprise feature.
2. Plan Comparison: 3-column comparative matrix displayed with benefits and limits.
3. Confirmation: User confirms upgrade to Enterprise Plan.
4. Payment Execution: Provider processes transaction -> Invoice generated -> Status updated to ACTIVE.
5. Instant Entitlement Recalculation: `EntitlementEngine` unlocks org features and raises seat limits.
6. In-App Notification: User receives confirmation alert.
```

---

## Flow 6 — Admin Customer Suspension

```text
1. Security Trigger: Customer account flags suspicious volume or compliance breach.
2. Admin Action: Super Admin navigates to `/admin/customers` and clicks "Suspend".
3. Reason Capture: Admin enters justification: "Exceeded API abuse thresholds".
4. Immediate Enforcement: Customer status -> `SUSPENDED`; all subsequent API calls return HTTP 403.
5. Immutable Audit Log: Audit event `CUSTOMER_SUSPENDED` logged with admin ID and reason.
```

---

## Flow 7 — Organization Seat Limit Reached

```text
1. Member Invite: Org Admin attempts to invite the 51st user on a 50-seat plan.
2. Entitlement Evaluation: `entitlementEngine.canConsume(orgCustomerId, 'USER_SEATS', 1)` runs.
3. Limit Reached: Current seats (50) == Limit (50).
4. Block & CTA: API returns HTTP 403 `SEAT_LIMIT_REACHED` with message and "Upgrade to Enterprise" CTA.
```
