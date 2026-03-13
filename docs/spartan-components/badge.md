# Spartan UI — Badge

Official doc: https://spartan.ng/components/badge

## How it works

`HlmBadge` is a pure **helm directive** (no brain primitive). It applies badge styling via `cva()` and can be attached to any element via the attribute selector `[hlmBadge]` or used as the element selector `hlm-badge`. No `hostDirectives` — all inputs belong to the helm itself.

## Inputs

| Input | Type | Default | Source |
|---|---|---|---|
| `variant` | `BadgeVariants['variant']` | `'default'` | helm |

## Variants

| Value | Description |
|---|---|
| `default` | Filled with primary color, primary-foreground text |
| `secondary` | Filled with secondary color, secondary-foreground text |
| `destructive` | Destructive-tinted background and text, red focus ring |
| `outline` | Border only (no fill), foreground text |
| `ghost` | No border or fill at rest; muted background on hover |
| `link` | Primary-colored text with underline on hover; no background |

> **Note:** `link` is present in the `cva()` definition but **not listed in the official docs**.

## Notable behaviors

- Applied as a directive — no component shell needed; works on `<span>`, `<a>`, `<div>`, etc.
- Sets `data-slot="badge"` and `data-variant="<value>"` as host attributes (useful for styling hooks).
- Base styles include `h-5`, `rounded-4xl`, `text-xs`, `font-medium`, and icon-aware padding selectors (`has-data-[icon=inline-start]`, `has-data-[icon=inline-end]`).
- `[a]:hover:*` selectors make hover states activate only when the badge is inside an anchor — safe for non-interactive usage.
- No size variants — badge has a single fixed size (`h-5 px-2 py-0.5`).
