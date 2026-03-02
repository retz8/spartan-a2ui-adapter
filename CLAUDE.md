# spartan-a2ui-adapter

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. 

## What This Is
An A2UI catalog adapter for Spartan UI — maps Spartan's Angular component library to the A2UI protocol so agents can reason about and compose Angular UIs.

Two core artifacts:
- `spartan_catalog.json` — component catalog in A2UI catalog format
- Component mappings — Angular-specific binding logic for each component

## Related
- A2UI protocol: https://github.com/google/a2ui
- A2UI Angular Renderer: https://github.com/google/A2UI/tree/main/renderers/angular
- Spartan UI: https://spartan.ng
- TailwindCSS V4: https://tailwindcss.com/docs/installation/framework-guides/angular