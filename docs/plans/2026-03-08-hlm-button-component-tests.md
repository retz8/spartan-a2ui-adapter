# HlmButton Angular Component Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Angular TestBed tests that verify `HlmButtonWrapperComponent`'s runtime behavior — element type, input forwarding, CSS classes, and click handling.

**Architecture:** All tests live in `libs/spartan-a2ui-adapter/tests/hlm-button.component.spec.ts`. Each test uses `TestBed.configureTestingModule` with `provideA2UI()` and sets the required signal inputs via `fixture.componentRef.setInput()`. The existing component is not modified — only tests are added.

**Tech Stack:** Vitest, `@analogjs/vitest-angular`, Angular TestBed, `provideA2UI` from `@a2ui/angular`

---

### Task 1: Create the spec file and verify TestBed setup compiles

**Files:**
- Create: `libs/spartan-a2ui-adapter/tests/hlm-button.component.spec.ts`

**Step 1: Create the file with the TestBed scaffold**

```ts
import { TestBed } from '@angular/core/testing';
import { provideA2UI, type Catalog, type Theme } from '@a2ui/angular';
import { describe, it, beforeEach, expect } from 'vitest';
import { HlmButtonWrapperComponent } from '../src/lib/components/hlm-button/hlm-button-wrapper.component';

// Minimal stub for the required `component()` signal input.
// `properties` must be an object; all fields optional for most tests.
function makeComponent(properties: Record<string, unknown> = {}) {
  return { type: 'HlmButton', properties };
}

// Shared factory: creates the component with required base-class inputs pre-set.
// Pass overrides for any input declared on HlmButtonWrapperComponent itself.
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
```

**Step 2: Run the test to verify setup compiles**

```bash
npx nx test spartan-a2ui-adapter --testNamePattern="should create"
```

Expected: PASS (1 test passing). If you see a DI error about `MessageProcessor`, add `MessageProcessor` to `providers` in `configureTestingModule`.

**Step 3: Commit**

```bash
git add libs/spartan-a2ui-adapter/tests/hlm-button.component.spec.ts
git commit -m "test(hlm-button): scaffold component spec with TestBed setup"
```

---

### Task 2: Test element type — `<button>` vs `<a>`

**Files:**
- Modify: `libs/spartan-a2ui-adapter/tests/hlm-button.component.spec.ts`

**Step 1: Add the two failing tests inside the `describe` block**

```ts
it('renders a <button> by default (no href)', () => {
  const fixture = createFixture();
  const el = fixture.nativeElement as HTMLElement;
  expect(el.querySelector('button')).not.toBeNull();
  expect(el.querySelector('a')).toBeNull();
});

it('renders an <a> when href is provided', () => {
  const fixture = createFixture({ href: 'https://example.com' });
  const el = fixture.nativeElement as HTMLElement;
  const anchor = el.querySelector('a');
  expect(anchor).not.toBeNull();
  expect(anchor!.getAttribute('href')).toBe('https://example.com');
  expect(el.querySelector('button')).toBeNull();
});
```

**Step 2: Run to verify both pass**

```bash
npx nx test spartan-a2ui-adapter --testNamePattern="renders a"
```

Expected: PASS (2 tests passing).

**Step 3: Commit**

```bash
git add libs/spartan-a2ui-adapter/tests/hlm-button.component.spec.ts
git commit -m "test(hlm-button): add element type tests (button vs anchor)"
```

---

### Task 3: Test `disabled` forwarding

**Files:**
- Modify: `libs/spartan-a2ui-adapter/tests/hlm-button.component.spec.ts`

**Step 1: Add the test**

```ts
it('forwards disabled to the <button> element', () => {
  const fixture = createFixture({ disabled: true });
  const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
  expect(button.disabled).toBe(true);
});
```

**Step 2: Run**

```bash
npx nx test spartan-a2ui-adapter --testNamePattern="forwards disabled"
```

Expected: PASS.

**Step 3: Commit**

```bash
git add libs/spartan-a2ui-adapter/tests/hlm-button.component.spec.ts
git commit -m "test(hlm-button): add disabled forwarding test"
```

---

### Task 4: Test CSS classes — variant and size

**Background:** The `hlmBtn` directive applies Tailwind classes via CVA (class-variance-authority).
- `variant = 'destructive'` adds class `bg-destructive` (from `libs/ui/button/src/lib/hlm-button.ts` line 14)
- `size = 'sm'` adds class `h-8` (from `libs/ui/button/src/lib/hlm-button.ts` line 25)

**Files:**
- Modify: `libs/spartan-a2ui-adapter/tests/hlm-button.component.spec.ts`

**Step 1: Add the two tests**

```ts
it('applies destructive variant classes', () => {
  const fixture = createFixture({ variant: 'destructive' });
  const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
  expect(button.classList.contains('bg-destructive')).toBe(true);
});

it('applies sm size classes', () => {
  const fixture = createFixture({ size: 'sm' });
  const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
  expect(button.classList.contains('h-8')).toBe(true);
});
```

**Step 2: Run**

```bash
npx nx test spartan-a2ui-adapter --testNamePattern="applies"
```

Expected: PASS (2 tests). Note: `hlmBtn` applies classes to the host element directly, so they appear on the `<button>` element in the rendered DOM.

**Step 3: Commit**

```bash
git add libs/spartan-a2ui-adapter/tests/hlm-button.component.spec.ts
git commit -m "test(hlm-button): add variant and size class tests"
```

---

### Task 5: Test click → `sendAction` dispatch

**Background:** `handleClick()` reads `component().properties['action']` and calls `super.sendAction(action)` if present.
`super.sendAction()` resolves to `DynamicComponent.prototype.sendAction`, so spy on the prototype to intercept it.

**Files:**
- Modify: `libs/spartan-a2ui-adapter/tests/hlm-button.component.spec.ts`

**Step 1: Add the import at the top of the file**

```ts
import { vi } from 'vitest';
import { DynamicComponent } from '@a2ui/angular';
```

**Step 2: Add the two click tests**

```ts
it('calls sendAction when button is clicked with an action property', () => {
  const mockAction = { type: 'event', name: 'click' };
  const spy = vi.spyOn(DynamicComponent.prototype as any, 'sendAction').mockResolvedValue([]);

  const fixture = createFixture({ properties: { action: mockAction } });
  const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
  button.click();

  expect(spy).toHaveBeenCalledOnce();
  expect(spy).toHaveBeenCalledWith(mockAction);
  spy.mockRestore();
});

it('does not call sendAction when button is clicked without an action property', () => {
  const spy = vi.spyOn(DynamicComponent.prototype as any, 'sendAction').mockResolvedValue([]);

  const fixture = createFixture();
  const button = (fixture.nativeElement as HTMLElement).querySelector('button')!;
  button.click();

  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
});
```

**Step 3: Run**

```bash
npx nx test spartan-a2ui-adapter --testNamePattern="sendAction"
```

Expected: PASS (2 tests).

**Step 4: Run the full suite to verify nothing regressed**

```bash
npx nx test spartan-a2ui-adapter
```

Expected: all tests pass (including schema parity tests).

**Step 5: Commit**

```bash
git add libs/spartan-a2ui-adapter/tests/hlm-button.component.spec.ts
git commit -m "test(hlm-button): add click and sendAction dispatch tests"
```
