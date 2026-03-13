// node environment required: this spec uses path.resolve and fs — no DOM needed
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as url from 'url';
import {
  getSchemaProperties,
  getInputBindingNames,
  getInputDeclarationNames,
} from './utils/schema-parser';

// import.meta.url points at tests/schema-parity.spec.ts
// resolve('../..') to reach libs/spartan-a2ui-adapter/
const LIB_ROOT = path.resolve(url.fileURLToPath(import.meta.url), '../..');

const CATALOG_JSON = path.join(LIB_ROOT, 'catalogs/v0.8.0/catalog.json');
const CATALOG_TS = path.join(LIB_ROOT, 'src/lib/catalog.ts');

// Schema-only properties: consumed directly in the template via component().properties[...]
// NOT wired through inputBinding — intentionally excluded from parity check
const SCHEMA_ONLY: Record<string, string[]> = {
  HlmButton: ['child', 'action'],
  HlmBadge: ['child'],
};

describe('HlmBadge schema parity', () => {
  const WRAPPER = path.join(
    LIB_ROOT,
    'src/lib/components/hlm-badge/hlm-badge-wrapper.component.ts',
  );

  it('inputBindings cover all schema properties (minus schema-only)', () => {
    const schemaProps = getSchemaProperties(CATALOG_JSON, 'HlmBadge');
    const bindingNames = getInputBindingNames(CATALOG_TS, 'HlmBadge');
    const allowlist = SCHEMA_ONLY['HlmBadge'];

    const expected = schemaProps.filter((p) => !allowlist.includes(p)).sort();
    expect(bindingNames.sort()).toEqual(expected);
  });

  it('input() declarations match inputBindings', () => {
    const bindingNames = getInputBindingNames(CATALOG_TS, 'HlmBadge');
    const inputNames = getInputDeclarationNames(WRAPPER);

    expect(inputNames.sort()).toEqual(bindingNames.sort());
  });
});

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
