---
name: rxResource API shape in this project
description: The correct rxResource option names used in this codebase — params/stream, not request/loader
type: feedback
---

Use `params` + `stream` when calling `rxResource` — NOT `request` + `loader`.

```ts
rxResource({
  params: () => ({ ... }),
  stream: ({ params }) => observable$,
})
```

**Why:** Angular 21's `rxResource` in `@angular/core/rxjs-interop` uses `params`/`stream`. The names `request`/`loader` cause a TS2769 overload error at build time.

**How to apply:** Any time `rxResource` is used with reactive params, always name the options `params` and `stream`.
