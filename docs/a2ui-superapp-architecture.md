# Generative-UI Super-Apps: The Catalog-as-Distribution Model

> A architecture for a host "super-app" into which independent brands plug as
> **UI-less apps** — bundles of *Design System + Business Logic* that generate
> their interface on demand. Worked example: **Korean Air (`KAL`)** booking a
> flight inside a third-party super-app.
>
> The thesis in one line: **an app is no longer a binary of fixed screens; it is
> a published `(catalog_id, renderer-catalog, agent)` bundle, and "installing" it
> into a super-app is registering one ID-to-adapter mapping.**

---

## 0. TL;DR

A traditional app ships **DS + business logic + fixed screens**. In this model the
fixed screens are removed and replaced by a *generator*: the brand's agent emits
UI **intent as data** (A2UI), and the host super-app renders that data with the
brand's own component **adapter**.

The entire integration surface for one brand collapses to two exported symbols:

```
KAL_ID                — a platform-invariant vocabulary contract (a shared address)
KAL_REACT_CATALOG     — that vocabulary mapped to the host platform's renderer
```

The agentic backend and the super-app frontend **share one catalog** through
`KAL_ID`. Installing Korean Air into a React super-app is:

```ts
provideA2UI({ catalogs: { [KAL_ID]: KAL_REACT_CATALOG } });
```

One line. The super-app's code does not change per brand; adding an app is adding
one entry to the catalog map.

This document explains why this works **only** when the contract is *data* (A2UI),
and not when component vocabulary is *fused into framework code* (OpenUI,
json-render).

---

## 1. The vision: a super-app of UI-less brand apps

Picture a single host super-app. Plugged into it are independent brands —
Korean Air, a bank, a food-delivery service — but **not** as the conventional apps
we know. Each is a bundle of **the brand's Design System + its business logic**,
able to **generate UI on demand**.

The user says, in the super-app: *"Book me a flight to New York."* What appears is
a UI built from **Korean Air's sky-blue components**, with all interactions wired
and all server calls working — rendered **inside the host super-app**, yet
unmistakably Korean Air.

This is the **generative-UI evolution of the mini-program / app-store model**:
where WeChat mini-programs embed *fixed* screens inside a host, here the host
embeds **agent-generated** screens. The delivery format for that generated UI is
**A2UI**.

### What "installing an app" means here

```
Conventional app install   = download a binary containing screens + logic
This model's app install    = register [ KAL_CATALOG package ]
                              ├── KAL_ID            (vocabulary contract)
                              ├── KAL_REACT_CATALOG (renderer adapter)
                              └── KAL agent endpoint (workflow + MCP)
                              ↑ no screens. The super-app draws them from the catalog.
```

---

## 2. The three contracts every generative-UI app needs

Across this whole design, an app must hand the model **three** things — not one.
Conflating them is the usual source of confusion.

| # | Contract | What it is | Where it lives (this model) |
|---|----------|------------|------------------------------|
| 1 | **Component vocabulary** | "There is a `FlightCard`, a `SeatMap`, a `Button`…" with schema + description | The brand's **catalog** (data) + the host's **adapter** (render code) |
| 2 | **Workflow knowledge** | "Booking goes search → select → seat → pay → confirm; face-verify gates confirm" | The brand's **agent** (a state machine) |
| 3 | **Execution** | The real reads/writes (search flights, charge card) | **MCP / real backend** behind the agent |

Contract 2 is the one most people miss: it is **neither a server API call nor a
component** — it is the *app's flow itself*, the Figma-arrows "press this, go
there, but only if…" specification. In this model it lives in the agent.

---

## 3. Anatomy of one brand bundle (`KAL`)

A brand publishes a single package. The decisive design move is that it exports a
**platform-invariant ID** and a **per-platform renderer adapter** separately.

