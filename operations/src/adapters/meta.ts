import { createHash } from "node:crypto";
import { requestJson } from "./http.js";
import {
  actionKeyValid,
  isRecord,
  nonempty,
  readiness,
  unavailable,
  type AdapterOptions,
  type Env,
  type ExternalResult,
} from "./types.js";

export const META_REFERENCES = [
  "https://raw.githubusercontent.com/facebook/facebook-python-business-sdk/main/facebook_business/adobjects/adaccount.py",
  "https://raw.githubusercontent.com/facebook/facebook-python-business-sdk/main/facebook_business/adobjects/campaign.py",
  "https://raw.githubusercontent.com/facebook/facebook-python-business-sdk/main/facebook_business/adobjects/adsinsights.py",
];
export type MetaConfig = {
  accessToken?: string;
  adAccountId?: string;
  graphVersion?: string;
};
export type MetaCampaign = {
  id: string;
  accountId: string;
  name: string;
  status: string;
  spendCapMinor: number | null;
};
export type MetaInsight = {
  accountId: string;
  campaignId: string;
  campaignName: string;
  currency: string;
  dateStart: string;
  dateStop: string;
  spend: number;
  impressions: number;
  clicks: number;
  attributedActions: { type: string; count: number }[];
};
export type PausedCampaignInput = {
  actionKey: string;
  name: string;
  spendCapMinor: number;
};
export function metaConfigFromEnv(env: Env = process.env): MetaConfig {
  return {
    accessToken: env.META_ACCESS_TOKEN,
    adAccountId: env.META_AD_ACCOUNT_ID,
    graphVersion: env.META_GRAPH_VERSION,
  };
}
const validId = (value: unknown): value is string =>
  typeof value === "string" && /^\d+$/.test(value);
const numeric = (value: unknown): number | null =>
  (typeof value === "number" ||
    (typeof value === "string" && /^\d+(\.\d+)?$/.test(value))) &&
  Number.isFinite(Number(value)) &&
  Number(value) >= 0
    ? Number(value)
    : null;
const campaignFields = "id,account_id,name,status,spend_cap";
function parseCampaign(value: unknown, accountId: string): MetaCampaign | null {
  if (
    !isRecord(value) ||
    !validId(value.id) ||
    value.account_id !== accountId ||
    !nonempty(value.name) ||
    !nonempty(value.status)
  )
    return null;
  const cap = value.spend_cap === undefined ? null : numeric(value.spend_cap);
  if (value.spend_cap !== undefined && cap === null) return null;
  return {
    id: value.id,
    accountId,
    name: value.name,
    status: value.status,
    spendCapMinor: cap,
  };
}
function dateOnly(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}

