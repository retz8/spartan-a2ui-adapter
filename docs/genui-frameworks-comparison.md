# Generative-UI Frameworks Compared: A2UI vs json-render vs OpenUI

> A working comparison of the three current generative-UI systems, written around
> the questions that actually decide an architecture: where the component
> vocabulary lives, who calls the backend, where workflow knowledge sits, and
> whether a brand's UI can be delivered into a separate host. Worked lens
> throughout: a React client, a brand's own Design System, and an MCP backend.

---

## 0. One-line identity of each

- **A2UI (Google)** — an *agent-to-UI protocol*. The model emits streaming JSON
  describing UI **intent**; the contract is **data** (a JSON-Schema catalog with
  **no renderer**), and rendering is a separate, per-platform concern. Bet:
  portability and a shareable, ID-addressed vocabulary.

- **json-render (Vercel Labs)** — a *JSON-patch generative-UI framework*. The
  model emits JSONL (RFC-6902 patches) constrained to a developer catalog; the
  contract is **code** (React-family, render fused). Bet: standard JSON tooling,
  the widest renderer/output spread, ecosystem fit.

- **OpenUI (Thesys)** — a *compact DSL for generative UI*. The model emits a terse
  line-oriented language (OpenUI Lang) instead of JSON; the contract is **code**
  fused with a React renderer via `defineComponent`. Bet: token density,
  streaming, and a first-class data-binding runtime.

---

## 1. The two axes that actually divide them

Most write-ups stop at "they all let an LLM emit UI safely from a catalog." The
real forks are two:

**Axis 1 — contract as *code* vs contract as *data*.**
OpenUI and json-render both fuse the component vocabulary with React render code.
A2UI splits the vocabulary (data, addressed by an ID) from the renderer (a separate
adapter). This is the single deepest difference and everything downstream follows
from it.

**Axis 2 — who calls the backend: *client-direct* vs *agent-authoritative*.**
OpenUI and json-render dispatch data/mutations from the client side. A2UI routes
every action back to an agent, which performs the work and streams back UI.

On both axes, **OpenUI and json-render are the same family; A2UI is the outlier.**

---

## 2. How each binds a brand Design System

All three require wrapping each of your M components once. This is equal work in
all three; what differs is *what the wrapper is made of* and whether it stays
React-bound.

| | DS binding mechanism | What the binding is made of | Reusable as data? |
|---|---|---|---|
| **OpenUI** | `defineComponent` → `createLibrary` | schema + description **+ React renderer**, one unit | No — React-bound |
| **json-render** | `defineCatalog` + `defineRegistry` | catalog (schema) ↔ React component mapping | No — React-bound |
| **A2UI** | JSON-Schema catalog + a renderer adapter | catalog is **pure data**; adapter is separate code | **Yes** — catalog is shareable, ID-addressed |

The practical upshot: in OpenUI and json-render the vocabulary cannot be separated
from React, so a backend and a frontend cannot share it by reference, and it cannot
carry multiple per-platform adapters. In A2UI the catalog is data pinned by an ID,
and the adapter is the host's concern — which is what enables the super-app model
in §6.

> The work of wrapping M components is roughly equal across all three. The
> difference is not effort; it is whether the result is *React-locked code* or
> *shareable data + a swappable adapter*.

---

## 3. Where the backend call (MCP) is triggered

This is Axis 2 made concrete. The MCP call's trigger sits in a different place in
each.

| | Where the MCP trigger lives | Who owns the fetch/cache/error lifecycle |
|---|---|---|
| **OpenUI** | The LLM emits `Query` / `Mutation` in OpenUI Lang | **The runtime** — `toolProvider` calls MCP; caching, loading, refetch managed |
| **json-render** | A handler you write in `defineRegistry` actions | **You** — the async handler body does the fetch/MCP call and all lifecycle |
| **A2UI** | A component action sends an **event to the agent** | **The agent** — it calls MCP and streams back results |

Two consequences worth internalizing:

- **OpenUI vs json-render** differ only in *who fills the trigger*: OpenUI's runtime
  manages the data lifecycle for you (batteries included); json-render hands you an
  empty async function and full control (batteries you wire). The handler code in
  json-render lives **on the client**, in your bundle — the framework only routes
  the action name to your handler; the `fetch`/MCP/caching inside it is all yours.
- **A2UI** puts the MCP call behind the agent. With an MCP backend you already
  have, this inserts an agent layer between client and MCP — a cost in the simple
  single-client case, but the basis of the workflow and super-app stories below.

---

## 4. Transitions without re-calling the LLM

A common misread is that generative UI re-invokes the model on every interaction.
It does not. The right question is **"when is the LLM called again?"**, and the
answer is governed by *who decides the next screen's structure*, not by whether a
server is hit.

- **Data-only change** (country → city list): the shape stays; toggle local
  state. No LLM.
- **Structure changes but predetermined** (submit → a known next page): the
  developer decided the next structure ahead of time. **Still no LLM.**
