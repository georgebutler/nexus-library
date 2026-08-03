"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { SpatialGameShelfItem } from "@/app/components/SpatialGameShelfItem";
import { paginateGames } from "@/app/lib/library-gallery";
import type { Game } from "@/app/types/game";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

type SpatialGameShelfProps = {
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

export function SpatialGameShelf({
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
}: SpatialGameShelfProps) {
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
    <div className="spatial-shelf-frame">
      <div
        aria-label="Games in the current spatial feed"
        className="spatial-shelf"
      >
        {paginated.games.map((game, index) => (
          <SpatialGameShelfItem
            activeCollectionName={activeCollectionName}
            game={game}
            isInActiveCollection={isInActiveCollection(game.id)}
            key={game.id}
            onOpen={onOpen}
            onToggleActiveCollection={onToggleActiveCollection}
            priority={index < 3}
          />
        ))}
      </div>

      {paginated.pageCount > 1 ? (
        <div
          aria-label="Spatial gallery pagination"
          className="spatial-shelf-pagination glass-panel"
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
