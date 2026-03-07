# Button Mapping Finalization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 6 gaps in the HlmButton adapter so the agent-side schema and renderer-side implementation fully reflect what Spartan UI's button actually supports.

**Architecture:** Changes span three layers — `catalog.json` (agent-facing JSON Schema), `catalog.ts` (renderer-side bindings), and `HlmButtonWrapperComponent` (Angular wrapper). Each task targets one gap and is independently verifiable via TypeScript compilation.

**Tech Stack:** Angular 19 (signals), Spartan UI (hlmBtn directive), A2UI v0.8, TypeScript, Nx monorepo

---

## Reference

- Gaps identified from: `docs/spartan-components/button.md`
- Files to touch:
  - `libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json`
  - `libs/spartan-a2ui-adapter/src/lib/catalog.ts`
  - `libs/spartan-a2ui-adapter/src/lib/components/hlm-button/hlm-button-wrapper.component.ts`

---

### Task 1: Make `child` optional

`child` is a projected content reference, not a required input. Icon-only buttons have no text child.

**Files:**
- Modify: `libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json`

**Step 1: Remove `child` from the `required` array**

Find the `HlmButton` definition. Change:

```json
"required": ["child"]
```

to:

```json
"required": []
```

Or remove the `required` key entirely if the array is now empty.

**Step 2: Verify**

```bash
npx nx build spartan-a2ui-adapter
```

Expected: build succeeds with no errors.

**Step 3: Commit**

```bash
git add libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json
git commit -m "fix(catalog): make button child optional to support icon-only buttons"
```

---

### Task 2: Add missing sizes to catalog.json

The actual `cva()` in `libs/ui/button/src/lib/hlm-button.ts` defines 8 sizes. The catalog only exposes 4.

**Files:**
- Modify: `libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json`

**Step 1: Expand the size enum**

Find the `size` property under `HlmButton`. Replace:

```json
"enum": ["default", "sm", "lg", "icon"]
```

with:

```json
"enum": ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"]
```

**Step 2: Update the size description** to mention all values briefly:

```json
"description": "Size of the button. default/xs/sm/lg for text buttons; icon/icon-xs/icon-sm/icon-lg for square icon-only buttons."
```

**Step 3: Verify**

```bash
npx nx build spartan-a2ui-adapter
```

Expected: build succeeds.

**Step 4: Commit**

```bash
git add libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json
git commit -m "fix(catalog): add missing button sizes xs, icon-xs, icon-sm, icon-lg"
```

---

### Task 3: Add `disabled` support — catalog.json

**Files:**
- Modify: `libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json`

**Step 1: Add `disabled` property to HlmButton**

Inside `HlmButton.properties`, add after `size`:

```json
"disabled": {
  "type": "boolean",
  "description": "Whether the button is disabled. Disabled buttons are non-interactive and visually dimmed."
}
```

**Step 2: Verify**

```bash
npx nx build spartan-a2ui-adapter
```

Expected: build succeeds.

**Step 3: Commit**

```bash
git add libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json
git commit -m "fix(catalog): add disabled property to HlmButton schema"
```

---

### Task 4: Add `disabled` support — renderer bindings + wrapper

**Files:**
- Modify: `libs/spartan-a2ui-adapter/src/lib/catalog.ts`
- Modify: `libs/spartan-a2ui-adapter/src/lib/components/hlm-button/hlm-button-wrapper.component.ts`

**Step 1: Add `disabled` input to the wrapper component**

In `hlm-button-wrapper.component.ts`, add a new input after `size`:

```typescript
readonly disabled = input<boolean>(false);
```

Then pass it to the `<button>` element:

```html
<button hlmBtn [variant]="$any(variant())" [size]="$any(size())" [disabled]="disabled()" (click)="handleClick()">
```

**Step 2: Add `disabled` binding in catalog.ts**

In the `HlmButton` entry, add a third binding:

```typescript
inputBinding('disabled', () => ('disabled' in properties && !!properties['disabled']) || false),
```

The full bindings array becomes:

```typescript
bindings: ({ properties }) => [
  inputBinding('variant', () => ('variant' in properties && properties['variant']) || 'default'),
  inputBinding('size', () => ('size' in properties && properties['size']) || 'default'),
  inputBinding('disabled', () => ('disabled' in properties && !!properties['disabled']) || false),
],
```

