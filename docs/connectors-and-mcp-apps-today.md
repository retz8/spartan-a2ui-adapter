# How Connectors and In-Chat UI Work Today: A Survey of Claude Connectors and the MCP Apps Extension

> A standalone survey of the technology that already ships: how a connector is
> installed and run, and how a third-party UI (like Instacart's cart) actually
> renders inside a chat. This document describes the *current* mechanism on its
> own terms. It deliberately does not argue for any particular future
> architecture.

---

## 1. What a connector is

A Claude connector is, mechanically, a **client connection to a remote MCP
(Model Context Protocol) server**. There is no separate "connector technology" —
the Claude app acts as an MCP *client*, and a connector is the MCP *server* it
talks to. Under the hood, custom connectors are remote MCP servers that Claude
connects to over the internet; if you have used MCP before, the core concepts are
identical. You define tools with input schemas, and the model calls them.

The connection is made from Anthropic's cloud, not the user's device. When a
custom connector is added, Claude connects to the remote MCP server from
Anthropic's cloud infrastructure rather than the local machine — true across
claude.ai, Claude Desktop, Cowork, and mobile. A practical consequence: the MCP
server must be reachable over the public internet from Anthropic's IP ranges. A
server behind a VPN, on a private corporate network, or blocked by a firewall
will not connect, even if the user can reach it from their own machine.

Connectors work across Claude, Claude Desktop, Claude Code, and the API (via the
MCP connector feature, which lets the Messages API reach a remote MCP server
without a separate client).

---

## 2. How a connector is installed and enabled

There are two ways to add one:

- **From the directory.** The Connectors Directory lists verified and reviewed
  third-party MCP servers ready to use across Claude products. Each entry has a
  page describing its use cases and read/write capabilities.
- **Manually by URL.** Any third-party connector can be added as long as you have
  the remote MCP server's URL. The flow on Pro/Max: Settings → Connectors → add a
  custom connector → paste the URL → optionally supply an OAuth Client ID/Secret
  under advanced settings → Add. On Team/Enterprise, an Owner must add the
  connector at the organization level first; individual members then connect
  themselves.

A few operational details that matter:

- **Authentication is OAuth, when required.** Connectors use OAuth so Claude can
  act in the connected service without ever seeing the user's password, and access
  can be revoked at any time. The user only syncs content they already have
  permission to view in the source.
- **Adding is not enabling.** Adding a connector does not switch it on in every
  chat. To use one in a conversation, the user opens the "+" menu (or types "/")
  in the chat and enables it there. Once connected, Claude can also bring a
  relevant connector into a conversation on its own when it fits the request,
  without the user naming it each time.
- **Trust is the user's responsibility.** Custom connectors can connect Claude to
  services Anthropic has not verified, and Claude can read and take action in
  those services, so the documentation repeatedly flags reviewing permissions and
  only connecting to trusted servers. Free users are limited to one custom
  connector; paid plans support multiple.

---

## 3. What happens in a chat: the tool-call loop

The base behavior of any connector — with or without UI — is a tool-call loop:

1. On connection, the MCP server advertises its **tools** to the client: each
   tool has a name, an input schema, and a description.
2. When the user asks for something, the model reads those tool descriptions and
   decides which tool to call, emitting a tool call with arguments.
3. Anthropic's cloud relays the call to the remote MCP server, which performs the
   real work (hitting the underlying service's API) and returns a result.
4. The model folds that result into its reply.

In the plain case, the result is text or structured data, and Claude simply
*describes* the outcome in the conversation. This is the original connector shape:
it brings an app's **capabilities** into the chat, but not its interface.

---

## 4. In-chat UI: the MCP Apps Extension (SEP-1865)

The newer capability — the one behind experiences like Instacart building a cart
inside the conversation — is a standardized MCP extension called **MCP Apps,
specified as SEP-1865**. It lets servers ship interactive UI that the host renders
inline, and it was developed jointly: the proposal was introduced in November 2025
with maintainers from the MCP-UI community, OpenAI, and Anthropic, unifying the
approaches pioneered by **MCP-UI** and **OpenAI's Apps SDK** into one open
standard. Adopters of the predecessor work include Postman, Hugging Face, Shopify,
Goose, and ElevenLabs.

### 4.1 The core design: template vs. data

The defining decision is that UI is **not** sent whole on every call. The
extension separates static presentation (a UI *template*) from dynamic data (the
*tool result*). This separation enables caching, and — crucially — lets a host
prefetch and review a template before any tool runs. Tools declare their UI
templates ahead of time, so the host can prefetch, cache, and security-review them
before anything executes.

So the lifecycle is three beats: **declare → execute → hydrate.**

### 4.2 Declaring a UI resource

The server registers a UI **resource** under the `ui://` URI scheme, carrying a
MIME type that marks it as renderable UI rather than plain text:

```jsonc
{
  "uri": "ui://example/cart",
  "mimeType": "text/html;profile=mcp-app",   // signals "this is an MCP App UI"
  "text": "<!DOCTYPE html>...self-contained HTML with inlined JS/CSS...",
  "_meta": {
    "ui": {
      "csp": { "connectDomains": [], "resourceDomains": [] },  // domain allowlist
      "prefersBorder": true                                    // host rendering hint
    }
  }
}
```

The initial specification supports only `text/html` content, rendered in a
sandboxed iframe — with an explicit path left open for future content formats. (A
parallel detail: OpenAI's Apps SDK expresses the same idea with a
`text/html+skybridge` MIME type that ChatGPT renders in an iframe; SEP-1865 is the
effort to unify these under one standard, though as of early 2026 some interface
discrepancies between the two still required adapters.)

### 4.3 Linking the resource to a tool

UI resources are associated with tools through metadata. A two-part registration:
register the resource, then point a tool's `_meta` at it.

```jsonc
{
  "name": "build_cart",
  "inputSchema": { },
  "_meta": { "ui/resourceUri": "ui://example/cart" }   // this tool uses that UI
}
```

Because the linkage is declared up front, the host knows — at tool-listing time,
before any execution — which template a tool will use, and can prefetch and
security-review it.

### 4.4 Executing and hydrating

When the tool is called, the server returns the **data**, referencing the
prefetched template rather than re-sending it:

```jsonc
{
  "content": [ { "type": "text", "text": "Added 12 items" } ],   // fallback / LLM-visible
  "structuredContent": {                                          // injected into the UI
    "items": [ { "name": "Bananas", "qty": 6, "price": 2.40 } ],
    "total": 5.50
  },
  "_meta": { "ui/resourceUri": "ui://example/cart" }
}
```

The host renders the referenced template in a sandboxed iframe and hydrates it
with the tool's `structuredContent` (and `_meta`). Described from the server
author's side: the tool returns a result with data plus a reference to a UI
resource; the client fetches that resource (e.g. a compiled component) and renders
it in an iframe; the view is then hydrated with the tool's `structuredContent` and
`_meta`. The UI code inside the iframe reads that injected data through a bridge
object and populates itself.

### 4.5 Bidirectional communication: reusing JSON-RPC over postMessage

Rather than inventing a new message protocol, the rendered UI communicates with
the host using the **existing MCP JSON-RPC base protocol carried over
`postMessage`**. Concretely:

- A control inside the iframe (say a quantity stepper) issues a JSON-RPC
  `tools/call` via `postMessage` to the host.
- The host **proxies** that call to the originating MCP server — the App uses
  `tools/call` to trigger actions on its server, and those calls are proxied
  through the host.
- The server processes it and returns updated data, which re-hydrates the iframe.

The reference SDK provides the plumbing: a `PostMessageTransport` exchanges
JSON-RPC messages between windows/iframes, an `App` class for the UI side, and an
`AppBridge` class for the host side. Notably, the SEP-1865 repository does **not**
ship a host implementation of the iframing/sandboxing itself — that was contributed
tentatively to the MCP-UI repository, and clients may use it or roll their own.

The security payoff of reusing JSON-RPC is concrete: because every UI-initiated
action travels the same JSON-RPC path as a direct tool call, it goes through the
same audit and consent flow. The embedded UI cannot quietly do something a normal
tool call wouldn't — it passes the same checkpoint.

### 4.6 The full picture

```
[Registration time]
server → host : declare resource  ui://example/cart  (text/html;profile=mcp-app, +CSP)
server → host : declare tool      build_cart, _meta.ui/resourceUri = ui://example/cart
host          : prefetch template + security-review + cache

[Execution time]
user: "build my cart"
host → server : tools/call build_cart
server → host : { structuredContent: {items,total}, _meta.ui/resourceUri }
host          : render ui://example/cart in a sandboxed iframe
host → iframe : inject structuredContent (hydration)   → UI appears in chat

[Interaction]
iframe (stepper +1) → postMessage(JSON-RPC tools/call) → host → server
server → host → iframe : updated structuredContent → re-hydrate
```

---

## 5. Security model of the rendered UI

The current extension renders UI inside a **sandboxed iframe**, which is the
same isolation principle seen throughout MCP's UI work: third-party UI code runs
in a restricted container and cannot directly touch the host's DOM, storage, or
cookies. Three properties hold it together:

- **Prefetch and review.** Because templates are declared ahead of execution, the
  host can fetch, cache, and security-review them before anything runs.
- **Declared CSP.** The resource's `_meta.ui.csp` enumerates which domains the UI
  may connect to or load resources from; an empty allowlist means a fully
  self-contained widget with no external calls.
- **Audited actions.** All UI-initiated actions are ordinary JSON-RPC `tools/call`
  messages proxied through the host, so they inherit the host's existing audit and
  consent path.

---

## 6. The state of the standard (as of mid-2026)

- **MCP Apps (SEP-1865)** is an optional, backwards-compatible extension to MCP,
  positioned as the common standard intended to unify MCP-UI and the Apps SDK.
- The initial content type is **HTML only**, rendered in sandboxed iframes, with
  the specification explicitly noting extensibility for future formats.
- The reference SDK lives at `modelcontextprotocol/ext-apps` (types, `App`,
  `AppBridge`, `PostMessageTransport`, example servers/Apps). It intentionally
  excludes a host/sandbox implementation, leaving that to clients.
- Some interface discrepancies between the MCP Apps extension and OpenAI's Apps
  SDK persisted into early 2026, bridged in practice by adapters (MCP-UI,
  Skybridge).

---

## 7. Summary

- A connector is a remote MCP server; the Claude app is the MCP client, connecting
  from Anthropic's cloud. Installing one is registering a URL (or picking a
  directory entry) plus, where needed, an OAuth handshake; enabling it is a
  per-conversation action.
- The base behavior is a tool-call loop that brings an app's *capabilities* into
  the chat as text or data.
- In-chat *UI* is the MCP Apps Extension (SEP-1865): the server declares a
  `ui://` HTML resource, links it to a tool via `_meta`, returns data in
  `structuredContent` on `tools/call`, and the host hydrates the template inside a
  sandboxed iframe. The UI talks back over the same JSON-RPC base protocol carried
  on `postMessage`, proxied through the host.
- The current standard ships HTML rendered in an isolated iframe, with the
  specification leaving the door open to additional content formats.
