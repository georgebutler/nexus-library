import type {
  Game,
  GameGenre,
  GamePlatformFamily,
  GameScreenshot,
} from "@/app/types/game";
import {
  derivePlatformFamilies,
  getUniquePlatformFamilies,
} from "@/app/lib/platforms";
import type { IgdbQueryClient } from "@/app/lib/igdb-client";

const MAX_PAGE_SIZE = 12;
const DISCOVER_GAME_COUNT = 20;
const DISCOVER_MINIMUM_RATING_COUNT = 250;
const DISCOVER_MINIMUM_RATING = 80;
const DISCOVER_RELEASED_AFTER = 1_577_836_800;
const SEARCH_REVALIDATE_SECONDS = 300;
const DETAIL_REVALIDATE_SECONDS = 3600;
const DISCOVER_REVALIDATE_SECONDS = 3600;

const GAME_FIELDS = [
  "id",
  "name",
  "slug",
  "summary",
  "first_release_date",
  "total_rating",
  "total_rating_count",
  "aggregated_rating",
  "aggregated_rating_count",
  "cover.image_id",
  "screenshots.id",
  "screenshots.image_id",
  "genres.id",
  "genres.name",
  "genres.slug",
  "platforms.id",
  "platforms.name",
  "platforms.slug",
  "platforms.platform_family.id",
  "platforms.platform_family.name",
  "platforms.platform_family.slug",
  "involved_companies.developer",
  "involved_companies.publisher",
  "involved_companies.company.name",
  "websites.url",
  "websites.type.type",
  "game_type.type",
  "version_parent",
].join(",");

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function escapeApicalypseString(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

export function parsePageSize(value: string | null): number {
  const pageSize = Number(value);

  if (!Number.isInteger(pageSize) || pageSize < 1) {
    return 8;
  }

  return Math.min(pageSize, MAX_PAGE_SIZE);
}

export function createIgdbImageUrl(
  imageId: unknown,
  size: "cover_big_2x" | "screenshot_big_2x",
): string | null {
  const normalizedImageId = asString(imageId);

  return normalizedImageId
    ? `https://images.igdb.com/igdb/image/upload/t_${size}/${normalizedImageId}.jpg`
    : null;
}

function toReleaseDate(value: unknown): string | null {
  const timestamp = asNumber(value);

  if (timestamp === null || timestamp <= 0) {
    return null;
  }

  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function toRating(value: unknown): number | null {
  const rating = asNumber(value);

  if (rating === null) {
    return null;
  }

  return Math.min(5, Math.max(0, rating / 20));
}

function sanitizeGenres(value: unknown): GameGenre[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item): GameGenre[] => {
    const genre = asRecord(item);
    const id = asNumber(genre?.id);
    const name = asString(genre?.name);
    const slug = asString(genre?.slug);

    return id !== null && name && slug
      ? [
          {
            id,
            name: name === "Platform" ? "Platformer" : name,
            slug,
          },
        ]
      : [];
  });
}

function sanitizePlatforms(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.flatMap((item): string[] => {
        const platform = asRecord(item);
        const name = asString(platform?.name);
        return name ? [name] : [];
      }),
    ),
  );
}

function sanitizePlatformFamilies(
  value: unknown,
  platformNames: string[],
): GamePlatformFamily[] {
  if (!Array.isArray(value)) {
    return derivePlatformFamilies(platformNames);
  }

  const families = value.flatMap((item): GamePlatformFamily[] => {
    const platform = asRecord(item);
    const platformId = asNumber(platform?.id);
    const platformName = asString(platform?.name);
    const platformSlug = asString(platform?.slug);
    const upstreamFamily = asRecord(platform?.platform_family);
    const upstreamFamilyName = asString(upstreamFamily?.name);

    if (
      upstreamFamilyName === "Nintendo" &&
      platformId !== null &&
      platformName &&
      platformSlug
    ) {
      return [
        {
          id: platformId,
          name: platformName,
          slug:
            platformName === "Nintendo Switch"
              ? "nintendo-switch"
              : platformName === "Nintendo Switch 2"
                ? "nintendo-switch-2"
              : platformSlug,
        },
      ];
    }

    const derivedFamilies = platformName
      ? derivePlatformFamilies([platformName])
      : [];

    if (derivedFamilies.length > 0) {
      return derivedFamilies;
    }

    const family = upstreamFamily;
    const id = asNumber(family?.id);
    const name = asString(family?.name);
    const slug = asString(family?.slug);

    return id !== null && name && slug ? [{ id, name, slug }] : [];
  });

  return getUniquePlatformFamilies(families);
}

function sanitizeCompanies(
  value: unknown,
  role: "developer" | "publisher",
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.flatMap((item): string[] => {
        const involvement = asRecord(item);
        const company = asRecord(involvement?.company);
        const name = asString(company?.name);

        return involvement?.[role] === true && name ? [name] : [];
      }),
    ),
  );
}

