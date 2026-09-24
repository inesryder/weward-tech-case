# Feed case — submission notes

A React Native (Expo SDK 55) app that aggregates three inconsistent provider feeds into one
scrollable screen with three differently styled sections, and a persisted, optimistic like
feature animated with Rive.

For a detailed walkthrough of the code, see [`TOUR.md`](./TOUR.md).

---

## How to run it

**Prerequisites:** Node 20+, Xcode **26.2 or newer** (required by Expo SDK 55) with an iOS
simulator. The app uses native modules (Rive, MMKV, safe-area-context), so it runs as an Expo
**development build**, not in Expo Go.

```bash
npm install

# terminal 1 — backend (json-server on http://localhost:3000)
npm run server

# terminal 2 — build and launch the dev build (first time, or after native dependency changes)
npx expo run:ios

# afterwards, serving JS changes to the installed app is enough
npm start
```

- On a physical device, replace `localhost` in `src/app/config.ts` with your machine's LAN IP.
- `json-server` writes likes back into `db.json`; those changes shouldn't be committed.
- Verified on the iOS simulator. Android wasn't built or tested.

---

## Architecture decisions

### Feature folders with explicit layers

```
src/
  app/        shared infrastructure: http client, zod field schemas, MMKV wrapper, query client, toast
  shared/     domain-blind UI components (SnapCarousel)
  features/
    feed/     api/ → domain/ → view/
    like/     api/ → domain/ → view/
```

- **api** is the only place that knows about raw provider schemas, endpoints, json-server quirks
  and storage keys. It returns domain types only.
- **domain** holds the internal model, business rules, TanStack Query definitions and the hooks
  the view consumes (`useFeed`, `useLike`).
- **view** only renders; it never fetches or transforms. Generic UI that knows nothing about the
  domain lives in `shared/`.

### Normalizing at the boundary, per provider

Each provider is **one Zod schema**: it validates the raw fields and `.transform`s them into a
single `FeedItem`. The schema *is* the provider contract, so there is no separate raw type or
hand-written normalizer to keep in sync. External data is never trusted:

- items missing an id, title, image, link, author or a **valid date** are dropped as malformed,
  with Zod's reason logged in dev (`a-bad-1` null title, `b-no-media`, `c-9999` with
  `"yesterday"`, impossible dates like `2026-02-31`);
