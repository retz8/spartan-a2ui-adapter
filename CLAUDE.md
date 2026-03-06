# spartan-a2ui-adapter

Covers: task instructions, project overview, and references.

## Task Instructions [MUST READ]

- **A2UI-related tasks** (catalog format, component mappings, protocol types, renderer behavior): MUST read `a2ui-v0.8-spec.md` from memory before proceeding. If you think you *might* need A2UI spec knowledge, read it proactively. The A2UI source lives at `../A2UI/` relative to this project.
- **Nx monorepo setup tasks**: refer to `docs/nx-guidelines.md`.

## Project Overview
An A2UI catalog adapter for Spartan UI — maps Spartan's Angular component library to the A2UI protocol so agents can reason about and compose Angular UIs. Built on `@a2ui/angular`, Spartan UI, and Tailwind CSS v4.

```
spartan-a2ui-adapter/
├── libs/
│   ├── spartan-a2ui-adapter/       # publishable adapter library
│   │   └── src/lib/
│   │       ├── catalog.ts          # SPARTAN_CATALOG (renderer-side)
│   │       ├── catalog-id.ts       # SPARTAN_CATALOG_ID
│   │       └── components/
│   │           └── hlm-button/     # wrapper components per Spartan component
│   └── ui/
│       ├── button/                 # HlmButton helm (Spartan styling directive)
│       └── utils/                  # shared Spartan utilities
├── apps/
│   └── mock/                       # dev-only visual comparison app
│       └── src/app/
│           ├── fixtures/           # hardcoded A2UI JSON payloads
│           └── theme.ts            # minimal theme for default catalog components
└── catalogs/
    └── spartan/v0.8.0/
        └── catalog.json            # agent-side JSON Schema (versioned)
```

## References
- [Spartan UI](https://spartan.ng)
- [TailwindCSS V4](https://tailwindcss.com/docs/installation/framework-guides/angular)
