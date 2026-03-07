# Mock Agentic Backend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Google ADK Python agent that registers the Spartan A2UI catalog and generates A2UI responses from natural language prompts, paired with an updated `apps/mock/` Angular client that sends prompts via A2A and renders live agent responses.

**Architecture:** Python ADK agent in `agents/mock/` reads `catalog.json` from the adapter lib's dist output (simulating npm package consumption), injects it into every Gemini LLM request via `SendA2uiToClientToolset`, and serves an A2A-compliant HTTP endpoint. The Angular mock app replaces its hardcoded fixture with a minimal chat UI that POSTs prompts to the agent and feeds the streamed A2UI response to `MessageProcessor`.

**Tech Stack:** Google ADK, LiteLLM (Gemini 2.5 Flash), `a2ui-agent` (local Python SDK), `a2a-sdk`, Angular 21, `@a2a-js/sdk ^0.3.4`, `@a2ui/angular`, Starlette/Uvicorn, uv

**Design doc:** `docs/plans/2026-03-07-mock-agentic-be-design.md`

---

## Phase 1: Relocate Catalog + Configure Build Assets

### Task 1: Move catalog.json into the library

**Files:**
- Create: `libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json`
- Delete: `catalogs/spartan/v0.8.0/catalog.json` (and empty parent dirs)

**Step 1: Create the new directory and move the file**

```bash
mkdir -p libs/spartan-a2ui-adapter/catalogs/v0.8.0
cp catalogs/spartan/v0.8.0/catalog.json libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json
```

**Step 2: Verify the file copied correctly**

```bash
python3 -c "import json; d=json.load(open('libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json')); print('catalogId:', d['catalogId']); print('components:', list(d['components'].keys()))"
```

Expected output includes `HlmButton` in components list.

**Step 3: Remove old location**

```bash
rm catalogs/spartan/v0.8.0/catalog.json
rmdir catalogs/spartan/v0.8.0 catalogs/spartan catalogs
```

**Step 4: Commit**

```bash
git add libs/spartan-a2ui-adapter/catalogs/
git add -u catalogs/
git commit -m "refactor: move catalog.json into lib for npm distribution"
```

---

### Task 2: Configure ng-packagr to include catalog in dist

**Files:**
- Modify: `libs/spartan-a2ui-adapter/ng-package.json`

**Step 1: Read current ng-package.json**

File currently at `libs/spartan-a2ui-adapter/ng-package.json`:
```json
{
  "$schema": "../../node_modules/ng-packagr/ng-package.schema.json",
  "dest": "../../dist/libs/spartan-a2ui-adapter",
  "lib": {
    "entryFile": "src/index.ts"
  }
}
```

**Step 2: Add assets field**

Update to:
```json
{
  "$schema": "../../node_modules/ng-packagr/ng-package.schema.json",
  "dest": "../../dist/libs/spartan-a2ui-adapter",
  "assets": ["catalogs/**"],
  "lib": {
    "entryFile": "src/index.ts"
  }
}
```

**Step 3: Build and verify catalog appears in dist**

```bash
npx nx build spartan-a2ui-adapter
ls dist/libs/spartan-a2ui-adapter/catalogs/v0.8.0/
```

Expected: `catalog.json` present in dist output.

**Step 4: Commit**

```bash
git add libs/spartan-a2ui-adapter/ng-package.json
git commit -m "feat: include catalogs/ as ng-packagr asset for npm distribution"
```

---

## Phase 2: HlmBadge Adapter

### Task 3: Generate the Spartan badge component

**Step 1: Generate via Spartan CLI**

```bash
npx nx g @spartan-ng/cli:ui badge
```

When prompted for the directory, accept the default (`libs/ui/badge`).

**Step 2: Verify generated files**

```bash
ls libs/ui/badge/
```

Expected: a `hlm-badge.directive.ts` (or similar). Note the exact exported symbol name — you will need it in Task 4.

```bash
cat libs/ui/badge/hlm-badge.directive.ts
```

Check the export names. Typically: `HlmBadgeDirective` and `HlmBadgeVariants`. Note them.

**Step 3: Commit**

```bash
git add libs/ui/badge/
git commit -m "feat: generate Spartan badge helm component"
```

---

### Task 4: Create HlmBadgeWrapperComponent

**Files:**
- Create: `libs/spartan-a2ui-adapter/src/lib/components/hlm-badge/hlm-badge-wrapper.component.ts`

**Step 1: Create the directory and file**

