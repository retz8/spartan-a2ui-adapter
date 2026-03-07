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
