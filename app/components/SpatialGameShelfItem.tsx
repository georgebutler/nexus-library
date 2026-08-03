"use client";

import Image from "next/image";
import { Minus, Plus, Star } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import type {
  SpatialDragEndEvent,
  SpatialDragEvent,
  SpatialDragStartEvent,
} from "@webspatial/react-sdk";
import { PlatformIcons } from "@/app/components/PlatformIcons";
import {
  addSpatialCoverOffsets,
  getSpatialCoverTransform,
  interpolateSpatialCoverOffset,
  isSpatialCoverDrag,
  shouldSnapSpatialCover,
  SPATIAL_COVER_CLICK_SUPPRESSION,
  SPATIAL_COVER_SNAP_DURATION,
  type SpatialCoverOffset,
  ZERO_SPATIAL_COVER_OFFSET,
} from "@/app/lib/spatial-cover-placement";
import type { Game } from "@/app/types/game";
import { Button } from "@/components/ui/button";

type SpatialGameShelfItemProps = {
  activeCollectionName: string;
  game: Game;
  isInActiveCollection: boolean;
  onOpen: (game: Game) => void;
  onToggleActiveCollection: (game: Game) => void;
  placementKey: string;
  priority?: boolean;
};

function getDragTranslation(
  event: SpatialDragEvent<HTMLElement>,
): SpatialCoverOffset {
  return {
    x: event.translationX,
    y: event.translationY,
    z: event.translationZ,
  };
}

