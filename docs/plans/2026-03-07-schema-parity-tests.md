# Schema Parity Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a vitest-based static analysis test that verifies `catalog.json`, `catalog.ts` bindings, and the wrapper component are always in sync for HlmButton.

**Architecture:** A `schema-parser.ts` utility (ts-morph AST) extracts property names from each layer. A `schema-parity.spec.ts` test file imports the parser and asserts parity, with an allowlist for schema-only properties (`child`, `action`) that are consumed directly in the template.

**Tech Stack:** vitest, ts-morph, TypeScript

---

### Task 1: Install ts-morph and wire test target

**Files:**
- Modify: `libs/spartan-a2ui-adapter/project.json` — add `test` target
- Modify: `libs/spartan-a2ui-adapter/tsconfig.spec.json` — add `tests/` include paths

**Step 1: Install ts-morph**

Run from repo root:

```bash
npm install --save-dev ts-morph
```

**Step 2: Add test target to project.json**

In `libs/spartan-a2ui-adapter/project.json`, add a `test` entry inside `"targets"`:

```json
"test": {
  "executor": "@nx/vite:test",
  "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
  "options": {
    "config": "libs/spartan-a2ui-adapter/vite.config.mts"
  }
}
```

**Step 3: Update tsconfig.spec.json to include tests/**

In `libs/spartan-a2ui-adapter/tsconfig.spec.json`, add to the `"include"` array:

```json
"tests/**/*.spec.ts",
"tests/**/*.test.ts",
"tests/**/*.d.ts"
```

Also add to `"files"` if needed — but don't touch `"files"` unless the compiler complains about missing `tests/` root files.

**Step 4: Verify the test target runs (nothing to test yet)**

```bash
npx nx test spartan-a2ui-adapter
```

Expected: runs with 0 test files found, no errors.

**Step 5: Commit**

```bash
git add libs/spartan-a2ui-adapter/project.json libs/spartan-a2ui-adapter/tsconfig.spec.json package.json package-lock.json
git commit -m "chore: add vitest test target and ts-morph for schema parity tests"
```

---

### Task 2: Write failing schema-parity.spec.ts + stub schema-parser.ts

**Files:**
- Create: `libs/spartan-a2ui-adapter/tests/schema-parity.spec.ts`
- Create: `libs/spartan-a2ui-adapter/tests/utils/schema-parser.ts` (stubs)

**Step 1: Create stub schema-parser.ts**

```ts
// libs/spartan-a2ui-adapter/tests/utils/schema-parser.ts

export function getSchemaProperties(_catalogJsonPath: string, _componentName: string): string[] {
  throw new Error('not implemented');
}

export function getInputBindingNames(_catalogTsPath: string, _componentName: string): string[] {
  throw new Error('not implemented');
}

export function getInputDeclarationNames(_wrapperPath: string): string[] {
  throw new Error('not implemented');
}
```

**Step 2: Create schema-parity.spec.ts**

```ts
// libs/spartan-a2ui-adapter/tests/schema-parity.spec.ts

// @vitest-environment node
import { describe, it, expect } from 'vitest';
import * as path from 'path';
import {
  getSchemaProperties,
  getInputBindingNames,
  getInputDeclarationNames,
} from './utils/schema-parser';

const LIB_ROOT = path.resolve(__dirname, '..');

const CATALOG_JSON = path.join(LIB_ROOT, 'catalogs/v0.8.0/catalog.json');
const CATALOG_TS = path.join(LIB_ROOT, 'src/lib/catalog.ts');

// Schema-only properties: consumed directly in the template via component().properties[...]
// NOT wired through inputBinding — intentionally excluded from parity check
const SCHEMA_ONLY: Record<string, string[]> = {
  HlmButton: ['child', 'action'],
};

describe('HlmButton schema parity', () => {
  const WRAPPER = path.join(
    LIB_ROOT,
    'src/lib/components/hlm-button/hlm-button-wrapper.component.ts',
  );

  it('inputBindings cover all schema properties (minus schema-only)', () => {
    const schemaProps = getSchemaProperties(CATALOG_JSON, 'HlmButton');
    const bindingNames = getInputBindingNames(CATALOG_TS, 'HlmButton');
    const allowlist = SCHEMA_ONLY['HlmButton'];

    const expected = schemaProps.filter((p) => !allowlist.includes(p)).sort();
    expect(bindingNames.sort()).toEqual(expected);
  });

  it('input() declarations match inputBindings', () => {
    const bindingNames = getInputBindingNames(CATALOG_TS, 'HlmButton');
    const inputNames = getInputDeclarationNames(WRAPPER);

    expect(inputNames.sort()).toEqual(bindingNames.sort());
  });
});
```

**Step 3: Run tests to verify they fail**

```bash
npx nx test spartan-a2ui-adapter
```

Expected: 2 failing tests with `Error: not implemented`.

---

### Task 3: Implement getSchemaProperties

**Files:**
- Modify: `libs/spartan-a2ui-adapter/tests/utils/schema-parser.ts`

**Step 1: Replace the getSchemaProperties stub**

```ts
import * as fs from 'fs';

