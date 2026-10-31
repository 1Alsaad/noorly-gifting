import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSceneMedia } from "@/features/seasonal-experience/use-scene-media";

function MediaScene() {
  const {
    sectionRef,
    videoRef,
    enhanced,
    pinned,
    hasFrame,
    canLoadVideo,
    onMetadata,
    onLoadStart,
    onFrame,
    onMediaError,
  } = useSceneMedia(false, false, true);
  return (
    <section
      ref={sectionRef}
      data-enhanced={enhanced}
      data-pinned={pinned}
      data-frame={hasFrame}
    >
      {canLoadVideo && (
        <video
          ref={videoRef}
          src="/film.mp4"
          muted
          playsInline
          onLoadedMetadata={onMetadata}
          onLoadStart={onLoadStart}
          onLoadedData={onFrame}
          onSeeked={onFrame}
          onError={onMediaError}
        />
      )}
    </section>
  );
}

describe("cinematic frame readiness", () => {
  let readyState: number;
  let callbacks: Map<number, FrameRequestCallback>;

  beforeEach(() => {
    readyState = 0;
    callbacks = new Map();
    let nextFrame = 0;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callbacks.set(++nextFrame, callback);
      return nextFrame;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => callbacks.delete(id));
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(private callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          this.callback(
            [{ target, isIntersecting: true } as IntersectionObserverEntry],
            this as unknown as IntersectionObserver,
          );
        }
        disconnect() {}
      },
    );
    vi.spyOn(
      HTMLMediaElement.prototype,
      "readyState",
      "get",
    ).mockImplementation(() => readyState);
    vi.spyOn(HTMLMediaElement.prototype, "duration", "get").mockReturnValue(15);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("keeps the poster until decoded data arrives and primes a paused opening frame", () => {
    const { container } = render(<MediaScene />);
    const section = container.querySelector("section")!;
    const video = container.querySelector("video")!;
    readyState = 1;
    fireEvent.loadedMetadata(video);
    expect(section).toHaveAttribute("data-enhanced", "false");
    expect(section).toHaveAttribute("data-frame", "false");
    act(() => {
      const pending = [...callbacks.values()];
      callbacks.clear();
      pending.forEach((callback) => callback(16));
    });
    expect(video.currentTime).toBe(0.001);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    readyState = 2;
    fireEvent.loadedData(video);
    expect(section).toHaveAttribute("data-enhanced", "true");
    expect(section).toHaveAttribute("data-frame", "true");
  });

  it("releases the pinned scroll range and keeps the static fallback after a loading timeout", () => {
    vi.useFakeTimers();
    const { container } = render(<MediaScene />);
    const section = container.querySelector("section")!;
    expect(container.querySelector("video")).not.toBeNull();
    expect(section).toHaveAttribute("data-pinned", "true");
    act(() => vi.advanceTimersByTime(12_000));
    expect(section).toHaveAttribute("data-enhanced", "false");
    expect(section).toHaveAttribute("data-pinned", "false");
    expect(container.querySelector("video")).toBeNull();
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
});
