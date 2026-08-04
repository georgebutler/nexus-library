import type { SpatialMode } from "@/app/lib/spatial-runtime";
import type { Game } from "@/app/types/game";

export const GAME_COVER_ASPECT_RATIO = 3 / 4;
export const SPATIAL_GAME_COVER_BACK = 100;

export type GameCoverVariant = "card" | "detail";

export type GameCoverFallback =
  | {
      kind: "image";
      src: string;
    }
  | {
      kind: "initials";
      value: string;
    };

export type GameCoverSizing = {
  aspectRatio: number;
  back: number;
};

export function getGameCoverFallback(
  game: Pick<Game, "background_image" | "name">,
): GameCoverFallback {
  if (game.background_image) {
    return {
      kind: "image",
      src: game.background_image,
    };
  }

  return {
    kind: "initials",
    value: game.name.slice(0, 2).toUpperCase(),
  };
}

export function getGameCoverSizing(
  _variant: GameCoverVariant,
): GameCoverSizing {
  return {
    aspectRatio: GAME_COVER_ASPECT_RATIO,
    back: SPATIAL_GAME_COVER_BACK,
  };
}

export function shouldElevateGameCover(
  mode: SpatialMode,
  fallback: GameCoverFallback,
) {
  return mode === "spatial" && fallback.kind === "image";
}
