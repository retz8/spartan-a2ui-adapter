# The Future of Software: Hyperpersonalization & the Agents Marketplace

> A vision for software after the app. When every person has a super-agent — a
> Jarvis — and every brand publishes an `(agent, catalog)` pair to a public
> registry, the unit of software stops being a downloadable app with fixed
> screens. It becomes a *capability* that any person's agent can summon and
> compose into a surface, on demand, in one shared space.
>
> The thesis in one line: **the app was a place you visited; the agent-OS is a
> space that summons surfaces to you — and the agent's job is to compose those
> surfaces, never to overwrite them.**

---

## 0. TL;DR

- **The app is dissolving as a unit.** Today we juggle tabs and apps, moving
  *ourselves* between screens each app fully owns. That was a constraint of an era
  where apps owned their UI — not an ideal. The agent-OS inverts it: surfaces are
  summoned to a single space as the work demands.
- **Software becomes a marketplace of agents.** A brand publishes one
  `(agent, catalog)` pair to a public registry. From then on, *any* person's
  super-agent can pull that pair and render the brand's surface — register once,
  consumed by N hosts. This is what finally lets small brands, not just giants,
  live inside everyone's Jarvis.
- **Generative UI is the join.** Demand side: everyone has a personalized
  super-agent. Supply side: every brand is one registry entry. The thing that
  binds them is generative UI — the agent composing many brands' surfaces, in the
  moment, into one screen.
- **This is more than standard A2UI (§4).** A2UI renders one agent's surface
  faithfully; the super-agent wraps that with two out-of-protocol layers — an
  *orchestrator* that decomposes raw input and routes sub-prompts to the right
  agents, and a *compositor* that arranges the returned surfaces and computes
  cross-agent facts. The protocol is the free road; these two layers are the
  product.
- **The agent composes; it does not overwrite.** Personalization happens at the
  level of *arrangement, selection, and flow* — not by repainting each brand in
  the user's theme. Each brand's catalog and styling are preserved. This is a
  deliberate stance against an aesthetic filter bubble (§8), and it is what keeps
  the shared visual culture intact.

---

## 1. Is juggling tabs actually ideal?

The current mental model of using software: the user decides on a task, then
*opens* the app or tab that matches it. Twelve browser tabs, eight apps, and a day
spent moving between them. We treat this as normal. But normal is not the same as
ideal — it is a residue of an era where **each app owned its entire screen**, so a
person had to physically travel between those screens to get anything done.

Ask what we actually do offline and the artifice becomes obvious. In a clothing
store you try a jacket from one brand and trousers from another in front of *one*
mirror. At a car event you walk between Tesla, Hyundai, and BMW in one afternoon,
one hall. The physical world lets capabilities converge on you. Digital software,
oddly, *fragmented* that — it shattered the single mirror into a dozen app
boundaries and called it organization.

The agent-OS restores the natural shape. An app stops being "a place I enter" and
becomes "a capability that puts a surface in front of me when I need it." Movement
between screens is replaced by **summoning of surfaces into one space.** The
computer itself becomes the agent; the brands become things the agent can call.

---

## 2. The worked scenario: fitting clothes across brands

Make it concrete. The user wants to try on outfits.

In today's model: open the Zara app, browse, close it; open the Musinsa app,
browse, close it; open a virtual-fitting app, try to recreate the items from
memory. Three islands, no shared mirror.

In the agent-OS: the user says *"let me try some outfits."* Their super-agent
connects to several brands' agents and to a fitting tool's agent. Each brand agent
streams its garment surface (from its own catalog); the fitting agent provides the
avatar surface; and the **super-agent composes them into one screen** — a single
avatar wearing a Zara top and Musinsa trousers, side by side with alternatives.

This is the move fixed widgets structurally cannot make. A brand can pre-build its
own fitting widget, but *"a Zara jacket and Musinsa trousers on one avatar"* is a
screen no single brand can pre-author — Zara doesn't know Musinsa's clothes, the
fitting app doesn't know either catalog. That screen only exists if three agents
negotiate and compose it **in the moment.** The number of possible combinations is
unbounded; pre-made widgets are by definition finite. Composition has to be
generative.

```
        ┌──────────────── one screen (super-agent composes) ────────────────┐
        │                                                                    │
        │   [Zara surface]      [Musinsa surface]     [Fitting avatar]       │
        │   from Zara catalog   from Musinsa catalog  from fitting catalog   │
        │        │                    │                     │                │
        └────────┼────────────────────┼─────────────────────┼───────────────┘
                 │                    │                     │
            Zara agent          Musinsa agent         Fitting agent
            (a2ui surface)      (a2ui surface)        (a2ui surface)
                 └────────────── super-agent orchestrates ───┘
```

