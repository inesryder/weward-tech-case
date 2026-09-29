# How the feed provider system works

## In one sentence

Each provider knows how to fetch **one page** of its own data and convert it into our
`FeedItem`. A **round** asks every provider for its next page at the same time. TanStack Query
stores the rounds as the pages of an infinite list. The domain then turns the accumulated
rounds into three sections, and the view turns the sections into rows.

```
json-server ──► provider (fetch + validate + map) ──► round (all providers, in parallel)
                                                          │
                     TanStack infiniteQuery: pages = [round1, round2, …]
                                                          │
          featuredQuery ──► buildFeedSections ──► useFeed ──► buildFeedRows ──► FlatList
```

The layers stay strict: `api` knows about the backend, `domain` knows the business rules, and
`view` only renders.

---

## 1. The problem it solves

Three endpoints (`/provider-a`, `/provider-b`, `/provider-c`) describe the same thing, an
article, in three different shapes:

- **Field names differ:** `title`, `headline` and `Title`.
- **Dates differ:** an ISO date-time for A, Unix seconds for B, `YYYY-MM-DD` for C.
- **Some entries are malformed:** a null title, no image, a date of `"yesterday"`.
- **Each endpoint is paginated separately.**

The app wants **one feed**. So the system has to answer three questions: how to make the data
uniform, how to paginate three sources as one, and how to survive one source failing.

---

## 2. A provider: fetch one page, return clean items

**The contract** (`src/features/feed/api/types.ts`). The rest of the system only ever sees
this:

```ts
type ContentProvider = {
  id: ProviderId;                                        // "provider-a" | "provider-b" | "provider-c"
  fetchPage: (params: { page, perPage, signal }) => Promise<{ items: FeedItem[]; nextPage: number | null }>;
};
```

**Making one** (`src/features/feed/api/fetchProviderPage.ts`).
`createProvider("provider-a", providerAItemSchema)` builds that object. Each provider file is
therefore just a Zod schema plus that one line. The three providers are listed in
`CONTENT_PROVIDERS` (`src/features/feed/api/index.ts`).

**What `fetchPage` does** (`fetchProviderPage`):

1. **Builds the URL**, for example `/provider-a?_page=2&_per_page=10`. The provider id doubles
   as the endpoint path.
2. **Validates json-server's page wrapper** with `jsonServerPage`: `data` must be an array, and
   `next` is the next page number. If `next` is broken it becomes `null` ("no more pages").
3. **Parses each item** with `parseEach(providerId, itemSchema, data)`.

**The provider schema** (e.g. `src/features/feed/api/providerB.ts`) is where the provider's
quirks live. It has two steps:

1. `z.object({...})` **checks the raw fields**. For B: `headline`, `media.url`, `ts` (converted
   from seconds to a `Date`), `link`, `source`.
2. `.transform(...)` **maps them to our model**: `headline` → `title`, `media.url` →
   `imageUrl`, `source` → `author`, and so on.

Every provider produces the same `FeedItem` (`src/features/feed/domain/FeedItem.ts`):

```ts
type FeedItem = {
  id: string;           // unique across providers: "a-1", "b-100", "c-3"
  provider: ProviderId;
  title: string;
  imageUrl: string;
  imageAlt: string | null;
  publishedAt: Date;
  url: string;
  author: string;
  featured: boolean;
};
```

**How malformed items are handled** (`src/app/parse.ts`):

- `parseEach` runs `safeParse` on every item. An item that fails is **dropped**, logged in dev
  with Zod's reason, and never breaks the page.
- **Required** fields, which drop the item if missing: id, title, image, link, author and a
  valid date.
- **Optional:** only `imageAlt`, which falls back to `null`.

**Provider-specific rules:**

- **A:** dates must be strict ISO 8601 with an offset.
- **B:** `ts` is Unix seconds.
- **C:** the id becomes `c-<id>`, so it's unique and matches the likes resource; the date must
  be a real calendar date (`2026-02-31` is rejected) and is built as a *local* date;
  `section_hint === "featured"` becomes `featured: true`.

**Why it's built this way:** providers never agree on a schema, so every difference is handled
**at the boundary, in each provider's own file**. Nothing above the `api` layer ever sees raw
data.

---

## 3. A round: all providers, in parallel

**What a round is:** `fetchFeedRound` (`src/features/feed/api/fetchFeedRound.ts`) is one "load
more". It fetches the next page of **every provider that still has one**.

**The key idea is cursors.** `ProviderCursors` records, for each provider, which page to ask
for next:

```ts
{ "provider-a": 2, "provider-c": 3 }   // B is missing → B has no more pages
```

**What `fetchFeedRound` does:**

1. **Picks the providers that are still active:** the ones with a cursor, each paired with its
   page.
2. **Fetches them all at once** with `Promise.allSettled`. `allSettled` never rejects, so one
   provider failing doesn't cancel the others.
3. **Builds the round** from the results:
   - **Success:** its items join the round. If there's a next page, its cursor advances; if
     not, it drops out of the map.
   - **Failure:** the provider is recorded in `failedProviders` and **keeps its current
     cursor**, so the same page is retried in the next round.
4. **Throws only if every active provider failed.** That's the "the feed really didn't load"
   case.

The result is `{ items, failedProviders, nextCursors }`.

