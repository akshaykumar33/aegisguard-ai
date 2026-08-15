# Build a Production-Grade Multi-Tenant Subscriber Management & Customer Portal Platform

## 1. ROLE

You are acting as a **Principal Software Architect, Senior Product Engineer, UX Architect, Security Engineer, and DevOps Engineer**.

Build a complete production-grade **Subscriber Management + Customer Portal + Admin Management Platform**.

Do not treat this as a simple CRUD application.

The system must be architected as a scalable SaaS platform capable of supporting:

* Individual students
* Working professionals
* Organizations
* Organizations with multiple employees/users
* Different subscription plans
* Different pricing
* Different professions
* Different benefits
* Different feature entitlements
* Different user limits
* Client-specific announcements
* Platform-wide notifications
* Subscription lifecycle management
* Administrative controls
* Customer self-service

The architecture must be extensible so additional subscription types, products, professions, benefits, and modules can be introduced later without rewriting the core system.

---

# 2. PRIMARY OBJECTIVE

Create two major applications:

## A. Admin Platform

A centralized control center where platform administrators can manage:

* Subscribers
* Customers
* Organizations
* Users
* Subscription plans
* Pricing
* Benefits
* Feature entitlements
* Subscriptions
* Payments
* Notifications
* Announcements
* Support requests
* Documents
* Account status
* Usage
* Audit logs
* Platform configuration

## B. Customer / Subscriber Portal

A secure portal where subscribers can:

* Login
* View their profile
* View subscription
* View plan benefits
* View available features
* View usage
* View invoices/payments
* Manage organization/users if permitted
* Receive notifications
* Read announcements
* View documents/resources
* Raise support requests
* Manage account settings
* Upgrade/downgrade plans where allowed

---

# 3. IMPORTANT ARCHITECTURAL PRINCIPLE

Do NOT hard-code plans such as:

```text
Student
Professional
Organization
```

into business logic.

Instead create a flexible entitlement system.

For example:

```text
Customer Type
    ↓
Plan
    ↓
Plan Features
    ↓
Plan Benefits
    ↓
Subscription
    ↓
Entitlements
    ↓
User Access
```

This allows the administrator to create future products such as:

```text
Student Basic
Student Premium
Professional Basic
Professional Pro
Organization Starter
Organization Business
Organization Enterprise
Custom Enterprise
```

without modifying application code.

---

# 4. CUSTOMER MODEL

Support three major customer/account types.

## INDIVIDUAL

Examples:

* Student
* Working professional
* Freelancer
* Researcher

One customer can have one or more users depending on the plan.

## PROFESSIONAL

A professional-focused account.

Example:

```text
Professional Account
    └── Primary User
```

## ORGANIZATION

An organization can have multiple users.

Example:

```text
Organization
│
├── Owner
├── Admin
├── Manager
├── Employee
├── Employee
└── Employee
```

The organization subscription determines:

* Maximum users
* Features
* Storage
* Usage limits
* Available modules
* Administrative capabilities

---

# 5. ACCOUNT HIERARCHY

Design the system around the following conceptual hierarchy:

```text
Platform
│
├── Admins
│
├── Customers
│   │
│   ├── Individual Customer
│   │      └── User
│   │
│   ├── Professional Customer
│   │      └── User
│   │
│   └── Organization Customer
│          │
│          ├── Owner
│          ├── Admin
│          ├── Manager
│          └── Members
│
├── Plans
│
├── Features
│
├── Benefits
│
├── Subscriptions
│
├── Payments
│
├── Notifications
│
└── Audit Logs
```

Do not unnecessarily duplicate customer and user entities.

Separate:

```text
Identity
Customer/Account
Organization
Subscription
User Membership
```

properly.

---

# 6. AUTHENTICATION

Implement secure authentication.

Support:

* Email/password
* Email verification
* Password reset
* Session management
* Logout
* Multi-device session management
* Optional MFA architecture
* Account lockout/rate limiting
* Login audit logs

Design authentication so OAuth/social login can be added later.

Never store plaintext passwords.

Use secure password hashing.

---

# 7. ROLE & PERMISSION SYSTEM

Implement RBAC.

## Platform Roles

Examples:

```text
SUPER_ADMIN
ADMIN
SUPPORT_ADMIN
FINANCE_ADMIN
CONTENT_ADMIN
```

## Customer Roles

Examples:

```text
OWNER
ADMIN
MANAGER
MEMBER
VIEWER
```

Do not scatter role checks throughout the codebase.

Create a reusable authorization layer.

Example conceptual permission:

