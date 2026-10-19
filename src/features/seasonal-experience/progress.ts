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

/** Smooth wheel steps consistently across refresh rates, without overshooting. */
export function dampProgress(
  current: number,
  target: number,
  elapsedMs: number,
): number {
  const end = clampProgress(target);
  // Resume at the current scroll position after a suspended tab or long stall.
  if (!Number.isFinite(elapsedMs) || elapsedMs >= 250) return end;
  const next =
    end +
    (clampProgress(current) - end) * Math.exp(-Math.max(0, elapsedMs) / 100);
  return Math.abs(end - next) < 0.001 ? end : next;
}

function reveal(from: number, to: number, progress: number): number {
  const value = clampProgress((progress - from) / (to - from));
  return value * value * (3 - 2 * value);
}

/** Copy leaves room for the camera, then returns for the collection handoff. */
export function sceneChoreography(
  progress: number,
  first: boolean,
  last: boolean,
) {
  const p = clampProgress(progress);
  return {
    poster: first ? 1 - reveal(0.005, 0.085, p) : 0,
    intro: 1 - reveal(first ? 0.08 : 0.12, first ? 0.25 : 0.3, p),
    details: 1 - reveal(0.025, 0.15, p),
    beat: reveal(0.3, 0.43, p) * (1 - reveal(0.64, 0.77, p)),
    closing: last ? reveal(0.85, 0.97, p) : 0,
    chrome: last ? 1 : 1 - reveal(0.94, 1, p),
  };
}

/** Keep the camera in place while the next scene dissolves over its last frame. */
export function scenePresentation(
  top: number,
  height: number,
  viewportHeight: number,
  first: boolean,
) {
  const viewport = Math.max(1, viewportHeight);
  const bottom = top + height;
  return {
    floating: bottom > 0 && top < (first ? 0 : viewport),
    reveal: first ? 1 : reveal(0, 0.8, 1 - top / viewport),
    exit: clampProgress(1 - bottom / viewport),
  };
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
