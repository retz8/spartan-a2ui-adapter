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

| Input | Type | Default |
|---|---|---|
| `variant` | `ButtonVariants['variant']` | from config |
| `size` | `ButtonVariants['size']` | from config |
| `disabled` | `boolean` | `false` |

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

| Value | Description |
|---|---|
| `default` | Standard |
| `sm` | Compact |
| `icon` | Square, icon-only |

## Notable behaviors

- Works on both `<button>` and `<a>` — semantic HTML flexibility
- Icon integration support via ng-icons
- Loading/spinner state support
- Exported as `hlmBtn` for template references
