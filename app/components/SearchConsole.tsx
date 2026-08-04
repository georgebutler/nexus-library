"use client";

import { Search, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

type SearchConsoleProps = {
  query: string;
  status: string;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
};

export function SearchConsole({
  query,
  status,
  isSearching,
  onQueryChange,
}: SearchConsoleProps) {
  return (
    <section className="search-console glass-panel">
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
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search games by title…"
          type="search"
          value={query}
        />
        {query ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="Clear search"
              onClick={() => onQueryChange("")}
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
