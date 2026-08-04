"use client";

import Image from "next/image";
import {
  ModelAsset,
  ModelEntity,
  Reality,
  SceneGraph,
  Texture,
  UnlitMaterial,
} from "@webspatial/react-sdk";
import {
  useCallback,
  useState,
  type CSSProperties,
} from "react";
import {
  GAME_CASE_USDZ_SRC,
  getGameCoverFallback,
  getGameCoverResourceIds,
  getGameCoverSizing,
  isSpatialGameCoverReady,
  shouldRenderSpatialGameCover,
  type GameCoverVariant,
} from "@/app/lib/game-cover-media";
import type { SpatialMode } from "@/app/lib/spatial-runtime";
import type { Game } from "@/app/types/game";

type GameCoverMediaProps = {
  game: Game;
  mode: SpatialMode;
  variant: GameCoverVariant;
  priority?: boolean;
  onTap?: () => void;
};

function CoverFallback({
  game,
  priority,
  variant,
}: Pick<GameCoverMediaProps, "game" | "priority" | "variant">) {
  const fallback = getGameCoverFallback(game);

  if (fallback.kind === "image") {
    return (
      <Image
        alt={`${game.name} cover art`}
        fill
        loading={priority ? "eager" : "lazy"}
        priority={priority}
        sizes={
          variant === "card"
            ? "(max-width: 720px) 44vw, 180px"
            : "(max-width: 720px) 100vw, 40vw"
        }
        src={fallback.src}
      />
    );
  }

  return (
    <div className="game-case__placeholder">
      <span>{fallback.value}</span>
    </div>
  );
}

export function GameCoverMedia({
  game,
  mode,
  variant,
  priority = false,
  onTap,
}: GameCoverMediaProps) {
  const [hasSpatialError, setHasSpatialError] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isTextureLoaded, setIsTextureLoaded] = useState(false);
  const fallback = getGameCoverFallback(game);
  const resourceIds = getGameCoverResourceIds(game.id, variant);
  const sizing = getGameCoverSizing(variant);
  const shouldRenderSpatial = shouldRenderSpatialGameCover(
    mode,
    fallback,
    hasSpatialError,
  );
  const isSpatialReady =
    shouldRenderSpatial &&
    isSpatialGameCoverReady(isModelLoaded, isTextureLoaded);
  const handleSpatialError = useCallback(() => {
    setHasSpatialError(true);
  }, []);
  const style = {
    "--game-cover-aspect-ratio": sizing.aspectRatio,
    "--xr-depth": `${sizing.depth}px`,
  } as CSSProperties;

  return (
    <div
      className={`game-cover-media game-cover-media--${variant}`}
      data-cover-mode={isSpatialReady ? "spatial" : "browser"}
      style={style}
    >
      <div
        aria-hidden={shouldRenderSpatial}
        className="game-cover-media__fallback"
      >
        <CoverFallback
          game={game}
          priority={priority}
          variant={variant}
        />
      </div>

      {shouldRenderSpatial && fallback.kind === "image" ? (
        <Reality
          aria-label={`${game.name} 3D game case`}
          className="game-cover-media__reality"
        >
          <ModelAsset
            id={resourceIds.asset}
            onError={handleSpatialError}
            onLoad={() => setIsModelLoaded(true)}
            src={GAME_CASE_USDZ_SRC}
          />
          <Texture
            id={resourceIds.texture}
            onError={handleSpatialError}
            onLoad={() => setIsTextureLoaded(true)}
            url={fallback.src}
          />
          <UnlitMaterial
            color="#11151f"
            id={resourceIds.shellMaterial}
          />
          <UnlitMaterial
            id={resourceIds.frontMaterial}
            textureId={resourceIds.texture}
          />
          <SceneGraph>
            <ModelEntity
              enableInput={Boolean(onTap)}
              id={resourceIds.entity}
              materials={[
                resourceIds.shellMaterial,
                resourceIds.frontMaterial,
              ]}
              model={resourceIds.asset}
              onSpatialTap={onTap}
              scale={{
                x: sizing.scale,
                y: sizing.scale,
                z: sizing.scale,
              }}
            />
          </SceneGraph>
        </Reality>
      ) : null}
    </div>
  );
}
