"use client";

import type { CSSProperties } from "react";
import { GameCase } from "@/app/components/GameCase";
import type { Game } from "@/app/types/game";

type LibraryArcProps = {
  games: Game[];
  isLoaded: boolean;
  onOpen: (game: Game) => void;
};

type ArcStyle = CSSProperties & {
  "--arc-x": string;
  "--arc-z": string;
  "--arc-rotation": string;
  "--arc-delay": string;
};

const ARC_RADIUS = 800;

function getArcStyle(index: number, total: number): ArcStyle {
  const arcSpan = total > 1 ? Math.PI : 0;
  const theta =
    total > 1 ? Math.PI - (index / (total - 1)) * arcSpan : Math.PI / 2;
  const x = ARC_RADIUS * Math.cos(theta);
  const z = ARC_RADIUS * Math.sin(theta);
  const rotation = (theta * 180) / Math.PI - 90;

  return {
    "--arc-x": `${x.toFixed(2)}px`,
    "--arc-z": `${z.toFixed(2)}px`,
    "--arc-rotation": `${rotation.toFixed(2)}deg`,
    "--arc-delay": `${index * 45}ms`,
  };
}

export function LibraryArc({ games, isLoaded, onOpen }: LibraryArcProps) {
  if (!isLoaded) {
    return (
      <div aria-label="Loading library" className="library-loading">
        <span />
        <span />
        <span />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="library-empty glass-panel">
        <span>00</span>
        <h2>Your arc is waiting</h2>
        <p>
          Search the catalog below and add a game to begin building your
          spatial library.
        </p>
      </div>
    );
  }

  return (
    <div
      aria-label={`${games.length} saved games`}
      className="library-arc"
      enable-xr
    >
      {games.map((game, index) => (
        <div
          className="library-arc__slot"
          key={game.id}
          style={getArcStyle(index, games.length)}
        >
          <GameCase
            game={game}
            onOpen={onOpen}
            priority={index < 3}
          />
        </div>
      ))}
    </div>
  );
}
