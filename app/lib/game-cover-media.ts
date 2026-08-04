import type { Game } from "@/app/types/game";

export const GAME_COVER_ASPECT_RATIO = 3 / 4;
export const SPATIAL_GAME_CARD_BACK = 50;

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
  };
}