```text
subscription.read
subscription.manage
billing.read
billing.manage
users.read
users.invite
users.remove
notifications.read
support.create
organization.manage
```

Allow future custom permissions.

---

# 8. SUBSCRIPTION SYSTEM

Create a complete subscription lifecycle.

Possible states:

```text
TRIAL
ACTIVE
PAST_DUE
PAUSED
CANCELLED
EXPIRED
SUSPENDED
```

Support:

* Start subscription
* Trial
* Activate
* Upgrade
* Downgrade
* Renew
* Pause
* Cancel
* Expire
* Reactivate

Never delete historical subscriptions.

Maintain subscription history.

Example:

```text
Customer
    ↓
Subscription #1
    ↓
Plan A
    ↓
Upgrade
    ↓
Subscription #2 / Subscription Version
    ↓
Plan B
```

Historical billing and entitlement information must remain auditable.

---

# 9. PLAN MANAGEMENT

Admin should be able to create plans dynamically.

Example:

```text
Plan:
Professional Pro

Customer Type:
Professional

Price:
₹1,999/month

Benefits:
- Advanced Analytics
- Priority Support
- AI Features

Limits:
Users: 1
Projects: 10
Storage: 20 GB

Features:
- dashboard
- analytics
- reports
- ai_assistant
```

Do NOT hard-code these values.

---

# 10. FEATURE ENTITLEMENT ENGINE

Create a centralized entitlement system.

Example:

```text
feature:
AI_ASSISTANT

plan:
PROFESSIONAL_PRO

enabled:
true
```

Another example:

```text
feature:
TEAM_MEMBERS

limit:
25
```

Support different entitlement types:

```text
BOOLEAN
LIMIT
QUOTA
TEXT
ENUM
```

Examples:

```text
AI_ASSISTANT = true

TEAM_MEMBERS = 25

STORAGE_GB = 100

SUPPORT_LEVEL = PRIORITY

API_ACCESS = true
```

Every protected feature in the application should check entitlements through one centralized service.

Example conceptual API:

```text
entitlements.has(user, "AI_ASSISTANT")

entitlements.limit(user, "TEAM_MEMBERS")

entitlements.canConsume(user, "API_CALLS", 10)
```

---

# 11. BENEFIT SYSTEM

Separate benefits from technical features.

Benefits are customer-facing.

Example:

```text
Priority Support
Free Onboarding
Advanced Analytics
Dedicated Account Manager
Early Access
Enterprise Reports
```

Admin should be able to attach benefits to plans.

Customer portal should show:

```text
Your Plan
────────────────────

Professional Pro

Your Benefits

✓ Priority Support
✓ Advanced Analytics
✓ AI Assistant
✓ 100 GB Storage
✓ Early Access
```

---

# 12. PROFESSION / CUSTOMER SEGMENT

Allow customer segmentation.

Examples:

```text
Student
Working Professional
Developer
Designer
Founder
Enterprise
Education
Startup
Other
```

Do not hard-code these.

Admin should be able to create/edit/deactivate customer segments.

A segment may influence:

* Available plans
* Pricing
* Benefits
* Features
* Onboarding
* Notifications
* Content
* Offers

---

# 13. ORGANIZATION MANAGEMENT

Organizations should be first-class entities.

Organization owner can:

* Invite members
* Remove members
* Change roles
* View usage
* View subscription
* Manage allowed organization settings

Example:

```text
Acme Technologies

Subscription:
Enterprise

Seats:
100

Used:
74

Available:
26
```

Admin should see:

```text
Organization
Members
Subscription
Usage
Billing
Activity
Notifications
Support
```

---

# 14. ADMIN DASHBOARD

Create a beautiful professional admin dashboard.

Dashboard should contain:

### KPIs

```text
Total Customers
Active Subscribers
Trial Customers
Cancelled Subscriptions
MRR
ARR
New Customers
Churn
Active Organizations
Total Users
```

Include charts for:

* Subscriber growth
* Revenue
* Subscription distribution
* Customer type distribution
* Plan distribution
* Churn
* User growth

Do not create meaningless decorative charts.

Every chart must correspond to useful business information.

---

# 15. ADMIN CUSTOMER MANAGEMENT

Create:

```text
/admin/customers
```

Features:

* Search
* Filters
* Pagination
* Sort
* Customer type
* Subscription status
* Plan
* Profession
* Registration date
* Last login
* Account status

Customer table:

```text
Customer
Type
Plan
Status
Users
Created
Last Active
Actions
```

Actions:

```text
View
Edit
Suspend
Reactivate
Change Plan
Send Notification
View Activity
View Subscription
View Billing
```

