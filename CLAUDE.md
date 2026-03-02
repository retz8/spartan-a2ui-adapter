# spartan-a2ui-adapter

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. 

## What This Is
An A2UI catalog adapter for Spartan UI — maps Spartan's Angular component library to the A2UI protocol so agents can reason about and compose Angular UIs.

Two core artifacts:
- `spartan_catalog.json` — component catalog in A2UI catalog format
- Component mappings — Angular-specific binding logic for each component

## Learning Notes Convention
Research and learning from reading A2UI source, Spartan docs, or Angular ecosystem is recorded under `personal/A2UI/` in the workspace root (not in this repo).

- Angular renderer deep-dive → `personal/A2UI/angular-renderer/`
- Add a new markdown file per topic as understanding grows

## Related
- A2UI protocol: https://github.com/google/a2ui
- A2UI Angular Renderer: https://github.com/google/A2UI/tree/main/renderers/angular
- Spartan UI: https://spartan.ng
- TailwindCSS V4: https://tailwindcss.com/docs/installation/framework-guides/angular