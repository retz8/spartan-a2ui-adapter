---
goal: Implement HlmButton A2UI catalog adapter with Nx monorepo and visual parity mock app
version: 1.2
date_created: 2026-03-04
last_updated: 2026-03-04
owner: Jioh In
status: Planned
tags: [feature, adapter, a2ui, spartan, angular]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Implement the first A2UI catalog adapter for Spartan UI, scoped to a single component: `HlmButton`. This plan covers the full vertical slice — Nx workspace scaffolding, the adapter library (wrapper component + catalog object + catalog ID), the agent-side JSON Schema catalog, and a fixture-driven mock app that renders Spartan buttons via A2UI side-by-side with native Spartan buttons for visual parity verification.

Design document: `docs/plans/2026-03-04-hlm-button-adapter-design.md`

## 1. Requirements & Constraints

- **REQ-001**: Adapter library must export `SPARTAN_CATALOG`, `SPARTAN_CATALOG_ID`, and `HlmButtonWrapperComponent`
- **REQ-002**: `SPARTAN_CATALOG` must spread `DEFAULT_CATALOG` so all standard A2UI components remain available as children
- **REQ-003**: `HlmButtonWrapperComponent` must use `hlmBtn` directive (not `[class]="theme.components.Button"`) — Spartan handles all styling
- **REQ-004**: `HlmButtonWrapperComponent` must render child content via `ng-container[a2ui-renderer]`, not a plain string label
- **REQ-005**: `catalogs/spartan/v0.8.0/catalog.json` must follow A2UI v0.8 catalog format (matching `rizzcharts_catalog_definition.json` structure: flat `catalogId` + `components` object with all standard catalog components inlined plus custom `HlmButton` entry). No `$ref` — rizzcharts inlines everything and we match that proven pattern. `catalogId` URI includes version per A2UI naming convention (see `A2UI/docs/catalogs.md` §Catalog Naming & Versioning). Versioning scheme: major = A2UI spec version (`v0.8`, `v0.9`), minor = our catalog revisions within that spec (`v0.8.0`, `v0.8.1`). Upgrade to v0.9 format will be a separate task once the Angular renderer adopts v0.9.
- **REQ-006**: Mock app must render A2UI-rendered and native Spartan buttons side-by-side on one page for visual comparison
- **REQ-007**: Mock app must use hardcoded fixture JSON (no Python agent required)
- **CON-001**: Angular renderer (`@a2ui/angular` v0.8.4) uses v0.8 message format (`beginRendering`, `surfaceUpdate`, `dataModelUpdate`). The v0.9 `MessageProcessor` exists in `@a2ui/web_core/v0_9` but the Angular renderer has not adopted it yet. All artifacts (catalog JSON, fixture messages, TypeScript types) target v0.8. Upgrade to v0.9 is a separate future task tracked as a follow-up once Google's A2UI team ships v0.9 Angular renderer support.
- **CON-002**: Development environment is via VSCode tunnel — all `localhost` URLs need tunnel URL substitution for browser testing
- **CON-003**: `@a2ui/angular` requires Angular 21+ (`@angular/core: ^21.0.0`)
- **GUD-001**: Wrapper components must set host styles `display: block; flex: var(--weight); min-height: 0;` for A2UI layout compatibility
- **GUD-002**: Wrapper components must never reference `this.theme` — Spartan self-styles via Tailwind + CSS variables
- **PAT-001**: Follow rizzcharts catalog pattern for both JSON schema and TypeScript catalog object structure. JSON catalog: inline all standard components (no `$ref`), `child` properties are `"type": "string"` (component ID), `action` is inlined (no `definitions` section). TS catalog: spread `DEFAULT_CATALOG`, use `inputBinding` with `'prop' in properties && properties['prop']` guard pattern.
- **PAT-002**: Use `Types.CustomNode` as the generic type parameter for `DynamicComponent` since Spartan props don't fit standard A2UI node shapes

## 2. Implementation Steps

### Phase 1: Nx Workspace Scaffolding

