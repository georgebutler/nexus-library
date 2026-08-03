import { describe, expect, it } from "vitest";
import { migrateCollectionStateToV3 } from "@/app/hooks/useLibrary";

describe("migrateCollectionStateToV3", () => {
  it("preserves collection structure and clears old games", () => {
    const migrated = migrateCollectionStateToV3({
      version: 2,
      games: {
        "3498": {
          id: 3498,
          name: "Old Game",
        },
      },
      collections: [
        { id: "my-games", name: "My Games", gameIds: [3498] },
        { id: "favorites", name: "Favorites", gameIds: [3498] },
      ],
      defaultCollectionId: "my-games",
      activeCollectionId: "favorites",
    });

    expect(migrated).toEqual({
      version: 3,
      games: {},
      collections: [
        { id: "my-games", name: "My Games", gameIds: [] },
        { id: "favorites", name: "Favorites", gameIds: [] },
      ],
      defaultCollectionId: "my-games",
      activeCollectionId: "favorites",
    });
  });
});
