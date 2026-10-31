import {
  expect,
  test,
  type Page,
  type APIRequestContext,
} from "@playwright/test";

const mediaRoot =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_3HdOg0854ky23xVGpsB15oIg3ri/";
const originalMedia = new Map<string, Promise<Buffer>>();

async function rejectOptional(page: Page) {
  const reject = page.getByRole("button", {
    name: /^(Reject optional|Avvisa valfria)$/,
  });
  if (await reject.isVisible()) await reject.click();
}

async function expectNoPlaybackControls(page: Page) {
  await expect(
    page.getByRole("button", {
      name: /^(play|pause|stop|retry|try again|spela|pausa|stoppa|försök igen)( video)?$/i,
      includeHidden: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.locator(".cinematic-experience video[controls]"),
  ).toHaveCount(0);
}

// Cache the actual, unmodified production MP4 bytes, not a fake media adapter.
// Reproduce byte-range delivery so all three engines exercise their real decoders
// without repeated CloudFront downloads while scrubbing backwards and forwards.
async function useOriginalMedia(
  page: Page,
  request: APIRequestContext,
  url: string,
) {
  let download = originalMedia.get(url);
  if (!download) {
    download = (async () => {
      const response = await request.get(url, { timeout: 45_000 });
      expect(response.ok(), `Download original MP4: ${response.status()}`).toBe(
        true,
      );
      expect(response.headers()["content-type"]).toContain("video/mp4");
      const body = await response.body();
      expect(body.length).toBeGreaterThan(1_000_000);
      return body;
    })();
    originalMedia.set(url, download);
  }
  const bytes = await download;
  await page.route(url, async (route) => {
    const range = route.request().headers().range;
    const headers = { "Content-Type": "video/mp4", "Accept-Ranges": "bytes" };
    if (!range) {
      await route.fulfill({ status: 200, headers, body: bytes });
      return;
    }
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const start = match?.[1]
      ? Number(match[1])
      : Math.max(0, bytes.length - Number(match?.[2] ?? bytes.length));
    const end =
      match?.[1] && match[2]
        ? Math.min(Number(match[2]), bytes.length - 1)
        : bytes.length - 1;
    if (!match || start > end || start >= bytes.length) {
      await route.fulfill({
        status: 416,
        headers: { ...headers, "Content-Range": `bytes */${bytes.length}` },
      });
      return;
    }
    await route.fulfill({
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${bytes.length}`,
      },
      body: bytes.subarray(start, end + 1),
    });
  });
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
  test(`original ${viewport.name} MP4 decodes and follows scroll in both directions while paused`, async ({
    page,
    request,
  }) => {
    test.setTimeout(90_000);
    await page.setViewportSize(viewport);
    await useOriginalMedia(page, request, mediaRoot + viewport.clip);
    await page.goto("/en");
    await rejectOptional(page);
    const scene = page.locator('[data-scene="winter-entrance"]');
    const video = scene.locator("video");
    await expect(video).toHaveAttribute("src", mediaRoot + viewport.clip);
    await expect(video).toHaveAttribute("playsinline", "");
    await expect(video).toHaveJSProperty("muted", true);
    await expect(video).toHaveJSProperty("paused", true);
    await expect(video).not.toHaveAttribute("autoplay", "");
    await expect(video).not.toHaveAttribute("loop", "");
    await expectNoPlaybackControls(page);
    await expect(scene).toHaveAttribute("data-enhanced", "true", {
      timeout: 20_000,
    });
    const scrollToProgress = (progress: number) =>
      scene.evaluate((element: HTMLElement, value) => {
        window.scrollTo({
          top:
            element.getBoundingClientRect().top +
            scrollY +
            (element.offsetHeight - innerHeight) * value,
          behavior: "instant",
        });
      }, progress);
    const mediaState = () =>
      video.evaluate((element: HTMLVideoElement) => ({
        progress: element.currentTime / (element.duration - 0.04),
        ready: element.readyState >= 2 && !element.seeking,
        paused: element.paused,
        error: element.error?.code ?? null,
      }));

    await scrollToProgress(0.72);
    await expect
      .poll(async () => (await mediaState()).progress)
      .toBeCloseTo(0.72, 1);
    await expect
      .poll(async () => {
        const state = await mediaState();
        return { ready: state.ready, paused: state.paused, error: state.error };
      })
      .toEqual({ ready: true, paused: true, error: null });
    const forwardTime = await video.evaluate(
      (element: HTMLVideoElement) => element.currentTime,
    );
    await expect(scene.locator(".cinema-poster")).toHaveClass(
      /cinema-poster-hidden/,
    );
    await expect(scene.locator(".cinema-shopping")).toHaveAttribute(
      "data-visible",
      "true",
    );

    await scrollToProgress(0.22);
    await expect
      .poll(async () => (await mediaState()).progress)
      .toBeCloseTo(0.22, 1);
    await expect.poll(async () => (await mediaState()).ready).toBe(true);
    expect(
      await video.evaluate((element: HTMLVideoElement) => element.currentTime),
    ).toBeLessThan(forwardTime);
    await expect(video).toHaveJSProperty("paused", true);
    await expectNoPlaybackControls(page);
    await scene.getByRole("link", { name: "Skip experience" }).click();
    await expect(page.locator("#gifts")).toBeInViewport();
    await expect(page.locator(".cinematic-experience video")).toHaveCount(0);
  });
}

test("late metadata cannot move the collection after skipping the scroll film", async ({
  page,
}) => {
  await page.route("**/*.mp4", () => {});
  await page.goto("/en", { waitUntil: "domcontentloaded" });
  await rejectOptional(page);
  const scene = page.locator('[data-scene="winter-entrance"]');
  await expect(scene).toHaveAttribute("data-pinned", "true");
  await expect(scene.locator("video")).toHaveCount(1);
  const geometry = () =>
    page.evaluate(() => ({
      sceneHeight: document
        .querySelector(".cinema-scene")!
        .getBoundingClientRect().height,
      giftsTop:
        document.getElementById("gifts")!.getBoundingClientRect().top + scrollY,
    }));
  const before = await geometry();
  await scene.locator("video").dispatchEvent("loadedmetadata");
  expect(await geometry()).toEqual(before);
  const skip = scene.getByRole("link", { name: "Skip experience" });
  await skip.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#gifts$/);
  await expect(scene).toHaveAttribute("data-pinned", "false");
  await expect(scene.locator("video")).toHaveCount(0);
  await expect(page.locator("#gifts")).toBeInViewport();
  await expect(page.locator("#gifts article")).toHaveCount(3);
  await expectNoPlaybackControls(page);
});

for (const preference of ["reduced motion", "Save-Data"]) {
  test(`${preference} avoids video requests and keeps the poster and shopping`, async ({
    page,
  }) => {
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
    const scene = page.locator('[data-scene="winter-entrance"]');
    await expect(scene).toHaveAttribute("data-pinned", "false");
    await expect(scene.locator("video")).toHaveCount(0);
    await expect(scene.locator(".cinema-poster img")).toBeVisible();
    await expectNoPlaybackControls(page);
    await scene.getByRole("link", { name: "Skip experience" }).click();
    await expect(page.locator("#gifts")).toBeInViewport();
    expect(requests).toEqual([]);
  });
}

test("failed media automatically restores the poster and shopping without controls", async ({
  page,
}) => {
  let attempted = 0;
  await page.route("**/*.mp4", async (route) => {
    attempted += 1;
    await route.abort();
  });
  await page.goto("/en");
  await rejectOptional(page);
  const scene = page.locator('[data-scene="winter-entrance"]');
  await expect.poll(() => attempted).toBeGreaterThan(0);
  await expect(scene).toHaveAttribute("data-pinned", "false");
  await expect(scene).toHaveAttribute("data-enhanced", "false");
  await expect(scene.locator("video")).toHaveCount(0);
  await expect(scene.locator(".cinema-poster")).not.toHaveClass(
    /cinema-poster-hidden/,
  );
  await expect(scene.locator(".cinema-poster img")).toBeVisible();
  await expectNoPlaybackControls(page);
  await scene.getByRole("link", { name: "Skip experience" }).click();
  await expect(page.locator("#gifts")).toBeInViewport();
  await page
    .locator("#gifts")
    .getByRole("link", { name: /Choose colour & scent/ })
    .click();
  await expect(page).toHaveURL("/en/products/candle-sand");
});

test("small Swedish screens retain the original poster layout and shopping", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 568 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/sv");
  await rejectOptional(page);
  const scene = page.locator('[data-scene="winter-entrance"]');
  await expect(scene.getByRole("heading", { level: 1 })).toHaveText(
    /Din färg\.\s+Din ljusstund\./,
  );
  await expectNoPlaybackControls(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await scene.getByRole("link", { name: "Hoppa över upplevelsen" }).click();
  await expect(page.locator("#gifts")).toBeInViewport();
});
