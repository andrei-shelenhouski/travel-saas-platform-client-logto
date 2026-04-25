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
- **Shared Material imports:** Use the named re-exports from `@app/shared/material-imports` (e.g. `MAT_FORM_BUTTONS`, `MAT_BUTTONS`) instead of importing individual Material modules ad hoc.

## Path Aliases

| Alias | Resolves to |
|---|---|
| `@app/*` | `src/app/*` |
| `@environments/*` | `src/environments/*` |

## Testing

Tests use **Vitest** (not Karma or Jest). Test files are co-located with source files as `*.spec.ts`.

## Firebase

- Project: `travel-saas-platform-prod`
- Auth: Google provider only
- Dev: Auth emulator on `localhost:9099`, AppCheck disabled in emulator mode
- Analytics: enabled in production via `ScreenTrackingService` / `UserTrackingService`
