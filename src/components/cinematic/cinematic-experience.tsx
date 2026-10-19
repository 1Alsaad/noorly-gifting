"use client";

/* Native picture supports separate art-directed mobile posters without downloading both images. */

import Link from "next/link";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { cinematicCopy } from "@/features/seasonal-experience/copy";
import { useCart } from "@/features/cart/cart-provider";
import { useSceneMedia } from "@/features/seasonal-experience/use-scene-media";
import { winterScenes } from "@/features/seasonal-experience/winter-scenes";
import type {
  CinematicScene,
  Hotspot,
} from "@/features/seasonal-experience/types";
import { trackEvent } from "@/lib/analytics/client";
import type { Locale, Product } from "@/types/commerce";
import { HotspotButton } from "./hotspot-button";
import { ProductDrawer } from "./product-drawer";
import "./cinematic.css";

interface Selection {
  product: Product;
  trigger: HTMLElement;
  scene: CinematicScene;
}

interface Props {
  locale: Locale;
  products: Product[];
  scenes?: CinematicScene[];
}

export function CinematicExperience({
  locale,
  products,
  scenes = winterScenes,
}: Props) {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [directStatus, setDirectStatus] = useState("");
  const [skipped, setSkipped] = useState(false);
  const { addLines, loading } = useCart();

  useEffect(() => {
    trackEvent(
      {
        name: "cinematic_experience_loaded",
        properties: { locale, season_id: scenes[0]?.seasonId },
      },
      "cinematic-loaded",
    );
  }, [locale, scenes]);

  async function select(
    product: Product,
    trigger: HTMLElement,
    scene: CinematicScene,
    hotspot?: Hotspot,
  ) {
    if (hotspot)
      trackEvent({
        name: "hotspot_clicked",
        properties: {
          locale,
          scene_id: scene.id,
          season_id: scene.seasonId,
          product_id: product.id,
          product_handle: product.handle,
          hotspot_id: hotspot.id,
          ...hotspot.analytics,
        },
      });
    if (hotspot?.action === "add") {
      const variant = product.variants.find((item) => item.available);
      if (!variant || loading) return;
      try {
        await addLines([{ merchandiseId: variant.id, quantity: 1 }]);
        setDirectStatus(cinematicCopy[locale].added);
      } catch {
        setDirectStatus(cinematicCopy[locale].addError);
      }
      return;
    }
    trackEvent({
      name: "product_drawer_opened",
      properties: {
        locale,
        scene_id: scene.id,
        product_id: product.id,
        product_handle: product.handle,
        source: hotspot ? "hotspot" : "static_scene",
      },
    });
    setSelection({ product, trigger, scene });
    setDrawerOpen(true);
  }

  function changeDrawer(open: boolean) {
    setDrawerOpen(open);
    if (!open && selection)
      trackEvent({
        name: "product_drawer_closed",
        properties: {
          locale,
          scene_id: selection.scene.id,
          product_id: selection.product.id,
        },
      });
  }

  return (
    <div className="cinematic-experience" data-testid="cinematic-experience">
      <div className="cinema-live-status" role="status" aria-live="polite">
        {directStatus}
      </div>
      {scenes.map((scene, index) => (
        <Scene
          key={scene.id}
          scene={scene}
          index={index}
          total={scenes.length}
          locale={locale}
          products={products}
          frozen={drawerOpen}
          mediaDisabled={skipped}
          onSkip={() => flushSync(() => setSkipped(true))}
          onSelect={(product, trigger, hotspot) =>
            select(product, trigger, scene, hotspot)
          }
        />
      ))}
      {selection && (
        <ProductDrawer
          key={selection.product.id}
          product={selection.product}
          locale={locale}
          trigger={selection.trigger}
          open={drawerOpen}
          onOpenChange={changeDrawer}
        />
      )}
    </div>
  );
}

interface SceneProps {
  scene: CinematicScene;
  index: number;
  total: number;
  locale: Locale;
  products: Product[];
  frozen: boolean;
  mediaDisabled: boolean;
  onSkip: () => void;
  onSelect: (
    product: Product,
    trigger: HTMLButtonElement,
    hotspot?: Hotspot,
  ) => void;
}

