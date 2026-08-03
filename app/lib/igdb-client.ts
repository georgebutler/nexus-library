const IGDB_API_URL = "https://api.igdb.com/v4";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const TOKEN_EXPIRY_BUFFER_MS = 60_000;
const REQUEST_INTERVAL_MS = 250;

type FetchOptions = RequestInit & {
  next?: {
    revalidate: number;
  };
};

type FetchLike = (
  input: string | URL | globalThis.Request,
  init?: FetchOptions,
) => Promise<Response>;

type IgdbClientOptions = {
  clientId: string;
  clientSecret: string;
  fetchImpl?: FetchLike;
  now?: () => number;
  requestIntervalMs?: number;
};

type TokenPayload = {
  access_token?: unknown;
  expires_in?: unknown;
};

export class IgdbClientError extends Error {
  constructor(
    message: string,
    readonly kind: "authentication" | "rate_limit" | "upstream",
    readonly status?: number,
  ) {
    super(message);
    this.name = "IgdbClientError";
  }
}

export type IgdbQueryClient = {
  query<T>(
    endpoint: string,
    body: string,
    options?: { revalidate?: number },
  ): Promise<T>;
};

export function createIgdbClient({
  clientId,
  clientSecret,
  fetchImpl = fetch,
  now = Date.now,
  requestIntervalMs = REQUEST_INTERVAL_MS,
}: IgdbClientOptions): IgdbQueryClient {
  let accessToken: string | null = null;
  let tokenExpiresAt = 0;
  let tokenRequest: Promise<string> | null = null;
  let requestQueue = Promise.resolve();
  let nextRequestAt = 0;

  const clearToken = () => {
    accessToken = null;
    tokenExpiresAt = 0;
  };

  const requestToken = async () => {
    const tokenUrl = new URL(TWITCH_TOKEN_URL);
    tokenUrl.searchParams.set("client_id", clientId);
    tokenUrl.searchParams.set("client_secret", clientSecret);
    tokenUrl.searchParams.set("grant_type", "client_credentials");

    const response = await fetchImpl(tokenUrl, {
      method: "POST",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new IgdbClientError(
        "The game catalog rejected the configured credentials.",
        "authentication",
        response.status,
      );
    }

    const payload = (await response.json()) as TokenPayload;
    const token =
      typeof payload.access_token === "string" ? payload.access_token : "";
    const expiresIn =
      typeof payload.expires_in === "number" ? payload.expires_in : 0;

    if (!token || !Number.isFinite(expiresIn) || expiresIn <= 0) {
      throw new IgdbClientError(
        "The game catalog returned an invalid authentication response.",
        "authentication",
      );
    }

    accessToken = token;
    tokenExpiresAt =
      now() + Math.max(0, expiresIn * 1000 - TOKEN_EXPIRY_BUFFER_MS);
    return token;
  };

  const getToken = () => {
    if (accessToken && now() < tokenExpiresAt) {
      return Promise.resolve(accessToken);
    }

    if (!tokenRequest) {
      tokenRequest = requestToken().finally(() => {
        tokenRequest = null;
      });
    }

    return tokenRequest;
  };

  const waitForRequestSlot = () => {
    if (requestIntervalMs <= 0) {
      return Promise.resolve();
    }

    const turn = requestQueue.then(async () => {
      const waitMs = Math.max(0, nextRequestAt - now());

      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      nextRequestAt = now() + requestIntervalMs;
    });

    requestQueue = turn.catch(() => undefined);
    return turn;
  };

  const query = async <T>(
    endpoint: string,
    body: string,
    options: { revalidate?: number } = {},
    canRetry = true,
  ): Promise<T> => {
    const token = await getToken();
    await waitForRequestSlot();

    const response = await fetchImpl(`${IGDB_API_URL}/${endpoint}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Client-ID": clientId,
        "Content-Type": "text/plain",
      },
      body,
      ...(options.revalidate
        ? { next: { revalidate: options.revalidate } }
        : { cache: "no-store" }),
    });

    if (response.status === 401 && canRetry) {
      clearToken();
      return query<T>(endpoint, body, options, false);
    }

    if (!response.ok) {
      const kind =
        response.status === 401
          ? "authentication"
          : response.status === 429
            ? "rate_limit"
            : "upstream";

      throw new IgdbClientError(
        kind === "rate_limit"
          ? "The game catalog is busy. Please try again shortly."
          : kind === "authentication"
            ? "The game catalog rejected the configured credentials."
            : "The game catalog is temporarily unavailable.",
        kind,
        response.status,
      );
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new IgdbClientError(
        "The game catalog returned an invalid response.",
        "upstream",
        response.status,
      );
    }
  };

  return { query };
}
