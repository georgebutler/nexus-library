"use client";

import type { CSSProperties } from "react";
import { GameCase } from "@/app/components/GameCase";
import type { Game } from "@/app/types/game";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

type LibraryArcProps = {
  activeCollectionName: string;
  games: Game[];
  isLoaded: boolean;
  onOpen: (game: Game) => void;
  onToggleActiveCollection: (game: Game) => void;
};

type ArcStyle = CSSProperties & {
  "--arc-x": string;
  "--arc-z": string;
  "--arc-rotation": string;
  "--arc-delay": string;
};

const ARC_RADIUS = 800;

function getArcStyle(index: number, total: number): ArcStyle {
  const arcSpan = total > 1 ? Math.PI : 0;
  const theta =
    total > 1 ? Math.PI - (index / (total - 1)) * arcSpan : Math.PI / 2;
  const x = ARC_RADIUS * Math.cos(theta);
  const z = ARC_RADIUS * Math.sin(theta);
  const rotation = (theta * 180) / Math.PI - 90;

  return {
    "--arc-x": `${x.toFixed(2)}px`,
    "--arc-z": `${z.toFixed(2)}px`,
    "--arc-rotation": `${rotation.toFixed(2)}deg`,
    "--arc-delay": `${index * 45}ms`,
  };
}

export function LibraryArc({
  activeCollectionName,
  games,
  isLoaded,
  onOpen,
  onToggleActiveCollection,
}: LibraryArcProps) {
  if (!isLoaded) {
    return (
      <div aria-label="Loading library" className="library-loading">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <Empty className="library-empty glass-panel">
        <EmptyHeader>
          <EmptyTitle>No games in this collection</EmptyTitle>
          <EmptyDescription>
            Search for a game by title to add one.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div
      aria-label="Games in the active collection"
      className="library-arc"
      enable-xr
    >
      {games.map((game, index) => (
        <div
          className="library-arc__slot"
          key={game.id}
          style={getArcStyle(index, games.length)}
        >
          <GameCase
            activeCollectionName={activeCollectionName}
            game={game}
            isInActiveCollection
            onOpen={onOpen}
            onToggleActiveCollection={onToggleActiveCollection}
            priority={index < 3}
          />
        </div>
      ))}
    </div>
  );
}
