"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { CollectionPicker } from "@/app/components/CollectionPicker";
import { CollectionSidebar } from "@/app/components/CollectionSidebar";
import { GameCase } from "@/app/components/GameCase";
import { PopularGames } from "@/app/components/PopularGames";
import { ProjectFooter } from "@/app/components/ProjectFooter";
import { SearchConsole } from "@/app/components/SearchConsole";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useSpatialRuntime } from "@/app/components/useSpatialRuntime";
import { useCatalogFeeds } from "@/app/hooks/useCatalogFeeds";
import { useLibrary } from "@/app/hooks/useLibrary";
import {
  buildGameUrl,
  buildLibraryUrl,
  type LibraryLocationState,
} from "@/app/lib/library-navigation";
import type { Game } from "@/app/types/game";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

type LibraryExperienceProps = {
  initialLocation: LibraryLocationState;
};

export function LibraryExperience({
  initialLocation,
}: LibraryExperienceProps) {
  const router = useRouter();
  const { mode } = useSpatialRuntime();
  const isSpatial = mode === "spatial";
  const {
    collections,
    defaultCollectionId,
    activeCollection,
    activeCollectionGames,
    isLoaded,
    createCollection,
    renameCollection,
    deleteCollection,
    selectCollection,
    toggleGameMembership,
    getGameCollectionIds,
  } = useLibrary();
  const [query, setQuery] = useState(initialLocation.query);
  const [page, setPage] = useState(initialLocation.page);
  const [isCollectionRestored, setIsCollectionRestored] = useState(false);
  const requestedCollectionId = useRef(initialLocation.collectionId);
  const hasRestoredCollection = useRef(false);
  const {
    hasSearchQuery,
    searchGames,
    searchStatus,
    isSearching,
    discoverGames,
    isDiscoverLoading,
  } = useCatalogFeeds(query);

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
    if (!isLoaded || !isCollectionRestored) {
      return;
    }

    const nextUrl = buildLibraryUrl({
      collectionId: activeCollection.id,
      query,
      page,
    });
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== nextUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    activeCollection.id,
    isCollectionRestored,
    isLoaded,
    page,
    query,
    router,
  ]);

  const openGame = useCallback(
    (game: Game) => {
      const returnTo = buildLibraryUrl({
        collectionId: activeCollection.id,
        query,
        page,
      });
      router.push(buildGameUrl(game.id, returnTo));
    },
    [activeCollection.id, page, query, router],
  );

  const handleQueryChange = useCallback((nextQuery: string) => {
    setQuery(nextQuery);
    setPage(1);
  }, []);

  const handleSelectCollection = useCallback(
    (collectionId: string) => {
      requestedCollectionId.current = collectionId;
      selectCollection(collectionId);
      setPage(1);
    },
    [selectCollection],
  );

  const visibleGames = hasSearchQuery
    ? searchGames
    : activeCollectionGames;
  const viewHeading = hasSearchQuery
    ? "Search results"
    : activeCollection.name;
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

  return (
    <main
      className="nexus-shell"
      style={
        isSpatial
          ? { "--xr-background-material": "transparent" }
          : undefined
      }
      {...(isSpatial ? { "enable-xr": true } : {})}
    >
      <SiteHeader />

      <div className="library-layout">
        <CollectionSidebar
          activeCollectionId={activeCollection.id}
          collections={collections}
          defaultCollectionId={defaultCollectionId}
          onCreateCollection={createCollection}
          onDeleteCollection={deleteCollection}
          onRenameCollection={renameCollection}
          onSelectCollection={handleSelectCollection}
          isSpatial={isSpatial}
        />

        <section
          className="library-content"
          style={
            isSpatial
              ? { "--xr-background-material": "regular" }
              : undefined
          }
          {...(isSpatial ? { "enable-xr": true } : {})}
        >
          <div className="library-content__inner">
            <SearchConsole
              isSearching={isSearching}
              onQueryChange={handleQueryChange}
              query={query}
              status={searchStatus}
            />

            <div className="library-view">
              <div className="library-view__heading">
                {hasSearchQuery ? (
                  <>
                    <span className="section-kicker">Catalog</span>
                    <h1>{viewHeading}</h1>
                  </>
                ) : (
                  <h1 className="collection-title">
                    <span className="section-kicker">Collection</span>
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
                      activeCollectionName={activeCollection.name}
                      action={
                        hasSearchQuery ? (
                          <CollectionPicker
                            collectionIds={getGameCollectionIds(game.id)}
                            collections={collections}
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
                      onToggleActiveCollection={toggleActiveCollection}
                      priority={index < 5}
                    />
                  ))}
                </div>
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
              getGameCollectionIds={getGameCollectionIds}
              isInActiveCollection={isInActiveCollection}
              isLoading={isDiscoverLoading}
              isVisible={!hasSearchQuery}
              onCreateCollection={createCollection}
              onOpen={openGame}
              onToggleActiveCollection={toggleActiveCollection}
              onToggleMembership={toggleGameMembership}
            />

            <ProjectFooter />
          </div>
        </section>
      </div>
    </main>
  );
}
