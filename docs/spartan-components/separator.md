# Spartan UI — Separator

Official doc: https://spartan.ng/components/separator

## How it works

`HlmSeparator` is a **directive** (not a standalone component) with selector `[hlmSeparator], hlm-separator`. It can be applied as an attribute or as a custom element tag.

It uses `hostDirectives` to compose `BrnSeparator` from the brain layer, forwarding the `orientation` and `decorative` inputs. Styling is applied via a static class string (`hlmSeparatorClass`) — there is no `cva()` call and no variants or sizes.

## Inputs

| Input | Type | Default | Source |
|---|---|---|---|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | brain (`BrnSeparator`) |
| `decorative` | `boolean` | `true` | brain (`BrnSeparator`) |

## Styling

Static class applied unconditionally:

```
bg-border inline-flex shrink-0
data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full
data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px
```

Orientation is reflected as a `data-orientation` attribute by the brain (`BrnSeparator`), which the CSS data-attribute selectors target.

## Notable behaviors

- No variants or sizes — the component has a single visual style.
- `decorative: true` (default) means it is hidden from the accessibility tree (`aria-hidden`). Set `decorative: false` to expose it as a separator landmark (`role="separator"`).
- Orientation controls both the CSS dimensions (1px height for horizontal, 1px width for vertical) and the ARIA `aria-orientation` attribute when `decorative` is false.
- Exported as `HlmSeparatorImports = [HlmSeparator]` for easy module registration.
