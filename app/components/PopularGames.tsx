"use client";

import { useEffect, useState } from "react";
import { CollectionPicker } from "@/app/components/CollectionPicker";
import { GameCase } from "@/app/components/GameCase";
import type { GameCollection } from "@/app/hooks/useLibrary";
import type {
  ApiErrorResponse,
  Game,
  GamesApiResponse,
} from "@/app/types/game";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type PopularGamesProps = {
  activeCollectionName: string;
  collections: GameCollection[];
  getGameCollectionIds: (gameId: number) => string[];
  isInActiveCollection: (gameId: number) => boolean;
  isVisible: boolean;
  onCreateCollection: (name: string) => string;
  onOpen: (game: Game) => void;
  onToggleActiveCollection: (game: Game) => void;
  onToggleMembership: (game: Game, collectionId: string) => void;
};

const POPULAR_GAME_COUNT = 8;

function PopularGamesSkeleton() {
  return (
    <div aria-label="Loading popular games" className="library-grid">
      {Array.from({ length: POPULAR_GAME_COUNT }, (_, index) => (
        <Card
          aria-hidden="true"
          className="game-case game-case--skeleton"
          key={index}
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
      ))}
    </div>
  );
}

export function PopularGames({
  activeCollectionName,
  collections,
  getGameCollectionIds,
  isInActiveCollection,
  isVisible,
  onCreateCollection,
  onOpen,
  onToggleActiveCollection,
  onToggleMembership,
}: PopularGamesProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPopularGames() {
      try {
        const response = await fetch(
          `/api/games?mode=popular&page_size=${POPULAR_GAME_COUNT}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as
          | GamesApiResponse
          | ApiErrorResponse;

        if (!response.ok || !("results" in payload)) {
          throw new Error("Unable to load popular games.");
        }

        setGames(payload.results);
      } catch {
        if (!controller.signal.aborted) {
          setHasFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadPopularGames();
    return () => controller.abort();
  }, []);

  if (hasFailed || (!isLoading && games.length === 0)) {
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
        <div className="library-grid">
          {games.map((game) => (
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
              key={game.id}
              onOpen={onOpen}
              onToggleActiveCollection={onToggleActiveCollection}
            />
          ))}
        </div>
      )}
    </section>
  );
}
