import { FeedItem } from "../../domain/FeedItem";
import { fetchJson, JsonServerPage } from "../http";
import { asDate, asId, asNonEmptyString, normalizeAll } from "./parse";
import { ContentProvider } from "./types";

/**
 * Raw provider B schema.
 * Known quirks: `media` can be null (see "b-no-media") and `media.alt` is optional;
 * `ts` is a Unix timestamp in seconds; ids are not guaranteed unique (duplicate "b-100").
 */
export type ProviderBMedia = {
  url: string;
  alt?: string;
} | null;

export type ProviderBItem = {
  id: string;
  headline: string;
  media: ProviderBMedia;
  ts: number; // Unix timestamp (seconds)
  link: string;
  source: string;
};

export function normalizeProviderBItem(raw: ProviderBItem): FeedItem | null {
  const id = asId(raw.id);
  const title = asNonEmptyString(raw.headline);
  const url = asNonEmptyString(raw.link);
  if (!id || !title || !url) return null;

  return {
    id,
    provider: "provider-b",
    title,
    imageUrl: asNonEmptyString(raw.media?.url),
    imageAlt: asNonEmptyString(raw.media?.alt),
    publishedAt: typeof raw.ts === "number" ? asDate(raw.ts * 1000) : null,
    url,
    author: asNonEmptyString(raw.source),
    tags: [],
    sectionHint: null,
  };
}

export const providerB: ContentProvider = {
  id: "provider-b",
  async fetchPage({ page, perPage, signal }) {
    const res = await fetchJson<JsonServerPage<ProviderBItem>>(
      `/provider-b?_page=${page}&_per_page=${perPage}`,
      signal,
    );
    return {
      items: normalizeAll("provider-b", res.data, normalizeProviderBItem),
      nextPage: res.next ?? null,
    };
  },
};
