import { z } from "zod";
import { FeedItem } from "../domain/FeedItem";
import { id, optionalString, requiredString } from "../../../app/parse";
import { createProvider } from "./fetchProviderPage";

const media = z.object({ url: requiredString, alt: optionalString });

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
    source: requiredString,
  })
  .transform(
    (raw): FeedItem => ({
      id: raw.id,
      provider: "provider-b",
      title: raw.headline,
      imageUrl: raw.media.url,
      imageAlt: raw.media.alt,
      publishedAt: raw.ts,
      url: raw.link,
      author: raw.source,
      featured: false,
    }),
  );

export const providerB = createProvider("provider-b", providerBItemSchema);
