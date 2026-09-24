import { z } from "zod";
import { FeedItem } from "../domain/FeedItem";
import { dateString, id, optionalString, requiredString, stringList } from "../../../app/parse";
import { fetchProviderPage } from "./fetchProviderPage";
import { ContentProvider } from "./types";

export const providerAItemSchema = z
  .object({
    id,
    title: requiredString,
    image: optionalString,
    publishedAt: dateString,
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

export const providerA: ContentProvider = {
  id: "provider-a",
  fetchPage: (params) => fetchProviderPage("provider-a", providerAItemSchema, params),
};
