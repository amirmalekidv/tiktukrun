# Admin Access Structure

This document explains the intended admin access model for TIK TAK RUN and how it maps to the current codebase. In this system, a "venue" is represented by `Branch`; a venue owner or manager is a `User` with the `BRANCH_MANAGER` role and one or more assigned branches.

## Goals

- Super Admins can operate and configure the whole platform.
- Venue owners/managers can use the admin panel, but only for the venues they manage.
- Frontend route visibility, backend role checks, and API data filters should all enforce the same rules.
- Client-supplied `branchId` values must never expand a venue owner's scope.

## Core Data Model

Relevant schema pieces:

- `User`
  - Stores identity fields such as `mobile`, `email`, `fullName`, `passwordHash`, status flags, and relations.
  - Admin-panel password login requires `passwordHash`.
- `UserRoleAssignment`
  - Assigns one or more enum roles to a user.
  - Important roles are `SUPER_ADMIN`, `ADMIN`, `BRANCH_MANAGER`, `SUPPORT`, `MARKETING`, and `CUSTOMER`.
- `Branch`
  - Represents a venue/location.
  - `managerId` links the branch to the user who manages it.
- `Game`
  - Belongs to a branch through `branchId`.
- `Booking`
  - Belongs to a branch through `branchId`.
- Other branch-related records, such as `Ticket`, may also carry `branchId`.

The important tenant boundary is `Branch.id`. Venue-owner access must be derived from `User.managedBranches`, not from client input.

## Roles

### Super Admin

`SUPER_ADMIN` is the platform owner role.

Expected capabilities:

- Full platform-wide access to all branches, games, bookings, users, settings, reports, audit logs, backups, and staff/role management.
- Can create branches and assign branch managers.
- Can create or assign admin roles.
- Can see and operate across all venues.
- Bypasses role and permission checks where explicit bypass behavior exists.

Current implementation notes:

- The seeded Super Admin is created in `apps/api/prisma/seed.mongo.ts` using `SEED_SUPERADMIN_MOBILE` and `SEED_SUPERADMIN_PASSWORD`.
- `RolesGuard` and `PermissionGuard` both explicitly bypass checks for `SUPER_ADMIN`.
- `AuthService.getPermissions()` returns `['*', ...PERMISSIONS]` for `SUPER_ADMIN`.
- `AdminRolesController` is restricted to `SUPER_ADMIN`.

### Platform Admin

`ADMIN` is a platform-wide admin role.

Expected capabilities:

- Operates across all branches.
- Manages day-to-day platform data.
- Should not necessarily have the same sensitive powers as Super Admin, such as role policy changes, backups, or high-risk security settings, unless explicitly allowed.

Current implementation notes:

- `ADMIN` currently receives almost all default permissions in `packages/shared-types/src/permissions.ts`.
- `AdminUserRolesController` currently allows both `SUPER_ADMIN` and `ADMIN` to assign user roles. If role assignment should be Super Admin only, this controller should be tightened.

### Venue Owner / Branch Manager

`BRANCH_MANAGER` is the venue owner or manager role.

Expected capabilities:

- Can access the admin panel only after being assigned to at least one branch.
- Can view and manage data for their own branch or branches.
- Can view their branch profile and update safe branch fields such as name, address, phone, and location.
- Can manage own branch reservations, calendar, booking status, manual bookings, and related operational data.
- Can view games for their branch. If game management is required, create/update/delete endpoints must enforce branch ownership before allowing mutation.
- Must not see other branches' reservations, games, schedules, customer data, financial reports, settings, staff, roles, backups, or audit logs.

Current implementation notes:

- Password login rejects branch-only managers that have no managed branches.
- `JwtStrategy` derives `branchIds` from `user.managedBranches`.
- `BRANCH_MANAGER` default permissions are `bookings.read`, `bookings.write`, `games.read`, `branch.read`, `branch.write`, and `analytics.read`.
- Booking and branch services already use branch-scope helpers for important paths.
- Analytics currently allows `BRANCH_MANAGER` by role, but the analytics service does not apply branch scope yet. This should be fixed before giving owners analytics access in production.
- Game reads are branch-scoped. Most game writes are currently platform-admin only; image/rank mutations need additional branch-scope enforcement if branch managers will use them.

### Support and Marketing

`SUPPORT` and `MARKETING` are staff roles, not venue-owner roles.

Expected capabilities:

- `SUPPORT` should handle tickets, support conversations, and limited user/booking visibility as needed.
- `MARKETING` should handle CRM, segments, campaigns, and marketing analytics.
- Neither should gain branch-owner powers unless explicitly assigned.

## How Venue Owners Access the Admin Panel

