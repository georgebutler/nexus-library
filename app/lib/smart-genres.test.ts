import { describe, expect, it } from "vitest";
import type { GameCollection } from "@/app/hooks/useLibrary";
import {
  deriveSmartGenreCollections,
  findSmartGenreCollection,
  getAllSavedGames,
  getSmartGenreIconName,
} from "@/app/lib/smart-genres";
import type { Game } from "@/app/types/game";

function createGame(
  id: number,
  genres: Array<{ name: string; slug: string }>,
): Game {
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
    genres: genres.map((genre, index) => ({
      id: id * 10 + index,
      ...genre,
    })),
    platforms: [],
    platformFamilies: [],
    developers: [],
    publishers: [],
    short_screenshots: [],
  };
}

const games = {
  "1": createGame(1, [
    { name: "Adventure", slug: "adventure" },
    { name: "Indie", slug: "indie" },
  ]),
  "2": createGame(2, [
    { name: "Adventure", slug: "adventure" },
    { name: "Action", slug: "action" },
  ]),
  "3": createGame(3, [
    { name: "Action", slug: "action" },
    { name: "Indie", slug: "indie" },
  ]),
  "4": createGame(4, [{ name: "Puzzle", slug: "puzzle" }]),
};

const collections: GameCollection[] = [
  { id: "my-games", name: "My Games", gameIds: [2, 1, 4] },
  { id: "favorites", name: "Favorites", gameIds: [1, 3, 2] },
];

describe("smart genres", () => {
  it("deduplicates saved games in first collection and game order", () => {
    expect(
      getAllSavedGames(collections, games).map((game) => game.id),
    ).toEqual([2, 1, 4, 3]);
  });

  it("applies the two-game threshold and sorts by count then name", () => {
    const smartGenres = deriveSmartGenreCollections(
      getAllSavedGames(collections, games),
    );

    expect(
      smartGenres.map(({ count, games: genreGames, name, slug }) => ({
        count,
        gameIds: genreGames.map((game) => game.id),
        name,
        slug,
      })),
    ).toEqual([
      {
        count: 2,
        gameIds: [2, 3],
        name: "Action",
        slug: "action",
      },
      {
        count: 2,
        gameIds: [2, 1],
        name: "Adventure",
        slug: "adventure",
      },
      {
        count: 2,
        gameIds: [1, 3],
        name: "Indie",
        slug: "indie",
      },
    ]);
  });

  it("uses semantic icons with a fallback", () => {
    expect(getSmartGenreIconName("action")).toBe("action");
    expect(getSmartGenreIconName("role-playing-rpg")).toBe("rpg");
    expect(getSmartGenreIconName("unknown-genre")).toBe("fallback");
  });

  it("invalidates an active genre when it drops below threshold", () => {
    const smartGenres = deriveSmartGenreCollections(
      getAllSavedGames(collections, games),
    );
    expect(
      findSmartGenreCollection(smartGenres, "adventure")?.count,
    ).toBe(2);

    const reducedGenres = deriveSmartGenreCollections(
      getAllSavedGames(
        [
          { id: "my-games", name: "My Games", gameIds: [2, 4] },
          { id: "favorites", name: "Favorites", gameIds: [3] },
        ],
        games,
      ),
    );
    expect(
      findSmartGenreCollection(reducedGenres, "adventure"),
    ).toBeNull();
  });
});