```typescript
// libs/spartan-a2ui-adapter/src/lib/components/hlm-badge/hlm-badge-wrapper.component.ts
import { Component, input } from '@angular/core';
import { DynamicComponent, Renderer } from '@a2ui/angular';
import * as Types from '@a2ui/web_core/types/types';
import { HlmBadgeDirective } from '@spartan-ng/ui-badge-helm';  // adjust import path if CLI output differs

@Component({
  selector: 'a2ui-hlm-badge',
  imports: [HlmBadgeDirective, Renderer],
  template: `
    <span hlmBadge [variant]="$any(variant())">
      <ng-container
        a2ui-renderer
        [surfaceId]="surfaceId()!"
        [component]="$any(component().properties['child'])"
      />
    </span>
  `,
  styles: [
    `
      :host {
        display: block;
        flex: var(--weight);
        min-height: 0;
      }
    `,
  ],
})
export class HlmBadgeWrapperComponent extends DynamicComponent<Types.CustomNode> {
  readonly variant = input<string>('default');
}
```

> **Note:** The import path for `HlmBadgeDirective` depends on what the CLI generated. Check `libs/ui/badge/` for the exact path alias. It's likely `@spartan-ng/ui-badge-helm` or a local path. Run `cat tsconfig.base.json | grep badge` to confirm the alias.

**Step 2: Commit**

```bash
git add libs/spartan-a2ui-adapter/src/lib/components/hlm-badge/
git commit -m "feat: add HlmBadgeWrapperComponent"
```

---

### Task 5: Add HlmBadge to the TypeScript catalog

**Files:**
- Modify: `libs/spartan-a2ui-adapter/src/lib/catalog.ts`

**Step 1: Update catalog.ts**

```typescript
import { Catalog, DEFAULT_CATALOG } from '@a2ui/angular';
import { inputBinding } from '@angular/core';

export const SPARTAN_CATALOG = {
  ...DEFAULT_CATALOG,
  HlmButton: {
    type: () =>
      import('./components/hlm-button/hlm-button-wrapper.component').then(
        (r) => r.HlmButtonWrapperComponent,
      ),
    bindings: ({ properties }) => [
      inputBinding('variant', () => ('variant' in properties && properties['variant']) || 'default'),
      inputBinding('size', () => ('size' in properties && properties['size']) || 'default'),
    ],
  },
  HlmBadge: {
    type: () =>
      import('./components/hlm-badge/hlm-badge-wrapper.component').then(
        (r) => r.HlmBadgeWrapperComponent,
      ),
    bindings: ({ properties }) => [
      inputBinding('variant', () => ('variant' in properties && properties['variant']) || 'default'),
    ],
  },
} as Catalog;
```

**Step 2: Commit**

```bash
git add libs/spartan-a2ui-adapter/src/lib/catalog.ts
git commit -m "feat: add HlmBadge to SPARTAN_CATALOG"
```

---

### Task 6: Add HlmBadge to catalog.json

**Files:**
- Modify: `libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json`

**Step 1: Add HlmBadge entry to the `components` object**

Add the following entry alongside `HlmButton` in the `components` object:

```json
"HlmBadge": {
  "type": "object",
  "description": "A styled badge label using Spartan UI. Used to display a status, count, or category.",
  "additionalProperties": false,
  "properties": {
    "variant": {
      "type": "string",
      "enum": ["default", "secondary", "destructive", "outline"],
      "description": "Visual style of the badge."
    },
    "child": {
      "type": "string",
      "description": "The ID of the component to display inside the badge, typically a Text component."
    }
  },
  "required": ["child"]
}
```

**Step 2: Validate JSON is well-formed**

```bash
python3 -c "import json; d=json.load(open('libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json')); print('Components:', list(d['components'].keys()))"
```

Expected: `HlmBadge` in components list.

**Step 3: Commit**

```bash
git add libs/spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json
git commit -m "feat: add HlmBadge to Spartan catalog JSON schema"
```

---

### Task 7: Export HlmBadgeWrapperComponent from barrel + rebuild

**Files:**
- Modify: `libs/spartan-a2ui-adapter/src/index.ts`

**Step 1: Add HlmBadge export**

```typescript
export { SPARTAN_CATALOG } from './lib/catalog';
export { SPARTAN_CATALOG_ID } from './lib/catalog-id';
export { HlmButtonWrapperComponent } from './lib/components/hlm-button/hlm-button-wrapper.component';
export { HlmBadgeWrapperComponent } from './lib/components/hlm-badge/hlm-badge-wrapper.component';
```

**Step 2: Build the library**

```bash
npx nx build spartan-a2ui-adapter
```

Expected: zero errors. Verify:

