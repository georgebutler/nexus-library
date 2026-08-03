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
import { SpatialGameShelf } from "@/app/components/SpatialGameShelf";
import { SpatialErrorBoundary } from "@/app/components/SpatialErrorBoundary";
import { useSpatialRuntime } from "@/app/components/useSpatialRuntime";
import { useCatalogFeeds } from "@/app/hooks/useCatalogFeeds";
import { useLibrary } from "@/app/hooks/useLibrary";
import {
  clampPage,
  getGalleryFeedKey,
  getPageAfterFeedChange,
  selectGalleryFeed,
} from "@/app/lib/library-gallery";
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
  const {
    mode,
    error: runtimeError,
    fallbackToBrowser,
  } = useSpatialRuntime();
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
  const hasAppliedInitialFeed = useRef(false);
  const {
    hasSearchQuery,
    searchGames,
    searchStatus,
    isSearching,
    discoverGames,
    discoverError,
    isDiscoverLoading,
  } = useCatalogFeeds(query);

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

  const galleryFeed = selectGalleryFeed({
    hasSearchQuery,
    searchResults: searchGames,
    collectionGames: activeCollectionGames,
    collectionName: activeCollection.name,
    discoverGames,
  });
  const isGalleryLoading =
    !isLoaded ||
    !isCollectionRestored ||
    (galleryFeed.kind === "search" && isSearching) ||
    (galleryFeed.kind === "discover" && isDiscoverLoading);
  const feedKey = getGalleryFeedKey(
    galleryFeed.kind,
    activeCollection.id,
    query,
  );
  const previousFeedKey = useRef(feedKey);
  const currentPage = isGalleryLoading
    ? page
    : !hasAppliedInitialFeed.current
      ? clampPage(page, galleryFeed.games.length)
    : getPageAfterFeedChange(
        previousFeedKey.current,
        feedKey,
        page,
        galleryFeed.games.length,
      );

  useEffect(() => {
    if (!isGalleryLoading) {
      hasAppliedInitialFeed.current = true;
      previousFeedKey.current = feedKey;
    }

    if (!isGalleryLoading && currentPage !== page) {
      setPage(currentPage);
    }
  }, [currentPage, feedKey, isGalleryLoading, page]);

  useEffect(() => {
    if (!isLoaded || !isCollectionRestored) {
      return;
    }

    const nextUrl = buildLibraryUrl({
      collectionId: activeCollection.id,
      query,
      page: currentPage,
    });
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== nextUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    activeCollection.id,
    currentPage,
    isCollectionRestored,
    isLoaded,
    query,
    router,
  ]);

  const openGame = useCallback(
    (game: Game) => {
      const returnTo = buildLibraryUrl({
        collectionId: activeCollection.id,
        query,
        page: currentPage,
      });
      router.push(buildGameUrl(game.id, returnTo));
    },
    [activeCollection.id, currentPage, query, router],
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

  const searchConsole = (
    <SearchConsole
      isSearching={isSearching}
      onQueryChange={handleQueryChange}
      query={query}
      status={searchStatus}
    />
  );

  const browserExperience = (
    <main className="nexus-shell">
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
        />

        <section className="library-content">
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
              <div aria-label="Loading library" className="library-loading">
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
        </section>
      </div>
    </main>
  );

  if (mode === "spatial" && !runtimeError) {
    const emptyTitle =
      galleryFeed.kind === "search"
        ? "Search results"
        : galleryFeed.kind === "discover"
          ? "Discover unavailable"
          : "No games in this collection";
    const emptyDescription =
      galleryFeed.kind === "search"
        ? searchStatus || "No matching games found."
        : galleryFeed.kind === "discover"
          ? discoverError || "Discover games could not be loaded."
          : "Search for a game by title to add one.";

    return (
      <SpatialErrorBoundary
        fallback={browserExperience}
        onError={fallbackToBrowser}
      >
        <main
          className="nexus-shell spatial-workspace"
          enable-xr
          style={{
            "--xr-background-material": "transparent",
            "--xr-back": "0px",
          }}
        >
          <SiteHeader />

          <div className="spatial-workspace__layout">
            <CollectionSidebar
              activeCollectionId={activeCollection.id}
              collections={collections}
              defaultCollectionId={defaultCollectionId}
              managementMode="create-only"
              onCreateCollection={createCollection}
              onDeleteCollection={deleteCollection}
              onRenameCollection={renameCollection}
              onSelectCollection={handleSelectCollection}
            />

            <section className="spatial-workspace__content">
              {searchConsole}

              <section
                aria-label={galleryFeed.heading}
                className="spatial-gallery"
              >
                <div className="spatial-gallery__heading glass-panel">
                  <span className="section-kicker">
                    {galleryFeed.kind === "collection"
                      ? "Collection"
                      : "Catalog"}
                  </span>
                  <h1>{galleryFeed.heading}</h1>
                </div>

                <SpatialGameShelf
                  activeCollectionName={activeCollection.name}
                  emptyDescription={emptyDescription}
                  emptyTitle={emptyTitle}
                  games={galleryFeed.games}
                  isInActiveCollection={isInActiveCollection}
                  isLoaded={!isGalleryLoading}
                  onOpen={openGame}
                  onPageChange={setPage}
                  onToggleActiveCollection={toggleActiveCollection}
                  page={currentPage}
                  placementKey={`${feedKey}:page:${currentPage}`}
                />
              </section>
            </section>
          </div>
        </main>
      </SpatialErrorBoundary>
    );
  }

  return browserExperience;
}