---

# 16. CUSTOMER DETAIL PAGE

Create a detailed customer profile.

Tabs:

```text
Overview
Users
Subscription
Billing
Benefits
Features
Usage
Notifications
Support
Documents
Activity
Audit
```

Overview should show:

```text
Customer Name
Customer Type
Profession
Account Status
Current Plan
Subscription Status
Created At
Last Active
```

For organizations also show:

```text
Seats
Members
Usage
Owner
```

---

# 17. ADMIN PLAN MANAGEMENT

Route:

```text
/admin/plans
```

Features:

* Create plan
* Edit plan
* Duplicate plan
* Archive plan
* Activate/deactivate
* Pricing
* Billing interval
* Trial duration
* Customer type
* Benefits
* Features
* Limits

Plan builder should be structured.

Example:

```text
Create Plan

Basic Information
Pricing
Target Customer
Features
Benefits
Usage Limits
Trial
Billing
Visibility
```

---

# 18. NOTIFICATION SYSTEM

This is extremely important.

Admins must be able to communicate with customers.

Build a complete notification system.

Admin can send:

```text
Platform-wide notification
Segment notification
Plan-specific notification
Organization-specific notification
Individual customer notification
```

Examples:

```text
All subscribers

All Professional customers

All Enterprise customers

Specific organization

Specific user
```

---

# 19. NOTIFICATION TYPES

Support:

```text
INFO
SUCCESS
WARNING
URGENT
SYSTEM
BILLING
SUBSCRIPTION
SECURITY
ANNOUNCEMENT
```

Customer portal should have:

```text
Notification Bell
Unread Count
Notification Center
```

Notifications should support:

```text
Title
Message
Type
Priority
Target
Action URL
Created At
Expires At
Read At
```

---

# 20. ANNOUNCEMENT SYSTEM

Separate announcements from normal notifications.

Admin can create:

```text
Announcement
```

with:

```text
Title
Description
Audience
Priority
Start Date
End Date
CTA
Status
```

Audience can be:

```text
Everyone
Students
Professionals
Organizations
Specific Plan
Specific Organization
Specific Customer
```

Customer portal can display announcements as:

* Banner
* Notification
* Dashboard card
* Modal where appropriate

Do not annoy users with excessive modals.

---

# 21. CUSTOMER DASHBOARD

Customer dashboard should be personalized based on:

* Customer type
* Plan
* Permissions
* Entitlements
* Usage

Example:

```text
Good morning, Akshay

Professional Pro
Active until 14 Sep 2026

Your Benefits
✓ AI Assistant
✓ Priority Support
✓ Advanced Analytics

Usage
Projects      7 / 10
Storage       12 / 20 GB
Team Members  1 / 1

Latest Updates
...

Quick Actions
View Subscription
Manage Account
Contact Support
```

---

# 22. ORGANIZATION DASHBOARD

Organization users should see organization-specific information.

Example:

```text
Acme Technologies

Enterprise Plan

74 / 100 seats used

Usage
Storage
API Usage
Active Users

Organization Updates

Recent Activity
```

Owners/admins get additional controls.

Normal members should not see billing or administrative controls.

---

# 23. BILLING

Build billing architecture independently from UI.

Support:

* Subscription price
* Billing interval
* Invoice history
* Payment status
* Payment methods
* Tax information
* Billing address
* Refund state
* Failed payment state

Make the payment provider replaceable.

Do not tightly couple business logic to one payment provider.

Design an abstraction such as:

```text
PaymentProvider
    ├── createCustomer()
    ├── createSubscription()
    ├── cancelSubscription()
    ├── refund()
    └── getInvoices()
```

---

# 24. SUPPORT SYSTEM

Customers should be able to create support requests.

Example:

```text
Support

Create Request

Category
Subject
Description
Priority
Attachment
```

Admin can manage:

```text
Open
In Progress
Waiting
Resolved
Closed
```

Customer can see ticket history.

---

# 25. DOCUMENT / RESOURCE AREA

Provide a customer resource section.

Depending on entitlement:

```text
Documents
Guides
Reports
Certificates
Invoices
Resources
Downloads
```

Do not expose resources that the customer's plan does not allow.

---

# 26. ADMIN IMPERSONATION / SUPPORT ACCESS

If implementing customer impersonation:

Make it extremely secure.

Admin must explicitly initiate it.

Display a strong banner:

```text
You are viewing this account as support administrator.
```

Log:

```text
Admin
Customer
Timestamp
IP/device metadata where appropriate
Reason
Actions performed
```

Never silently impersonate users.

---

# 27. AUDIT LOGGING

