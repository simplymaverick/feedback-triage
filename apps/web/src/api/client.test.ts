import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "./client";

describe("api client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("createFeedback POSTs to /api/feedback", async () => {
    const mockFetch = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "1", text: "hi", analysis: {} }),
    } as Response);

    await api.createFeedback({ text: "hello" });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/feedback"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("listFeedback builds query string", async () => {
    const mockFetch = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], page: 1, pageSize: 10, total: 0 }),
    } as Response);

    await api.listFeedback({ page: 2, sentiment: "positive", tag: "ux" });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("page=2");
    expect(url).toContain("sentiment=positive");
    expect(url).toContain("tag=ux");
  });

  it("throws with API error message on failure", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { message: "Validation failed", code: "VALIDATION_ERROR" },
      }),
    } as Response);

    await expect(api.createFeedback({ text: "" })).rejects.toThrow(
      "Validation failed",
    );
  });
});
