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
  density?: "default" | "compact";
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

type GameFilterButtonsProps = GameFilterControlProps;

export function GameFilterButtons({
  filters,
  options,
  onClear,
  onToggleGenre,
  onTogglePlatform,
  className,
  density = "default",
}: GameFilterButtonsProps) {
  const activeCount = filters.genres.length + filters.platforms.length;
  const hasOptions =
    options.genres.length > 0 || options.platforms.length > 0;

  return (
    <ButtonGroup
      className={cn("game-filter__buttons", className)}
      data-density={density}
    >
      <Popover>
        <PopoverTrigger
          disabled={!hasOptions}
          render={
            <Button
              aria-label="Filter games"
              className="game-filter__trigger"
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
          className="game-filter__clear"
          onClick={onClear}
          size="icon-lg"
          variant="outline"
        >
          <X aria-hidden="true" />
        </Button>
      ) : null}
    </ButtonGroup>
  );
}

type GameFilterChipsProps = Pick<
  GameFilterControlProps,
  | "className"
  | "filters"
  | "onToggleGenre"
  | "onTogglePlatform"
  | "options"
>;

export function GameFilterChips({
  className,
  filters,
  onToggleGenre,
  onTogglePlatform,
  options,
}: GameFilterChipsProps) {
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

  if (selectedOptions.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Active filters"
      className={cn("game-filter__chips", className)}
    >
      {selectedOptions.map((option) => (
        <Badge
          className="game-filter-chip"
          key={`${option.type}-${option.slug}`}
          variant="secondary"
        >
          <span>{option.name}</span>
          <Button
            aria-label={`Remove ${option.name} ${option.type.toLocaleLowerCase()} filter`}
            className="game-filter-chip__remove"
            onClick={() => {
              if (option.type === "Genre") {
                onToggleGenre(option.slug);
              } else {
                onTogglePlatform(option.slug);
              }
            }}
            size="icon-xs"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </Badge>
      ))}
    </div>
  );
}

export function GameFilterControl(props: GameFilterControlProps) {
  return (
    <div className={cn("game-filter", props.className)}>
      <GameFilterButtons {...props} className={undefined} />
      <GameFilterChips
        filters={props.filters}
        onToggleGenre={props.onToggleGenre}
        onTogglePlatform={props.onTogglePlatform}
        options={props.options}
      />
    </div>
  );
}
