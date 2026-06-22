# TIK TAK RUN - Project Modules and Unified Rules & Policies

## Purpose
This document is the single review-and-policy reference for the TIK TAK RUN project.

It has two goals:

1. Review the project modules and explain how the platform is organized.
2. Define the canonical rules and policies that must stay consistent across `apps/web`, `apps/admin`, `apps/api`, shared packages, docs, and operational tooling.

If any screen, local type, helper, or legacy document conflicts with this file, this file should be treated as the product-policy source of truth until the implementation is aligned.

## Source Of Truth Order
To avoid duplication and inconsistency, the project must follow this authority order:

1. **Business policy document**: this file for product rules, operational rules, and consistency requirements.
2. **Canonical backend schema and enums**:
   - `apps/api/prisma/schema.prisma`
   - `packages/shared-types/src/enums.ts`
3. **Canonical module boundaries**:
   - `apps/api/src/app.module.ts`
4. **Canonical configurable settings**:
   - `apps/api/src/modules/settings/settings.service.ts`
5. **Policy enforcement services**:
   - booking, auth, wallet, discount, gamification, chat, review, ticket, notification, and role services in `apps/api/src/modules/**`

Frontend and admin code must consume these definitions, not redefine them independently.

## Project Module Review

### Monorepo Structure
- `apps/web`: public site and authenticated customer experience.
- `apps/admin`: admin dashboard for CRM, operations, finance, moderation, reporting, and configuration.
- `apps/api`: NestJS backend and the main business-rule enforcement layer.
- `packages/shared-types`: shared enums, models, request/response contracts.
- `packages/ui`: shared UI primitives.
- `packages/config`: shared TypeScript, ESLint, and Tailwind configuration.
- `infra`: Docker, Nginx, deployment, backup, restore, and environment operations.
- `docs`: supplemental project and delivery documentation.

### Web Modules
The web app is the customer-facing product and includes these main module areas:

- **Discovery and catalog**: home, sections, game listings, game detail pages.
- **Authentication**: OTP login and invite entry.
- **Booking**: booking flow, booking result, booking history, booking detail.
- **Wallet**: wallet overview, charge, convert, coin/diamond packages, transactions.
- **Profile**: profile view, edit, public profile, avatar customization.
- **Gamification**: leaderboard and spin wheel.
- **Community**: chat/community views and team creation/joining.
- **Invites**: personal referral flow.
- **Support**: ticket list, ticket creation, ticket detail.
- **Notifications**: in-app notifications center.
- **Static pages**: about and contact.

### Admin Modules
The admin app is the operations and command center and includes these main module areas:

- **Dashboard**: overview and KPIs.
- **Customers / CRM**: customers, segments, activities, pipeline.
- **Campaigns and growth**: campaigns, discount codes, auto discounts, monthly rewards.
- **Operations**: bookings, booking calendar, manual booking, games, branches, cities, categories.
- **Community and trust**: chats, reported chats, reviews, comments, tickets.
- **Finance**: transactions, payments, financial reports, backup.
- **Gamification management**: badges, levels, avatars, wheel prizes, wheel spins, wheel stats.
- **Security and governance**: roles, audit, staff, settings.
- **Settings**: general, financial, chat, security, payments, SMS, theme, gamification.

### API Modules
The API is the canonical business layer. Current modules are grouped as follows.

#### Core and identity
- `auth`
- `sms`
- `users`
- `profile`
- `notifications`
- `roles`
- `settings`
- `audit`

#### Commerce and booking
- `wallet`
- `payments`
- `bookings`
- `discounts`
- `reviews`

#### Catalog and location
- `cities`
- `branches`
- `categories`
- `games`

#### Community and engagement
- `invites`
- `gamification`
- `wheel`
- `chat`
- `teams`
- `tickets`
- `top`
- `weekly`
- `monthly`

#### CRM and operations
- `customers`
- `segments`
- `pipeline`
- `campaigns`
- `analytics`
- `backup`

## Unified Policy Principles
All policies below must be applied consistently in code, UI, docs, and admin workflows.

### 1. Canonical enums must not be duplicated
- Roles, statuses, types, and state-machine values must come from backend schema and `packages/shared-types`.
- Admin-specific local type definitions must not invent alternate values for the same concept.
- If a new role, status, or enum value is added, the change must be updated in:
  - backend schema/enums
  - shared types
  - backend enforcement
  - admin/web UI
  - this document if product behavior changes

