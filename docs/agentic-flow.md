# A2UI Agentic Flow

How a full agentic backend integrates with the spartan-a2ui-adapter, from a user prompt to a rendered Spartan button, and from a button click back to the agent.

---

## Prerequisites

The agent is initialized with:
- `SPARTAN_CATALOG` registered via `SendA2uiToClientToolset` (the catalog JSON schema is injected into the LLM system prompt on every request)
- The client app has `provideA2UI({ catalog: SPARTAN_CATALOG, theme: minimalTheme })` configured
- The client subscribes to `processor.events` and forwards `A2UIClientEventMessage`s to the agent via A2A

---

## Flow 1: "Render a primary button" — Prompt to Rendered UI

### Step 1 — Catalog injected into LLM system prompt

On every LLM request, `SendA2uiToClientToolset.process_llm_request()` runs:

```python
# agent_sdks/python/src/a2ui/adk/a2a_extension/send_a2ui_to_client_toolset.py
instruction = a2ui_catalog.render_as_llm_instructions()
examples = await self._resolve_a2ui_examples(tool_context)
llm_request.append_instructions([instruction, examples])
```

This injects the full `catalogs/spartan/v0.8.0/catalog.json` into the system prompt — including the `HlmButton` schema with `variant`/`size` enums and `child`/`action` definitions. The LLM knows exactly what it can generate.

---

### Step 2 — Client sends prompt via A2A

```json
{ "message": { "parts": [{ "kind": "text", "text": "render a primary button" }] } }
```

---

### Step 3 — LLM calls `send_a2ui_json_to_client`

The LLM reasons: "user wants a button → use `HlmButton` with `variant: default`". It emits a function call:

```json
{
  "function_call": {
    "name": "send_a2ui_json_to_client",
    "args": {
      "a2ui_json": "[{\"surfaceUpdate\":{\"surfaceId\":\"primary_button_surface\",\"components\":[{\"id\":\"root\",\"component\":{\"Column\":{\"children\":{\"explicitList\":[\"btn_primary\"]}}}},{\"id\":\"btn_primary\",\"component\":{\"HlmButton\":{\"variant\":\"default\",\"child\":\"btn_primary_text\",\"action\":{\"name\":\"btn_primary_clicked\"}}}},{\"id\":\"btn_primary_text\",\"component\":{\"Text\":{\"text\":{\"literalString\":\"Submit\"},\"usageHint\":\"body\"}}}]}},{\"beginRendering\":{\"surfaceId\":\"primary_button_surface\",\"root\":\"root\"}}]"
    }
  }
}
```

---

### Step 4 — Tool validates the JSON

```python
# send_a2ui_to_client_toolset.py:run_async()
a2ui_json_payload = parse_and_fix(a2ui_json)        # string → list
a2ui_catalog.validator.validate(a2ui_json_payload)  # validated against catalog JSON schema
tool_context.actions.skip_summarization = True      # no second LLM inference
return { "validated_a2ui_json": a2ui_json_payload }
```

If validation fails (e.g. `"variant": "primary"` is not in the enum), the tool returns `{ "error": "..." }` and the agent is told to retry.

---

### Step 5 — `A2uiPartConverter` wraps each message as an A2A `DataPart`

```python
# send_a2ui_to_client_toolset.py:A2uiPartConverter.convert()
json_data = function_response.response.get("validated_a2ui_json")
return [create_a2ui_part(message) for message in json_data]
```

Each `ServerToClientMessage` becomes an A2A `DataPart` streamed back to the client: one for `surfaceUpdate`, one for `beginRendering`.

---

### Step 6 — Client feeds messages to `MessageProcessor`

```ts
// Hypothetical A2A stream handler in the app
const messages = await a2aClient.sendMessage("render a primary button");
processor.processMessages(messages as Types.ServerToClientMessage[]);
this.surface.set(processor.getSurfaces().get('primary_button_surface') ?? null);
```

Inside `processMessages()` (in `web_core/src/v0_8/data/model-processor.ts`):

1. **`handleSurfaceUpdate()`** — stores 3 components by ID in `surface.components`:
   - `"root"` → `{ Column: { children: { explicitList: ["btn_primary"] } } }`
   - `"btn_primary"` → `{ HlmButton: { variant: "default", child: "btn_primary_text", action: {...} } }`
   - `"btn_primary_text"` → `{ Text: { text: { literalString: "Submit" }, usageHint: "body" } }`

2. **`handleBeginRendering()`** — sets `rootComponentId = "root"`, calls `rebuildComponentTree()`

