import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clampProgress,
  dampProgress,
  sceneChoreography,
  scenePresentation,
  hotspotIsVisible,
  progressToTime,
  sceneProgress,
} from "@/features/seasonal-experience/progress";
import { winterScenes } from "@/features/seasonal-experience/winter-scenes";
import { createVideoScrubber } from "@/features/seasonal-experience/video-scrubber";

import type { Hotspot } from "@/features/seasonal-experience/types";
const candleHotspot: Hotspot = {
  id: "candle",
  sceneId: "test-room",
  productHandle: "winter-candle",
  visibleFrom: 0.2,
  visibleTo: 0.85,
  desktop: { x: 0.69, y: 0.61 },
  mobile: { x: 0.62, y: 0.56 },
  label: { sv: "Upptäck vinterljuset", en: "Discover the winter candle" },
};

describe("cinematic progress and media", () => {
  afterEach(() => vi.unstubAllGlobals());

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
    const candle = candleHotspot;
    expect(hotspotIsVisible(candle, 0.199)).toBe(false);
    expect(hotspotIsVisible(candle, 0.2)).toBe(true);
    expect(hotspotIsVisible(candle, 0.6)).toBe(true);
    expect(hotspotIsVisible(candle, 0.85)).toBe(true);
    expect(hotspotIsVisible(candle, 0.851)).toBe(false);
    expect(hotspotIsVisible(candle, Number.NaN)).toBe(false);
  });

  it("uses one complete responsive film and waits for its shopping hold", () => {
    expect(winterScenes).toHaveLength(1);
    const scene = winterScenes[0];
    expect(scene.media.desktop.video).toContain(
      "46439a25-f450-49f4-b8b1-785e0d1bc834.mp4",
    );
    expect(scene.media.mobile.video).toContain(
      "0e98a61d-fd67-4fee-8c28-793ca27c6fce.mp4",
    );
    expect(scene.shopping?.visibleFrom).toBeCloseTo(10 / 15);
    expect(sceneChoreography(0.5, true, true).beat).toBe(0);
  });

  it("smooths wheel steps equally at 60Hz and 120Hz", () => {
    const advance = (hz: number) => {
      let current = 0.2;
      for (let frame = 0; frame < hz / 5; frame++)
        current = dampProgress(current, 0.6, 1000 / hz);
      return current;
    };
    expect(advance(60)).toBeCloseTo(advance(120), 10);
    expect(advance(60)).toBeGreaterThan(0.5);
    expect(advance(60)).toBeLessThan(0.6);
  });

  it("retargets immediately on reversal without overshooting and settles exactly", () => {
    let current = dampProgress(0.2, 0.8, 16);
    expect(current).toBeGreaterThan(0.2);
    const reversed = dampProgress(current, 0.1, 16);
    expect(reversed).toBeLessThan(current);
    expect(reversed).toBeGreaterThan(0.1);
    current = reversed;
    for (let frame = 0; frame < 60; frame++) {
      const next = dampProgress(current, 0.1, 1000 / 60);
      expect(next).toBeLessThanOrEqual(current);
      expect(next).toBeGreaterThanOrEqual(0.1);
      current = next;
    }
    expect(current).toBe(0.1);
    expect(dampProgress(0.99, 1, 200)).toBeLessThan(1);
    expect(dampProgress(0.9995, 1, 16)).toBe(1);
    expect(dampProgress(0.0005, 0, 16)).toBe(0);
  });

  it("discards catch-up animation after a suspended tab", () => {
    expect(dampProgress(0.2, 0.8, 1000)).toBe(0.8);
  });

  it("clears the opening title for the camera and returns copy at distinct story beats", () => {
    expect(sceneChoreography(0, true, false).intro).toBe(1);
    expect(sceneChoreography(0, true, false).poster).toBe(1);
    expect(sceneChoreography(0.1, true, false).poster).toBe(0);
    const journey = sceneChoreography(0.2, true, false);
    expect(journey.intro).toBe(0);
    expect(journey.details).toBe(0);
    expect(journey.beat).toBe(1);
    expect(journey.closing).toBe(0);
    expect(sceneChoreography(1, true, false).chrome).toBe(0);
    const ending = sceneChoreography(1, false, true);
    expect(ending.intro).toBe(0);
    expect(ending.beat).toBe(0);
    expect(ending.closing).toBe(1);
    expect(ending.chrome).toBe(1);
  });

  it("overlaps incoming scenes in one viewport and holds the last frame behind the collection", () => {
    expect(scenePresentation(100, 4000, 1000, true).floating).toBe(false);
    const incoming = scenePresentation(500, 4000, 1000, false);
    expect(incoming.floating).toBe(true);
    expect(incoming.reveal).toBeGreaterThan(0);
    expect(incoming.reveal).toBeLessThan(1);
    expect(scenePresentation(0, 4000, 1000, false).reveal).toBe(1);
    const handoff = scenePresentation(-3500, 4000, 1000, false);
    expect(handoff.floating).toBe(true);
    expect(handoff.exit).toBe(0.5);
    expect(scenePresentation(-4000, 4000, 1000, false).floating).toBe(false);
  });

  it("preserves the last decoded frame and rejects invalid duration", () => {
    expect(progressToTime(1, 8)).toBeCloseTo(7.96);
    expect(progressToTime(0.5, 8)).toBeCloseTo(3.98);
    expect(progressToTime(0, 8)).toBe(0);
    expect(progressToTime(1, Number.POSITIVE_INFINITY)).toBe(0);
  });

  it("seeks backwards, waits for decoding and stops working after disposal", () => {
    const video = Object.assign(new EventTarget(), {
      readyState: 1,
      seeking: false,
      currentTime: 0,
      duration: 8,
      pause: vi.fn(),
    });
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

  it("presents a decoded frame before seeking to the latest scroll position", () => {
    let paint: FrameRequestCallback | undefined;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      paint = callback;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    const video = Object.assign(new EventTarget(), {
      readyState: 4,
      seeking: false,
      currentTime: 0,
      duration: 8,
      pause: vi.fn(),
    });
    const scrubber = createVideoScrubber(video as unknown as HTMLVideoElement);
    scrubber.setProgress(0.75);
    video.seeking = true;
    scrubber.setProgress(1);
    scrubber.setProgress(0.25);
    expect(video.currentTime).toBeCloseTo(5.97);

    video.seeking = false;
    video.dispatchEvent(new Event("seeked"));
    expect(video.currentTime).toBeCloseTo(5.97);
    // Reverse again before paint: never replay the obsolete queued positions.
    scrubber.setProgress(0.1);
    paint?.(16);
    expect(video.currentTime).toBeCloseTo(0.796);
    scrubber.destroy();
  });

  it("cancels a queued seek when the scene freezes or unmounts", () => {
    const request = vi.fn(() => 7);
    const cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", request);
    vi.stubGlobal("cancelAnimationFrame", cancel);
    const video = Object.assign(new EventTarget(), {
      readyState: 4,
      seeking: true,
      currentTime: 0,
      duration: 8,
      pause: vi.fn(),
    });
    const scrubber = createVideoScrubber(video as unknown as HTMLVideoElement);
    scrubber.setProgress(0.8);
    video.seeking = false;
    video.dispatchEvent(new Event("seeked"));
    scrubber.destroy();
    expect(cancel).toHaveBeenCalledWith(7);
    video.dispatchEvent(new Event("seeked"));
    scrubber.setProgress(1);
    expect(request).toHaveBeenCalledOnce();
    expect(video.currentTime).toBe(0);
  });
});
