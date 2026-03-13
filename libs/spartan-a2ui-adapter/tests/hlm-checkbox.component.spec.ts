import { TestBed } from '@angular/core/testing';
import { provideA2UI, type Catalog, type Theme } from '@a2ui/angular';
import { provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { describe, it, beforeEach, expect } from 'vitest';
import { HlmCheckboxWrapperComponent } from '../src/lib/components/hlm-checkbox/hlm-checkbox-wrapper.component';

function makeComponent(properties: Record<string, unknown> = {}) {
  return {
    type: 'CheckBox',
    properties: {
      label: { literalString: 'Accept terms' },
      value: { literalBoolean: false },
      ...properties,
    },
  };
}

function createFixture(
  properties: Record<string, unknown> = {},
  inputs: { value?: boolean; disabled?: boolean } = {},
) {
  const fixture = TestBed.createComponent(HlmCheckboxWrapperComponent);
  fixture.componentRef.setInput('surfaceId', 'test-surface');
  fixture.componentRef.setInput('weight', '1');
  fixture.componentRef.setInput('component', makeComponent(properties));
  if (inputs.value !== undefined) fixture.componentRef.setInput('value', inputs.value);
  if (inputs.disabled !== undefined) fixture.componentRef.setInput('disabled', inputs.disabled);
  fixture.detectChanges();
  return fixture;
}

describe('HlmCheckboxWrapperComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HlmCheckboxWrapperComponent],
      providers: [
        provideA2UI({ catalog: {} as Catalog, theme: {} as Theme }),
        provideIcons({ lucideCheck }),
      ],
    });
  });

  it('should create', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders hlm-checkbox with data-slot="checkbox"', () => {
    const fixture = createFixture();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-slot="checkbox"]')).not.toBeNull();
  });

  it('renders label text from literalString', () => {
    const fixture = createFixture();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Accept terms');
  });

  it('is unchecked by default', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance.value()).toBe(false);
  });

  it('reflects value=true input', () => {
    const fixture = TestBed.createComponent(HlmCheckboxWrapperComponent);
    fixture.componentRef.setInput('surfaceId', 'test-surface');
    fixture.componentRef.setInput('weight', '1');
    fixture.componentRef.setInput('component', makeComponent());
    fixture.componentRef.setInput('value', true);
    // Read signal before detectChanges to avoid ng-icon injection issue in jsdom
    expect(fixture.componentInstance.value()).toBe(true);
  });

  it('reflects disabled=true input', () => {
    const fixture = createFixture({}, { disabled: true });
    expect(fixture.componentInstance.disabled()).toBe(true);
  });
});
