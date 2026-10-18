"use client";

import { useEffect, useRef, useState } from "react";
import { sceneProgress } from "./progress";
import { createVideoScrubber } from "./video-scrubber";

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

export function useSceneMedia(frozen: boolean) {
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
      { rootMargin: "200px 0px", threshold: 0 },
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

  const enhanced = motionAllowed && mediaState === "ready";
  const canLoadVideo = near && motionAllowed && mediaState !== "failed";

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;
    if (!enhanced || !active || frozen || !video || !section) return;
    const scrubber = createVideoScrubber(video);
    let frame: number | null = null;
    let current = sceneProgress(
      section.getBoundingClientRect().top,
      section.offsetHeight,
      window.innerHeight,
    );
    let target = current;
    let disposed = false;

    const tick = () => {
      frame = null;
      if (disposed) return;
      current += (target - current) * 0.32;
      if (Math.abs(target - current) < 0.001) current = target;
      scrubber.setProgress(current);
      setProgress(current);
      if (current !== target) frame = window.requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (frame === null && !disposed)
        frame = window.requestAnimationFrame(tick);
    };
    const update = () => {
      target = sceneProgress(
        section.getBoundingClientRect().top,
        section.offsetHeight,
        window.innerHeight,
      );
      schedule();
    };
    // A final seek may have been skipped while a previous seek was decoding.
    const finishSeek = () => {
      if (!disposed) scrubber.setProgress(current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    video.addEventListener("seeked", finishSeek);
    return () => {
      disposed = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      video.removeEventListener("seeked", finishSeek);
      scrubber.destroy();
    };
  }, [active, enhanced, frozen]);

  return {
    sectionRef,
    videoRef,
    mobile,
    active,
    enhanced,
    canLoadVideo,
    hasFrame,
    progress,
    reducedMotion: !motionAllowed,
    onMetadata: () => setMediaState("ready"),
    onFrame: () => setHasFrame(true),
    onMediaError: () => setMediaState("failed"),
  };
}
