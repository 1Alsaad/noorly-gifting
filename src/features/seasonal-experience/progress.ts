import type { Hotspot } from "./types";

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function sceneProgress(
  top: number,
  height: number,
  viewportHeight: number,
): number {
  return clampProgress(-top / Math.max(1, height - viewportHeight));
}

export function hotspotIsVisible(hotspot: Hotspot, progress: number): boolean {
  return (
    Number.isFinite(progress) &&
    progress >= hotspot.visibleFrom &&
    progress <= hotspot.visibleTo
  );
}

export function progressToTime(progress: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  // Stop just before the end so browsers preserve the final decoded frame.
  return clampProgress(progress) * Math.max(0, duration - 0.04);
}
