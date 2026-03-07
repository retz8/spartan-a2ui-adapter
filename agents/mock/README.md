# spartan-mock-agent

Sample Google ADK agent for `spartan-a2ui-adapter`. Renders Spartan UI components from natural language prompts via A2A.

## Setup

```bash
cp .env.example .env
# Edit .env and set GEMINI_API_KEY

uv sync
```

## Run

```bash
# Build the adapter library first (provides catalog.json)
npx nx build spartan-a2ui-adapter

# Start the agent
uv run python -m spartan_mock_agent
```

The agent starts at `http://localhost:10002`.

## Usage

Pair with `apps/mock/` Angular client (`npx nx serve mock`) and type prompts like:

- `show me a button`
- `show me a badge`
- `show me a button and badge in vertical alignment`
