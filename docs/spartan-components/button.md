# Spartan UI — Button

Official doc: https://spartan.ng/components/button

## How it works

`hlmBtn` is an **attribute directive** applied to native `<button>` or `<a>` elements — not a standalone component.

```html
<button hlmBtn>Click me</button>
<a hlmBtn href="...">Link</a>
```

**Selector:** `button[hlmBtn]`, `a[hlmBtn]`
**Export as:** `hlmBtn`

## Inputs

| Input | Type | Default | Source |
|---|---|---|---|
| `variant` | `ButtonVariants['variant']` | `'default'` | helm |
| `size` | `ButtonVariants['size']` | `'default'` | helm |
| `disabled` | `boolean` | `false` | brain (`BrnButton`) |

## Variants

| Value | Description |
|---|---|
| `default` | Standard primary |
| `secondary` | Alternative style |
| `destructive` | Danger/warning |
| `outline` | Border only |
| `ghost` | Minimal/transparent |
| `link` | Looks like a hyperlink |

## Sizes

Sourced from `cva()` in `libs/ui/button/src/lib/hlm-button.ts` — the official docs only list a subset.

| Value | Description |
|---|---|
| `default` | Standard (h-9) |
| `xs` | Extra small (h-6) — not listed in official docs |
| `sm` | Small (h-8) |
| `lg` | Large (h-10) |
| `icon` | Square icon button (size-9) |
| `icon-xs` | Extra small square icon (size-6) — not listed in official docs |
| `icon-sm` | Small square icon (size-8) — not listed in official docs |
| `icon-lg` | Large square icon (size-10) — not listed in official docs |

## Notable behaviors

- Works on both `<button>` and `<a>` — semantic HTML flexibility
- `disabled` forwarded from `BrnButton` brain primitive via `hostDirectives`
- Icon integration support via ng-icons (`[&_ng-icon]` utility classes baked into cva base)
- Loading/spinner state support
- Exported as `hlmBtn` for template references
