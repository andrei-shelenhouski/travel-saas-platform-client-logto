You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Always use curly braces for `if` statements (no single-line `if` without braces)
- Prefer `protected` over `public` for class fields and methods when they are only needed inside the class or its Angular template (templates can access `protected` members); use `public` only when external code must access the member

### Function and method body layout

Inside functions and methods, group statements and separate each group with a single blank line, in this order when they appear:

1. Variable declarations and initializations
2. Action lines (side effects: signal updates like `this.value.set(...)`, subscriptions, imperative DOM or service calls, and similar)
3. `if` / `switch` (and other control-flow blocks that are not the final exit)
4. `return` (when present)

**Always** put one blank line before **`if`**, **`switch`**, **`for`**, **`while`**, **`do`**, and **`try`** when they follow a **different** kind of group—typically variable declarations / initializations or imperative action lines—so setup logic is not glued to the condition or loop/try.

Do **not** add a blank line before `return` when it is the **only** statement in that block (for example a one-line method body, an early-exit `if` branch that only returns, or a `case`/`default` clause that only returns). When other statements precede `return` in the same block, use one blank line before `return` so it is separated from the preceding logic.

Separate control-flow structures with one blank line: put a blank line between **consecutive** `if` statements at the same nesting level, and use the same idea for adjacent `for`/`while`/`try` blocks when they are sequential siblings in the same scope—not inside `} else {` or similar single constructs. Do **not** add blank lines between `case`/`default` labels inside a `switch` (keep the `switch` body compact).

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Never use inline templates or inline styles in components
- One component must live in exactly one dedicated folder
- Do not create components inside another component's folder
- Every component must include exactly four files: `.ts`, `.html`, `.spec.ts`, and `.scss`
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Never use Russian language in source code strings (labels, messages, placeholders, hints, errors, and similar UI text)
- Russian translations are allowed only in localization files such as `src/locale/messages.ru.xlf`
- Add i18n attributes for user-visible template strings
- After adding or changing translatable strings, run `ng extract-i18n` and then add dedicated translations to `src/locale/messages.ru.xlf`
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).
- For event handlers, prefer method references (e.g. `(click)="onClick()"`) over inline statements (e.g. `(click)="count++"`), especially when the handler logic is more than a simple one-liner. This keeps templates cleaner and allows for better separation of concerns.
- For class and style bindings, prefer using the `class` and `style` bindings with object syntax (e.g. `[class.active]="isActive"`) instead of `ngClass` and `ngStyle` directives, as they are more performant and easier to read.
- Never use inline templates or inline styles in components.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Testing Best Practices

- Use Vitest for all tests in this workspace.
- Co-locate tests with source files using `*.spec.ts` naming.
- For every non-trivial behavior change, add or update tests that validate the user-visible outcome.
- Prefer deterministic tests: avoid timers, random values, and network calls unless explicitly mocked.
- Do not add or keep focused/disabled tests (`fit`, `fdescribe`, `it.only`, `describe.only`, `it.skip`, `describe.skip`).
- Keep each test focused on one behavior and use clear Arrange-Act-Assert structure.
- Mock external boundaries (HTTP, Firebase, browser APIs, time) instead of mocking internal implementation details.
- Prefer testing public APIs and rendered behavior rather than private methods or internal state.
- When fixing bugs, write or update a regression test first when feasible, then implement the fix.

### Angular Testing

- Use Angular testing utilities with Vitest-compatible patterns.
- For components, assert behavior from the template/DOM and user interactions.
- For services, test observable/signal outputs and side effects through public methods.
- In zoneless flows, explicitly trigger change detection when needed in tests instead of relying on Zone.js behavior.

### PR Readiness

- Before finishing a task, run relevant tests for touched areas.
- If full test execution is too expensive, run targeted tests first and clearly report what was or was not executed.
