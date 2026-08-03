import type { Game } from "@/app/types/game";

export const SPATIAL_GALLERY_PAGE_SIZE = 7;

export type GalleryFeedKind = "search" | "collection" | "discover";

export type GalleryFeed = {
  kind: GalleryFeedKind;
  games: Game[];
  heading: string;
};

type SelectGalleryFeedOptions = {
  hasSearchQuery: boolean;
  searchResults: Game[];
  collectionGames: Game[];
  collectionName: string;
  discoverGames: Game[];
};

export function selectGalleryFeed({
  hasSearchQuery,
  searchResults,
  collectionGames,
  collectionName,
  discoverGames,
}: SelectGalleryFeedOptions): GalleryFeed {
  if (hasSearchQuery) {
    return {
      kind: "search",
      games: searchResults,
      heading: "Search results",
    };
  }

  if (collectionGames.length > 0) {
    return {
      kind: "collection",
      games: collectionGames,
      heading: collectionName,
    };
  }

  return {
    kind: "discover",
    games: discoverGames,
    heading: "Discover",
  };
}

export function getPageCount(
  itemCount: number,
  pageSize = SPATIAL_GALLERY_PAGE_SIZE,
) {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

export function clampPage(
  page: number,
  itemCount: number,
  pageSize = SPATIAL_GALLERY_PAGE_SIZE,
) {
  const normalizedPage = Number.isFinite(page) ? Math.floor(page) : 1;
  return Math.min(
    Math.max(normalizedPage, 1),
    getPageCount(itemCount, pageSize),
  );
}

export function paginateGames(
  games: Game[],
  page: number,
  pageSize = SPATIAL_GALLERY_PAGE_SIZE,
) {
  const currentPage = clampPage(page, games.length, pageSize);
  const start = (currentPage - 1) * pageSize;

  return {
    currentPage,
    pageCount: getPageCount(games.length, pageSize),
    games: games.slice(start, start + pageSize),
  };
}

export function getGalleryFeedKey(
  feedKind: GalleryFeedKind,
  collectionId: string,
  query: string,
) {
  return feedKind === "search"
    ? `search:${query.trim()}`
    : `${feedKind}:${collectionId}`;
}

export function getPageAfterFeedChange(
  previousFeedKey: string,
  nextFeedKey: string,
  page: number,
  itemCount: number,
) {
  return previousFeedKey === nextFeedKey
    ? clampPage(page, itemCount)
    : 1;
}