```
Korean Air publishes:

  KAL_ID                 ─ the vocabulary contract address (ONE, all platforms)

  KAL_REACT_CATALOG      ─ vocabulary → React components   ┐
  KAL_ANGULAR_CATALOG    ─ vocabulary → Angular components  ├─ per-platform,
  KAL_FLUTTER_CATALOG    ─ vocabulary → Flutter widgets     ┘  same KAL_ID

  KAL agent              ─ workflow state machine + MCP tools,
                           emits A2UI tagged with KAL_ID
```

### Why the split is the whole trick

- **`KAL_ID`** is the handle that guarantees **the backend and the frontend are
  looking at the same catalog**. The agent declares "I speak in this vocabulary"
  by tagging its stream with `KAL_ID`; the super-app matches "I render that
  vocabulary with this adapter" by the same `KAL_ID`. They cannot drift, because
  they are pinned to one address.

- **`KAL_REACT_CATALOG`** is the *render mapping only* — the code that draws
  `FlightCard` (and its sky-blue) as a real React component. Swap it for
  `KAL_ANGULAR_CATALOG` and the **same agent, same stream, same vocabulary**
  renders on Angular. The vocabulary is invariant; only the adapter is
  platform-specific.

> The sky-blue is not in the stream. It rides in the **adapter**. The agent sends
> *"render a `FlightCard` with these flights"*; the host's `KAL_REACT_CATALOG`
> decides that a `FlightCard` is sky-blue. Brand fidelity travels with the
> adapter, not the data.

### Custom widgets are not a problem

A flight booking needs domain widgets — `SeatMap`, `FlightCard`, a date range
picker — that are **not** in any standard component set. This is fine and requires
no ecosystem agreement, because **the custom type and its renderer ship together
in the same `KAL_CATALOG` package**. The agent learns the custom type from the
catalog schema (and few-shot examples); the host renders it from the bundled
adapter. There is no "the host doesn't know this widget" gap — catalog and adapter
arrive as one unit.

---

## 4. Walkthrough: "Book me a flight to New York"

```
1. Intent routing
   Super-app's orchestrator recognizes "flight booking" → routes to the KAL agent.

2. KAL agent starts the booking workflow (Contract 2 lives here)
   Emits an A2UI surface: origin / destination / date inputs,
   described in KAL vocabulary, tagged KAL_ID.

3. Super-app renders
   Receives the A2UI stream, looks up KAL_ID → KAL_REACT_CATALOG,
   draws the inputs as sky-blue Korean Air components.

4. User submits
   Action event flows back to the KAL agent → agent calls flight-search (MCP)
   → streams a fresh surface of FlightCards (still sky-blue, still KAL_ID).

5. Select → seat map → payment → confirm
   Each transition is owned by the agent's state machine; each server step is an
   MCP call behind the agent. The super-app stays thin: it renders surfaces and
   sends back action events.
```

Each of the three contracts sits in its proper place: **DS / sky-blue** in the
catalog + adapter, **booking flow** in the agent's state machine, **flight &
payment calls** in MCP behind the agent.

---

## 5. Installing into the super-app

The host registers brands by ID-to-adapter mapping. Adding a brand is one entry.

```ts
// Super-app (React) — registering installed brand apps
provideA2UI({
  catalogs: {
    [KAL_ID]:     KAL_REACT_CATALOG,      // sky-blue Korean Air
    [SHINHAN_ID]: SHINHAN_REACT_CATALOG,  // the bank's palette
    [BAEMIN_ID]:  BAEMIN_REACT_CATALOG,   // the delivery app's palette
  },
});
```

At runtime the host's surface processor dispatches by tag:

- KAL agent streams a surface tagged `KAL_ID` → rendered via `KAL_REACT_CATALOG`.
- Baemin agent streams a surface tagged `BAEMIN_ID` → rendered via `BAEMIN_REACT_CATALOG`.

**Same super-app, same surface host, per-brand look.** The super-app's source does
not change when a brand is added — installation is a one-line registration, exactly
the "easy install" the model promises.

---

