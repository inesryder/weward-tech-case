import { FeedItem, ProviderId } from "../domain/FeedItem";
import { ContentProvider } from "./types";

/** Next page to request per provider. A provider missing from the map has no more pages. */
export type ProviderCursors = Partial<Record<ProviderId, number>>;

export type FeedRound = {
  items: FeedItem[];
  failedProviders: ProviderId[];
  nextCursors: ProviderCursors;
};

export function initialCursors(providers: readonly ContentProvider[]): ProviderCursors {
  return Object.fromEntries(providers.map((provider) => [provider.id, 1]));
}

export function hasMoreRounds(cursors: ProviderCursors): boolean {
  return Object.keys(cursors).length > 0;
}

/**
 * Fetches the current page of every provider that still has one, in parallel.
 * A provider that fails keeps its cursor so the page is retried on the next round;
 * the round itself only fails when every provider in it failed.
 */
export async function fetchFeedRound(
  providers: readonly ContentProvider[],
  cursors: ProviderCursors,
  perPage: number,
  signal?: AbortSignal,
): Promise<FeedRound> {
  const active = providers.flatMap((provider) => {
    const page = cursors[provider.id];
    return page === undefined ? [] : [{ provider, page }];
  });
  const results = await Promise.allSettled(
    active.map(({ provider, page }) => provider.fetchPage({ page, perPage, signal })),
  );

  const round: FeedRound = { items: [], failedProviders: [], nextCursors: {} };
  for (const [index, result] of results.entries()) {
    const { provider, page } = active[index];
    if (result.status === "rejected") {
      round.failedProviders.push(provider.id);
      round.nextCursors[provider.id] = page;
      continue;
    }
    round.items.push(...result.value.items);
    if (result.value.nextPage !== null) round.nextCursors[provider.id] = result.value.nextPage;
  }

  if (active.length > 0 && round.failedProviders.length === active.length) {
    throw new Error(`All providers failed: ${round.failedProviders.join(", ")}`);
  }
  return round;
}
