import { FeedItem } from "../domain/FeedItem";
import { fetchJson, JsonServerPage } from "../../../app/http";
import { asDate, asId, asNonEmptyString, asStringArray, normalizeAll } from "../../../app/parse";
import { ContentProvider } from "./types";

/**
 * Raw provider A schema.
 * Known quirks: `title` can be null (see "a-bad-1").
 */
export type ProviderAItem = {
  id: string;
  title: string | null;
  image: string;
  publishedAt: string; // ISO 8601 datetime
  ctaUrl: string;
  author: string;
  tags: string[];
};

export function normalizeProviderAItem(raw: ProviderAItem): FeedItem | null {
  const id = asId(raw.id);
  const title = asNonEmptyString(raw.title);
  const url = asNonEmptyString(raw.ctaUrl);
  const publishedAt = asDate(raw.publishedAt);
  if (!id || !title || !url || !publishedAt) return null;

  return {
    id,
    provider: "provider-a",
    title,
    imageUrl: asNonEmptyString(raw.image),
    imageAlt: null,
    publishedAt,
    url,
    author: asNonEmptyString(raw.author),
    tags: asStringArray(raw.tags),
    sectionHint: null,
  };
}

export const providerA: ContentProvider = {
  id: "provider-a",
  async fetchPage({ page, perPage, signal }) {
    const res = await fetchJson<JsonServerPage<ProviderAItem>>(
      `/provider-a?_page=${page}&_per_page=${perPage}`,
      signal,
    );
    return {
      items: normalizeAll("provider-a", res.data, normalizeProviderAItem),
      nextPage: res.next ?? null,
    };
  },
};
