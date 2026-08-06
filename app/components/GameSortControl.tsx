"use client";

import type { GameSort } from "@/app/lib/game-sort";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GameSortControlProps = {
  onChange: (sort: GameSort) => void;
  value: GameSort;
};

const SORT_OPTIONS: Array<{ label: string; value: GameSort }> = [
  { label: "Default order", value: "default" },
  { label: "Title A–Z", value: "title" },
  { label: "Release date — newest", value: "released" },
  { label: "Rating — highest", value: "rating" },
];

export function GameSortControl({
  onChange,
  value,
}: GameSortControlProps) {
  return (
    <div className="game-sort-control">
      <span className="sr-only" id="game-sort-label">
        Sort games
      </span>
      <Select
        items={SORT_OPTIONS}
        onValueChange={(nextValue) => onChange(nextValue as GameSort)}
        value={value}
      >
        <SelectTrigger
          aria-labelledby="game-sort-label"
          className="game-sort-control__trigger"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectGroup>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
