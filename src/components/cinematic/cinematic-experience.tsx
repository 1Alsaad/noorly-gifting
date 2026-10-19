"use client";

import { formatMoney } from "@/lib/utils/money";

/* Responsive first frames also cover loading and static-media fallbacks. */

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { cinematicCopy } from "@/features/seasonal-experience/copy";
import { useCart } from "@/features/cart/cart-provider";
import { useSceneMedia } from "@/features/seasonal-experience/use-scene-media";
import { sceneChoreography } from "@/features/seasonal-experience/progress";
import { winterScenes } from "@/features/seasonal-experience/winter-scenes";
import type {
  CinematicScene,
  Hotspot,
} from "@/features/seasonal-experience/types";
import { trackEvent } from "@/lib/analytics/client";
import type { Locale, Product } from "@/types/commerce";
import { HotspotButton } from "./hotspot-button";
import { ProductDrawer } from "./product-drawer";
import { ShoppingOverlay } from "./shopping-overlay";
import "./cinematic.css";

interface Selection {
  product: Product;
  trigger: HTMLElement;
  scene: CinematicScene;
  variantId?: string;
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
    variantId?: string,
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
    setSelection({ product, trigger, scene, variantId });
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
          onSelect={(product, trigger, hotspot, variantId) =>
            select(product, trigger, scene, hotspot, variantId)
          }
        />
      ))}
      {selection && (
        <ProductDrawer
          key={`${selection.product.id}:${selection.variantId ?? "default"}`}
          product={selection.product}
          locale={locale}
          trigger={selection.trigger}
          initialVariantId={selection.variantId}
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
    variantId?: string,
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
    presentation,
    canLoadVideo,
    hasFrame,
    frameProgress,
    progress,
    reducedMotion,
    onMetadata,
    onLoadStart,
    onFrame,
    onMediaError,
  } = useSceneMedia(frozen, mediaDisabled, index === 0);
  const copy = cinematicCopy[locale];
  const sceneAsset = mobile ? scene.media.mobile : scene.media.desktop;
  const first = index === 0;
  const last = index === total - 1;
  const choreography = sceneChoreography(progress, first, last);
  const sceneStyle = {
    "--scene-reveal": presentation.reveal,
    "--poster-opacity": choreography.poster,
    "--intro-opacity": choreography.intro,
    "--intro-lift": `${(1 - choreography.intro) * -28}px`,
    "--detail-opacity": choreography.details,
    "--beat-opacity": choreography.beat,
    "--beat-lift": `${(1 - choreography.beat) * 24}px`,
    "--closing-opacity": choreography.closing * (1 - presentation.exit),
    "--chrome-opacity": choreography.chrome * (1 - presentation.exit),
    "--story-progress": progress,
  } as CSSProperties;
  const featured = products.find(
    (product) =>
      product.handle ===
      (scene.shopping?.productHandle ?? scene.hotspots[0]?.productHandle),
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

  const price = featured ? formatMoney(featured.price, locale) : "";
  const skipLink = (
    <a
      className="cinema-skip cinema-skip-top"
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
      data-floating={pinned && active && presentation.floating}
      data-interactive={presentation.reveal >= 0.98}
      data-scene={scene.id}
      data-progress={Math.round(progress * 100)}
      aria-labelledby={`${scene.id}-title`}
      style={sceneStyle}
      onFocusCapture={(event) => {
        const section = sectionRef.current;
        if (!pinned || !section || !event.target.matches(":focus-visible"))
          return;
        const bounds = section.getBoundingClientRect();
        // Keyboard navigation reveals the relevant scene before focusing its
        // controls, including a scene partway through its incoming dissolve.
        if (bounds.top > 0 || bounds.bottom <= 0)
          section.scrollIntoView({ block: "start", behavior: "instant" });
        else if (bounds.bottom < window.innerHeight)
          window.scrollBy({
            top: bounds.bottom - window.innerHeight,
            behavior: "instant",
          });
      }}
    >
      <div className="cinema-stage">
        <div className="cinema-media">
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
              onLoadStart={onLoadStart}
              onLoadedData={onFrame}
              onSeeked={onFrame}
              onError={onMediaError}
            />
          )}
          <div className="cinema-shade" aria-hidden="true" />
        </div>
        {skipLink}
        {canLoadVideo && !enhanced && (
          <span className="cinema-media-status" role="status">
            {copy.loading}
          </span>
        )}

        <div className="cinema-scene-content">
          <div className="cinema-copy">
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
            <p className="cinema-description">
              {scene.copy.description[locale]}
            </p>
            {first && (
              <div
                className="cinema-actions"
                data-muted={enhanced && choreography.details < 0.05}
              >
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
        </div>

        {enhanced && scene.copy.beat && (
          <p className="cinema-story-beat">{scene.copy.beat[locale]}</p>
        )}
        {enhanced && last && scene.copy.closing && !scene.shopping && (
          <div className="cinema-closing" inert={choreography.closing < 0.1}>
            <p className="cinema-kicker">{scene.copy.eyebrow[locale]}</p>
            <p className="cinema-closing-title">{scene.copy.closing[locale]}</p>
            <a className="cinema-text-link" href="#gifts" onClick={onSkip}>
              {copy.explore}
              <span aria-hidden="true"> ↗</span>
            </a>
          </div>
        )}

        {enhanced && featured && scene.shopping && (
          <ShoppingOverlay
            product={featured}
            locale={locale}
            visible={hasFrame && frameProgress >= scene.shopping.visibleFrom}
            onDetails={(product, trigger, variantId) =>
              onSelect(product, trigger, undefined, variantId)
            }
            onSkip={onSkip}
          />
        )}

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
            {enhanced && (
              <span className="cinema-timeline" aria-hidden="true">
                <i />
              </span>
            )}
          </span>
          {first && (
            <span className="cinema-scroll-cue">
              <span aria-hidden="true">↓</span>
              {enhanced ? copy.scroll : copy.static}
            </span>
          )}
          {!first && (
            <Link className="cinema-shop-route" href={`/${locale}/shop`}>
              {copy.shop}
              <span aria-hidden="true"> ↗</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
