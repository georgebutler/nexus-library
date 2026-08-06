import type { Game } from "@/app/types/game";

export const GAME_SORT_VALUES = [
  "default",
  "title",
  "released",
  "rating",
] as const;

export type GameSort = (typeof GAME_SORT_VALUES)[number];

export function normalizeGameSort(value: string | null): GameSort {
  return value === "title" || value === "released" || value === "rating"
    ? value
    : "default";
}

function compareByTitleAndId(left: Game, right: Game) {
  return (
    left.name.localeCompare(right.name, undefined, {
      sensitivity: "base",
    }) || left.id - right.id
  );
}

function compareOptionalNumbers(
  left: Game,
  right: Game,
  getValue: (game: Game) => number | null,
) {
  const leftValue = getValue(left);
  const rightValue = getValue(right);

  if (leftValue === null && rightValue !== null) {
    return 1;
  }

  if (leftValue !== null && rightValue === null) {
    return -1;
  }

  if (
    leftValue !== null &&
    rightValue !== null &&
    leftValue !== rightValue
  ) {
    return rightValue - leftValue;
  }

  return compareByTitleAndId(left, right);
}

function getReleaseTimestamp(game: Game) {
  if (!game.released) {
    return null;
  }

  const timestamp = Date.parse(game.released);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getRating(game: Game) {
  return game.rating !== null && Number.isFinite(game.rating)
    ? game.rating
    : null;
}

export function sortGames(games: Game[], sort: GameSort) {
  const sortedGames = [...games];

  if (sort === "title") {
    return sortedGames.sort(compareByTitleAndId);
  }

  if (sort === "released") {
    return sortedGames.sort((left, right) =>
      compareOptionalNumbers(left, right, getReleaseTimestamp),
    );
  }

  if (sort === "rating") {
    return sortedGames.sort((left, right) =>
      compareOptionalNumbers(left, right, getRating),
    );
  }

  return sortedGames;
}
