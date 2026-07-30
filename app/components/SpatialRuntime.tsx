"use client";

import { useEffect } from "react";

export function SpatialRuntime() {
  useEffect(() => {
    let cancelled = false;

    void import("@webspatial/core-sdk").then(({ Spatial }) => {
      if (cancelled) {
        return;
      }

      const isSpatial = Spatial.prototype.runInSpatialWeb();
      document.documentElement.classList.toggle("isSpatial", isSpatial);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
