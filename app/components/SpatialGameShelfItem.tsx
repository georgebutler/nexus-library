"use client";

import Image from "next/image";
import { Minus, Plus, Star } from "lucide-react";
import { PlatformIcons } from "@/app/components/PlatformIcons";
import type { Game } from "@/app/types/game";
import { Button } from "@/components/ui/button";

type SpatialGameShelfItemProps = {
  activeCollectionName: string;
  game: Game;
  isInActiveCollection: boolean;
  onOpen: (game: Game) => void;
  onToggleActiveCollection: (game: Game) => void;
  priority?: boolean;
};

export function SpatialGameShelfItem({
  activeCollectionName,
  game,
  isInActiveCollection,
  onOpen,
  onToggleActiveCollection,
  priority = false,
}: SpatialGameShelfItemProps) {
  const releaseYear = game.released
    ? new Date(`${game.released}T00:00:00`).getFullYear()
    : "TBA";

  return (
    <article className="spatial-shelf-item">
      <button
        aria-label={`Open ${game.name}`}
        className="spatial-shelf-item__cover"
        enable-xr
        onClick={() => onOpen(game)}
        style={{
          "--xr-background-material": "transparent",
          "--xr-back": "100px",
        }}
        type="button"
      >
        {game.background_image ? (
          <Image
            alt={`${game.name} cover art`}
            fill
            priority={priority}
            sizes="140px"
            src={game.background_image}
          />
        ) : (
          <span className="spatial-shelf-item__placeholder">
            {game.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </button>

      <div className="spatial-shelf-item__metadata">
        <p className="spatial-shelf-item__eyebrow">
          {game.genres[0]?.name ?? "Game"} · {releaseYear}
        </p>
        <h2>{game.name}</h2>
        <PlatformIcons
          className="spatial-shelf-item__platforms"
          maxItems={4}
          platforms={game.platformFamilies ?? []}
        />
        <div className="spatial-shelf-item__footer">
          <span className="spatial-shelf-item__rating">
            <Star aria-hidden="true" fill="currentColor" />
            {game.rating !== null ? game.rating.toFixed(1) : "—"}
          </span>
          <Button
            aria-label={
              isInActiveCollection
                ? `Remove ${game.name} from ${activeCollectionName}`
                : `Add ${game.name} to ${activeCollectionName}`
            }
            className={
              isInActiveCollection
                ? "spatial-shelf-item__collection-toggle is-remove"
                : "spatial-shelf-item__collection-toggle is-add"
            }
            onClick={() => onToggleActiveCollection(game)}
            size="icon-sm"
            type="button"
            variant={isInActiveCollection ? "secondary" : "default"}
          >
            {isInActiveCollection ? (
              <Minus aria-hidden="true" />
            ) : (
              <Plus aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
