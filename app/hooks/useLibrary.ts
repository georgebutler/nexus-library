"use client";

import { useCallback, useEffect, useState } from "react";
import type { Game } from "@/app/types/game";

export const LIBRARY_STORAGE_KEY = "nexus_library_games";

function isStoredGame(value: unknown): value is Game {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as Game).id === "number" &&
      typeof (value as Game).name === "string",
  );
}

function readLibrary(): Game[] {
  try {
    const storedValue = window.localStorage.getItem(LIBRARY_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue.filter(isStoredGame) : [];
  } catch {
    return [];
  }
}

export function useLibrary() {
  const [ownedGames, setOwnedGames] = useState<Game[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setOwnedGames(readLibrary());
    setIsLoaded(true);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LIBRARY_STORAGE_KEY) {
        setOwnedGames(readLibrary());
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const saveGames = useCallback((update: (games: Game[]) => Game[]) => {
    setOwnedGames((currentGames) => {
      const nextGames = update(currentGames);
      window.localStorage.setItem(
        LIBRARY_STORAGE_KEY,
        JSON.stringify(nextGames),
      );
      return nextGames;
    });
  }, []);

  const addGame = useCallback(
    (game: Game) => {
      saveGames((currentGames) =>
        currentGames.some((savedGame) => savedGame.id === game.id)
          ? currentGames
          : [...currentGames, game],
      );
    },
    [saveGames],
  );

  const removeGame = useCallback(
    (id: number) => {
      saveGames((currentGames) =>
        currentGames.filter((game) => game.id !== id),
      );
    },
    [saveGames],
  );

  const isSaved = useCallback(
    (id: number) => ownedGames.some((game) => game.id === id),
    [ownedGames],
  );

  return {
    ownedGames,
    isLoaded,
    addGame,
    removeGame,
    isSaved,
  };
}
