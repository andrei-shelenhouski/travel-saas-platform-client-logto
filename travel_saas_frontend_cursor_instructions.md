# Travel SaaS Platform -- Frontend Implementation Guide

## Full Step-by-Step Instructions for Cursor

------------------------------------------------------------------------

## Context

You are implementing the frontend for a multi-tenant B2B SaaS platform
for tour operators.

Authentication is already implemented using **Logto (OIDC)**.

Backend: - NestJS - Pattern A (X-Organization-Id header required) -
Multi-tenant architecture - Entities: Lead, Offer, Booking, Invoice -
GET /me endpoint returns user + organizations

Frontend stack: - Angular (standalone architecture) - Logto
authentication already working

------------------------------------------------------------------------

# Core Architecture Rules (DO NOT VIOLATE)

1.  Organization is NEVER inferred from token.
2.  Organization is selected explicitly by user.
3.  X-Organization-Id must be sent on every protected request.
4.  No business logic inside interceptors.
5.  No global mutable state.
6.  All flows are deterministic and explicit.

------------------------------------------------------------------------

# PHASE 1 --- Application Structure

## Folder Structure

Create clear feature-based structure:

src/app/ core/ auth/ interceptors/ guards/ services/ features/
onboarding/ leads/ offers/ bookings/ invoices/ shared/ components/
models/ layout/

------------------------------------------------------------------------

# PHASE 2 --- Bootstrap Flow

After successful Logto login:

1.  Retrieve access token.
2.  Immediately call GET /me.
3.  Do NOT send X-Organization-Id in this request.
4.  Store user and organizations temporarily.
5.  Route to onboarding decision.

No other API calls allowed before /me completes.

------------------------------------------------------------------------

# PHASE 3 --- Organization State Service

Create OrganizationStateService with:

-   setActiveOrganization(orgId: string)
-   getActiveOrganization(): string \| null
-   clear()
-   activeOrganization\$ observable

Persist organizationId in localStorage.

Never compute organization automatically.

------------------------------------------------------------------------

# PHASE 4 --- Onboarding Decision Logic

Based on organizations returned from /me:

If 0 organizations: → Route to /onboarding/create-organization

If 1 organization: → setActiveOrganization(orgId) → Route to /app

If \>1 organization: → Route to /onboarding/select-organization

------------------------------------------------------------------------

# PHASE 5 --- Create Organization Screen

Simple form: - Organization name input - Create button

On submit: POST /organizations Authorization only (no X-Organization-Id)

On success: - setActiveOrganization(orgId) - Redirect to /app

------------------------------------------------------------------------

# PHASE 6 --- Select Organization Screen

Display list of organizations.

On selection: - setActiveOrganization(orgId) - Redirect to /app

No API call required.

------------------------------------------------------------------------

# PHASE 7 --- Main Layout

Desktop-first layout with:

Left Sidebar: - Leads - Offers - Bookings - Invoices - Settings

Top bar: - Organization name (read-only) - User info - Logout

------------------------------------------------------------------------

# PHASE 8 --- HTTP Interceptor

Interceptor responsibilities:

1.  Read access token.
2.  Read activeOrganizationId.
3.  If org missing → cancel request + redirect to onboarding.
4.  Attach headers: Authorization: Bearer `<token>`{=html}
    X-Organization-Id: `<orgId>`{=html}

Do NOT perform onboarding logic inside interceptor.

------------------------------------------------------------------------

# PHASE 9 --- App Guard

Before accessing /app:

Ensure: - User authenticated - activeOrganizationId exists

If not → redirect to onboarding.

------------------------------------------------------------------------

# PHASE 10 --- Feature Modules

## Leads

List page: - Table view - Create lead button

Detail page: - Contact info - Notes - Status update

## Offers

List: - Filter by status

Detail: - Title - Description - Price - Status actions

## Bookings

Create from ACCEPTED offer only. Simple confirmation screen.

## Invoices

List: - Number - Amount - Status

Detail: - Mark as Paid

------------------------------------------------------------------------

# PHASE 11 --- Global Error Handling

401 → logout + login 400 (org missing) → clear org + onboarding 403 →
clear org + onboarding + message

------------------------------------------------------------------------

# PHASE 12 --- Manual Test Scenarios

1.  New user → create org → app
2.  One org → auto-select → app
3.  Multiple org → select → app
4.  Refresh page → org restored
5.  Removed membership → 403 → onboarding

------------------------------------------------------------------------

# FINAL RESULT

Frontend must:

-   Be multi-tenant safe
-   Support SSO transparently
-   Never leak cross-organization data
-   Remain deterministic and explicit

------------------------------------------------------------------------

End of Instructions
