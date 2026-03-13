# Spartan UI — Card

Official doc: https://spartan.ng/components/card

## How it works

Pure helm (no brain primitive). `HlmCard` is a directive applied via `[hlmCard]` or `<hlm-card>` selector. It renders a styled container with `data-slot="card"` and exposes a `size` input. All sub-components are also directives applied to semantic HTML elements — they inherit the parent card's size via the `group/card` CSS group mechanism (`group-data-[size=sm]/card:*`).

No brain dependency, no `hostDirectives`.

## Sub-components

| Directive | Selector | data-slot | Purpose |
|---|---|---|---|
| `HlmCard` | `[hlmCard]`, `hlm-card` | `card` | Root container |
| `HlmCardHeader` | `[hlmCardHeader]`, `hlm-card-header` | `card-header` | Top section — holds title, description, action |
| `HlmCardTitle` | `[hlmCardTitle]` | `card-title` | Main heading |
| `HlmCardDescription` | `[hlmCardDescription]` | `card-description` | Subtext below title |
| `HlmCardAction` | `[hlmCardAction]` | `card-action` | Optional top-right action slot (grid col 2) |
| `HlmCardContent` | `[hlmCardContent]` | `card-content` | Primary body area |
| `HlmCardFooter` | `[hlmCardFooter]`, `hlm-card-footer` | `card-footer` | Bottom section — typically holds action buttons |

## Inputs

| Input | Type | Default | Source |
|---|---|---|---|
| `size` | `'sm' \| 'default'` | `'default'` | `HlmCard` helm |

Only `HlmCard` has an input. All other sub-components are style-only directives with no inputs.

## Sizes

| Value | Description |
|---|---|
| `default` | Standard padding (`py-6`, `px-6`), standard gap (`gap-6`), base text size |
| `sm` | Reduced padding (`py-4`, `px-4`), smaller gap (`gap-4`), smaller title text (`text-sm`) |

Size is set once on the root `HlmCard` and cascades to all sub-components via Tailwind's CSS group (`group-data-[size=sm]/card`).

## Notable behaviors

- **Size cascades via CSS group**: `HlmCard` sets `data-size` on the host and uses `group/card`. Sub-components react via `group-data-[size=sm]/card:*` — no Angular input passing needed.
- **Image-aware rounding**: Root card applies `*:[img:first-child]:rounded-t-xl` and `*:[img:last-child]:rounded-b-xl` — images inside a card get auto-rounded corners.
- **Image top padding suppression**: `has-[>img:first-child]:pt-0` — if the first child is an `<img>`, top padding is removed so the image bleeds to the card edge.
- **Action layout via CSS grid**: `HlmCardHeader` uses `has-data-[slot=card-action]:grid-cols-[1fr_auto]` — the action slot auto-creates a two-column header grid when present.
- **Border-aware spacing**: Footer and header use `[.border-t]:pt-*` / `[.border-b]:pb-*` — adding a border class triggers extra spacing automatically.
- **No brain primitive**: Pure styling, no interactivity or state management at the Spartan level.
- **`HlmCardImports`**: Convenience array exported from `src/index.ts` for bulk import of all 7 directives.
