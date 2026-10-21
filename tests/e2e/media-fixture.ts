import type { Page } from "@playwright/test";

export async function installTestSceneMedia(page: Page) {
  await page.addInitScript(() => {
    const setup = (video: HTMLVideoElement) => {
      if (video.dataset.testMedia) return;
      video.dataset.testMedia = "true";
      video.dataset.testSource = video.getAttribute("src") ?? "";
      video.removeAttribute("src");
      let time = 0;
      Object.defineProperty(video, "duration", {
        configurable: true,
        get: () => 15,
      });
      Object.defineProperty(video, "seeking", {
        configurable: true,
        get: () => false,
      });
      Object.defineProperty(video, "readyState", {
        configurable: true,
        get: () => 4,
      });
      Object.defineProperty(video, "currentTime", {
        configurable: true,
        get: () => time,
        set: (value: number) => {
          time = value;
          if (video.dataset.holdDecode !== "true")
            queueMicrotask(() => video.dispatchEvent(new Event("seeked")));
        },
      });
      setTimeout(() => {
        video.dispatchEvent(new Event("loadedmetadata"));
        video.dispatchEvent(new Event("loadeddata"));
      }, 50);
    };
    new MutationObserver(() =>
      document.querySelectorAll("video").forEach(setup),
    ).observe(document, { childList: true, subtree: true });
  });
}