---

## 3. Ordering: the super-agent routes, brands keep the logic

The fitting is only half the loop. The user picks a top from brand A and trousers
from brand B and says *"order these."* Here the super-agent acts as an
**orchestrator that distributes each order to the owning brand's agent** — the top
order to A's agent, the trousers order to B's agent. The decisive property:

**Payment and fulfillment logic stay inside each brand's agent.** The super-agent
does not *process* payment; it *routes* the request. Each brand's agent holds its
own checkout, its own compliance, its own responsibility, and returns its own
confirmation surface. The super-agent gathers those confirmations into one view.

This is why the host can handle thousands of brands without absorbing any brand's
backend. The host is a switchboard, not a bank. The host never sees inside the
brand's agent — that indifference is exactly what makes the marketplace scale.

```
user: "order the top (A) and the trousers (B)"
        │
   super-agent (orchestrator)
        ├──── order:top ────▶ Brand A agent ──▶ A's checkout ──▶ confirm surface ─┐
        └──── order:trousers ▶ Brand B agent ──▶ B's checkout ──▶ confirm surface ─┤
                                                                                   ▼
                                          super-agent composes both confirmations into one view
```

---

## 4. What the super-agent adds on top of A2UI

It is worth being precise here, because the model is easy to mistake for plain
A2UI. Standard A2UI is **one agent ↔ one renderer**: an agent emits a surface and
the renderer draws it faithfully, from the catalog, exactly as sent. The renderer
is *passive* — it does not decide what to draw or in what order; all of that
judgment lives in the single agent. There is no step for "which agent should this
go to," and no notion of "combine several surfaces" — surfaces are independent.

The super-agent keeps that faithful rendering at the leaf, but wraps it in **two
active layers that live outside the A2UI protocol** — and those two layers are
where the host's real work and IP sit.

