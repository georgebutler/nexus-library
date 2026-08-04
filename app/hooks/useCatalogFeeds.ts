"use client";

import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  ApiErrorResponse,
  Game,
  GamesApiResponse,
} from "@/app/types/game";

const SEARCH_GAME_COUNT = 20;
export const DISCOVER_GAME_COUNT = 20;

type FeedState = {
  games: Game[];
  isLoading: boolean;
  isSettled: boolean;
  error: string | null;
};

const INITIAL_FEED_STATE: FeedState = {
  games: [],
  isLoading: false,
  isSettled: false,
  error: null,
};

async function getGames(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  const payload = (await response.json()) as
    | GamesApiResponse
    | ApiErrorResponse;

  if (!response.ok || !("results" in payload)) {
    throw new Error(
      "error" in payload ? payload.error : "Unable to load games.",
    );
  }

  return payload.results;
}

export function useCatalogFeeds(query: string) {
  const deferredQuery = useDeferredValue(query.trim());
  const searchRequestId = useRef(0);
  const [search, setSearch] = useState<FeedState>(INITIAL_FEED_STATE);
  const [discover, setDiscover] = useState<FeedState>({
    ...INITIAL_FEED_STATE,
    isLoading: true,
  });

  useEffect(() => {
    const controller = new AbortController();

    void getGames(
      `/api/games?mode=popular&page_size=${DISCOVER_GAME_COUNT}`,
      controller.signal,
    )
      .then((games) => {
        setDiscover({
          games,
          isLoading: false,
          isSettled: true,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setDiscover({
            games: [],
            isLoading: false,
            isSettled: true,
            error:
              error instanceof Error
                ? error.message
                : "Unable to load Discover games.",
          });
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (deferredQuery.length < 2) {
      searchRequestId.current += 1;
      setSearch(INITIAL_FEED_STATE);
      return;
    }

    const requestId = ++searchRequestId.current;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setSearch((current) => ({
        games: current.games,
        isLoading: true,
        isSettled: false,
        error: null,
      }));

      void getGames(
        `/api/games?search=${encodeURIComponent(deferredQuery)}&page_size=${SEARCH_GAME_COUNT}`,
        controller.signal,
      )
        .then((games) => {
          if (requestId === searchRequestId.current) {
            setSearch({
              games,
              isLoading: false,
              isSettled: true,
              error: null,
            });
          }
        })
        .catch((error: unknown) => {
          if (
            !controller.signal.aborted &&
            requestId === searchRequestId.current
          ) {
            setSearch({
              games: [],
              isLoading: false,
              isSettled: true,
              error:
                error instanceof Error
                  ? error.message
                  : "Search failed. Please try again.",
            });
          }
        });
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [deferredQuery]);

  const hasSearchQuery = deferredQuery.length >= 2;
  const searchStatus = search.isLoading
    ? "Searching catalog…"
    : search.error
      ? search.error
      : hasSearchQuery && search.games.length === 0
        ? "No matching games found."
        : "";

  return {
    deferredQuery,
    hasSearchQuery,
    searchGames: search.games,
    searchStatus,
    isSearching: search.isLoading,
    isSearchSettled: search.isSettled,
    discoverGames: discover.games,
    discoverError: discover.error,
    isDiscoverLoading: discover.isLoading,
  };
}
