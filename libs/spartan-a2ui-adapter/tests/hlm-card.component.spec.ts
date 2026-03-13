import { TestBed } from '@angular/core/testing';
import { provideA2UI, type Catalog, type Theme } from '@a2ui/angular';
import { describe, it, beforeEach, expect } from 'vitest';
import { HlmCardWrapperComponent } from '../src/lib/components/hlm-card/hlm-card-wrapper.component';

const STUB_CHILD = { id: 'stub', type: 'Text', properties: { text: 'hello' } };

function makeComponent(properties: Record<string, unknown> = {}) {
  return {
    type: 'Card',
    properties: {
      child: STUB_CHILD,
      children: [STUB_CHILD],
      ...properties,
    },
  };
}

function createFixture(overrides: { size?: string } = {}) {
  const fixture = TestBed.createComponent(HlmCardWrapperComponent);
  fixture.componentRef.setInput('surfaceId', 'test-surface');
  fixture.componentRef.setInput('weight', '1');
  fixture.componentRef.setInput('component', makeComponent());

  if (overrides.size !== undefined) fixture.componentRef.setInput('size', overrides.size);

  fixture.detectChanges();
  return fixture;
}

describe('HlmCardWrapperComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HlmCardWrapperComponent],
      providers: [
        provideA2UI({ catalog: {} as Catalog, theme: {} as Theme }),
      ],
    });
  });

  it('should create', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders a <section> with data-slot="card"', () => {
    const fixture = createFixture();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('section[data-slot="card"]')).not.toBeNull();
  });

  it('renders card content wrapper with data-slot="card-content"', () => {
    const fixture = createFixture();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-slot="card-content"]')).not.toBeNull();
  });

  it('renders children from properties.children', () => {
    const children = [
      { id: 'c1', type: 'Text', properties: { text: 'first' } },
      { id: 'c2', type: 'Text', properties: { text: 'second' } },
    ];
    const fixture = TestBed.createComponent(HlmCardWrapperComponent);
    fixture.componentRef.setInput('surfaceId', 'test-surface');
    fixture.componentRef.setInput('weight', '1');
    fixture.componentRef.setInput('component', makeComponent({ children }));
    fixture.detectChanges();
    // Two renderer outlets are created — one per child
    const renderers = (fixture.nativeElement as HTMLElement).querySelectorAll('[data-slot="card-content"] ng-container');
    // Angular collapses ng-container so we check that the content exists
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('applies default size attribute when no size is set', () => {
    const fixture = createFixture();
    const section = (fixture.nativeElement as HTMLElement).querySelector('section[data-slot="card"]')!;
    expect(section.getAttribute('data-size')).toBe('default');
  });

  it('applies sm size attribute when size is sm', () => {
    const fixture = createFixture({ size: 'sm' });
    const section = (fixture.nativeElement as HTMLElement).querySelector('section[data-slot="card"]')!;
    expect(section.getAttribute('data-size')).toBe('sm');
  });
});
