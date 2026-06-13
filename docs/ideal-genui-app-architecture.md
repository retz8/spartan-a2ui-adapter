# The Ideal Generative-UI App Architecture

> A reference architecture for a brand app that lives inside a host **super-app**
> and generates its interface on demand. Worked example: **Korean Air (`KAL`)**.
>
> This document describes the *ideal* shape — the one where every responsibility
> sits in exactly one place, and the security boundaries fall out of that
> separation for free. It is deliberately opinionated about **which layer owns
> what**, because conflating these layers is the single most common way the model
> goes wrong.

---

## 0. The shape in one picture (in words)

```
┌─────────────────────────────────────────────────────────────┐
│  KAL brand bundle — published by Korean Air                  │
│                                                              │
│   KAL thin FE          KAL agent                             │
│   (vocabulary +        (judgment:                            │
│    adapter)  ──one ID──  LLM orchestrates,                   │
│                          generates A2UI surfaces)            │
│                              │ MCP tool calls                │
│                              ▼                               │
│                          KAL server (BE)                     │
│                          (execution: business logic,         │
│                           MCP tools, hard-rule gate)         │
│                              │ read / write                  │
│   KAL DB ◄───────────────────┘                              │
│   (persistence)                                              │
└─────────────────────────────────────────────────────────────┘
                              ▲  A2UI stream ↑↓ action events
┌─────────────────────────────┴───────────────────────────────┐
│  Super-app host — separate thin runtime                      │
│  registers KAL_ID → adapter · renders surfaces · authors      │
│  nothing                                                     │
└─────────────────────────────────────────────────────────────┘
                              ▲
                     User: "Book a flight to New York"
```

The whole point: **KAL authors and runs everything (thin FE, ID, adapter, agent,
server, DB); the host authors nothing and installs nothing of KAL's backend.**
From the host's side, installing the app is registering three symbols — `KAL_ID`,
the adapter, and the agent's URL — and rendering what the agent streams back. The
agent, server, and DB stay on KAL's infrastructure.

---

## 1. What kind of app this is

A conventional app ships **Design System + business logic + fixed screens**. In
this architecture the fixed screens are removed and replaced by a *generator*. The
brand's agent emits UI **intent as data** (A2UI), and the host renders that data
with the brand's own component **adapter**.

So "installing Korean Air" is not downloading a binary of screens. From the
super-app's point of view it is registering **three** things — and the third is
just a URL. The agent, server, and DB stay on KAL's own infrastructure and are
never installed into the host:

```
What the super-app receives (registers):
  ├── KAL_ID              — the vocabulary contract
  ├── KAL_REACT_CATALOG   — the renderer adapter
  └── KAL_AGENT_URL       — the agent endpoint (just a URL to POST to)

What KAL runs on its own infrastructure (host never installs these):
  ├── KAL agent     — judgment: orchestration + surface generation
  ├── KAL server    — execution: business logic + MCP tools + hard-rule gate
  └── KAL DB        — persistence
```

The host only ever holds those **three symbols** — `KAL_ID`, the adapter, and
`KAL_AGENT_URL`. It POSTs user messages straight to that URL, advertising which
catalog it can render via an `a2uiClientCapabilities` handshake
(`supportedCatalogIds: [KAL_ID]`), and renders the A2UI the agent streams back. The
server and DB sit behind the agent; the host never sees them.

The user says *"Book me a flight to New York"* and what appears is a UI built from
**Korean Air's sky-blue components**, with interactions wired and server calls
working — rendered inside the host, yet unmistakably Korean Air.

---

## 2. The four layers of the KAL bundle

The defining discipline of this architecture is that **judgment, execution, and
persistence are three different machines**, and the **vocabulary** that describes
the UI is a fourth concern owned on the frontend side. Never collapse them into
one "backend."

### 2.1 KAL thin FE — vocabulary + render mapping

This is the layer that **authors `KAL_ID` and the renderer adapter**. It is *thin*
because it contains no screens and no business logic — only:

- **`KAL_ID`** — a platform-invariant vocabulary contract (an address).
- **`KAL_REACT_CATALOG`** — the adapter mapping that vocabulary to real, sky-blue
  React components. Per-platform siblings (`KAL_ANGULAR_CATALOG`, …) share the
  same `KAL_ID`.

Crucially, **KAL** authors this, not the host. The brand decides its own
vocabulary and its own look; the host merely receives them.

### 2.2 KAL agent — the judgment layer

The agent is an **action processor**. It does **not** execute business logic and
it does **not** touch the database. It:

- receives action events from the rendered UI,
- decides *what to do next* (an LLM orchestrating),
- generates the next A2UI surface, tagged with `KAL_ID`,
- calls the **KAL server's MCP tools** to get real work done.

It holds the **soft** half of the workflow — suggested ordering, context
adaptation — as LLM instructions. It is the only layer the host talks to.

### 2.3 KAL server (BE) — the execution layer

This is where the real work happens. The server:

- runs the business logic (`search_flights`, `submit_payment`, …),
- **exposes those as MCP tools** for the agent to call,
- enforces the **hard** half of the workflow as **MCP-gate preconditions**.

The hard-rule gate lives **here, at the server's tool boundary** — not in the
agent. "No payment before a passed face-verify" is a server precondition that
rejects out-of-order calls, so even if the agent's LLM errs, the server refuses.
This is the layer that makes the architecture safe.

