"use client";

import Image from "next/image";
import { Minus, Plus, Star } from "lucide-react";
import type {
  CSSProperties,
  MouseEvent,
  ReactNode,
} from "react";
import { PlatformIcons } from "@/app/components/PlatformIcons";
import type { Game } from "@/app/types/game";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type GameCaseProps = {
  game: Game;
  onOpen: (game: Game) => void;
  action?: ReactNode;
  activeCollectionName?: string;
  isInActiveCollection?: boolean;
  onToggleActiveCollection?: (game: Game) => void;
  style?: CSSProperties;
  priority?: boolean;
};

export function GameCase({
  game,
  onOpen,
  action,
  activeCollectionName,
  isInActiveCollection,
  onToggleActiveCollection,
  style,
  priority = false,
}: GameCaseProps) {
  const releaseYear = game.released
    ? new Date(`${game.released}T00:00:00`).getFullYear()
    : "TBA";
  const hasActiveCollectionAction = Boolean(
    activeCollectionName && onToggleActiveCollection,
  );

  const handleCollectionToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onToggleActiveCollection?.(game);
  };

  return (
    <Card
      className="game-case group"
      size="sm"
      style={style}
    >
      <button
        aria-label={`Open ${game.name}`}
        className="game-case__open"
        onClick={() => onOpen(game)}
        type="button"
      />
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
        {hasActiveCollectionAction ? (
          <Button
            aria-label={
              isInActiveCollection
                ? `Remove ${game.name} from ${activeCollectionName}`
                : `Add ${game.name} to ${activeCollectionName}`
            }
            className={
              isInActiveCollection
                ? "game-case__collection-toggle is-remove"
                : "game-case__collection-toggle is-add"
            }
            onClick={handleCollectionToggle}
            size="icon"
            type="button"
            variant={isInActiveCollection ? "secondary" : "default"}
          >
            {isInActiveCollection ? (
              <Minus aria-hidden="true" />
            ) : (
              <Plus aria-hidden="true" />
            )}
          </Button>
        ) : null}
        {game.rating !== null ? (
          <Badge className="game-case__rating" variant="secondary">
            <Star
              aria-hidden="true"
              data-icon="inline-start"
              fill="currentColor"
            />
            {game.rating.toFixed(1)}
          </Badge>
        ) : null}
      </div>

      <CardContent className="game-case__body">
        <p className="game-case__eyebrow">
          {game.genres[0]?.name ?? "Game"} · {releaseYear}
        </p>
        <h3>{game.name}</h3>
        <div className="game-case__platform-slot">
          <PlatformIcons
            maxItems={4}
            platforms={game.platformFamilies ?? []}
          />
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
