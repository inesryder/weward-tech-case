import { FeedItem, ProviderId } from "../../domain/FeedItem";

export type PageParams = {
  page: number;
  perPage: number;
  signal?: AbortSignal;
};

export type ProviderPage = {
  items: FeedItem[];
  nextPage: number | null;
};

/**
 * A content source. Each implementation owns its raw schema and is responsible
 * for normalizing it into `FeedItem`s before anything leaves the data layer.
 */
export type ContentProvider = {
  id: ProviderId;
  fetchPage: (params: PageParams) => Promise<ProviderPage>;
};
