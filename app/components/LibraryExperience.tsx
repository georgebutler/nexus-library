"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CollectionPicker } from "@/app/components/CollectionPicker";
import { GameCase } from "@/app/components/GameCase";
import { LibrarySidebar } from "@/app/components/LibrarySidebar";
import { LibraryToolbar } from "@/app/components/LibraryToolbar";
import { PopularGames } from "@/app/components/PopularGames";
import { ProjectFooter } from "@/app/components/ProjectFooter";
import { useSpatialRuntime } from "@/app/components/useSpatialRuntime";
import { useCatalogFeeds } from "@/app/hooks/useCatalogFeeds";
import { useLibrary } from "@/app/hooks/useLibrary";
import {
  areGameFiltersEqual,
  deriveContextualGameFilterOptions,
  EMPTY_GAME_FILTERS,
  filterGames,
  hasActiveGameFilters,
  reconcileGameFilters,
  toggleFilterValue,
} from "@/app/lib/game-filters";
import {
  buildGameUrl,
  buildLibraryUrl,
  parseLibraryLocation,
  type LibraryLocationState,
} from "@/app/lib/library-navigation";
import {
  deriveSmartGenreCollections,
  findSmartGenreCollection,
} from "@/app/lib/smart-genres";
import type { Game } from "@/app/types/game";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

type LibraryExperienceProps = {
  initialLocation: LibraryLocationState;
  initialSidebarOpen: boolean;
};