3. **`rebuildComponentTree()`** — calls `buildNodeRecursive("root")`:
   - Column resolves its `explicitList` → calls `buildNodeRecursive("btn_primary")`
   - HlmButton iterates its properties → hits `"child": "btn_primary_text"`
   - `resolvePropertyValue()` sees the string matches a component ID → calls `buildNodeRecursive("btn_primary_text")`
   - Returns the full `Text` node as `properties['child']` on the HlmButton node

**By the time Angular sees it, `properties['child']` is already a fully resolved `AnyComponentNode`, not a string.**

---

### Step 7 — Angular renderer looks up `"HlmButton"` in `SPARTAN_CATALOG`

`<a2ui-surface>` walks `surface.componentTree`. When it hits the `HlmButton` node:

```ts
// libs/spartan-a2ui-adapter/src/lib/catalog.ts
HlmButton: {
  type: () =>
    import('./components/hlm-button/hlm-button-wrapper.component')
      .then(r => r.HlmButtonWrapperComponent),
  bindings: ({ properties }) => [
    inputBinding('variant', () => ('variant' in properties && properties['variant']) || 'default'),
    inputBinding('size',    () => ('size'    in properties && properties['size'])    || 'default'),
  ],
}
```

The renderer lazy-loads `HlmButtonWrapperComponent` and applies `variant="default"` via `inputBinding`.

---

### Step 8 — `HlmButtonWrapperComponent` renders

```ts
// libs/spartan-a2ui-adapter/src/lib/components/hlm-button/hlm-button-wrapper.component.ts
@Component({
  template: `
    <button hlmBtn [variant]="$any(variant())" [size]="$any(size())" (click)="handleClick()">
      <ng-container
        a2ui-renderer
        [surfaceId]="surfaceId()!"
        [component]="$any(component().properties['child'])"
      />
    </button>
  `,
})
export class HlmButtonWrapperComponent extends DynamicComponent<Types.CustomNode> { ... }
```

- `hlmBtn` (Spartan directive) applies Tailwind classes for `variant="default"` → dark background, white text
- `a2ui-renderer` receives the pre-resolved `Text` node and renders `"Submit"` as the button label

**The button is on screen.**

---

## Flow 2: User Clicks → Agent Disables the Button

### Step 1 — `handleClick()` fires in the wrapper

```ts
// hlm-button-wrapper.component.ts:32-35
handleClick(): void {
  const action = this.component().properties['action'] as unknown as Types.Action | undefined;
  if (action) super.sendAction(action);
}
```

`action` is `{ name: "btn_primary_clicked" }` from the resolved node.

---

### Step 2 — `DynamicComponent.sendAction()` builds the client event message

```ts
// A2UI/renderers/angular/src/lib/rendering/dynamic-component.ts:38-69
const message: Types.A2UIClientEventMessage = {
  userAction: {
    name: "btn_primary_clicked",
    sourceComponentId: "btn_primary",
    surfaceId: "primary_button_surface",
    timestamp: "2026-03-07T10:00:00.000Z",
    context: {},  // empty — our fixture has no context items
  },
};
return this.processor.dispatch(message);
```

---

### Step 3 — `MessageProcessor.dispatch()` emits on the RxJS Subject

```ts
// A2UI/renderers/angular/src/lib/data/processor.ts:46-50
dispatch(message: Types.A2UIClientEventMessage): Promise<Types.ServerToClientMessage[]> {
  const completion = new Subject<Types.ServerToClientMessage[]>();
  this.events.next({ message, completion });
  return firstValueFrom(completion);
}
```

The app is subscribed to `processor.events` and forwards the message to the agent via A2A:

```ts
// Hypothetical app-level subscription
processor.events.subscribe(async ({ message, completion }) => {
  const response = await a2aClient.sendEvent(message);
  processor.processMessages(response);
  completion.next(response);
  completion.complete();
});
```

---

### Step 4 — Agent receives the action and responds

The agent receives `userAction.name = "btn_primary_clicked"`. The LLM interprets: "user clicked submit — disable the button now."

It calls `send_a2ui_json_to_client` with a **partial `surfaceUpdate`** — only the changed component:

```json
[
  {
    "surfaceUpdate": {
      "surfaceId": "primary_button_surface",
      "components": [
        {
          "id": "btn_primary",
          "component": {
            "HlmButton": {
              "variant": "default",
              "disabled": true,
              "child": "btn_primary_text",
              "action": { "name": "btn_primary_clicked" }
            }
          }
        }
      ]
    }
  }
]
```