export function createMetaAdapter(
  config: MetaConfig,
  options: AdapterOptions = {},
) {
  const accountId = config.adAccountId?.replace(/^act_/, "") ?? "";
  const ready = () =>
    readiness(
      {
        META_ACCESS_TOKEN: config.accessToken,
        META_AD_ACCOUNT_ID: validId(accountId),
        META_GRAPH_VERSION: /^v\d+\.0$/.test(config.graphVersion ?? ""),
      },
      [
        "The executor must authorize every write from persisted evidence and budget reservations.",
        "Insights actions are Meta-attributed events, not verified paid Shopify orders.",
        "Campaign creation is PAUSED and creates no ad sets, ads, or creatives. Activation requires a separate controlled action.",
      ],
    );
  async function graph(
    path: string,
    params: Record<string, string> = {},
    body?: Record<string, unknown>,
  ): Promise<ExternalResult<unknown>> {
    const url = new URL(
      `https://graph.facebook.com/${config.graphVersion}/${path}`,
    );
    for (const [key, value] of Object.entries(params))
      url.searchParams.set(key, value);
    const result = await requestJson(
      url.toString(),
      {
        method: body ? "POST" : "GET",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
      options,
    );
    if (result.status !== "succeeded") return result;
    if (isRecord(result.data) && result.data.error)
      return {
        status: body ? "unknown" : "rejected",
        reason: "Meta returned an API error",
      };
    return result;
  }
  async function readAccount(): Promise<
    ExternalResult<{ id: string; currency: string; timezone: string }>
  > {
    if (!ready().ready) return unavailable(ready());
    const result = await graph(`act_${accountId}`, {
      fields: "id,account_id,currency,timezone_name",
    });
    if (result.status !== "succeeded")
      return { status: result.status, reason: result.reason };
    const row = result.data;
    if (
      !isRecord(row) ||
      row.account_id !== accountId ||
      row.id !== `act_${accountId}` ||
      !nonempty(row.currency) ||
      !nonempty(row.timezone_name)
    )
      return { status: "unknown", reason: "Invalid Meta ad account response" };
    return {
      status: "succeeded",
      externalId: row.id,
      data: { id: row.id, currency: row.currency, timezone: row.timezone_name },
    };
  }
  async function readCampaign(
    id: string,
  ): Promise<ExternalResult<MetaCampaign>> {
    if (!ready().ready) return unavailable(ready());
    if (!validId(id))
      return { status: "rejected", reason: "Invalid campaign ID" };
    const result = await graph(id, { fields: campaignFields });
    if (result.status !== "succeeded")
      return { status: result.status, reason: result.reason };
    const campaign = parseCampaign(result.data, accountId);
    return campaign && campaign.id === id
      ? { status: "succeeded", externalId: id, data: campaign }
      : {
          status: "unknown",
          reason: "Invalid campaign response or unexpected ad account",
        };
  }
  async function readEdge(
    path: string,
    params: Record<string, string>,
  ): Promise<ExternalResult<unknown[]>> {
    const rows: unknown[] = [];
    const cursors = new Set<string>();
    let after: string | undefined;
    for (let page = 0; page < 10; page++) {
      const result = await graph(path, {
        ...params,
        limit: "100",
        ...(after ? { after } : {}),
      });
      if (result.status !== "succeeded")
        return { status: result.status, reason: result.reason };
      if (!isRecord(result.data) || !Array.isArray(result.data.data))
        return {
          status: "unknown",
          reason: "Invalid Meta collection response",
        };
      rows.push(...result.data.data);
      const paging = result.data.paging;
      if (paging === undefined || (isRecord(paging) && !paging.next))
        return { status: "succeeded", data: rows };
      const next =
        isRecord(paging) && isRecord(paging.cursors)
          ? paging.cursors.after
          : undefined;
      if (!nonempty(next) || cursors.has(next))
        return { status: "unknown", reason: "Meta pagination did not advance" };
      // Never follow paging.next: it may contain a credential or an unexpected URL.
      cursors.add(next);
      after = next;
    }
    return {
      status: "unknown",
      reason: "Meta collection exceeded the bounded page limit",
    };
  }
  async function listCampaigns(): Promise<ExternalResult<MetaCampaign[]>> {
    if (!ready().ready) return unavailable(ready());
    const response = await readEdge(`act_${accountId}/campaigns`, {
      fields: campaignFields,
    });
    if (response.status !== "succeeded")
      return { status: response.status, reason: response.reason };
    const found = new Map<string, MetaCampaign>();
    for (const row of response.data!) {
      const campaign = parseCampaign(row, accountId);
      if (!campaign)
        return { status: "unknown", reason: "Invalid campaign collection row" };
      found.set(campaign.id, campaign);
    }
    return { status: "succeeded", data: [...found.values()] };
  }
  const externalName = (input: PausedCampaignInput) =>
    `${input.name} [noorly:${createHash("sha256").update(input.actionKey).digest("hex").slice(0, 20)}]`;
  async function findCampaign(
    input: PausedCampaignInput,
  ): Promise<ExternalResult<MetaCampaign | null>> {
    const response = await listCampaigns();
    if (response.status !== "succeeded")
      return { status: response.status, reason: response.reason };
    const matches = response.data!.filter(
      (campaign) => campaign.name === externalName(input),
    );
    if (matches.length > 1)
      return {
        status: "unknown",
        reason:
          "Multiple campaigns match the action; manual reconciliation required",
      };
    const campaign = matches[0];
    if (
      campaign &&
      (campaign.spendCapMinor !== input.spendCapMinor ||
        campaign.status !== "PAUSED")
    )
      return {
        status: "unknown",
        externalId: campaign.id,
        reason:
          "Existing campaign has a different budget or status; do not create another",
      };
    return {
      status: "succeeded",
      ...(campaign ? { externalId: campaign.id } : {}),
      data: campaign ?? null,
    };
  }
  return {
    readiness: ready,
    readAccount,
    readCampaign,
    listCampaigns,
    findCampaign,
    async readInsights(input: {
      since: string;
      until: string;
    }): Promise<ExternalResult<MetaInsight[]>> {
      if (!ready().ready) return unavailable(ready());
      if (
        !dateOnly(input.since) ||
        !dateOnly(input.until) ||
        input.since > input.until
      )
        return { status: "rejected", reason: "Invalid insights date range" };
      const response = await readEdge(`act_${accountId}/insights`, {
        fields:
          "account_id,account_currency,campaign_id,campaign_name,date_start,date_stop,spend,impressions,clicks,actions",
        level: "campaign",
        time_range: JSON.stringify(input),
        time_increment: "1",
      });
      if (response.status !== "succeeded")
        return { status: response.status, reason: response.reason };
      const rows = new Map<string, MetaInsight>();
      for (const row of response.data!) {
        if (
          !isRecord(row) ||
          row.account_id !== accountId ||
          !nonempty(row.account_currency) ||
          !validId(row.campaign_id) ||
          !nonempty(row.campaign_name) ||
          !nonempty(row.date_start) ||
          !nonempty(row.date_stop)
        )
          return { status: "unknown", reason: "Invalid Meta insights row" };
        const spend = numeric(row.spend),
          impressions = numeric(row.impressions),
          clicks = numeric(row.clicks);
        if (
          spend === null ||
          impressions === null ||
          clicks === null ||
          (row.actions !== undefined && !Array.isArray(row.actions))
        )
          return {
            status: "unknown",
            reason: "Invalid Meta insights measurement",
          };
        const attributedActions: MetaInsight["attributedActions"] = [];
        for (const action of Array.isArray(row.actions) ? row.actions : []) {
          if (
            !isRecord(action) ||
            !nonempty(action.action_type) ||
            numeric(action.value) === null
          )
            return {
              status: "unknown",
              reason: "Invalid Meta attributed action",
            };
          attributedActions.push({
            type: action.action_type,
            count: numeric(action.value)!,
          });
        }
        const parsed = {
          accountId,
          campaignId: row.campaign_id,
          campaignName: row.campaign_name,
          currency: row.account_currency,
          dateStart: row.date_start,
          dateStop: row.date_stop,
          spend,
          impressions,
          clicks,
          attributedActions,
        };
        const key = `${parsed.campaignId}/${parsed.dateStart}/${parsed.dateStop}`;
        if (
          rows.has(key) &&
          JSON.stringify(rows.get(key)) !== JSON.stringify(parsed)
        )
          return {
            status: "unknown",
            reason: "Conflicting duplicate Meta insight rows",
          };
        rows.set(key, parsed);
      }
      return { status: "succeeded", data: [...rows.values()] };
    },
    async createPausedCampaign(
      input: PausedCampaignInput,
    ): Promise<ExternalResult<MetaCampaign>> {
      if (!ready().ready) return unavailable(ready());
      if (
        !actionKeyValid(input.actionKey) ||
        !nonempty(input.name) ||
        input.name.length > 180 ||
        !Number.isSafeInteger(input.spendCapMinor) ||
        input.spendCapMinor <= 0
      )
        return { status: "rejected", reason: "Invalid campaign input" };
      const account = await readAccount();
      if (account.status !== "succeeded")
        return { status: account.status, reason: account.reason };
      if (account.data!.currency !== "SEK")
        return {
          status: "rejected",
          reason:
            "This budget integration requires an ad account billed in SEK",
        };
      const existing = await findCampaign(input);
      if (existing.status !== "succeeded")
        return {
          status: existing.status,
          externalId: existing.externalId,
          reason: existing.reason,
        };
      if (existing.data)
        return {
          status: "succeeded",
          externalId: existing.data.id,
          data: existing.data,
        };
      const result = await graph(
        `act_${accountId}/campaigns`,
        {},
        {
          name: externalName(input),
          objective: "OUTCOME_SALES",
          status: "PAUSED",
          special_ad_categories: [],
          spend_cap: input.spendCapMinor,
        },
      );
      if (result.status === "rejected")
        return { status: "rejected", reason: result.reason };
      if (
        result.status === "succeeded" &&
        isRecord(result.data) &&
        validId(result.data.id)
      ) {
        const confirmation = await readCampaign(result.data.id);
        if (
          confirmation.status === "succeeded" &&
          confirmation.data!.name === externalName(input) &&
          confirmation.data!.status === "PAUSED" &&
          confirmation.data!.spendCapMinor === input.spendCapMinor
        )
          return confirmation;
      }
      const recovered = await findCampaign(input);
      if (recovered.status === "succeeded" && recovered.data)
        return {
          status: "succeeded",
          externalId: recovered.data.id,
          data: recovered.data,
        };
      return {
        status: "unknown",
        reason:
          "Campaign creation outcome unresolved; retain reservation and reconcile before another submission",
      };
    },
    async setCampaignStatus(input: {
      actionKey: string;
      campaignId: string;
      status: "ACTIVE" | "PAUSED";
      expectedSpendCapMinor: number;
    }): Promise<ExternalResult<MetaCampaign>> {
      if (!ready().ready) return unavailable(ready());
      if (
        !actionKeyValid(input.actionKey) ||
        !validId(input.campaignId) ||
        !["ACTIVE", "PAUSED"].includes(input.status) ||
        !Number.isSafeInteger(input.expectedSpendCapMinor) ||
        input.expectedSpendCapMinor <= 0
      )
        return { status: "rejected", reason: "Invalid campaign status update" };
      const before = await readCampaign(input.campaignId);
      if (before.status !== "succeeded") return before;
      if (input.status === "ACTIVE") {
        if (before.data!.spendCapMinor !== input.expectedSpendCapMinor)
          return {
            status: "rejected",
            reason: "Campaign spend cap does not match the reserved budget",
          };
        const account = await readAccount();
        if (account.status !== "succeeded")
          return { status: account.status, reason: account.reason };
        if (account.data!.currency !== "SEK")
          return {
            status: "rejected",
            reason: "Ad account must use SEK for activation",
          };
      }
      if (before.data!.status === input.status) return before;
      const result = await graph(
        input.campaignId,
        {},
        { status: input.status },
      );
      if (result.status === "rejected")
        return { status: "rejected", reason: result.reason };
      const confirmed = await readCampaign(input.campaignId);
      if (
        confirmed.status === "succeeded" &&
        confirmed.data!.status === input.status
      )
        return confirmed;
      return {
        status: "unknown",
        externalId: input.campaignId,
        reason:
          "Campaign status update is unconfirmed; reconcile before retrying",
      };
    },
  };
}
