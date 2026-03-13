import { TestBed } from '@angular/core/testing';
import { provideA2UI, type Catalog, type Theme } from '@a2ui/angular';
import { describe, it, beforeEach, expect } from 'vitest';
import { HlmSeparatorWrapperComponent } from '../src/lib/components/hlm-separator/hlm-separator-wrapper.component';

function makeComponent(properties: Record<string, unknown> = {}) {
  return { type: 'Separator', properties: { ...properties } };
}

function createFixture(overrides: { orientation?: string; decorative?: boolean } = {}) {
  const fixture = TestBed.createComponent(HlmSeparatorWrapperComponent);
  fixture.componentRef.setInput('surfaceId', 'test-surface');
  fixture.componentRef.setInput('weight', '1');
  fixture.componentRef.setInput('component', makeComponent());

  if (overrides.orientation !== undefined)
    fixture.componentRef.setInput('orientation', overrides.orientation);
  if (overrides.decorative !== undefined)
    fixture.componentRef.setInput('decorative', overrides.decorative);

  fixture.detectChanges();
  return fixture;
}

describe('HlmSeparatorWrapperComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HlmSeparatorWrapperComponent],
      providers: [
        provideA2UI({ catalog: {} as Catalog, theme: {} as Theme }),
      ],
    });
  });

  it('should create', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders hlm-separator element', () => {
    const fixture = createFixture();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('hlm-separator')).not.toBeNull();
  });

  it('defaults orientation to horizontal', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance.orientation()).toBe('horizontal');
  });

  it('reflects orientation=vertical input', () => {
    const fixture = createFixture({ orientation: 'vertical' });
    expect(fixture.componentInstance.orientation()).toBe('vertical');
  });

  it('defaults decorative to true', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance.decorative()).toBe(true);
  });

  it('reflects decorative=false input', () => {
    const fixture = createFixture({ decorative: false });
    expect(fixture.componentInstance.decorative()).toBe(false);
  });
});
