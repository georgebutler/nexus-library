import { describe, expect, it } from "vitest";
import {
  clampPage,
  getPageAfterFeedChange,
  getPageCount,
  paginateGames,
  selectGalleryFeed,
  SPATIAL_GALLERY_PAGE_SIZE,
} from "@/app/lib/library-gallery";
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

describe("selectGalleryFeed", () => {
  const searchResults = [createGame(1)];
  const collectionGames = [createGame(2)];
  const discoverGames = [createGame(3)];

  it("gives search results precedence over collections and Discover", () => {
    expect(
      selectGalleryFeed({
        hasSearchQuery: true,
        searchResults,
        collectionGames,
        collectionName: "Favorites",
        discoverGames,
      }),
    ).toEqual({
      kind: "search",
      games: searchResults,
      heading: "Search results",
    });
  });

  it("uses a non-empty collection when no search is active", () => {
    expect(
      selectGalleryFeed({
        hasSearchQuery: false,
        searchResults,
        collectionGames,
        collectionName: "Favorites",
        discoverGames,
      }),
    ).toEqual({
      kind: "collection",
      games: collectionGames,
      heading: "Favorites",
    });
  });

  it("falls back to Discover for an empty collection", () => {
    expect(
      selectGalleryFeed({
        hasSearchQuery: false,
        searchResults,
        collectionGames: [],
        collectionName: "Empty",
        discoverGames,
      }),
    ).toEqual({
      kind: "discover",
      games: discoverGames,
      heading: "Discover",
    });
  });
});

describe("gallery pagination", () => {
  const games = Array.from({ length: 15 }, (_, index) =>
    createGame(index + 1),
  );

  it("paginates seven games at a time", () => {
    const secondPage = paginateGames(games, 2);

    expect(SPATIAL_GALLERY_PAGE_SIZE).toBe(7);
    expect(secondPage.pageCount).toBe(3);
    expect(secondPage.games.map((game) => game.id)).toEqual([
      8, 9, 10, 11, 12, 13, 14,
    ]);
  });

  it("clamps page indexes after feed size changes", () => {
    expect(getPageCount(15)).toBe(3);
    expect(clampPage(3, 4)).toBe(1);
    expect(clampPage(0, 15)).toBe(1);
    expect(clampPage(99, 15)).toBe(3);
  });

  it("resets to page one when the collection or feed changes", () => {
    expect(
      getPageAfterFeedChange(
        "collection:my-games",
        "collection:favorites",
        3,
        15,
      ),
    ).toBe(1);
    expect(
      getPageAfterFeedChange(
        "collection:favorites",
        "collection:favorites",
        3,
        8,
      ),
    ).toBe(2);
  });
});
