# The Catalog-Agent App Paradigm: How Software Gets Built, Installed, and Run When UI Becomes Data

> A companion to *Generative-UI Super-Apps: The Catalog-as-Distribution Model*.
> Where that document argued **why** a brand app collapses to a published
> `(catalog_id, renderer-catalog, agent)` bundle, this one works out **how** —
> the transport it actually runs on, what "install" mechanically becomes, how a
> host super-app must be built, and how a tech company reorganizes around it.
>
> One-line thesis: **when UI ships as data, an app is no longer a binary of
> screens — it is a registration. The hard engineering moves out of the screens
> and into three places the protocol does not touch: routing, trust, and the
> adapter-loading boundary.**

---

## 0. TL;DR

- The runtime contract between a host super-app and a brand is an **A2UI surface
  stream + action events**, and the natural transport for it is **A2A** — not
  MCP. MCP lives *behind* the brand's agent, where it calls real backends. The
  host neither sees nor cares.
- "Installing an app" becomes **registering a manifest**: verify a signature,
  consent to permissions, add the brand's intents to a routing table, bind
  `catalog_id → adapter`, and register the agent URL. No screens are downloaded.
- The one unavoidable tension is that a brand's **adapter is third-party render
  code** that must run inside the host. How that code is admitted — statically,
  via runtime module loading, or behind an iframe sandbox — is decided per
  **trust tier**, and that decision is the real architecture.
- A frontend org splits into a **catalog/design-system team** (vocabulary +
  adapters) and an **agent/workflow team** (the flow that used to be screens),
  with backends exposed as **tools** behind the agent. The defensible value
  concentrates in the host's **orchestration** and **trust/payment** layers.

---

## 1. The transport correction: A2A in front, MCP behind

It is easy to assume that because A2UI has prominent MCP integration guides, a
generative-UI app must speak MCP to its host. It does not. The README states A2UI
is compatible with both **A2A** and **AG-UI**, and the three-contract model makes
the boundary precise.

Recall the three contracts an app must hand the platform:

| # | Contract | What it is | Where it lives |
|---|----------|------------|----------------|
| 1 | **Vocabulary** | "there is a `FlightCard`, a `SeatMap`…" | brand catalog (data) + host adapter (code) |
| 2 | **Workflow** | "search → seat → pay, gated by verify" | brand agent (state machine) |
| 3 | **Execution** | the real reads/writes | MCP / backend behind the agent |

The two transports map cleanly onto the two boundaries:

```
[ Host super-app ]
   │  A2UI surface stream   (transport: A2A,  tag: KAL_ID)   ← Contract 1
   │  ◀──────────────────────────────────────────────────▶
   │  action events         (transport: A2A)
   ▼
[ KAL agent ]  ── workflow state machine                     ← Contract 2
   │
   │  MCP / REST / direct DB  ← host never sees this          ← Contract 3
   ▼
[ KAL backend ]  flight-search, seat, payment
```

The host's entire view of a brand is *"a stream of A2UI surfaces tagged
`KAL_ID`, and a channel to send action events back."* Whether the agent fulfills
those actions through MCP tool calls, REST, or a database it owns directly is an
implementation detail sealed inside the agent. **The host does not care, and that
indifference is the point** — it is what lets one host integrate thousands of
brands without absorbing any brand's backend.

### Where the MCP guides actually fit

The three A2UI-over-MCP guides are not the main runtime of this model. They are
edge cases:

- **A2UI over MCP** — relevant only if a brand exposes its agent *as an MCP
  server* instead of an A2A endpoint (e.g. for an MCP-client host). In an
  A2A-based super-app, unused on the host path.
- **MCP Apps in A2UI / A2UI in MCP Apps** — relevant when a specific surface must
  be **isolated behind an iframe sandbox** for trust reasons (see §4, tier 3).
  This is an exception for sensitive surfaces, not the default flow.

So the correct framing is: **A2A is the spine; MCP is one of several things an
agent may use behind itself, plus an optional isolation mechanism for high-trust
surfaces.**

---

## 2. What "install" becomes: manifest registration

When apps are `(catalog, agent)` bundles, installation stops being a download of
screens and becomes the registration of a **manifest** — a serialization of the
three contracts plus the trust metadata the host needs to admit the brand.

```jsonc
// kal.app-manifest.json
{
  "appId": "com.koreanair.booking",
  "catalogId": "KAL_ID",                 // the BE/FE shared address
  "version": "2.4.0",
  "agent": {
    "url": "https://agent.koreanair.com/a2a",
    "protocol": "a2a",
    "authScopes": ["payment:initiate", "identity:verify"]
  },
  "catalogSchema": "https://.../kal-catalog.schema.json",   // Contract 1: vocabulary
  "adapters": {                          // Contract 1: render code — admitted by tier
    "react":   { "url": "...", "integrity": "sha384-...", "trustTier": 2 },
    "angular": { "url": "...", "integrity": "sha384-..." },
    "flutter": { "url": "..." }
  },
  "capabilities": [                      // what the orchestrator routes on
    { "intent": "flight.book", "examples": ["book me a flight to NYC"] },
    { "intent": "flight.checkin" }
  ],
  "permissions": ["location", "payment", "contacts"],
  "themeOrigin": "adapter"               // brand look rides in the adapter, not the stream
}
```

