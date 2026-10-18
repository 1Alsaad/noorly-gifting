import { describe, expect, it, vi } from "vitest";
import {
  clampProgress,
  hotspotIsVisible,
  progressToTime,
  sceneProgress,
} from "@/features/seasonal-experience/progress";
import { winterScenes } from "@/features/seasonal-experience/winter-scenes";
import { createVideoScrubber } from "@/features/seasonal-experience/video-scrubber";

describe("cinematic progress and media", () => {
  it("maps document geometry to bounded progress in either scroll direction", () => {
    expect(sceneProgress(100, 2300, 1000)).toBe(0);
    expect(sceneProgress(-650, 2300, 1000)).toBe(0.5);
    expect(sceneProgress(-1300, 2300, 1000)).toBe(1);
    expect(sceneProgress(-3000, 2300, 1000)).toBe(1);
    expect(sceneProgress(-325, 2300, 1000)).toBe(0.25);
    expect(sceneProgress(0, 1000, 1000)).toBe(0);
    expect(clampProgress(Number.NaN)).toBe(0);
  });

  it("has no entrance hotspot and shows the candle throughout its stable interval", () => {
    expect(winterScenes[0].hotspots).toHaveLength(0);
    const candle = winterScenes[1].hotspots[0];
    expect(hotspotIsVisible(candle, 0.199)).toBe(false);
    expect(hotspotIsVisible(candle, 0.2)).toBe(true);
    expect(hotspotIsVisible(candle, 0.6)).toBe(true);
    expect(hotspotIsVisible(candle, 0.85)).toBe(true);
    expect(hotspotIsVisible(candle, 0.851)).toBe(false);
    expect(hotspotIsVisible(candle, Number.NaN)).toBe(false);
  });

  it("preserves the last decoded frame and rejects invalid duration", () => {
    expect(progressToTime(1, 8)).toBeCloseTo(7.96);
    expect(progressToTime(0.5, 8)).toBeCloseTo(3.98);
    expect(progressToTime(0, 8)).toBe(0);
    expect(progressToTime(1, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("seeks backwards, waits for decoding and stops working after disposal", () => {
    const video = {
      readyState: 1,
      seeking: false,
      currentTime: 0,
      duration: 8,
      pause: vi.fn(),
    };
    const scrubber = createVideoScrubber(video as unknown as HTMLVideoElement);
    scrubber.setProgress(0.75);
    expect(video.currentTime).toBeCloseTo(5.97);
    scrubber.setProgress(0.25);
    expect(video.currentTime).toBeCloseTo(1.99);
    video.seeking = true;
    scrubber.setProgress(1);
    expect(video.currentTime).toBeCloseTo(1.99);
    video.seeking = false;
    scrubber.destroy();
    scrubber.setProgress(1);
    expect(video.currentTime).toBeCloseTo(1.99);
    expect(video.pause).toHaveBeenCalledOnce();
  });
});
