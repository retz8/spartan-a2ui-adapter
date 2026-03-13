import { TestBed } from '@angular/core/testing';
import { provideA2UI, type Catalog, type Theme } from '@a2ui/angular';
import { describe, it, beforeEach, expect } from 'vitest';
import { HlmBadgeWrapperComponent } from '../src/lib/components/hlm-badge/hlm-badge-wrapper.component';

const STUB_CHILD = { id: 'stub-child', type: 'Text', properties: { text: '' } };

function makeComponent(properties: Record<string, unknown> = {}) {
  return { type: 'Badge', properties: { child: STUB_CHILD, ...properties } };
}

function createFixture(overrides: { variant?: string } = {}) {
  const fixture = TestBed.createComponent(HlmBadgeWrapperComponent);
  fixture.componentRef.setInput('surfaceId', 'test-surface');
  fixture.componentRef.setInput('weight', '1');
  fixture.componentRef.setInput('component', makeComponent());

  if (overrides.variant !== undefined) fixture.componentRef.setInput('variant', overrides.variant);

  fixture.detectChanges();
  return fixture;
}

describe('HlmBadgeWrapperComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HlmBadgeWrapperComponent],
      providers: [
        provideA2UI({ catalog: {} as Catalog, theme: {} as Theme }),
      ],
    });
  });

  it('should create', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a <span> with data-slot="badge"', () => {
    const fixture = createFixture();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('span[data-slot="badge"]')).not.toBeNull();
  });

  it('applies default variant classes when no variant is set', () => {
    const fixture = createFixture();
    const span = (fixture.nativeElement as HTMLElement).querySelector('span[data-slot="badge"]')!;
    expect(span.classList.contains('bg-primary')).toBe(true);
  });

  it('applies secondary variant classes', () => {
    const fixture = createFixture({ variant: 'secondary' });
    const span = (fixture.nativeElement as HTMLElement).querySelector('span[data-slot="badge"]')!;
    expect(span.classList.contains('bg-secondary')).toBe(true);
  });

  it('applies destructive variant classes', () => {
    const fixture = createFixture({ variant: 'destructive' });
    const span = (fixture.nativeElement as HTMLElement).querySelector('span[data-slot="badge"]')!;
    expect(span.classList.contains('text-destructive')).toBe(true);
  });

  it('applies outline variant classes', () => {
    const fixture = createFixture({ variant: 'outline' });
    const span = (fixture.nativeElement as HTMLElement).querySelector('span[data-slot="badge"]')!;
    expect(span.classList.contains('border-border')).toBe(true);
  });
});
