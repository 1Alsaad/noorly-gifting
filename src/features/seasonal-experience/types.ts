import type { LocalizedText } from "@/types/commerce";

export interface SceneMedia {
  video: string;
  poster: string;
}

export interface Hotspot {
  id: string;
  sceneId: string;
  productHandle: string;
  visibleFrom: number;
  visibleTo: number;
  desktop: { x: number; y: number };
  mobile: { x: number; y: number };
  label: LocalizedText;
  tooltipAlignment?: "left" | "right";
  pulse?: boolean;
  action?: "drawer" | "add";
  analytics?: Record<string, string>;
}

export interface CinematicScene {
  id: string;
  seasonId: string;
  name: LocalizedText;
  media: { desktop: SceneMedia; mobile: SceneMedia };
  copy: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    description: LocalizedText;
    beat?: LocalizedText;
    closing?: LocalizedText;
  };
  hotspots: Hotspot[];
}

/** The page depends on progress, not a specific rendering technique. */
export interface MediaScrubber {
  setProgress(progress: number): void;
  destroy(): void;
}