export function getSchemaProperties(catalogJsonPath: string, componentName: string): string[] {
  const raw = fs.readFileSync(catalogJsonPath, 'utf-8');
  const catalog = JSON.parse(raw);
  const component = catalog.components[componentName];
  if (!component) throw new Error(`Component "${componentName}" not found in catalog.json`);
  return Object.keys(component.properties ?? {});
}
```

Note: `catalog.json` uses a `"components"` top-level key. Each component entry has a `"properties"` object whose keys are the property names.

**Step 2: Run tests**

```bash
npx nx test spartan-a2ui-adapter
```

Expected: still 2 failing (getInputBindingNames still throws), but getSchemaProperties no longer throws — the first test now fails on a real assertion, not an error.

---

### Task 4: Implement getInputBindingNames

**Files:**
- Modify: `libs/spartan-a2ui-adapter/tests/utils/schema-parser.ts`

**Step 1: Add ts-morph import and replace getInputBindingNames stub**

```ts
import { Project, SyntaxKind } from 'ts-morph';

export function getInputBindingNames(catalogTsPath: string, componentName: string): string[] {
  const project = new Project({ addFilesFromTsConfig: false });
  const sourceFile = project.addSourceFileAtPath(catalogTsPath);

  // Find the top-level PropertyAssignment named componentName (e.g. HlmButton: { ... })
  const componentProp = sourceFile
    .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
    .find((p) => p.getName() === componentName);

  if (!componentProp) {
    throw new Error(`Component "${componentName}" not found in catalog.ts`);
  }

  // Within that subtree, collect all inputBinding('name', ...) first string args
  return componentProp
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((call) => call.getExpression().getText() === 'inputBinding')
    .map((call) => {
      const firstArg = call.getArguments()[0];
      if (!firstArg || firstArg.getKind() !== SyntaxKind.StringLiteral) {
        throw new Error('inputBinding first argument must be a string literal');
      }
      return firstArg.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralValue();
    });
}
```

**How it works:** ts-morph parses `catalog.ts` as a TypeScript source file. It finds the PropertyAssignment node whose name equals `componentName`, then walks its subtree looking for `inputBinding(...)` calls and extracts the first string argument from each.

**Step 2: Run tests**

```bash
npx nx test spartan-a2ui-adapter
```

Expected: test 1 passes. Test 2 still fails (getInputDeclarationNames still throws).

---

### Task 5: Implement getInputDeclarationNames + final green run

**Files:**
- Modify: `libs/spartan-a2ui-adapter/tests/utils/schema-parser.ts`

**Step 1: Replace getInputDeclarationNames stub**

```ts
export function getInputDeclarationNames(wrapperPath: string): string[] {
  const project = new Project({ addFilesFromTsConfig: false });
  const sourceFile = project.addSourceFileAtPath(wrapperPath);

  // Find: readonly propName = input<Type>(defaultValue)
  // In the TS AST, `input<string>(...)` is a CallExpression where
  // getExpression().getText() === 'input' (type args are separate from the expression text)
  return sourceFile
    .getDescendantsOfKind(SyntaxKind.PropertyDeclaration)
    .filter((prop) => {
      const initializer = prop.getInitializer();
      if (!initializer || initializer.getKind() !== SyntaxKind.CallExpression) return false;
      return initializer
        .asKindOrThrow(SyntaxKind.CallExpression)
        .getExpression()
        .getText() === 'input';
    })
    .map((prop) => prop.getName());
}
```

**How it works:** Finds all class property declarations whose initializer is a call to `input(...)`. In the TypeScript AST, `input<string>('default')` is a CallExpression with expression text `'input'` (the type argument is not part of the expression text).

**Step 2: Run all tests — expect green**

```bash
npx nx test spartan-a2ui-adapter
```

Expected output:
```
 ✓ tests/schema-parity.spec.ts (2)
   ✓ HlmButton schema parity > inputBindings cover all schema properties (minus schema-only)
   ✓ HlmButton schema parity > input() declarations match inputBindings
```

**Step 3: Commit**

```bash
git add libs/spartan-a2ui-adapter/tests/
git commit -m "test: add schema parity tests for HlmButton"
```
