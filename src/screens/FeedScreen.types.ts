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

/*

Created FeedScreen.types.ts. A few notable quirks in the data worth keeping in mind:
                                                                                                                                                                                                                                                                                                                       
  - Provider A — title can be null (see a-bad-1)                                                                                                                                                                                                                                                                       
  - Provider B — media can be null (see b-no-media), and media.alt is optional; ts is a Unix timestamp in seconds; id is not guaranteed unique (duplicate b-100 exists)                                                                                                                                                
  - Provider C — field is Title (capital T), date_published is YYYY-MM-DD but can be an unparseable string like "yesterday" (see id 9999), and section_hint is a union of known strings or null 

  */