```bash
ls dist/libs/spartan-a2ui-adapter/catalogs/v0.8.0/
```

Expected: `catalog.json` present.

**Step 3: Commit**

```bash
git add libs/spartan-a2ui-adapter/src/index.ts
git commit -m "feat: export HlmBadgeWrapperComponent from library barrel"
```

---

## Phase 3: Python Agent Scaffold

### Task 8: Create agent folder structure and project config

**Files:**
- Create: `agents/mock/spartan_mock_agent/__init__.py`
- Create: `agents/mock/pyproject.toml`
- Create: `agents/mock/.env.example`

**Step 1: Create directories**

```bash
mkdir -p agents/mock/spartan_mock_agent
mkdir -p agents/mock/examples/spartan_catalog
touch agents/mock/spartan_mock_agent/__init__.py
```

**Step 2: Create `pyproject.toml`**

```toml
# agents/mock/pyproject.toml
[project]
name = "spartan-mock-agent"
version = "0.1.0"
description = "Sample Google ADK agent for the spartan-a2ui-adapter. Renders Spartan UI components from natural language prompts via A2A."
readme = "README.md"
requires-python = ">=3.13"
dependencies = [
    "a2a-sdk>=0.3.0",
    "click>=8.1.8",
    "google-adk>=1.8.0",
    "google-genai>=1.27.0",
    "python-dotenv>=1.1.0",
    "litellm",
    "jsonschema>=4.0.0",
    "a2ui-agent",
]

[tool.hatch.build.targets.wheel]
packages = ["."]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.metadata]
allow-direct-references = true

[[tool.uv.index]]
url = "https://pypi.org/simple"
default = true

[tool.uv.sources]
a2ui-agent = { path = "../../../../A2UI/agent_sdks/python", editable = true }
```

> **Note:** `a2ui-agent` path is relative to `agents/mock/`. Verify the relative path to `A2UI/agent_sdks/python` from `agents/mock/` matches your local directory structure: `../../../../A2UI/agent_sdks/python` → `spartan-a2ui-adapter/../../A2UI/agent_sdks/python` → assumes `A2UI/` and `spartan-a2ui-adapter/` are siblings under `future-of-sw/`.

**Step 3: Create `.env.example`**

```
# agents/mock/.env.example
GEMINI_API_KEY=your_gemini_api_key_here
LITELLM_MODEL=gemini/gemini-2.5-flash
```

**Step 4: Install dependencies**

```bash
cd agents/mock
uv sync
```

**Step 5: Commit**

```bash
cd ../..
git add agents/mock/spartan_mock_agent/__init__.py agents/mock/pyproject.toml agents/mock/.env.example
git commit -m "feat: scaffold agents/mock Python project"
```

---

### Task 9: Implement agent_executor.py

**Files:**
- Create: `agents/mock/spartan_mock_agent/agent_executor.py`

This is a direct port of the rizzcharts executor — rename the class only.

```python
# agents/mock/spartan_mock_agent/agent_executor.py
import logging
from typing import override

from a2a.server.agent_execution import RequestContext
from a2ui.a2a import try_activate_a2ui_extension
from a2ui.adk.a2a_extension.send_a2ui_to_client_toolset import A2uiEventConverter
from a2ui.core.schema.constants import A2UI_CLIENT_CAPABILITIES_KEY
from a2ui.core.schema.manager import A2uiSchemaManager
from google.adk.a2a.converters.request_converter import AgentRunRequest
from google.adk.a2a.executor.a2a_agent_executor import A2aAgentExecutor, A2aAgentExecutorConfig
from google.adk.agents.invocation_context import new_invocation_context_id
from google.adk.agents.readonly_context import ReadonlyContext
from google.adk.events.event import Event
from google.adk.events.event_actions import EventActions
from google.adk.runners import Runner

logger = logging.getLogger(__name__)

_A2UI_ENABLED_KEY = "system:a2ui_enabled"
_A2UI_CATALOG_KEY = "system:a2ui_catalog"
_A2UI_EXAMPLES_KEY = "system:a2ui_examples"


def get_a2ui_catalog(ctx: ReadonlyContext):
    return ctx.state.get(_A2UI_CATALOG_KEY)


def get_a2ui_examples(ctx: ReadonlyContext):
    return ctx.state.get(_A2UI_EXAMPLES_KEY)


def get_a2ui_enabled(ctx: ReadonlyContext):
    return ctx.state.get(_A2UI_ENABLED_KEY, False)


class SpartanMockAgentExecutor(A2aAgentExecutor):
    """Executor for the Spartan mock agent. Handles A2UI session setup."""

    def __init__(self, base_url: str, runner: Runner, schema_manager: A2uiSchemaManager):
        self._base_url = base_url
        self.schema_manager = schema_manager
        config = A2aAgentExecutorConfig(event_converter=A2uiEventConverter())
        super().__init__(runner=runner, config=config)

    @override
    async def _prepare_session(
        self,
        context: RequestContext,
        run_request: AgentRunRequest,
        runner: Runner,
    ):
        session = await super()._prepare_session(context, run_request, runner)

        if "base_url" not in session.state:
            session.state["base_url"] = self._base_url

        use_ui = try_activate_a2ui_extension(context)
        if use_ui:
            capabilities = (
                context.message.metadata.get(A2UI_CLIENT_CAPABILITIES_KEY)
                if context.message and context.message.metadata
                else None
            )
            a2ui_catalog = self.schema_manager.get_selected_catalog(
                client_ui_capabilities=capabilities
            )
            examples = self.schema_manager.load_examples(a2ui_catalog, validate=True)

            await runner.session_service.append_event(
                session,
                Event(
                    invocation_id=new_invocation_context_id(),
                    author="system",
                    actions=EventActions(
                        state_delta={
                            _A2UI_ENABLED_KEY: True,
                            _A2UI_CATALOG_KEY: a2ui_catalog,
                            _A2UI_EXAMPLES_KEY: examples,
                        }
                    ),
                ),
            )

        return session
```

