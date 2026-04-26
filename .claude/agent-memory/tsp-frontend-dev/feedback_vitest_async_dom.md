---
name: Vitest async DOM assertion pattern
description: rxResource with of() is async — tests need whenStable() + second detectChanges to see rendered data
type: feedback
---

When testing components that use `rxResource` with a synchronous `of()` stub, the DOM is NOT updated after the first `fixture.detectChanges()`. Use:

```ts
fixture.detectChanges();
await fixture.whenStable();
fixture.detectChanges();
```

**Why:** Even with a synchronous observable, rxResource resolves asynchronously in the zoneless setup. Assertions on DOM content (e.g. `el.textContent`) fail without the second detectChanges cycle.

**How to apply:** Every `it` block that checks rendered output from rxResource data should use the async pattern above.
