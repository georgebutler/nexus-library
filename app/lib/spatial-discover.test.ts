import { describe, expect, it } from "vitest";
import {
  clampSpatialDiscoverPage,
  getSpatialDiscoverPageCount,
  getSpatialDiscoverPageSize,
  paginateSpatialDiscover,
  SPATIAL_DISCOVER_NARROW_PAGE_SIZE,
  SPATIAL_DISCOVER_WIDE_PAGE_SIZE,
  SPATIAL_DISCOVER_WIDE_THRESHOLD,
} from "@/app/lib/spatial-discover";
import type { Game } from "@/app/types/game";

function createGame(id: number): Game {
  return {
    id,
    name: `Game ${id}`,
    slug: `game-${id}`,
    background_image: null,
    coverAspectRatio: null,
    hero_image: null,
    description: null,
    website: null,
    released: null,
    rating: null,
    criticScore: null,
    genres: [],
    platforms: [],
    platformFamilies: [],
    developers: [],
    publishers: [],
    short_screenshots: [],
  };
}

describe("spatial Discover pagination", () => {
  it("uses five cards below the wide threshold and six at it", () => {
    expect(getSpatialDiscoverPageSize(SPATIAL_DISCOVER_WIDE_THRESHOLD - 1))
      .toBe(SPATIAL_DISCOVER_NARROW_PAGE_SIZE);
    expect(getSpatialDiscoverPageSize(SPATIAL_DISCOVER_WIDE_THRESHOLD))
      .toBe(SPATIAL_DISCOVER_WIDE_PAGE_SIZE);
  });

  it("counts and clamps zero-based pages", () => {
    expect(getSpatialDiscoverPageCount(13, 5)).toBe(3);
    expect(clampSpatialDiscoverPage(-1, 13, 5)).toBe(0);
    expect(clampSpatialDiscoverPage(99, 13, 5)).toBe(2);
    expect(clampSpatialDiscoverPage(2, 4, 5)).toBe(0);
  });

  it("returns only the current static page", () => {
    const games = Array.from({ length: 13 }, (_, index) =>
      createGame(index + 1),
    );

    expect(
      paginateSpatialDiscover(games, 1, 5).games.map((game) => game.id),
    ).toEqual([6, 7, 8, 9, 10]);
    expect(paginateSpatialDiscover(games, 2, 5)).toMatchObject({
      currentPage: 2,
      pageCount: 3,
    });
  });
});