**Step 1: Commit**

```bash
git add agents/mock/spartan_mock_agent/agent_executor.py
git commit -m "feat: implement SpartanMockAgentExecutor"
```

---

### Task 10: Implement agent.py

**Files:**
- Create: `agents/mock/spartan_mock_agent/agent.py`

```python
# agents/mock/spartan_mock_agent/agent.py
import logging
from typing import Any, ClassVar

from a2a.types import AgentCapabilities, AgentCard, AgentSkill
from a2ui.a2a import get_a2ui_agent_extension
from a2ui.adk.a2a_extension.send_a2ui_to_client_toolset import (
    SendA2uiToClientToolset,
    A2uiEnabledProvider,
    A2uiCatalogProvider,
    A2uiExamplesProvider,
)
from a2ui.core.schema.manager import A2uiSchemaManager
from google.adk.agents.llm_agent import LlmAgent
from google.adk.agents.readonly_context import ReadonlyContext
from pydantic import PrivateAttr

logger = logging.getLogger(__name__)

ROLE_DESCRIPTION = """
You are a UI composer. Translate user requests into A2UI JSON payloads using the registered component catalog. You MUST use the `send_a2ui_json_to_client` tool with the `a2ui_json` argument set to the A2UI JSON payload to send to the client.
"""

WORKFLOW_DESCRIPTION = """
1. Parse the user's request and identify what UI elements are needed.
2. Select appropriate components from the catalog schema you have been provided.
3. For multi-component layouts, use Column (for vertical stacking) or Row (for horizontal layout).
4. Assign a unique string ID to every component in the payload.
5. Call the `send_a2ui_json_to_client` tool with the fully constructed A2UI JSON payload.

If the tool returns an error, apologize and ask the user to try again.
"""

UI_DESCRIPTION = """
Layout rules:
- Column: stacks children vertically. Use for "vertical alignment" or default multi-component layouts.
- Row: places children side by side. Use when the user asks for "horizontal" or "side by side" layouts.
- Every component needs a unique `id`. Text components provide label content and are referenced by ID in the `child` property of other components.
- Generate a unique `surfaceId` for each request (e.g., `button_surface`, `badge_surface`, `button_badge_surface`).
"""


class SpartanMockAgent(LlmAgent):
    """A UI composer agent backed by the Spartan A2UI catalog."""

    SUPPORTED_CONTENT_TYPES: ClassVar[list[str]] = ["text", "text/plain"]
    base_url: str = ""
    schema_manager: A2uiSchemaManager = None
    _a2ui_enabled_provider: A2uiEnabledProvider = PrivateAttr()
    _a2ui_catalog_provider: A2uiCatalogProvider = PrivateAttr()
    _a2ui_examples_provider: A2uiExamplesProvider = PrivateAttr()

    def __init__(
        self,
        model: Any,
        base_url: str,
        schema_manager: A2uiSchemaManager,
        a2ui_enabled_provider: A2uiEnabledProvider,
        a2ui_catalog_provider: A2uiCatalogProvider,
        a2ui_examples_provider: A2uiExamplesProvider,
    ):
        system_instructions = schema_manager.generate_system_prompt(
            role_description=ROLE_DESCRIPTION,
            workflow_description=WORKFLOW_DESCRIPTION,
            ui_description=UI_DESCRIPTION,
            include_schema=False,
            include_examples=False,
            validate_examples=False,
        )
        super().__init__(
            model=model,
            name="spartan_mock_agent",
            description="A UI composer agent that renders Spartan UI components from natural language prompts.",
            instruction=system_instructions,
            tools=[
                SendA2uiToClientToolset(
                    a2ui_catalog=a2ui_catalog_provider,
                    a2ui_enabled=a2ui_enabled_provider,
                    a2ui_examples=a2ui_examples_provider,
                ),
            ],
            disallow_transfer_to_peers=True,
            base_url=base_url,
            schema_manager=schema_manager,
        )
        self._a2ui_enabled_provider = a2ui_enabled_provider
        self._a2ui_catalog_provider = a2ui_catalog_provider
        self._a2ui_examples_provider = a2ui_examples_provider

    def get_agent_card(self) -> AgentCard:
        return AgentCard(
            name="Spartan UI Composer",
            description="Renders Spartan UI components from natural language prompts using the A2UI protocol.",
            url=self.base_url,
            version="1.0.0",
            default_input_modes=SpartanMockAgent.SUPPORTED_CONTENT_TYPES,
            default_output_modes=SpartanMockAgent.SUPPORTED_CONTENT_TYPES,
            capabilities=AgentCapabilities(
                streaming=True,
                extensions=[
                    get_a2ui_agent_extension(
                        self.schema_manager.accepts_inline_catalogs,
                        self.schema_manager.supported_catalog_ids,
                    )
                ],
            ),
            skills=[
                AgentSkill(
                    id="render_ui",
                    name="Render UI Components",
                    description="Renders Spartan UI components from a natural language description.",
                    tags=["ui", "components", "spartan", "a2ui"],
                    examples=[
                        "show me a button",
                        "show me a badge",
                        "show me a button and badge in vertical alignment",
                    ],
                ),
            ],
        )
```

