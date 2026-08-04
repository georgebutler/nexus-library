"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { SpatialRuntimeContext } from "@/app/components/SpatialRuntimeContext";
import {
  INITIAL_SPATIAL_RUNTIME_STATE,
  initializeSpatialRuntime,
  type SpatialRuntimeState,
} from "@/app/lib/spatial-runtime";

type SpatialRuntimeProviderProps = {
  children: ReactNode;
};

export function SpatialRuntimeProvider({
  children,
}: SpatialRuntimeProviderProps) {
  const [runtimeState, setRuntimeState] = useState<SpatialRuntimeState>(
    INITIAL_SPATIAL_RUNTIME_STATE,
  );

  useEffect(() => {
    let cancelled = false;

    void initializeSpatialRuntime(() =>
      import("@webspatial/core-sdk"),
    ).then((nextState) => {
      if (!cancelled) {
        setRuntimeState(nextState);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const isSpatial = runtimeState.mode === "spatial";
    const root = document.documentElement;

    root.classList.toggle("isSpatial", isSpatial);
    root.dataset.spatial = isSpatial ? "true" : "false";
    root.dataset.spatialRuntime = runtimeState.runtime;

    if (runtimeState.error) {
      root.dataset.spatialError = runtimeState.error;
    } else {
      delete root.dataset.spatialError;
    }
  }, [runtimeState]);

  return (
    <SpatialRuntimeContext.Provider value={runtimeState}>
      {children}
    </SpatialRuntimeContext.Provider>
  );
}
