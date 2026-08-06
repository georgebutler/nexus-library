import {
  EMPTY_GAME_FILTERS,
  normalizeGameFilters,
  type GameFilters,
} from "@/app/lib/game-filters";
import {
  normalizeGameSort,
  type GameSort,
} from "@/app/lib/game-sort";

export type LibraryLocationState = {
  collectionId: string;
  genreSlug: string | null;
  query: string;
  page: number;
  sort: GameSort;
  collectionFilters: GameFilters;
  searchFilters: GameFilters;
  discoverFilters: GameFilters;
};

const INTERNAL_BASE_URL = "https://nexus-library.local";
const GENRE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FILTER_PARAMETER_KEYS = {
  collection: { genres: "cg", platforms: "cp" },
  search: { genres: "sg", platforms: "sp" },
  discover: { genres: "dg", platforms: "dp" },
} as const;

function parsePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parseFilters(
  searchParams: URLSearchParams,
  keys: { genres: string; platforms: string },
) {
  return normalizeGameFilters({
    genres: searchParams.getAll(keys.genres),
    platforms: searchParams.getAll(keys.platforms),
  });
}

export function parseLibraryLocation(
  searchParams: URLSearchParams,
  fallbackCollectionId: string,
): LibraryLocationState {
  return {
    collectionId:
      searchParams.get("collection")?.trim() || fallbackCollectionId,
    genreSlug: normalizeGenreSlug(searchParams.get("genre")),
    query: searchParams.get("q") ?? "",
    page: parsePage(searchParams.get("page")),
    sort: normalizeGameSort(searchParams.get("sort")),
    collectionFilters: parseFilters(
      searchParams,
      FILTER_PARAMETER_KEYS.collection,
    ),
    searchFilters: parseFilters(
      searchParams,
      FILTER_PARAMETER_KEYS.search,
    ),
    discoverFilters: parseFilters(
      searchParams,
      FILTER_PARAMETER_KEYS.discover,
    ),
  };
}

export function normalizeGenreSlug(value: string | null) {
  const normalizedValue = value?.trim().toLocaleLowerCase() ?? "";
  return GENRE_SLUG_PATTERN.test(normalizedValue)
    ? normalizedValue
    : null;
}

function appendFilters(
  searchParams: URLSearchParams,
  filters: GameFilters,
  keys: { genres: string; platforms: string },
) {
  const normalizedFilters = normalizeGameFilters(filters);

  normalizedFilters.genres.forEach((genre) => {
    searchParams.append(keys.genres, genre);
  });
  normalizedFilters.platforms.forEach((platform) => {
    searchParams.append(keys.platforms, platform);
  });
}

export function buildLibraryUrl({
  collectionId,
  genreSlug,
  query,
  page,
  sort,
  collectionFilters = EMPTY_GAME_FILTERS,
  searchFilters = EMPTY_GAME_FILTERS,
  discoverFilters = EMPTY_GAME_FILTERS,
}: LibraryLocationState) {
  const searchParams = new URLSearchParams();

  if (collectionId) {
    searchParams.set("collection", collectionId);
  }

  const normalizedGenreSlug = normalizeGenreSlug(genreSlug);

  if (normalizedGenreSlug) {
    searchParams.set("genre", normalizedGenreSlug);
  }

  if (query) {
    searchParams.set("q", query);
  }

  const normalizedSort = normalizeGameSort(sort);

  if (normalizedSort !== "default") {
    searchParams.set("sort", normalizedSort);
  }

  searchParams.set("page", String(Math.max(1, Math.floor(page))));
  appendFilters(
    searchParams,
    collectionFilters,
    FILTER_PARAMETER_KEYS.collection,
  );
  appendFilters(
    searchParams,
    searchFilters,
    FILTER_PARAMETER_KEYS.search,
  );
  appendFilters(
    searchParams,
    discoverFilters,
    FILTER_PARAMETER_KEYS.discover,
  );

  const queryString = searchParams.toString();
  return queryString ? `/?${queryString}` : "/";
}

export function buildGameUrl(gameId: number, returnTo: string) {
  const searchParams = new URLSearchParams({ returnTo });
  return `/game/${gameId}?${searchParams.toString()}`;
}

export function validateReturnTo(value: string | null) {
  if (!value) {
    return "/";
  }

  try {
    const candidate = new URL(value, INTERNAL_BASE_URL);

    if (
      candidate.origin !== INTERNAL_BASE_URL ||
      candidate.pathname !== "/" ||
      candidate.hash ||
      candidate.username ||
      candidate.password
    ) {
      return "/";
    }

    return `${candidate.pathname}${candidate.search}`;
  } catch {
    return "/";
  }
}
