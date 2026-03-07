# Testing

## Schema Parity Tests

Located in `libs/spartan-a2ui-adapter/tests/schema-parity.spec.ts`.

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
npx nx test spartan-a2ui-adapter
```

### Coverage

| Component | Parity test |
|---|---|
| `HlmButton` | Yes |
| `HlmBadge` | Planned |
