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
      query: "portal 2",
      page: 3,
    });
    const url = new URL(libraryUrl, "https://example.com");

    expect(libraryUrl).toBe(
      "/?collection=favorites&q=portal+2&page=3",
    );
    expect(
      parseLibraryLocation(url.searchParams, "my-games"),
    ).toEqual({
      collectionId: "favorites",
      query: "portal 2",
      page: 3,
    });
    expect(buildGameUrl(72, libraryUrl)).toBe(
      "/game/72?returnTo=%2F%3Fcollection%3Dfavorites%26q%3Dportal%2B2%26page%3D3",
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
      query: "",
      page: 1,
    });
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