**Step 3: Verify**

```bash
npx nx build spartan-a2ui-adapter
```

Expected: build succeeds with no TypeScript errors.

**Step 4: Commit**

```bash
git add libs/spartan-a2ui-adapter/src/lib/catalog.ts \
        libs/spartan-a2ui-adapter/src/lib/components/hlm-button/hlm-button-wrapper.component.ts
git commit -m "feat: wire disabled input through button wrapper and renderer bindings"
```

---

### Task 5: Add anchor (`<a>`) support — catalog.json

The `link` variant is meant for navigation. The agent should be able to declare an `href` so the wrapper renders a semantic `<a>` instead of `<button>`.

**Files:**
- Modify: `libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json`

**Step 1: Add `href` property to HlmButton**

Inside `HlmButton.properties`, add:

```json
"href": {
  "type": "string",
  "description": "If provided, the button renders as an anchor (<a>) element with this href. Use with variant='link' for navigation actions."
}
```

**Step 2: Verify**

```bash
npx nx build spartan-a2ui-adapter
```

Expected: build succeeds.

**Step 3: Commit**

```bash
git add libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json
git commit -m "fix(catalog): add href property to HlmButton for anchor rendering"
```

---

### Task 6: Add anchor (`<a>`) support — wrapper component

**Files:**
- Modify: `libs/spartan-a2ui-adapter/src/lib/catalog.ts`
- Modify: `libs/spartan-a2ui-adapter/src/lib/components/hlm-button/hlm-button-wrapper.component.ts`

**Step 1: Add `href` input and conditional template to the wrapper**

Replace the wrapper component with:

```typescript
@Component({
  selector: 'a2ui-hlm-button',
  imports: [HlmButtonImports, Renderer],
  template: `
    @if (href()) {
      <a hlmBtn [variant]="$any(variant())" [size]="$any(size())" [href]="href()" (click)="handleClick()">
        <ng-container
          a2ui-renderer
          [surfaceId]="surfaceId()!"
          [component]="$any(component().properties['child'])"
        />
      </a>
    } @else {
      <button hlmBtn [variant]="$any(variant())" [size]="$any(size())" [disabled]="disabled()" (click)="handleClick()">
        <ng-container
          a2ui-renderer
          [surfaceId]="surfaceId()!"
          [component]="$any(component().properties['child'])"
        />
      </button>
    }
  `,
  styles: [`
    :host {
      display: block;
      flex: var(--weight);
      min-height: 0;
    }
  `],
})
export class HlmButtonWrapperComponent extends DynamicComponent<Types.CustomNode> {
  readonly variant = input<string>('default');
  readonly size = input<string>('default');
  readonly disabled = input<boolean>(false);
  readonly href = input<string | undefined>(undefined);

  handleClick(): void {
    const action = this.component().properties['action'] as unknown as Types.Action | undefined;
    if (action) super.sendAction(action);
  }
}
```

**Step 2: Add `href` binding in catalog.ts**

```typescript
inputBinding('href', () => ('href' in properties && properties['href']) || undefined),
```

**Step 3: Verify**

```bash
npx nx build spartan-a2ui-adapter
```

Expected: build succeeds with no TypeScript errors.

**Step 4: Smoke test in mock app**

```bash
npx nx serve mock
```

Open `http://localhost:4200`, send a prompt asking for a link button (e.g. "show a link button to google.com"). Confirm the rendered HTML uses `<a href="...">` not `<button>`.

**Step 5: Commit**

```bash
git add libs/spartan-a2ui-adapter/src/lib/catalog.ts \
        libs/spartan-a2ui-adapter/src/lib/components/hlm-button/hlm-button-wrapper.component.ts
git commit -m "feat: render anchor element when href is provided on HlmButton"
```

---

## Summary of changes

| Task | File(s) | Change |
|---|---|---|
| 1 | catalog.json | `child` no longer required |
| 2 | catalog.json | Add 4 missing sizes to enum |
| 3 | catalog.json | Add `disabled` boolean property |
| 4 | catalog.ts, wrapper | Wire `disabled` through bindings and template |
| 5 | catalog.json | Add `href` string property |
| 6 | catalog.ts, wrapper | Conditional `<a>` vs `<button>` rendering |