**Layer 1 — the orchestrator (input → routing).** A person's raw input ("what
should I eat tonight") has nowhere to land in plain A2UI, which assumes an
*already-chosen* agent is emitting a surface. The host adds a layer in front that:
interprets the intent, decides *which* agents it implicates, and splits it into
per-agent sub-prompts it routes out (to the delivery agents, "is this deliverable
now?"; to the health agent, "what's today's calorie budget?"). This decomposition
and routing is not part of A2UI — it is the host's own logic, the "intent routing
is the host's IP" point made concrete.

**Layer 2 — the compositor (surfaces → one screen).** A standard renderer draws
*one* agent's surface. The host receives *many* and arranges them into a single
screen — three delivery cards plus a YouTube panel plus a unified cart — and
computes cross-agent facts no single agent could produce ("fastest of both: 19
min", "this item vs. your remaining budget"). A2UI has no concept of composing
multiple surfaces; this layer is the host's creation.

So the honest answer to "isn't the UI just what each agent sends via A2UI?" is:
**inside each surface, yes — faithfully, never overwritten; between the surfaces,
no — that arrangement, bridging, and cross-agent reasoning is the host's.**

```
raw input ("eat tonight" → "butter tteok reviews" → "calories")
   │
   ▼
[ host: orchestrator ]              ← outside A2UI · the host's IP
   │ decompose intent + route sub-prompts
   ├──▶ delivery agent ─▶ A2UI surface (menu cards)
   ├──▶ youtube agent  ─▶ A2UI surface (review list)
   └──▶ health agent   ─▶ A2UI surface (calorie budget)
   │
   ▼
[ host: compositor ]               ← outside A2UI · the host's creation
   │ arrange surfaces + compose cross-agent facts (unified cart, calorie verdict)
   │ but each surface's interior is rendered faithfully (no overwrite)
   ▼
one screen
```

Standard A2UI is therefore just *one segment* of this picture — each "agent →
surface" arrow is plain A2UI. The super-agent bundles many such segments, puts a
router before them and a compositor after them. By analogy: standard A2UI is one
interpreter relaying one speaker faithfully; the super-agent is the chair of a
meeting who decides whom to ask what (router) and weaves the answers into one set
of minutes (compositor). The interpreting is faithful; deciding whom to ask and
how to weave is the chair's judgment.

This is not a weakness of the idea — it locates its value. The A2UI protocol (the
standard for rendering each surface) is the free road. The host's difficulty and
defensibility live entirely in the two out-of-protocol layers: orchestration (how
well it decomposes and routes) and composition (how well it weaves). The protocol
is the easy part; these layers are the product.

---

## 5. The marketplace: register once, summoned by every Jarvis

Here is the structural unlock. For a small brand to live inside conversational AI
*today* means building a bespoke UI app for each host — one for one assistant,
another for the next, integration per platform. That is why in-chat commerce has
so far been a game for giants. The long tail can't afford it.

In the agent-OS, the brand does it **once**: publish an `(agent, catalog)` pair to
a public registry. From then on, *any* host — *any* person's personalized Jarvis —
can pull that pair and summon the brand's surface. The brand integrates with no
one in particular and is therefore available to everyone.

```
Conventional:  brand ──build app──▶ Host 1
               brand ──build app──▶ Host 2     (integrate per host: doesn't scale)
               brand ──build app──▶ Host 3

Agent-OS:      brand ──register once──▶  [ public registry: (agent, catalog) ]
                                               │      │      │
                                          Jarvis A  Jarvis B  Jarvis C ...
                                          (each summons & composes on demand)
```

Two axes multiply:

- **Demand side:** everyone has a personalized super-agent.
- **Supply side:** every brand is a single registry entry, exposed to all agents
  at once.
- **The join:** generative UI — in the moment, a person's agent summons the
  relevant brands' surfaces and composes them into one screen.

When these hold together, the thirty-year-old unit of "app store → download app →
launch app" gives way to "registry → connect agent → summon surface." The app, as
a downloadable container of screens, dissolves.

---

## 6. Does the agent still need the brand's catalog?

A genuine open question, and the answer is yes — but a specific *kind* of catalog.
Consider shopping for a car across Tesla, Hyundai, BMW, Kia. Each brand has its own
font, color, restraint or weight. This is branding, and branding is inseparable
from the business — half of why someone buys a BMW is its *BMW-ness*, and that
ness lives in the type, the spacing, the palette.

So two forces meet:

- **Brand identity is part of the product.** Brands need their catalog to control
  that identity. → the catalog is necessary.
- **Hyperpersonalization hands UI decisions to the user.** → does the brand's
  styling survive?

The resolution is to see a catalog as **two layers:**

| Layer | What it holds | Who owns it | Personalizable? |
|-------|---------------|-------------|-----------------|
| **Structure / meaning** | "there is a `TrimSelector`, a `RangeSlider`, a price breakdown" — and *which* options, in what order | the brand (it is business logic) | no — Tesla showing 3 trims and Hyundai showing 7 is strategy, not decoration |
| **Style / expression** | font, color, corner radius, motion, density | the brand (it ships a default) | the structure is fixed; the styling is the brand's own and is preserved |

Tesla gives few trims and emphasizes range; Hyundai gives many and emphasizes
price. That structural difference *is* the business and cannot be themed away. The
catalog is therefore necessary — but its job is to **fix the structure and carry
the brand's own expression**, not to be a frozen sheet of pixels. That is also the
line that separates this from an HTML-in-iframe widget, where structure and style
are fused into one rigid block: only a declarative catalog can keep the skeleton
while remaining a clean, composable surface.

---

## 7. The agent composes; it does not overwrite

This is the heart of the stance, and it resolves a temptation that the previous
section raises. If the host can arrange surfaces, why not let it also *restyle*
them — paint every brand in the user's favorite theme (every surface in
Spider-Man red for the Spider-Man superfan)?

**Because that is the wrong job for the agent.** The super-agent's role is
**composition** — *which* surfaces appear, *how* they are arranged, *what* flows
into what, *what* gets selected and compared. It is the editor of the page, not
the repainter of its contents. Each brand's catalog and styling are **preserved**:
Tesla stays Tesla, BMW stays BMW, even as they sit on one screen the user's agent
assembled.

So on a single car-shopping screen, the agent decides the layout, the comparison,
the flow from browse to configure to order — but the Tesla surface still looks like
Tesla and the BMW surface still looks like BMW. The personalization is in the
*composition*, not in a coat of paint over everyone's identity.

This is a design decision with a reason behind it, which §8 makes explicit.

---

## 8. The shadow: hyperpersonalization and the aesthetic filter bubble

A vision document that only shows the bright side is not trustworthy. This one has
a real shadow, and facing it is what makes the rest credible.

### 7.1 The concern

We already know **filter bubbles** from content recommendation: seeing only what
we already like narrows the world. There is an aesthetic version. Today, visiting
BMW's site forces BMW's weight on you; Tesla's forces minimalism; an indie brand
forces something strange. That *unchosenness* is involuntary exposure to other
sensibilities — design you didn't pick, arriving anyway. An agent that themed
everything to your taste would erase exactly that.

Three reasons the aesthetic version may be worse than the informational one:

1. **Taste is built by exposure.** No one is born loving one style; taste *forms*
   by colliding with many designs. An agent that pre-unifies everything to your
   current taste cuts off the very input taste grows from — a hardening of the
   aesthetic arteries, frozen at the taste you had at seventeen.
2. **Brand aesthetics are shared cultural vocabulary.** Tiffany blue, Ferrari red,
   the golden arches — not mere colors, but a visual language a society holds in
   common. If every person's agent overpaints brand colors with a private theme,
   that shared vocabulary fragments. We stop pointing at the same thing when we
   say "Ferrari red."
3. **Creativity comes from collision.** New design tends to emerge from the
   unexpected juxtaposition of unlike things. Pre-sort everything into one taste
   and the collisions vanish, leaving only the smooth surface of the familiar.

### 7.2 Why this is a choice, not a fate

The harm is not intrinsic to the technology — it is a property of how the agent is
*tuned*. Recommendation isn't evil; it became corrosive when tuned for a single
objective, engagement. The same generative-UI capability tuned to *widen* a
person's field would do the opposite of narrowing it.

- A **bad agent**: "this person likes Spider-Man → Spider-Man forever" (the
  comfort-maximizing, engagement model).
- A **healthy agent**: composes faithfully, preserves each brand's identity, and
  deliberately keeps the encounter with unlike aesthetics intact.

### 7.3 The resolution: compose, don't overwrite

The stance of §7 *is* the safeguard. Because the agent composes rather than
repaints, brand identity — and with it the shared visual vocabulary — is preserved
by construction. The Spider-Man fan gets a screen *arranged* for them (what
appears, in what order, with what flow), while Tesla still looks like Tesla and
Ferrari red is still Ferrari red. Personalization lives in arrangement; identity
and cultural signal live in the untouched surfaces.

The non-override rule, in other words, is not only an aesthetic nicety — it is the
ethical line that prevents the aesthetic filter bubble. Keep composition for the
user; keep expression for the brand.

### 7.4 The residue we cannot fully design away

Honesty requires admitting a deeper question remains. Even with non-override, an
agent that only ever summons "what you'd like" still narrows serendipity. The
common aesthetic ground a society once shared — the same ads, the same brand
feelings — was annoying, but it was also a kind of social glue. As experience
personalizes, what shared sensory ground is left?

A paradox follows, and it is the most interesting thing in this document: **an
agent that only gives you what you already like is not actually a good agent.** A
good assistant, curator, or friend sometimes hands you what you *weren't* looking
for — "this isn't your taste, but look." So the best-built Jarvis personalizes
*less* than it could; it designs in **intentional friction**, occasionally
breaking comfort to keep its person growing. Non-override handles the brand side of
the problem; intentional friction handles the user side. Neither fully dissolves
the shadow — they only keep it in check, on purpose.

---

## 9. What this is, in the end

- **An app becomes a capability, not a place.** It is an `(agent, catalog)` pair
  in a public registry; "using" it is a person's agent summoning and composing its
  surface, on demand, in one shared space.
- **The marketplace makes the long tail viable.** Register once, be summoned by
  every Jarvis. Small brands enter the same space as giants because integration is
  publication, not per-host engineering.
- **The catalog is necessary, in two layers.** Structure (the brand's business
  logic) is fixed; expression (the brand's identity) is the brand's own and is
  preserved. Only a declarative catalog can keep the skeleton while staying
  composable.
- **The agent composes; it never overwrites.** Personalization is arrangement,
  selection, and flow — not a coat of paint over every brand. This is both the
  design stance and the ethical guard against an aesthetic filter bubble.
- **The shadow is real and only partly solvable.** Compose-don't-overwrite
  protects shared visual culture; intentional friction protects the user's growth.
  The honest promise is not "no shadow" — it is "the shadow, kept deliberately in
  check."

The era of apps was one where brands owned the UI and users visited it. The
agent-OS is one where brands publish capabilities and each person's agent summons
them into a UI of its own composition — faithful to every brand, arranged for one
person. Generative UI is the medium of that shift, and the discipline of *composing
without overwriting* is what keeps it humane.