import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildRecentPopularQuery,
  buildSearchQuery,
  createIgdbImageUrl,
  getDiscoverIgdbGames,
  normalizeIgdbGame,
} from "@/app/lib/igdb-catalog";
import type { IgdbQueryClient } from "@/app/lib/igdb-client";

const sourceGame = {
  id: 72,
  name: "Portal 2",
  slug: "portal-2",
  summary: "A puzzle game.",
  first_release_date: 1303084800,
  total_rating: 80,
  aggregated_rating: 92.4,
  cover: { image_id: "cover-id" },
  artworks: [
    {
      id: 3,
      image_id: "portrait-artwork-id",
      width: 900,
      height: 1600,
      alpha_channel: false,
      animated: false,
    },
    {
      id: 4,
      image_id: "transparent-artwork-id",
      width: 1920,
      height: 1080,
      alpha_channel: true,
      animated: false,
    },
    {
      id: 5,
      image_id: "hero-artwork-id",
      width: 1920,
      height: 1080,
      alpha_channel: false,
      animated: false,
    },
  ],
  screenshots: [
    { id: 1, image_id: "hero-id" },
    { id: 2, image_id: "gallery-id" },
  ],
  genres: [
    { id: 8, name: "Platform", slug: "platform" },
    { id: 9, name: "Puzzle", slug: "puzzle" },
  ],
  platforms: [
    {
      id: 6,
      name: "PC (Microsoft Windows)",
      slug: "win",
    },
    {
      id: 9,
      name: "PlayStation 3",
      slug: "ps3",
      platform_family: {
        id: 1,
        name: "PlayStation",
        slug: "playstation",
      },
    },
    {
      id: 130,
      name: "Nintendo Switch",
      slug: "switch",
      platform_family: {
        id: 5,
        name: "Nintendo",
        slug: "nintendo",
      },
    },
    {
      id: 4,
      name: "Nintendo 64",
      slug: "n64",
      platform_family: {
        id: 5,
        name: "Nintendo",
        slug: "nintendo",
      },
    },
  ],
  involved_companies: [
    {
      developer: true,
      publisher: true,
      company: { name: "Valve" },
    },
    {
      developer: false,
      publisher: true,
      company: { name: "Electronic Arts" },
    },
  ],
  websites: [
    {
      url: "https://example.com/store",
      type: { type: "Steam" },
    },
    {
      url: "https://example.com/",
      type: { type: "Official Website" },
    },
  ],
};

describe("IGDB catalog mapping", () => {
  afterEach(() => vi.useRealTimers());

  it("constructs image URLs and normalizes expanded games", () => {
    const game = normalizeIgdbGame(sourceGame);

    expect(createIgdbImageUrl("abc", "cover_big_2x")).toBe(
      "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/abc.jpg",
    );
    expect(game).toMatchObject({
      id: 72,
      name: "Portal 2",
      released: "2011-04-18",
      rating: 4,
      criticScore: 92.4,
      background_image:
        "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/cover-id.jpg",
      hero_image:
        "https://images.igdb.com/igdb/image/upload/t_1080p/hero-artwork-id.jpg",
      developers: ["Valve"],
      publishers: ["Valve", "Electronic Arts"],
      website: "https://example.com/",
      platforms: [
        "PC (Microsoft Windows)",
        "PlayStation 3",
        "Nintendo Switch",
        "Nintendo 64",
      ],
    });
    expect(game?.genres.map((genre) => genre.name)).toEqual([
      "Platformer",
      "Puzzle",
    ]);
    expect(game?.platformFamilies.map((family) => family.slug)).toEqual([
      "pc",
      "playstation",
      "nintendo-switch",
      "n64",
    ]);
    expect(game?.short_screenshots).toEqual([
      {
        id: 1,
        image:
          "https://images.igdb.com/igdb/image/upload/t_screenshot_big_2x/hero-id.jpg",
      },
      {
        id: 2,
        image:
          "https://images.igdb.com/igdb/image/upload/t_screenshot_big_2x/gallery-id.jpg",
      },
    ]);
  });

  it("keeps missing ratings nullable", () => {
    expect(
      normalizeIgdbGame({
        id: 1,
        name: "Unrated",
      }),
    ).toMatchObject({
      rating: null,
      criticScore: null,
    });
  });

  it("falls back to the first screenshot when official landscape artwork is unavailable", () => {
    expect(
      normalizeIgdbGame({
        id: 2,
        name: "Screenshot fallback",
        cover: { image_id: "cover-id" },
        artworks: [
          {
            id: 10,
            image_id: "portrait-id",
            width: 900,
            height: 1600,
          },
        ],
        screenshots: [{ id: 11, image_id: "screenshot-id" }],
      })?.hero_image,
    ).toBe(
      "https://images.igdb.com/igdb/image/upload/t_screenshot_big_2x/screenshot-id.jpg",
    );
  });

  it("escapes searches and excludes editions", () => {
    expect(buildSearchQuery('A "quoted" game', 8)).toContain(
      'search "A \\"quoted\\" game"',
    );
    expect(buildSearchQuery("Portal", 8)).toContain(
      "where version_parent = null",
    );
  });

  it("queries recent quality-qualified games by popularity", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T12:00:00Z"));
    const query = vi.fn().mockResolvedValue(
      Array.from({ length: 20 }, (_, index) => ({
        ...sourceGame,
        id: index + 1,
        name: `Game ${index + 1}`,
        total_rating: 100 - index,
        total_rating_count: 1000 + index,
      })),
    );
    const client = { query } as unknown as IgdbQueryClient;

    const queryBody = buildRecentPopularQuery();
    const games = await getDiscoverIgdbGames(client);

    expect(games).toHaveLength(20);
    expect(games.map((game) => game.id)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    );
    expect(query).toHaveBeenCalledWith("games", queryBody, {
      revalidate: 3600,
    });
    expect(queryBody).toContain(
      "first_release_date >= 1577836800",
    );
    expect(queryBody).toContain("first_release_date <= 1785801599");
    expect(queryBody).toContain("total_rating_count >= 250");
    expect(queryBody).toContain("total_rating >= 80");
    expect(queryBody).toContain("sort total_rating_count desc");
    expect(queryBody).toContain("limit 20");
  });

  it("preserves unsupported IGDB platforms as labeled fallbacks", () => {
    const game = normalizeIgdbGame({
      id: 2,
      name: "Retro Game",
      platforms: [
        {
          id: 68,
          name: "ColecoVision",
          slug: "colecovision",
        },
      ],
    });

    expect(game?.platformFamilies).toEqual([
      {
        id: 0,
        name: "ColecoVision",
        slug: "colecovision",
      },
    ]);
  });
});
