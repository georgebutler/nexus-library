import { describe, expect, it } from "vitest";
import {
  GAME_CASE_USDZ_SRC,
  GAME_COVER_ASPECT_RATIO,
  getGameCoverFallback,
  getGameCoverResourceIds,
  getGameCoverSizing,
  isSpatialGameCoverReady,
  shouldRenderSpatialGameCover,
} from "@/app/lib/game-cover-media";

describe("game cover media", () => {
  it("selects the artwork image and initials fallback", () => {
    const imageFallback = getGameCoverFallback({
      background_image: "https://images.example/cover.jpg",
      name: "Portal 2",
    });
    const initialsFallback = getGameCoverFallback({
      background_image: null,
      name: "Portal 2",
    });

    expect(imageFallback).toEqual({
      kind: "image",
      src: "https://images.example/cover.jpg",
    });
    expect(initialsFallback).toEqual({
      kind: "initials",
      value: "PO",
    });
  });

  it("uses stable game and variant scoped resource ids", () => {
    expect(getGameCoverResourceIds(72, "card")).toEqual({
      asset: "game-cover-72-card-asset",
      entity: "game-cover-72-card-entity",
      frontMaterial: "game-cover-72-card-front-material",
      shellMaterial: "game-cover-72-card-shell-material",
      texture: "game-cover-72-card-texture",
    });
    expect(getGameCoverResourceIds(72, "detail").texture).toBe(
      "game-cover-72-detail-texture",
    );
  });

  it("keeps both variants at 3:4 with a larger detail model", () => {
    const card = getGameCoverSizing("card");
    const detail = getGameCoverSizing("detail");

    expect(GAME_CASE_USDZ_SRC).toBe("/usdz/game-case.usdz");
    expect(card.aspectRatio).toBe(GAME_COVER_ASPECT_RATIO);
    expect(detail.aspectRatio).toBe(GAME_COVER_ASPECT_RATIO);
    expect(detail.scale).toBeGreaterThan(card.scale);
    expect(detail.depth).toBeGreaterThan(card.depth);
  });

  it("renders the spatial case only when artwork and resources are valid", () => {
    const imageFallback = getGameCoverFallback({
      background_image: "https://images.example/cover.jpg",
      name: "Portal 2",
    });
    const initialsFallback = getGameCoverFallback({
      background_image: null,
      name: "Portal 2",
    });

    expect(
      shouldRenderSpatialGameCover("spatial", imageFallback, false),
    ).toBe(true);
    expect(
      shouldRenderSpatialGameCover("browser", imageFallback, false),
    ).toBe(false);
    expect(
      shouldRenderSpatialGameCover("spatial", imageFallback, true),
    ).toBe(false);
    expect(
      shouldRenderSpatialGameCover("spatial", initialsFallback, false),
    ).toBe(false);
  });

  it("keeps the fallback until the model and texture are both loaded", () => {
    expect(isSpatialGameCoverReady(false, false)).toBe(false);
    expect(isSpatialGameCoverReady(true, false)).toBe(false);
    expect(isSpatialGameCoverReady(false, true)).toBe(false);
    expect(isSpatialGameCoverReady(true, true)).toBe(true);
  });
});
