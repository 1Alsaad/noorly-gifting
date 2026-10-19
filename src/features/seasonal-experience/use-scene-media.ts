"use client";

import { useEffect, useRef, useState } from "react";
import { sceneProgress } from "./progress";
import { createVideoScrubber } from "./video-scrubber";

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

export function useSceneMedia(frozen: boolean, disabled = false) {
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
    if (!enhanced || !active || frozen || !video || !section) return;
    const scrubber = createVideoScrubber(video);
    let frame: number | null = null;
    let disposed = false;

    const tick = () => {
      frame = null;
      if (disposed) return;
      const progress = sceneProgress(
        section.getBoundingClientRect().top,
        section.offsetHeight,
        window.innerHeight,
      );
      scrubber.setProgress(progress);
      setProgress(progress);
    };
    const schedule = () => {
      if (frame === null && !disposed)
        frame = window.requestAnimationFrame(tick);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      disposed = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      scrubber.destroy();
    };
  }, [active, enhanced, frozen]);

  return {
    sectionRef,
    videoRef,
    mobile,
    active,
    enhanced,
    pinned,
    canLoadVideo,
    hasFrame,
    progress,
    reducedMotion: !motionAllowed,
    onMetadata: () => setMediaState("ready"),
    onFrame: () => setHasFrame(true),
    onMediaError: () => setMediaState("failed"),
  };
}
