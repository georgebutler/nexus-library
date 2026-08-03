export const SPATIAL_COVER_SNAP_DISTANCE = 64;
export const SPATIAL_COVER_DRAG_THRESHOLD = 6;
export const SPATIAL_COVER_SNAP_DURATION = 240;
export const SPATIAL_COVER_CLICK_SUPPRESSION = 350;

export type SpatialCoverOffset = {
  x: number;
  y: number;
  z: number;
};

export const ZERO_SPATIAL_COVER_OFFSET: SpatialCoverOffset = {
  x: 0,
  y: 0,
  z: 0,
};

export function addSpatialCoverOffsets(
  first: SpatialCoverOffset,
  second: SpatialCoverOffset,
): SpatialCoverOffset {
  return {
    x: first.x + second.x,
    y: first.y + second.y,
    z: first.z + second.z,
  };
}

export function getSpatialCoverDistance(offset: SpatialCoverOffset) {
  return Math.hypot(offset.x, offset.y, offset.z);
}

export function shouldSnapSpatialCover(
  offset: SpatialCoverOffset,
  snapDistance = SPATIAL_COVER_SNAP_DISTANCE,
) {
  return getSpatialCoverDistance(offset) <= snapDistance;
}

export function isSpatialCoverDrag(
  offset: SpatialCoverOffset,
  dragThreshold = SPATIAL_COVER_DRAG_THRESHOLD,
) {
  return getSpatialCoverDistance(offset) > dragThreshold;
}

export function easeOutCubic(progress: number) {
  const normalizedProgress = Math.min(Math.max(progress, 0), 1);
  return 1 - (1 - normalizedProgress) ** 3;
}

export function interpolateSpatialCoverOffset(
  offset: SpatialCoverOffset,
  progress: number,
): SpatialCoverOffset {
  const remaining = 1 - easeOutCubic(progress);

  return {
    x: offset.x * remaining,
    y: offset.y * remaining,
    z: offset.z * remaining,
  };
}

export function getSpatialCoverTransform(offset: SpatialCoverOffset) {
  return `translate3d(${offset.x}px, ${offset.y}px, ${offset.z}px)`;
}
