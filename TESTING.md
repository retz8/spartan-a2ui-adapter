# Testing

## Schema Parity Tests

Located in `libs/spartan-a2ui-adapter/tests/schema-parity.spec.ts`.

Each adapter component is described in three places: the JSON schema (what the agent sees), the TypeScript bindings (how properties are wired at runtime), and the wrapper component (how they are declared as Angular inputs). These three must always agree — a property missing from any one layer means the agent can describe it but the UI won't render it correctly, or vice versa. Schema parity tests catch that gap at the source level, without needing to run the Angular app.

These are static analysis tests that verify the three layers of each adapter component stay in sync:

| Layer | File |
|---|---|
| JSON Schema | `libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json` |
| TypeScript bindings | `libs/spartan-a2ui-adapter/src/lib/catalog.ts` |
| Wrapper component | `libs/spartan-a2ui-adapter/src/lib/components/<name>/<name>-wrapper.component.ts` |

If someone adds a property to `catalog.json` but forgets to wire it in `catalog.ts` or the wrapper, the test catches it immediately.

### How it works

A utility (`tests/utils/schema-parser.ts`) uses [ts-morph](https://ts-morph.com) to parse the TypeScript source files as AST and extract:

- `getSchemaProperties` — property names declared in `catalog.json`
- `getInputBindingNames` — names from `inputBinding('name', ...)` calls in `catalog.ts`
- `getInputDeclarationNames` — names from `input()` declarations in the wrapper component

Two assertions per component:
1. Schema properties (minus a per-component allowlist) equal the `inputBinding` names
2. `inputBinding` names equal the wrapper `input()` declaration names

### Allowlist

Some properties appear in the schema but are consumed directly in the template via `component().properties[...]` rather than wired through `inputBinding`. These are listed in `SCHEMA_ONLY` in the spec and excluded from the parity check.

Current allowlists:
- `HlmButton`: `child`, `action`

### Running

```bash
# All tests
npx nx test spartan-a2ui-adapter

# Schema parity tests only
npx nx test spartan-a2ui-adapter --testPathPattern="schema-parity"

# One component only (e.g. HlmButton)
npx nx test spartan-a2ui-adapter --testNamePattern="HlmButton"
```

### Coverage

| Component | Parity test |
|---|---|
| `HlmButton` | Yes |
| `HlmBadge` | Planned |

---

## Angular Component Tests (Wrapper Behavior)

Located in `libs/spartan-a2ui-adapter/tests/<name>.component.spec.ts` — one file per component.

Schema parity tests prove the three layers are in sync. These tests prove the wrapper actually behaves correctly at runtime — the right HTML element is rendered, inputs flow through to the DOM, and conditional logic works. A passing schema parity test with a failing component test would mean the property is wired correctly at the binding layer but the Angular template or component logic has a bug (e.g. using `[attr.disabled]` instead of `[disabled]`).

These are Angular TestBed tests that run in a jsdom environment via `@analogjs/vitest-angular`.

### How it works

Each test:
1. Configures `TestBed` with `provideA2UI()` (satisfies the `Catalog` and `Theme` tokens that `Renderer` needs)
2. Creates the component via a shared `createFixture()` helper that sets the required base-class signal inputs (`surfaceId`, `weight`, `component`)
3. Queries the rendered DOM and asserts on element tag, attributes, or CSS classes

### Test cases per component

**HlmButton** (`tests/hlm-button.component.spec.ts`):

| Test | Input | Assertion |
|---|---|---|
| Default renders `<button>` | no `href` | `querySelector('button')` not null |
| With href renders `<a>` | `href = 'https://...'` | `querySelector('a[href]')` not null |
| Disabled forwarded | `disabled = true` | `button.disabled === true` |
| Variant class applied | `variant = 'destructive'` | element has `bg-destructive` class |
| Size class applied | `size = 'sm'` | element has `h-8` class |
| Click with action calls `sendAction` | `action` in properties | spy on `DynamicComponent.prototype.sendAction` called once |
| Click without action is a no-op | no `action` | spy not called |

### Running

```bash
# All tests
npx nx test spartan-a2ui-adapter

# Component tests only
npx nx test spartan-a2ui-adapter --testPathPattern="component.spec"

# One component only (e.g. HlmButton — matches both schema parity and component tests)
npx nx test spartan-a2ui-adapter --testNamePattern="HlmButton"

# Watch mode
npx nx test spartan-a2ui-adapter --watch
```

### Naming convention

Describe blocks must contain the component name so `--testNamePattern` filtering works:
- Schema parity: `describe('HlmFoo schema parity', ...)`
- Component behavior: `describe('HlmFooWrapperComponent', ...)`

### Coverage

| Component | Component test |
|---|---|
| `HlmButton` | Yes |
| `HlmBadge` | Planned |