- **Structure decided by the model at runtime** ("show this as a table, not a
  chart"): only here is the LLM re-invoked.

Critically, **OpenUI and json-render handle transitions the same way**: the model
generates one interactive multi-view tree, and transitions are **declarative state
toggles** (visibility / `$binding`), with no LLM and usually no handler. They are
the same family here too. A2UI differs: the next screen is owned by the **agent**,
which may stream a pre-built static surface (no LLM) or generate one (LLM).

A well-built app minimizes the third case — generating a richly interactive surface
once, then letting most interaction self-serve locally.

---

## 5. Where workflow knowledge lives (the missing third contract)

A generative-UI app must hand the model **three** things, not one: (1) component
vocabulary, (2) **workflow knowledge** — the flow's order, conditions, and rules —
and (3) execution (MCP). Contract 2 is neither a component nor a server call; it is
the app's flow itself, and it has to live *somewhere*.

For a deterministic, must-not-break flow (e.g. checkout:
profile → card → face-verify → confirm), the workflow is best **split into two
halves**:

- **Hard rules** ("no payment before a passed face-verify") → enforced as
  **preconditions on the backend's MCP tools**, so even a wrong LLM call is
  refused.
- **Soft flow** (suggested ordering, context adaptation like skipping a saved
  card) → **LLM instructions**.

Each framework has a *natural home* for this:

| | Natural home for workflow | Notes |
|---|---|---|
| **OpenUI** | A **composite component** (`CheckoutFlow`) encapsulating the steps, or prompt notes | Flow absorbed into the component vocabulary; all steps must live in one generated artifact |
| **json-render** | A **stored spec** (multi-view + visibility toggles), replayed instead of re-generated | Pure JSON, so the flow can be versioned / A/B-tested; transitions are declarative |
| **A2UI** | The **agent** — hard rules at the MCP gate, soft flow in instructions | Flow control centralizes in the backend; natural when many surfaces/clients share one flow |

The deeper point: the more a flow is complex *and* deterministic, the better the
agent-centralized A2UI model fits; the more it is light and app-local, the better
the client-resident OpenUI/json-render models fit.

---

## 6. Delivering a brand's UI into a separate host (the super-app test)

This is where Axis 1 becomes decisive. Suppose a host "super-app" wants to render
many brands' UIs **in each brand's own look**, while adding a brand should be as
cheap as possible.

- **A2UI**: the brand publishes a catalog (data) + an adapter, addressed by an
  **ID**. The host registers `ID → adapter` (one line) and points at the brand's
  **agent URL**; the brand's agent/server/DB stay on the brand's infrastructure.
  The brand speaks the catalog vocabulary; the host renders it in the brand's DS.
  A brand and a host **share one vocabulary by ID**. This is the only one of the
  three where "install = register an ID + adapter + agent URL" holds.
- **json-render**: there is a real path (`@json-render/mcp`, MCP Apps) to expose UI
  to a host, but rendering in the *host's unified yet branded* DS requires the host
  to hold a React **registry per app** — vocabulary is React-bound, so it does not
  reduce to registering data. Typically the app renders with its own components
  instead.
- **OpenUI**: worst fit for this shape — the vocabulary is a React **library**
  (render code), so the host would have to load each app's component bundle. No
  platform-invariant ID, no data-only install.

In one line: **only A2UI separates "what to draw" (an ID-addressed vocabulary) from
"how to draw it" (an adapter)**, which is exactly what a multi-brand host needs.
The agent round-trip A2UI pays for is the price of that separation.

---

## 7. Decision guide for the React + own-DS + MCP scenario

For a single React app, your own DS, and an MCP backend — the plain case, no host
ecosystem:

- **Want the MCP data lifecycle managed for you** → **OpenUI**. Least code for
  data binding; pays in DSL/runtime lock-in and a smaller ecosystem.
- **Want full control of the data lifecycle, standard JSON tooling, and the
  broadest output targets** (web, plus PDF / email / video) → **json-render**.
  Most momentum and the most legible to a React team; you write the handlers.
- **A2UI is overkill here** — its agent layer is surplus when you have one client
  and a direct MCP backend. It earns its cost only when (a) a complex deterministic
  workflow wants central control, or (b) a host must render many brands' UIs (§5–6).

The honest summary: **OpenUI and json-render are one family** (client-resident,
React-bound vocabulary, declarative transitions) differing mainly in batteries vs
control and DSL vs JSON. **A2UI is a different bet** — a data contract and an
agent-authoritative model that is structurally aimed at a future of one host
projecting many brands' UIs, paid for up front with round-trip latency and a
younger spec.

---

## 8. At a glance

| | OpenUI | json-render | A2UI |
|---|---|---|---|
| Contract | Code (DSL + React) | Code (JSON patch + React) | **Data** (JSON-Schema) + separate adapter |
| Output encoding | OpenUI Lang DSL | JSONL (RFC-6902) | Streaming JSON intent |
| Backend call | Runtime `Query`/`Mutation` | Your client handler | Agent round-trip |
| Data lifecycle | Runtime-managed | You wire it | Agent owns it |
| Transitions | Declarative `$binding` | Declarative visibility/state | Agent streams next surface |
| Vocabulary shareable by ID | No | No | **Yes** |
| Multi-platform renderers | No (React) | Several (React/Vue/Svelte/Solid/RN) | **Yes**, one ID, many adapters |
| Best at | Least-code MCP binding | Control + ecosystem + output breadth | Multi-brand host / shared flow |
| Weakest at | Host delivery, lock-in | Host DS unification | Simple single-client (agent overhead) |

> Note: figures and package details for these projects move quickly; verify the
> current state (versions, star counts, available renderers, OpenAPI/MCP packages)
> before relying on any specific number.