### 2. Backend policy enforcement is authoritative
- The API is the final decision-maker for all protected actions.
- Web and admin apps may guide or validate UX, but must not define different business rules from the API.
- Any frontend constraint that affects business policy must mirror backend logic rather than replace it.

### 3. Configurable policy must use centralized settings
- Runtime-configurable behavior belongs in the settings module.
- Hardcoded business constants should be avoided when the setting already exists centrally.
- Setting keys must be named consistently across backend, shared types, admin forms, and docs.

### 4. One concept, one name
- A domain concept must have one canonical name across the system.
- Examples:
  - `BRANCH_MANAGER` must not appear elsewhere as `MANAGER` for the same permission model.
  - `LEADS` must not be represented elsewhere as `LEAD` for the same pipeline stage.
  - `INAPP` must not be represented elsewhere as `IN_APP` for the same campaign type.

## Unified Product Rules And Policies

### Authentication and Identity Policy
- Customer authentication uses OTP-based mobile login.
- Admin authentication uses password-based login.
- The canonical public auth flows are:
  - request OTP
  - verify OTP
  - refresh token
  - logout
  - fetch current user
  - admin login
- JWT-based authentication is the platform standard for protected API access.
- Invite code handling is part of the registration/login entry flow when applicable.
- OTP expiry, login-attempt limits, and other security timing values must be managed from the central settings model whenever configurable.

### Authorization and Role Policy
- The canonical roles are:
  - `SUPER_ADMIN`
  - `ADMIN`
  - `BRANCH_MANAGER`
  - `SUPPORT`
  - `MARKETING`
  - `CUSTOMER`
- No other alias role names should be used for the same authorization system.
- All admin and staff capabilities must resolve to this role model.
- Role checks and permission checks must be enforced in backend-protected endpoints.
- Branch-scoped users must only access data and actions belonging to their assigned branch unless elevated by role.
- The permission vocabulary must be unified. Wildcard or alternate permission naming schemes must not diverge from the backend model.

### Booking Policy
- Booking is a governed lifecycle, not a free-form record.
- The canonical booking lifecycle is:
  - `PENDING`
  - `CONFIRMED`
  - `COMPLETED`
  - `CANCELLED`
  - `REFUNDED`
- Booking state changes must follow a valid state machine.
- User-initiated cancellation rules, refund eligibility, and automatic timeout/auto-complete behavior must be consistent everywhere they are shown.
- Booking slot validation must be enforced by the backend, including advance-time rules and concurrency protection.
- Admin-created manual bookings must follow the same underlying booking policy as user-created bookings, except where a documented elevated override exists.

### Refund Policy
- Refund behavior is part of booking and wallet policy, not a separate ad hoc action.
- Customer-facing cancellation/refund rules and admin-facing refund rules must produce consistent financial outcomes for the same business case.
- If refund windows or refund percentages are configurable, those values must come from centralized settings rather than duplicated constants.
- Refunds must leave an auditable financial trail.

### Wallet and Payments Policy
- The platform wallet supports the canonical currencies:
  - `TOMAN`
  - `COINS`
  - `DIAMONDS`
  - `XP`
- Wallet adjustments, purchases, refunds, and reward credits must be recorded as transactions.
- Customer wallet charging uses the configured payment gateway flow.
- Admin manual adjustments are privileged actions and must be auditable.
- Min/max top-up limits must be defined once and consumed consistently across API, admin, and customer UI.

### Discounts and Promotions Policy
- Discounts must be validated centrally by the backend.
- Discount evaluation may include:
  - direct discount codes
  - automatic rules
  - date windows
  - usage caps
  - minimum purchase constraints
  - game-specific targeting
  - segment targeting
- If code-based and auto discounts are compared, the resolution behavior must be documented and consistent. Stacking rules must be explicitly defined and not inferred differently by different apps.
- Promotion copy shown in UI must not promise behavior the API does not enforce.

