"use client";

import {
  GameFilterButtons,
  GameFilterChips,
} from "@/app/components/GameFilterControl";
import { SearchConsole } from "@/app/components/SearchConsole";
import type {
  GameFilterOptions,
  GameFilters,
} from "@/app/lib/game-filters";

type LibraryToolbarProps = {
  filters: GameFilters;
  isSearching: boolean;
  options: GameFilterOptions;
  query: string;
  status: string;
  onClearFilters: () => void;
  onQueryChange: (query: string) => void;
  onToggleGenre: (slug: string) => void;
  onTogglePlatform: (slug: string) => void;
};

export function LibraryToolbar({
  filters,
  isSearching,
  options,
  query,
  status,
  onClearFilters,
  onQueryChange,
  onToggleGenre,
  onTogglePlatform,
}: LibraryToolbarProps) {
  return (
    <div className="library-toolbar">
      <SearchConsole
        isSearching={isSearching}
        onQueryChange={onQueryChange}
        query={query}
        status={status}
      />
      <GameFilterButtons
        className="library-toolbar__filter-buttons"
        filters={filters}
        onClear={onClearFilters}
        onToggleGenre={onToggleGenre}
        onTogglePlatform={onTogglePlatform}
        options={options}
      />
      <GameFilterChips
        className="library-toolbar__filter-chips"
        filters={filters}
        onToggleGenre={onToggleGenre}
        onTogglePlatform={onTogglePlatform}
        options={options}
      />
    </div>
  );
}