**Worked example** (A has 2 pages, B has 1, C has 3, and C's page 2 fails once):

| Round | Requests | Result | Next cursors |
|---|---|---|---|
| 1 | A p1, B p1, C p1 | all succeed | `{ a: 2, c: 2 }` (B exhausted) |
| 2 | A p2, C p2 | C fails | `{ c: 2 }` (A exhausted; C keeps page 2) |
| 3 | C p2 | retry succeeds | `{ c: 3 }` |
| 4 | C p3 | succeeds | `{}` (all done) |

**Why rounds, rather than sorting everything together:** items keep their fetch order and each
round is added **at the end**. So loading more never reorders what's already on screen, and
nothing flickers or jumps.

---

## 4. TanStack Query: rounds become an infinite list

`feedRoundsQuery` (`src/features/feed/domain/feedQueries.ts`) is an `infiniteQuery` where
**each page is a round**:

- **`initialPageParam`** is `initialCursors(...)`, which is every provider at page 1.
- **`queryFn`** is `fetchFeedRound(providers, pageParam, 10, signal)`. The page param *is* the
  cursor map.
- **`getNextPageParam`** returns the round's `nextCursors`, or `undefined` once the map is
  empty. That's how TanStack knows `hasNextPage`.

So `rounds.data.pages` is `[round1, round2, …]`, and TanStack handles loading, caching,
deduplication, cancellation and retries.

**A separate small query, `featuredQuery`**, fetches C's featured items with a server-side
filter (`?section_hint=featured`, first 5). They're rare and wouldn't show up in the first
pages otherwise.

**Around it:**

- `src/app/http.ts` gives every request a 10s timeout, so a hung backend becomes an error rather
  than an endless spinner.
- `queryClient` retries a failed query once before the UI shows an error.

---

## 5. Sections: the business rules

`buildFeedSections` (`src/features/feed/domain/feedSections.ts`) takes the featured items plus
the item arrays of all rounds:

1. **Walks through everything** in order: the featured items first, then round 1, round 2, and
   so on.
2. **Drops duplicate ids**, keeping the first occurrence. B really does send `b-100` twice, and
   featured items also appear in C's regular pages.
3. **Sorts each item:** `featured` items go to **Featured** (up to 5), and everything else goes
   to **Browse**.
4. **Builds Discover** as `groupByAuthor(browse)`: authors with at least 2 items, ordered by
   **when they reach 2 items**. A group that appears after more pages load is added at the end
   rather than inserted ahead of groups already on screen, for the same "never reorder" reason
   as rounds.

The output is `{ featured, browse, discover }`. It's plain data with no React involved, so it's
easy to test.

---

## 6. `useFeed`: the one hook the screen uses

`useFeed` (`src/features/feed/domain/useFeed.ts`) connects everything:

- **Runs** the rounds query and the featured query.
- **Rebuilds `sections`** on every render. The React Compiler memoizes it, so it only
  recomputes when the data changes.
- **`failedProviders`:** partial failures, meaning the latest round's failed providers, plus C
  if the featured query failed.
- **`loadMore`:** fetches the next round, only when `canLoadMore` (there's a next page and
  nothing is already fetching).
- **`refresh`:** pull-to-refresh. It **trims the cache back to the first round**, then
  refetches. Otherwise TanStack would refetch every loaded page.
- **`retry`:** retries the failed next page, or refetches after a failed first load.
- **Flags:**
  - `isLoading` waits for **both** queries, so Featured doesn't pop in later.
  - `loadFailed`, `isLoadingMore`, `hasMore`, `isRefreshing`.

---

## 7. The view

- **`buildFeedRows`** (`src/features/feed/view/feedRows.ts`) flattens the sections into typed
  rows: a Featured header and carousel, a Browse header, then Browse rows, with a
  "Discover more : author" header and carousel after every 10 Browse rows.
- **`FeedScreen`** (`src/features/feed/view/FeedScreen.tsx`) renders them in **one
  `FlatList`**. `onEndReached` calls `loadMore`, and pull-to-refresh calls `refresh`. The footer
  shows a spinner, "Tap to retry" or "You're all caught up."

---

## 8. What happens when things go wrong

| Situation | What happens |
|---|---|
| One item is malformed | Dropped by `parseEach`; the rest of the page is fine |
| Page wrapper is malformed | That provider's page fails, so it's treated like provider failure (next row) |
| One provider fails | The other providers' items still show; its cursor is kept, so it's retried next round; the header lists it |
| Every provider fails in a round | The round throws, TanStack retries once, then "Tap to retry" |
| Backend hangs | 10s timeout, then the same as a failure |
| A provider runs out of pages | It drops out of the cursor map; when the map is empty, "You're all caught up." |

---

## How to explain it in a minute

> "Each provider is just a Zod schema: it validates its own raw format and maps it to our
> shared `FeedItem`, so malformed items are dropped right at the boundary. To paginate three
> sources as one feed, we fetch in *rounds*: one round asks every provider that still has pages
> for its next page, in parallel. Each provider has its own cursor; if one fails it keeps its
> cursor and is retried next round, so one bad provider never blocks the feed. The rounds are
> the pages of a TanStack infinite query. A pure domain function turns them into Featured,
> Browse and Discover. It removes duplicates, and new data is only ever added at the end, so
> loading more never reorders the screen."

**Questions people usually ask:**

- **Why not merge and sort everything by date?** New pages would insert items into the middle
  of rows the user has already seen.
- **Why `allSettled` rather than `all`?** With `all`, one failing provider would throw away the
  other providers' pages.
- **Why is Featured a separate query?** C's featured items are sparse, so a filtered request
  finds them straight away.
- **Where would a fourth provider go?** A new schema file plus `createProvider(...)`, added to
  `CONTENT_PROVIDERS`. Nothing else changes.