`surfaceUpdate` is **additive/patch** — only components listed are updated. The `root` Column and `btn_primary_text` Text node stay unchanged in `surface.components`.

---

### Step 5 — Client processes the patch

`handleSurfaceUpdate()` overwrites `surface.components.get("btn_primary")` with the updated entry. `rebuildComponentTree()` re-runs — same structure, but `properties['disabled']` is now `true` on the HlmButton node. Angular's signals update, triggering re-render.

---

### Step 6 — Wrapper re-renders with disabled state

> **Current limitation:** `HlmButtonWrapperComponent` only binds `variant` and `size`. It does not handle `disabled`.

To support it, the adapter needs two small changes:

**`catalog.ts` — add `disabled` binding:**
```ts
bindings: ({ properties }) => [
  inputBinding('variant',  () => ('variant'  in properties && properties['variant'])  || 'default'),
  inputBinding('size',     () => ('size'     in properties && properties['size'])     || 'default'),
  inputBinding('disabled', () => ('disabled' in properties && properties['disabled']) || false),
],
```

**`hlm-button-wrapper.component.ts` — add `disabled` input and bind it:**
```ts
readonly disabled = input<boolean>(false);
```
```html
<button hlmBtn [variant]="$any(variant())" [size]="$any(size())"
        [disabled]="disabled()" (click)="handleClick()">
  <ng-container a2ui-renderer ... />
</button>
```

With that in place, Spartan's `hlmBtn` directive automatically applies `disabled:opacity-50 disabled:pointer-events-none` Tailwind classes. **The button is visually dimmed and unclickable.**

---

## Architecture Summary

```
USER PROMPT
  │
  ▼
A2A Client ──────────────────────────────────────────────────────────────────┐
  │                                                                           │
  ▼                                                                           │
Agent (LLM + SendA2uiToClientToolset)                                        │
  │  catalog schema injected into system prompt per request                  │
  │  LLM generates A2UI JSON → calls send_a2ui_json_to_client                │
  │  tool validates against catalog JSON schema                              │
  │  A2uiPartConverter wraps each message as A2A DataPart                    │
  │                                                                           │
  ▼                                                                           │
ServerToClientMessage[] streamed to client                                    │
  │                                                                           │
  ▼                                                                           │
MessageProcessor.processMessages()    [web_core — framework agnostic]         │
  │  handleSurfaceUpdate() → surface.components populated                    │
  │  handleBeginRendering() → rebuildComponentTree()                         │
  │    resolvePropertyValue() resolves "child" ID string → full Text node    │
  │                                                                           │
  ▼                                                                           │
<a2ui-surface> walks componentTree    [Angular renderer]                      │
  │  hits HlmButton node                                                     │
  │  looks up "HlmButton" in SPARTAN_CATALOG                                 │
  │  lazy-loads HlmButtonWrapperComponent                                    │
  │  applies inputBindings: variant, size                                    │
  │                                                                           │
  ▼                                                                           │
HlmButtonWrapperComponent renders     [spartan-a2ui-adapter]                  │
  │  hlmBtn directive applies Tailwind styles                                │
  │  a2ui-renderer renders Text child as label                               │
  │                                                                           │
  ▼                                                                           │
BUTTON ON SCREEN                                                              │
  │                                                                           │
  │ user clicks                                                               │
  ▼                                                                           │
handleClick() → sendAction({ name: "btn_primary_clicked" })                   │
  │  DynamicComponent builds A2UIClientEventMessage                          │
  │  MessageProcessor.dispatch() emits on events Subject                     │
  │                                                                           │
  └──────────────────────────────────────────────────────────────────────────┘
         forwarded via A2A back to agent
         agent responds with surfaceUpdate patching the component
         processMessages() → rebuildComponentTree() → re-render
```

---

## Key Concepts

| Concept | Where | What it does |
|---|---|---|
| `catalogs/spartan/v0.8.0/catalog.json` | Agent side | JSON Schema the LLM uses to generate valid A2UI payloads |
| `SPARTAN_CATALOG` (TypeScript) | Client side | Maps component type names to Angular component classes |
| `surface.components` | `web_core` | Runtime flat map of component instances from server messages |
| `rebuildComponentTree()` | `web_core` | Resolves ID references → full node tree before Angular sees it |
| `DynamicComponent` | Angular renderer | Base class providing `component()`, `surfaceId()`, `sendAction()` |
| `HlmButtonWrapperComponent` | This adapter | Bridges A2UI node → Spartan `hlmBtn` directive |
| `surfaceUpdate` (partial) | Protocol | Patch-style update — only changed components need to be listed |
