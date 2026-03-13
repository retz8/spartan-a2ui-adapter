# Spartan UI — Checkbox

Official doc: https://spartan.ng/components/checkbox

## How it works

`HlmCheckbox` is a standalone component (`selector: 'hlm-checkbox'`) that wraps `BrnCheckbox` (the brain primitive) with Spartan styling. It implements `ControlValueAccessor` so it works with Angular reactive forms and template-driven forms out of the box.

The host element has `class="contents peer"` and `data-slot="checkbox"`, meaning the host itself is invisible in layout — all visual rendering happens on the inner `<brn-checkbox>` element.

## Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `checked` | `model<boolean>` | `false` | Two-way bindable checked state |
| `indeterminate` | `model<boolean>` | `false` | Indeterminate (partially-checked) state |
| `disabled` | `boolean` | `false` | Disables the checkbox |
| `required` | `boolean` | `false` | Marks as required for form validation |
| `id` | `string \| null` | `null` | Sets the id on the inner brn element |
| `name` | `string \| null` | `null` | Sets the name attribute |
| `aria-label` | `string \| null` | `null` | Accessibility label |
| `aria-labelledby` | `string \| null` | `null` | References a labelling element |
| `aria-describedby` | `string \| null` | `null` | References a description element |
| `class` | `ClassValue` | `''` | Additional CSS classes to merge via `hlm()` |

## Outputs

| Output | Type | Description |
|---|---|---|
| `checkedChange` | `OutputEmitterRef<boolean>` | Emits when the checked state changes |

## Notable behaviors

- **No variant/size variants** — there is no `cva()` in this component. Styling is a single fixed class string applied to the inner `<brn-checkbox>`. Custom styling goes through the `class` input.
- **Two-way model binding** — both `checked` and `indeterminate` use Angular `model()`, enabling `[(checked)]` and `[(indeterminate)]` syntax.
- **ControlValueAccessor** — integrates with `FormControl` / `ngModel` automatically; `setDisabledState` is implemented.
- **Indeterminate icon** — the check icon (`lucideCheck`) renders when `checked()` OR `indeterminate()` is true.
- **Disabled visual state** — `data-disabled` host attribute and `cursor-not-allowed opacity-50` classes are applied when disabled.
- **Peer class** — host has `peer` class, enabling Tailwind peer-based sibling styling (useful for labeling patterns).
- **Icon dependency** — imports `HlmIcon` and `NgIcon` for the check mark; `@spartan-ng/helm/icon` path alias must be registered.
