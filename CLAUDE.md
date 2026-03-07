# spartan-a2ui-adapter

Covers: task instructions, project overview, and references.

## Task Instructions [MUST READ]

- **A2UI-related tasks** (catalog format, component mappings, protocol types, renderer behavior): MUST read `a2ui-v0.8-spec.md` from memory before proceeding. If you think you *might* need A2UI spec knowledge, read it proactively. The A2UI source lives at `../A2UI/` relative to this project.
- **New Spartan UI component mapping** or **reviewing a Spartan UI catalog mapping implementation**: MUST read `docs/spartan-components/<component-name>.md` before proceeding. This contains the authoritative reference extracted from the official Spartan UI docs.
- **Nx monorepo setup tasks**: refer to `docs/nx-guidelines.md`.

## Project Overview
An A2UI catalog adapter for Spartan UI — maps Spartan's Angular component library to the A2UI protocol so agents can reason about and compose Angular UIs. Built on `@a2ui/angular`, Spartan UI, and Tailwind CSS v4.

```
spartan-a2ui-adapter/
├── agents/
│   └── mock/                       # Google ADK Python agent (A2A server)
│       ├── spartan_mock_agent/     # agent, executor, entrypoint
│       └── examples/spartan_catalog/  # few-shot A2UI JSON payloads
├── apps/
│   └── mock/                       # Angular client (A2A-connected chat UI)
│       └── src/app/
│           ├── a2a.service.ts      # A2A JSON-RPC client
│           ├── fixtures/           # reference A2UI JSON payloads (unused at runtime)
│           └── theme.ts            # minimal theme for default catalog components
└── libs/
    ├── spartan-a2ui-adapter/       # publishable adapter library
    │   ├── catalogs/v0.8.0/
    │   │   └── catalog.json        # agent-side JSON Schema (published with npm package)
    │   └── src/lib/
    │       ├── catalog.ts          # SPARTAN_CATALOG (renderer-side)
    │       ├── catalog-id.ts       # SPARTAN_CATALOG_ID
    │       └── components/
    │           ├── hlm-button/     # HlmButtonWrapperComponent
    │           └── hlm-badge/      # HlmBadgeWrapperComponent
    └── ui/
        ├── button/                 # HlmButton helm (Spartan styling directive)
        ├── badge/                  # HlmBadge helm (Spartan styling directive)
        └── utils/                  # shared Spartan utilities
```

## References
- [Spartan UI](https://spartan.ng)
- [TailwindCSS V4](https://tailwindcss.com/docs/installation/framework-guides/angular)
