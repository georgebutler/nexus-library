"use client";

import Image from "next/image";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Gamepad2,
  Plus,
  Star,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NexusMark } from "@/app/components/NexusMark";
import { useLibrary } from "@/app/hooks/useLibrary";
import type {
  ApiErrorResponse,
  Game,
  GameApiResponse,
} from "@/app/types/game";

type GameDetailsProps = {
  gameId: string;
};

export function GameDetails({ gameId }: GameDetailsProps) {
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addGame, removeGame, isSaved, isLoaded } = useLibrary();

  useEffect(() => {
    const controller = new AbortController();

    async function loadGame() {
      try {
        const response = await fetch(`/api/games?id=${gameId}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as
          | GameApiResponse
          | ApiErrorResponse;

        if (!response.ok) {
          throw new Error(
            "error" in payload ? payload.error : "Unable to load this game.",
          );
        }

        if ("result" in payload) {
          setGame(payload.result);
          setError(null);
        }
      } catch (caughtError) {
        if (!controller.signal.aborted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load this game.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadGame();
    return () => controller.abort();
  }, [gameId]);

  if (isLoading) {
    return (
      <main className="details-state">
        <NexusMark className="details-state__mark" />
        <p>Opening spatial record…</p>
      </main>
    );
  }

  if (error || !game) {
    return (
      <main className="details-state">
        <NexusMark className="details-state__mark" />
        <h1>Record unavailable</h1>
        <p>{error ?? "This game could not be found."}</p>
        <button onClick={() => window.close()} type="button">
          Close panel
        </button>
      </main>
    );
  }

  const saved = isSaved(game.id);
  const screenshots =
    game.short_screenshots.length > 0
      ? game.short_screenshots
      : game.background_image
        ? [{ id: game.id, image: game.background_image }]
        : [];

  return (
    <main
      className="details-shell"
      enable-xr
      style={{ "--xr-background-material": "transparent" }}
    >
      <header className="details-header">
        <button
          className="icon-button"
          onClick={() => {
            if (window.opener) {
              window.close();
            } else {
              window.location.assign("/");
            }
          }}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={18} />
          Back to library
        </button>
        <div className="details-brand">
          <NexusMark />
          <span>Nexus record · {game.id}</span>
        </div>
      </header>

      <section
        className="details-panel glass-panel"
        enable-xr
        style={{ "--xr-background-material": "translucent" }}
      >
        <div className="details-cover">
          {game.background_image ? (
            <Image
              alt={`${game.name} cover art`}
              fill
              priority
              sizes="(max-width: 800px) 100vw, 40vw"
              src={game.background_image}
            />
          ) : (
            <div className="game-case__placeholder">
              {game.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div className="details-copy">
          <span className="section-kicker">
            <Gamepad2 aria-hidden="true" size={14} />
            Game archive
          </span>
          <h1>{game.name}</h1>

          <div className="details-metrics">
            <span>
              <Star aria-hidden="true" fill="currentColor" size={16} />
              {game.rating.toFixed(1)} rating
            </span>
            <span>
              <CalendarDays aria-hidden="true" size={16} />
              {game.released ?? "Release TBA"}
            </span>
            {game.metacritic !== null ? (
              <span className="metacritic-badge">
                <Trophy aria-hidden="true" size={15} />
                {game.metacritic} Metacritic
              </span>
            ) : null}
          </div>

          <div className="genre-list">
            {game.genres.map((genre) => (
              <span key={genre.id}>{genre.name}</span>
            ))}
          </div>

          <button
            className={saved ? "library-toggle is-saved" : "library-toggle"}
            disabled={!isLoaded}
            onClick={() => {
              if (saved) {
                removeGame(game.id);
              } else {
                addGame(game);
              }
            }}
            type="button"
          >
            {saved ? (
              <Check aria-hidden="true" size={18} />
            ) : (
              <Plus aria-hidden="true" size={18} />
            )}
            {saved ? "Remove from library" : "Add to library"}
          </button>
        </div>
      </section>

      {screenshots.length > 0 ? (
        <section className="screenshot-section">
          <div className="screenshot-section__heading">
            <span className="section-kicker">Visual archive</span>
            <h2>Captured worlds</h2>
          </div>
          <div className="screenshot-grid">
            {screenshots.slice(0, 6).map((screenshot, index) => (
              <figure
                className={index === 0 ? "screenshot is-featured" : "screenshot"}
                enable-xr
                key={`${screenshot.id}-${index}`}
              >
                <Image
                  alt={`${game.name} screenshot ${index + 1}`}
                  fill
                  sizes={
                    index === 0
                      ? "(max-width: 800px) 100vw, 66vw"
                      : "(max-width: 800px) 50vw, 33vw"
                  }
                  src={screenshot.image}
                />
              </figure>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
