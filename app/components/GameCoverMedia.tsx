"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import {
  getGameCoverFallback,
  getGameCoverSizing,
  type GameCoverVariant,
} from "@/app/lib/game-cover-media";
import type { Game } from "@/app/types/game";

type GameCoverMediaProps = {
  game: Game;
  variant: GameCoverVariant;
  priority?: boolean;
};

function CoverFallback({
  game,
  priority,
  variant,
}: Pick<GameCoverMediaProps, "game" | "priority" | "variant">) {
  const fallback = getGameCoverFallback(game);

  if (fallback.kind === "image") {
    return (
      <Image
        alt={`${game.name} cover art`}
        fill
        loading={priority ? "eager" : "lazy"}
        priority={priority}
        sizes={
          variant === "card"
            ? "(max-width: 720px) 44vw, 180px"
            : "(max-width: 720px) 100vw, 40vw"
        }
        src={fallback.src}
      />
    );
  }

  return (
    <div className="game-case__placeholder">
      <span>{fallback.value}</span>
    </div>
  );
}

export function GameCoverMedia({
  game,
  variant,
  priority = false,
}: GameCoverMediaProps) {
  const sizing = getGameCoverSizing(variant);
  const style = {
    "--game-cover-aspect-ratio": sizing.aspectRatio,
  } as CSSProperties;

  return (
    <div
      className={`game-cover-media game-cover-media--${variant}`}
      style={style}
    >
      <CoverFallback
        game={game}
        priority={priority}
        variant={variant}
      />
    </div>
  );
}
