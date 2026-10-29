import { requestJson } from "./http.js";
import {
  isRecord,
  nonempty,
  readiness,
  unavailable,
  type AdapterOptions,
  type Env,
  type ExternalResult,
} from "./types.js";

export const DATAFORSEO_REFERENCES = [
  "https://docs.dataforseo.com/v3/keywords_data-google_ads-search_volume-live/",
  "https://dataforseo.com/pricing/keywords-data/google-ads",
];
export type DataForSeoConfig = { login?: string; password?: string };
export type SwedenKeywordMetric = {
  keyword: string;
  country: "SE";
  language: "sv";
  estimatedMonthlySearches: number | null;
  monthlySearches: { year: number; month: number; searches: number | null }[];
  source: "DataForSEO Google Ads";
  fetchedAt: string;
};
export function dataForSeoConfigFromEnv(
  env: Env = process.env,
): DataForSeoConfig {
  return { login: env.DATAFORSEO_LOGIN, password: env.DATAFORSEO_PASSWORD };
}

export function createDataForSeoAdapter(
  config: DataForSeoConfig,
  options: AdapterOptions = {},
) {
  const ready = () =>
    readiness(
      { DATAFORSEO_LOGIN: config.login, DATAFORSEO_PASSWORD: config.password },
      [
        "Search volume is estimated and may group close variants; it is not verified product sales.",
      ],
    );
  return {
    readiness: ready,
    async searchSweden(
      keywords: string[],
    ): Promise<ExternalResult<SwedenKeywordMetric[]>> {
      if (!ready().ready) return unavailable(ready());
      if (
        keywords.length < 1 ||
        keywords.length > 1000 ||
        keywords.some((k) => !nonempty(k) || k.length > 80)
      )
        return {
          status: "rejected",
          reason: "Supply 1–1000 nonempty keywords, each at most 80 characters",
        };
      const result = await requestJson(
        "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live",
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${config.login}:${config.password}`).toString("base64")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            {
              keywords: [...new Set(keywords)],
              location_name: "Sweden",
              language_name: "Swedish",
              search_partners: false,
            },
          ]),
        },
        options,
      );
      if (result.status !== "succeeded")
        return { status: result.status, reason: result.reason };
      if (
        !isRecord(result.data) ||
        result.data.status_code !== 20000 ||
        !Array.isArray(result.data.tasks) ||
        result.data.tasks.length !== 1
      )
        return {
          status: "rejected",
          reason:
            "Keyword provider rejected the task or returned an invalid envelope",
        };
      const task = result.data.tasks[0];
      if (
        !isRecord(task) ||
        task.status_code !== 20000 ||
        !Array.isArray(task.result)
      )
        return {
          status: "rejected",
          reason: "Keyword task did not complete successfully",
        };
      const metrics: SwedenKeywordMetric[] = [];
      for (const row of task.result) {
        if (
          !isRecord(row) ||
          !nonempty(row.keyword) ||
          row.location_code !== 2752 ||
          row.language_code !== "sv" ||
          !(
            row.search_volume === null ||
            (typeof row.search_volume === "number" && row.search_volume >= 0)
          ) ||
          !(
            row.monthly_searches === null || Array.isArray(row.monthly_searches)
          )
        )
          return {
            status: "unknown",
            reason: "Keyword response failed Sweden/language/metric validation",
          };
        const monthly: SwedenKeywordMetric["monthlySearches"] = [];
        for (const point of row.monthly_searches ?? []) {
          if (
            !isRecord(point) ||
            !Number.isInteger(point.year) ||
            !Number.isInteger(point.month) ||
            Number(point.month) < 1 ||
            Number(point.month) > 12 ||
            !(
              point.search_volume === null ||
              (typeof point.search_volume === "number" &&
                point.search_volume >= 0)
            )
          )
            return {
              status: "unknown",
              reason: "Invalid monthly search history",
            };
          monthly.push({
            year: Number(point.year),
            month: Number(point.month),
            searches: point.search_volume as number | null,
          });
        }
        metrics.push({
          keyword: row.keyword,
          country: "SE",
          language: "sv",
          estimatedMonthlySearches: row.search_volume as number | null,
          monthlySearches: monthly,
          source: "DataForSEO Google Ads",
          fetchedAt: new Date((options.now ?? Date.now)()).toISOString(),
        });
      }
      return {
        status: "succeeded",
        ...(nonempty(task.id) ? { externalId: task.id } : {}),
        data: metrics,
      };
    },
  };
}
