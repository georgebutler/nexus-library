import { afterEach, describe, expect, it, vi } from "vitest";

describe("GET /api/games", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("returns a provider-neutral missing credentials error", async () => {
    vi.stubEnv("IGDB_CLIENT_ID", "");
    vi.stubEnv("IGDB_CLIENT_SECRET", "");
    const { GET } = await import("@/app/api/games/route");

    const response = await GET(
      new Request("http://localhost/api/games?search=portal"),
    );

    await expect(response.json()).resolves.toEqual({
      error:
        "The game catalog is not configured. Add the required credentials to your environment variables.",
      code: "MISSING_CREDENTIALS",
    });
    expect(response.status).toBe(503);
  });

  it("maps upstream authentication failures to catalog errors", async () => {
    vi.stubEnv("IGDB_CLIENT_ID", "client");
    vi.stubEnv("IGDB_CLIENT_SECRET", "invalid-secret");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: 400 }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const { GET } = await import("@/app/api/games/route");

    const response = await GET(
      new Request("http://localhost/api/games?search=portal"),
    );

    await expect(response.json()).resolves.toEqual({
      error: "The game catalog rejected the configured credentials.",
      code: "CATALOG_ERROR",
    });
    expect(response.status).toBe(502);
  });

  it("rejects mixed popular and search requests before upstream calls", async () => {
    vi.stubEnv("IGDB_CLIENT_ID", "client");
    vi.stubEnv("IGDB_CLIENT_SECRET", "secret");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { GET } = await import("@/app/api/games/route");

    const response = await GET(
      new Request(
        "http://localhost/api/games?mode=popular&search=portal",
      ),
    );

    await expect(response.json()).resolves.toEqual({
      error: "Search, game detail, and popular requests must be separate.",
      code: "INVALID_REQUEST",
    });
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
