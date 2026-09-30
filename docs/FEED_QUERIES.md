# How the featured query and the feed query work together

The two queries are **independent in the cache but combined in `useFeed`**. They fetch
separately; the connection only happens when `buildFeedSections` merges their data and when
`useFeed` merges their flags.

Files: `src/features/feed/domain/feedQueries.ts`, `useFeed.ts`, `feedSections.ts`.

---

## 1. The two queries (`feedQueries.ts`)

| | `featuredQuery` | `feedRoundsQuery` |
|---|---|---|
| Kind | plain `queryOptions` | `infiniteQueryOptions` |
| Key | `["feed", "featured"]` | `["feed", "rounds"]` |
| Fetches | `fetchProviderCFeatured({ limit: 5 })` → `GET /provider-c?section_hint=featured&_page=1&_per_page=5` | one **round** per page (next page of every provider, in parallel) |
| Data | `FeedItem[]` (up to 5, all `featured: true`) | `{ pages: FeedRound[], pageParams: ProviderCursors[] }` |
| Grows? | no, always one request | yes, `fetchNextPage` adds a round |

They share nothing: separate keys, separate requests, separate loading and error state. Both use
the app's `queryClient` defaults: one retry on failure, and `staleTime` 0.

**Why the featured query exists:** C's featured items are rare in its regular listing (none in
the first 10). Asking the server for them directly makes the Featured section available from
the first screen, without paging through C.

---

## 2. Where they meet (`useFeed.ts`)

```ts
const rounds = useInfiniteQuery(feedRoundsQuery);
const featured = useQuery(featuredQuery);

const sections = buildFeedSections({
  featuredItems: featured.data ?? [],
  rounds: rounds.data?.pages.map((round) => round.items) ?? [],
  featuredLimit: FEATURED_LIMIT,
});
```

`buildFeedSections` (`feedSections.ts`) processes **the featured items first, then each round in
order**:

- **Duplicates:** the first time an id is seen wins. C's featured items also appear in C's
  regular pages later, so those copies are dropped and each item shows once.
- **Placement:** an item with `featured: true` goes to Featured while there are fewer than 5;
  everything else goes to Browse.
- **Consequences:**
  - The Featured order is the featured query's order.
  - If a later round contains a featured item that isn't already shown and Featured still has
    room, it fills a slot. That happens if the featured query failed or returned fewer than 5.
    Once Featured is full, extra featured-flagged items go to Browse.

**The flags are combined too:**

| Flag | Rule | Meaning |
|---|---|---|
| `isLoading` | `rounds.isPending \|\| featured.isPending` | the spinner stays until **both** have finished (success or error), so Featured never pops in above content |
| `isRefreshing` | `rounds.isRefetching \|\| featured.isRefetching` | pull-to-refresh spinner until both are done |
| `failedProviders` | latest round's failures, plus provider C if `featured.isError` | the "Couldn't load: …" header |
| `isLoadingMore`, `hasMore`, `loadFailed` | **rounds only** | the featured query has no pagination |

---

## 3. Lifecycle, step by step

**1. The screen mounts.** Both hooks run in the same render, so both requests start **in
parallel**. `isLoading` is true and the screen shows the spinner.

**2. The first one finishes, usually featured (a single small request).** `isLoading` stays
true because the rounds are still pending. Nothing is shown yet.

**3. Both have finished.** `isLoading` becomes false:

- `sections` is built from both.
- The list renders: Featured carousel, Browse, and Discover groups.
- The tracking hook fires `feed_presented` with `trigger: "initial"`.

**4. Load more** (scrolling to the end):

- `rounds.fetchNextPage()` adds a round. **Only the rounds query changes.**
- `sections` is rebuilt with the same featured items and one more round. Featured items from the
  new round are dropped as duplicates if they're already in Featured.
- The featured query isn't involved.

**5. Pull-to-refresh** (`refresh`):

- The rounds cache is trimmed back to the first round, so pagination restarts instead of
  refetching every loaded round.
- Then **both** queries are refetched in parallel (`Promise.all`).
- While refreshing, the old data stays on screen, with the refresh spinner at the top.
- When both finish, `sections` is rebuilt. Any new featured items appear in the carousel, and
  tracking fires `refresh`.

**6. Retry** ("Tap to retry"): acts on the **rounds only**. If the next page failed it re-fetches
that page, otherwise it refetches the rounds.

---

## 4. When one of them fails

| Situation | Result |
|---|---|
| Featured fails, rounds succeed | The feed shows. Featured is empty, or filled only by featured items that happen to come through the rounds. The header says "Couldn't load: Provider C". Only **pull-to-refresh** retries the featured query; "Tap to retry" doesn't touch it. |
| Rounds fail completely, featured succeeds | `loadFailed` is true. The Featured carousel shows (the list has rows), with "Tap to retry" below it. |
| Both fail | Empty list, with the retry footer. |
| Either one hangs | The 10s timeout, plus one retry, turns it into a normal failure, so `isLoading` can't stay true forever. |

---

## 5. Things worth knowing

- **Waiting for both is a product decision.** A slow featured request delays the whole first
  screen, in exchange for no layout jump. The comment on `isLoading` in `useFeed` explains it.
- **A failed featured query is only retried by pull-to-refresh.** If that matters, `retry` could
  also call `featured.refetch()` when `featured.isError`.
- **Both queries go stale immediately (`staleTime` 0).** If `FeedScreen` were ever unmounted and
  mounted again, both would show their cached data straight away and refetch in the background.
  For the infinite query, that means re-fetching every loaded round in turn, and the
  pull-to-refresh spinner would show (since `isRefreshing` uses `isRefetching`). This doesn't
  happen today, because the app has a single screen that stays mounted, but it would matter once
  navigation is added.
