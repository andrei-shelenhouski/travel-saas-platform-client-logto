# TSP Client App

Angular 21 SPA — travel agency CRM frontend for the travel-saas-platform.

## Commands

```bash
npm start          # dev server (ng serve)
npm run build      # production build
npm test           # Vitest test runner
npm run lint       # ESLint
npm run refresh-openapi  # pull latest OpenAPI spec from localhost:3000
```

## Architecture

**Routing:** All app features live under `/app` (guarded by `appGuard`). Onboarding at `/onboarding` (guarded by `authGuard`). All feature components are lazy-loaded standalone components.

**Auth:** Firebase Auth with Google sign-in (`signInWithRedirect`). In dev mode, connects to local Firebase Auth Emulator on port 9099. Use `AuthService` — never interact with `@angular/fire/auth` directly in components.

**Multi-tenancy:** Every API request requires `X-Organization-Id` header (injected by `orgAuthInterceptor`). The active org is held in `OrganizationStateService` and persisted to `localStorage`. If no org is set, the interceptor redirects to `/onboarding/check`.

**HTTP:** All requests go to `environment.baseUrl` (`localhost:8080` in dev). Two interceptors are registered globally:

- `orgAuthInterceptor` — attaches `Authorization: Bearer <token>` and `X-Organization-Id`
- `errorHandlerInterceptor` — global error handling

## Coding Conventions

- **Zoneless:** `provideZonelessChangeDetection()` is enabled. Do not rely on Zone.js for triggering change detection. Use signals or `markForCheck` explicitly.
- **Change detection:** Always set `changeDetection: ChangeDetectionStrategy.OnPush` on every component.
- **DI:** Use `inject()` function — never constructor injection.
- **State:** Prefer Angular signals (`signal`, `computed`) over RxJS for local component state. Use `toSignal` / `toObservable` for interop.
- **Forms:** Always use reactive forms (`FormBuilder`, `ReactiveFormsModule`). Use `fb.nonNullable.group(...)`.
- **Services:** All services are `providedIn: 'root'`.

## UI

- **Component library:** Angular Material 21 — `appearance: 'outline'` is the default for all form fields (configured globally in `app.config.ts`).
- **Icons:** Material Icons (ligature-based `<mat-icon>`). Do not use PrimeNG icons.
- **Styling:** Tailwind CSS 4 for layout and utility classes alongside Angular Material component styles.
- **Material imports:** Import individual Material modules directly from `@angular/material/*` (e.g. `MatButtonModule`, `MatFormFieldModule`). The `@app/shared/material-imports` barrel has been removed.

## Path Aliases

| Alias             | Resolves to          |
| ----------------- | -------------------- |
| `@app/*`          | `src/app/*`          |
| `@environments/*` | `src/environments/*` |

## Testing

Tests use **Vitest** (not Karma or Jest). Test files are co-located with source files as `*.spec.ts`.

## Git

- Do not add `Co-Authored-By` trailers to commit messages.

## Firebase

- Project: `travel-saas-platform-prod`
- Auth: Google provider only
- Dev: Auth emulator on `localhost:9099`, AppCheck disabled in emulator mode
- Analytics: enabled in production via `ScreenTrackingService` / `UserTrackingService`

## Backend API

The backend exposes an OpenAPI spec at `http://localhost:8080/v3/api-docs` (JSON) and Swagger UI at
`http://localhost:8080/swagger-ui.html`.

When you need to understand an endpoint, request/response shape, or available routes, fetch the live spec:

```bash
curl http://localhost:8080/v3/api-docs | jq .

Auth headers

All requests to /api/** (except /api/integrations/**) require:
- Authorization: Bearer <firebase-id-token>
- X-Organization-Id: <uuid> — the active organization

Integration endpoints (/api/integrations/v1/**) use X-Api-Key: <key> instead.

Base URL

http://localhost:8080 locally. Set via VITE_API_BASE_URL (or equivalent) in .env.
```

## Issue Workflow

All issues in this repo follow the TravelOps cross-repo workflow. Read this section before starting any issue.

### Before starting an issue

- The issue **must** be labeled `spec-linked` — never start an issue labeled `needs-spec`. **Exception:** issues labeled `bug` need no spec — they may be started as-is.
- Read the BA spec linked in the issue body under `## Spec`: `andrei-shelenhouski/travel-saas-platform-ba#N`
- Check `## Depends on` in the issue body — the BE endpoint(s) listed there must be merged and deployed before FE work begins
- If the BE issue is still open, label this issue `blocked` and wait

### Creating new issues

Use this body template:

```markdown
## Spec

andrei-shelenhouski/travel-saas-platform-ba#<N>

## API Contract

andrei-shelenhouski/travel-saas-platform#<N>

## Scope

<what this issue covers — component, page, flow, etc.>

## Depends on

- andrei-shelenhouski/travel-saas-platform#<N> — <endpoint must be available>

## Blocks

- (none)
```

Always apply to new issues:

- One `module:` label matching the domain area (`module: leads`, `module: offers`, etc.)
- One priority label: `P0 · Critical`, `P1 · Important`, or `P2 · Nice to have`
- `spec-linked` once a BA spec is confirmed and linked
- `blocked` if the corresponding BE issue is not yet merged — name it in `## Depends on`

### Cross-repo references

Always use the full `owner/repo#N` format. Never use bare `#N` for cross-repo links.

| Repo      | Reference format                                |
| --------- | ----------------------------------------------- |
| BA specs  | `andrei-shelenhouski/travel-saas-platform-ba#N` |
| BE issues | `andrei-shelenhouski/travel-saas-platform#N`    |

Put all relationships under `## Depends on` / `## Blocks` in the issue body — never in comments.

### GitHub Project board

Issues are auto-added to the **TravelOps v1** project board (#6) when opened. When picking up an issue:

- Set the `Layer` field to `FE`
- Update `Status` as work progresses: `Backlog → Ready → In Progress → In Review → Done`

### When closing an issue

- Confirm the linked BA spec issue (`andrei-shelenhouski/travel-saas-platform-ba#N`) lists this ticket under `## Implementation` in its body — update it if missing
- Only close when the feature works end-to-end in the browser and all tests pass

### Translations

- Use "Связанное лицо" instead of "Иждивенец"

## Working Style

- **State assumptions explicitly** — if the task is ambiguous (e.g., dialog vs. page, signal vs. observable), name the interpretation chosen and why before writing code. If the ambiguity is material, ask first.
- **Surgical changes only** — touch only what the task requires. No drive-by refactoring, renaming, or "while I'm here" cleanups unless explicitly requested.
- **No speculative abstractions** — don't extract a shared component, service, or utility unless it is used in two or more places right now.
- **Stop when confused** — if the BA spec and the existing code contradict each other, surface the conflict instead of picking silently and running with it.
