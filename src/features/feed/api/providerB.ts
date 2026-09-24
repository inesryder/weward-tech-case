import { z } from "zod";
import { FeedItem } from "../domain/FeedItem";
import { id, optionalString, requiredString } from "../../../app/parse";
import { fetchProviderPage } from "./fetchProviderPage";
import { ContentProvider } from "./types";

const media = z
  .object({ url: optionalString, alt: optionalString })
  .nullable()
  .catch(null);

const unixSeconds = z
  .number()
  .transform((seconds) => seconds * 1000)
  .pipe(z.coerce.date());

export const providerBItemSchema = z
  .object({
    id,
    headline: requiredString,
    media,
    ts: unixSeconds,
    link: requiredString,
    source: optionalString,
  })
  .transform(
    (raw): FeedItem => ({
      id: raw.id,
      provider: "provider-b",
      title: raw.headline,
      imageUrl: raw.media?.url ?? null,
      imageAlt: raw.media?.alt ?? null,
      publishedAt: raw.ts,
      url: raw.link,
      author: raw.source,
      tags: [],
      sectionHint: null,
    }),
  );

export const providerB: ContentProvider = {
  id: "provider-b",
  fetchPage: (params) => fetchProviderPage("provider-b", providerBItemSchema, params),
};