A venue owner must satisfy all of these conditions:

1. A `User` exists and is active.
2. The user has `passwordHash` set for admin password login.
3. The user has a `UserRoleAssignment` with role `BRANCH_MANAGER`.
4. At least one `Branch.managerId` points to that user's `id`.
5. The user is not banned or deleted.

Login flow:

1. Owner opens the admin panel.
2. Owner logs in through `POST /auth/admin/login` with `mobile` and `password`.
3. Backend validates password and staff role in `AuthService.validateAdmin()`.
4. For branch-only managers, backend confirms `managedBranches.length > 0`.
5. Backend creates access and refresh tokens.
6. `JwtStrategy` validates later requests and attaches `roles`, primary `role`, `branchId`, and `branchIds` to `request.user`.
7. The admin frontend stores the returned admin user and tokens, then uses `branchIds` and permissions for UI decisions.

OTP login:

- Public user login uses OTP through `/auth/otp/request` and `/auth/otp/verify`.
- The current admin login page also exposes OTP and then checks whether the returned user has an admin role.
- Expected policy: Super Admins and venue owners should use the admin password flow. If OTP remains available for admin users, it should be an explicit security decision and should still require staff roles and branch assignment.

## Creating or Assigning a Venue Owner

Expected Super Admin workflow:

1. Create or identify the user account by mobile number.
2. Set an admin password or send an owner invite that lets the owner set a password.
3. Assign the `BRANCH_MANAGER` role to the user.
4. Assign the user to one or more branches by setting `Branch.managerId`.
5. Confirm the owner can log in and that `branchIds` is populated in the admin user payload.

Current implementation pieces:

- Role assignment endpoint: `POST /admin/users/:id/roles`.
- Branch manager assignment field: `Branch.managerId`.
- Branch create/update DTOs accept `managerId`.
- The branch creation UI loads users filtered by `role=BRANCH_MANAGER` and lets the admin select a manager.
- There is no complete dedicated owner-onboarding endpoint yet for creating a manager, assigning a role, assigning branches, and setting a password in one audited flow.

Recommended endpoint:

```text
POST /admin/branch-managers
```

Expected behavior:

- Super Admin only.
- Create or reuse a user by mobile.
- Set or invite password setup.
- Assign `BRANCH_MANAGER`.
- Assign one or more branches.
- Write an audit log entry.

## What Data Each Venue Owner Can Access

Venue owners should only access records whose `branchId` is in their derived `branchIds`.

Allowed for own branch:

- Branch profile.
- Games assigned to the branch.
- Booking list, booking detail, calendar, export, manual booking creation, status updates, completion, and player rating.
- Schedule or availability data if implemented as branch or game records.
- Branch-related tickets, if tickets have `branchId`.
- Branch-level analytics, once analytics queries are scoped.

Not allowed:

- Other branches.
- Platform-wide customer list and CRM unless filtered to customers who interacted with the owner branch and explicitly approved by product policy.
- Global financial reports.
- Platform settings.
- Roles and staff management.
- Audit logs and backups.
- Landing page/global content unless explicitly delegated.

If a future endpoint returns aggregate data, it must accept branch scope and include `branchId` in every query or aggregation path.

## Enforcing Own-Venue Access

### Frontend

The admin frontend provides user experience gates:

- `AuthGuard` requires an authenticated admin user and checks allowed admin roles.
- `route-permissions.ts` maps route prefixes to UI permissions.
- `permissions.ts` resolves role permissions and legacy UI permission aliases.
- `Sidebar` hides links that the current user cannot access.
- `apiClient` attaches the bearer token and refreshes expired tokens.

Frontend checks are not a security boundary. Users can still call APIs directly, so every backend route must enforce role and branch access.

Current frontend mismatch to fix:

- `BRANCH_MANAGER` has `branch.write`, so the UI may expose create-branch affordances, while the backend only allows platform admins to create branches. Use separate permissions for branch profile editing versus branch creation/deletion, or explicitly hide creation/deletion for branch managers.
- If branch managers should manage games, the UI and backend need a scoped write permission such as `games.branch.write`.

### Backend

Backend authentication and authorization layers:

- `JwtAuthGuard` is registered globally in `AppModule`.
- `JwtStrategy` verifies access token type, session validity, user existence, ban status, roles, and managed branches.
- `RolesGuard` enforces `@Roles(...)` only where `@UseGuards(RolesGuard)` is applied.
- `PermissionGuard` exists for `@RequirePermission(...)`, but it is not broadly used.
- Branch scoping is implemented in `branch-scope.helper.ts`:
  - `toBranchScope(user)`
  - `applyBranchFilter(where, scope)`
  - `resolveBranchFilter(scope, requestedBranchId)`
  - `assertResourceInBranchScope(resourceBranchId, scope)`