- the only optional field (`imageAlt`) falls back to `null` without dropping the item;
- dates are strict per provider: ISO 8601 with offset for A, Unix seconds for B, `YYYY-MM-DD`
  for C (built as a *local* date so it doesn't display a day early west of UTC);
- provider C's numeric ids are namespaced (`c-3`) so ids are globally unique and match the likes
  resource; duplicate ids (B's repeated `b-100`) are removed when building sections;
- json-server's page envelope and the like records are validated too, not just feed items.

### Pagination as a first-class data concern: "rounds"

One "load more" fetches the next page of **every provider that still has one**, in parallel.
Each provider keeps its own cursor; a provider that fails keeps its cursor and is retried on the
next round, and the round only fails if every provider fails. Rounds are appended in order and
items keep their fetch order, so **loading more never reorders rows already on screen**.
Pull-to-refresh trims back to the first round before refetching. This is modelled as a single
TanStack `infiniteQuery` whose page param is the cursor map.

Every request has a 10 s timeout (a hung backend surfaces as an error instead of an endless
spinner), and failed queries are retried once before the UI offers "Tap to retry".

### Sections: same data, different UI

- **Featured:** provider C items flagged as featured, fetched with a small server-side filtered
  query (they rarely appear in the first pages), shown as a paged hero carousel with a dot
  indicator. *(The brief says one card per row; I chose a carousel deliberately.)*
- **Browse:** every non-featured item, in fetch order, as dense rows. This is the paginated list.
- **Discover:** Browse items grouped by author (≥ 2 items), one author carousel slotted after
  every 10 Browse rows, so Browse can keep growing at the bottom as pages load. An item can
  appear in both Browse and Discover.

The screen is **one virtualized `FlatList`** of typed rows (`header | featured | browse |
discover`); `buildFeedRows` maps domain sections to rows and each row type maps to one component.
Both carousels are thin wrappers around a shared, domain-blind `SnapCarousel`.
Keeping section logic (domain) separate from row layout (view) is what keeps "same data,
different UI" maintainable.

### Likes: optimistic, persisted, reconciled

The backend stores only an absolute `count` per item (no atomic increment, no per-user data), and
json-server generates its own record id on POST. So:

- The button is a **toggle with a count**; "liked by me" is device-local.
- State per item is merged from three sources: server count + record id (query cache), confirmed
  "liked by me" (persisted), and pending taps (in memory). The UI shows `pending ?? confirmed`,
  so a tap is instant, a refetch never clobbers an optimistic tap, and a rollback is just
  dropping the pending entry.
- A small framework-free **sync engine** (`likesStore`) debounces writes (400 ms), keeps at most
  one request in flight per item and only sends the final desired state. On failure it reverts
  and shows a toast.
- **No blink on cold start:** counts and liked flags are seeded from MMKV, then reconciled with
  the server on launch. Only server-confirmed state is persisted.
- The engine takes its dependencies by injection, which let me test its tricky cases (rapid taps,
  taps during a request, failures) without a device.

### Animation driven by state

The Rive view is non-interactive; a `Pressable` handles the tap and the optimistic `isLiked` is
bound to the file's `MainVM.isActive` view-model property. The animation therefore mirrors the
state, including rollbacks, and can't desync from it. The `.riv` file is loaded once for the app
and shared through context.

---

## Libraries and why

| Library | Why |
|---|---|
| **TanStack Query v5** | Already in the starter. Caching, request dedup, infinite queries for pagination, `initialData` seeding for the MMKV cache, and a query cache the likes engine can read and update. |
| **react-native-mmkv** | Synchronous reads at startup, so cached like counts render on the first frame (no blink to zero). Fast and small. |
| **@rive-app/react-native** | The current (Nitro-based) Rive runtime, which supports view-model data binding — needed to drive `isActive` from our state rather than from Rive's own tap handling. |
| **expo-dev-client** | Rive and MMKV are native modules, so Expo Go isn't an option. |
| **React Compiler** | Automatic memoization; no manual `memo` / `useMemo` / `useCallback` in the codebase. |
| **StyleSheet (no UI kit)** | Fastest path to three visibly different sections without adding a styling dependency. |
| **Zod 4** | The case is about the external/internal boundary: a schema per provider is both the contract and the validation, transforms normalize in place, and failures explain *why* an item was dropped. Built-ins like `z.iso.date()` replaced hand-written date checks. |
| **react-native-safe-area-context** | Real safe-area insets for the screen top and the toast, instead of hardcoded offsets. |
| **Custom toast** | A small store + animated host (~100 lines), no dependency, lives in `app/` as shared infrastructure. |

---

## AI tooling

> TODO (Inès): review and adjust this section — it must reflect your own experience.

**Tools.** Claude Code, in the terminal, across the whole case: reading the brief and the data,
designing and implementing the feed and like features, code review, debugging the native build
and the Rive integration, restructuring the architecture, and writing these docs.
*TODO: add any other tools you used (Cursor, Copilot, …).*

**Where it clearly helped me ship faster or better.**
- *Debugging the Rive animation.* Taps updated the like state but the heart didn't animate, with
  no error. The AI confirmed the taps reached the backend, then read the Rive runtime's native iOS
  source and found that view-model property changes don't wake a state machine that has settled
  (only legacy inputs call `playIfNeeded()`). A one-line fix.
- *Native build on Xcode 27.* It traced the build failure to Expo SDK 55 requiring a newer Swift,
  then, after the Xcode upgrade, to a Rive pod declaring an iOS deployment target Xcode 27 rejects,
  and fixed it with a config plugin so it survives `expo prebuild --clean`.
- *Backend quirks.* While testing, it found that json-server ignores the `id` sent on POST, which
  would have broken updates to newly created like records; the model now tracks record ids.
- *Code review.* A review pass caught a real bug (the footer said "You're all caught up." while
  the feed was still loading or had failed) and a timezone bug in provider C's dates.

**Where I overrode, corrected or rejected what it produced — and how I caught it.**
- *Feed ordering.* It sorted the merged feed by date and then had to invent "rounds" sorting to
  keep appends stable. I didn't want sorting at all: items are shown in fetch order.
- *Malformed data.* It kept items with unparseable dates (`publishedAt: null`). I decided a bad
  date makes an item malformed and had it dropped.
- *Product rules it couldn't infer.* I defined the section rules (C's `section_hint`, where
  A/B items go), the author-based Discover section and its placement every 10 Browse items, and
  chose a carousel with an indicator for Featured.
- *`db.json`.* I noticed `db.json` had changed although the brief says not to edit it. Part of it
  came from the AI running json-server directly on the file and sending test writes to my running
  server (it restored those), and part from json-server persisting likes by design. I had it
  revert the file and I keep those changes out of commits.
- *Rive on mount.* I noticed the like animation and sound play when an already-liked item mounts.
  The AI checked the file and the runtime API and showed it can't be fixed client-side (no seek or
  mute; the file only reaches "liked" through the animation). I chose to keep it and raise it with
  design rather than accept a hacky workaround.