### The install flow

Installation reads as one line in the host's source —
`provideA2UI({ catalogs: { [KAL_ID]: KAL_REACT_CATALOG } })` — but mechanically it
is a short sequence. Across three phases, from the brand's release to the first
rendered surface:

**Phase 1 — publish (once per release).** The brand uploads manifest + catalog
schema + per-platform adapters to a registry. The registry signs the bundle,
assigns a version, and grants a trust tier. `KAL_ID` is now an installable
address.

**Phase 2 — install (user taps "add app").**

1. Host fetches the manifest by `catalogId`.
2. Host verifies signature and adapter `integrity` hashes.
3. Host shows a **permission consent** screen (payment, location…).
4. Host registers the brand's `capabilities` into its **intent routing table**.
5. Host binds `catalog_id → adapter` in the **catalog registry**, choosing a
   loading strategy by trust tier (static / federated / iframe — see §4).
6. Host registers the **agent URL** in its A2A client pool.

Install is complete — **and not a single screen has been downloaded.**

**Phase 3 — first intent.** The user says *"book me a flight to NYC."* The
orchestrator routes the intent to the KAL agent, calls it over A2A, the agent's
state machine starts the booking workflow and streams an A2UI surface tagged
`KAL_ID`, and the host's surface processor dispatches by tag to
`KAL_REACT_CATALOG`, which draws the inputs as sky-blue Korean Air components.

The load-bearing detail: **the `KAL_ID` registered at install (step 5) is the
same `KAL_ID` dispatched at render.** Registration and dispatch share one
address, so the backend's vocabulary and the frontend's renderer cannot drift —
they are pinned to the same handle.

### Why "no screens downloaded" matters

- **Install size collapses** to schema + adapter code (small). The UI itself is
  generated per intent.
- **Updates bypass store review.** Changing a flow is bumping the agent's logic
  or the catalog version on the server — not shipping new screens through an app
  store. The UI is *generated*, so there is nothing static to re-approve.
- **The same bundle serves every platform.** One `catalog_id`, many adapters
  (`KAL_REACT_CATALOG`, `KAL_ANGULAR_CATALOG`, `KAL_FLUTTER_CATALOG`); the agent
  and stream are invariant.

---

## 3. How the host super-app must be built (React)

If A2UI becomes universal and a host wants to be the super-app many brands plug
into, it needs a specific layered architecture. Each layer answers one question.

```
┌─────────────────────────────────────────────────┐
│  Shell / Chrome    — nav, global layout, session  │
├─────────────────────────────────────────────────┤
│  Orchestrator / Intent Router                     │  ← host IP #1
│    "which brand agent handles this intent?"       │
├─────────────────────────────────────────────────┤
│  A2A Client Pool                                  │
│    per-brand agent connections, surface streams   │
├─────────────────────────────────────────────────┤
│  Surface Host  (A2UI Renderer)                    │  ← the heart
│    surface tree + data model per surfaceId        │
│    tag(KAL_ID) → adapter dispatch                 │
├─────────────────────────────────────────────────┤
│  Catalog Registry  (+ loading policy by tier)     │
│    { KAL_ID: KAL_REACT_CATALOG, ... }             │
├─────────────────────────────────────────────────┤
│  Trust / Payment / Permission Broker              │  ← host IP #2
│    gates sensitive surfaces, proves identity      │
├─────────────────────────────────────────────────┤
│  Platform Services — identity, pay tokens, device │
└─────────────────────────────────────────────────┘
```

**Surface Host** is the core. Per brand surface, the host mounts a renderer that
receives the A2UI stream and diffs the component tree on each update. Concretely
in React: a catalog registry is provided via context; a recursive `<A2UINode>`
looks up `catalog[node.type]` to resolve each abstract type to a real component;
data bindings (e.g. `/dates/start`) resolve against a per-surface store. The
sky-blue is **not** in the stream — the agent sends *"render a `FlightCard`"* and
the host's adapter decides a `FlightCard` is sky-blue. Brand fidelity rides in
the adapter.

**Catalog Registry** is not a plain object. It is a manager that holds, per
`catalog_id`, both the adapter and its **loading policy** (the trust tier). Lookup
returns "which adapter, admitted how."

**Orchestrator** is the routing layer — given many installed brands, decide which
agent owns an incoming intent. This is LLM-based intent classification matched
against each brand's published capability manifest, and it is the host's first
piece of defensible IP.

---

## 4. The one hard problem: admitting third-party adapter code

The clean "one-line install" hides a real tension that dominates the whole
design:

- the adapter must be **code that runs inside the host renderer** (that is what
  makes host-rendered, unified-yet-branded UI possible), but
- that code is **published by a third party** and is not inherently trusted.

This is precisely why WeChat mini-programs forbid arbitrary JS and confine brands
to a fixed component set. This model goes a step further by allowing
brand-defined components, which sharpens the tension rather than removing it. The
host's architecture is, in large part, *the set of answers to "where do we cut
this."* There are three admission strategies, and a real host uses all three,
chosen per trust tier:

