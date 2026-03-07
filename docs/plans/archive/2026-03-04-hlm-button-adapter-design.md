# HlmButton A2UI Adapter — Design Document

**Date:** 2026-03-04
**Scope:** HlmButton only (v1)
**A2UI spec target:** v0.8 (upgrade to v0.9 once Angular renderer adopts it)

---

## Overview

Build an A2UI catalog adapter that maps Spartan UI's Button component to the A2UI protocol. The adapter is a library — consuming Angular apps plug it in to get Spartan-rendered A2UI surfaces.

Two core artifacts:
- `catalogs/spartan/v0.8.0/catalog.json` — agent-side JSON Schema teaching the LLM what `HlmButton` is and what props it accepts
- `SPARTAN_CATALOG` — renderer-side TypeScript catalog object mapping `HlmButton` to an Angular wrapper component

A mock app renders the same button two ways side-by-side (A2UI-rendered vs native Spartan) for visual parity verification.

---

## Project Structure

Nx monorepo with Angular preset.

```
spartan-a2ui-adapter/
├── nx.json
├── package.json
├── tsconfig.base.json
├── libs/
│   └── spartan-a2ui-adapter/        # publishable library
│       ├── src/
│       │   ├── lib/
│       │   │   ├── components/
│       │   │   │   └── hlm-button/
│       │   │   │       └── hlm-button-wrapper.component.ts
│       │   │   ├── catalog.ts
│       │   │   └── catalog-id.ts
│       │   └── index.ts
│       ├── ng-package.json
│       ├── package.json
│       └── project.json
├── apps/
│   └── mock/                        # dev-only comparison app
│       ├── src/
│       │   ├── app/
│       │   │   ├── app.component.ts
│       │   │   ├── app.config.ts
│       │   │   ├── fixtures/
│       │   │   │   └── button-fixture.json
│       │   │   └── theme.ts
│       │   └── styles.css
│       └── project.json
├── catalogs/
│   └── spartan/
│       └── v0.8.0/
│           └── catalog.json        # agent-side schema (versioned)
└── docs/
    └── plans/
```

Library consumed via TS path alias `@spartan-a2ui-adapter` in `tsconfig.base.json`.

---

## Adapter Library

### `catalog-id.ts`

```ts
export const SPARTAN_CATALOG_ID =
  'https://github.com/jiohin/spartan-a2ui-adapter/blob/main/catalogs/spartan/v0.8.0/catalog.json';
```

Versioned URI — opaque identifier, not fetched at runtime. Agent and client must agree on this string. Version scheme: `v{a2ui_spec}.{catalog_revision}` (e.g. `v0.8.0` = A2UI spec v0.8, catalog revision 0).

### `components/hlm-button/hlm-button-wrapper.component.ts`

Wrapper component that bridges A2UI's rendering model to Spartan's directive-based button.

- Extends `DynamicComponent<Types.CustomNode>` — `CustomNode` because Spartan props don't fit standard A2UI node shapes
- Imports `HlmButtonImports` from `@spartan-ng/helm/button`
- Applies `hlmBtn` directive to native `<button>` element
- Binds `variant` and `size` as signal inputs with defaults
- Renders child content via `ng-container[a2ui-renderer]`
- Dispatches click events via `sendAction()` when `action` property exists
- Host styles: `display: block; flex: var(--weight); min-height: 0;` — required for A2UI layout system
- Never references `this.theme` — Spartan handles all styling via Tailwind + CSS variables

### `catalog.ts`

```ts
export const SPARTAN_CATALOG = {
  ...DEFAULT_CATALOG,
  HlmButton: {
    type: () => import('./components/hlm-button/hlm-button-wrapper.component')
               .then(r => r.HlmButtonWrapperComponent),
    bindings: ({ properties }) => [
      inputBinding('variant', () => ('variant' in properties && properties['variant']) || 'default'),
      inputBinding('size',    () => ('size' in properties && properties['size']) || 'default'),
    ],
  },
} as Catalog;
```

Spreads `DEFAULT_CATALOG` so standard A2UI components (`Text`, `Row`, `Column`, etc.) remain available as children.

### `index.ts` (barrel exports)

- `SPARTAN_CATALOG`
- `SPARTAN_CATALOG_ID`
- `HlmButtonWrapperComponent`

---

## Agent-Side Catalog (`catalogs/spartan/v0.8.0/catalog.json`)

v0.8 format, matching rizzcharts pattern. The Angular renderer (`@a2ui/angular` v0.8.4) only supports v0.8 — upgrade to v0.9 format is a future task once Google ships v0.9 Angular renderer support.

