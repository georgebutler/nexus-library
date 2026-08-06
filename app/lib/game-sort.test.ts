import { describe, expect, it } from "vitest";
import {
  normalizeGameSort,
  sortGames,
  type GameSort,
} from "@/app/lib/game-sort";
import type { Game } from "@/app/types/game";

function createGame({
  id,
  name,
  rating = null,
  released = null,
}: {
  id: number;
  name: string;
  rating?: number | null;
  released?: string | null;
}): Game {
  return {
    id,
    name,
    slug: String(id),
    background_image: null,
    coverAspectRatio: null,
    hero_image: null,
    description: null,
    website: null,
    released,
    rating,
    criticScore: null,
    genres: [],
    platforms: [],
    platformFamilies: [],
    developers: [],
    publishers: [],
    short_screenshots: [],
  };
}

const games = [
  createGame({
    id: 20,
    name: "Zelda",
    rating: 4.2,
    released: "2020-01-01",
  }),
  createGame({
    id: 30,
    name: "Alpha",
    rating: null,
    released: null,
  }),
  createGame({
    id: 10,
    name: "Alpha",
    rating: 4.8,
    released: "2024-02-01",
  }),
  createGame({
    id: 40,
    name: "Bravo",
    rating: 4.8,
    released: "2024-02-01",
  }),
];

describe("normalizeGameSort", () => {
  it.each([
    ["title", "title"],
    ["released", "released"],
    ["rating", "rating"],
    ["default", "default"],
    ["newest", "default"],
    [null, "default"],
  ])("normalizes %s to %s", (value, expected) => {
    expect(normalizeGameSort(value)).toBe(expected);
  });
});

describe("sortGames", () => {
  it.each([
    ["default", [20, 30, 10, 40]],
    ["title", [10, 30, 40, 20]],
    ["released", [10, 40, 20, 30]],
    ["rating", [10, 40, 20, 30]],
  ] satisfies Array<[GameSort, number[]]>)(
    "sorts by %s with stable tie-breaking",
    (sort, expectedIds) => {
      expect(sortGames(games, sort).map((game) => game.id)).toEqual(
        expectedIds,
      );
    },
  );

  it("places invalid release dates and non-finite ratings last", () => {
    const gamesWithInvalidMetadata = [
      createGame({
        id: 1,
        name: "Invalid",
        rating: Number.NaN,
        released: "not-a-date",
      }),
      createGame({
        id: 2,
        name: "Valid",
        rating: 3.5,
        released: "2022-01-01",
      }),
    ];

    expect(
      sortGames(gamesWithInvalidMetadata, "released").map(
        (game) => game.id,
      ),
    ).toEqual([2, 1]);
    expect(
      sortGames(gamesWithInvalidMetadata, "rating").map((game) => game.id),
    ).toEqual([2, 1]);
  });

  it("never mutates the source array", () => {
    const source = [...games];
    const originalOrder = source.map((game) => game.id);

    const sorted = sortGames(source, "title");

    expect(source.map((game) => game.id)).toEqual(originalOrder);
    expect(sorted).not.toBe(source);
  });
});