Create immutable audit events.

Track important operations:

```text
LOGIN
LOGOUT
PLAN_CHANGED
SUBSCRIPTION_CREATED
SUBSCRIPTION_CANCELLED
USER_INVITED
USER_REMOVED
ROLE_CHANGED
NOTIFICATION_SENT
CUSTOMER_SUSPENDED
CUSTOMER_REACTIVATED
BILLING_CHANGED
ADMIN_ACTION
```

Example:

```text
Admin Akshay changed
Acme Technologies
from Professional Pro
to Enterprise

14 Aug 2026, 18:42
```

---

# 28. DATABASE ARCHITECTURE

Design a normalized relational database.

Prefer PostgreSQL.

Core entities should conceptually include:

```text
users
customers
organizations
organization_members
roles
permissions
role_permissions

customer_segments

plans
plan_features
plan_benefits
features
benefits

subscriptions
subscription_items
subscription_history

usage_records
usage_limits

payments
invoices

notifications
notification_recipients
announcements

support_tickets
support_messages

documents

audit_logs

sessions
```

Use UUIDs.

Use foreign keys.

Use indexes strategically.

Use timestamps consistently.

Use soft deletion only where appropriate.

Do not create a giant JSONB table for everything.

Use JSONB only where flexible metadata is genuinely useful.

---

# 29. DATA OWNERSHIP

Clearly distinguish:

```text
User
```

from:

```text
Customer Account
```

from:

```text
Organization
```

from:

```text
Subscription
```

Example:

```text
User
  ↓
Membership
  ↓
Organization
  ↓
Subscription
  ↓
Plan
```

This prevents architectural problems later.

---

# 30. API ARCHITECTURE

Build clean APIs.

Example:

```text
/api/auth

/api/users

/api/customers

/api/organizations

/api/plans

/api/features

/api/benefits

/api/subscriptions

/api/billing

/api/notifications

/api/announcements

/api/support

/api/documents

/api/usage

/api/audit
```

Separate:

```text
Admin APIs
Customer APIs
Organization APIs
Public APIs
```

Apply authorization middleware consistently.

---

# 31. FRONTEND ROUTING

Create two major application experiences.

## Admin

```text
/admin
/admin/customers
/admin/customers/:id
/admin/organizations
/admin/organizations/:id
/admin/plans
/admin/features
/admin/benefits
/admin/subscriptions
/admin/billing
/admin/notifications
/admin/announcements
/admin/support
/admin/documents
/admin/audit
/admin/settings
```

## Customer

```text
/app
/app/dashboard
/app/profile
/app/subscription
/app/benefits
/app/features
/app/usage
/app/billing
/app/notifications
/app/announcements
/app/support
/app/documents
/app/settings
```

Organization:

```text
/app/organization
/app/organization/users
/app/organization/usage
/app/organization/settings
```

Only expose routes that the current user is authorized to access.

---

# 32. UI/UX REQUIREMENTS

The UI must look like a serious modern SaaS product.

Design principles:

* Clean
* Professional
* Minimal
* Fast
* Responsive
* Accessible
* Consistent
* Mobile friendly
* Excellent empty states
* Excellent loading states
* Excellent error states

Avoid:

* Excessive gradients
* Overuse of glassmorphism
* Giant cards
* Random animations
* Decorative charts
* Cluttered dashboards

Use:

* Strong typography
* Proper spacing
* Data tables
* Command/search experiences
* Contextual actions
* Clear status badges
* Good confirmation dialogs
* Skeleton loaders
* Toast notifications

---

# 33. ADMIN SIDEBAR

Create a logical navigation structure.

```text
Dashboard

Customers
Organizations
Users

Subscriptions
Plans
Features
Benefits
Billing

Notifications
Announcements

Support
Documents

Analytics

Audit Logs

Settings
```

Use collapsible sections where appropriate.

---

# 34. CUSTOMER SIDEBAR

```text
Dashboard

My Account
Subscription
Benefits
Usage

Notifications
Announcements

Billing

Support
Documents

Settings
```

For organizations:

```text
Organization
Members
Usage
Settings
```

---

# 35. SEARCH

Implement global admin search.

Admin should be able to search:

```text
Customer
Email
Organization
Subscription
Invoice
User
Support ticket
```

Example:

```text
Search "acme"
```

returns relevant entities.

---

# 36. FILTERING

Admin tables must support:

```text
Search
Status
Customer Type
Profession
Plan
Subscription
Created Date
Last Active
```

Use server-side pagination for large datasets.

Do not load thousands of records into the browser.

---

# 37. SECURITY

