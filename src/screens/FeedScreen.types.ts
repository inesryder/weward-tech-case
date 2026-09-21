// provider-a
export type ProviderAItem = {
  id: string;
  title: string | null;
  image: string;
  publishedAt: string; // ISO 8601 datetime
  ctaUrl: string;
  author: string;
  tags: string[];
};

// provider-b
export type ProviderBMedia = {
  url: string;
  alt?: string; // optional
} | null;

export type ProviderBItem = {
  id: string;
  headline: string;
  media: ProviderBMedia;
  ts: number; // Unix timestamp (seconds)
  link: string;
  source: string;
};

// provider-c
export type ProviderCSectionHint = "discover" | "browse" | "featured" | null;

export type ProviderCItem = {
  id: string;
  Title: string; // note: capital T
  picture_url: string;
  date_published: string; // "YYYY-MM-DD", may be an invalid string (e.g. "yesterday")
  action_url: string;
  byline: string;
  section_hint: ProviderCSectionHint;
};