- GOAL-001: Initialize Nx monorepo with Angular preset, create library and app projects, configure path aliases and Tailwind

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Clean current repo contents (preserve `.git/`, `docs/`, `CLAUDE.md`, `.agents/`, `.gitignore`, `LICENSE`). Remove stale `spartan_catalog.json` (empty file at repo root) and `README.md` (empty file). | | |
| TASK-002 | Initialize Nx workspace with Angular preset: `npx create-nx-workspace@latest spartan-a2ui-adapter --preset=angular-monorepo --appName=mock --style=css --ssr=false --e2eTestRunner=none`. Adjust if Nx prompts differ — the goal is an Angular workspace with one app named `mock`. | | |
| TASK-003 | Generate the adapter library project: `npx nx g @nx/angular:library spartan-a2ui-adapter --directory=libs/spartan-a2ui-adapter --publishable --importPath=@spartan-a2ui-adapter`. Verify `tsconfig.base.json` contains path alias `@spartan-a2ui-adapter` pointing to `libs/spartan-a2ui-adapter/src/index.ts`. | | |
| TASK-004 | Install Spartan dependencies: `npm install @spartan-ng/brain @spartan-ng/helm`. Then generate Spartan button component: `npx nx g @spartan-ng/cli:ui button`. Verify `@spartan-ng/helm/button` exports `HlmButtonImports` and `@spartan-ng/brain/button` exports `BrnButton`. | | |
| TASK-005 | Install A2UI dependencies: `npm install @a2ui/angular @a2ui/web_core`. Verify imports resolve: `import { DynamicComponent, Catalog, DEFAULT_CATALOG, provideA2UI, Surface } from '@a2ui/angular'` and `import * as Types from '@a2ui/web_core/types/types'`. | | |
| TASK-006 | Configure Tailwind CSS v4 for the workspace. Spartan requires Tailwind for styling. Follow Angular + Tailwind v4 setup: ensure `@tailwindcss/postcss` is configured in `postcss.config.js`, `@import "tailwindcss"` is in `apps/mock/src/styles.css`, and Spartan's Tailwind plugin is loaded if required. | | |
| TASK-007 | Verify workspace builds: `npx nx build spartan-a2ui-adapter` and `npx nx serve mock` both succeed with zero errors. Fix any dependency or configuration issues. | | |

### Phase 2: Adapter Library Implementation

- GOAL-002: Implement the three core library files: catalog ID constant, HlmButton wrapper component, and catalog object with barrel exports

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-008 | Create `libs/spartan-a2ui-adapter/src/lib/catalog-id.ts`. Export `SPARTAN_CATALOG_ID` as a string constant: `'https://github.com/jiohin/spartan-a2ui-adapter/blob/main/catalogs/spartan/v0.8.0/catalog.json'`. Version in URI follows our scheme: `v0.8.0` = A2UI spec v0.8, catalog revision 0. | | |
| TASK-009 | Create directory `libs/spartan-a2ui-adapter/src/lib/components/hlm-button/`. Create file `hlm-button-wrapper.component.ts` with the following implementation: (1) `@Component` with selector `a2ui-hlm-button`, (2) `imports: [HlmButtonImports, Renderer]` where `Renderer` is from `@a2ui/angular` and `HlmButtonImports` from `@spartan-ng/helm/button`, (3) template containing `<button hlmBtn [variant]="variant()" [size]="size()" (click)="handleClick()">` wrapping `<ng-container a2ui-renderer [surfaceId]="surfaceId()!" [component]="$any(component().properties['child'])" />` — the model-processor resolves the `child` string ID to a full `AnyComponentNode` before the wrapper sees it, but `CustomNodeProperties` types all values as `ResolvedValue`; `$any()` is required to satisfy Angular's template type checker since `ResolvedValue` is not directly assignable to `AnyComponentNode`. (4) host styles `:host { display: block; flex: var(--weight); min-height: 0; }`, (5) class `HlmButtonWrapperComponent extends DynamicComponent<Types.CustomNode>` with `readonly variant = input<string>('default')` and `readonly size = input<string>('default')`, (6) `handleClick()` method: `const action = this.component().properties['action'] as Types.Action | undefined; if (action) super.sendAction(action);` — the `as Types.Action` cast is required because `CustomNodeProperties` types all values as `ResolvedValue`, not `Types.Action`. | | |
| TASK-010 | Create `libs/spartan-a2ui-adapter/src/lib/catalog.ts`. Import `Catalog`, `DEFAULT_CATALOG` from `@a2ui/angular`, `inputBinding` from `@angular/core`. Export `SPARTAN_CATALOG` as `{ ...DEFAULT_CATALOG, HlmButton: { type: () => import('./components/hlm-button/hlm-button-wrapper.component').then(r => r.HlmButtonWrapperComponent), bindings: ({ properties }) => [inputBinding('variant', () => ('variant' in properties && properties['variant']) \|\| 'default'), inputBinding('size', () => ('size' in properties && properties['size']) \|\| 'default')] } } as Catalog`. Uses rizzcharts `'prop' in properties && properties['prop']` guard pattern to safely distinguish missing keys from falsy values. | | |
| TASK-011 | Update `libs/spartan-a2ui-adapter/src/index.ts` barrel exports: `export { SPARTAN_CATALOG } from './lib/catalog'`, `export { SPARTAN_CATALOG_ID } from './lib/catalog-id'`, `export { HlmButtonWrapperComponent } from './lib/components/hlm-button/hlm-button-wrapper.component'`. | | |
| TASK-012 | Verify library builds: `npx nx build spartan-a2ui-adapter`. Fix any compilation errors. Ensure no references to `this.theme` exist in the wrapper component. | | |