## 6. Why this works only with a data contract (A2UI)

The vision *requires* shipping a **brand's Design System as data** and letting the
host render it. A2UI is the only one of the three current generative-UI systems
that treats the DS as data; the other two treat it as framework-bound code.

| | What the app ships to the host | Host renders in its own DS? | Per-brand install cost | BE/FE share one ID? |
|---|---|---|---|---|
| **A2UI** | **Catalog (data) + adapter** | ✅ via host-registered adapter | one `(id → adapter)` entry | ✅ via `catalog_id` |
| **json-render** | Catalog **+ a React registry (code)** | △ host must hold each app's registry | a registry per app | ✗ vocabulary is React-bound |
| **OpenUI** | A whole **library (React render code)** | ✗ app renders with its own components | load a code bundle per app | ✗ no platform-invariant ID |

The reason in one line: **A2UI splits "what to draw" (vocabulary, an ID) from "how
to draw it" (an adapter); the other two fuse them into React code.** Only a split
contract lets a backend and a frontend share one vocabulary by ID, and lets the
same vocabulary carry multiple per-platform adapters under that one ID. That split
is precisely what makes "export an ID and a catalog, register one line, done"
possible.

OpenUI and json-render *can* be exposed to a host over MCP, but doing so makes the
brand render with **its own** components, not the host's unified-yet-branded DS —
or forces the host to absorb a React adapter per app, which is no longer a clean
install.

---

## 7. The minimal atom

The two exported symbols are the **atom** of this whole super-app ecosystem:

```
brand_ID         — the BE/FE shared handle (vocabulary contract address)
brand_CATALOG    — the platform-specific renderer adapter
```

`brand_ID` is the shared contract between the agent and the host; `brand_CATALOG`
is the render binding. Export those two, register them in the host, point the
agent at the ID — and a UI-less brand app is live inside the super-app.

---

## 8. What the catalog does *not* solve — where the real difficulty (and IP) is

Catalog exchange cleanly handles vocabulary, rendering, and brand look. It does
**not** handle three things, and these are where a real super-app's value
concentrates:

1. **Intent routing / orchestration.** "Flight booking → KAL agent" is the host's
   own layer. With many brands installed, *which agent handles this intent?*
   becomes hard, and solving it well is the super-app's core IP. A2UI does not
   address this.

2. **Trust, payment, and permission boundaries.** A brand agent renders a payment
   step inside the host. Is it really the brand? What does the host see in the
   middle? Where are the permission edges? This is trust infrastructure, not a
   rendering concern — the perennial hard problem of every super-app (WeChat,
   Kakao).

3. **Theme fidelity vs host consistency.** The adapter carries the brand palette,
   so sky-blue comes for free *if* the host chooses to preserve per-brand looks.
   Whether the host enforces a unified look or preserves brand identity is a host
   **policy** decision (this model chooses the latter), not a technical limit —
   but it is a decision someone must make deliberately.

The protocol (A2UI) is a delivery standard that Google stewards; it is not itself
the moat. The defensible work is the orchestration layer (1), the trust/payment
infrastructure (2), and the adapter/theme layer (3) that renders many brand
catalogs faithfully in the host. A working brand adapter is the most tangible
starting point and proves the model end-to-end.

---

## 9. Summary

- An app becomes **DS + business logic + a UI generator**, with fixed screens
  removed. "Install" = register a published `(ID, adapter)` pair and point an
  agent at the ID.
- **`brand_ID`** pins the backend and frontend to one shared vocabulary;
  **`brand_CATALOG`** is the per-platform render adapter. Brand look rides in the
  adapter, not the stream.
- This is structurally possible **only with A2UI**, because only A2UI separates
  vocabulary (data, ID-addressed) from rendering (adapter, code) — letting one
  vocabulary serve any platform and letting BE/FE share it by ID.
- The protocol is the easy part. The orchestration, trust/payment, and theming
  layers around it are where a real product lives.
