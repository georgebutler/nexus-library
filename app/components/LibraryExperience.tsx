"use client";

import { initScene } from "@webspatial/react-sdk";
import { Library, Radio, ScanLine } from "lucide-react";
import { useCallback } from "react";
import { LibraryArc } from "@/app/components/LibraryArc";
import { NexusMark } from "@/app/components/NexusMark";
import { SearchConsole } from "@/app/components/SearchConsole";
import { useLibrary } from "@/app/hooks/useLibrary";
import type { Game } from "@/app/types/game";

export function LibraryExperience() {
  const { ownedGames, isLoaded, addGame, isSaved } = useLibrary();

  const openGame = useCallback((game: Game) => {
    const sceneName = `nexus-game-${game.id}`;
    const gameUrl = `/game/${game.id}`;

    initScene(sceneName, (previousConfig) => ({
      ...previousConfig,
      defaultSize: {
        width: 1080,
        height: 760,
      },
    }));

    const scene = window.open(gameUrl, sceneName, "noopener,noreferrer");

    if (!scene) {
      window.location.assign(gameUrl);
    }
  }, []);

  return (
    <main
      className="nexus-shell"
      enable-xr
      style={{ "--xr-background-material": "transparent" }}
    >
      <header className="nexus-header">
        <a aria-label="Nexus Library home" className="nexus-brand" href="/">
          <NexusMark className="nexus-brand__mark" />
          <span>
            <strong>Nexus</strong>
            <small>Spatial game library</small>
          </span>
        </a>

        <div className="nexus-status glass-panel" enable-xr>
          <Radio aria-hidden="true" size={16} />
          <span>Catalog link active</span>
          <b>{ownedGames.length.toString().padStart(2, "0")}</b>
        </div>
      </header>

      <section className="library-hero">
        <div className="library-hero__copy">
          <span className="section-kicker">
            <ScanLine aria-hidden="true" size={14} />
            Immersive collection
          </span>
          <h1>Your worlds,<br />within reach.</h1>
          <p>
            Curate a personal game archive that unfolds around you in spatial
            computing.
          </p>
        </div>

        <div className="library-hero__counter">
          <Library aria-hidden="true" size={18} />
          <span>
            <b>{ownedGames.length}</b>
            {ownedGames.length === 1 ? " saved world" : " saved worlds"}
          </span>
        </div>

        <LibraryArc
          games={ownedGames}
          isLoaded={isLoaded}
          onOpen={openGame}
        />
      </section>

      <SearchConsole isSaved={isSaved} onAdd={addGame} onOpen={openGame} />

      <footer className="nexus-footer">
        <span>Nexus Library · Local-first collection</span>
        <span>Powered by RAWG and WebSpatial</span>
      </footer>
    </main>
  );
}
