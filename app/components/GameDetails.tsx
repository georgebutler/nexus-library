"use client";

import Image from "next/image";
import {
  ArrowLeft,
  CalendarDays,
  Code2,
  ExternalLink,
  Globe2,
  Building2,
  Monitor,
  Star,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CollectionPicker } from "@/app/components/CollectionPicker";
import { NexusMark } from "@/app/components/NexusMark";
import { PlatformIcons } from "@/app/components/PlatformIcons";
import { ProjectFooter } from "@/app/components/ProjectFooter";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useLibrary } from "@/app/hooks/useLibrary";
import type {
  ApiErrorResponse,
  Game,
  GameApiResponse,
} from "@/app/types/game";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type GameDetailsProps = {
  gameId: string;
};

export function GameDetails({ gameId }: GameDetailsProps) {
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    collections,
    isLoaded,
    createCollection,
    toggleGameMembership,
    getGameCollectionIds,
  } = useLibrary();

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

  const handleBackToLibrary = () => {
    if (
      document.documentElement.dataset.spatial === "true" &&
      window.opener
    ) {
      window.close();
    } else {
      router.push("/");
    }
  };
  const header = (
    <SiteHeader
      action={
        <Button onClick={handleBackToLibrary} variant="ghost">
          <ArrowLeft aria-hidden="true" data-icon="inline-start" />
          Back to library
        </Button>
      }
    />
  );

  if (isLoading) {
    return (
      <main className="details-page">
        {header}
        <div className="details-shell">
          <Card className="details-panel details-panel--loading">
            <Skeleton className="details-cover" />
            <div className="details-copy">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-9 w-36" />
            </div>
          </Card>
        </div>
      </main>
    );
  }

  if (error || !game) {
    return (
      <main className="details-page">
        {header}
        <div className="details-shell details-state">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <NexusMark />
              </EmptyMedia>
              <EmptyTitle>Game unavailable</EmptyTitle>
              <EmptyDescription>
                {error ?? "This game could not be found."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
      </main>
    );
  }

  const screenshots =
    (game.short_screenshots?.length ?? 0) > 0
      ? game.short_screenshots
      : game.background_image
        ? [{ id: game.id, image: game.background_image }]
        : [];
  const developers = game.developers ?? [];
  const publishers = game.publishers ?? [];

  return (
    <main
      className="details-page"
      enable-xr
      style={{ "--xr-background-material": "transparent" }}
    >
      {header}

      <div className="details-shell">
        <Card
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

          <CardContent className="details-copy">
            <div className="details-genres">
              {(game.genres ?? []).map((genre) => (
                <Badge key={genre.id} variant="secondary">
                  {genre.name}
                </Badge>
              ))}
            </div>
            <h1>{game.name}</h1>

            <div className="details-metrics">
              <Badge variant="outline">
                <Star
                  aria-hidden="true"
                  data-icon="inline-start"
                  fill="currentColor"
                />
                {game.rating.toFixed(1)} rating
              </Badge>
              <Badge variant="outline">
                <CalendarDays aria-hidden="true" data-icon="inline-start" />
                {game.released ?? "Release TBA"}
              </Badge>
              {game.metacritic !== null ? (
                <Badge variant="outline">
                  <Trophy aria-hidden="true" data-icon="inline-start" />
                  {game.metacritic} Metacritic
                </Badge>
              ) : null}
            </div>

            {game.description ? (
              <p className="details-summary">{game.description}</p>
            ) : null}

            <CollectionPicker
              collectionIds={getGameCollectionIds(game.id)}
              collections={collections}
              disabled={!isLoaded}
              game={game}
              onCreateCollection={createCollection}
              onToggleMembership={toggleGameMembership}
              size="large"
            />
          </CardContent>
        </Card>

        <section className="details-information">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                {game.description ??
                  "No description is currently available for this game."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Game information</CardTitle>
              <CardDescription>
                Platforms, creators, and official links.
              </CardDescription>
            </CardHeader>
            <CardContent className="game-information">
              <div>
                <Monitor aria-hidden="true" />
                <span>Platforms</span>
                {(game.platformFamilies?.length ?? 0) > 0 ? (
                  <PlatformIcons
                    className="platform-icons--details"
                    platforms={game.platformFamilies ?? []}
                  />
                ) : (
                  <strong>Not available</strong>
                )}
              </div>
              <Separator />
              <div>
                <Code2 aria-hidden="true" />
                <span>Developers</span>
                <strong>
                  {developers.length > 0
                    ? developers.join(", ")
                    : "Not available"}
                </strong>
              </div>
              <Separator />
              <div>
                <Building2 aria-hidden="true" />
                <span>Publishers</span>
                <strong>
                  {publishers.length > 0
                    ? publishers.join(", ")
                    : "Not available"}
                </strong>
              </div>
              {game.website ? (
                <>
                  <Separator />
                  <div>
                    <Globe2 aria-hidden="true" />
                    <span>Website</span>
                    <a href={game.website} rel="noreferrer" target="_blank">
                      Visit official site
                      <ExternalLink aria-hidden="true" />
                    </a>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </section>

        {screenshots.length > 0 ? (
          <section className="screenshot-section">
            <div className="screenshot-section__heading">
              <h2>Screenshots</h2>
            </div>
            <div className="screenshot-grid">
              {screenshots.slice(0, 6).map((screenshot, index) => (
                <figure
                  className="screenshot"
                  enable-xr
                  key={`${screenshot.id}-${index}`}
                >
                  <Image
                    alt={`${game.name} screenshot ${index + 1}`}
                    fill
                    sizes="(max-width: 720px) 100vw, (max-width: 980px) 50vw, 33vw"
                    src={screenshot.image}
                  />
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <ProjectFooter />
      </div>
    </main>
  );
}