Treat this as a production financial/customer platform.

Implement:

* Input validation
* Authorization
* Authentication
* Rate limiting
* CSRF protection where applicable
* Secure cookies
* Security headers
* SQL injection protection
* XSS protection
* File upload validation
* Malware scanning architecture for uploaded files
* Encryption for sensitive data where appropriate
* Secret management
* Audit logging
* Session invalidation
* Brute-force protection

Never trust frontend authorization.

All important authorization decisions must happen server-side.

---

# 38. TENANCY ISOLATION

Organization data must never leak between organizations.

Every organization-scoped query must enforce tenant ownership.

Do not rely only on frontend filtering.

Create a reusable tenancy context.

Conceptually:

```text
request
 ↓
authenticate
 ↓
resolve customer
 ↓
resolve organization
 ↓
authorize
 ↓
execute query
```

---

# 39. NOTIFICATION DELIVERY ARCHITECTURE

Design notifications so future channels can be added.

Example:

```text
Notification Service
      │
      ├── In-App
      ├── Email
      ├── Push
      └── SMS
```

Start with:

```text
In-App
Email
```

but keep the architecture extensible.

Use asynchronous processing for large notification campaigns.

For example:

```text
Admin creates announcement
        ↓
Notification Service
        ↓
Queue
        ↓
Workers
        ↓
Recipients
```

Do not block the admin request while sending thousands of emails.

---

# 40. EMAIL EVENTS

Create transactional email events for:

```text
Welcome
Email Verification
Password Reset
Subscription Created
Subscription Renewed
Payment Failed
Subscription Cancelled
Plan Changed
Organization Invitation
Support Ticket Created
Support Ticket Updated
Important Announcement
```

Use templates.

Do not hard-code email HTML into controllers.

---

# 41. ADMIN NOTIFICATION COMPOSER

Build a UI such as:

```text
Create Notification

Title
Message

Audience:
○ Everyone
○ Customer Type
○ Profession
○ Plan
○ Organization
○ Individual

Channels:
☑ In-App
☑ Email
☐ Push

Priority:
Normal
High
Urgent

Schedule:
Send Now
Schedule

Preview
```

Before sending to a large audience, show:

```text
Estimated recipients: 4,283
```

Require confirmation.

---

# 42. PLAN CHANGE FLOW

Customer:

```text
Current Plan
      ↓
View Available Plans
      ↓
Compare
      ↓
Select Plan
      ↓
Confirm
      ↓
Payment
      ↓
Subscription Updated
      ↓
Entitlements Updated
      ↓
Notification
```

Admin should also be able to change plans where authorized.

Every change must be auditable.

---

# 43. CUSTOMER ONBOARDING

After registration:

```text
Create Account
      ↓
Verify Email
      ↓
Select Customer Type
      ↓
Select Profession
      ↓
Select Plan
      ↓
Payment / Trial
      ↓
Profile Setup
      ↓
Dashboard
```

For organization:

```text
Create Organization
      ↓
Organization Details
      ↓
Choose Plan
      ↓
Payment
      ↓
Invite Members
      ↓
Organization Dashboard
```

---

# 44. INVITATION FLOW

Organization owner/admin can invite users.

```text
Enter email
      ↓
Select role
      ↓
Send invitation
      ↓
Email
      ↓
Accept invitation
      ↓
Create/login account
      ↓
Join organization
```

Invitation must expire.

Allow resend/revoke.

---

# 45. USAGE SYSTEM

Create a generic usage tracking mechanism.

Examples:

```text
API Calls
Storage
Projects
Team Members
AI Requests
Reports
Exports
```

Plan:

```text
AI_REQUESTS = 1,000/month
```

Usage:

```text
742 / 1000
```

When nearing limit:

```text
80% → warning
90% → warning
100% → limit reached
```

Allow future configurable thresholds.

---

# 46. FEATURE GATING

Feature availability should be determined server-side.

Example:

```text
if entitlement.has("ADVANCED_ANALYTICS")
    allow
else
    show upgrade experience
```

Customer UI should gracefully explain unavailable features.

Example:

```text
Advanced Analytics

Available on Professional Pro and Enterprise.

[View Plans]
```

Do not simply hide everything without explanation.

---

# 47. ADMIN ANALYTICS

Create analytics around:

### Customers

```text
New Customers
Active Customers
Inactive Customers
Customer Growth
```

### Subscriptions

```text
Active
Trial
Cancelled
Expired
Past Due
```

### Revenue

```text
MRR
ARR
Revenue by Plan
Revenue by Customer Type
```

### Engagement

