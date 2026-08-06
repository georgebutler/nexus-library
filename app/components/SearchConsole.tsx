"use client";

import { Search, X } from "lucide-react";
import type { ReactNode } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

type SearchConsoleProps = {
  trailingControl?: ReactNode;
  query: string;
  status: string;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
};

export function SearchConsole({
  trailingControl,
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
          inputMode="search"
          name="game-search"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search games by title…"
          role="searchbox"
          type="text"
          value={query}
        />
        {query || trailingControl ? (
          <InputGroupAddon align="inline-end">
            {query ? (
              <InputGroupButton
                aria-label="Clear search"
                onClick={() => onQueryChange("")}
                size="icon-xs"
              >
                <X aria-hidden="true" />
              </InputGroupButton>
            ) : null}
            {trailingControl ? (
              <Separator
                className="search-field__separator"
                orientation="vertical"
              />
            ) : null}
            {trailingControl}
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      <div aria-live="polite" className="search-console__status">
        {status}
      </div>
    </section>
  );
}
