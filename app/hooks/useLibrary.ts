"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getUniquePlatformFamilies,
  resolvePlatformFamilies,
} from "@/app/lib/platforms";
import type { Game } from "@/app/types/game";

export const LEGACY_LIBRARY_STORAGE_KEY = "nexus_library_games";
export const PREVIOUS_COLLECTIONS_STORAGE_KEY = "nexus_library_collections_v2";
export const COLLECTIONS_STORAGE_KEY = "nexus_library_collections_v3";
export const DEFAULT_COLLECTION_ID = "my-games";
export const COLLECTION_NAME_MAX_LENGTH = 40;

export type GameCollection = {
  id: string;
  name: string;
  gameIds: number[];
};

export type GameCollectionState = {
  version: 3;
  games: Record<string, Game>;
  collections: GameCollection[];
  defaultCollectionId: string;
  activeCollectionId: string;
};

function isStoredGame(value: unknown): value is Game {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as Game).id === "number" &&
      typeof (value as Game).name === "string",
  );
}

function normalizeGame(value: unknown): Game | null {
  if (!isStoredGame(value)) {
    return null;
  }

  const game = value as Partial<Game> & Pick<Game, "id" | "name">;
  const platforms = Array.isArray(game.platforms)
    ? game.platforms.filter(
        (platform): platform is string => typeof platform === "string",
      )
    : [];
  const storedPlatformFamilies = Array.isArray(game.platformFamilies)
    ? getUniquePlatformFamilies(
        game.platformFamilies.flatMap((family) => {
          if (
            !family ||
            typeof family !== "object" ||
            typeof family.id !== "number" ||
            !Number.isFinite(family.id) ||
            typeof family.name !== "string" ||
            typeof family.slug !== "string"
          ) {
            return [];
          }

          const name = family.name.trim();
          const slug = family.slug.trim();

          return name && slug
            ? [{ id: family.id, name, slug }]
            : [];
        }),
      )
    : [];
  const platformFamilies = resolvePlatformFamilies(
    platforms,
    storedPlatformFamilies,
  );

  return {
    id: game.id,
    name: game.name,
    slug: typeof game.slug === "string" ? game.slug : String(game.id),
    background_image:
      typeof game.background_image === "string" ? game.background_image : null,
    coverAspectRatio:
      typeof game.coverAspectRatio === "number" &&
      Number.isFinite(game.coverAspectRatio) &&
      game.coverAspectRatio > 0
        ? game.coverAspectRatio
        : null,
    hero_image:
      typeof game.hero_image === "string"
        ? game.hero_image
        : typeof game.background_image === "string"
          ? game.background_image
          : null,
    description:
      typeof game.description === "string" ? game.description : null,
    website: typeof game.website === "string" ? game.website : null,
    released: typeof game.released === "string" ? game.released : null,
    rating:
      typeof game.rating === "number" && Number.isFinite(game.rating)
        ? game.rating
        : null,
    criticScore:
      typeof game.criticScore === "number" &&
      Number.isFinite(game.criticScore)
        ? game.criticScore
        : null,
    genres: Array.isArray(game.genres) ? game.genres : [],
    platforms,
    platformFamilies,
    developers: Array.isArray(game.developers) ? game.developers : [],
    publishers: Array.isArray(game.publishers) ? game.publishers : [],
    short_screenshots: Array.isArray(game.short_screenshots)
      ? game.short_screenshots
      : [],
  };
}

function createEmptyState(): GameCollectionState {
  return {
    version: 3,
    games: {},
    collections: [
      {
        id: DEFAULT_COLLECTION_ID,
        name: "My Games",
        gameIds: [],
      },
    ],
    defaultCollectionId: DEFAULT_COLLECTION_ID,
    activeCollectionId: DEFAULT_COLLECTION_ID,
  };
}

