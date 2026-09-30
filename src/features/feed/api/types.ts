import { FeedItem, ProviderId } from "../domain/FeedItem";

export type PageParams = {
  page: number;
  perPage: number;
  signal?: AbortSignal;
};

export type ProviderPage = {
  items: FeedItem[];
  nextPage: number | null;
};

export type ContentProvider = {
  id: ProviderId;
  fetchPage: (params: PageParams) => Promise<ProviderPage>;
};