export function LibraryExperience({
  initialLocation,
  initialSidebarOpen,
}: LibraryExperienceProps) {
  const router = useRouter();
  const { mode } = useSpatialRuntime();
  const isSpatial = mode === "spatial";
  const {
    collections,
    defaultCollectionId,
    activeCollection,
    activeCollectionGames,
    allSavedGames,
    isLoaded,
    createCollection,
    renameCollection,
    deleteCollection,
    selectCollection,
    toggleGameMembership,
    getGameCollectionIds,
  } = useLibrary();
  const [genreSlug, setGenreSlug] = useState(initialLocation.genreSlug);
  const [query, setQuery] = useState(initialLocation.query);
  const [page, setPage] = useState(initialLocation.page);
  const [collectionFilters, setCollectionFilters] = useState(
    initialLocation.collectionFilters,
  );
  const [searchFilters, setSearchFilters] = useState(
    initialLocation.searchFilters,
  );
  const [discoverFilters, setDiscoverFilters] = useState(
    initialLocation.discoverFilters,
  );
  const [isCollectionRestored, setIsCollectionRestored] = useState(false);
  const requestedCollectionId = useRef(initialLocation.collectionId);
  const hasRestoredCollection = useRef(false);
  const {
    hasSearchQuery,
    searchGames,
    searchStatus,
    isSearching,
    isSearchSettled,
    discoverGames,
    isDiscoverLoading,
  } = useCatalogFeeds(query);
  const smartGenres = useMemo(
    () => deriveSmartGenreCollections(allSavedGames),
    [allSavedGames],
  );
  const activeSmartGenre = useMemo(
    () => findSmartGenreCollection(smartGenres, genreSlug),
    [genreSlug, smartGenres],
  );
  const smartViewGames = activeSmartGenre?.games ?? activeCollectionGames;
  const collectionFilterOptions = useMemo(
    () =>
      deriveContextualGameFilterOptions(
        smartViewGames,
        collectionFilters,
        activeSmartGenre?.slug,
      ),
    [activeSmartGenre?.slug, collectionFilters, smartViewGames],
  );
  const searchFilterOptions = useMemo(
    () => deriveContextualGameFilterOptions(searchGames, searchFilters),
    [searchFilters, searchGames],
  );
  const discoverFilterOptions = useMemo(
    () =>
      deriveContextualGameFilterOptions(
        discoverGames,
        discoverFilters,
      ),
    [discoverFilters, discoverGames],
  );
  const visibleCollectionGames = useMemo(
    () => filterGames(smartViewGames, collectionFilters),
    [collectionFilters, smartViewGames],
  );
  const visibleSearchGames = useMemo(
    () => filterGames(searchGames, searchFilters),
    [searchFilters, searchGames],
  );

  useEffect(() => {
    const root = document.documentElement;

    root.classList.toggle("isSpatialLibrary", isSpatial);

    return () => {
      root.classList.remove("isSpatialLibrary");
    };
  }, [isSpatial]);

  useEffect(() => {
    if (!isLoaded || hasRestoredCollection.current) {
      return;
    }

    hasRestoredCollection.current = true;

    if (
      collections.some(
        (collection) => collection.id === requestedCollectionId.current,
      )
    ) {
      selectCollection(requestedCollectionId.current);
    } else {
      requestedCollectionId.current = activeCollection.id;
    }

    setIsCollectionRestored(true);
  }, [
    activeCollection.id,
    collections,
    isLoaded,
    selectCollection,
  ]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const restoreLocation = () => {
      const location = parseLibraryLocation(
        new URLSearchParams(window.location.search),
        defaultCollectionId,
      );

      if (
        collections.some(
          (collection) => collection.id === location.collectionId,
        )
      ) {
        requestedCollectionId.current = location.collectionId;
        selectCollection(location.collectionId);
      }

      setGenreSlug(location.genreSlug);
      setQuery(location.query);
      setPage(location.page);
      setCollectionFilters(location.collectionFilters);
      setSearchFilters(location.searchFilters);
      setDiscoverFilters(location.discoverFilters);
    };

    window.addEventListener("popstate", restoreLocation);
    return () => window.removeEventListener("popstate", restoreLocation);
  }, [collections, defaultCollectionId, isLoaded, selectCollection]);

  useEffect(() => {
    if (!isLoaded || !isCollectionRestored) {
      return;
    }

    if (genreSlug && !activeSmartGenre) {
      setGenreSlug(null);
      setCollectionFilters(EMPTY_GAME_FILTERS);
      setPage(1);
    }
  }, [
    activeSmartGenre,
    genreSlug,
    isCollectionRestored,
    isLoaded,
  ]);

  useEffect(() => {
    if (!isLoaded || !isCollectionRestored) {
      return;
    }

    const nextUrl = buildLibraryUrl({
      collectionId: activeCollection.id,
      genreSlug: activeSmartGenre?.slug ?? null,
      query,
      page,
      collectionFilters,
      searchFilters,
      discoverFilters,
    });
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== nextUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    activeCollection.id,
    activeSmartGenre?.slug,
    collectionFilters,
    discoverFilters,
    isCollectionRestored,
    isLoaded,
    page,
    query,
    router,
    searchFilters,
  ]);

  useEffect(() => {
    if (!isLoaded || !isCollectionRestored) {
      return;
    }

    setCollectionFilters((currentFilters) => {
      const nextFilters = reconcileGameFilters(
        currentFilters,
        collectionFilterOptions,
      );
      return areGameFiltersEqual(currentFilters, nextFilters)
        ? currentFilters
        : nextFilters;
    });
  }, [collectionFilterOptions, isCollectionRestored, isLoaded]);

  useEffect(() => {
    if (!hasSearchQuery || !isSearchSettled) {
      return;
    }

    setSearchFilters((currentFilters) => {
      const nextFilters = reconcileGameFilters(
        currentFilters,
        searchFilterOptions,
      );
      return areGameFiltersEqual(currentFilters, nextFilters)
        ? currentFilters
        : nextFilters;
    });
  }, [hasSearchQuery, isSearchSettled, searchFilterOptions]);

  useEffect(() => {
    if (isDiscoverLoading) {
      return;
    }

    setDiscoverFilters((currentFilters) => {
      const nextFilters = reconcileGameFilters(
        currentFilters,
        discoverFilterOptions,
      );
      return areGameFiltersEqual(currentFilters, nextFilters)
        ? currentFilters
        : nextFilters;
    });
  }, [discoverFilterOptions, isDiscoverLoading]);

  const openGame = useCallback(
    (game: Game) => {
      const returnTo = buildLibraryUrl({
        collectionId: activeCollection.id,
        genreSlug: activeSmartGenre?.slug ?? null,
        query,
        page,
        collectionFilters,
        searchFilters,
        discoverFilters,
      });
      router.push(buildGameUrl(game.id, returnTo));
    },
    [
      activeCollection.id,
      activeSmartGenre?.slug,
      collectionFilters,
      discoverFilters,
      page,
      query,
      router,
      searchFilters,
    ],
  );

  const handleQueryChange = useCallback((nextQuery: string) => {
    setQuery(nextQuery);
    setPage(1);
    setSearchFilters(EMPTY_GAME_FILTERS);
  }, []);

  const handleSelectCollection = useCallback(
    (collectionId: string) => {
      const nextUrl = buildLibraryUrl({
        collectionId,
        genreSlug: null,
        query,
        page: 1,
        collectionFilters: EMPTY_GAME_FILTERS,
        searchFilters,
        discoverFilters,
      });

      router.push(nextUrl, { scroll: false });
      requestedCollectionId.current = collectionId;
      selectCollection(collectionId);
      setGenreSlug(null);
      setPage(1);
      setCollectionFilters(EMPTY_GAME_FILTERS);
    },
    [
      discoverFilters,
      query,
      router,
      searchFilters,
      selectCollection,
    ],
  );
  const handleSelectGenre = useCallback(
    (nextGenreSlug: string) => {
      const nextUrl = buildLibraryUrl({
        collectionId: activeCollection.id,
        genreSlug: nextGenreSlug,
        query: "",
        page: 1,
        collectionFilters: EMPTY_GAME_FILTERS,
        searchFilters: EMPTY_GAME_FILTERS,
        discoverFilters,
      });

      router.push(nextUrl, { scroll: false });
      setGenreSlug(nextGenreSlug);
      setQuery("");
      setPage(1);
      setCollectionFilters(EMPTY_GAME_FILTERS);
      setSearchFilters(EMPTY_GAME_FILTERS);
    },
    [activeCollection.id, discoverFilters, router],
  );

  const visibleGames = hasSearchQuery
    ? visibleSearchGames
    : visibleCollectionGames;
  const unfilteredVisibleGames = hasSearchQuery
    ? searchGames
    : smartViewGames;
  const primaryFilters = hasSearchQuery
    ? searchFilters
    : collectionFilters;
  const primaryFilterOptions = hasSearchQuery
    ? searchFilterOptions
    : collectionFilterOptions;
  const setPrimaryFilters = hasSearchQuery
    ? setSearchFilters
    : setCollectionFilters;
  const hasPrimaryFilters = hasActiveGameFilters(primaryFilters);
  const viewHeading = hasSearchQuery
    ? "Search results"
    : activeSmartGenre
      ? `Browse by Genre — ${activeSmartGenre.name}`
      : activeCollection.name;
  const isSmartView = Boolean(activeSmartGenre);
  const isInActiveCollection = useCallback(
    (gameId: number) => activeCollection.gameIds.includes(gameId),
    [activeCollection.gameIds],
  );
  const toggleActiveCollection = useCallback(
    (game: Game) => {
      toggleGameMembership(game, activeCollection.id);
    },
    [activeCollection.id, toggleGameMembership],
  );
  const togglePrimaryGenre = useCallback(
    (slug: string) => {
      setPrimaryFilters((currentFilters) => ({
        ...currentFilters,
        genres: toggleFilterValue(currentFilters.genres, slug),
      }));
      setPage(1);
    },
    [setPrimaryFilters],
  );
  const togglePrimaryPlatform = useCallback(
    (slug: string) => {
      setPrimaryFilters((currentFilters) => ({
        ...currentFilters,
        platforms: toggleFilterValue(currentFilters.platforms, slug),
      }));
      setPage(1);
    },
    [setPrimaryFilters],
  );
  const clearPrimaryFilters = useCallback(() => {
    setPrimaryFilters(EMPTY_GAME_FILTERS);
    setPage(1);
  }, [setPrimaryFilters]);
  const getCollectionUrl = useCallback(
    (collectionId: string) =>
      buildLibraryUrl({
        collectionId,
        genreSlug: null,
        query,
        page: 1,
        collectionFilters: EMPTY_GAME_FILTERS,
        searchFilters,
        discoverFilters,
      }),
    [discoverFilters, query, searchFilters],
  );
  const getGenreUrl = useCallback(
    (nextGenreSlug: string) =>
      buildLibraryUrl({
        collectionId: activeCollection.id,
        genreSlug: nextGenreSlug,
        query: "",
        page: 1,
        collectionFilters: EMPTY_GAME_FILTERS,
        searchFilters: EMPTY_GAME_FILTERS,
        discoverFilters,
      }),
    [activeCollection.id, discoverFilters],
  );

  return (
    <SidebarProvider
      className="nexus-shell"
      defaultOpen={isSpatial ? true : initialSidebarOpen}
      disablePersistence={isSpatial}
      disableShortcut={isSpatial}
      forceDesktop={isSpatial}
      open={isSpatial ? true : undefined}
      style={
        {
          "--sidebar-width": "240px",
          "--sidebar-width-icon": "48px",
          ...(isSpatial
            ? { "--xr-background-material": "transparent" }
            : {}),
        } as React.CSSProperties
      }
      {...(isSpatial ? { "enable-xr": true } : {})}
    >
      <LibrarySidebar
        activeCollectionId={activeCollection.id}
        activeGenreSlug={activeSmartGenre?.slug ?? null}
        collections={collections}
        defaultCollectionId={defaultCollectionId}
        getCollectionUrl={getCollectionUrl}
        getGenreUrl={getGenreUrl}
        isSpatial={isSpatial}
        onCreateCollection={createCollection}
        onDeleteCollection={deleteCollection}
        onRenameCollection={renameCollection}
        onSelectCollection={handleSelectCollection}
        onSelectGenre={handleSelectGenre}
        smartGenres={smartGenres}
      />

      <SidebarInset className="library-content">
        <header className="site-header library-header">
          {isSpatial ? null : <SidebarTrigger />}
          <LibraryToolbar
            filters={primaryFilters}
            isSearching={isSearching}
            onClearFilters={clearPrimaryFilters}
            onQueryChange={handleQueryChange}
            onToggleGenre={togglePrimaryGenre}
            onTogglePlatform={togglePrimaryPlatform}
            options={primaryFilterOptions}
            query={query}
            status={searchStatus}
          />
        </header>

        <section
          className="library-content__scroll"
          style={
            isSpatial
              ? { "--xr-background-material": "transparent" }
              : undefined
          }
          {...(isSpatial ? { "enable-xr": true } : {})}
        >
          <div className="library-content__inner">
            <div className="library-view">
              <div className="library-view__heading">
                {hasSearchQuery ? (
                  <>
                    <span className="section-kicker">Catalog</span>
                    <h1>{viewHeading}</h1>
                  </>
                ) : (
                  <h1 className="collection-title">
                    <span className="section-kicker">
                      {isSmartView ? "Smart collection" : "Collection"}
                    </span>
                    <span aria-hidden="true"> - </span>
                    {viewHeading}
                  </h1>
                )}
              </div>

              {!isLoaded ? (
                <div
                  aria-label="Loading library"
                  className="library-grid library-loading"
                >
                  <Skeleton />
                  <Skeleton />
                  <Skeleton />
                </div>
              ) : visibleGames.length > 0 ? (
                <div className="library-grid">
                  {visibleGames.map((game, index) => (
                    <GameCase
                      activeCollectionName={
                        isSmartView ? undefined : activeCollection.name
                      }
                      action={
                        hasSearchQuery || isSmartView ? (
                          <CollectionPicker
                            collectionIds={getGameCollectionIds(game.id)}
                            collections={collections}
                            forceEditLabel={isSmartView}
                            game={game}
                            onCreateCollection={createCollection}
                            onToggleMembership={toggleGameMembership}
                          />
                        ) : undefined
                      }
                      game={game}
                      isInActiveCollection={isInActiveCollection(game.id)}
                      key={game.id}
                      onOpen={openGame}
                      onToggleActiveCollection={
                        isSmartView ? undefined : toggleActiveCollection
                      }
                      priority={index < 5}
                    />
                  ))}
                </div>
              ) : hasPrimaryFilters && unfilteredVisibleGames.length > 0 ? (
                <Empty className="library-grid-state">
                  <EmptyHeader>
                    <EmptyTitle>
                      No {hasSearchQuery ? "search results" : "games"} match
                      these filters
                    </EmptyTitle>
                    <EmptyDescription>
                      Clear the active genre and platform filters to show more
                      games.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      onClick={clearPrimaryFilters}
                      size="sm"
                      variant="outline"
                    >
                      Clear filters
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : hasSearchQuery ? (
                <Empty className="library-grid-state">
                  <EmptyHeader>
                    <EmptyTitle>Search results</EmptyTitle>
                    <EmptyDescription>
                      {searchStatus || "No matching games found."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Empty className="library-grid-state">
                  <EmptyHeader>
                    <EmptyTitle>No games in this collection</EmptyTitle>
                    <EmptyDescription>
                      Search for a game by title to add one.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </div>

            <PopularGames
              activeCollectionName={activeCollection.name}
              collections={collections}
              games={discoverGames}
              filters={discoverFilters}
              filterOptions={discoverFilterOptions}
              getGameCollectionIds={getGameCollectionIds}
              isInActiveCollection={isInActiveCollection}
              isLoading={isDiscoverLoading}
              isSmartView={isSmartView}
              isVisible={!hasSearchQuery}
              onCreateCollection={createCollection}
              onFiltersChange={setDiscoverFilters}
              onOpen={openGame}
              onToggleActiveCollection={toggleActiveCollection}
              onToggleMembership={toggleGameMembership}
            />

            <ProjectFooter />
          </div>
        </section>
      </SidebarInset>
    </SidebarProvider>
  );
}
