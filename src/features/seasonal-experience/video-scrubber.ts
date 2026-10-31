import { clampProgress, progressToTime } from "./progress";
import type { MediaScrubber } from "./types";

interface Options {
  onFrame?: () => void;
  onFailure?: () => void;
  timeoutMs?: number;
}

/** Replace this adapter with an image sequence or canvas without changing scenes. */
export function createVideoScrubber(
  video: HTMLVideoElement,
  { onFrame, onFailure, timeoutMs = 12_000 }: Options = {},
): MediaScrubber {
  let disposed = false;
  let failed = false;
  let targetProgress = clampProgress(
    video.currentTime / progressToTime(1, video.duration),
  );
  let frame: number | null = null;
  let watchdog: ReturnType<typeof setTimeout> | null = null;

  const clearWatchdog = () => {
    if (watchdog !== null) clearTimeout(watchdog);
    watchdog = null;
  };
  const fail = () => {
    if (disposed || failed) return;
    failed = true;
    clearWatchdog();
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    onFailure?.();
  };
  const waitForMedia = () => {
    // Scroll input must not keep extending a stalled load or seek forever.
    if (watchdog === null) watchdog = setTimeout(fail, timeoutMs);
  };

  const seek = () => {
    frame = null;
    if (disposed || failed) return;
    if (
      video.readyState < 1 ||
      !Number.isFinite(video.duration) ||
      video.duration <= 0 ||
      video.seeking
    ) {
      waitForMedia();
      return;
    }
    const needsFrame = video.readyState < 2;
    const target = progressToTime(targetProgress, video.duration);
    // A paused video at exactly zero can remain at HAVE_METADATA in Safari.
    // A tiny seek requests the opening frame without starting time playback.
    const nextTime =
      needsFrame && target === 0 ? Math.min(0.001, video.duration / 2) : target;
    if (needsFrame || Math.abs(video.currentTime - nextTime) > 0.025) {
      try {
        waitForMedia();
        video.currentTime = nextTime;
      } catch {
        fail();
      }
    } else {
      clearWatchdog();
      onFrame?.();
    }
  };
  const wake = () => {
    if (disposed || failed) return;
    if (video.readyState >= 2 && !video.seeking) {
      clearWatchdog();
      onFrame?.();
    }
    // Give the decoded frame a chance to paint before seeking again. Coalesce
    // input received during decoding into the latest target, including reversal.
    if (frame === null) frame = requestAnimationFrame(seek);
  };
  const readinessEvents = [
    "loadedmetadata",
    "durationchange",
    "loadeddata",
    "canplay",
    "seeked",
  ];
  readinessEvents.forEach((event) => video.addEventListener(event, wake));
  video.addEventListener("error", fail);
  seek();

  return {
    setProgress(progress) {
      if (disposed || failed) return;
      // Keep progress, rather than a time computed from an unavailable duration.
      targetProgress = clampProgress(progress);
      if (frame === null) seek();
    },
    destroy() {
      disposed = true;
      clearWatchdog();
      if (frame !== null) cancelAnimationFrame(frame);
      readinessEvents.forEach((event) =>
        video.removeEventListener(event, wake),
      );
      video.removeEventListener("error", fail);
      video.pause();
    },
  };
}