Expected backend rule:

- Role checks decide whether the user can enter a feature area.
- Branch-scope checks decide which records the user can see or mutate.
- For branch managers, ignore client `branchId` unless it is inside `request.user.branchIds`.
- For single-record reads or writes, load the record first, then call `assertResourceInBranchScope(record.branchId, scope)`.
- Return `404` for out-of-scope records where possible to avoid leaking that another branch's record exists.

### API Layer

All admin APIs should follow this pattern:

```ts
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(...BRANCH_OPS_ROLES)
@Controller('admin/example')
export class ExampleAdminController {
  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload, @Query('branchId') branchId?: string) {
    const branchFilter = resolveBranchFilter(toBranchScope(user), branchId);
    return this.service.findAll({ branchFilter });
  }
}
```

Services should receive a scope or resolved branch filter and apply it to Prisma queries. The API should not trust the frontend to hide or provide correct branch IDs.

## Current Enforcement Summary

Strong or mostly correct today:

- Admin password login verifies role and rejects branch-only managers without branches.
- JWT validation derives `branchIds` from database-managed branches.
- Booking admin list/detail/calendar/export/create/status/complete/rate paths use branch scope.
- Branch admin list/detail/update paths use branch scope.
- Branch manager branch updates are limited to safe fields.
- Game admin list/detail paths use branch scope.
- Ticket admin list/detail paths are branch-scoped when `branchId` exists.

Needs tightening before production reliance:

- Admin password login should reject inactive, banned, or deleted users before issuing tokens. JWT validation rejects banned/deleted users later, but `isActive` is not currently enforced as an admin-login condition.
- `RolesGuard` is not global in `AppModule`; controllers must explicitly include it or role metadata is ignored.
- `UsersAdminController` has `@Roles(Role.ADMIN)` but no `@UseGuards(RolesGuard)`, so role metadata is not enforced there.
- Analytics allows branch managers but currently returns platform-wide data.
- Some game mutations are platform-only; if owners need game/schedule management, add branch-scoped mutation endpoints. Existing image/rank mutation paths should also receive and enforce branch scope.
- Ticket update and reply should verify branch scope before mutation.
- Admin role assignment is currently allowed for `ADMIN`; decide whether only `SUPER_ADMIN` may assign roles.
- Owner onboarding is split across role assignment, branch assignment, and password setup. It should become one audited flow.
- Role definitions are static in shared code, while a `Role` model exists in the schema. Pick one source of truth and remove or wire the other.

## Expected Behavior Matrix

| Capability | Super Admin | Platform Admin | Venue Owner / Branch Manager |
| --- | --- | --- | --- |
| Admin panel login | Yes | Yes | Yes, only with assigned branch |
| View all branches | Yes | Yes | No |
| View own branch | Yes | Yes | Yes |
| Create/delete branches | Yes | Maybe, by policy | No |
| Edit own branch profile | Yes | Yes | Yes |
| View all bookings | Yes | Yes | No |
| View own branch bookings | Yes | Yes | Yes |
| Manage booking status | Yes | Yes | Own branch only |
| Issue refunds | Yes | Maybe, by policy | No |
| View all games | Yes | Yes | No |
| Manage games | Yes | Yes | Only if branch-scoped game writes are implemented |
| View analytics | Global | Global | Own branch only |
| Manage staff and roles | Yes | Maybe, by policy | No |
| Manage global settings | Yes | Maybe, by policy | No |
| Backups and audit logs | Yes | No or limited | No |

## Recommended Implementation Rules

1. Make role enforcement consistent.
   - Either register `RolesGuard` globally after `JwtAuthGuard`, or require `@UseGuards(JwtAuthGuard, RolesGuard)` on every admin controller.

2. Split global permissions from branch-scoped permissions.
   - Example: `branch.profile.write` for owner-safe branch edits.
   - Example: `branch.create` or `branches.manage` for platform-only branch creation/deletion.
   - Example: `games.branch.write` if owners can edit their own games.

3. Add a single owner-onboarding API.
   - It should assign role, branch, and password/invite together.

4. Scope analytics and reports.
   - Every query should accept a branch scope and use it in counts, sums, trends, and grouped reports.
   - Cache keys must include branch scope, for example `analytics:overview:branch:<id>`.

5. Add tests for cross-branch isolation.
   - Branch manager A cannot list, view, update, export, refund, or mutate branch B resources.
   - Super Admin can access both.
   - Branch manager without assigned branch cannot log in.

6. Treat frontend permissions as presentation only.
   - The backend must be correct even if the user manually calls an API route.