### Phase 3: Agent-Side Catalog JSON Schema

- GOAL-003: Create `catalogs/spartan/v0.8.0/catalog.json` following v0.8 catalog format (matching rizzcharts pattern: inline all standard components + add custom HlmButton with variant/size enums, string child ID, and inlined action schema)

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-013 | Create `catalogs/spartan/v0.8.0/catalog.json` (create directories as needed). Top-level structure matching rizzcharts: `{ "catalogId": "https://github.com/jiohin/spartan-a2ui-adapter/blob/main/catalogs/spartan/v0.8.0/catalog.json", "components": { ... } }`. The `components` object must **inline all standard catalog components** (copy from `A2UI/specification/v0_8/json/standard_catalog_definition.json` → `components` section: `Text`, `Image`, `Icon`, `Video`, `AudioPlayer`, `Row`, `Column`, `List`, `Card`, `Tabs`, `Divider`, `Modal`, `Button`, `CheckBox`, `TextField`, `DateTimeInput`, `MultipleChoice`, `Slider`). No `$ref` — rizzcharts inlines everything and this is the proven pattern. The LLM needs the full component definitions to reason about what's available. | | |
| TASK-014 | Add `HlmButton` to the `components` object alongside the inlined standard components. Structure: `"HlmButton": { "type": "object", "description": "A styled button using Spartan UI. Supports visual variants and sizes.", "additionalProperties": false, "properties": { "variant": { "type": "string", "enum": ["default","destructive","outline","secondary","ghost","link"], "description": "Visual style of the button." }, "size": { "type": "string", "enum": ["default","sm","lg","icon"], "description": "Size of the button." }, "child": { "type": "string", "description": "The ID of the component to display in the button, typically a Text component." }, "action": { "type": "object", "description": "The client-side action to be dispatched when the button is clicked.", "additionalProperties": false, "properties": { "name": { "type": "string" }, "context": { "type": "array", "items": { "type": "object", "additionalProperties": false, "properties": { "key": { "type": "string" }, "value": { "type": "object", "additionalProperties": false, "properties": { "path": { "type": "string" }, "literalString": { "type": "string" }, "literalNumber": { "type": "number" }, "literalBoolean": { "type": "boolean" } } } }, "required": ["key", "value"] } } }, "required": ["name"] } }, "required": ["child"] }`. Key differences from standard `Button`: adds `variant` and `size` enums. `child` is `"type": "string"` (component ID) matching the standard catalog pattern. `action` is inlined (no `$ref` — the standard catalog has no `definitions` section). | | |
| TASK-015 | Validate `catalogs/spartan/v0.8.0/catalog.json` is valid JSON. Cross-reference structure against `A2UI/samples/agent/adk/rizzcharts/rizzcharts_catalog_definition.json` to confirm structural parity: same top-level shape (`catalogId` + `components` object), all standard components inlined identically, custom `HlmButton` entry added alongside them. Verify `child` is `"type": "string"` (not `$ref`), `action` is inlined (not `$ref`), `HlmButton` has `"additionalProperties": false`, and `catalogId` URI includes `v0.8.0` version. | | |

### Phase 4: Mock App — Fixture and Comparison UI