The `components` object inlines all standard catalog components (copied from `standard_catalog_definition.json`) plus adds `HlmButton`. No `$ref` — matches the rizzcharts pattern exactly.

HlmButton definition (shown alone; full file also contains all standard components):

```json
{
  "catalogId": "https://github.com/jiohin/spartan-a2ui-adapter/blob/main/catalogs/spartan/v0.8.0/catalog.json",
  "components": {
    "Text": { "..." : "inlined from standard catalog" },
    "Row": { "..." : "inlined from standard catalog" },
    "Column": { "..." : "inlined from standard catalog" },
    "Button": { "..." : "inlined from standard catalog" },
    "...": "all other standard components inlined",
    "HlmButton": {
      "type": "object",
      "additionalProperties": false,
      "description": "A styled button using Spartan UI. Supports visual variants and sizes.",
      "properties": {
        "variant": {
          "type": "string",
          "enum": ["default", "destructive", "outline", "secondary", "ghost", "link"]
        },
        "size": {
          "type": "string",
          "enum": ["default", "sm", "lg", "icon"]
        },
        "child": {
          "type": "string",
          "description": "The ID of the component to display in the button, typically a Text component."
        },
        "action": {
          "type": "object",
          "description": "The client-side action to be dispatched when the button is clicked.",
          "additionalProperties": false,
          "properties": {
            "name": { "type": "string" },
            "context": {
              "type": "array",
              "items": {
                "type": "object",
                "additionalProperties": false,
                "properties": {
                  "key": { "type": "string" },
                  "value": {
                    "type": "object",
                    "additionalProperties": false,
                    "properties": {
                      "path": { "type": "string" },
                      "literalString": { "type": "string" },
                      "literalNumber": { "type": "number" },
                      "literalBoolean": { "type": "boolean" }
                    }
                  }
                },
                "required": ["key", "value"]
              }
            }
          },
          "required": ["name"]
        }
      },
      "required": ["child", "action"]
    }
  }
}
```

---

## Mock App

### Purpose

Single-page side-by-side comparison: left column renders buttons via A2UI fixture payload, right column renders identical buttons via traditional Spartan markup.

```
┌──────────────────────────┬──────────────────────┐
│  A2UI Rendered           │  Native Spartan      │
├──────────────────────────┼──────────────────────┤
│  [Click me]  default     │  [Click me]          │
│  [Delete]    destructive │  [Delete]            │
│  [Cancel]    outline     │  [Cancel]            │
│  [More]      ghost       │  [More]              │
│  [Link]      link        │  [Link]              │
│  [SM]        size=sm     │  [SM]                │
│  [LG]        size=lg     │  [LG]                │
│  [Icon]      size=icon   │  [Icon]              │
└──────────────────────────┴──────────────────────┘
```

### `app.config.ts`

Wires up A2UI with the Spartan catalog:
```ts
provideA2UI({ catalog: SPARTAN_CATALOG, theme: minimalTheme })
```

### `fixtures/button-fixture.json`

Hardcoded A2UI v0.8 JSON payload — the same JSON an agent would generate. Message order follows v0.8 convention: `surfaceUpdate` first (flat component array), then `beginRendering` last. Contains `HlmButton` components across all variant/size combinations. Each button's `child` is a component ID string referencing a separate `Text` component in the array. No `dataModelUpdate` needed (all text uses `literalString`).

No Python agent needed — pure Angular fixture-driven rendering.

### `theme.ts`

Minimal theme covering only `DEFAULT_CATALOG` components (`Text`, `Row`, `Column`). Spartan components ignore the theme entirely.

### Success criteria

Visual: if the A2UI-rendered buttons in the left column look identical to the native Spartan buttons in the right column, the adapter works.

---

## Dependencies

| Package | Purpose |
|---|---|
| `@a2ui/angular` | Angular renderer (DynamicComponent, Catalog, DEFAULT_CATALOG, provideA2UI) |
| `@a2ui/web_core` | Types (CustomNode, Action, etc.) |
| `@spartan-ng/helm/button` | Spartan button helm (styling directive) |
| `@spartan-ng/brain/button` | Spartan button brain (accessibility behavior) |
| Tailwind CSS v4 | Required by Spartan for styling |

---

## Out of Scope (Deferred)

- Python ADK agent integration (fixture-only for now; agent integration is a follow-up)
- `examples/spartan/` few-shot payloads for LLM
- Any component beyond HlmButton
- `SPARTAN_THEME` export — consuming app defines their own theme for default catalog components
