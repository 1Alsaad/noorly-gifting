import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorefrontHero } from "@/components/home/storefront-hero";
import { winterScenes } from "@/features/seasonal-experience/winter-scenes";

let reducedMotion = false;
let narrow = false;
let saveData = false;
let paused: WeakSet<HTMLMediaElement>;
let started: WeakSet<HTMLMediaElement>;

function renderHero() {
  return render(
    <StorefrontHero locale="en" scenes={winterScenes} products={[]} />,
  );
}

describe("storefront hero playback", () => {
  beforeEach(() => {
    reducedMotion = false;
    narrow = false;
    saveData = false;
    paused = new WeakSet();
    started = new WeakSet();
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query.includes("reduced-motion") ? reducedMotion : narrow,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: {
        get saveData() {
          return saveData;
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });
    vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(
      function (this: HTMLMediaElement) {
        return !started.has(this) || paused.has(this);
      },
    );
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      started.add(this);
      paused.delete(this);
      fireEvent.playing(this);
      return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      paused.add(this);
      fireEvent.pause(this);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, "connection");
  });

  it("keeps a usable play button when autoplay is denied, then plays from a gesture", async () => {
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(
      new DOMException("Autoplay denied", "NotAllowedError"),
    );
    const { container } = renderHero();
    await waitFor(() =>
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1),
    );
    expect(container.querySelector(".hero-poster")).not.toHaveClass(
      "has-frame",
    );
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));
    expect(screen.getByRole("button", { name: "Pause video" })).toBeVisible();
    expect(container.querySelector(".hero-poster")).toHaveClass("has-frame");
    fireEvent.click(screen.getByRole("button", { name: "Pause video" }));
    expect(screen.getByRole("button", { name: "Play video" })).toBeVisible();
  });

  it("honours the visible Play action while autoplay is still buffering", async () => {
    let finishAutoplay: () => void = () => {};
    vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(function (
      this: HTMLMediaElement,
    ) {
      started.add(this);
      paused.delete(this);
      // Browsers clear paused before a decoded frame produces `playing`.
      return new Promise<void>((resolve) => {
        finishAutoplay = resolve;
      });
    });
    const { container } = renderHero();
    expect(container.querySelector("video")!.paused).toBe(false);
    expect(screen.getByRole("button", { name: "Play video" })).toBeVisible();
    const pauseCalls = vi.mocked(HTMLMediaElement.prototype.pause).mock.calls
      .length;

    fireEvent.click(screen.getByRole("button", { name: "Play video" }));

    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(pauseCalls);
    expect(screen.getByRole("button", { name: "Pause video" })).toBeVisible();
    await act(async () => finishAutoplay());
  });

  it.each(["reduced motion", "data saver"])(
    "respects %s while allowing explicit playback",
    (preference) => {
      reducedMotion = preference === "reduced motion";
      saveData = preference === "data saver";
      narrow = true;
      const { container } = renderHero();
      const video = container.querySelector("video")!;
      expect(video).not.toHaveAttribute("src");
      expect(video.autoplay).toBe(false);
      expect(video.preload).toBe("none");
      expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Play video" }));
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
      expect(video.src).toBe(winterScenes[0].media.mobile.video);
      expect(video.muted).toBe(true);
      expect(video.playsInline).toBe(true);
    },
  );

  it("pauses outside the viewport and preserves an intentional user pause on return", () => {
    let onIntersection: IntersectionObserverCallback | undefined;
    const disconnect = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          onIntersection = callback;
        }
        observe = vi.fn();
        disconnect = disconnect;
      },
    );
    const { container, unmount } = renderHero();
    const video = container.querySelector("video")!;
    function setVisible(value: boolean) {
      act(() =>
        onIntersection?.(
          [{ isIntersecting: value } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        ),
      );
    }
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    setVisible(true);
    expect(video.paused).toBe(false);
    setVisible(false);
    expect(video.paused).toBe(true);
    setVisible(true);
    fireEvent.click(screen.getByRole("button", { name: "Pause video" }));
    const callsAfterPause = vi.mocked(HTMLMediaElement.prototype.play).mock
      .calls.length;
    setVisible(false);
    setVisible(true);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(
      callsAfterPause,
    );
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it("restores the poster and leaves shopping available after a media error", () => {
    const { container } = renderHero();
    fireEvent.error(container.querySelector("video")!);
    expect(container.querySelector(".hero-poster")).not.toHaveClass(
      "has-frame",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Shop the collection" }),
    ).toHaveAttribute("href", "#gifts");
  });
});