**Step 1: Commit**

```bash
git add agents/mock/spartan_mock_agent/agent.py
git commit -m "feat: implement SpartanMockAgent"
```

---

### Task 11: Implement __main__.py (server entrypoint)

**Files:**
- Create: `agents/mock/spartan_mock_agent/__main__.py`

```python
# agents/mock/spartan_mock_agent/__main__.py
import logging
import os
import traceback
from pathlib import Path

import click
import uvicorn
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2ui.core.schema.constants import VERSION_0_8
from a2ui.core.schema.manager import A2uiSchemaManager, CatalogConfig
from dotenv import load_dotenv
from google.adk.artifacts import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from starlette.middleware.cors import CORSMiddleware

try:
    from .agent import SpartanMockAgent
    from .agent_executor import SpartanMockAgentExecutor, get_a2ui_enabled, get_a2ui_catalog, get_a2ui_examples
except ImportError:
    from agent import SpartanMockAgent
    from agent_executor import SpartanMockAgentExecutor, get_a2ui_enabled, get_a2ui_catalog, get_a2ui_examples

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path to catalog.json in the built adapter library dist output.
# Simulates reading from node_modules/@spartan-a2ui-adapter/catalogs/v0.8.0/catalog.json
CATALOG_PATH = (
    Path(__file__).parent.parent.parent.parent
    / "dist"
    / "libs"
    / "spartan-a2ui-adapter"
    / "catalogs"
    / "v0.8.0"
    / "catalog.json"
)

EXAMPLES_PATH = Path(__file__).parent.parent / "examples" / "spartan_catalog"


class MissingAPIKeyError(Exception):
    pass


@click.command()
@click.option("--host", default="localhost")
@click.option("--port", default=10002)
def main(host, port):
    try:
        if not os.getenv("GOOGLE_GENAI_USE_VERTEXAI") == "TRUE":
            if not os.getenv("GEMINI_API_KEY"):
                raise MissingAPIKeyError(
                    "GEMINI_API_KEY environment variable not set."
                )

        if not CATALOG_PATH.exists():
            raise FileNotFoundError(
                f"Catalog not found at {CATALOG_PATH}. "
                "Run 'npx nx build spartan-a2ui-adapter' first."
            )

        lite_llm_model = os.getenv("LITELLM_MODEL", "gemini/gemini-2.5-flash")
        base_url = f"http://{host}:{port}"

        schema_manager = A2uiSchemaManager(
            VERSION_0_8,
            catalogs=[
                CatalogConfig.from_path(
                    name="spartan",
                    catalog_path=str(CATALOG_PATH),
                    examples_path=str(EXAMPLES_PATH),
                ),
            ],
            accepts_inline_catalogs=True,
        )

        agent = SpartanMockAgent(
            base_url=base_url,
            model=LiteLlm(model=lite_llm_model),
            schema_manager=schema_manager,
            a2ui_enabled_provider=get_a2ui_enabled,
            a2ui_catalog_provider=get_a2ui_catalog,
            a2ui_examples_provider=get_a2ui_examples,
        )

        runner = Runner(
            app_name=agent.name,
            agent=agent,
            artifact_service=InMemoryArtifactService(),
            session_service=InMemorySessionService(),
            memory_service=InMemoryMemoryService(),
        )

        agent_executor = SpartanMockAgentExecutor(
            base_url=base_url,
            runner=runner,
            schema_manager=schema_manager,
        )

        request_handler = DefaultRequestHandler(
            agent_executor=agent_executor,
            task_store=InMemoryTaskStore(),
        )

        server = A2AStarletteApplication(
            agent_card=agent.get_agent_card(),
            http_handler=request_handler,
        )

        app = server.build()
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:4200"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        logger.info(f"Starting Spartan mock agent at {base_url}")
        uvicorn.run(app, host=host, port=port)

    except (MissingAPIKeyError, FileNotFoundError) as e:
        logger.error(f"Startup error: {e}")
        exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}\n{traceback.format_exc()}")
        exit(1)


if __name__ == "__main__":
    main()
```

