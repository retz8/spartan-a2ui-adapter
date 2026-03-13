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
  Button: ['child', 'action'],
  Badge: ['child'],
  Card: ['child', 'children'],
  CheckBox: ['label'],
  Separator: [],
};

describe('Badge schema parity', () => {
  const WRAPPER = path.join(
    LIB_ROOT,
    'src/lib/components/hlm-badge/hlm-badge-wrapper.component.ts',
  );

  it('inputBindings cover all schema properties (minus schema-only)', () => {
    const schemaProps = getSchemaProperties(CATALOG_JSON, 'Badge');
    const bindingNames = getInputBindingNames(CATALOG_TS, 'Badge');
    const allowlist = SCHEMA_ONLY['Badge'];

    const expected = schemaProps.filter((p) => !allowlist.includes(p)).sort();
    expect(bindingNames.sort()).toEqual(expected);
  });

  it('input() declarations match inputBindings', () => {
    const bindingNames = getInputBindingNames(CATALOG_TS, 'Badge');
    const inputNames = getInputDeclarationNames(WRAPPER);

    expect(inputNames.sort()).toEqual(bindingNames.sort());
  });
});

describe('Card schema parity', () => {
  const WRAPPER = path.join(
    LIB_ROOT,
    'src/lib/components/hlm-card/hlm-card-wrapper.component.ts',
  );

  it('inputBindings cover all schema properties (minus schema-only)', () => {
    const schemaProps = getSchemaProperties(CATALOG_JSON, 'Card');
    const bindingNames = getInputBindingNames(CATALOG_TS, 'Card');
    const allowlist = SCHEMA_ONLY['Card'];

    const expected = schemaProps.filter((p) => !allowlist.includes(p)).sort();
    expect(bindingNames.sort()).toEqual(expected);
  });

  it('input() declarations match inputBindings', () => {
    const bindingNames = getInputBindingNames(CATALOG_TS, 'Card');
    const inputNames = getInputDeclarationNames(WRAPPER);

    expect(inputNames.sort()).toEqual(bindingNames.sort());
  });
});

describe('CheckBox schema parity', () => {
  const WRAPPER = path.join(
    LIB_ROOT,
    'src/lib/components/hlm-checkbox/hlm-checkbox-wrapper.component.ts',
  );

  it('inputBindings cover all schema properties (minus schema-only)', () => {
    const schemaProps = getSchemaProperties(CATALOG_JSON, 'CheckBox');
    const bindingNames = getInputBindingNames(CATALOG_TS, 'CheckBox');
    const allowlist = SCHEMA_ONLY['CheckBox'];

    const expected = schemaProps.filter((p) => !allowlist.includes(p)).sort();
    expect(bindingNames.sort()).toEqual(expected);
  });

  it('input() declarations match inputBindings', () => {
    const bindingNames = getInputBindingNames(CATALOG_TS, 'CheckBox');
    const inputNames = getInputDeclarationNames(WRAPPER);

    expect(inputNames.sort()).toEqual(bindingNames.sort());
  });
});

describe('Separator schema parity', () => {
  const WRAPPER = path.join(
    LIB_ROOT,
    'src/lib/components/hlm-separator/hlm-separator-wrapper.component.ts',
  );

  it('inputBindings cover all schema properties (minus schema-only)', () => {
    const schemaProps = getSchemaProperties(CATALOG_JSON, 'Separator');
    const bindingNames = getInputBindingNames(CATALOG_TS, 'Separator');
    const allowlist = SCHEMA_ONLY['Separator'];

    const expected = schemaProps.filter((p) => !allowlist.includes(p)).sort();
    expect(bindingNames.sort()).toEqual(expected);
  });

  it('input() declarations match inputBindings', () => {
    const bindingNames = getInputBindingNames(CATALOG_TS, 'Separator');
    const inputNames = getInputDeclarationNames(WRAPPER);

    expect(inputNames.sort()).toEqual(bindingNames.sort());
  });
});

describe('Button schema parity', () => {
  const WRAPPER = path.join(
    LIB_ROOT,
    'src/lib/components/hlm-button/hlm-button-wrapper.component.ts',
  );

  it('inputBindings cover all schema properties (minus schema-only)', () => {
    const schemaProps = getSchemaProperties(CATALOG_JSON, 'Button');
    const bindingNames = getInputBindingNames(CATALOG_TS, 'Button');
    const allowlist = SCHEMA_ONLY['Button'];

    const expected = schemaProps.filter((p) => !allowlist.includes(p)).sort();
    expect(bindingNames.sort()).toEqual(expected);
  });

  it('input() declarations match inputBindings', () => {
    const bindingNames = getInputBindingNames(CATALOG_TS, 'Button');
    const inputNames = getInputDeclarationNames(WRAPPER);

    expect(inputNames.sort()).toEqual(bindingNames.sort());
  });
});
