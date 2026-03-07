# Testing Ideas

## Overview

Two complementary test layers that together prove each component is fully implemented and correctly wired through the adapter stack.

---

## #1 — Schema Parity Tests

**What it proves:** The three layers — `catalog.json`, `catalog.ts` bindings, and the wrapper component — are always in sync.

If someone adds a property to the schema but forgets to wire it through the bindings or the wrapper input, the test catches it immediately.

### How it works

A Node.js / Jest script (not Angular-specific) that:

1. Reads `catalog.json` and extracts all declared properties for each component
2. Reads `catalog.ts` and verifies each property has a matching `inputBinding('propertyName', ...)`
3. Reads the wrapper `.component.ts` and verifies each property has a matching `input()` declaration

This is static analysis — no Angular runtime involved, just parsing source files.

### Known nuances

- **Schema-only properties** — `child` and `action` are not wired as `inputBinding`s; they are read directly via `component().properties[...]` in the template. The test needs a small allowlist of these "schema-only" properties to skip.
- **Parsing strategy** — `inputBinding` and `input()` declarations can be found via regex (fast, fragile) or a TypeScript AST parser like `ts-morph` (robust, more setup). `ts-morph` is the right long-term choice.

### What it would have caught

Every gap identified in the button mapping review session — `disabled` and `href` existed in the Spartan directive but were missing from `catalog.json`, `catalog.ts`, and the wrapper.

---

## #2 — Angular Component Tests (Wrapper Behavior)

**What it proves:** The wrapper's runtime behavior is correct — the right HTML element is rendered, inputs flow through, and conditional logic works.

### How it works

Angular TestBed + Jest tests per wrapper component. Each test:
1. Creates the component with a mocked A2UI `component()` signal
2. Queries the rendered DOM
3. Asserts on element tag, attributes, or CSS classes

### Concrete test cases for `HlmButtonWrapperComponent`

| Test | Input | Assert |
|---|---|---|
| Default renders button | no `href` | `<button>` in DOM |
| With href renders anchor | `href = "https://..."` | `<a href="...">` in DOM |
| Disabled attribute forwarded | `disabled = true` | `<button disabled>` in DOM |
| Variant class applied | `variant = "destructive"` | element has destructive Tailwind class |
| Size class applied | `size = "sm"` | element has sm height/padding class |
| No child renders fine | no `child` property | no error thrown |

### Known challenges

- **`DynamicComponent` mock** — the wrapper extends `DynamicComponent<Types.CustomNode>` from `@a2ui/angular`, which requires `component()` and `surfaceId()` signals and a `sendAction()` method. A reusable test helper that produces a minimal mock of this base class is the key investment — once it exists, writing new wrapper tests is trivial.
- **`a2ui-renderer` directive** — used inside the template to render child components. In unit tests, this would need to be mocked or a minimal `provideA2UI()` setup provided in the test module.

---

## How They Complement Each Other

| Layer | Catches |
|---|---|
| #1 Schema parity | "Did you wire it?" — structural gaps between schema, bindings, and inputs |
| #2 Component behavior | "Does it actually work?" — runtime correctness of the rendered DOM |

A passing #1 with a failing #2 would mean: the property is wired correctly at the binding layer, but the Angular template or component logic has a bug (e.g. using `[attr.disabled]` instead of `[disabled]`).

---

## Future: Full Integration Tests (#3)

Not a priority now due to token cost, but worth noting: running both the mock agent and Angular app end-to-end with several natural language prompts and asserting on the rendered HTML would provide the highest confidence. Deferred until the adapter has more component coverage.
