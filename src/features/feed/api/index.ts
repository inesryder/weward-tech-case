import { providerA } from "./providerA";
import { providerB } from "./providerB";
import { providerC } from "./providerC";
import { ContentProvider } from "./types";

export const CONTENT_PROVIDERS: readonly ContentProvider[] = [providerA, providerB, providerC];

export { providerC, fetchProviderCFeatured } from "./providerC";
export { fetchFeedRound, hasMoreRounds, initialCursors } from "./fetchFeedRound";
export type { FeedRound, ProviderCursors } from "./fetchFeedRound";
export type { ContentProvider } from "./types";
