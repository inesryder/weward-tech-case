import { z } from "zod";
import { fetchJson } from "../../../app/http";
import { parseEach } from "../../../app/parse";
import { FeedItem, ProviderId } from "../domain/FeedItem";
import { ContentProvider, PageParams, ProviderPage } from "./types";

const jsonServerPage = z.object({
  next: z.number().int().positive().nullable().catch(null),
  data: z.array(z.unknown()),
});

function toQueryString(params: Record<string, string | number>): string {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

export async function fetchProviderPage(
  providerId: ProviderId,
  itemSchema: z.ZodType<FeedItem>,
  { page, perPage, signal }: PageParams,
  filters: Record<string, string> = {},
): Promise<ProviderPage> {
  const query = toQueryString({ ...filters, _page: page, _per_page: perPage });
  const response = jsonServerPage.parse(await fetchJson(`/${providerId}?${query}`, signal));
  return {
    items: parseEach(providerId, itemSchema, response.data),
    nextPage: response.next,
  };
}

export function createProvider(id: ProviderId, itemSchema: z.ZodType<FeedItem>): ContentProvider {
  return { id, fetchPage: (params) => fetchProviderPage(id, itemSchema, params) };
}
