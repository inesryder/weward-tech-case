import { FeedItem, SectionHint } from "../domain/FeedItem";
import { fetchJson, JsonServerPage } from "../../../app/http";
import { asDate, asId, asNonEmptyString, normalizeAll } from "../../../app/parse";
import { ContentProvider } from "./types";

/**
 * Raw provider C schema.
 * Known quirks: `Title` has a capital T; ids are bare numbers (served as strings by
 * json-server) so we namespace them as "c-<id>" to match the likes resource;
 * `date_published` is "YYYY-MM-DD" but can be invalid (e.g. "yesterday", id 9999); such items are dropped.
 */
export type ProviderCSectionHint = "discover" | "browse" | "featured" | null;

export type ProviderCItem = {
  id: string | number;
  Title: string;
  picture_url: string;
  date_published: string;
  action_url: string;
  byline: string;
  section_hint: ProviderCSectionHint;
};

const SECTION_HINTS: readonly SectionHint[] = ["featured", "browse", "discover"];

function asSectionHint(value: unknown): SectionHint | null {
  return SECTION_HINTS.find((hint) => hint === value) ?? null;
}

export function normalizeProviderCItem(raw: ProviderCItem): FeedItem | null {
  const rawId = asId(raw.id);
  const title = asNonEmptyString(raw.Title);
  const url = asNonEmptyString(raw.action_url);
  const publishedAt = asDate(raw.date_published);
  if (!rawId || !title || !url || !publishedAt) return null;

  return {
    id: `c-${rawId}`,
    provider: "provider-c",
    title,
    imageUrl: asNonEmptyString(raw.picture_url),
    imageAlt: null,
    publishedAt,
    url,
    author: asNonEmptyString(raw.byline),
    tags: [],
    sectionHint: asSectionHint(raw.section_hint),
  };
}

async function fetchProviderCPage(query: string, signal?: AbortSignal) {
  const res = await fetchJson<JsonServerPage<ProviderCItem>>(`/provider-c?${query}`, signal);
  return {
    items: normalizeAll("provider-c", res.data, normalizeProviderCItem),
    nextPage: res.next ?? null,
  };
}

export const providerC: ContentProvider = {
  id: "provider-c",
  fetchPage: ({ page, perPage, signal }) =>
    fetchProviderCPage(`_page=${page}&_per_page=${perPage}`, signal),
};

/**
 * Items provider C explicitly flags as featured. Filtered server-side because they
 * are sparse and rarely appear in the first pages of the regular listing.
 */
export async function fetchProviderCFeatured({
  limit,
  signal,
}: {
  limit: number;
  signal?: AbortSignal;
}): Promise<FeedItem[]> {
  const { items } = await fetchProviderCPage(
    `section_hint=featured&_page=1&_per_page=${limit}`,
    signal,
  );
  return items;
}
