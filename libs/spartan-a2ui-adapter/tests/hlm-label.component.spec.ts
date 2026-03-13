import { TestBed } from '@angular/core/testing';
import { provideA2UI, type Catalog, type Theme } from '@a2ui/angular';
import { describe, it, beforeEach, expect } from 'vitest';
import { HlmLabelWrapperComponent } from '../src/lib/components/hlm-label/hlm-label-wrapper.component';

const STUB_CHILD = { id: 'stub-child', type: 'Text', properties: { text: 'Accept terms' } };

function makeComponent(properties: Record<string, unknown> = {}) {
  return { type: 'Label', properties: { child: STUB_CHILD, ...properties } };
}

function createFixture() {
  const fixture = TestBed.createComponent(HlmLabelWrapperComponent);
  fixture.componentRef.setInput('surfaceId', 'test-surface');
  fixture.componentRef.setInput('weight', '1');
  fixture.componentRef.setInput('component', makeComponent());
  fixture.detectChanges();
  return fixture;
}

describe('HlmLabelWrapperComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HlmLabelWrapperComponent],
      providers: [
        provideA2UI({ catalog: {} as Catalog, theme: {} as Theme }),
      ],
    });
  });

  it('should create', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a <label> host element with hlmLabel applied', () => {
    const fixture = createFixture();
    const label = (fixture.nativeElement as HTMLElement).querySelector('label');
    expect(label).not.toBeNull();
  });

  it('applies Spartan label classes to the <label> element', () => {
    const fixture = createFixture();
    const label = (fixture.nativeElement as HTMLElement).querySelector('label')!;
    // HlmLabel always applies text-sm and font-medium
    expect(label.classList.contains('text-sm')).toBe(true);
    expect(label.classList.contains('font-medium')).toBe(true);
  });
});
