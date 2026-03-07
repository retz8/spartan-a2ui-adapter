---
goal: Sample agentic backend for spartan-a2ui-adapter with A2A-connected mock client
version: 1.0
date_created: 2026-03-07
owner: Jioh In
status: Approved
tags: [feature, agent, a2ui, adk, a2a, spartan]
---

# Sample Agentic Backend — Design

A sample agentic backend that registers the Spartan A2UI catalog and generates A2UI responses from natural language prompts. Paired with the existing `apps/mock/` Angular client, updated to connect via A2A instead of hardcoded fixtures.

This is the first `agent/client` pair in a scalable gallery structure where each named agent and client app are matched by folder name.

---

## 1. Goals

- Demonstrate the full agentic flow: user prompt → LLM → A2UI JSON → Angular renderer
- Keep the agent prompt framework-agnostic — the catalog schema defines what components are available, not the system prompt
- Structure the repo as a community-friendly gallery: `apps/<name>/` paired with `agents/<name>/`
- Simulate npm package consumption by reading `catalog.json` from the local lib dist output

---

## 2. Repo Structure

```
spartan-a2ui-adapter/
├── agents/
│   └── mock/                              ← Python ADK agent
│       ├── spartan_mock_agent/
│       │   ├── __init__.py
│       │   ├── agent.py                   ← LlmAgent subclass + system prompt
│       │   ├── agent_executor.py          ← A2A executor + providers
│       │   └── __main__.py               ← Starlette server entrypoint
│       ├── examples/
│       │   └── spartan_catalog/           ← few-shot A2UI JSON payloads
│       │       ├── button.json
│       │       ├── badge.json
│       │       └── button_and_badge.json
│       ├── pyproject.toml
│       └── .env.example
├── apps/
│   └── mock/                              ← Angular client (updated)
│       └── src/app/
│           ├── a2a.service.ts             ← new: A2A HTTP client service
│           └── app.component.ts           ← updated: chat input + surface render
├── libs/
│   └── spartan-a2ui-adapter/
│       ├── src/lib/
│       │   ├── catalog.ts                 ← renderer-facing TypeScript catalog
│       │   ├── catalog-id.ts
│       │   └── components/
│       │       ├── hlm-button/
│       │       └── hlm-badge/             ← new
│       └── catalogs/
│           └── v0.8.0/
│               └── catalog.json           ← agent-facing JSON Schema catalog
└── dist/
    └── libs/spartan-a2ui-adapter/
        └── catalogs/v0.8.0/catalog.json   ← built artifact, read by agent
```

---

## 3. Catalog Distribution

The `catalog.json` (agent-facing JSON Schema) lives inside the library at `libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json` and is published as part of the `@spartan-a2ui-adapter` npm package.

For local development, the Nx build copies it into `dist/libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json`. The agent reads from this path, mimicking `node_modules/@spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json` after an npm install.

The Nx build config includes `catalogs/**` as a file asset to ensure the JSON is copied to dist on every build.

**Dependency chain:**
```
nx build spartan-a2ui-adapter
  → dist/libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json

agents/mock reads from dist path
  → A2uiSchemaManager loads catalog + examples
  → SendA2uiToClientToolset injects into every LLM request
```

This creates a clean separation: adding a new Spartan component only requires changes in `libs/` (TypeScript wrapper + catalog JSON). The agent picks it up on the next build with no agent-side changes.

---

## 4. Agent Design (`agents/mock/`)

### Stack

- **Framework:** Google ADK (`google-adk`)
- **LLM:** Gemini 2.5 Flash via LiteLLM (`gemini/gemini-2.5-flash`)
- **A2UI tooling:** `a2ui[adk]` (local path install from `../../A2UI/agent_sdks/python`)
- **Server:** Starlette + Uvicorn via `A2AStarletteApplication`

### System Prompt

The agent prompt is **framework-agnostic** — it describes a general UI composer, not a Spartan-specific renderer. The catalog schema injection by `SendA2uiToClientToolset` is what tells the LLM which components are available.

Three sections:

**`ROLE_DESCRIPTION`**
> You are a UI composer. Translate user requests into A2UI JSON payloads using the registered component catalog. You MUST use the `send_a2ui_json_to_client` tool to send UI to the client.

**`WORKFLOW_DESCRIPTION`**
1. Parse the user's request and identify the UI elements needed
2. Select appropriate components from the catalog
3. Compose layout using `Column` or `Row` for multi-component requests
4. Call `send_a2ui_json_to_client` with the fully constructed A2UI JSON payload

