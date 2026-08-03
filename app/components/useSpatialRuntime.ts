"use client";

import { useContext } from "react";
import { SpatialRuntimeContext } from "@/app/components/SpatialRuntimeContext";

export function useSpatialRuntime() {
  return useContext(SpatialRuntimeContext);
}
