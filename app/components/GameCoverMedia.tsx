"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import {
  getGameCoverFallback,
  getGameCoverSizing,
  shouldElevateGameCover,
  type GameCoverVariant,
} from "@/app/lib/game-cover-media";
import type { SpatialMode } from "@/app/lib/spatial-runtime";
import type { Game } from "@/app/types/game";

type GameCoverMediaProps = {
  game: Game;
  mode: SpatialMode;
  variant: GameCoverVariant;
  priority?: boolean;
  onTap?: () => void;
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
  mode,
  variant,
  priority = false,
  onTap,
}: GameCoverMediaProps) {
  const fallback = getGameCoverFallback(game);
  const sizing = getGameCoverSizing(variant);
  const isElevated = shouldElevateGameCover(mode, fallback);
  const style = {
    "--game-cover-aspect-ratio": sizing.aspectRatio,
    "--xr-background-material": "transparent",
    "--xr-back": `${sizing.back}px`,
  } as CSSProperties;

  return (
    <div
      className={`game-cover-media game-cover-media--${variant}`}
      data-cover-mode={isElevated ? "spatial" : "browser"}
      onSpatialTap={isElevated ? onTap : undefined}
      style={style}
      {...(isElevated ? { "enable-xr": true } : {})}
    >
      <CoverFallback
        game={game}
        priority={priority}
        variant={variant}
      />
    </div>
  );
}
