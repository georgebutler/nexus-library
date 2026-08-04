import type { SpatialMode } from "@/app/lib/spatial-runtime";
import type { Game } from "@/app/types/game";

export const GAME_CASE_USDZ_SRC = "/usdz/game-case.usdz";
export const GAME_COVER_ASPECT_RATIO = 3 / 4;

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

export type GameCoverResourceIds = {
  asset: string;
  entity: string;
  frontMaterial: string;
  shellMaterial: string;
  texture: string;
};

export type GameCoverSizing = {
  aspectRatio: number;
  depth: number;
  scale: number;
};

export function getGameCoverFallback(game: Pick<Game, "background_image" | "name">): GameCoverFallback {
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

export function getGameCoverResourceIds(
  gameId: number,
  variant: GameCoverVariant,
): GameCoverResourceIds {
  const prefix = `game-cover-${gameId}-${variant}`;

  return {
    asset: `${prefix}-asset`,
    entity: `${prefix}-entity`,
    frontMaterial: `${prefix}-front-material`,
    shellMaterial: `${prefix}-shell-material`,
    texture: `${prefix}-texture`,
  };
}

export function getGameCoverSizing(
  variant: GameCoverVariant,
): GameCoverSizing {
  return variant === "card"
    ? {
        aspectRatio: GAME_COVER_ASPECT_RATIO,
        depth: 24,
        scale: 0.15,
      }
    : {
        aspectRatio: GAME_COVER_ASPECT_RATIO,
        depth: 64,
        scale: 0.42,
      };
}

export function shouldRenderSpatialGameCover(
  mode: SpatialMode,
  fallback: GameCoverFallback,
  hasSpatialError: boolean,
) {
  return (
    mode === "spatial" &&
    fallback.kind === "image" &&
    !hasSpatialError
  );
}

export function isSpatialGameCoverReady(
  isModelLoaded: boolean,
  isTextureLoaded: boolean,
) {
  return isModelLoaded && isTextureLoaded;
}
