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
import {
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { CollectionPicker } from "@/app/components/CollectionPicker";
import { GameCoverMedia } from "@/app/components/GameCoverMedia";
import { NexusMark } from "@/app/components/NexusMark";
import { PlatformIcons } from "@/app/components/PlatformIcons";
import { ProjectFooter } from "@/app/components/ProjectFooter";
import { ScreenshotLightbox } from "@/app/components/ScreenshotLightbox";
import { SiteHeader } from "@/app/components/SiteHeader";
import { useLibrary } from "@/app/hooks/useLibrary";
import { formatLongDate } from "@/app/lib/date";
import { SPATIAL_GAME_COVER_BACK } from "@/app/lib/game-cover-media";
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

function DetailsCoverSurface({
  children,
}: {
  children?: ReactNode;
}) {
  return (
    <div
      className="details-cover-surface"
      enable-xr
      style={
        {
          "--xr-background-material": "transparent",
        } as CSSProperties
      }
    >
      <div
        className="details-cover"
        enable-xr
        style={
          {
            "--xr-background-material": "transparent",
            "--xr-back": `${SPATIAL_GAME_COVER_BACK}px`,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}

export function GameDetails({ gameId, returnTo }: GameDetailsProps) {
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

  if (!isLoading && (error || !game)) {
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

  const screenshots = game?.short_screenshots ?? [];
  const developers = game?.developers ?? [];
  const publishers = game?.publishers ?? [];

  return (
    <main className="details-page">
      {header}

      <div className="details-shell">
        <div
          className={
            isLoading
              ? "details-panel details-panel--loading"
              : "details-panel"
          }
        >
          <Card
            className={
              isLoading
                ? "details-cover-card details-cover-card--loading"
                : "details-cover-card glass-panel"
            }
          >
            <DetailsCoverSurface>
              {game ? (
                <GameCoverMedia
                  game={game}
                  priority
                  variant="detail"
                />
              ) : null}
            </DetailsCoverSurface>
            {isLoading ? (
              <Skeleton className="details-cover-loading" />
            ) : null}
          </Card>

          {game ? (
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
                    <CalendarDays
                      aria-hidden="true"
                      data-icon="inline-start"
                    />
                    {formatLongDate(game.released)}
                  </Badge>
                  {game.criticScore !== null ? (
                    <Badge variant="outline">
                      <Trophy
                        aria-hidden="true"
                        data-icon="inline-start"
                      />
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
          ) : (
            <Card className="details-summary-card">
              <div className="details-copy">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-9 w-36" />
              </div>
            </Card>
          )}
        </div>

        {game ? (
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
        ) : null}

        {game && screenshots.length > 0 ? (
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

        {game ? <ProjectFooter /> : null}
      </div>
    </main>
  );
}
