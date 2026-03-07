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
