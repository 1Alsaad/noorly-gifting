"use client";

import { useEffect, useRef, useState } from "react";
import {
  clampProgress,
  dampProgress,
  progressToTime,
  sceneProgress,
  scenePresentation,
} from "./progress";
import { createVideoScrubber } from "./video-scrubber";

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

export function useSceneMedia(
  frozen: boolean,
  disabled = false,
  first = false,
) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const [mediaState, setMediaState] = useState<"poster" | "ready" | "failed">(
    "poster",
  );
  const [progress, setProgress] = useState(0);
  const [hasFrame, setHasFrame] = useState(false);
  const [presentation, setPresentation] = useState({
    floating: false,
    reveal: 1,
    exit: 0,
  });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 767px)");
    const connection = (navigator as Navigator & { connection?: Connection })
      .connection;
    const update = () => {
      setMotionAllowed(
        "IntersectionObserver" in window &&
          !reduced.matches &&
          !connection?.saveData &&
          !["slow-2g", "2g"].includes(connection?.effectiveType ?? ""),
      );
      setMobile(narrow.matches);
    };
    update();
    reduced.addEventListener("change", update);
    narrow.addEventListener("change", update);
    connection?.addEventListener("change", update);
    return () => {
      reduced.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
      connection?.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !("IntersectionObserver" in window)) return;
    const upcoming = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          upcoming.disconnect();
        }
      },
      { rootMargin: `${window.innerHeight}px 0px`, threshold: 0 },
    );
    const visible = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      {
        threshold: 0,
      },
    );
    upcoming.observe(section);
    visible.observe(section);
    return () => {
      upcoming.disconnect();
      visible.disconnect();
    };
  }, []);

  const enhanced = !disabled && motionAllowed && mediaState === "ready";
  // Reserve both scene ranges before network metadata arrives. Loading the
  // approaching video must not change the scroll geometry halfway through it.
  const pinned = !disabled && motionAllowed && mediaState !== "failed";
  const canLoadVideo =
    !disabled && near && motionAllowed && mediaState !== "failed";

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!pinned || !active || frozen || !section) return;
    const scrubber = enhanced && video ? createVideoScrubber(video) : null;
    let frame: number | null = null;
    let disposed = false;
    const readGeometry = () => {
      const top = section.getBoundingClientRect().top;
      return {
        progress: sceneProgress(top, section.offsetHeight, window.innerHeight),
        ...scenePresentation(
          top,
          section.offsetHeight,
          window.innerHeight,
          first,
        ),
      };
    };
    let geometry = readGeometry();
    // Continue from the paused playhead when a drawer closes or a scene returns.
    let current =
      enhanced && video
        ? clampProgress(video.currentTime / progressToTime(1, video.duration))
        : geometry.progress;
    let target = geometry.progress;
    let currentReveal = geometry.reveal;
    let previous = performance.now();
    let dirty = true;

    const tick = (now: number) => {
      frame = null;
      if (disposed) return;
      if (dirty) {
        geometry = readGeometry();
        target = geometry.progress;
        dirty = false;
      }
      current = dampProgress(current, target, now - previous);
      currentReveal = dampProgress(
        currentReveal,
        geometry.reveal,
        now - previous,
      );
      // The incoming scene is opaque before the outgoing section leaves view.
      if (geometry.reveal === 1) currentReveal = 1;
      previous = now;
      scrubber?.setProgress(current);
      // Hotspots and analytics follow the same eased timeline as the video.
      setProgress(current);
      setPresentation({
        floating: geometry.floating,
        reveal: currentReveal,
        exit: geometry.exit,
      });
      if (current !== target || currentReveal !== geometry.reveal)
        frame = window.requestAnimationFrame(tick);
    };
    const schedule = () => {
      dirty = true;
      if (frame === null && !disposed) {
        previous = performance.now();
        frame = window.requestAnimationFrame(tick);
      }
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      disposed = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      scrubber?.destroy();
    };
  }, [active, enhanced, pinned, frozen, first]);

  return {
    sectionRef,
    videoRef,
    mobile,
    active,
    enhanced,
    pinned,
    presentation,
    canLoadVideo,
    hasFrame,
    progress,
    reducedMotion: !motionAllowed,
    onMetadata: () => setMediaState("ready"),
    onFrame: () => setHasFrame(true),
    onMediaError: () => setMediaState("failed"),
  };
}
