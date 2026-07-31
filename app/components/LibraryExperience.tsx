"use client";

import { initScene } from "@webspatial/react-sdk";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { CollectionPicker } from "@/app/components/CollectionPicker";
import { CollectionSidebar } from "@/app/components/CollectionSidebar";
import { GameCase } from "@/app/components/GameCase";
import { LibraryArc } from "@/app/components/LibraryArc";
import { PopularGames } from "@/app/components/PopularGames";
import { ProjectFooter } from "@/app/components/ProjectFooter";
import { SearchConsole } from "@/app/components/SearchConsole";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useLibrary } from "@/app/hooks/useLibrary";
import type { Game } from "@/app/types/game";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

type SearchViewState = {
  hasQuery: boolean;
  results: Game[];
  status: string;
};

const INITIAL_SEARCH_STATE: SearchViewState = {
  hasQuery: false,
  results: [],
  status: "",
};

export function LibraryExperience() {
  const router = useRouter();
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
  const [searchView, setSearchView] =
    useState<SearchViewState>(INITIAL_SEARCH_STATE);

  const openGame = useCallback((game: Game) => {
    const sceneName = `nexus-game-${game.id}`;
    const gameUrl = `/game/${game.id}`;

    if (document.documentElement.dataset.spatial !== "true") {
      router.push(gameUrl);
      return;
    }

    initScene(sceneName, (previousConfig) => ({
      ...previousConfig,
      defaultSize: {
        width: 1080,
        height: 760,
      },
    }));

    const scene = window.open(gameUrl, sceneName);

    if (!scene) {
      router.push(gameUrl);
    }
  }, [router]);

  const handleSearchStateChange = useCallback(
    (nextState: SearchViewState) => {
      setSearchView(nextState);
    },
    [],
  );

  const visibleGames = searchView.hasQuery
    ? searchView.results
    : activeCollectionGames;
  const viewHeading = searchView.hasQuery
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
      enable-xr
      style={{ "--xr-background-material": "transparent" }}
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
          onSelectCollection={selectCollection}
        />

        <section className="library-content">
          <SearchConsole onSearchStateChange={handleSearchStateChange} />

          <div className="library-view">
            <div className="library-view__heading">
              {searchView.hasQuery ? (
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
                      searchView.hasQuery ? (
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
            ) : searchView.hasQuery ? (
              <Empty className="library-grid-state">
                <EmptyHeader>
                  <EmptyTitle>Search results</EmptyTitle>
                  <EmptyDescription>
                    {searchView.status || "No matching games found."}
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
            getGameCollectionIds={getGameCollectionIds}
            isInActiveCollection={isInActiveCollection}
            isVisible={!searchView.hasQuery}
            onCreateCollection={createCollection}
            onOpen={openGame}
            onToggleActiveCollection={toggleActiveCollection}
            onToggleMembership={toggleGameMembership}
          />

          <ProjectFooter />
        </section>
      </div>

      <section aria-label={activeCollection.name} className="spatial-library">
        <div
          className="spatial-library__heading glass-panel"
          enable-xr
          style={{ "--xr-background-material": "translucent" }}
        >
          <h1 className="collection-title">
            <span className="section-kicker">Collection</span>
            <span aria-hidden="true"> - </span>
            {activeCollection.name}
          </h1>
        </div>
        <LibraryArc
          activeCollectionName={activeCollection.name}
          games={activeCollectionGames}
          isLoaded={isLoaded}
          onOpen={openGame}
          onToggleActiveCollection={toggleActiveCollection}
        />
      </section>

      {searchView.hasQuery ? (
        <section
          aria-label="Search results"
          className="spatial-search-results glass-panel"
          enable-xr
          style={{ "--xr-background-material": "translucent" }}
        >
          <h2>Search results</h2>
          {searchView.results.length > 0 ? (
            <div className="spatial-search-results__grid">
              {searchView.results.map((game) => (
                <GameCase
                  activeCollectionName={activeCollection.name}
                  action={
                    <CollectionPicker
                      collectionIds={getGameCollectionIds(game.id)}
                      collections={collections}
                      game={game}
                      onCreateCollection={createCollection}
                      onToggleMembership={toggleGameMembership}
                    />
                  }
                  game={game}
                  isInActiveCollection={isInActiveCollection(game.id)}
                  key={game.id}
                  onOpen={openGame}
                  onToggleActiveCollection={toggleActiveCollection}
                />
              ))}
            </div>
          ) : (
            <p>{searchView.status || "No matching games found."}</p>
          )}
        </section>
      ) : null}

    </main>
  );
}
