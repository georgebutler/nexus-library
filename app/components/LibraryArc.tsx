"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { GameCase } from "@/app/components/GameCase";
import {
  getArcTransform,
  paginateGames,
} from "@/app/lib/library-gallery";
import type { Game } from "@/app/types/game";
import { Button } from "@/components/ui/button";
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
  page: number;
  emptyTitle: string;
  emptyDescription: string;
  onPageChange: (page: number) => void;
  onOpen: (game: Game) => void;
  onToggleActiveCollection: (game: Game) => void;
  isInActiveCollection: (gameId: number) => boolean;
};

type ArcStyle = CSSProperties & {
  "--arc-x": string;
  "--arc-z": string;
  "--arc-rotation": string;
};

function getArcStyle(index: number, total: number): ArcStyle {
  const transform = getArcTransform(index, total);

  return {
    "--arc-x": `${transform.x.toFixed(2)}px`,
    "--arc-z": `${transform.z.toFixed(2)}px`,
    "--arc-rotation": `${transform.rotationY.toFixed(2)}deg`,
  };
}

export function LibraryArc({
  activeCollectionName,
  games,
  isLoaded,
  page,
  emptyTitle,
  emptyDescription,
  onPageChange,
  onOpen,
  onToggleActiveCollection,
  isInActiveCollection,
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
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const paginated = paginateGames(games, page);

  return (
    <div className="library-arc-frame">
      <div
        aria-label="Games in the current spatial feed"
        className="library-arc"
      >
        {paginated.games.map((game, index) => (
          <div
            className="library-arc__slot"
            enable-xr
            key={game.id}
            style={getArcStyle(index, paginated.games.length)}
          >
            <GameCase
              activeCollectionName={activeCollectionName}
              game={game}
              isInActiveCollection={isInActiveCollection(game.id)}
              onOpen={onOpen}
              onToggleActiveCollection={onToggleActiveCollection}
              priority={index < 3}
            />
          </div>
        ))}
      </div>

      {paginated.pageCount > 1 ? (
        <div
          aria-label="Spatial gallery pagination"
          className="library-arc-pagination glass-panel"
          enable-xr
        >
          <Button
            aria-label="Previous page"
            disabled={paginated.currentPage === 1}
            onClick={() => onPageChange(paginated.currentPage - 1)}
            size="icon"
            variant="ghost"
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <span>
            Page {paginated.currentPage} of {paginated.pageCount}
          </span>
          <Button
            aria-label="Next page"
            disabled={paginated.currentPage === paginated.pageCount}
            onClick={() => onPageChange(paginated.currentPage + 1)}
            size="icon"
            variant="ghost"
          >
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
