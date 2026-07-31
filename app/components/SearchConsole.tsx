"use client";

import { Search, X } from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type {
  ApiErrorResponse,
  Game,
  GamesApiResponse,
} from "@/app/types/game";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

type SearchConsoleProps = {
  onSearchStateChange: (state: {
    hasQuery: boolean;
    results: Game[];
    status: string;
  }) => void;
};

export function SearchConsole({ onSearchStateChange }: SearchConsoleProps) {
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
  const status = isSearching
    ? "Searching catalog…"
    : error
      ? error
      : hasQuery && results.length === 0
        ? "No matching games found."
        : hasQuery
          ? ""
          : "";

  useEffect(() => {
    onSearchStateChange({ hasQuery, results, status });
  }, [hasQuery, onSearchStateChange, results, status]);

  return (
    <section
      className="search-console glass-panel"
      enable-xr
      style={{ "--xr-background-material": "translucent" }}
    >
      <label className="sr-only" htmlFor="game-search">
        Search games
      </label>
      <InputGroup className="search-field">
        <InputGroupAddon>
          {isSearching ? (
            <Spinner />
          ) : (
            <Search aria-hidden="true" />
          )}
        </InputGroupAddon>
        <InputGroupInput
          autoComplete="off"
          id="game-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search games by title"
          type="search"
          value={query}
        />
        {query ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="Clear search"
              onClick={() => setQuery("")}
              size="icon-xs"
            >
              <X aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      <div aria-live="polite" className="search-console__status">
        {status}
      </div>
    </section>
  );
}
