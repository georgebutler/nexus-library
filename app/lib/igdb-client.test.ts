import { describe, expect, it, vi } from "vitest";
import {
  createIgdbClient,
  IgdbClientError,
} from "@/app/lib/igdb-client";

function jsonResponse(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createIgdbClient", () => {
  it("reuses a valid token across catalog requests", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "token-one",
          expires_in: 3600,
        }),
      )
      .mockImplementation(() => Promise.resolve(jsonResponse([])));
    const client = createIgdbClient({
      clientId: "client",
      clientSecret: "secret",
      fetchImpl,
      requestIntervalMs: 0,
    });

    await client.query("games", "fields id;");
    await client.query("games", "fields name;");

    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain(
      "id.twitch.tv/oauth2/token",
    );
    expect(fetchImpl.mock.calls[1]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer token-one",
      "Client-ID": "client",
    });
    expect(fetchImpl.mock.calls[2]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer token-one",
    });
  });

  it("deduplicates concurrent token requests", async () => {
    let resolveToken!: (response: Response) => void;
    const tokenResponse = new Promise<Response>((resolve) => {
      resolveToken = resolve;
    });
    const fetchImpl = vi.fn((input) =>
      String(input).includes("id.twitch.tv")
        ? tokenResponse
        : Promise.resolve(jsonResponse([])),
    );
    const client = createIgdbClient({
      clientId: "client",
      clientSecret: "secret",
      fetchImpl,
      requestIntervalMs: 0,
    });
    const first = client.query("games", "fields id;");
    const second = client.query("games", "fields name;");

    resolveToken(
      jsonResponse({
        access_token: "shared-token",
        expires_in: 3600,
      }),
    );
    await Promise.all([first, second]);

    expect(
      fetchImpl.mock.calls.filter(([input]) =>
        String(input).includes("id.twitch.tv"),
      ),
    ).toHaveLength(1);
  });

  it("refreshes expired tokens", async () => {
    let currentTime = 0;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "token-one", expires_in: 120 }),
      )
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "token-two", expires_in: 120 }),
      )
      .mockResolvedValueOnce(jsonResponse([]));
    const client = createIgdbClient({
      clientId: "client",
      clientSecret: "secret",
      fetchImpl,
      now: () => currentTime,
      requestIntervalMs: 0,
    });

    await client.query("games", "fields id;");
    currentTime = 61_000;
    await client.query("games", "fields name;");

    expect(fetchImpl.mock.calls[3]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer token-two",
    });
  });

  it("retries one unauthorized request with a fresh token", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "expired-token", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(jsonResponse({}, 401))
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "fresh-token", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(jsonResponse([{ id: 72 }]));
    const client = createIgdbClient({
      clientId: "client",
      clientSecret: "secret",
      fetchImpl,
      requestIntervalMs: 0,
    });

    await expect(client.query("games", "fields id;")).resolves.toEqual([
      { id: 72 },
    ]);
    expect(fetchImpl.mock.calls[3]?.[1]?.headers).toMatchObject({
      Authorization: "Bearer fresh-token",
    });
  });

  it("maps rate limits to a retryable catalog error", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ access_token: "token", expires_in: 3600 }),
      )
      .mockResolvedValueOnce(jsonResponse({}, 429));
    const client = createIgdbClient({
      clientId: "client",
      clientSecret: "secret",
      fetchImpl,
      requestIntervalMs: 0,
    });

    await expect(client.query("games", "fields id;")).rejects.toMatchObject({
      kind: "rate_limit",
      status: 429,
      message: "The game catalog is busy. Please try again shortly.",
    } satisfies Partial<IgdbClientError>);
  });
});
