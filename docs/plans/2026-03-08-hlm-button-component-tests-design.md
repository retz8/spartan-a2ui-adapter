# Design: Angular Component Tests for HlmButtonWrapperComponent

Date: 2026-03-08

## Goal

Add Angular TestBed tests that verify the runtime behavior of `HlmButtonWrapperComponent` — the right HTML element is rendered, inputs flow through correctly, and conditional logic works.

This is test layer #2 from `docs/testing-ideas.md`, complementing the existing schema parity tests (layer #1).

## File

`libs/spartan-a2ui-adapter/tests/hlm-button.component.spec.ts`

Placed alongside `schema-parity.spec.ts` in `tests/`. Uses jsdom (default environment — no override needed).

## TestBed Setup

Each test configures TestBed with:

```ts
TestBed.configureTestingModule({
  imports: [HlmButtonWrapperComponent],
  providers: [provideA2UI({ catalog: {}, theme: {} as Theme })],
});
```

Required signal inputs are set via `fixture.componentRef.setInput()`:

| Input | Value |
|---|---|
| `component` | `{ type: 'HlmButton', properties: {} }` |
| `surfaceId` | `'test-surface'` |
| `weight` | `'1'` |

`provideA2UI` satisfies the `Catalog` token that `Renderer` needs. `Renderer` renders nothing (no valid child supplied), but throws no errors.

## Test Cases

| # | Description | Inputs | Assertion |
|---|---|---|---|
| 1 | Default renders `<button>` | no `href` | `querySelector('button')` is not null |
| 2 | With `href` renders `<a>` | `href = 'https://example.com'` | `querySelector('a[href]')` is not null |
| 3 | Disabled forwarded | `disabled = true` | `button.hasAttribute('disabled')` is true |
| 4 | Variant class applied | `variant = 'destructive'` | element classList contains destructive Tailwind class |
| 5 | Size class applied | `size = 'sm'` | element classList contains sm height class |
| 6 | Click with action calls `sendAction` | spy on `sendAction`, `action` in properties | spy called once |
| 7 | Click without action is a no-op | no `action` in properties | spy not called |

For tests 4 and 5, the exact Tailwind class names are read from `libs/ui/button/src/lib/hlm-button.ts` (the CVA definition) during implementation.

## What Is Not Tested

- Child rendering via `a2ui-renderer` — integration concern, deferred to layer #3
- `weight` CSS custom property — layout concern, not component behavior
