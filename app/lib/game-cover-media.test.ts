import { describe, expect, it } from "vitest";
import {
  GAME_COVER_ASPECT_RATIO,
  SPATIAL_GAME_COVER_BACK,
  getGameCoverFallback,
  getGameCoverSizing,
  shouldElevateGameCover,
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

  it("keeps both variants at 3:4 and 100px spatial depth", () => {
    const card = getGameCoverSizing("card");
    const detail = getGameCoverSizing("detail");

    expect(card.aspectRatio).toBe(GAME_COVER_ASPECT_RATIO);
    expect(detail.aspectRatio).toBe(GAME_COVER_ASPECT_RATIO);
    expect(card.back).toBe(SPATIAL_GAME_COVER_BACK);
    expect(detail.back).toBe(SPATIAL_GAME_COVER_BACK);
  });

  it("elevates image artwork only in spatial mode", () => {
    const imageFallback = getGameCoverFallback({
      background_image: "https://images.example/cover.jpg",
      name: "Portal 2",
    });
    const initialsFallback = getGameCoverFallback({
      background_image: null,
      name: "Portal 2",
    });

    expect(shouldElevateGameCover("spatial", imageFallback)).toBe(true);
    expect(shouldElevateGameCover("browser", imageFallback)).toBe(false);
    expect(shouldElevateGameCover("spatial", initialsFallback)).toBe(false);
  });
});