```text
DAU
MAU
Last Login
Feature Usage
```

### Organizations

```text
Organizations
Seats
Seat Utilization
Active Users
```

---

# 48. SETTINGS

Admin settings:

```text
Platform Settings
Authentication
Email
Notifications
Billing
Subscription
Security
Feature Flags
```

Customer settings:

```text
Profile
Security
Notifications
Email Preferences
Billing
```

Organization settings:

```text
Organization Profile
Members
Roles
Billing
Security
```

---

# 49. FEATURE FLAGS

Create a feature flag system so administrators can enable/disable features without redeploying.

Example:

```text
AI_ASSISTANT
NEW_DASHBOARD
BETA_ANALYTICS
ADVANCED_REPORTING
```

Allow future targeting:

```text
Everyone
Customer Type
Plan
Organization
Specific Customer
```

---

# 50. ERROR HANDLING

Implement consistent API error format.

Example:

```json
{
  "success": false,
  "error": {
    "code": "SUBSCRIPTION_LIMIT_REACHED",
    "message": "Your current plan has reached its limit."
  }
}
```

Never expose internal stack traces to users.

---

# 51. OBSERVABILITY

Include architecture for:

* Structured logging
* Error tracking
* API latency
* Database performance
* Queue monitoring
* Notification delivery
* Subscription events
* Authentication events

Important admin operations must be traceable.

---

# 52. TESTING

Create tests for every important business flow.

## Unit

Test:

```text
Entitlements
Plan calculation
Subscription transitions
Permissions
Usage limits
Notification targeting
```

## Integration

Test:

```text
Authentication
Subscription APIs
Organization APIs
Notification APIs
Billing APIs
```

## E2E

Test:

```text
Customer registration
Login
Subscription purchase
Plan upgrade
Organization creation
Member invitation
Notification delivery
Admin customer management
Customer suspension
Subscription cancellation
```

Test unauthorized access explicitly.

---

# 53. SEED DATA

Create realistic development seed data.

Example:

```text
Admin
Demo Student
Demo Professional
Demo Organization
Organization Owner
Organization Admin
Organization Members

Plans:
Student Basic
Student Pro
Professional Basic
Professional Pro
Organization Starter
Organization Enterprise

Features
Benefits
Notifications
Subscriptions
Invoices
```

---

# 54. DOCUMENTATION

Create comprehensive documentation.

Directory:

```text
/docs

01-overview.md
02-architecture.md
03-domain-model.md
04-authentication.md
05-authorization.md
06-multi-tenancy.md
07-subscriptions.md
08-plans.md
09-entitlements.md
10-benefits.md
11-organizations.md
12-notifications.md
13-billing.md
14-support.md
15-usage.md
16-api.md
17-database.md
18-security.md
19-testing.md
20-observability.md
21-deployment.md
22-admin-guide.md
23-customer-guide.md
24-troubleshooting.md
```

Also generate:

```text
ERD
Architecture diagram
Sequence diagrams
Authentication flow
Subscription lifecycle
Notification flow
Organization invitation flow
Plan upgrade flow
```

---

# 55. PROJECT STRUCTURE

Use a clean modular architecture.

Example:

```text
apps/
    admin/
    customer/

services/
    auth/
    customers/
    organizations/
    subscriptions/
    entitlements/
    billing/
    notifications/
    support/
    usage/
    audit/

packages/
    database/
    ui/
    types/
    validation/
    permissions/
    config/
```

Adapt this structure to the existing codebase if one already exists.

Do NOT blindly create a monorepo if the existing project architecture does not justify it.

First inspect the existing repository.

---

# 56. DEVELOPMENT WORKFLOW

Before writing code:

## Phase 1 — Repository Analysis

Inspect:

```text
Existing architecture
Frontend
Backend
Database
Authentication
Existing users
Existing subscription logic
Existing APIs
Existing UI
Deployment
Environment variables
```

Identify what can be reused.

Do not rewrite functioning systems unnecessarily.

---

# 57. PHASE 2 — ARCHITECTURE

Produce:

```text
Architecture Decision Record
Database ERD
Domain model
API architecture
Authentication architecture
Authorization architecture
Subscription architecture
Entitlement architecture
Notification architecture
Multi-tenancy architecture
```

Get the architecture internally consistent before implementation.

---

# 58. PHASE 3 — DATABASE

Implement:

```text
Users
Customers
Organizations
Memberships
Plans
Features
Benefits
Subscriptions
Billing
Notifications
Support
Audit
Usage
```

Add:

* Constraints
* Indexes
* Foreign keys
* Unique constraints
* Migration strategy
* Seed data

