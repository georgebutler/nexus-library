"use client";

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
import { GameCoverMedia } from "@/app/components/GameCoverMedia";
import { NexusMark } from "@/app/components/NexusMark";
import { PlatformIcons } from "@/app/components/PlatformIcons";
import { ProjectFooter } from "@/app/components/ProjectFooter";
import { ScreenshotLightbox } from "@/app/components/ScreenshotLightbox";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useSpatialRuntime } from "@/app/components/useSpatialRuntime";
import { useLibrary } from "@/app/hooks/useLibrary";
import { formatLongDate } from "@/app/lib/date";
import type {
  ApiErrorResponse,
  Game,
  GameApiResponse,
} from "@/app/types/game";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  returnTo: string;
};

export function GameDetails({ gameId, returnTo }: GameDetailsProps) {
  const router = useRouter();
  const { mode } = useSpatialRuntime();
  const isSpatial = mode === "spatial";
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
    const root = document.documentElement;

    root.classList.toggle("isSpatialDetails", isSpatial);

    return () => {
      root.classList.remove("isSpatialDetails");
    };
  }, [isSpatial]);

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
    router.push(returnTo);
  };
  const breadcrumbTitle = isLoading
    ? "Game Details"
    : error || !game
      ? "Game Unavailable"
      : game.name;
  const header = (
    <SiteHeader
      action={
        <Button
          aria-label="Back to library"
          onClick={handleBackToLibrary}
          variant="ghost"
        >
          <ArrowLeft aria-hidden="true" data-icon="inline-start" />
          <span className="details-back-label">Back to library</span>
        </Button>
      }
      center={
        <Breadcrumb className="details-breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={returnTo}>Library</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem className="details-breadcrumb__current">
              <BreadcrumbPage className="truncate" title={breadcrumbTitle}>
                {breadcrumbTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    />
  );

  if (isLoading) {
    return (
      <main
        className="details-page"
        style={
          isSpatial
            ? { "--xr-background-material": "transparent" }
            : undefined
        }
        {...(isSpatial ? { "enable-xr": true } : {})}
      >
        {header}
        <div
          className="details-shell"
          style={
            isSpatial
              ? { "--xr-background-material": "transparent" }
              : undefined
          }
          {...(isSpatial ? { "enable-xr": true } : {})}
        >
          <div className="details-panel details-panel--loading">
            <Card className="details-cover-card">
              <Skeleton className="details-cover" />
            </Card>
            <Card className="details-summary-card">
              <div className="details-copy">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-9 w-36" />
              </div>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  if (error || !game) {
    return (
      <main
        className="details-page"
        style={
          isSpatial
            ? { "--xr-background-material": "transparent" }
            : undefined
        }
        {...(isSpatial ? { "enable-xr": true } : {})}
      >
        {header}
        <div
          className="details-shell details-state"
          style={
            isSpatial
              ? { "--xr-background-material": "transparent" }
              : undefined
          }
          {...(isSpatial ? { "enable-xr": true } : {})}
        >
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

  const screenshots = game.short_screenshots ?? [];
  const developers = game.developers ?? [];
  const publishers = game.publishers ?? [];

  return (
    <main
      className="details-page"
      style={
        isSpatial
          ? { "--xr-background-material": "transparent" }
          : undefined
      }
      {...(isSpatial ? { "enable-xr": true } : {})}
    >
      {header}

      <div
        className="details-shell"
        style={
          isSpatial
            ? { "--xr-background-material": "transparent" }
            : undefined
        }
        {...(isSpatial ? { "enable-xr": true } : {})}
      >
        <div className="details-panel">
          <Card
            className="details-cover-card glass-panel"
            style={
              isSpatial
                ? {
                    "--xr-background-material": "transparent",
                    "--xr-back": "50px",
                  }
                : undefined
            }
            {...(isSpatial ? { "enable-xr": true } : {})}
          >
            <div className="details-cover">
              <GameCoverMedia
                game={game}
                priority
                variant="detail"
              />
            </div>
          </Card>

          <Card className="details-summary-card glass-panel">
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
                {game.rating !== null ? (
                  <Badge variant="outline">
                    <Star
                      aria-hidden="true"
                      data-icon="inline-start"
                      fill="currentColor"
                    />
                    {game.rating.toFixed(1)} rating
                  </Badge>
                ) : null}
                <Badge variant="outline">
                  <CalendarDays aria-hidden="true" data-icon="inline-start" />
                  {formatLongDate(game.released)}
                </Badge>
                {game.criticScore !== null ? (
                  <Badge variant="outline">
                    <Trophy aria-hidden="true" data-icon="inline-start" />
                    {Math.round(game.criticScore)} Critic score
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
        </div>

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
              <CardTitle>Information</CardTitle>
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
            <ScreenshotLightbox
              gameName={game.name}
              screenshots={screenshots.slice(0, 6)}
            />
          </section>
        ) : null}

        <ProjectFooter />
      </div>
    </main>
  );
}
