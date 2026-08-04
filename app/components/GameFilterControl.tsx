"use client";

import { ListFilter, X } from "lucide-react";
import type {
  GameFilterOption,
  GameFilterOptions,
  GameFilters,
} from "@/app/lib/game-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ButtonGroup,
} from "@/components/ui/button-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type GameFilterControlProps = {
  filters: GameFilters;
  options: GameFilterOptions;
  onClear: () => void;
  onToggleGenre: (value: string) => void;
  onTogglePlatform: (value: string) => void;
  className?: string;
};

type FilterOptionGroupProps = {
  heading: string;
  options: GameFilterOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
};

function FilterOptionGroup({
  heading,
  options,
  selectedValues,
  onToggle,
}: FilterOptionGroupProps) {
  if (options.length === 0) {
    return null;
  }

  return (
    <CommandGroup heading={heading}>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.slug);

        return (
          <CommandItem
            data-checked={isSelected}
            disabled={option.disabled}
            key={option.slug}
            onSelect={() => onToggle(option.slug)}
            value={`${heading} ${option.name} ${option.slug}`}
          >
            <span>{option.name}</span>
            <Badge
              className="game-filter-command__count"
              variant="secondary"
            >
              {option.count}
            </Badge>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

function getSelectedOptions(
  options: GameFilterOption[],
  selectedValues: string[],
) {
  const selectedValueSet = new Set(selectedValues);
  return options.filter((option) => selectedValueSet.has(option.slug));
}

export function GameFilterControl({
  filters,
  options,
  onClear,
  onToggleGenre,
  onTogglePlatform,
  className,
}: GameFilterControlProps) {
  const selectedGenres = getSelectedOptions(
    options.genres,
    filters.genres,
  );
  const selectedPlatforms = getSelectedOptions(
    options.platforms,
    filters.platforms,
  );
  const selectedOptions = [
    ...selectedGenres.map((option) => ({
      ...option,
      type: "Genre" as const,
    })),
    ...selectedPlatforms.map((option) => ({
      ...option,
      type: "Platform" as const,
    })),
  ];
  const activeCount = filters.genres.length + filters.platforms.length;
  const hasOptions =
    options.genres.length > 0 || options.platforms.length > 0;

  return (
    <div className={cn("game-filter", className)}>
      <ButtonGroup className="game-filter__buttons">
        <Popover>
          <PopoverTrigger
            disabled={!hasOptions}
            render={
              <Button
                aria-label="Filter games"
                size="lg"
                variant="outline"
              />
            }
          >
            <ListFilter aria-hidden="true" data-icon="inline-start" />
            <span>Filter</span>
            {activeCount > 0 ? (
              <Badge variant="secondary">{activeCount}</Badge>
            ) : null}
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="game-filter-popover"
            sideOffset={8}
          >
            <Command>
              <CommandInput placeholder="Search filters…" />
              <CommandList>
                <CommandEmpty>No filters found.</CommandEmpty>
                <FilterOptionGroup
                  heading="Genre"
                  onToggle={onToggleGenre}
                  options={options.genres}
                  selectedValues={filters.genres}
                />
                {options.genres.length > 0 &&
                options.platforms.length > 0 ? (
                  <CommandSeparator />
                ) : null}
                <FilterOptionGroup
                  heading="Platform"
                  onToggle={onTogglePlatform}
                  options={options.platforms}
                  selectedValues={filters.platforms}
                />
              </CommandList>
              <CommandSeparator />
              <Button
                className="game-filter-command__clear"
                disabled={activeCount === 0}
                onClick={onClear}
                size="sm"
                variant="ghost"
              >
                Clear All
              </Button>
            </Command>
          </PopoverContent>
        </Popover>
        {activeCount > 0 ? (
          <Button
            aria-label="Clear all filters"
            onClick={onClear}
            size="icon-lg"
            variant="outline"
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </ButtonGroup>

      {selectedOptions.length > 0 ? (
        <div aria-label="Active filters" className="game-filter__chips">
          {selectedOptions.map((option) => (
            <Badge
              className="game-filter-chip"
              key={`${option.type}-${option.slug}`}
              variant="secondary"
            >
              <span>{option.name}</span>
              <button
                aria-label={`Remove ${option.name} ${option.type.toLocaleLowerCase()} filter`}
                onClick={() => {
                  if (option.type === "Genre") {
                    onToggleGenre(option.slug);
                  } else {
                    onTogglePlatform(option.slug);
                  }
                }}
                type="button"
              >
                <X aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
