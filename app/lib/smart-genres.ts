import type { GameCollection } from "@/app/hooks/useLibrary";
import type { Game } from "@/app/types/game";

export const SMART_GENRE_MINIMUM_GAMES = 2;

export type SmartGenreIconName =
  | "action"
  | "adventure"
  | "arcade"
  | "indie"
  | "platformer"
  | "puzzle"
  | "rpg"
  | "shooter"
  | "simulator"
  | "strategy"
  | "fallback";

export type SmartGenreCollection = {
  count: number;
  games: Game[];
  icon: SmartGenreIconName;
  name: string;
  slug: string;
};

const SMART_GENRE_ICONS: Record<string, SmartGenreIconName> = {
  action: "action",
  adventure: "adventure",
  arcade: "arcade",
  indie: "indie",
  platformer: "platformer",
  platform: "platformer",
  puzzle: "puzzle",
  rpg: "rpg",
  "role-playing-rpg": "rpg",
  shooter: "shooter",
  simulator: "simulator",
  simulation: "simulator",
  strategy: "strategy",
};

export function getSmartGenreIconName(slug: string): SmartGenreIconName {
  return SMART_GENRE_ICONS[slug] ?? "fallback";
}

export function getAllSavedGames(
  collections: GameCollection[],
  games: Record<string, Game>,
) {
  const seenIds = new Set<number>();
  const allSavedGames: Game[] = [];

  collections.forEach((collection) => {
    collection.gameIds.forEach((gameId) => {
      const game = games[String(gameId)];

      if (game && !seenIds.has(game.id)) {
        seenIds.add(game.id);
        allSavedGames.push(game);
      }
    });
  });

  return allSavedGames;
}

export function deriveSmartGenreCollections(
  allSavedGames: Game[],
  minimumGames = SMART_GENRE_MINIMUM_GAMES,
) {
  const genreMap = new Map<
    string,
    { games: Game[]; name: string; seenGameIds: Set<number> }
  >();

  allSavedGames.forEach((game) => {
    game.genres.forEach((genre) => {
      const slug = genre.slug.trim().toLocaleLowerCase();
      const name = genre.name.trim();

      if (!slug || !name) {
        return;
      }

      const entry = genreMap.get(slug) ?? {
        games: [],
        name,
        seenGameIds: new Set<number>(),
      };

      if (!entry.seenGameIds.has(game.id)) {
        entry.seenGameIds.add(game.id);
        entry.games.push(game);
      }

      genreMap.set(slug, entry);
    });
  });

  return Array.from(genreMap.entries())
    .flatMap(([slug, entry]): SmartGenreCollection[] =>
      entry.games.length >= minimumGames
        ? [
            {
              count: entry.games.length,
              games: entry.games,
              icon: getSmartGenreIconName(slug),
              name: entry.name,
              slug,
            },
          ]
        : [],
    )
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name),
    );
}

export function findSmartGenreCollection(
  smartGenres: SmartGenreCollection[],
  genreSlug: string | null,
) {
  if (!genreSlug) {
    return null;
  }

  return (
    smartGenres.find((smartGenre) => smartGenre.slug === genreSlug) ?? null
  );
}