**Step 1: Commit**

```bash
git add agents/mock/spartan_mock_agent/__main__.py
git commit -m "feat: implement agent server entrypoint"
```

---

## Phase 4: Example Payloads

### Task 12: Write button.json example

**Files:**
- Create: `agents/mock/examples/spartan_catalog/button.json`

```json
[
  {
    "surfaceUpdate": {
      "surfaceId": "button_surface",
      "components": [
        {
          "id": "root",
          "component": {
            "Column": {
              "children": {
                "explicitList": ["btn_submit"]
              }
            }
          }
        },
        {
          "id": "btn_submit",
          "component": {
            "HlmButton": {
              "variant": "default",
              "child": "btn_submit_text",
              "action": { "name": "btn_submit_clicked" }
            }
          }
        },
        {
          "id": "btn_submit_text",
          "component": {
            "Text": {
              "text": { "literalString": "Submit" },
              "usageHint": "body"
            }
          }
        }
      ]
    }
  },
  {
    "beginRendering": {
      "surfaceId": "button_surface",
      "root": "root"
    }
  }
]
```

**Step 1: Commit**

```bash
git add agents/mock/examples/spartan_catalog/button.json
git commit -m "feat: add button.json few-shot example"
```

---

### Task 13: Write badge.json example

**Files:**
- Create: `agents/mock/examples/spartan_catalog/badge.json`

```json
[
  {
    "surfaceUpdate": {
      "surfaceId": "badge_surface",
      "components": [
        {
          "id": "root",
          "component": {
            "Column": {
              "children": {
                "explicitList": ["badge_new"]
              }
            }
          }
        },
        {
          "id": "badge_new",
          "component": {
            "HlmBadge": {
              "variant": "default",
              "child": "badge_new_text"
            }
          }
        },
        {
          "id": "badge_new_text",
          "component": {
            "Text": {
              "text": { "literalString": "New" },
              "usageHint": "body"
            }
          }
        }
      ]
    }
  },
  {
    "beginRendering": {
      "surfaceId": "badge_surface",
      "root": "root"
    }
  }
]
```

**Step 1: Commit**

```bash
git add agents/mock/examples/spartan_catalog/badge.json
git commit -m "feat: add badge.json few-shot example"
```

---

### Task 14: Write button_and_badge.json example

**Files:**
- Create: `agents/mock/examples/spartan_catalog/button_and_badge.json`

```json
[
  {
    "surfaceUpdate": {
      "surfaceId": "button_badge_surface",
      "components": [
        {
          "id": "root",
          "component": {
            "Column": {
              "children": {
                "explicitList": ["btn_confirm", "badge_status"]
              }
            }
          }
        },
        {
          "id": "btn_confirm",
          "component": {
            "HlmButton": {
              "variant": "default",
              "child": "btn_confirm_text",
              "action": { "name": "btn_confirm_clicked" }
            }
          }
        },
        {
          "id": "btn_confirm_text",
          "component": {
            "Text": {
              "text": { "literalString": "Confirm" },
              "usageHint": "body"
            }
          }
        },
        {
          "id": "badge_status",
          "component": {
            "HlmBadge": {
              "variant": "secondary",
              "child": "badge_status_text"
            }
          }
        },
        {
          "id": "badge_status_text",
          "component": {
            "Text": {
              "text": { "literalString": "Pending" },
              "usageHint": "body"
            }
          }
        }
      ]
    }
  },
  {
    "beginRendering": {
      "surfaceId": "button_badge_surface",
      "root": "root"
    }
  }
]
```

