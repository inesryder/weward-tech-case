import { z } from "zod";
import { FeedItem } from "../domain/FeedItem";
import { id, optionalString, requiredString } from "../../../app/parse";
import { fetchProviderPage } from "./fetchProviderPage";
import { ContentProvider } from "./types";

const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((value, ctx) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const rolledOver = date.getMonth() !== month - 1 || date.getDate() !== day;
    if (rolledOver) {
      ctx.issues.push({ code: "custom", message: "Not a real calendar date", input: value });
      return z.NEVER;
    }
    return date;
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

export const providerC: ContentProvider = {
  id: "provider-c",
  fetchPage: (params) => fetchProviderPage("provider-c", providerCItemSchema, params),
};

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
