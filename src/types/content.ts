import type { LocalizedText, ProductImage } from "./commerce";
import type {
  CinematicScene,
  Hotspot,
} from "@/features/seasonal-experience/types";
export type {
  CinematicScene,
  Hotspot,
} from "@/features/seasonal-experience/types";

export interface GiftBoxTemplate {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  baseProduct: string;
  includedProductHandles: string[];
  optionalProductHandles: string[];
  minimumSelections: number;
  maximumSelections: number;
  seasons: string[];
  pricePresentation: "sum" | "fixed";
  image: ProductImage;
  tags: string[];
}
export interface Season {
  id: string;
  slug: string;
  name: LocalizedText;
  dateRange: { start: string; end: string };
  active: boolean;
  theme: { accent: string; background: string; foreground: string };
  hero: {
    title: LocalizedText;
    description: LocalizedText;
    eyebrow: LocalizedText;
  };
  media: { desktopPoster: string; mobilePoster: string };
  sceneIds: string[];
  scenes: CinematicScene[];
  hotspots: Hotspot[];
  featuredProductHandles: string[];
  curatedBoxes: GiftBoxTemplate[];
  seo: { title: LocalizedText; description: LocalizedText };
}
export interface ContentRepository {
  getActiveSeason(): Promise<Season>;
  getSeasonBySlug(slug: string): Promise<Season | null>;
  getSeasons(): Promise<Season[]>;
  getGiftBoxTemplates(): Promise<GiftBoxTemplate[]>;
}
