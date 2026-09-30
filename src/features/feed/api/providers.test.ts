import { providerAData } from "../../../../fixtures/providerA";
import { providerBData } from "../../../../fixtures/providerB";
import { providerCData } from "../../../../fixtures/providerC";
import { logger } from "../../../app/logger";
import { parseEach } from "../../../app/parse";
import { providerAItemSchema } from "./providerA";
import { providerBItemSchema } from "./providerB";
import { providerCItemSchema } from "./providerC";

jest.mock("../../../app/logger");

beforeEach(() => jest.clearAllMocks());

describe("provider A", () => {
  it("keeps valid items and drops the one without a title", () => {
    const items = parseEach("provider-a", providerAItemSchema, providerAData);

    expect(items).toHaveLength(30);
    expect(items.some((item) => item.id === "a-bad-1")).toBe(false);
    expect(logger.error).toHaveBeenCalledWith(
      "malformed_item",
      expect.objectContaining({ source: "provider-a", id: "a-bad-1" }),
    );
  });

  it("maps raw fields to a FeedItem", () => {
    const [item] = parseEach("provider-a", providerAItemSchema, providerAData);

    expect(item).toEqual({
      id: "a-1",
      provider: "provider-a",
      title: "Underground gardens of Fresno",
      imageUrl: "https://picsum.photos/seed/g1/800/600",
      imageAlt: null,
      publishedAt: new Date("2026-05-26T13:41:28.886485+00:00"),
      url: "https://example.com/a/1",
      author: "Alex Lin",
      featured: false,
    });
  });

  it("rejects dates that are not ISO 8601 with an offset", () => {
    const result = providerAItemSchema.safeParse({ ...providerAData[0], publishedAt: "May 26 2026" });

    expect(result.success).toBe(false);
  });
});

describe("provider B", () => {
  it("drops the item without media", () => {
    const items = parseEach("provider-b", providerBItemSchema, providerBData);

    expect(items).toHaveLength(26);
    expect(items.some((item) => item.id === "b-no-media")).toBe(false);
  });

  it("converts Unix seconds and keeps the optional alt text", () => {
    const items = parseEach("provider-b", providerBItemSchema, providerBData);
    const withAlt = items.find((item) => item.id === "b-101");
    const withoutAlt = items[0];

    expect(withoutAlt.publishedAt).toEqual(new Date(providerBData[0].ts * 1000));
    expect(withoutAlt.imageAlt).toBeNull();
    expect(withAlt?.imageAlt).toBe("The forgotten skyscrapers of Yemen");
  });
});

describe("provider C", () => {
  it("namespaces ids and drops the item with an invalid date", () => {
    const items = parseEach("provider-c", providerCItemSchema, providerCData);

    expect(items).toHaveLength(30);
    expect(items[0].id).toBe("c-0");
    expect(items.some((item) => item.id === "c-9999")).toBe(false);
  });

  it("reads calendar dates as local dates", () => {
    const [item] = parseEach("provider-c", providerCItemSchema, providerCData);

    expect(item.publishedAt.getFullYear()).toBe(2026);
    expect(item.publishedAt.getMonth()).toBe(4);
    expect(item.publishedAt.getDate()).toBe(26);
  });

  it("rejects impossible calendar dates", () => {
    const result = providerCItemSchema.safeParse({ ...providerCData[0], date_published: "2026-02-31" });

    expect(result.success).toBe(false);
  });

  it("only flags section_hint 'featured' as featured", () => {
    const hints = ["featured", "browse", "discover", null, 42];
    const flags = hints.map(
      (hint) => providerCItemSchema.parse({ ...providerCData[0], section_hint: hint }).featured,
    );

    expect(flags).toEqual([true, false, false, false, false]);
  });
});

describe("parseEach", () => {
  it("returns no items and logs when the payload is not a list", () => {
    expect(parseEach("provider-a", providerAItemSchema, { data: [] })).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith("malformed_payload", { source: "provider-a" });
  });
});
