"use client";

import {
  type Dispatch,
  type SetStateAction,
} from "react";
import { CollectionPicker } from "@/app/components/CollectionPicker";
import { GameFilterControl } from "@/app/components/GameFilterControl";
import { GameCase } from "@/app/components/GameCase";
import type { GameCollection } from "@/app/hooks/useLibrary";
import {
  EMPTY_GAME_FILTERS,
  filterGames,
  hasActiveGameFilters,
  toggleFilterValue,
  type GameFilterOptions,
  type GameFilters,
} from "@/app/lib/game-filters";
import type { Game } from "@/app/types/game";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";

type PopularGamesProps = {
  activeCollectionName: string;
  collections: GameCollection[];
  filters: GameFilters;
  filterOptions: GameFilterOptions;
  getGameCollectionIds: (gameId: number) => string[];
  isInActiveCollection: (gameId: number) => boolean;
  isSmartView: boolean;
  isVisible: boolean;
  games: Game[];
  isLoading: boolean;
  onCreateCollection: (name: string) => string;
  onFiltersChange: Dispatch<SetStateAction<GameFilters>>;
  onOpen: (game: Game) => void;
  onToggleActiveCollection: (game: Game) => void;
  onToggleMembership: (game: Game, collectionId: string) => void;
};

function PopularGamesSkeleton() {
  return (
    <Carousel
      aria-label="Loading top-rated games"
      className="popular-games__carousel"
      opts={{ align: "start" }}
    >
      <CarouselContent>
        {Array.from({ length: 7 }, (_, index) => (
          <CarouselItem className="popular-games__slide" key={index}>
            <Card
              aria-hidden="true"
              className="game-case game-case--skeleton"
              size="sm"
            >
              <Skeleton className="game-case__art" />
              <CardContent className="game-case__body">
                <Skeleton className="popular-games__skeleton-line popular-games__skeleton-line--short" />
                <Skeleton className="popular-games__skeleton-line" />
                <Skeleton className="popular-games__skeleton-platforms" />
                <Skeleton className="popular-games__skeleton-action" />
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}

export function PopularGames({
  activeCollectionName,
  collections,
  filters,
  filterOptions,
  getGameCollectionIds,
  isInActiveCollection,
  isSmartView,
  isVisible,
  games,
  isLoading,
  onCreateCollection,
  onFiltersChange,
  onOpen,
  onToggleActiveCollection,
  onToggleMembership,
}: PopularGamesProps) {
  const filteredGames = filterGames(games, filters);
  const hasFilters = hasActiveGameFilters(filters);

  if (!isLoading && games.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="popular-games-heading"
      className="popular-games"
      hidden={!isVisible}
    >
      <Separator className="popular-games__separator" />
      <div className="popular-games__heading">
        <div className="popular-games__title">
          <span className="section-kicker">Beyond your library</span>
          <h2 id="popular-games-heading">Discover</h2>
        </div>
        <GameFilterControl
          className="popular-games__filters"
          density="compact"
          filters={filters}
          onClear={() => onFiltersChange(EMPTY_GAME_FILTERS)}
          onToggleGenre={(slug) => {
            onFiltersChange((currentFilters) => ({
              ...currentFilters,
              genres: toggleFilterValue(
                currentFilters.genres,
                slug,
              ),
            }));
          }}
          onTogglePlatform={(slug) => {
            onFiltersChange((currentFilters) => ({
              ...currentFilters,
              platforms: toggleFilterValue(
                currentFilters.platforms,
                slug,
              ),
            }));
          }}
          options={filterOptions}
        />
      </div>

      {isLoading ? (
        <PopularGamesSkeleton />
      ) : filteredGames.length === 0 && hasFilters ? (
        <Empty className="library-grid-state popular-games__empty">
          <EmptyHeader>
            <EmptyTitle>No Discover games match these filters</EmptyTitle>
            <EmptyDescription>
              Clear the active genre and platform filters to show more games.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={() => onFiltersChange(EMPTY_GAME_FILTERS)}
              size="sm"
              variant="outline"
            >
              Clear filters
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <Carousel
          aria-label="Top-rated games"
          className="popular-games__carousel"
          opts={{
            align: "start",
            slidesToScroll: "auto",
          }}
        >
          <CarouselContent>
            {filteredGames.map((game) => (
              <CarouselItem className="popular-games__slide" key={game.id}>
                <GameCase
                  activeCollectionName={
                    isSmartView ? undefined : activeCollectionName
                  }
                  action={
                    <CollectionPicker
                      collectionIds={getGameCollectionIds(game.id)}
                      collections={collections}
                      forceEditLabel={isSmartView}
                      game={game}
                      onCreateCollection={onCreateCollection}
                      onToggleMembership={onToggleMembership}
                    />
                  }
                  game={game}
                  isInActiveCollection={isInActiveCollection(game.id)}
                  onOpen={onOpen}
                  onToggleActiveCollection={
                    isSmartView ? undefined : onToggleActiveCollection
                  }
                  presentation="compact"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="popular-games__previous" />
          <CarouselNext className="popular-games__next" />
        </Carousel>
      )}
    </section>
  );
}
