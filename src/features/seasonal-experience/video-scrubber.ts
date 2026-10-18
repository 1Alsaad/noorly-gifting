import { progressToTime } from "./progress";
import type { MediaScrubber } from "./types";

/** Replace this adapter with an image sequence or canvas without changing scenes. */
export function createVideoScrubber(video: HTMLVideoElement): MediaScrubber {
  let disposed = false;
  return {
    setProgress(progress) {
      if (disposed || video.readyState < 1 || video.seeking) return;
      const time = progressToTime(progress, video.duration);
      if (Math.abs(video.currentTime - time) > 0.025) {
        try {
          video.currentTime = time;
        } catch {
          // A media source may disappear mid-seek. The static poster remains usable.
        }
      }
    },
    destroy() {
      disposed = true;
      video.pause();
    },
  };
}
