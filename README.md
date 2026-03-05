# spartan-a2ui-adapter

An [A2UI](https://github.com/google/a2ui) catalog adapter for [Spartan UI](https://spartan.ng) — maps Spartan's Angular component library to the A2UI protocol so agents can reason about and compose Angular UIs.

## What's in this repo

- `libs/spartan-a2ui-adapter/` — the adapter library (`@spartan-a2ui-adapter`)
- `catalogs/spartan/v0.8.0/catalog.json` — agent-side JSON Schema catalog
- `apps/mock/` — fixture-driven mock app for visual parity verification

## Quick start

```bash
npm install
npx nx serve mock
```

Open `http://localhost:4200` to see A2UI-rendered Spartan buttons side-by-side with native Spartan buttons.

## Library usage

```typescript
import { provideA2UI } from '@a2ui/angular';
import { SPARTAN_CATALOG, SPARTAN_CATALOG_ID } from '@spartan-a2ui-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideA2UI({ catalog: SPARTAN_CATALOG, theme: yourTheme }),
  ],
};
```

Pass `SPARTAN_CATALOG_ID` to your agent so it loads the right catalog:

```
https://github.com/retz8/spartan-a2ui-adapter/blob/main/catalogs/spartan/v0.8.0/catalog.json
```

## Build

```bash
# Build the adapter library
npx nx build spartan-a2ui-adapter

# Build the mock app
npx nx build mock

# Build everything
npx nx run-many --targets=build
```

## Design doc

See [`docs/plans/2026-03-04-hlm-button-adapter-design.md`](docs/plans/2026-03-04-hlm-button-adapter-design.md).
