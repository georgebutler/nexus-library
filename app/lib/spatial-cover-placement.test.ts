import { describe, expect, it } from "vitest";
import {
  addSpatialCoverOffsets,
  easeOutCubic,
  getSpatialCoverDistance,
  getSpatialCoverTransform,
  interpolateSpatialCoverOffset,
  isSpatialCoverDrag,
  shouldSnapSpatialCover,
  SPATIAL_COVER_DRAG_THRESHOLD,
  SPATIAL_COVER_SNAP_DISTANCE,
} from "@/app/lib/spatial-cover-placement";

describe("spatial cover placement", () => {
  it("accumulates drag translation from the shelf origin", () => {
    expect(
      addSpatialCoverOffsets(
        { x: 0, y: 0, z: 0 },
        { x: 18, y: -9, z: 42 },
      ),
    ).toEqual({ x: 18, y: -9, z: 42 });
  });

  it("accumulates drag translation from an already displaced cover", () => {
    expect(
      addSpatialCoverOffsets(
        { x: 80, y: -20, z: 35 },
        { x: -15, y: 12, z: 10 },
      ),
    ).toEqual({ x: 65, y: -8, z: 45 });
  });

  it("uses Euclidean distance for the snap boundary", () => {
    expect(getSpatialCoverDistance({ x: 32, y: 32, z: 32 })).toBeCloseTo(
      Math.sqrt(3072),
    );
    expect(
      shouldSnapSpatialCover({
        x: SPATIAL_COVER_SNAP_DISTANCE,
        y: 0,
        z: 0,
      }),
    ).toBe(true);
    expect(
      shouldSnapSpatialCover({
        x: SPATIAL_COVER_SNAP_DISTANCE + 0.01,
        y: 0,
        z: 0,
      }),
    ).toBe(false);
  });

  it("distinguishes taps from drags at the movement threshold", () => {
    expect(
      isSpatialCoverDrag({
        x: SPATIAL_COVER_DRAG_THRESHOLD,
        y: 0,
        z: 0,
      }),
    ).toBe(false);
    expect(
      isSpatialCoverDrag({
        x: SPATIAL_COVER_DRAG_THRESHOLD + 0.01,
        y: 0,
        z: 0,
      }),
    ).toBe(true);
  });

  it("clamps cubic ease-out and reaches both animation endpoints", () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(0.5)).toBe(0.875);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(2)).toBe(1);

    const offset = { x: 50, y: -20, z: 80 };

    expect(interpolateSpatialCoverOffset(offset, 0)).toEqual(offset);
    expect(interpolateSpatialCoverOffset(offset, 1)).toEqual({
      x: 0,
      y: -0,
      z: 0,
    });
  });

  it("serializes all three axes into the WebSpatial transform", () => {
    expect(
      getSpatialCoverTransform({ x: 12, y: -4, z: 90 }),
    ).toBe("translate3d(12px, -4px, 90px)");
  });
});
