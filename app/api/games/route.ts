import type {
  Game,
  GameGenre,
  GamePlatformFamily,
  GameScreenshot,
  GamesApiResponse,
} from "@/app/types/game";
import { getUniquePlatformFamilies } from "@/app/lib/platforms";

export const runtime = "nodejs";

const RAWG_API_URL = "https://api.rawg.io/api/games";
const MAX_PAGE_SIZE = 12;

type RawGame = Record<string, unknown>;

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sanitizeGenres(value: unknown): GameGenre[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((genre): GameGenre[] => {
    if (!genre || typeof genre !== "object") {
      return [];
    }

    const rawGenre = genre as RawGame;
    const name = asString(rawGenre.name);
    const slug = asString(rawGenre.slug);

    if (!name || !slug) {
      return [];
    }

    return [
      {
        id: asNumber(rawGenre.id),
        name,
        slug,
      },
    ];
  });
}

function sanitizeScreenshots(value: unknown): GameScreenshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((screenshot): GameScreenshot[] => {
    if (!screenshot || typeof screenshot !== "object") {
      return [];
    }

    const rawScreenshot = screenshot as RawGame;
    const image = asString(rawScreenshot.image);

    return image
      ? [
          {
            id: asNumber(rawScreenshot.id),
            image,
          },
        ]
      : [];
  });
}

function sanitizeNamedItems(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): string[] => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const name = asString((item as RawGame).name);
    return name ? [name] : [];
  });
}

function sanitizePlatforms(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): string[] => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const platform = (item as RawGame).platform;

    if (!platform || typeof platform !== "object") {
      return [];
    }

    const name = asString((platform as RawGame).name);
    return name ? [name] : [];
  });
}

function sanitizePlatformFamilies(value: unknown): GamePlatformFamily[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return getUniquePlatformFamilies(
    value.flatMap((item): GamePlatformFamily[] => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const platform = (item as RawGame).platform;

      if (!platform || typeof platform !== "object") {
        return [];
      }

      const rawPlatform = platform as RawGame;
      const name = asString(rawPlatform.name);
      const slug = asString(rawPlatform.slug);

      if (!name || !slug) {
        return [];
      }

      return [
        {
          id: asNumber(rawPlatform.id),
          name,
          slug,
        },
      ];
    }),
  );
}

function sanitizeWebsite(value: unknown): string | null {
  const website = asString(value);

  if (!website) {
    return null;
  }

  try {
    const parsedUrl = new URL(website);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
      ? parsedUrl.toString()
      : null;
  } catch {
    return null;
  }
}

function sanitizeGame(rawGame: unknown): Game | null {
  if (!rawGame || typeof rawGame !== "object") {
    return null;
  }

  const game = rawGame as RawGame;
  const id = asNumber(game.id);
  const name = asString(game.name);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    slug: asString(game.slug) ?? String(id),
    background_image: asString(game.background_image),
    description: asString(game.description_raw),
    website: sanitizeWebsite(game.website),
    released: asString(game.released),
    rating: asNumber(game.rating),
    metacritic:
      typeof game.metacritic === "number" ? game.metacritic : null,
    genres: sanitizeGenres(game.genres),
    platforms: sanitizePlatforms(game.platforms),
    platformFamilies: sanitizePlatformFamilies(game.parent_platforms),
    developers: sanitizeNamedItems(game.developers),
    publishers: sanitizeNamedItems(game.publishers),
    short_screenshots: sanitizeScreenshots(game.short_screenshots),
  };
}

async function fetchGameScreenshots(
  gameId: string,
  apiKey: string,
): Promise<GameScreenshot[]> {
  const screenshotsUrl = new URL(`${RAWG_API_URL}/${gameId}/screenshots`);
  screenshotsUrl.searchParams.set("key", apiKey);
  screenshotsUrl.searchParams.set("page_size", "6");

  try {
    const response = await fetch(screenshotsUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return [];
    }

    const payload: unknown = await response.json();
    return payload && typeof payload === "object"
      ? sanitizeScreenshots((payload as RawGame).results)
      : [];
  } catch {
    return [];
  }
}

function parsePageSize(value: string | null): number {
  const pageSize = Number(value);

  if (!Number.isInteger(pageSize) || pageSize < 1) {
    return 8;
  }

  return Math.min(pageSize, MAX_PAGE_SIZE);
}

export async function GET(request: Request) {
  const apiKey = process.env.RAWG_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error:
          "The game catalog is not configured. Add the required API key to your environment variables.",
        code: "MISSING_API_KEY",
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

  const rawgUrl = id
    ? new URL(`${RAWG_API_URL}/${id}`)
    : new URL(RAWG_API_URL);

  rawgUrl.searchParams.set("key", apiKey);

  if (!id) {
    rawgUrl.searchParams.set(
      "page_size",
      isPopular
        ? "8"
        : String(parsePageSize(searchParams.get("page_size"))),
    );

    if (isPopular) {
      rawgUrl.searchParams.set("ordering", "-added");
    } else if (search) {
      rawgUrl.searchParams.set("search", search);
      rawgUrl.searchParams.set("search_precise", "true");
    }
  }

  try {
    const response = await fetch(rawgUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: id || isPopular ? 3600 : 300 },
    });

    if (!response.ok) {
      const message =
        response.status === 401
          ? "The game catalog rejected the configured API key."
          : "The game catalog is temporarily unavailable. Please try again.";

      return Response.json(
        { error: message, code: "RAWG_ERROR" },
        { status: response.status === 401 ? 502 : 503 },
      );
    }

    const payload: unknown = await response.json();

    if (id) {
      const result = sanitizeGame(payload);

      if (!result) {
        return Response.json(
          { error: "Game not found.", code: "RAWG_ERROR" },
          { status: 404 },
        );
      }

      const shortScreenshots = await fetchGameScreenshots(id, apiKey);

      return Response.json(
        {
          result: {
            ...result,
            short_screenshots:
              shortScreenshots.length > 0
                ? shortScreenshots
                : result.short_screenshots,
          },
        },
        { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } },
      );
    }

    const rawResults =
      payload && typeof payload === "object" && Array.isArray((payload as RawGame).results)
        ? ((payload as RawGame).results as unknown[])
        : [];
    const results = rawResults.flatMap((game) => {
      const sanitizedGame = sanitizeGame(game);
      return sanitizedGame ? [sanitizedGame] : [];
    });
    const count =
      payload && typeof payload === "object"
        ? asNumber((payload as RawGame).count, results.length)
        : results.length;
    const responsePayload: GamesApiResponse = { count, results };

    return Response.json(responsePayload, {
      headers: {
        "Cache-Control": isPopular
          ? "s-maxage=3600, stale-while-revalidate=86400"
          : "s-maxage=300, stale-while-revalidate=1800",
      },
    });
  } catch {
    return Response.json(
      {
        error:
          "Unable to reach the game catalog. Check your connection and try again.",
        code: "RAWG_ERROR",
      },
      { status: 503 },
    );
  }
}
