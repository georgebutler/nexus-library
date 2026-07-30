"use client";

import { SSRProvider } from "@webspatial/react-sdk";
import type { ReactNode } from "react";

type WebSpatialProviderProps = {
  children: ReactNode;
};

export function WebSpatialProvider({ children }: WebSpatialProviderProps) {
  return <SSRProvider>{children}</SSRProvider>;
}
