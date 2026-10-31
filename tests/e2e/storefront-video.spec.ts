import { expect, test, type Page } from "@playwright/test";

async function rejectOptional(page: Page) {
  const reject = page.getByRole("button", {
    name: /^(Reject optional|Avvisa valfria)$/,
  });
  if (await reject.isVisible()) await reject.click();
}

// Exercise playback-policy UI independently from network and decoder support.
// The real MP4 decoder is verified separately below, in every browser project.
async function installPlaybackPolicy(page: Page, denyAutoplay = false) {
  await page.route("**/*.mp4", () => {});
  await page.addInitScript((deny) => {
    document.addEventListener(
      "pointerdown",
      (event) => {
        if ((event.target as Element)?.closest(".storefront-video-toggle")) {
          const video = document.querySelector(
            ".storefront-hero video",
          ) as HTMLVideoElement | null;
          if (video) video.dataset.userPlayback = "true";
        }
      },
      true,
    );
    HTMLMediaElement.prototype.play = function () {
      this.dataset.playAttempts = String(
        Number(this.dataset.playAttempts ?? 0) + 1,
      );
      if (deny && this.dataset.userPlayback !== "true") {
        return Promise.reject(
          new DOMException("Autoplay denied for test", "NotAllowedError"),
        );
      }
      Object.defineProperty(this, "paused", {
        configurable: true,
        value: false,
      });
      queueMicrotask(() => this.dispatchEvent(new Event("playing")));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {
      Object.defineProperty(this, "paused", {
        configurable: true,
        value: true,
      });
      queueMicrotask(() => this.dispatchEvent(new Event("pause")));
    };
  }, denyAutoplay);
}

for (const viewport of [
  {
    name: "desktop",
    width: 1280,
    height: 900,
    clip: "46439a25-f450-49f4-b8b1-785e0d1bc834.mp4",
  },
  {
    name: "mobile",
    width: 390,
    height: 844,
    clip: "0e98a61d-fd67-4fee-8c28-793ca27c6fce.mp4",
  },
]) {
  test(`original ${viewport.name} MP4 decodes, plays and pauses`, async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    // Decode the original MP4 through an explicit gesture; autoplay policy is
    // covered separately so buffering cannot race the Play/Pause control here.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");
    await rejectOptional(page);
    const video = page.locator(".storefront-hero video");
    await expect(video).toHaveJSProperty("muted", true);
    await expect(video).toHaveJSProperty("playsInline", true);
    const play = page.getByRole("button", { name: "Play video", exact: true });
    await expect(play).toBeVisible();
    await play.click();
    await expect(video).toHaveAttribute(
      "src",
      new RegExp(viewport.clip.replace(/\./g, "\\.") + "$"),
    );
    await expect
      .poll(
        () =>
          video.evaluate((element: HTMLVideoElement) => ({
            ready: element.readyState >= 2,
            playing: !element.paused,
            time: element.currentTime > 0,
            error: element.error?.code ?? null,
          })),
        { timeout: 45_000 },
      )
      .toEqual({ ready: true, playing: true, time: true, error: null });
    const before = await video.evaluate(
      (element: HTMLVideoElement) => element.currentTime,
    );
    await expect
      .poll(
        () =>
          video.evaluate((element: HTMLVideoElement) => element.currentTime),
        { timeout: 10_000 },
      )
      .not.toBe(before);
    await expect(page.locator(".hero-poster")).toHaveClass(/has-frame/);
    await page
      .getByRole("button", { name: "Pause video", exact: true })
      .click();
    await expect(video).toHaveJSProperty("paused", true);
    await page.getByRole("button", { name: "Play video", exact: true }).click();
    await expect(video).toHaveJSProperty("paused", false);
    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect(video).not.toBeInViewport();
    await expect(video).toHaveJSProperty("paused", true);
  });
}

