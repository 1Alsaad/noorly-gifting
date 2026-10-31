"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { ArrowRight, Pause, Play } from "lucide-react";
import { candleSandHandle } from "@/content/launch-catalog";
import type { CinematicScene } from "@/features/seasonal-experience/types";
import { formatMoney } from "@/lib/utils/money";
import type { Locale, Product } from "@/types/commerce";
import "./storefront-hero.css";

type Connection = EventTarget & { saveData?: boolean; effectiveType?: string };

function mediaPreferences() {
  const connection = (navigator as Navigator & { connection?: Connection })
    .connection;
  return [
    window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    connection?.saveData ||
    ["slow-2g", "2g"].includes(connection?.effectiveType ?? "")
      ? "static"
      : "motion",
  ].join(":");
}

function subscribeMedia(onChange: () => void) {
  const queries = [
    window.matchMedia("(max-width: 767px)"),
    window.matchMedia("(prefers-reduced-motion: reduce)"),
  ];
  const connection = (navigator as Navigator & { connection?: Connection })
    .connection;
  queries.forEach((query) => query.addEventListener("change", onChange));
  connection?.addEventListener("change", onChange);
  return () => {
    queries.forEach((query) => query.removeEventListener("change", onChange));
    connection?.removeEventListener("change", onChange);
  };
}

const copy = {
  sv: {
    eyebrow: "LUMA LJUSSAND",
    title: "Varmare stunder.\nPå ditt sätt.",
    description: "Ljussand i din färg och doft.",
    cta: "Shoppa kollektionen",
    from: "Från",
    play: "Spela video",
    pause: "Pausa video",
    retry: "Försök igen",
    unavailable: "Videon kunde inte laddas. Du kan fortfarande handla nedan.",
  },
  en: {
    eyebrow: "LUMA CANDLE SAND",
    title: "A warmer glow.\nYour way.",
    description: "Candle sand in your colour and scent.",
    cta: "Shop the collection",
    from: "From",
    play: "Play video",
    pause: "Pause video",
    retry: "Try again",
    unavailable: "The video could not load. You can still shop below.",
  },
};

export function StorefrontHero({
  locale,
  scenes,
  products,
}: {
  locale: Locale;
  scenes: CinematicScene[];
  products: Product[];
}) {
  const scene = scenes[0];
  const featured = products.find(
    (product) => product.handle === candleSandHandle,
  );
  const t = copy[locale];
  return (
    <section
      className="storefront-hero"
      aria-labelledby="storefront-hero-title"
    >
      {scene && <HeroVideo key={scene.id} scene={scene} locale={locale} />}
      <div className="storefront-hero-shade" aria-hidden="true" />
      <div className="storefront-hero-content">
        <p className="storefront-hero-eyebrow">{t.eyebrow}</p>
        <h1 id="storefront-hero-title">{t.title}</h1>
        <p className="storefront-hero-description">{t.description}</p>
        {featured && !featured.previewOnly && (
          <p className="storefront-hero-price">
            {t.from} {formatMoney(featured.price, locale)}
          </p>
        )}
        <a className="storefront-hero-cta" href="#gifts">
          {t.cta} <ArrowRight size={18} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}

function HeroVideo({
  scene,
  locale,
}: {
  scene: CinematicScene;
  locale: Locale;
}) {
  const preferences = useSyncExternalStore(
    subscribeMedia,
    mediaPreferences,
    () => "initial",
  );
  const media = preferences.startsWith("mobile")
    ? scene.media.mobile
    : scene.media.desktop;
  const autoAllowed = preferences.endsWith("motion");
  const [manualRequested, setManualRequested] = useState(false);
  // WebKit may request media even with preload="none". Do not expose a source
  // in static mode until the visitor explicitly asks to play it.
  const source =
    preferences !== "initial" && (autoAllowed || manualRequested)
      ? media.video
      : undefined;
  const videoRef = useRef<HTMLVideoElement>(null);
  const manualPlayback = useRef(false);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [failed, setFailed] = useState(false);
  const t = copy[locale];

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source) return;
    // Safari needs the DOM property set before play(), as well as the attributes.
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    let disposed = false;
    let visible = !("IntersectionObserver" in window);
    const synchronize = () => {
      const shouldPlay =
        (autoAllowed || manualPlayback.current) &&
        !userPaused.current &&
        visible &&
        document.visibilityState !== "hidden";
      if (!shouldPlay) {
        video.pause();
        return;
      }
      // Autoplay is a request: browser preferences and iOS Low Power Mode can
      // reject it. The same always-visible button then starts playback by gesture.
      void video.play().catch(() => {
        if (!disposed) setPlaying(false);
      });
    };
    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              visible = entry.isIntersecting;
              synchronize();
            },
            { threshold: 0.01 },
          )
        : null;
    observer?.observe(video);
    document.addEventListener("visibilitychange", synchronize);
    synchronize();
    return () => {
      disposed = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      video.pause();
    };
  }, [autoAllowed, source]);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    // Match the displayed action: paused becomes false before buffering ends.
    if (playing && !failed) {
      userPaused.current = true;
      video.pause();
      return;
    }
    userPaused.current = false;
    video.defaultMuted = true;
    video.muted = true;
    if (!source) flushSync(() => setManualRequested(true));
    manualPlayback.current = true;
    if (video.error) video.load();
    // Keep play() in the click handler to retain Safari's user activation.
    void video.play().catch(() => setPlaying(false));
  }

  return (
    <>
      <div className="storefront-hero-media">
        <picture
          className={
            hasFrame && !failed ? "hero-poster has-frame" : "hero-poster"
          }
        >
          <source
            media="(max-width: 767px)"
            srcSet={scene.media.mobile.poster}
          />
          <img
            src={scene.media.desktop.poster}
            alt=""
            width="1920"
            height="1080"
            fetchPriority="high"
          />
        </picture>
        <video
          ref={videoRef}
          src={source}
          poster={media.poster}
          muted
          autoPlay={autoAllowed}
          playsInline
          loop
          preload={autoAllowed ? "metadata" : "none"}
          aria-hidden="true"
          tabIndex={-1}
          disablePictureInPicture
          onLoadStart={() => {
            setHasFrame(false);
            setFailed(false);
          }}
          onPlaying={() => {
            setHasFrame(true);
            setPlaying(true);
            setFailed(false);
          }}
          onPause={() => setPlaying(false)}
          onError={() => {
            setFailed(true);
            setPlaying(false);
          }}
        />
      </div>
      <button
        type="button"
        className="storefront-video-toggle"
        onClick={togglePlayback}
        disabled={preferences === "initial"}
        aria-label={failed ? t.retry : playing ? t.pause : t.play}
      >
        {playing ? (
          <Pause size={15} aria-hidden="true" />
        ) : (
          <Play size={15} aria-hidden="true" />
        )}
        {failed ? t.retry : playing ? t.pause : t.play}
      </button>
      {failed && (
        <span className="sr-only" role="status">
          {t.unavailable}
        </span>
      )}
    </>
  );
}
