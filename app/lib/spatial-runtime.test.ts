import { describe, expect, it } from "vitest";
import {
  initializeSpatialRuntime,
  type SpatialRuntimeState,
} from "@/app/lib/spatial-runtime";

describe("initializeSpatialRuntime", () => {
  it("detects the PICO runtime", async () => {
    const state = await initializeSpatialRuntime(async () => ({
      Spatial: class {
        runInSpatialWeb() {
          return true;
        }
      },
      getRuntime: () => ({
        type: "picoos",
        shellVersion: "0.10.0",
      }),
    }));

    expect(state).toEqual<SpatialRuntimeState>({
      mode: "spatial",
      runtime: "picoos",
      error: null,
      isInitialized: true,
    });
  });

  it("recognizes legacy WebSpatial user agents without a runtime label", async () => {
    const state = await initializeSpatialRuntime(async () => ({
      Spatial: class {
        runInSpatialWeb() {
          return true;
        }
      },
      getRuntime: () => ({
        type: null,
        shellVersion: null,
      }),
    }));

    expect(state.runtime).toBe("webspatial");
    expect(state.mode).toBe("spatial");
  });

  it("falls back to browser mode when SDK initialization fails", async () => {
    const state = await initializeSpatialRuntime(async () => {
      throw new Error("Native bridge unavailable");
    });

    expect(state).toEqual<SpatialRuntimeState>({
      mode: "browser",
      runtime: "browser",
      error: "Native bridge unavailable",
      isInitialized: true,
    });
  });
});