---

# 59. PHASE 4 — BACKEND

Implement modules in this order:

```text
Authentication
        ↓
Users
        ↓
Customers
        ↓
Organizations
        ↓
Roles & Permissions
        ↓
Plans
        ↓
Features & Benefits
        ↓
Entitlements
        ↓
Subscriptions
        ↓
Usage
        ↓
Billing
        ↓
Notifications
        ↓
Announcements
        ↓
Support
        ↓
Audit
```

---

# 60. PHASE 5 — ADMIN PANEL

Implement:

```text
Dashboard
Customers
Organizations
Plans
Features
Benefits
Subscriptions
Billing
Notifications
Announcements
Support
Analytics
Audit
Settings
```

Every admin page must have:

* Loading state
* Empty state
* Error state
* Pagination
* Search where appropriate
* Filters where appropriate
* Permission checks
* Confirmation for destructive actions

---

# 61. PHASE 6 — CUSTOMER PORTAL

Implement:

```text
Login
Onboarding
Dashboard
Profile
Subscription
Benefits
Features
Usage
Billing
Notifications
Announcements
Support
Documents
Settings
```

Render different experiences based on:

```text
customer_type
role
plan
entitlements
organization membership
```

---

# 62. PHASE 7 — ORGANIZATION PORTAL

Implement:

```text
Organization Dashboard
Members
Invitations
Roles
Usage
Subscription
Billing
Settings
Activity
```

Ensure members cannot access owner/admin functionality.

---

# 63. PHASE 8 — NOTIFICATIONS

Implement:

```text
In-app notification center
Unread count
Notification preferences
Admin composer
Audience targeting
Queue processing
Email delivery
Notification history
```

---

# 64. PHASE 9 — BILLING

Implement provider abstraction.

Then integrate the selected payment provider.

Keep:

```text
Business Logic
```

separate from:

```text
Payment Provider
```

---

# 65. PHASE 10 — SECURITY REVIEW

Perform a security audit covering:

```text
Authentication
Authorization
Tenant isolation
IDOR
Privilege escalation
Session security
Input validation
File uploads
Rate limiting
Secrets
Payment security
Admin access
Impersonation
Audit logs
```

Attempt to access another organization's data using:

* Modified IDs
* Modified URLs
* Modified request bodies
* Modified JWT/session claims
* Direct API requests

All must fail.

---

# 66. PHASE 11 — TESTING

Run:

```text
Lint
Type checking
Unit tests
Integration tests
E2E tests
Security tests
Database migration tests
Build
```

Fix all critical failures.

---

# 67. PHASE 12 — DOCUMENTATION

Do not finish the project without documentation.

Document:

```text
Architecture
Database
APIs
Authentication
Authorization
Plans
Entitlements
Subscriptions
Notifications
Billing
Organizations
Admin workflows
Customer workflows
Deployment
Environment variables
Testing
Troubleshooting
```

---

# 68. CRITICAL BUSINESS FLOWS TO IMPLEMENT

The final system must support these complete flows.

## Flow 1 — Individual Student

```text
Register
 ↓
Verify
 ↓
Select Student
 ↓
Choose Student Plan
 ↓
Payment/Trial
 ↓
Account Activated
 ↓
Student Dashboard
 ↓
Receive Notifications
 ↓
Use Plan Features
```

## Flow 2 — Professional

```text
Register
 ↓
Professional Profile
 ↓
Choose Professional Plan
 ↓
Payment
 ↓
Dashboard
 ↓
Feature Entitlements
 ↓
Usage Tracking
```

## Flow 3 — Organization

```text
Organization Signup
 ↓
Organization Details
 ↓
Choose Organization Plan
 ↓
Payment
 ↓
Organization Created
 ↓
Owner Dashboard
 ↓
Invite Employees
 ↓
Employees Join
 ↓
Role Assignment
 ↓
Usage Tracking
```

## Flow 4 — Admin Sends Announcement

```text
Admin
 ↓
Create Announcement
 ↓
Select Audience
 ↓
Preview
 ↓
Confirm
 ↓
Queue
 ↓
Notification Service
 ↓
Customers Receive
```

## Flow 5 — Plan Upgrade

```text
Customer
 ↓
View Plans
 ↓
Compare Benefits
 ↓
Select Upgrade
 ↓
Payment
 ↓
Subscription Updated
 ↓
Entitlements Recalculated
 ↓
Features Unlocked
 ↓
Notification
```

## Flow 6 — Customer Suspension

