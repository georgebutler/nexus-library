export type LibraryLocationState = {
  collectionId: string;
  query: string;
  page: number;
};

const INTERNAL_BASE_URL = "https://nexus-library.local";

function parsePage(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function parseLibraryLocation(
  searchParams: URLSearchParams,
  fallbackCollectionId: string,
): LibraryLocationState {
  return {
    collectionId:
      searchParams.get("collection")?.trim() || fallbackCollectionId,
    query: searchParams.get("q") ?? "",
    page: parsePage(searchParams.get("page")),
  };
}

export function buildLibraryUrl({
  collectionId,
  query,
  page,
}: LibraryLocationState) {
  const searchParams = new URLSearchParams();

  if (collectionId) {
    searchParams.set("collection", collectionId);
  }

  if (query) {
    searchParams.set("q", query);
  }

  searchParams.set("page", String(Math.max(1, Math.floor(page))));

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