- *Simplifying the likes store.* I proposed replacing the custom sync engine with a plain query +
  optimistic mutation. The AI implemented it with the trade-offs laid out (one request per tap,
  rollback edge cases with queued taps); after weighing them I kept the original design.
- *File architecture.* The AI organized the code by technical layer across the whole app:
  `data/`, `domain/`, `queries/`, `features/`, `components/`, `screens/`. Each feature ended up
  spread over six top-level folders, and the boundaries were blurry: fetching lived in `data/`,
  query definitions in `queries/`, business hooks in `features/`, and shared code such as the HTTP
  client sat inside a provider folder. I caught it when reviewing the architecture as a whole
  before moving on, and replaced it with a feature-first layout:
  `app/` for shared infrastructure (HTTP, parsing, MMKV, query client, toast) and
  `features/{feed,like}/{api,domain,view}`. Everything about a feature is now in one place, and
  the api → domain → view dependency direction is visible from the folder structure. I also
  decided where the ambiguous pieces belong: shared code and the toast go in `app/`, Rive stays
  in `like/view` because only the like button uses it, and the reference fixtures move out of
  `src`.
- *Pair review of the whole codebase.* I reviewed every file with the AI, piece by piece, asking
  it to explain and challenge the code, and only accepting edits I agreed with. That's where I
  replaced its hand-written runtime guards with Zod, made author and media required (items
  without them are malformed), created `src/shared` for domain-blind UI, pushed for
  self-explanatory names over comments, and turned down changes I judged not worth it for the
  exercise (e.g. schema-validating MMKV reads, refetch-on-focus).

**What I deliberately wrote by hand, and why.**
*TODO: fill in — e.g. the final styling of the like button (pill background, colors) and cards,
which I tuned by eye in the simulator.*

---

## What I'd do differently with more time

- **Part 3 — tracking.** Not implemented. I'd fire a single `feed_viewed` event from the feed's
  domain layer once the first render settles, carrying: a view id and session id, timestamp, app
  version, and per section the ordered list of `{ itemId, provider, position }` (plus the author
  for Discover groups), and which providers failed — logged to a local buffer.
- **Tests.** Move the scripted checks I ran during development (provider schemas, rounds,
  section building, the likes engine) into Jest, and add React Native Testing Library tests for the
  screen states (loading, partial failure, end of feed, retry).
- **Likes backend.** Ask for an atomic increment/decrement endpoint (or per-user likes): with
  absolute counts, concurrent likes from different users can be lost.
- **Rive file.** Ask design for instant `isActive` transitions plus a separate `tap` trigger, so
  already-liked items render filled without replaying the animation and sound.
- **List performance.** Try FlashList for the mixed-layout list and `expo-image` for image
  caching, and measure on a low-end Android device.
- **Android.** Build and test it (only iOS was verified).
- **Discover leftovers.** Author groups only appear when there are enough Browse rows to reach
  their slot; show remaining groups at the end of the feed.
- **Tooling.** ESLint with the React Compiler / hooks rules, and CI running type-check and tests.
