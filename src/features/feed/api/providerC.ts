import { z } from "zod";
import { FeedItem } from "../domain/FeedItem";
import { id, optionalString, requiredString } from "../../../app/parse";
import { createProvider, fetchProviderPage } from "./fetchProviderPage";

const calendarDate = z.iso.date().transform((value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
});

const sectionHint = z.enum(["featured", "browse", "discover"]).nullable().catch(null);

export const providerCItemSchema = z
  .object({
    id: id.transform((rawId) => `c-${rawId}`),
    Title: requiredString,
    picture_url: optionalString,
    date_published: calendarDate,
    action_url: requiredString,
    byline: optionalString,
    section_hint: sectionHint,
  })
  .transform(
    (raw): FeedItem => ({
      id: raw.id,
      provider: "provider-c",
      title: raw.Title,
      imageUrl: raw.picture_url,
      imageAlt: null,
      publishedAt: raw.date_published,
      url: raw.action_url,
      author: raw.byline,
      tags: [],
      sectionHint: raw.section_hint,
    }),
  );

export const providerC = createProvider("provider-c", providerCItemSchema);

export async function fetchProviderCFeatured({
  limit,
  signal,
}: {
  limit: number;
  signal?: AbortSignal;
}): Promise<FeedItem[]> {
  const { items } = await fetchProviderPage(
    "provider-c",
    providerCItemSchema,
    { page: 1, perPage: limit, signal },
    { section_hint: "featured" },
  );
  return items;
}
