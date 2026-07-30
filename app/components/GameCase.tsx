"use client";

import Image from "next/image";
import { Plus, Star } from "lucide-react";
import type { CSSProperties, KeyboardEvent } from "react";
import type { Game } from "@/app/types/game";

type GameCaseProps = {
  game: Game;
  onOpen: (game: Game) => void;
  onAdd?: (game: Game) => void;
  isSaved?: boolean;
  style?: CSSProperties;
  priority?: boolean;
};

export function GameCase({
  game,
  onOpen,
  onAdd,
  isSaved = false,
  style,
  priority = false,
}: GameCaseProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(game);
    }
  };

  const releaseYear = game.released
    ? new Date(`${game.released}T00:00:00`).getFullYear()
    : "TBA";

  return (
    <article
      className="game-case group"
      enable-xr
      onClick={() => onOpen(game)}
      onKeyDown={handleKeyDown}
      role="button"
      style={style}
      tabIndex={0}
    >
      <div className="game-case__art">
        {game.background_image ? (
          <Image
            alt={`${game.name} cover art`}
            fill
            priority={priority}
            sizes="(max-width: 720px) 44vw, 180px"
            src={game.background_image}
          />
        ) : (
          <div className="game-case__placeholder">
            <span>{game.name.slice(0, 2).toUpperCase()}</span>
          </div>
        )}
        <div className="game-case__scrim" />
        <div className="game-case__rating">
          <Star aria-hidden="true" fill="currentColor" size={12} />
          {game.rating.toFixed(1)}
        </div>
      </div>

      <div className="game-case__body">
        <p className="game-case__eyebrow">
          {game.genres[0]?.name ?? "Game"} · {releaseYear}
        </p>
        <h3>{game.name}</h3>
        {onAdd ? (
          <button
            className="game-case__add"
            disabled={isSaved}
            onClick={(event) => {
              event.stopPropagation();
              onAdd(game);
            }}
            type="button"
          >
            <Plus aria-hidden="true" size={14} />
            {isSaved ? "In library" : "Add"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
