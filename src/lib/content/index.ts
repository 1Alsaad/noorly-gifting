import { winter } from "@/content/seasons/winter";
import type { ContentRepository } from "@/types/content";

class LocalContentRepository implements ContentRepository {
  async getActiveSeason() {
    return winter;
  }
  async getSeasonBySlug(slug: string) {
    return slug === winter.slug ? winter : null;
  }
  async getSeasons() {
    return [winter];
  }
  async getGiftBoxTemplates() {
    return winter.curatedBoxes;
  }
}
const repository: ContentRepository = new LocalContentRepository();
export function getContentRepository(): ContentRepository {
  return repository;
}
