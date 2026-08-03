"use client";

import { CollectionPicker } from "@/app/components/CollectionPicker";
import { GameCase } from "@/app/components/GameCase";
import type { GameCollection } from "@/app/hooks/useLibrary";
import type { Game } from "@/app/types/game";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";

type PopularGamesProps = {
  activeCollectionName: string;
  collections: GameCollection[];
  getGameCollectionIds: (gameId: number) => string[];
  isInActiveCollection: (gameId: number) => boolean;
  isVisible: boolean;
  games: Game[];
  isLoading: boolean;
  onCreateCollection: (name: string) => string;
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
  getGameCollectionIds,
  isInActiveCollection,
  isVisible,
  games,
  isLoading,
  onCreateCollection,
  onOpen,
  onToggleActiveCollection,
  onToggleMembership,
}: PopularGamesProps) {
  if (!isLoading && games.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="popular-games-heading"
      className="popular-games"
      hidden={!isVisible}
    >
      <div className="popular-games__heading">
        <h2 id="popular-games-heading">Discover</h2>
      </div>

      {isLoading ? (
        <PopularGamesSkeleton />
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
            {games.map((game) => (
              <CarouselItem className="popular-games__slide" key={game.id}>
                <GameCase
                  activeCollectionName={activeCollectionName}
                  action={
                    <CollectionPicker
                      collectionIds={getGameCollectionIds(game.id)}
                      collections={collections}
                      game={game}
                      onCreateCollection={onCreateCollection}
                      onToggleMembership={onToggleMembership}
                    />
                  }
                  game={game}
                  isInActiveCollection={isInActiveCollection(game.id)}
                  onOpen={onOpen}
                  onToggleActiveCollection={onToggleActiveCollection}
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