**`UI_DESCRIPTION`**
Describes layout primitives (`Column` for vertical, `Row` for horizontal) and how to compose components — no mention of Spartan or Angular. Component-specific details (variants, sizes) come from the catalog schema.

### Tools

Only one tool: `SendA2uiToClientToolset`. No data-fetching tools — prompts are UI composition requests, not data queries.

### Catalog Loading

```python
catalog_path = Path(__file__).parent.parent.parent.parent
    / "dist/libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json"

schema_manager = A2uiSchemaManager(
    VERSION_0_8,
    catalogs=[
        CatalogConfig.from_path(
            name="spartan",
            catalog_path=catalog_path,
            examples_path=Path(__file__).parent.parent / "examples/spartan_catalog",
        ),
    ],
    accepts_inline_catalogs=True,
)
```

---

## 5. Example Payloads (`agents/mock/examples/spartan_catalog/`)

Three few-shot examples injected into every LLM request by `A2uiSchemaManager`:

**`button.json`** — A `Column` root containing one `HlmButton` (variant: `default`) with a `Text` child labeled `"Submit"`. Demonstrates the basic button + text composition pattern.

**`badge.json`** — A `Column` root containing one `HlmBadge` with a `Text` child labeled `"New"`. Demonstrates badge usage.

**`button_and_badge.json`** — A `Column` root containing one `HlmButton` (`"Submit"`) and one `HlmBadge` (`"New"`) stacked vertically. Directly targets the "show me a button and badge in vertical alignment" demo prompt.

Realistic label text is used throughout so the LLM learns to pick contextually appropriate labels from user prompts.

---

## 6. Mock App Updates (`apps/mock/`)

### New: `a2a.service.ts`

Angular service wrapping the A2A HTTP call:
- `sendMessage(text: string): Promise<Types.ServerToClientMessage[]>` — POSTs to the agent A2A endpoint, parses the streamed response, extracts `DataPart` items that carry A2UI messages, returns the message array

### Updated: `app.component.ts`

Replaces the hardcoded fixture approach with a minimal chat-like UI:
- A text input + submit button
- On submit: calls `a2aService.sendMessage(prompt)` → `processor.processMessages(response)` → surface renders below the input
- Each new prompt replaces the current surface
- The native Spartan comparison column is removed — no longer needed with a live agent

The fixture JSON files remain in `fixtures/` as reference but are no longer used at runtime.

---

## 7. Dev Setup

### Prerequisites

- Node.js + npm (for Nx and Angular)
- Python 3.11+ (for the agent)
- `GEMINI_API_KEY` environment variable

### Steps

```bash
# 1. Build the adapter library (re-run when catalog or components change)
npx nx build spartan-a2ui-adapter

# 2. Start the Angular client
npx nx serve mock

# 3. In a separate terminal, start the agent
cd agents/mock
python -m spartan_mock_agent
```

### `agents/mock/.env.example`

```
GEMINI_API_KEY=your_key_here
LITELLM_MODEL=gemini/gemini-2.5-flash   # optional override
```

### CORS

The agent's Starlette server allows `http://localhost:4200` (Angular dev server default).

---

## 8. Component Scope

**Initial implementation:** `HlmButton` + `HlmBadge`

Adding more Spartan components in the future only requires:
1. New wrapper component in `libs/spartan-a2ui-adapter/src/lib/components/`
2. Updated `catalog.json` with the new component schema
3. Run `nx build spartan-a2ui-adapter`

No agent changes needed.

---

## 9. Scaling to More Agent/Client Pairs

The naming convention `agents/<name>/` + `apps/<name>/` is the pattern for all future samples:

```
agents/restaurant/  ↔  apps/restaurant/
agents/mock/        ↔  apps/mock/
```

Each pair has its own system prompt, examples, and tools tuned to its domain. The `libs/spartan-a2ui-adapter/` library and its catalog are shared across all pairs.

---

## 10. Alternatives Considered

- **Claude API directly (no ADK):** Rejected — requires reimplementing A2A server and `SendA2uiToClientToolset` logic. ADK gives this for free and matches the canonical A2UI community pattern.
- **Agent prompt scoped to Spartan UI:** Rejected — narrows the architectural story. Framework-agnostic prompt + catalog injection is the right separation of concerns.
- **`catalogs/` at repo root:** Rejected — catalog belongs inside the library so it ships with the npm package.
- **New `apps/demo/` app:** Rejected — updating `apps/mock/` is simpler and keeps fixture reference intact.
