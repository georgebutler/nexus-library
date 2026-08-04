import type { Game } from "@/app/types/game";

export const SPATIAL_DISCOVER_WIDE_THRESHOLD = 1100;
export const SPATIAL_DISCOVER_NARROW_PAGE_SIZE = 5;
export const SPATIAL_DISCOVER_WIDE_PAGE_SIZE = 6;

export function getSpatialDiscoverPageSize(width: number) {
  return width >= SPATIAL_DISCOVER_WIDE_THRESHOLD
    ? SPATIAL_DISCOVER_WIDE_PAGE_SIZE
    : SPATIAL_DISCOVER_NARROW_PAGE_SIZE;
}

export function getSpatialDiscoverPageCount(
  itemCount: number,
  pageSize: number,
) {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

export function clampSpatialDiscoverPage(
  page: number,
  itemCount: number,
  pageSize: number,
) {
  const normalizedPage = Number.isFinite(page) ? Math.floor(page) : 0;
  return Math.min(
    Math.max(normalizedPage, 0),
    getSpatialDiscoverPageCount(itemCount, pageSize) - 1,
  );
}

export function paginateSpatialDiscover(
  games: Game[],
  page: number,
  pageSize: number,
) {
  const currentPage = clampSpatialDiscoverPage(
    page,
    games.length,
    pageSize,
  );
  const start = currentPage * pageSize;

  return {
    currentPage,
    pageCount: getSpatialDiscoverPageCount(games.length, pageSize),
    games: games.slice(start, start + pageSize),
  };
}