### Gamification Policy
- Gamification includes levels, XP, coins, diamonds, badges, wheel rewards, invites, and monthly rewards.
- XP and reward logic must have one authoritative calculation path.
- Booking reward values, invite reward values, review reward values, and wheel costs must not be duplicated with conflicting constants.
- Any reward that is intended to be configurable must be read from centralized settings.
- Level progression must follow one canonical model across profile, wheel, rewards, and reporting.

### Chat, Teams, and Moderation Policy
- Chat rooms and message states must use the canonical shared enums.
- Message reporting, auto-mute behavior, mute durations, hide/delete actions, and moderation thresholds must be centrally enforced.
- Team lifecycle rules must be consistent across community UI, team APIs, and admin moderation flows.
- Community safety actions such as warnings, mute, ban, hide, and delete must be auditable.

### Reviews and Reputation Policy
- Reviews are tied to completed experiences only.
- Review submission eligibility must be enforced by booking completion rules.
- Public review visibility must depend on moderation/approval policy where applicable.
- The customer-facing review experience and admin moderation workflow must refer to the same approval model.

### Tickets and Support Policy
- Support tickets must follow one consistent status lifecycle.
- Ticket ownership, reply behavior, escalation visibility, and closure policy must be consistent in customer and admin experiences.
- Support actions that change ticket state should be auditable.

### Notifications Policy
- Notification types and channels must use the canonical shared enum model.
- Notifications triggered by booking, payment, level, badge, wheel, team, chat, system, or promotion events must originate from backend events or services.
- In-app, SMS, and email delivery rules should not be redefined separately in each client.

### Privacy, Security, and Safety Policy
- Banned, muted, suspended, or restricted users must be handled consistently in all protected backend flows.
- Rate limiting and abuse prevention are backend responsibilities first.
- Sensitive admin actions must be captured in audit logs.
- Security-related values such as OTP expiry, login attempts, and session expiry must be represented consistently in settings, docs, and enforcement code.

### Operational and Admin Governance Policy
- Maintenance mode is a central platform state and must be respected across apps.
- Backup and restore are operational workflows and must match the actual production data store.
- Admin tools must not expose capabilities that the backend does not support.
- Reports and dashboards may aggregate data differently for presentation, but they must not redefine transactional truth.

## Consistency Rules For Future Development
To keep the platform unified, every future rule or policy change must follow these rules:

1. **Update the backend rule first** if the behavior is enforced by the API.
2. **Update shared enums/types** if the domain vocabulary changes.
3. **Update web and admin UI wording** so the visible product matches the enforced rule.
4. **Update central settings keys** instead of introducing parallel keys.
5. **Update this document** when product policy changes, not only when code changes.
6. **Do not create local fallback role names or status names** for convenience.
7. **Do not create duplicate rule tables in separate docs** unless they explicitly link back to this file as the authority.

## Current Alignment Gaps To Resolve
The following areas should be treated as active consistency risks and should be aligned to this document:

### Role and permission drift
- Admin local roles currently use names such as `MANAGER` and `ANALYST`, while the shared/backend role model uses `BRANCH_MANAGER` and `MARKETING`.
- Permission naming is not fully unified across backend and admin code.

### Status and enum drift
- Booking, campaign, and pipeline values are not fully consistent between backend/shared types and admin-local types.

### Settings key drift
- Financial, chat, security, and gamification settings are not fully aligned between runtime settings and some shared/admin type definitions.

### Hardcoded business logic
- Some reward, OTP, refund, or booking constraints appear to be duplicated as constants instead of being fully driven by centralized settings.

### Documentation drift
- Some legacy docs and module READMEs describe values or behaviors that no longer match current implementation.

## Required Alignment Checklist
Before considering the app fully policy-aligned, the team should ensure:

- Shared enums are used instead of duplicated admin-local equivalents where they represent the same domain concept.
- Role names are unified across backend, admin, API responses, and UI permission helpers.
- Central settings keys are normalized and consumed consistently.
- Booking, refund, reward, OTP, and moderation rules are enforced from one canonical logic path.
- Customer-facing text, admin text, and documentation all describe the same behavior.

## Maintenance Rule
Any developer changing business behavior in auth, booking, wallet, discounts, gamification, moderation, support, or settings must review this file and update it if the policy meaning changes.

This file is intended to prevent policy drift, duplicate definitions, and inconsistent user/admin behavior across the platform.
