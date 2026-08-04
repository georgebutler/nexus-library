import { describe, expect, it } from "vitest";
import {
  buildGameUrl,
  buildLibraryUrl,
  parseLibraryLocation,
  validateReturnTo,
} from "@/app/lib/library-navigation";

describe("library navigation", () => {
  it("round-trips collection, query, and one-based page state", () => {
    const libraryUrl = buildLibraryUrl({
      collectionId: "favorites",
      genreSlug: "adventure",
      query: "portal 2",
      page: 3,
      collectionFilters: {
        genres: ["adventure"],
        platforms: ["pc"],
      },
      searchFilters: {
        genres: ["puzzle"],
        platforms: ["playstation"],
      },
      discoverFilters: {
        genres: ["role-playing-rpg"],
        platforms: ["xbox"],
      },
    });
    const url = new URL(libraryUrl, "https://example.com");

    expect(libraryUrl).toBe(
      "/?collection=favorites&genre=adventure&q=portal+2&page=3&cg=adventure&cp=pc&sg=puzzle&sp=playstation&dg=role-playing-rpg&dp=xbox",
    );
    expect(
      parseLibraryLocation(url.searchParams, "my-games"),
    ).toEqual({
      collectionId: "favorites",
      genreSlug: "adventure",
      query: "portal 2",
      page: 3,
      collectionFilters: {
        genres: ["adventure"],
        platforms: ["pc"],
      },
      searchFilters: {
        genres: ["puzzle"],
        platforms: ["playstation"],
      },
      discoverFilters: {
        genres: ["role-playing-rpg"],
        platforms: ["xbox"],
      },
    });
    expect(buildGameUrl(72, libraryUrl)).toBe(
      "/game/72?returnTo=%2F%3Fcollection%3Dfavorites%26genre%3Dadventure%26q%3Dportal%2B2%26page%3D3%26cg%3Dadventure%26cp%3Dpc%26sg%3Dpuzzle%26sp%3Dplaystation%26dg%3Drole-playing-rpg%26dp%3Dxbox",
    );
  });

  it("normalizes invalid pages to page one", () => {
    expect(
      parseLibraryLocation(
        new URLSearchParams("collection=favorites&page=-2"),
        "my-games",
      ),
    ).toEqual({
      collectionId: "favorites",
      genreSlug: null,
      query: "",
      page: 1,
      collectionFilters: {
        genres: [],
        platforms: [],
      },
      searchFilters: {
        genres: [],
        platforms: [],
      },
      discoverFilters: {
        genres: [],
        platforms: [],
      },
    });
  });

  it("deduplicates, validates, and sorts repeated filter params", () => {
    const state = parseLibraryLocation(
      new URLSearchParams(
        "collection=my-games&cg=RPG&cg=action&cg=action&cp=not%20valid&dp=xbox&dp=pc",
      ),
      "my-games",
    );

    expect(state.collectionFilters).toEqual({
      genres: ["action", "rpg"],
      platforms: [],
    });
    expect(state.discoverFilters).toEqual({
      genres: [],
      platforms: ["pc", "xbox"],
    });
    expect(state.genreSlug).toBeNull();
  });

  it("normalizes genre slugs while retaining the real collection", () => {
    expect(
      parseLibraryLocation(
        new URLSearchParams(
          "collection=favorites&genre=Role-Playing-RPG&page=2",
        ),
        "my-games",
      ),
    ).toMatchObject({
      collectionId: "favorites",
      genreSlug: "role-playing-rpg",
      page: 2,
    });

    expect(
      parseLibraryLocation(
        new URLSearchParams("collection=favorites&genre=not%20valid"),
        "my-games",
      ).genreSlug,
    ).toBeNull();
  });
});

describe("validateReturnTo", () => {
  it("accepts only an internal library URL", () => {
    expect(
      validateReturnTo(
        "/?collection=favorites&q=portal&page=2",
      ),
    ).toBe("/?collection=favorites&q=portal&page=2");
  });

  it.each([
    "https://example.com/",
    "//example.com/",
    "/game/72",
    "/#section",
    "not a url",
    null,
  ])("falls back to root for invalid return URL %s", (value) => {
    expect(validateReturnTo(value)).toBe("/");
  });
});
