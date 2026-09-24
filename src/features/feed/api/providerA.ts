import { z } from "zod";
import { FeedItem } from "../domain/FeedItem";
import { id, optionalString, requiredString, stringList } from "../../../app/parse";
import { createProvider } from "./fetchProviderPage";

const isoDateTime = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

export const providerAItemSchema = z
  .object({
    id,
    title: requiredString,
    image: optionalString,
    publishedAt: isoDateTime,
    ctaUrl: requiredString,
    author: optionalString,
    tags: stringList,
  })
  .transform(
    (raw): FeedItem => ({
      id: raw.id,
      provider: "provider-a",
      title: raw.title,
      imageUrl: raw.image,
      imageAlt: null,
      publishedAt: raw.publishedAt,
      url: raw.ctaUrl,
      author: raw.author,
      tags: raw.tags,
      sectionHint: null,
    }),
  );

export const providerA = createProvider("provider-a", providerAItemSchema);