### 2.4 KAL DB — persistence

The database persists reservations, users, flights, and payments. **Only the KAL
server reads or writes it.** Neither the agent nor the host can reach it directly —
that isolation is a feature, not an accident (see §4).

---

## 3. End-to-end flow: "Book a flight to New York"

```
1. User intent
   User tells the super-app: "Book a flight to New York."

2. Host routes to the KAL agent
   The host forwards the intent to the KAL agent (the only KAL layer it talks to).

3. Agent generates the first surface (judgment)
   The LLM emits an A2UI surface — origin/destination/date inputs — in KAL
   vocabulary, tagged KAL_ID. No business logic yet.

4. Host renders (registered adapter)
   The host looks up KAL_ID → KAL_REACT_CATALOG and draws sky-blue KAL inputs.
   Typing is handled locally; the network is quiet until an action fires.

5. User submits → agent → server (execution)
   The action event flows to the agent; the agent calls the server's
   search_flights MCP tool; the server queries the DB and returns flights.

6. Agent generates the results surface (judgment)
   The LLM turns the flight data into a FlightCard surface — still sky-blue,
   still KAL_ID.

7. Select → seat → pay → confirm
   Each step: agent orchestrates, server executes via MCP, DB persists.
   Hard rules (e.g. no pay before face-verify) are enforced at the server's
   MCP gate; soft ordering comes from the agent's instructions.
```

Each layer stays in its lane: **vocabulary/look** in the thin FE + adapter,
**judgment** in the agent, **execution** in the server, **data** in the DB, and
**rendering** in the host.

---

## 4. Why the separation is also the security model

The layer boundaries are not just tidy — they are **trust boundaries**, and they
fall out of the architecture for free:

- The **host** talks only to the **agent**. It never sees business logic or data.
- The **agent** talks only to the **server's MCP tools**. It cannot reach the DB,
  so a compromised or hallucinating agent cannot read or corrupt data directly —
  it can only request tool calls the server may refuse.
- Only the **server** touches the **DB**. Persistence has exactly one gatekeeper.
- **Hard rules live at the server's MCP gate**, so the safety-critical logic is
  enforced by the layer with the narrowest, most auditable surface — not by an LLM
  whose output is probabilistic.

The rule of thumb: **anything where being wrong costs money, breaks security, or
violates law goes in the server's MCP gate; never trust it to the agent's prompt.**
Soft ordering and adaptation live in the agent. This split is what makes a
generative checkout flow safe.

---

## 5. The host side: register, don't author

The super-app host is a **separate thin runtime**. It authors nothing and installs
none of KAL's backend — it holds only the **three symbols** (`KAL_ID`, the
adapter, and `KAL_AGENT_URL`):

```ts
// 1. Register the adapter against the ID
provideA2UI({
  catalogs: { [KAL_ID]: KAL_REACT_CATALOG },  // one line per installed brand
});

// 2. Talk to the agent at its URL, advertising what we can render
fetch(KAL_AGENT_URL, {
  method: 'POST',
  body: JSON.stringify({
    /* user message */
    metadata: { a2uiClientCapabilities: { supportedCatalogIds: [KAL_ID] } },
  }),
});
```

After registration, the host's A2UI Surface renderer:

- draws any surface tagged `KAL_ID` using `KAL_REACT_CATALOG` (sky-blue),
- sends action events back to the KAL agent,

and nothing else. Adding another brand (a bank, a delivery app) is another
registration with that brand's own ID, adapter, and agent URL. The host's source
does not change per brand — installation is registration.

> The brand look rides in the **adapter**, not in the A2UI stream. The agent sends
> *"render a `FlightCard` with these flights"*; the registered adapter decides a
> `FlightCard` is sky-blue. Brand fidelity travels with the adapter.

---

## 6. Why this is only natural with a data contract (A2UI)

This architecture requires shipping a **brand's Design System as data** and letting
a separate host render it. Only A2UI treats the DS as data (an ID-addressed
vocabulary) separated from rendering (an adapter). Systems that fuse component
vocabulary into framework code cannot let a brand and a host share one vocabulary
by ID, nor let one vocabulary carry per-platform adapters under that ID — so the
clean "author once, register one line" model does not hold for them.

That is why the brand can hand the host *only* an ID and an adapter: the vocabulary
is data, the rendering is the host's registered code, and the two are pinned
together by `KAL_ID`.

---

## 7. Summary

- A brand app becomes **DS + business logic + a UI generator**, split into four
  authored layers plus a host that authors nothing.
- **KAL thin FE** owns the vocabulary (`KAL_ID`) and the render adapter.
- **KAL agent** is judgment: it orchestrates and generates surfaces, calling the
  server's MCP tools. It holds soft workflow (instructions).
- **KAL server** is execution: business logic, MCP tools, and the hard-rule gate.
  Hard workflow lives here as MCP preconditions.
- **KAL DB** is persistence, reachable only through the server.
- **The super-app host** registers three symbols (`KAL_ID`, the adapter, and the
  agent's URL), POSTs user messages to that URL with a capabilities handshake, and
  renders surfaces. It authors nothing and installs none of KAL's agent, server, or
  DB — those stay on KAL's infrastructure.
- The layer boundaries double as **trust boundaries**, and the safety-critical
  rules sit at the server's MCP gate — never in the agent's prompt.