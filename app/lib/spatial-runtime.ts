import type {
  WebSpatialRuntimeSnapshot,
  WebSpatialRuntimeType,
} from "@webspatial/core-sdk";

export type SpatialMode = "browser" | "spatial";

export type SpatialRuntimeLabel =
  | Exclude<WebSpatialRuntimeType, null>
  | "browser"
  | "webspatial";

export type SpatialRuntimeState = {
  mode: SpatialMode;
  runtime: SpatialRuntimeLabel;
  error: string | null;
  isInitialized: boolean;
};

type SpatialSdk = {
  Spatial: new () => {
    runInSpatialWeb: () => boolean;
  };
  getRuntime: () => WebSpatialRuntimeSnapshot;
};

export const INITIAL_SPATIAL_RUNTIME_STATE: SpatialRuntimeState = {
  mode: "browser",
  runtime: "browser",
  error: null,
  isInitialized: false,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "WebSpatial runtime initialization failed.";
}

export async function initializeSpatialRuntime(
  loadSdk: () => Promise<SpatialSdk>,
): Promise<SpatialRuntimeState> {
  try {
    const sdk = await loadSdk();
    const detectedRuntime = sdk.getRuntime();
    const isSpatial =
      detectedRuntime.type !== null ||
      new sdk.Spatial().runInSpatialWeb();

    return {
      mode: isSpatial ? "spatial" : "browser",
      runtime:
        detectedRuntime.type ??
        (isSpatial ? "webspatial" : "browser"),
      error: null,
      isInitialized: true,
    };
  } catch (error) {
    return {
      mode: "browser",
      runtime: "browser",
      error: getErrorMessage(error),
      isInitialized: true,
    };
  }
}