function Scene({
  scene,
  index,
  total,
  locale,
  products,
  frozen,
  mediaDisabled,
  onSkip,
  onSelect,
}: SceneProps) {
  const {
    sectionRef,
    videoRef,
    mobile,
    active,
    enhanced,
    pinned,
    canLoadVideo,
    hasFrame,
    progress,
    reducedMotion,
    onMetadata,
    onFrame,
    onMediaError,
  } = useSceneMedia(frozen, mediaDisabled);
  const copy = cinematicCopy[locale];
  const sceneAsset = mobile ? scene.media.mobile : scene.media.desktop;
  const first = index === 0;
  const featured = products.find(
    (product) => product.handle === scene.hotspots[0]?.productHandle,
  );

  useEffect(() => {
    if (!active) return;
    trackEvent(
      {
        name: "cinematic_scene_entered",
        properties: {
          locale,
          scene_id: scene.id,
          season_id: scene.seasonId,
          reduced_motion: reducedMotion,
        },
      },
      `scene-entered:${scene.id}`,
    );
    trackEvent(
      {
        name: "cinematic_experience_started",
        properties: { locale, season_id: scene.seasonId },
      },
      "cinematic-started",
    );
  }, [active, reducedMotion, locale, scene.id, scene.seasonId]);

  useEffect(() => {
    if (!enhanced) return;
    const milestone = Math.floor(progress * 4) * 25;
    if (milestone > 0)
      trackEvent(
        {
          name: "cinematic_progress_milestone",
          properties: {
            locale,
            scene_id: scene.id,
            season_id: scene.seasonId,
            milestone,
          },
        },
        `milestone:${scene.id}:${milestone}`,
      );
    if (progress >= 0.98)
      trackEvent(
        {
          name: "cinematic_scene_completed",
          properties: { locale, scene_id: scene.id, season_id: scene.seasonId },
        },
        `scene-completed:${scene.id}`,
      );
  }, [enhanced, progress, locale, scene.id, scene.seasonId]);

  const price = featured
    ? new Intl.NumberFormat(locale === "sv" ? "sv-SE" : "en-SE", {
        style: "currency",
        currency: featured.price.currencyCode,
        maximumFractionDigits: 0,
      }).format(Number(featured.price.amount))
    : "";
  const skipLink = (
    <a
      className={`cinema-skip ${first ? "cinema-skip-top" : ""}`}
      href="#gifts"
      onClick={() => {
        // Collapse all scene ranges before native anchor navigation measures its target.
        onSkip();
        trackEvent({
          name: "cinematic_experience_skipped",
          properties: {
            locale,
            season_id: scene.seasonId,
            scene_id: scene.id,
            reduced_motion: reducedMotion,
          },
        });
      }}
    >
      {copy.skip}
      <span aria-hidden="true"> ↗</span>
    </a>
  );

  return (
    <section
      ref={sectionRef}
      className={`cinema-scene ${first ? "cinema-entrance" : "cinema-interior"}`}
      data-enhanced={enhanced}
      data-pinned={pinned}
      data-scene={scene.id}
      data-progress={Math.round(progress * 100)}
      aria-labelledby={`${scene.id}-title`}
    >
      <div className="cinema-stage">
        <picture
          className={`cinema-poster ${enhanced && hasFrame ? "cinema-poster-hidden" : ""}`}
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
            fetchPriority={first ? "high" : "auto"}
            loading={first ? "eager" : "lazy"}
            onError={(event) => {
              event.currentTarget.style.opacity = "0";
            }}
          />
        </picture>
        {canLoadVideo && (
          <video
            ref={videoRef}
            className="cinema-video"
            src={sceneAsset.video}
            poster={sceneAsset.poster}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            aria-hidden="true"
            tabIndex={-1}
            onLoadedMetadata={onMetadata}
            onLoadedData={onFrame}
            onSeeked={onFrame}
            onError={onMediaError}
          />
        )}
        <div className="cinema-shade" aria-hidden="true" />
        {first && skipLink}
        {canLoadVideo && !enhanced && (
          <span className="cinema-media-status" role="status">
            {copy.loading}
          </span>
        )}

        <div className="cinema-scene-content">
          <p className="cinema-kicker">{scene.copy.eyebrow[locale]}</p>
          {first ? (
            <h1 id={`${scene.id}-title`} className="cinema-title">
              {scene.copy.title[locale]}
            </h1>
          ) : (
            <h2 id={`${scene.id}-title`} className="cinema-title">
              {scene.copy.title[locale]}
            </h2>
          )}
          <p className="cinema-description">{scene.copy.description[locale]}</p>
          {first && (
            <div className="cinema-actions">
              <a
                className="cinema-button cinema-button-light"
                href="#gifts"
                onClick={onSkip}
              >
                {copy.explore}
                <span aria-hidden="true">↗</span>
              </a>
              <Link
                className="cinema-text-link"
                href={`/${locale}/build-a-box`}
              >
                {copy.build}
                <span aria-hidden="true"> ↗</span>
              </Link>
            </div>
          )}
        </div>

        {enhanced &&
          scene.hotspots.map((hotspot) => {
            const product = products.find(
              (item) => item.handle === hotspot.productHandle,
            );
            return product ? (
              <HotspotButton
                key={hotspot.id}
                hotspot={hotspot}
                product={product}
                locale={locale}
                progress={progress}
                onSelect={onSelect}
              />
            ) : null;
          })}

        {featured && !enhanced && (
          <div className="cinema-static-product">
            <p className="cinema-kicker">{copy.product}</p>
            <button
              type="button"
              onClick={(event) => onSelect(featured, event.currentTarget)}
              aria-haspopup="dialog"
              className="cinema-static-product-button"
            >
              <span>
                <strong>{featured.title[locale]}</strong>
                <span>{price}</span>
              </span>
              <span className="cinema-product-plus" aria-hidden="true">
                +
              </span>
            </button>
            <Link
              href={`/${locale}/products/${featured.handle}`}
              className="cinema-static-product-link"
            >
              {copy.shopNow}
              <span aria-hidden="true"> ↗</span>
            </Link>
          </div>
        )}

        <div className="cinema-scene-footer">
          <span className="cinema-index">
            {String(index + 1).padStart(2, "0")}{" "}
            <span aria-hidden="true">/</span> {String(total).padStart(2, "0")}
            <span className="cinema-index-name">{scene.name[locale]}</span>
          </span>
          {first && (
            <span className="cinema-scroll-cue">
              <span aria-hidden="true">↓</span>
              {enhanced ? copy.scroll : copy.static}
            </span>
          )}
          {!first && skipLink}
        </div>
        {!first && (
          <Link className="cinema-shop-route" href={`/${locale}/shop`}>
            {copy.shop}
            <span aria-hidden="true"> ↗</span>
          </Link>
        )}
      </div>
    </section>
  );
}
