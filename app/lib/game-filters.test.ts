import { describe, expect, it } from "vitest";
import {
  deriveContextualGameFilterOptions,
  deriveGameFilterOptions,
  filterGames,
  normalizeFilterValues,
  reconcileGameFilters,
  toggleFilterValue,
} from "@/app/lib/game-filters";
import type { Game } from "@/app/types/game";

function createGame(
  id: number,
  genres: Array<{ name: string; slug: string }>,
  platforms: Array<{ name: string; slug: string }>,
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
    platformFamilies: platforms.map((platform, index) => ({
      id: id * 100 + index,
      ...platform,
    })),
    developers: [],
    publishers: [],
    short_screenshots: [],
  };
}

const games = [
  createGame(
    1,
    [
      { name: "Action", slug: "action" },
      { name: "Adventure", slug: "adventure" },
    ],
    [{ name: "Windows", slug: "pc" }],
  ),
  createGame(
    2,
    [{ name: "Role-playing (RPG)", slug: "role-playing-rpg" }],
    [{ name: "PlayStation", slug: "playstation" }],
  ),
  createGame(
    3,
    [{ name: "Adventure", slug: "adventure" }],
    [
      { name: "Windows", slug: "pc" },
      { name: "Xbox", slug: "xbox" },
    ],
  ),
];

describe("game filters", () => {
  it("deduplicates, validates, and sorts filter values", () => {
    expect(
      normalizeFilterValues([
        " Xbox ",
        "pc",
        "xbox",
        "not valid!",
        "",
      ]),
    ).toEqual(["pc", "xbox"]);
  });

  it("derives alphabetized unique options from games", () => {
    expect(deriveGameFilterOptions(games)).toEqual({
      genres: [
        {
          count: 1,
          disabled: false,
          name: "Action",
          slug: "action",
        },
        {
          count: 2,
          disabled: false,
          name: "Adventure",
          slug: "adventure",
        },
        {
          count: 1,
          disabled: false,
          name: "Role-playing (RPG)",
          slug: "role-playing-rpg",
        },
      ],
      platforms: [
        {
          count: 1,
          disabled: false,
          name: "PlayStation",
          slug: "playstation",
        },
        {
          count: 2,
          disabled: false,
          name: "Windows",
          slug: "pc",
        },
        {
          count: 1,
          disabled: false,
          name: "Xbox",
          slug: "xbox",
        },
      ],
    });
  });

  it("derives contextual counts from the opposite facet", () => {
    expect(
      deriveContextualGameFilterOptions(games, {
        genres: ["action"],
        platforms: ["playstation"],
      }),
    ).toEqual({
      genres: [
        {
          count: 0,
          disabled: false,
          name: "Action",
          slug: "action",
        },
        {
          count: 0,
          disabled: true,
          name: "Adventure",
          slug: "adventure",
        },
        {
          count: 1,
          disabled: false,
          name: "Role-playing (RPG)",
          slug: "role-playing-rpg",
        },
      ],
      platforms: [
        {
          count: 0,
          disabled: false,
          name: "PlayStation",
          slug: "playstation",
        },
        {
          count: 1,
          disabled: false,
          name: "Windows",
          slug: "pc",
        },
        {
          count: 0,
          disabled: true,
          name: "Xbox",
          slug: "xbox",
        },
      ],
    });
  });

  it("omits the active smart genre from additional facets", () => {
    expect(
      deriveContextualGameFilterOptions(
        games,
        { genres: [], platforms: [] },
        "adventure",
      ).genres.map((option) => option.slug),
    ).toEqual(["action", "role-playing-rpg"]);
  });

  it("uses OR within categories and AND between categories", () => {
    expect(
      filterGames(games, {
        genres: ["action", "role-playing-rpg"],
        platforms: ["pc", "playstation"],
      }).map((game) => game.id),
    ).toEqual([1, 2]);

    expect(
      filterGames(games, {
        genres: ["adventure"],
        platforms: ["xbox"],
      }).map((game) => game.id),
    ).toEqual([3]);
  });

  it("returns the source list when no filters are active", () => {
    expect(
      filterGames(games, { genres: [], platforms: [] }),
    ).toBe(games);
  });

  it("removes stale option slugs", () => {
    const options = deriveGameFilterOptions(games);

    expect(
      reconcileGameFilters(
        {
          genres: ["adventure", "simulation"],
          platforms: ["pc", "stadia"],
        },
        options,
      ),
    ).toEqual({
      genres: ["adventure"],
      platforms: ["pc"],
    });
  });

  it("toggles one normalized value without duplicates", () => {
    expect(toggleFilterValue(["pc"], "Xbox")).toEqual(["pc", "xbox"]);
    expect(toggleFilterValue(["pc", "xbox"], "xbox")).toEqual(["pc"]);
  });
});