```text
Admin
 ↓
Customer Profile
 ↓
Suspend
 ↓
Confirmation
 ↓
Audit Event
 ↓
Customer Access Restricted
 ↓
Notification Sent
```

## Flow 7 — Organization Seat Limit

```text
Organization
 ↓
Invite User
 ↓
Check Entitlement
 ↓
Seat Limit Reached
 ↓
Block Invitation
 ↓
Show Upgrade CTA
```

---

# 69. IMPORTANT PRODUCT RULE

The system must never assume:

```text
one customer = one user
```

or:

```text
one plan = one feature set forever
```

or:

```text
organization = customer
```

These concepts must remain independently modeled.

---

# 70. ADMIN CONTROL PHILOSOPHY

The admin panel should allow business operators to configure the platform without developers for common operations.

Admins should be able to:

```text
Create plans
Change pricing
Enable benefits
Disable features
Change limits
Create customer segments
Create announcements
Send notifications
Suspend accounts
Change subscriptions
Manage organizations
Manage users
View usage
View billing
```

without modifying code.

Dangerous operations should require confirmation and appropriate permissions.

---

# 71. FINAL QUALITY BAR

Do not deliver a prototype that merely looks good.

The final implementation must be:

```text
Secure
Scalable
Maintainable
Testable
Observable
Multi-tenant ready
Subscription aware
Entitlement driven
Role based
Audit friendly
Mobile responsive
Production ready
```

Avoid:

* Hard-coded plans
* Hard-coded customer types
* Hard-coded benefits
* Hard-coded permissions
* Duplicate authorization logic
* Client-side-only security
* Giant controllers
* Giant database tables
* Unnecessary JSON blobs
* Direct payment-provider coupling
* Uncontrolled admin privileges

---

# 72. FINAL DELIVERABLE

At completion provide:

```text
1. Architecture
2. Database schema
3. ERD
4. API specification
5. Admin UI
6. Customer UI
7. Organization UI
8. Authentication
9. RBAC
10. Subscription system
11. Plan management
12. Feature entitlement engine
13. Benefits engine
14. Notification system
15. Announcement system
16. Billing abstraction
17. Usage system
18. Support system
19. Audit logs
20. Analytics
21. Tests
22. Seed data
23. Documentation
24. Deployment configuration
25. Security review
```

Also provide a final:

```text
SYSTEM WORKFLOW DOCUMENT
```

that explains the entire lifecycle from:

```text
Customer Registration
        ↓
Customer Classification
        ↓
Plan Selection
        ↓
Subscription
        ↓
Entitlements
        ↓
Application Access
        ↓
Usage
        ↓
Notifications
        ↓
Billing
        ↓
Renewal / Upgrade / Downgrade
        ↓
Cancellation
        ↓
Historical Records
```

The result should feel like a **real SaaS customer-management platform**, not an admin CRUD dashboard.

Basically, we can keep the product simple with **3 subscription tiers**:

### 1. Basic / Student

* Local-machine only
* User can install our CLI
* Can connect it to any local codebase
* Local code context indexing
* Code graph + RAG/context store
* Local code review and suggestions
* Branch/commit standards
* Secret detection
* No GitHub/GitLab integration

### 2. Pro

Everything in Basic, plus:

* GitHub/GitLab integration
* Automatic PR reviews
* AI code review
* Security/secret scanning
* Branch protection
* PR policy enforcement
* Human approval requirements
* Repository-level governance
* Review history and analytics

### 3. Organization / Enterprise

Everything in Pro, plus:

* Central organization account
* Multiple users/members
* Team/role management
* Multiple repositories
* Organization-wide policies
* Centralized code governance
* Admin dashboard
* Usage analytics
* Notifications
* Audit logs
* CODEOWNERS/reviewer policies
* Custom security rules
* Centralized billing
* Organization-level AI/code context
* Repository and PR governance

### Usage limits

Each plan should have configurable limits, for example:

```text
Basic
1 account
3 repositories
100 local reviews/month

Pro
1 account
10 repositories
100 PR reviews/month

Organization
X users
X repositories
X PRs/month
X AI reviews/month
X GB code indexing
```

These limits should **not be hard-coded**. Admins should be able to configure:

* Number of users
* Number of repositories
* Number of PRs
* Number of AI reviews
* Code/context storage
* API calls
* Monthly usage
* Concurrent reviews

So the overall model becomes:

**Basic → Local Code Intelligence**

**Pro → Local + GitHub/GitLab + PR Governance**

**Organization → Everything + Team/Organization Governance + Central Admin + Scalable Usage Limits**

This also gives us a clean upgrade path: **Student → Pro → Organization** without redesigning the underlying architecture.
