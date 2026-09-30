import { providerAData } from "../../../../fixtures/providerA";
import { API_BASE_URL } from "../../../app/config";
import { logger } from "../../../app/logger";
import { fetchProviderPage } from "./fetchProviderPage";
import { providerAItemSchema } from "./providerA";

jest.mock("../../../app/logger");

const fetchMock = jest.fn();

function respondWith(body: unknown) {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => body });
}

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = fetchMock;
});

describe("fetchProviderPage", () => {
  it("requests the page with filters and returns parsed items and the next page", async () => {
    respondWith({ next: 3, data: providerAData.slice(0, 2) });

    const page = await fetchProviderPage(
      "provider-a",
      providerAItemSchema,
      { page: 2, perPage: 2 },
      { section_hint: "featured" },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/provider-a?section_hint=featured&_page=2&_per_page=2`,
      expect.anything(),
    );
    expect(page.items.map((item) => item.id)).toEqual(["a-1", "a-2"]);
    expect(page.nextPage).toBe(3);
  });

  it("treats a garbled next page as the last page", async () => {
    respondWith({ next: "2", data: [] });

    const page = await fetchProviderPage("provider-a", providerAItemSchema, { page: 1, perPage: 10 });

    expect(page.nextPage).toBeNull();
  });

  it("fails and logs when the page envelope is malformed", async () => {
    respondWith({ items: 3 });

    await expect(
      fetchProviderPage("provider-a", providerAItemSchema, { page: 1, perPage: 10 }),
    ).rejects.toThrow();
    expect(logger.error).toHaveBeenCalledWith(
      "provider_failed",
      expect.objectContaining({ providerId: "provider-a", page: 1 }),
    );
  });

  it("does not log a failure when the request was cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    fetchMock.mockRejectedValueOnce(Object.assign(new Error("Aborted"), { name: "AbortError" }));

    await expect(
      fetchProviderPage("provider-a", providerAItemSchema, {
        page: 1,
        perPage: 10,
        signal: controller.signal,
      }),
    ).rejects.toThrow("Aborted");
    expect(logger.error).not.toHaveBeenCalled();
  });
});
