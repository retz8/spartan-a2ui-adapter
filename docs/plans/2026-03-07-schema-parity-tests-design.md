# Schema Parity Tests — Design

## Goal

Statically verify that the three layers of each adapter component — `catalog.json`, `catalog.ts` bindings, and the wrapper component — are always in sync.

## Scope

Initial scope: **HlmButton**. HlmBadge and future components to be added incrementally using the same parser utilities.

## Architecture

Two files under `libs/spartan-a2ui-adapter/tests/`:

```
libs/spartan-a2ui-adapter/
└── tests/
    ├── utils/
    │   └── schema-parser.ts     # ts-morph parser — three extraction functions
    └── schema-parity.spec.ts    # vitest test file
```

## Parser Utilities (`schema-parser.ts`)

Three functions, each extracting property names from one layer:

| Function | Source | Technique |
|---|---|---|
| `getSchemaProperties(catalogJsonPath, componentName)` | `catalog.json` | `JSON.parse` + key extraction |
| `getInputBindingNames(catalogTsPath, componentName)` | `catalog.ts` | ts-morph AST — find `inputBinding('name', ...)` call expressions |
| `getInputDeclarationNames(wrapperPath)` | `*-wrapper.component.ts` | ts-morph AST — find `readonly x = input<...>(...)` property declarations |

All three return `string[]`.

## Test Logic (`schema-parity.spec.ts`)

For HlmButton:

1. Run all three parsers against their respective source files
2. Apply allowlist `['child', 'action']` — properties present in the schema but intentionally not wired as `inputBinding`s (accessed directly via `component().properties[...]` in the template)
3. Assert: `schemaProperties - allowlist` deep-equals `inputBindingNames`
4. Assert: `inputBindingNames` deep-equals `inputDeclarationNames`

### Expected failure messages

- `Expected inputBinding names to match schema properties: missing 'disabled'`
- `Expected input() declarations to match inputBindings: missing 'href'`

## Known Nuances

- `child` and `action` are schema-only — they are consumed directly in the Angular template, not wired through `inputBinding`. These must be in the allowlist, not treated as missing.
- The allowlist is per-component (e.g., HlmBadge has `child` but no `action`).

## Test Runner

Vitest — consistent with the existing monorepo toolchain. Runs via `nx test spartan-a2ui-adapter`.

## Dependencies

- `ts-morph` — to be added as a dev dependency for AST parsing