test("autoplay refusal keeps the poster and offers a working play button", async ({
  page,
}) => {
  await installPlaybackPolicy(page, true);
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  const video = page.locator(".storefront-hero video");
  await expect
    .poll(() => video.getAttribute("data-play-attempts"))
    .not.toBeNull();
  await expect(page.locator(".hero-poster")).not.toHaveClass(/has-frame/);
  await rejectOptional(page);
  await page.getByRole("button", { name: "Play video", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause video", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".hero-poster")).toHaveClass(/has-frame/);
});

test("media loading never changes the compact hero or the collection anchor", async ({
  page,
}) => {
  await page.route("**/*.mp4", () => {});
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  await rejectOptional(page);
  const geometry = () =>
    page.evaluate(() => ({
      heroHeight: document
        .querySelector(".storefront-hero")!
        .getBoundingClientRect().height,
      giftsTop:
        document.getElementById("gifts")!.getBoundingClientRect().top + scrollY,
    }));
  const before = await geometry();
  expect(before.heroHeight).toBeLessThan(650);
  await page.locator(".storefront-hero video").dispatchEvent("loadedmetadata");
  expect(await geometry()).toEqual(before);
  const shop = page.getByRole("link", {
    name: "Shop the collection",
    exact: true,
  });
  await shop.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#gifts$/);
  await expect(page.locator("#gifts")).toBeInViewport();
  await expect(page.locator("#gifts article")).toHaveCount(3);
});

for (const preference of ["reduced motion", "Save-Data"]) {
  test(`${preference} avoids automatic video requests and retains manual playback`, async ({
    page,
  }) => {
    await installPlaybackPolicy(page);
    if (preference === "reduced motion") {
      await page.emulateMedia({ reducedMotion: "reduce" });
    } else {
      await page.addInitScript(() =>
        Object.defineProperty(navigator, "connection", {
          configurable: true,
          value: Object.assign(new EventTarget(), {
            saveData: true,
            effectiveType: "4g",
          }),
        }),
      );
    }
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith(".mp4")) requests.push(request.url());
    });
    await page.goto("/en");
    await rejectOptional(page);
    const video = page.locator(".storefront-hero video");
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).not.toHaveAttribute("autoplay", "");
    await expect(video).toHaveJSProperty("paused", true);
    await expect(video).not.toHaveAttribute("src", /\.mp4/);
    expect(requests).toEqual([]);
    await page.getByRole("button", { name: "Play video", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Pause video", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Shop the collection", exact: true }),
    ).toBeVisible();
  });
}

test("a failed video restores the poster without blocking shopping", async ({
  page,
}) => {
  await page.route("**/*.mp4", (route) => route.abort());
  await page.goto("/en");
  await rejectOptional(page);
  await expect(
    page.getByRole("button", { name: "Try again", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".hero-poster")).not.toHaveClass(/has-frame/);
  await expect(page.locator(".hero-poster img")).toBeVisible();
  await page
    .getByRole("link", { name: "Shop the collection", exact: true })
    .click();
  await expect(page.locator("#gifts")).toBeInViewport();
  await page
    .locator("#gifts")
    .getByRole("link", { name: /Choose colour & scent/ })
    .click();
  await expect(page).toHaveURL("/en/products/candle-sand");
});

test("small Swedish screens keep the heading, shopping link and video control separate", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/sv");
  await rejectOptional(page);
  const hero = page.locator(".storefront-hero");
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText(
    /Varmare stunder\.\s+På ditt sätt\./,
  );
  const geometry = await hero.evaluate((element) => {
    const cta = element
      .querySelector(".storefront-hero-cta")!
      .getBoundingClientRect();
    const control = element
      .querySelector(".storefront-video-toggle")!
      .getBoundingClientRect();
    return {
      ctaBottom: cta.bottom,
      controlTop: control.top,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: innerWidth,
    };
  });
  expect(geometry.ctaBottom).toBeLessThanOrEqual(geometry.controlTop);
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewport);
  await hero
    .getByRole("link", { name: "Shoppa kollektionen", exact: true })
    .click();
  await expect(page.locator("#gifts")).toBeInViewport();
});
