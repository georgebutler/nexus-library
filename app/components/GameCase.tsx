"use client";

import { Minus, Plus, Star } from "lucide-react";
import type {
  CSSProperties,
  MouseEvent,
  ReactNode,
} from "react";
import { GameCoverMedia } from "@/app/components/GameCoverMedia";
import { PlatformIcons } from "@/app/components/PlatformIcons";
import { SPATIAL_GAME_COVER_BACK } from "@/app/lib/game-cover-media";
import type { Game } from "@/app/types/game";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type GameCaseProps = {
  game: Game;
  onOpen: (game: Game) => void;
  action?: ReactNode;
  activeCollectionName?: string;
  isInActiveCollection?: boolean;
  onToggleActiveCollection?: (game: Game) => void;
  style?: CSSProperties;
  priority?: boolean;
  presentation?: "library" | "compact";
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
  presentation = "library",
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
  const collectionToggle = hasActiveCollectionAction ? (
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
  ) : null;
  const rating = game.rating !== null ? (
    <Badge className="game-case__rating" variant="secondary">
      <Star
        aria-hidden="true"
        data-icon="inline-start"
        fill="currentColor"
      />
      {game.rating.toFixed(1)}
    </Badge>
  ) : null;

  return (
    <Card
      className={cn(
        "game-case group",
        `game-case--${presentation}`,
        presentation === "compact" &&
          hasActiveCollectionAction &&
          isInActiveCollection &&
          "is-in-active-collection",
      )}
      enable-xr
      size="sm"
      style={
        {
          ...style,
          "--xr-background-material": "transparent",
        } as CSSProperties
      }
    >
      <button
        aria-label={`Open ${game.name}`}
        className="game-case__open"
        onClick={() => onOpen(game)}
        type="button"
      />
      <div
        className="game-case__art"
        enable-xr
        style={
          {
            "--xr-background-material": "transparent",
            "--xr-back": `${SPATIAL_GAME_COVER_BACK}px`,
          } as CSSProperties
        }
      >
        <button
          aria-hidden="true"
          className="game-case__art-open"
          onClick={() => onOpen(game)}
          tabIndex={-1}
          type="button"
        />
        <GameCoverMedia
          game={game}
          priority={priority}
          variant="card"
        />
        <div className="game-case__scrim" />
        <div className="game-case__browser-controls">
          {collectionToggle}
          {rating}
          {action ? (
            <div className="game-case__collection-action">{action}</div>
          ) : null}
        </div>
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
      </CardContent>
    </Card>
  );
}