function sanitizeOfficialWebsite(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  for (const item of value) {
    const website = asRecord(item);
    const websiteType = asRecord(website?.type);
    const type = asString(websiteType?.type);
    const url = asString(website?.url);

    if (type !== "Official Website" || !url) {
      continue;
    }

    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
        return parsedUrl.toString();
      }
    } catch {
      // Ignore invalid upstream website URLs.
    }
  }

  return null;
}

function sanitizeScreenshots(value: unknown): GameScreenshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, 7).flatMap((item): GameScreenshot[] => {
    const screenshot = asRecord(item);
    const id = asNumber(screenshot?.id);
    const image = createIgdbImageUrl(
      screenshot?.image_id,
      "screenshot_big_2x",
    );

    return id !== null && image ? [{ id, image }] : [];
  });
}

export function normalizeIgdbGame(value: unknown): Game | null {
  const sourceGame = asRecord(value);
  const id = asNumber(sourceGame?.id);
  const name = asString(sourceGame?.name);

  if (id === null || !name) {
    return null;
  }

  const cover = asRecord(sourceGame?.cover);
  const coverImage = createIgdbImageUrl(cover?.image_id, "cover_big_2x");
  const screenshots = sanitizeScreenshots(sourceGame?.screenshots);
  const platforms = sanitizePlatforms(sourceGame?.platforms);

  return {
    id,
    name,
    slug: asString(sourceGame?.slug) ?? String(id),
    background_image: coverImage,
    hero_image: screenshots[0]?.image ?? coverImage,
    description: asString(sourceGame?.summary),
    website: sanitizeOfficialWebsite(sourceGame?.websites),
    released: toReleaseDate(sourceGame?.first_release_date),
    rating: toRating(sourceGame?.total_rating),
    criticScore: asNumber(sourceGame?.aggregated_rating),
    genres: sanitizeGenres(sourceGame?.genres),
    platforms,
    platformFamilies: sanitizePlatformFamilies(sourceGame?.platforms, platforms),
    developers: sanitizeCompanies(sourceGame?.involved_companies, "developer"),
    publishers: sanitizeCompanies(sourceGame?.involved_companies, "publisher"),
    short_screenshots: screenshots.slice(1),
  };
}

export function buildSearchQuery(search: string, pageSize: number): string {
  return [
    `search "${escapeApicalypseString(search)}"`,
    `fields ${GAME_FIELDS}`,
    "where version_parent = null",
    `limit ${pageSize}`,
  ].join("; ") + ";";
}

export function buildDetailQuery(gameId: number): string {
  return `fields ${GAME_FIELDS}; where id = ${gameId}; limit 1;`;
}

export function buildRecentPopularQuery(now = new Date()): string {
  const endOfToday = new Date(now);
  endOfToday.setUTCHours(23, 59, 59, 999);
  const latestRelease = Math.floor(endOfToday.getTime() / 1000);

  return [
    `fields ${GAME_FIELDS}`,
    `where first_release_date >= ${DISCOVER_RELEASED_AFTER} & first_release_date <= ${latestRelease} & total_rating_count >= ${DISCOVER_MINIMUM_RATING_COUNT} & total_rating >= ${DISCOVER_MINIMUM_RATING} & cover != null & version_parent = null & game_type = 0`,
    "sort total_rating_count desc",
    `limit ${DISCOVER_GAME_COUNT}`,
  ].join("; ") + ";";
}

export async function searchIgdbGames(
  client: IgdbQueryClient,
  search: string,
  pageSize: number,
): Promise<Game[]> {
  const payload = await client.query<unknown[]>(
    "games",
    buildSearchQuery(search, pageSize),
    { revalidate: SEARCH_REVALIDATE_SECONDS },
  );

  return Array.isArray(payload)
    ? payload.flatMap((game) => {
        const normalizedGame = normalizeIgdbGame(game);
        return normalizedGame ? [normalizedGame] : [];
      })
    : [];
}

export async function getIgdbGame(
  client: IgdbQueryClient,
  gameId: number,
): Promise<Game | null> {
  const payload = await client.query<unknown[]>(
    "games",
    buildDetailQuery(gameId),
    { revalidate: DETAIL_REVALIDATE_SECONDS },
  );

  return Array.isArray(payload) ? normalizeIgdbGame(payload[0]) : null;
}

export async function getDiscoverIgdbGames(
  client: IgdbQueryClient,
): Promise<Game[]> {
  const payload = await client.query<unknown[]>(
    "games",
    buildRecentPopularQuery(),
    { revalidate: DISCOVER_REVALIDATE_SECONDS },
  );

  return Array.isArray(payload)
    ? payload.flatMap((game) => {
        const normalizedGame = normalizeIgdbGame(game);
        return normalizedGame?.background_image ? [normalizedGame] : [];
      })
    : [];
}
