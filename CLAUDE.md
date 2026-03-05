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

---

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
