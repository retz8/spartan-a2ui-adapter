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
