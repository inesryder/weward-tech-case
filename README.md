# Tech Case — Senior React Native Engineer

## Context

You're joining a team that aggregates content from multiple partner providers and displays it in a unified mobile feed. In practice, this means integrating several third-party SDKs and APIs — and as anyone who's done this kind of work knows, **they rarely agree on a schema**. Field names, nesting, date formats, optional vs. required fields all differ from one provider to the next, even when they're describing the same domain concept. Normalizing this at the right layer is half the job.

The product team wants to render this unified content in a single scrollable list — but with **different visual treatments depending on the section** (e.g. hero cards, compact rows, carousels). Users can also **like** items, and we track how many times each item has been liked.

Your job is to design and implement the foundation of this feature.

## The backend

You'll receive a small `json-server` setup with a `db.json` and a start script. It exposes:

- `GET /provider-a` — returns content from provider A.
- `GET /provider-b` — returns content from provider B.
- `GET /provider-c` — returns content from provider C.
- A `likes` resource for the like feature.

The three provider endpoints return inconsistent shapes — different field names, nesting, and formats — even though they describe the same kind of content. Some entries are malformed.

All provider endpoints support standard `json-server` pagination (`?_page=N&_per_page=M`). Responses include `first / prev / next / last / pages / items / data` envelopes.

Treat this as a real backend you don't control. It can be slow. It can fail. It can return things you didn't expect.

## What you'll build

A single React Native screen with:

1. A feed that fetches from the 3 provider endpoints, normalizes the responses, and renders three differently-styled sections.
2. A like feature with a counter that increments, persists to the backend, and animates.
3. A tracking layer that reports what the user actually saw.

## Part 1 — The feed

### Sections to display

Render the **same normalized items** in three sections, each with its own UI:

- **Section 1 — Featured:** large hero cards, one per row, image-forward. Small, fixed set (top 3–5 items).
- **Section 2 — Browse:** compact list rows, dense, text-forward. **Paginated — loads more as the user scrolls.**
- **Section 3 — Discover:** horizontal carousel of medium cards.

The user should be able to scroll the whole screen smoothly. Mixing section layouts in one performant list is part of the exercise. The Browse section in particular needs to handle pagination cleanly — appending without flicker, knowing when there's nothing more to load, and behaving correctly on pull-to-refresh.

Note: some items may legitimately appear in more than one section. Liking an item in one section must update its count everywhere it's shown.

## Part 2 — The like feature

Each item has a like count. Users can tap a like button to increment it.

Requirements:

- The count is **persisted to the same backend** that serves the feed. Standard REST conventions apply.
- The count must also **survive app restarts locally** — users shouldn't see counts blink to zero while we wait for the network on cold start.
- The UI feels **instant** — no waiting on a round-trip before the number moves.
- The like button has a **custom animation** on tap. We'll provide a Rive file from our design team.
- Treat the backend as a real one: requests can be slow or fail. Design for it.

## Part 3 — Tracking what the user saw

When the feed screen mounts, fire **a single tracking event** that captures everything the user has been presented with on this screen view.

The event should carry, at minimum: which items were rendered, which section each appeared in, the order they appeared in within each section, and any metadata that would help analytics make sense of this later (timestamp, session-ish identifier, whatever you think belongs).

You don't need a real analytics backend. Log the event to the console or a local buffer — what matters is the shape of the data and where the event lives in your architecture, not where it's sent.

## A note on design

There's no design spec and no Figma. We're not evaluating visual polish — the three sections need to look *visibly different* from each other so the rendering architecture is doing real work, but beyond that, anything that doesn't embarrass you is fine.

Use whatever gets you to a reasonable baseline quickly: Uniwind, NativeWind, StyleSheet, a UI kit, copy-paste from a previous project. Pick the path that costs you the least time. We use Uniwind on the team if you'd like to try it, but anything you're fastest with is fine. If you spend more than ~30 minutes thinking about styling, you're spending it on the wrong part of this case.

## AI tooling

We expect senior engineers to use AI assistants and want to understand how you work with them. In your README, add a short section covering:

- Which tools you used (Claude Code, Cursor, Copilot, etc.) and on which parts of the case.
- One moment where the AI clearly helped you ship faster or better.
- One moment where you overrode, corrected, or rejected what it produced — and how you caught it.
- Anything you deliberately wrote by hand and why.

We're not looking for a specific ratio of AI-written vs. hand-written code. We want to see judgment.

## Deliverable

- A runnable RN project (Expo is fine, bare RN is fine).
- A short README covering: how to run it, the architecture decisions you made, the libraries you chose and why, the AI tooling section above, and what you'd do differently with more time.

## What we're evaluating

- How you model the boundary between external data and internal types, especially when external sources don't agree with each other.
- How you structure rendering so that "same data, different UI" stays maintainable.
- How you reason about shared, persisted, optimistic state across a local cache and a remote backend.
- How you handle pagination as a first-class concern of your data layer.
- How you shape an analytics event — what's worth including, what isn't, and where the event-firing logic lives in your architecture.
- Animation craft and integration choices.
- Code clarity, naming, and the architecture story you can tell us about it.
- How you collaborate with AI tools — both in the work you submit and live.
- Pragmatism: what you chose to do well, and what you consciously chose not to do.

---

## Getting started

### Prerequisites

- Node.js **20 or later**
- npm (or pnpm/yarn — examples below use npm)
- For running on a device: the **Expo Go** app, or a local iOS simulator / Android emulator

### Install

```bash
npm install
```

### Run the backend

In one terminal:

```bash
npm run server
```

This starts `json-server` on `http://localhost:3000`. Try it:

```bash
curl http://localhost:3000/provider-a?_page=1&_per_page=5
curl http://localhost:3000/provider-b
curl http://localhost:3000/provider-c
curl http://localhost:3000/likes
```

### Run the app

In another terminal:

```bash
npm start
```

Then press `i` for iOS, `a` for Android, or scan the QR code with Expo Go.

> **Note on `localhost`:** on a physical device, `localhost` won't resolve to your machine. Either run on a simulator/emulator, or replace `localhost` in `src/data/config.ts` with your machine's LAN IP (e.g. `192.168.1.42`). For Android emulators, use `10.0.2.2`.

---

## What's in this repo

```
.
├── db.json                  # json-server seed data (three provider shapes + likes)
├── index.ts                 # Expo entry point
├── src/
│   ├── App.tsx              # root component
│   ├── data/
│   │   └── config.ts        # backend base URL
│   └── screens/
│       └── FeedScreen.tsx   # the screen you'll be building
├── app.json                 # Expo config
├── babel.config.js
├── tsconfig.json
└── package.json
```

The repo is intentionally minimal. The `FeedScreen.tsx` is a placeholder — replace it with your implementation. Add folders, files, libraries, and tests as you see fit.

## Submitting

Push to a private repo and share access, or zip and email. Include:

- Your code.
- An updated README explaining how to run it, your architecture decisions, your library choices and why, the AI tooling section described above, and what you'd do differently with more time.