function normalizeCollectionState(value: unknown): GameCollectionState {
  const emptyState = createEmptyState();

  if (!value || typeof value !== "object") {
    return emptyState;
  }

  const candidate = value as Partial<GameCollectionState>;
  const normalizedGames: Record<string, Game> = {};

  if (
    candidate.games &&
    typeof candidate.games === "object" &&
    !Array.isArray(candidate.games)
  ) {
    Object.values(candidate.games).forEach((value) => {
      const game = normalizeGame(value);

      if (game) {
        normalizedGames[String(game.id)] = game;
      }
    });
  }

  const seenIds = new Set<string>();
  const collections = Array.isArray(candidate.collections)
    ? candidate.collections.flatMap((value): GameCollection[] => {
        if (!value || typeof value !== "object") {
          return [];
        }

        const collection = value as Partial<GameCollection>;
        const id = typeof collection.id === "string" ? collection.id.trim() : "";
        const name =
          typeof collection.name === "string" ? collection.name.trim() : "";

        if (
          !id ||
          !name ||
          name.length > COLLECTION_NAME_MAX_LENGTH ||
          seenIds.has(id)
        ) {
          return [];
        }

        seenIds.add(id);
        const gameIds = Array.isArray(collection.gameIds)
          ? Array.from(
              new Set(
                collection.gameIds.filter(
                  (gameId): gameId is number =>
                    typeof gameId === "number" &&
                    Number.isFinite(gameId) &&
                    Boolean(normalizedGames[String(gameId)]),
                ),
              ),
            )
          : [];

        return [{ id, name, gameIds }];
      })
    : [];

  const requestedDefaultId =
    typeof candidate.defaultCollectionId === "string"
      ? candidate.defaultCollectionId
      : DEFAULT_COLLECTION_ID;
  const defaultCollection =
    collections.find((collection) => collection.id === requestedDefaultId) ??
    collections.find((collection) => collection.id === DEFAULT_COLLECTION_ID);
  const defaultCollectionId =
    defaultCollection?.id ?? DEFAULT_COLLECTION_ID;

  if (!defaultCollection) {
    collections.unshift(emptyState.collections[0]);
  } else {
    const defaultIndex = collections.indexOf(defaultCollection);

    if (defaultIndex > 0) {
      collections.splice(defaultIndex, 1);
      collections.unshift(defaultCollection);
    }
  }

  const requestedActiveId =
    typeof candidate.activeCollectionId === "string"
      ? candidate.activeCollectionId
      : defaultCollectionId;
  const activeCollectionId = collections.some(
    (collection) => collection.id === requestedActiveId,
  )
    ? requestedActiveId
    : defaultCollectionId;

  return {
    version: 3,
    games: normalizedGames,
    collections,
    defaultCollectionId,
    activeCollectionId,
  };
}

export function migrateCollectionStateToV3(
  value: unknown,
): GameCollectionState {
  if (!value || typeof value !== "object") {
    return createEmptyState();
  }

  const previousState = value as Partial<GameCollectionState>;
  const collections = Array.isArray(previousState.collections)
    ? previousState.collections.map((collection) => ({
        ...collection,
        gameIds: [],
      }))
    : [];

  return normalizeCollectionState({
    ...previousState,
    version: 3,
    games: {},
    collections,
  });
}

function readLegacyGames(): Game[] {
  try {
    const storedValue = window.localStorage.getItem(
      LEGACY_LIBRARY_STORAGE_KEY,
    );

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    return Array.isArray(parsedValue)
      ? parsedValue.flatMap((value) => {
          const game = normalizeGame(value);
          return game ? [game] : [];
        })
      : [];
  } catch {
    return [];
  }
}

function readOrMigrateLibrary(): GameCollectionState {
  const storedValue = window.localStorage.getItem(COLLECTIONS_STORAGE_KEY);

  if (storedValue !== null) {
    try {
      return normalizeCollectionState(JSON.parse(storedValue));
    } catch {
      return createEmptyState();
    }
  }

  const previousValue = window.localStorage.getItem(
    PREVIOUS_COLLECTIONS_STORAGE_KEY,
  );
  let migratedState = createEmptyState();

  if (previousValue !== null) {
    try {
      migratedState = migrateCollectionStateToV3(JSON.parse(previousValue));
    } catch {
      migratedState = createEmptyState();
    }
  } else if (readLegacyGames().length > 0) {
    migratedState = createEmptyState();
  }

  window.localStorage.setItem(
    COLLECTIONS_STORAGE_KEY,
    JSON.stringify(migratedState),
  );

  return migratedState;
}

function getNameError(
  name: string,
  collections: GameCollection[],
  excludedCollectionId?: string,
): string | null {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "Enter a collection name.";
  }

  if (trimmedName.length > COLLECTION_NAME_MAX_LENGTH) {
    return `Collection names must be ${COLLECTION_NAME_MAX_LENGTH} characters or fewer.`;
  }

  const normalizedName = trimmedName.toLocaleLowerCase();
  const hasDuplicate = collections.some(
    (collection) =>
      collection.id !== excludedCollectionId &&
      collection.name.toLocaleLowerCase() === normalizedName,
  );

  return hasDuplicate ? "A collection with this name already exists." : null;
}

function createCollectionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `collection-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function removeUnreferencedGames(state: GameCollectionState) {
  const referencedIds = new Set(
    state.collections.flatMap((collection) => collection.gameIds),
  );
  const games = Object.fromEntries(
    Object.entries(state.games).filter(([gameId]) =>
      referencedIds.has(Number(gameId)),
    ),
  );

  return { ...state, games };
}

export function useLibrary() {
  const [library, setLibrary] = useState<GameCollectionState>(createEmptyState);
  const libraryRef = useRef(library);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const initialState = readOrMigrateLibrary();
    libraryRef.current = initialState;
    setLibrary(initialState);
    setIsLoaded(true);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === COLLECTIONS_STORAGE_KEY) {
        let nextState = createEmptyState();

        if (event.newValue !== null) {
          try {
            nextState = normalizeCollectionState(JSON.parse(event.newValue));
          } catch {
            // Keep a valid local state if another window writes invalid data.
          }
        }

        libraryRef.current = nextState;
        setLibrary(nextState);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const commitUpdate = useCallback(
    (update: (state: GameCollectionState) => GameCollectionState) => {
      const nextState = update(libraryRef.current);
      libraryRef.current = nextState;
      window.localStorage.setItem(
        COLLECTIONS_STORAGE_KEY,
        JSON.stringify(nextState),
      );
      setLibrary(nextState);
      return nextState;
    },
    [],
  );

  const createCollection = useCallback(
    (name: string) => {
      const error = getNameError(name, libraryRef.current.collections);

      if (error) {
        throw new Error(error);
      }

      const collection: GameCollection = {
        id: createCollectionId(),
        name: name.trim(),
        gameIds: [],
      };

      commitUpdate((currentState) => ({
        ...currentState,
        collections: [...currentState.collections, collection],
      }));

      return collection.id;
    },
    [commitUpdate],
  );

  const renameCollection = useCallback(
    (collectionId: string, name: string) => {
      const currentState = libraryRef.current;
      const collection = currentState.collections.find(
        (candidate) => candidate.id === collectionId,
      );

      if (!collection) {
        throw new Error("This collection no longer exists.");
      }

      const error = getNameError(
        name,
        currentState.collections,
        collectionId,
      );

      if (error) {
        throw new Error(error);
      }

      commitUpdate((state) => ({
        ...state,
        collections: state.collections.map((candidate) =>
          candidate.id === collectionId
            ? { ...candidate, name: name.trim() }
            : candidate,
        ),
      }));
    },
    [commitUpdate],
  );

  const deleteCollection = useCallback(
    (collectionId: string) => {
      const currentState = libraryRef.current;

      if (collectionId === currentState.defaultCollectionId) {
        throw new Error("The default collection cannot be deleted.");
      }

      if (
        !currentState.collections.some(
          (collection) => collection.id === collectionId,
        )
      ) {
        return;
      }

      commitUpdate((state) =>
        removeUnreferencedGames({
          ...state,
          collections: state.collections.filter(
            (collection) => collection.id !== collectionId,
          ),
          activeCollectionId:
            state.activeCollectionId === collectionId
              ? state.defaultCollectionId
              : state.activeCollectionId,
        }),
      );
    },
    [commitUpdate],
  );

  const selectCollection = useCallback(
    (collectionId: string) => {
      if (
        !libraryRef.current.collections.some(
          (collection) => collection.id === collectionId,
        )
      ) {
        return;
      }

      commitUpdate((state) => ({
        ...state,
        activeCollectionId: collectionId,
      }));
    },
    [commitUpdate],
  );

  const toggleGameMembership = useCallback(
    (game: Game, collectionId: string) => {
      if (
        !libraryRef.current.collections.some(
          (collection) => collection.id === collectionId,
        )
      ) {
        return;
      }

      commitUpdate((state) => {
        const targetCollection = state.collections.find(
          (collection) => collection.id === collectionId,
        );

        if (!targetCollection) {
          return state;
        }

        const isMember = targetCollection.gameIds.includes(game.id);
        const nextState: GameCollectionState = {
          ...state,
          games: isMember
            ? state.games
            : { ...state.games, [String(game.id)]: game },
          collections: state.collections.map((collection) =>
            collection.id === collectionId
              ? {
                  ...collection,
                  gameIds: isMember
                    ? collection.gameIds.filter((gameId) => gameId !== game.id)
                    : [...collection.gameIds, game.id],
                }
              : collection,
          ),
        };

        return isMember ? removeUnreferencedGames(nextState) : nextState;
      });
    },
    [commitUpdate],
  );

  const activeCollection =
    library.collections.find(
      (collection) => collection.id === library.activeCollectionId,
    ) ?? library.collections[0];

  const activeCollectionGames = useMemo(
    () =>
      activeCollection.gameIds.flatMap((gameId) => {
        const game = library.games[String(gameId)];
        return game ? [game] : [];
      }),
    [activeCollection.gameIds, library.games],
  );

  const getGameCollectionIds = useCallback(
    (gameId: number) =>
      library.collections.flatMap((collection) =>
        collection.gameIds.includes(gameId) ? [collection.id] : [],
      ),
    [library.collections],
  );

  const isGameSaved = useCallback(
    (gameId: number) =>
      library.collections.some((collection) =>
        collection.gameIds.includes(gameId),
      ),
    [library.collections],
  );

  return {
    collections: library.collections,
    defaultCollectionId: library.defaultCollectionId,
    activeCollection,
    activeCollectionGames,
    isLoaded,
    createCollection,
    renameCollection,
    deleteCollection,
    selectCollection,
    toggleGameMembership,
    getGameCollectionIds,
    isGameSaved,
  };
}
