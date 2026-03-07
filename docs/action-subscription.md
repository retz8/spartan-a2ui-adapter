# Action Subscription — How Button Clicks Flow Back to the Agent

## The Problem

A2UI renders components dynamically, including `HlmButton` with an `action` property. When the user clicks a button, `HlmButtonWrapperComponent.handleClick()` fires and calls `super.sendAction(action)` from `DynamicComponent`. This dispatches the event into `MessageProcessor.dispatch()` — but nothing happens unless someone subscribes.

## How `dispatch()` Works

`MessageProcessor` (Angular service in `@a2ui/angular`) has an RxJS `Subject`:

```typescript
readonly events = new Subject<DispatchedEvent>();

dispatch(message: A2UIClientEventMessage): Promise<ServerToClientMessage[]> {
  const completion = new Subject<ServerToClientMessage[]>();
  this.events.next({ message, completion });
  return firstValueFrom(completion); // resolves when completion.next() is called
}
```

`handleClick()` waits on the returned Promise. If nobody calls `completion.next()`, the Promise never resolves and the click silently hangs.

## The Fix — Subscribe in `app.ts`

Wire `processor.events` to `A2aService` in `ngOnInit`:

```typescript
ngOnInit() {
  this.processor.events.subscribe(async (event: DispatchedEvent) => {
    try {
      const messages = await this.a2aService.sendMessage(JSON.stringify(event.message));
      this.processor.processMessages(messages);
      this.updateSurface();
      event.completion.next([]);
      event.completion.complete();
    } catch (err) {
      event.completion.error(err);
    }
  });
}
```

This mirrors the pattern used in the A2UI sample apps (`a2a-chat-canvas/ChatService`).

## Full Click-to-Agent Flow

```
User clicks HlmButton
  → handleClick() → sendAction() → processor.dispatch()
  → processor.events emits { message: { userAction: { name: "...", surfaceId: "...", ... } }, completion }
  → ngOnInit subscription fires
  → a2aService.sendMessage('{"userAction":{"name":"confirm_clicked",...}}')
  → Agent receives the action name, responds with updated A2UI JSON
  → processor.processMessages(response) → updateSurface()
  → event.completion.next([]) — resolves the Promise in handleClick()
```

## Agent Side — Handling `userAction` Messages

The agent system prompt must teach the LLM to recognise the two message types:

1. **Natural language** — compose a new surface
2. **`{"userAction": {"name": "...", "surfaceId": "..."}}`** — update the existing surface in response

Key rule: **reuse the same `surfaceId`** from the action to update the surface in place rather than creating a new one.

Action names should be descriptive of intent (`"show_result"`, `"confirm_delete"`), not generic (`"clicked"`), so the agent can reason about what to render in response.

## What A2UI Actions Cannot Do

The agent responds with **more A2UI JSON** — it cannot inject arbitrary client-side JavaScript. Things like `console.log("Hello World")` must be handled locally by subscribing to `processor.events` and checking `event.message.userAction.name`:

```typescript
this.processor.events.subscribe(async (event: DispatchedEvent) => {
  if (event.message.userAction?.name === 'my_action') {
    console.log('Hello World'); // local handler
  }
  event.completion.next([]);
  event.completion.complete();
});
```

## Reference

- `MessageProcessor` source: `A2UI/renderers/angular/src/lib/data/processor.ts`
- `DynamicComponent.sendAction()`: `A2UI/renderers/angular/src/lib/rendering/dynamic-component.ts`
- A2UI sample reference: `A2UI/samples/client/angular/projects/a2a-chat-canvas/src/lib/services/chat-service.ts`
- Mock app implementation: `apps/mock/src/app/app.ts`
- Agent system prompt: `agents/mock/spartan_mock_agent/agent.py`
