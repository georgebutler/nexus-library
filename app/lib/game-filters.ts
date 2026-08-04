import type {
  Game,
  GameGenre,
  GamePlatformFamily,
} from "@/app/types/game";

export type GameFilters = {
  genres: string[];
  platforms: string[];
};

export type GameFilterOption = {
  count: number;
  disabled: boolean;
  name: string;
  slug: string;
};

export type GameFilterOptions = {
  genres: GameFilterOption[];
  platforms: GameFilterOption[];
};

export const EMPTY_GAME_FILTERS: GameFilters = {
  genres: [],
  platforms: [],
};

const FILTER_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeFilterValues(values: string[]) {
  return Array.from(
    new Set(
      values.flatMap((value) => {
        const normalizedValue = value.trim().toLocaleLowerCase();
        return FILTER_SLUG_PATTERN.test(normalizedValue)
          ? [normalizedValue]
          : [];
      }),
    ),
  ).sort();
}

export function normalizeGameFilters(filters: GameFilters): GameFilters {
  const genres = normalizeFilterValues(filters.genres);
  const platforms = normalizeFilterValues(filters.platforms);

  if (
    genres.length === filters.genres.length &&
    platforms.length === filters.platforms.length &&
    genres.every((value, index) => value === filters.genres[index]) &&
    platforms.every((value, index) => value === filters.platforms[index])
  ) {
    return filters;
  }

  return { genres, platforms };
}

function toOptions(
  values: Array<GameGenre | GamePlatformFamily>,
): GameFilterOption[] {
  const options = new Map<string, GameFilterOption>();

  values.forEach((value) => {
    const slug = value.slug.trim().toLocaleLowerCase();
    const name = value.name.trim();

    if (name && FILTER_SLUG_PATTERN.test(slug) && !options.has(slug)) {
      options.set(slug, { count: 0, disabled: false, name, slug });
    }
  });

  return Array.from(options.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export function deriveGameFilterOptions(
  games: Game[],
): GameFilterOptions {
  return deriveContextualGameFilterOptions(games, EMPTY_GAME_FILTERS);
}

function matchesSelectedGenres(game: Game, selectedGenres: Set<string>) {
  return (
    selectedGenres.size === 0 ||
    game.genres.some((genre) => selectedGenres.has(genre.slug))
  );
}

function matchesSelectedPlatforms(
  game: Game,
  selectedPlatforms: Set<string>,
) {
  return (
    selectedPlatforms.size === 0 ||
    game.platformFamilies.some((platform) =>
      selectedPlatforms.has(platform.slug),
    )
  );
}

function withContextualCounts(
  options: GameFilterOption[],
  games: Game[],
  selectedValues: Set<string>,
  getValues: (game: Game) => Array<GameGenre | GamePlatformFamily>,
) {
  const counts = new Map<string, number>();

  games.forEach((game) => {
    const seenValues = new Set<string>();

    getValues(game).forEach((value) => {
      if (!seenValues.has(value.slug)) {
        seenValues.add(value.slug);
        counts.set(value.slug, (counts.get(value.slug) ?? 0) + 1);
      }
    });
  });

  return options.map((option) => {
    const count = counts.get(option.slug) ?? 0;

    return {
      ...option,
      count,
      disabled: count === 0 && !selectedValues.has(option.slug),
    };
  });
}

export function deriveContextualGameFilterOptions(
  games: Game[],
  filters: GameFilters,
  omittedGenreSlug?: string | null,
): GameFilterOptions {
  const normalizedFilters = normalizeGameFilters(filters);
  const selectedGenres = new Set(normalizedFilters.genres);
  const selectedPlatforms = new Set(normalizedFilters.platforms);
  const genreOptions = toOptions(
    games.flatMap((game) => game.genres),
  ).filter((option) => option.slug !== omittedGenreSlug);
  const platformOptions = toOptions(
    games.flatMap((game) => game.platformFamilies),
  );
  const gamesMatchingPlatforms = games.filter((game) =>
    matchesSelectedPlatforms(game, selectedPlatforms),
  );
  const gamesMatchingGenres = games.filter((game) =>
    matchesSelectedGenres(game, selectedGenres),
  );

  return {
    genres: withContextualCounts(
      genreOptions,
      gamesMatchingPlatforms,
      selectedGenres,
      (game) => game.genres,
    ),
    platforms: withContextualCounts(
      platformOptions,
      gamesMatchingGenres,
      selectedPlatforms,
      (game) => game.platformFamilies,
    ),
  };
}

export function reconcileGameFilters(
  filters: GameFilters,
  options: GameFilterOptions,
): GameFilters {
  const normalizedFilters = normalizeGameFilters(filters);
  const genreSlugs = new Set(options.genres.map((option) => option.slug));
  const platformSlugs = new Set(
    options.platforms.map((option) => option.slug),
  );
  const genres = normalizedFilters.genres.filter((slug) =>
    genreSlugs.has(slug),
  );
  const platforms = normalizedFilters.platforms.filter((slug) =>
    platformSlugs.has(slug),
  );

  if (
    genres.length === filters.genres.length &&
    platforms.length === filters.platforms.length &&
    genres.every((value, index) => value === filters.genres[index]) &&
    platforms.every((value, index) => value === filters.platforms[index])
  ) {
    return filters;
  }

  return { genres, platforms };
}

export function hasActiveGameFilters(filters: GameFilters) {
  return filters.genres.length > 0 || filters.platforms.length > 0;
}

export function areGameFiltersEqual(
  left: GameFilters,
  right: GameFilters,
) {
  return (
    left.genres.length === right.genres.length &&
    left.platforms.length === right.platforms.length &&
    left.genres.every((value, index) => value === right.genres[index]) &&
    left.platforms.every(
      (value, index) => value === right.platforms[index],
    )
  );
}

export function filterGames(games: Game[], filters: GameFilters) {
  const normalizedFilters = normalizeGameFilters(filters);
  const genreSlugs = new Set(normalizedFilters.genres);
  const platformSlugs = new Set(normalizedFilters.platforms);

  if (genreSlugs.size === 0 && platformSlugs.size === 0) {
    return games;
  }

  return games.filter((game) => {
    return (
      matchesSelectedGenres(game, genreSlugs) &&
      matchesSelectedPlatforms(game, platformSlugs)
    );
  });
}

export function toggleFilterValue(
  values: string[],
  value: string,
) {
  const normalizedValue = normalizeFilterValues([value])[0];

  if (!normalizedValue) {
    return values;
  }

  return values.includes(normalizedValue)
    ? values.filter((candidate) => candidate !== normalizedValue)
    : normalizeFilterValues([...values, normalizedValue]);
}
