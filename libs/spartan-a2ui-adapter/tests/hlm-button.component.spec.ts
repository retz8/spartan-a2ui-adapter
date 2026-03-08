import { TestBed } from '@angular/core/testing';
import { provideA2UI, type Catalog, type Theme } from '@a2ui/angular';
import { describe, it, beforeEach, expect } from 'vitest';
import { HlmButtonWrapperComponent } from '../src/lib/components/hlm-button/hlm-button-wrapper.component';

// Minimal child node stub — Renderer reads `.type` from this node.
// The empty catalog won't match it, so nothing is rendered, but no crash.
const STUB_CHILD = { id: 'stub-child', type: 'Text', properties: { text: '' } };

// Minimal stub for the required `component()` signal input.
function makeComponent(properties: Record<string, unknown> = {}) {
  return { type: 'HlmButton', properties: { child: STUB_CHILD, ...properties } };
}

// Shared factory: creates the component with required base-class inputs pre-set.
function createFixture(overrides: {
  variant?: string;
  size?: string;
  disabled?: boolean;
  href?: string;
  properties?: Record<string, unknown>;
} = {}) {
  const fixture = TestBed.createComponent(HlmButtonWrapperComponent);
  fixture.componentRef.setInput('surfaceId', 'test-surface');
  fixture.componentRef.setInput('weight', '1');
  fixture.componentRef.setInput('component', makeComponent(overrides.properties));

  if (overrides.variant !== undefined) fixture.componentRef.setInput('variant', overrides.variant);
  if (overrides.size !== undefined) fixture.componentRef.setInput('size', overrides.size);
  if (overrides.disabled !== undefined) fixture.componentRef.setInput('disabled', overrides.disabled);
  if (overrides.href !== undefined) fixture.componentRef.setInput('href', overrides.href);

  fixture.detectChanges();
  return fixture;
}

describe('HlmButtonWrapperComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HlmButtonWrapperComponent],
      providers: [
        provideA2UI({ catalog: {} as Catalog, theme: {} as Theme }),
      ],
    });
  });

  it('should create', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