**Step 1: Commit**

```bash
git add agents/mock/examples/spartan_catalog/button_and_badge.json
git commit -m "feat: add button_and_badge.json few-shot example"
```

---

## Phase 5: Mock App — A2A Client Wiring

### Task 15: Install @a2a-js/sdk

**Step 1: Install the A2A TypeScript SDK**

```bash
npm install @a2a-js/sdk
```

**Step 2: Verify install**

```bash
cat node_modules/@a2a-js/sdk/package.json | python3 -c "import json,sys; d=json.load(sys.stdin); print('version:', d['version'])"
```

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @a2a-js/sdk for A2A client"
```

---

### Task 16: Implement A2aService

**Files:**
- Create: `apps/mock/src/app/a2a.service.ts`

```typescript
// apps/mock/src/app/a2a.service.ts
import { Injectable } from '@angular/core';
import { SendMessageSuccessResponse, Part, Artifact, Task, Message } from '@a2a-js/sdk';
import * as Types from '@a2ui/web_core/types/types';
import { SPARTAN_CATALOG_ID } from '@spartan-a2ui-adapter';

const AGENT_URL = 'http://localhost:10002';

@Injectable({ providedIn: 'root' })
export class A2aService {
  private contextId: string | undefined;

  async sendMessage(text: string): Promise<Types.ServerToClientMessage[]> {
    const response = await fetch(AGENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'message/send',
        id: crypto.randomUUID(),
        params: {
          message: {
            messageId: crypto.randomUUID(),
            role: 'user',
            parts: [{ kind: 'text', text }],
            metadata: {
              a2uiClientCapabilities: {
                supportedCatalogIds: [SPARTAN_CATALOG_ID],
              },
            },
            ...(this.contextId ? { contextId: this.contextId } : {}),
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Agent request failed: ${response.status}`);
    }

    const json = (await response.json()) as SendMessageSuccessResponse & { context_id?: string };

    if (json.context_id) {
      this.contextId = json.context_id;
    }

    const parts = this.extractParts(json);
    return this.extractA2uiMessages(parts);
  }

  private extractParts(response: SendMessageSuccessResponse): Part[] {
    if (response.result.kind === 'task') {
      const task = response.result as Task;
      return [
        ...(task.status.message?.parts ?? []),
        ...(task.artifacts ?? []).flatMap((artifact: Artifact) => artifact.parts),
      ];
    }
    return (response.result as Message).parts;
  }

  private extractA2uiMessages(parts: Part[]): Types.ServerToClientMessage[] {
    return parts.reduce<Types.ServerToClientMessage[]>((messages, part) => {
      if (part.kind === 'data' && part.data && typeof part.data === 'object') {
        if ('beginRendering' in part.data) {
          messages.push({ beginRendering: part.data['beginRendering'] as Types.BeginRenderingMessage });
        } else if ('surfaceUpdate' in part.data) {
          messages.push({ surfaceUpdate: part.data['surfaceUpdate'] as Types.SurfaceUpdateMessage });
        } else if ('dataModelUpdate' in part.data) {
          messages.push({ dataModelUpdate: part.data['dataModelUpdate'] as Types.DataModelUpdate });
        }
      }
      return messages;
    }, []);
  }
}
```

**Step 1: Commit**

```bash
git add apps/mock/src/app/a2a.service.ts
git commit -m "feat: implement A2aService for A2A agent communication"
```

---

### Task 17: Update app.ts and app.html

**Files:**
- Modify: `apps/mock/src/app/app.ts`
- Modify: `apps/mock/src/app/app.html`

**Step 1: Update app.ts**

Replace the entire file:

```typescript
// apps/mock/src/app/app.ts
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageProcessor, Surface } from '@a2ui/angular';
import { HlmButtonImports } from '@spartan-ng/ui-button-helm';
import * as Types from '@a2ui/web_core/types/types';
import { A2aService } from './a2a.service';

@Component({
  selector: 'app-root',
  imports: [Surface, HlmButtonImports, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly processor = inject(MessageProcessor);
  private readonly a2aService = inject(A2aService);

  protected readonly prompt = signal('');
  protected readonly surface = signal<Types.Surface | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  async send() {
    const text = this.prompt().trim();
    if (!text || this.loading()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const messages = await this.a2aService.sendMessage(text);
      this.processor.processMessages(messages);

      const surfaces = this.processor.getSurfaces();
      const latestSurface = [...surfaces.values()].at(-1) ?? null;
      this.surface.set(latestSurface);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      this.loading.set(false);
    }
  }
}
```

> **Note on HlmButton import:** If `@spartan-ng/ui-button-helm` is not the correct path alias for the locally generated button, check `tsconfig.base.json` for the alias (e.g. `@spartan-ng/helm/button`) and adjust accordingly.

**Step 2: Update app.html**

Replace the entire file:

```html
<div class="flex flex-col gap-4 p-8 min-h-screen bg-background">
  <h1 class="text-2xl font-bold">Spartan A2UI Demo</h1>

  <div class="flex gap-2">
    <input
      class="flex-1 border rounded px-3 py-2 text-sm bg-background"
      placeholder='Try "show me a button" or "show me a button and badge"'
      [(ngModel)]="prompt"
      (keydown.enter)="send()"
    />
    <button hlmBtn [disabled]="loading()" (click)="send()">
      {{ loading() ? 'Thinking...' : 'Send' }}
    </button>
  </div>

  @if (error()) {
    <p class="text-destructive text-sm">{{ error() }}</p>
  }

  @if (surface()) {
    <div class="border rounded p-4">
      <a2ui-surface [surface]="surface()" />
    </div>
  }
</div>
```

**Step 3: Commit**

```bash
git add apps/mock/src/app/app.ts apps/mock/src/app/app.html
git commit -m "feat: update mock app with A2A chat UI"
```

---

## Phase 6: End-to-End Verification

### Task 18: Build and verify the full flow

**Step 1: Rebuild the library**

```bash
npx nx build spartan-a2ui-adapter
```

Verify catalog is in dist:

```bash
ls dist/libs/spartan-a2ui-adapter/catalogs/v0.8.0/
```

Expected: `catalog.json`

**Step 2: Install Python dependencies**

```bash
cd agents/mock
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
uv sync
```

**Step 3: Start the agent**

```bash
cd agents/mock
uv run python -m spartan_mock_agent
```

Expected log output:
```
INFO:__main__:Starting Spartan mock agent at http://localhost:10002
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://localhost:10002
```

**Step 4: Smoke test the agent with curl**

```bash
curl -s -X POST http://localhost:10002 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "message/send",
    "id": "test-1",
    "params": {
      "message": {
        "messageId": "msg-1",
        "role": "user",
        "parts": [{"kind": "text", "text": "show me a button"}],
        "metadata": {
          "a2uiClientCapabilities": {
            "supportedCatalogIds": ["https://github.com/retz8/spartan-a2ui-adapter/blob/main/catalogs/spartan/v0.8.0/catalog.json"]
          }
        }
      }
    }
  }' | python3 -m json.tool
```

Expected: JSON response with `result` containing artifacts with A2UI DataParts (`surfaceUpdate`, `beginRendering`).

**Step 5: Start the Angular mock app**

In a separate terminal:

```bash
npx nx serve mock
```

Open browser at `http://localhost:4200`.

**Step 6: Test the three target prompts**

1. Type `show me a button` → submit. Expected: Spartan-styled button renders below the input.
2. Type `show me a badge` → submit. Expected: Spartan-styled badge renders.
3. Type `show me a button and badge in vertical alignment` → submit. Expected: Column layout with button above badge.

**Step 7: Final commit**

```bash
git add .
git commit -m "feat: complete mock agentic backend with A2A-connected Angular client"
```

---

## Notes

- **Import path for Spartan badge:** After running `npx nx g @spartan-ng/cli:ui badge`, check `tsconfig.base.json` for the generated path alias. Update the import in `hlm-badge-wrapper.component.ts` accordingly.
- **Port conflicts:** Agent defaults to `10002`. If in use, pass `--port 10003` and update `AGENT_URL` in `a2a.service.ts`.
- **CATALOG_PATH verification:** The path resolution in `__main__.py` assumes `agents/mock/` is inside `spartan-a2ui-adapter/` which is at the same level as `A2UI/`. Verify `CATALOG_PATH.exists()` logs before startup if the agent fails to start.
- **Re-run build after component changes:** Any time `libs/spartan-a2ui-adapter/` changes, re-run `npx nx build spartan-a2ui-adapter` before restarting the agent.