| Strategy | Trust | Brand freedom | How it works | Analogy |
|---|---|---|---|---|
| **Build-time static** | host audits the code | low | adapter compiled into the host bundle, reviewed | an npm dependency |
| **Runtime federated** | risky | high | adapter loaded at runtime via module federation | dynamic import |
| **Iframe-isolated** | safe | highest | adapter renders inside a sandbox; host only relays | the app in a sandbox |

The iframe-isolated tier is exactly where the *A2UI-in-MCP-Apps* pattern earns
its place: a sensitive surface (a payment step, say) that the host will not run as
in-process code can be isolated behind a double-iframe sandbox, where the brand
renders it with its own bundled renderer and the host merely relays messages. So
the realistic picture is a **hybrid**: first-party and audited brands render
statically in the host's tree; untrusted or sensitive surfaces render isolated.
"Install" therefore is not literally one path — it is *one of several paths chosen
by trust tier.*

This also means the honest version of the "one-line install" is: **one line at
the call site, but a tiered admission policy underneath.**

---

## 5. How a tech company reorganizes

When an app is `(catalog, agent)`, the unit of work changes, and so does the org
chart. Inside a brand:

- **Catalog / Design-System team.** What the design-system team does now, but the
  deliverable changes from Figma + Storybook to a **publishable catalog package**
  (schema + per-platform adapters). The brand's look — the sky-blue — lives here.
  Versioning is existential: if the agent speaks v2.4 vocabulary while a host has
  a v2.1 adapter installed, surfaces break. Catalog version compatibility
  (semver + capability negotiation) is this team's core responsibility.

- **Agent / Workflow team.** This absorbs what used to be "the frontend team that
  built the screen flows." It owns Contract 2 — the state machine. "search → seat
  → pay, with face-verify gating pay" is expressed as agent policy, not screen
  code. The day-to-day becomes prompt/tool/guardrail operation. In effect this is
  the new shape of a frontend team: it builds the *generator of screens* rather
  than the screens.

- **Backend / Tools team.** Owns Contract 3. Real capabilities (flight-search,
  payment) are exposed as tools the agent can call — much like today's API teams,
  plus a layer that shapes tools (descriptions, schemas) to be agent-callable.

- **Trust / Compliance team.** Identity proof for sensitive surfaces, permission
  scope audits, the boundary of what the host can observe mid-flow. Exists on
  both the brand and host sides.

- **Adapter QA / Compatibility team.** A genuinely new function: verifying one
  catalog renders identically across React / Angular / Flutter hosts and across
  host versions. "My app breaks on this host" becomes a new bug class.

On the **platform (host operator)** side, new sections appear:

- **Catalog Registry / Store** — an npm-meets-App-Store: hosting, signing,
  versioning, and trust-tiering catalog packages.
- **Orchestration / Routing** — the policy, ranking, and possibly auction for
  which brand wins an intent. (Advertising and take-rate economics attach here —
  the search-ranking fight becomes an intent-routing fight.)
- **Sandbox / Runtime Security** — operating the per-tier isolation and the
  adapter-audit pipeline.
- **Payment / Identity Broker** — the infrastructure mediating payment and
  identity between brand and host.

---

## 6. What the paradigm does *not* solve

The protocol (A2UI) and transport (A2A) are the easy, standardized, Google-stewarded
part. They are not the moat. The defensible and genuinely hard work sits in three
places the protocol deliberately leaves open:

1. **Intent routing / orchestration.** With many brands installed, *which agent
   handles this intent?* is unsolved by any protocol. Solving it well is the
   host's core IP.

2. **Trust, payment, and permission boundaries.** A brand agent renders a payment
   step inside the host. Is it really the brand? What does the host see in the
   middle? Where are the permission edges? This is the perennial hard problem of
   every super-app (WeChat, Kakao), and it is trust infrastructure, not a
   rendering concern.

3. **Catalog version management and adapter fidelity.** The agent updates on the
   server instantly; the adapter is installed code that lags. Keeping the two in
   sync — and rendering many brand catalogs faithfully across platforms — is the
   most underestimated operational cost in the model.

The protocol is the road Google paves for free. The product is the orchestration,
the trust/payment layer, and the adapter/version machinery built on top.

---

## 7. Summary

- An app becomes **design system + business logic + a UI generator**, with fixed
  screens removed. "Install" = register a published manifest and point the host
  at a `catalog_id` and an agent URL.
- The runtime transport is **A2A** (surface stream + action events); **MCP lives
  behind the agent** as one way to reach backends, plus an optional isolation
  mechanism for sensitive surfaces. The host is indifferent to what the agent
  does internally.
- The host super-app is a layered system whose heart is a **tag-dispatched A2UI
  renderer**, and whose hardest decision is **how third-party adapter code is
  admitted** — statically, federated, or iframe-isolated, by trust tier.
- The frontend org splits into a **catalog team** and an **agent team**; the
  defensible value moves to the host's **orchestration** and **trust/payment**
  layers. The protocol is the easy part.
