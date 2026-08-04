"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";
import { CollectionPicker } from "@/app/components/CollectionPicker";
import { GameFilterControl } from "@/app/components/GameFilterControl";
import { GameCase } from "@/app/components/GameCase";
import { useSpatialRuntime } from "@/app/components/useSpatialRuntime";
import type { GameCollection } from "@/app/hooks/useLibrary";
import {
  EMPTY_GAME_FILTERS,
  filterGames,
  hasActiveGameFilters,
  toggleFilterValue,
  type GameFilterOptions,
  type GameFilters,
} from "@/app/lib/game-filters";
import {
  getSpatialDiscoverPageSize,
  paginateSpatialDiscover,
  SPATIAL_DISCOVER_NARROW_PAGE_SIZE,
} from "@/app/lib/spatial-discover";
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
  const { mode } = useSpatialRuntime();
  const isSpatial = mode === "spatial";
  const spatialSectionRef = useRef<HTMLElement>(null);
  const [spatialPage, setSpatialPage] = useState(0);
  const [spatialPageSize, setSpatialPageSize] = useState(
    SPATIAL_DISCOVER_NARROW_PAGE_SIZE,
  );
  const filteredGames = filterGames(games, filters);
  const hasFilters = hasActiveGameFilters(filters);

  useEffect(() => {
    if (!isSpatial || !spatialSectionRef.current) {
      return;
    }

    const updatePageSize = () => {
      const width = spatialSectionRef.current?.clientWidth ?? 0;
      setSpatialPageSize(getSpatialDiscoverPageSize(width));
    };
    const observer = new ResizeObserver(updatePageSize);

    updatePageSize();
    observer.observe(spatialSectionRef.current);

    return () => observer.disconnect();
  }, [isSpatial]);

  const spatialPageData = paginateSpatialDiscover(
    filteredGames,
    spatialPage,
    spatialPageSize,
  );

  useEffect(() => {
    setSpatialPage(spatialPageData.currentPage);
  }, [spatialPageData.currentPage]);

  if (!isLoading && games.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="popular-games-heading"
      className="popular-games"
      hidden={!isVisible}
      ref={spatialSectionRef}
    >
      {isSpatial ? null : (
        <Separator className="popular-games__separator" />
      )}
      <div className="popular-games__heading">
        {isSpatial ? (
          <h2 id="popular-games-heading">Discover</h2>
        ) : (
          <div className="popular-games__title">
            <span className="section-kicker">Beyond your library</span>
            <h2 id="popular-games-heading">Discover</h2>
          </div>
        )}
        <GameFilterControl
          className="popular-games__filters"
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
      ) : isSpatial ? (
        <div className="popular-games__spatial">
          <div
            className="popular-games__spatial-grid"
            key={`${spatialPageData.currentPage}:${spatialPageSize}`}
            style={{
              "--spatial-discover-columns": spatialPageSize,
            } as CSSProperties}
          >
            {spatialPageData.games.map((game) => (
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
                key={game.id}
                onOpen={onOpen}
                onToggleActiveCollection={
                  isSmartView ? undefined : onToggleActiveCollection
                }
                presentation="compact"
              />
            ))}
          </div>

          {spatialPageData.pageCount > 1 ? (
            <div
              aria-label="Discover pages"
              className="popular-games__spatial-pagination"
            >
              <Button
                aria-label="Previous Discover page"
                disabled={spatialPageData.currentPage === 0}
                onClick={() => {
                  setSpatialPage(spatialPageData.currentPage - 1);
                }}
                size="icon-sm"
                variant="outline"
              >
                <ArrowLeft aria-hidden="true" />
              </Button>
              <span>
                {spatialPageData.currentPage + 1} / {spatialPageData.pageCount}
              </span>
              <Button
                aria-label="Next Discover page"
                disabled={
                  spatialPageData.currentPage ===
                  spatialPageData.pageCount - 1
                }
                onClick={() => {
                  setSpatialPage(spatialPageData.currentPage + 1);
                }}
                size="icon-sm"
                variant="outline"
              >
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </div>
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
