import { progressToTime } from "./progress";
import type { MediaScrubber } from "./types";

/** Replace this adapter with an image sequence or canvas without changing scenes. */
export function createVideoScrubber(video: HTMLVideoElement): MediaScrubber {
  let disposed = false;
  let target = video.currentTime;
  let frame: number | null = null;

  const seek = () => {
    frame = null;
    if (disposed || video.readyState < 1 || video.seeking) return;
    if (Math.abs(video.currentTime - target) > 0.025) {
      try {
        video.currentTime = target;
      } catch {
        // A media source may disappear mid-seek. The static poster remains usable.
      }
    }
  };
  const finishSeek = () => {
    // Give the decoded frame a chance to paint before seeking again. Coalesce
    // input received during decoding into the latest target, including reversal.
    if (!disposed && frame === null) frame = requestAnimationFrame(seek);
  };
  video.addEventListener("seeked", finishSeek);

  return {
    setProgress(progress) {
      if (disposed) return;
      target = progressToTime(progress, video.duration);
      if (frame === null) seek();
    },
    destroy() {
      disposed = true;
      if (frame !== null) cancelAnimationFrame(frame);
      video.removeEventListener("seeked", finishSeek);
      video.pause();
    },
  };
}
