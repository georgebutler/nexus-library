"use client";

import { Search, Sparkles, X } from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { GameCase } from "@/app/components/GameCase";
import type {
  ApiErrorResponse,
  Game,
  GamesApiResponse,
} from "@/app/types/game";

type SearchConsoleProps = {
  isSaved: (id: number) => boolean;
  onAdd: (game: Game) => void;
  onOpen: (game: Game) => void;
};

export function SearchConsole({
  isSaved,
  onAdd,
  onOpen,
}: SearchConsoleProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startSearchTransition] = useTransition();
  const deferredQuery = useDeferredValue(query.trim());
  const requestId = useRef(0);

  useEffect(() => {
    if (deferredQuery.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const currentRequest = ++requestId.current;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      startSearchTransition(async () => {
        try {
          const response = await fetch(
            `/api/games?search=${encodeURIComponent(deferredQuery)}&page_size=8`,
            { signal: controller.signal },
          );
          const payload = (await response.json()) as
            | GamesApiResponse
            | ApiErrorResponse;

          if (!response.ok) {
            throw new Error(
              "error" in payload ? payload.error : "Search failed.",
            );
          }

          if (currentRequest === requestId.current && "results" in payload) {
            setResults(payload.results);
            setError(null);
          }
        } catch (caughtError) {
          if (
            !controller.signal.aborted &&
            currentRequest === requestId.current
          ) {
            setResults([]);
            setError(
              caughtError instanceof Error
                ? caughtError.message
                : "Search failed. Please try again.",
            );
          }
        }
      });
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [deferredQuery]);

  const hasQuery = deferredQuery.length >= 2;

  return (
    <section
      className="search-console glass-panel"
      enable-xr
      style={{ "--xr-background-material": "translucent" }}
    >
      <div className="search-console__heading">
        <div>
          <span className="section-kicker">Command console</span>
          <h2>Find your next world</h2>
        </div>
        <Sparkles aria-hidden="true" size={22} />
      </div>

      <label className="search-field">
        <Search aria-hidden="true" size={20} />
        <span className="sr-only">Search games</span>
        <input
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search the RAWG catalog"
          type="search"
          value={query}
        />
        {query ? (
          <button
            aria-label="Clear search"
            onClick={() => setQuery("")}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        ) : null}
      </label>

      <div aria-live="polite" className="search-console__status">
        {isSearching
          ? "Scanning catalog…"
          : error
            ? error
            : hasQuery && results.length === 0
              ? "No matching games found."
              : hasQuery
                ? `${results.length} matches`
                : "Type at least two characters to search."}
      </div>

      {results.length > 0 ? (
        <div className="search-results">
          {results.map((game, index) => (
            <GameCase
              game={game}
              isSaved={isSaved(game.id)}
              key={game.id}
              onAdd={onAdd}
              onOpen={onOpen}
              priority={index < 2}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
