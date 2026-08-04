"use client";

import { createContext } from "react";
import {
  INITIAL_SPATIAL_RUNTIME_STATE,
  type SpatialRuntimeState,
} from "@/app/lib/spatial-runtime";

export type SpatialRuntimeContextValue = SpatialRuntimeState;

export const SpatialRuntimeContext = createContext<SpatialRuntimeContextValue>({
  ...INITIAL_SPATIAL_RUNTIME_STATE,
});