- GOAL-004: Build the mock app that renders HlmButton via A2UI fixture payload alongside native Spartan buttons for side-by-side visual comparison

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-016 | Create `apps/mock/src/app/fixtures/button-fixture.json`. This is a JSON array of v0.8 `ServerToClientMessage` objects. **Message order must match v0.8 examples** (see `A2UI/specification/v0_8/json/catalogs/basic/examples/`): (1) **`surfaceUpdate`** message first — contains the flat component array with a root `Column` and children: one `HlmButton` per variant (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and one per non-default size (`sm`, `lg`, `icon`), each with a separate `Text` component as its `child` (referenced by component ID string, e.g. `"child": "btn_default_text"`). Each `Text` child is a separate entry in the components array with its own `id`. (2) **`beginRendering`** message last — with `surfaceId` and `"root": "root"`. **Do not include `catalogId`** — `BeginRenderingMessage` in the v0.8 TypeScript type has no `catalogId` field (`surfaceId`, `root`, `styles` only), and the Angular renderer's `handleBeginRendering()` ignores any extra fields. Catalog selection in the Angular renderer happens entirely via `provideA2UI({ catalog: SPARTAN_CATALOG })` at app startup, not through the JSONL message stream. No `dataModelUpdate` message needed — all text uses `literalString`, not data model paths. Reference `A2UI/specification/v0_8/json/catalogs/minimal/examples/3_interactive_button.json` for the exact Button + Text + Column pattern. | | |
| TASK-017 | Create `apps/mock/src/app/theme.ts`. Export `minimalTheme` object satisfying the `Theme` type from `@a2ui/angular`. **`Types.Theme` is a strict interface — all component, element, and markdown keys are required with no optionals.** The theme must include all 18 standard catalog components (`AudioPlayer`, `Button`, `Card`, `Column`, `CheckBox`, `DateTimeInput`, `Divider`, `Image`, `Icon`, `List`, `Modal`, `MultipleChoice`, `Row`, `Slider`, `Tabs`, `Text`, `TextField`, `Video`), all 15 element keys (`a`, `audio`, `body`, `button`, `h1`, `h2`, `h3`, `h4`, `h5`, `iframe`, `input`, `p`, `pre`, `textarea`, `video`), and all 12 markdown keys. Use `{}` / `[]` as the value for any entry that doesn't need custom styling. Copy the full structure from `A2UI/samples/client/angular/projects/rizzcharts/src/app/theme.ts` as the base and strip down the style class values — the shape must remain complete or TypeScript compilation will fail. Spartan components (`HlmButton`) ignore the theme entirely (they self-style via Tailwind), so only the structural completeness of the theme object matters here. | | |
| TASK-018 | Update `apps/mock/src/app/app.config.ts`. Import `provideA2UI` from `@a2ui/angular`, `SPARTAN_CATALOG` from `@spartan-a2ui-adapter`, and `minimalTheme` from `./theme`. Add `provideA2UI({ catalog: SPARTAN_CATALOG, theme: minimalTheme })` to the providers array. Also import `HlmButtonImports` from `@spartan-ng/helm/button` for the native side. | | |
| TASK-019 | Update `apps/mock/src/app/app.component.ts` to render a side-by-side comparison layout. Left column: inject `MessageProcessor` from `@a2ui/angular`, call `processor.processMessages()` with the fixture JSON in `ngOnInit`, render surfaces using `<a2ui-surface>` component with `[surfaceId]` and `[surface]` inputs from `processor.getSurfaces()`. Right column: native Spartan buttons using `<button hlmBtn variant="default">Click me</button>`, `<button hlmBtn variant="destructive">Delete</button>`, etc. — one button per variant/size matching the fixture. Use CSS grid or flexbox for the two-column layout with headers "A2UI Rendered" and "Native Spartan". | | |
| TASK-020 | Update `apps/mock/src/styles.css` to import Tailwind: `@import "tailwindcss";`. Add any Spartan Tailwind preset/plugin imports if required by the Spartan installation. | | |
| TASK-021 | Serve the mock app: `npx nx serve mock`. Verify both columns render. The A2UI column should show Spartan-styled buttons (via the adapter). The native column shows plain Spartan buttons. Visual comparison: buttons in both columns must have identical styling (colors, border-radius, padding, font). Document any visual discrepancies. | | |

### Phase 5: Verification and Cleanup

- GOAL-005: Ensure everything builds, the adapter library is correctly consumed, and the repo is clean for commit

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-022 | Run full workspace build: `npx nx run-many --target=build --all`. Verify zero errors. | | |
| TASK-023 | Verify library output: check `dist/libs/spartan-a2ui-adapter/` contains the built package with correct exports in `package.json`. Confirm `@spartan-a2ui-adapter` path alias resolves correctly in the mock app. | | |
| TASK-024 | Review all files for accidental `this.theme` references in wrapper component, missing host styles, or incorrect import paths. Ensure `HlmButtonWrapperComponent` extends `DynamicComponent<Types.CustomNode>` (not `Types.ButtonNode`). | | |
| TASK-025 | Update `README.md` at repo root with: project description, quick start instructions (`npx nx serve mock`), library usage instructions (how to import `SPARTAN_CATALOG` and `SPARTAN_CATALOG_ID` in a consuming app), and link to design doc. | | |
| TASK-026 | Commit all changes with descriptive commit messages. Suggested structure: one commit per phase, or one atomic commit if preferred. | | |

## 3. Alternatives

- **ALT-001**: Angular CLI workspace instead of Nx — rejected because Nx provides better library build tooling, TS path aliases out of the box, and is the modern standard for Angular library development.
- **ALT-002**: Plain `label` string property instead of `child` component node for button content — rejected because it breaks A2UI's composition model and would need to be deprecated later. Option B (child renderer) is the canonical approach.
- **ALT-003**: Full Python ADK agent for the mock app — deferred. Fixture-driven testing is sufficient for v1 and eliminates Python/Gemini API key dependencies. Agent integration planned as a follow-up.
- **ALT-004**: `npm link` for library consumption instead of Nx path aliases — rejected because `npm link` is brittle and adds friction during development.

## 4. Dependencies

- **DEP-001**: `@a2ui/angular` (v0.8.4+) — Angular renderer providing `DynamicComponent`, `Catalog`, `DEFAULT_CATALOG`, `provideA2UI`, `Surface`, `Renderer`, `MessageProcessor`
- **DEP-002**: `@a2ui/web_core` — Shared types (`Types.CustomNode`, `Types.Action`, `Types.AnyComponentNode`, `Primitives.*`)
- **DEP-003**: `@spartan-ng/helm/button` — Spartan button helm layer (`HlmButtonImports`, `hlmBtn` directive, variant/size inputs)
- **DEP-004**: `@spartan-ng/brain/button` — Spartan button brain layer (accessibility behavior, `BrnButton` with `disabled` input)
- **DEP-005**: `@angular/core` (^21.0.0) — Required by `@a2ui/angular`. Provides `inputBinding`, `input`, `Component`, `Directive`, etc.
- **DEP-006**: Tailwind CSS v4 — Required by Spartan for all styling. Must be configured at workspace level.
- **DEP-007**: Nx — Workspace tooling for monorepo management, library builds, and path aliases.

## 5. Files

- **FILE-001**: `catalogs/spartan/v0.8.0/catalog.json` — Agent-side catalog with versioned path. Inlines all v0.8 standard catalog components plus custom `HlmButton` with variant/size enums, `child` as component ID string, and inlined Action schema. Matches rizzcharts catalog structure exactly (no `$ref`). `catalogId` URI includes version per A2UI naming convention.
- **FILE-002**: `libs/spartan-a2ui-adapter/src/lib/catalog-id.ts` — Exports `SPARTAN_CATALOG_ID` URI constant.
- **FILE-003**: `libs/spartan-a2ui-adapter/src/lib/components/hlm-button/hlm-button-wrapper.component.ts` — Angular wrapper component extending `DynamicComponent<Types.CustomNode>`. Applies `hlmBtn` directive, binds variant/size, renders child via `a2ui-renderer`, dispatches action via `sendAction()`.
- **FILE-004**: `libs/spartan-a2ui-adapter/src/lib/catalog.ts` — Exports `SPARTAN_CATALOG` object spreading `DEFAULT_CATALOG` + HlmButton entry with `inputBinding` mappings.
- **FILE-005**: `libs/spartan-a2ui-adapter/src/index.ts` — Barrel exports for the library.
- **FILE-006**: `apps/mock/src/app/fixtures/button-fixture.json` — Hardcoded v0.8 A2UI message payload. Message order: `surfaceUpdate` (component tree with HlmButton across all variant/size combos, each with Text child referenced by ID) → `beginRendering` (with `root` and `catalogId`). No `dataModelUpdate` (all text uses `literalString`).
- **FILE-007**: `apps/mock/src/app/theme.ts` — Minimal theme for `DEFAULT_CATALOG` components.
- **FILE-008**: `apps/mock/src/app/app.config.ts` — App configuration wiring `provideA2UI` with `SPARTAN_CATALOG`.
- **FILE-009**: `apps/mock/src/app/app.component.ts` — Side-by-side comparison layout (A2UI-rendered vs native Spartan).
- **FILE-010**: `apps/mock/src/styles.css` — Tailwind import and global styles.

## 6. Testing

- **TEST-001**: Library build verification — `npx nx build spartan-a2ui-adapter` completes with zero errors and produces correct output in `dist/`.
- **TEST-002**: Mock app build verification — `npx nx build mock` completes with zero errors.
- **TEST-003**: Visual parity test — serve mock app (`npx nx serve mock`), visually confirm A2UI-rendered HlmButton matches native Spartan HlmButton for every variant (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and every size (`default`, `sm`, `lg`, `icon`). Same colors, border-radius, padding, font-size, hover states.
- **TEST-004**: Child rendering test — verify button label text (from `Text` child component) renders correctly inside the A2UI-rendered button.
- **TEST-005**: Action dispatch test — add a click handler or console.log to verify `sendAction()` fires when clicking the A2UI-rendered button (check browser console for dispatched event).
- **TEST-006**: Catalog JSON validation — validate `catalogs/spartan/v0.8.0/catalog.json` is well-formed JSON. Ensure structural parity with `A2UI/samples/agent/adk/rizzcharts/rizzcharts_catalog_definition.json` (same top-level shape: `catalogId` + `components` with all standard components inlined + custom `HlmButton` entry). Verify `HlmButton.child` is `"type": "string"`, `action` is inlined, `additionalProperties: false` is set, and `catalogId` contains versioned URI.

## 7. Risks & Assumptions

- **RISK-001**: All artifacts target v0.8. When Google's A2UI team ships v0.9 Angular renderer support, a separate upgrade task is needed to migrate the catalog JSON schema (to `allOf` composition, `ComponentId` child, `unevaluatedProperties: false`), fixture messages (to `createSurface`/`updateComponents` format), and type imports (to `@a2ui/web_core/v0_9`).
- **RISK-002**: `@a2ui/angular` may not be published to npm as a standalone package — it may only be available as a local build from the A2UI repo. If so, use `npm link` or file-based dependency (`"@a2ui/angular": "file:../A2UI/renderers/angular"`) to reference the local build.
- **RISK-003**: Spartan's `HlmButtonImports` bundle may have transitive dependencies or Tailwind configuration requirements not documented on the Spartan website. Resolve at TASK-004 by inspecting the actual package exports.
- **RISK-004**: `inputBinding` from `@angular/core` is a relatively new API (Angular 21+). Ensure the workspace uses Angular 21 or later.
- **ASSUMPTION-001**: `DynamicComponent<Types.CustomNode>` is the correct generic type for Spartan wrappers — Spartan props (`variant`, `size`) don't match any standard A2UI node type.
- **ASSUMPTION-002**: Spartan button's visual output is fully determined by the `hlmBtn` directive + `variant` + `size` inputs — no additional configuration or global CSS beyond Tailwind is needed.
- **ASSUMPTION-003**: The `DEFAULT_CATALOG`'s `Text` component renders correctly inside an `HlmButton` wrapper's child slot without style conflicts.

## 8. Related Specifications / Further Reading

- [Design Document](../docs/plans/2026-03-04-hlm-button-adapter-design.md)
- [A2UI v0.8 Standard Catalog Definition](https://github.com/google/A2UI/blob/main/specification/0_8/json/standard_catalog_definition.json)
- [A2UI v0.8 Server-to-Client Schema](https://github.com/google/A2UI/blob/main/specification/0_8/json/server_to_client.json)
- [Rizzcharts Catalog (TS)](https://github.com/google/A2UI/blob/main/samples/client/angular/projects/rizzcharts/src/a2ui-catalog/catalog.ts)
- [Rizzcharts Catalog (JSON)](https://github.com/google/A2UI/blob/main/samples/agent/adk/rizzcharts/rizzcharts_catalog_definition.json)
- [Rizzcharts Agent](https://github.com/google/A2UI/blob/main/samples/agent/adk/rizzcharts/agent.py)
- [Spartan Button Docs](https://www.spartan.ng/components/button)
- [Adapter Implications Notes](../../personal/A2UI/spartan-adapter-implications.md)
- [A2UI v0.8 Basic Examples (message format reference)](https://github.com/google/A2UI/tree/main/specification/v0_8/json/catalogs/basic/examples) — especially `03_interactive_button.json` for Button+Text+Column pattern
- [A2UI v0.8 Minimal Examples](https://github.com/google/A2UI/tree/main/specification/v0_8/json/catalogs/minimal/examples) — especially `3_interactive_button.json` for simplest Button pattern
- [A2UI v0.9 Minimal Catalog (future reference)](https://github.com/google/A2UI/blob/main/specification/v0_9/json/catalogs/minimal/minimal_catalog.json)
