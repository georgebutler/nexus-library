import {
  createIgdbClient,
  IgdbClientError,
  type IgdbQueryClient,
} from "@/app/lib/igdb-client";
import {
  getIgdbGame,
  getDiscoverIgdbGames,
  parsePageSize,
  searchIgdbGames,
} from "@/app/lib/igdb-catalog";
import type { GamesApiResponse } from "@/app/types/game";

export const runtime = "nodejs";

let igdbClient: IgdbQueryClient | null = null;
let igdbCredentialsKey = "";

function getIgdbClient(clientId: string, clientSecret: string) {
  const credentialsKey = `${clientId}:${clientSecret}`;

  if (!igdbClient || igdbCredentialsKey !== credentialsKey) {
    igdbClient = createIgdbClient({ clientId, clientSecret });
    igdbCredentialsKey = credentialsKey;
  }

  return igdbClient;
}

export async function GET(request: Request) {
  const clientId = process.env.IGDB_CLIENT_ID?.trim();
  const clientSecret = process.env.IGDB_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return Response.json(
      {
        error:
          "The game catalog is not configured. Add the required credentials to your environment variables.",
        code: "MISSING_CREDENTIALS",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const id = searchParams.get("id")?.trim();
  const mode = searchParams.get("mode")?.trim();
  const isPopular = mode === "popular";

  if (
    (mode && !isPopular) ||
    (isPopular && (searchParams.has("id") || searchParams.has("search")))
  ) {
    return Response.json(
      {
        error: "Search, game detail, and popular requests must be separate.",
        code: "INVALID_REQUEST",
      },
      { status: 400 },
    );
  }

  if (id && !/^\d+$/.test(id)) {
    return Response.json(
      { error: "The game id must be numeric.", code: "INVALID_REQUEST" },
      { status: 400 },
    );
  }

  if (!id && !isPopular && (!search || search.length < 2)) {
    return Response.json(
      {
        error:
          "Provide a search term with at least two characters, a game id, or mode=popular.",
        code: "INVALID_REQUEST",
      },
      { status: 400 },
    );
  }

  try {
    const client = getIgdbClient(clientId, clientSecret);

    if (id) {
      const result = await getIgdbGame(client, Number(id));

      if (!result) {
        return Response.json(
          { error: "Game not found.", code: "CATALOG_ERROR" },
          { status: 404 },
        );
      }

      return Response.json({ result }, {
        headers: {
          "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
        },
      });
    }

    const results = isPopular
      ? await getDiscoverIgdbGames(client)
      : await searchIgdbGames(
          client,
          search ?? "",
          parsePageSize(searchParams.get("page_size")),
        );
    const responsePayload: GamesApiResponse = {
      count: results.length,
      results,
    };

    return Response.json(responsePayload, {
      headers: {
        "Cache-Control": isPopular
          ? "s-maxage=3600, stale-while-revalidate=86400"
          : "s-maxage=300, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    const message =
      error instanceof IgdbClientError
        ? error.message
        : "Unable to reach the game catalog. Check your connection and try again.";
    const status =
      error instanceof IgdbClientError && error.kind === "authentication"
        ? 502
        : 503;

    return Response.json(
      {
        error: message,
        code: "CATALOG_ERROR",
      },
      { status },
    );
  }
}