export function SpatialGameShelfItem({
  activeCollectionName,
  game,
  isInActiveCollection,
  onOpen,
  onToggleActiveCollection,
  placementKey,
  priority = false,
}: SpatialGameShelfItemProps) {
  const coverRef = useRef<HTMLButtonElement>(null);
  const offsetRef = useRef<SpatialCoverOffset>(ZERO_SPATIAL_COVER_OFFSET);
  const dragOriginRef = useRef<SpatialCoverOffset>(
    ZERO_SPATIAL_COVER_OFFSET,
  );
  const currentDragRef = useRef<SpatialCoverOffset>(
    ZERO_SPATIAL_COVER_OFFSET,
  );
  const snapAnimationRef = useRef<number | null>(null);
  const suppressClicksUntilRef = useRef(0);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const releaseYear = game.released
    ? new Date(`${game.released}T00:00:00`).getFullYear()
    : "TBA";

  const cancelSnapAnimation = useCallback(() => {
    if (snapAnimationRef.current !== null) {
      cancelAnimationFrame(snapAnimationRef.current);
      snapAnimationRef.current = null;
    }
  }, []);

  const setCoverOffset = useCallback((offset: SpatialCoverOffset) => {
    offsetRef.current = offset;

    if (coverRef.current) {
      coverRef.current.style.transform =
        getSpatialCoverTransform(offset);
    }
  }, []);

  const resetCover = useCallback(() => {
    cancelSnapAnimation();
    dragOriginRef.current = ZERO_SPATIAL_COVER_OFFSET;
    currentDragRef.current = ZERO_SPATIAL_COVER_OFFSET;
    suppressClicksUntilRef.current = 0;
    setIsGrabbing(false);

    if (coverRef.current) {
      coverRef.current.style.removeProperty("transform");
    }

    offsetRef.current = ZERO_SPATIAL_COVER_OFFSET;
  }, [cancelSnapAnimation]);

  const snapCoverHome = useCallback(() => {
    cancelSnapAnimation();
    const startOffset = offsetRef.current;
    const startTime = performance.now();

    const animate = (timestamp: number) => {
      const progress = Math.min(
        (timestamp - startTime) / SPATIAL_COVER_SNAP_DURATION,
        1,
      );

      if (progress === 1) {
        snapAnimationRef.current = null;
        if (coverRef.current) {
          coverRef.current.style.removeProperty("transform");
        }
        offsetRef.current = ZERO_SPATIAL_COVER_OFFSET;
        return;
      }

      setCoverOffset(
        interpolateSpatialCoverOffset(startOffset, progress),
      );
      snapAnimationRef.current = requestAnimationFrame(animate);
    };

    snapAnimationRef.current = requestAnimationFrame(animate);
  }, [cancelSnapAnimation, setCoverOffset]);

  useEffect(() => resetCover(), [placementKey, resetCover]);

  useEffect(() => () => cancelSnapAnimation(), [cancelSnapAnimation]);

  const handleSpatialDragStart = (
    _event: SpatialDragStartEvent<HTMLElement>,
  ) => {
    cancelSnapAnimation();
    dragOriginRef.current = offsetRef.current;
    currentDragRef.current = ZERO_SPATIAL_COVER_OFFSET;
    setIsGrabbing(true);
  };

  const handleSpatialDrag = (
    event: SpatialDragEvent<HTMLElement>,
  ) => {
    const translation = getDragTranslation(event);
    currentDragRef.current = translation;
    setCoverOffset(
      addSpatialCoverOffsets(dragOriginRef.current, translation),
    );
  };

  const handleSpatialDragEnd = (
    _event: SpatialDragEndEvent<HTMLElement>,
  ) => {
    setIsGrabbing(false);

    if (isSpatialCoverDrag(currentDragRef.current)) {
      suppressClicksUntilRef.current =
        performance.now() + SPATIAL_COVER_CLICK_SUPPRESSION;
    }

    if (shouldSnapSpatialCover(offsetRef.current)) {
      snapCoverHome();
    }
  };

  const handleOpen = (event: MouseEvent<HTMLButtonElement>) => {
    if (performance.now() < suppressClicksUntilRef.current) {
      event.preventDefault();
      return;
    }

    onOpen(game);
  };

  return (
    <article
      className={
        isGrabbing
          ? "spatial-shelf-item is-grabbing"
          : "spatial-shelf-item"
      }
    >
      <button
        aria-label={`Open ${game.name}`}
        className="spatial-shelf-item__cover"
        enable-xr
        onClick={handleOpen}
        onSpatialDrag={handleSpatialDrag}
        onSpatialDragEnd={handleSpatialDragEnd}
        onSpatialDragStart={handleSpatialDragStart}
        ref={coverRef}
        style={{
          "--xr-background-material": "transparent",
          "--xr-back": "100px",
        }}
        type="button"
      >
        {game.background_image ? (
          <Image
            alt={`${game.name} cover art`}
            fill
            priority={priority}
            sizes="140px"
            src={game.background_image}
          />
        ) : (
          <span className="spatial-shelf-item__placeholder">
            {game.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </button>

      <div className="spatial-shelf-item__metadata">
        <p className="spatial-shelf-item__eyebrow">
          {game.genres[0]?.name ?? "Game"} · {releaseYear}
        </p>
        <h2>{game.name}</h2>
        <PlatformIcons
          className="spatial-shelf-item__platforms"
          maxItems={4}
          platforms={game.platformFamilies ?? []}
        />
        <div className="spatial-shelf-item__footer">
          <span className="spatial-shelf-item__rating">
            <Star aria-hidden="true" fill="currentColor" />
            {game.rating !== null ? game.rating.toFixed(1) : "—"}
          </span>
          <Button
            aria-label={
              isInActiveCollection
                ? `Remove ${game.name} from ${activeCollectionName}`
                : `Add ${game.name} to ${activeCollectionName}`
            }
            className={
              isInActiveCollection
                ? "spatial-shelf-item__collection-toggle is-remove"
                : "spatial-shelf-item__collection-toggle is-add"
            }
            onClick={() => onToggleActiveCollection(game)}
            size="icon-sm"
            type="button"
            variant={isInActiveCollection ? "secondary" : "default"}
          >
            {isInActiveCollection ? (
              <Minus aria-hidden="true" />
            ) : (
              <Plus aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
