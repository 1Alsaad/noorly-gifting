import { requestGraphql } from "./http.js";
import {
  actionKeyValid,
  isRecord,
  isString,
  nonempty,
  readiness,
  unavailable,
  validHttpsUrl,
  type AdapterOptions,
  type Env,
  type ExternalResult,
} from "./types.js";

export const BUFFER_REFERENCES = [
  "https://developers.buffer.com/reference.html",
  "https://developers.buffer.com/guides/posts-and-scheduling.html",
  "https://support.buffer.com/articles/using-tiktok-with-buffer-oGEroY9Of2",
];
export type BufferConfig = {
  apiKey?: string;
  organizationId?: string;
  channelId?: string;
  photoAutopublishVerified?: boolean;
  maxQueuedPosts?: number;
};
export type BufferPhotoPost = {
  actionKey: string;
  text: string;
  title?: string;
  dueAt: string;
  imageUrls: string[];
  aiGenerated: boolean;
};
export type BufferPost = {
  id: string;
  channelId: string;
  text: string;
  dueAt: string | null;
  status: string;
  imageUrls: string[];
  schedulingType: string;
};
const postFields =
  "id channelId text dueAt status schedulingType assets { source }";
const POSTS = `query OpsBufferPosts($input: PostsInput!, $after: String) { posts(first: 100, after: $after, input: $input) { edges { node { ${postFields} } } pageInfo { hasNextPage endCursor } } }`;
const CREATE = `mutation OpsBufferSchedule($input: CreatePostInput!) { createPost(input: $input) { __typename ... on PostActionSuccess { post { ${postFields} } } ... on MutationError { message } } }`;
const CHANNEL =
  "query OpsBufferChannel($input: ChannelInput!) { channel(input: $input) { id service isDisconnected isLocked isQueuePaused } }";

export function bufferConfigFromEnv(env: Env = process.env): BufferConfig {
  return {
    apiKey: env.BUFFER_API_KEY,
    organizationId: env.BUFFER_ORGANIZATION_ID,
    channelId: env.BUFFER_TIKTOK_CHANNEL_ID,
    photoAutopublishVerified: env.BUFFER_TIKTOK_PHOTOS_VERIFIED === "true",
    maxQueuedPosts: 10,
  };
}
function parsePost(value: unknown): BufferPost | null {
  if (
    !isRecord(value) ||
    !nonempty(value.id) ||
    !nonempty(value.channelId) ||
    !isString(value.text) ||
    !(value.dueAt === null || isString(value.dueAt)) ||
    !nonempty(value.status) ||
    !nonempty(value.schedulingType) ||
    !Array.isArray(value.assets)
  )
    return null;
  const urls: string[] = [];
  for (const asset of value.assets) {
    if (!isRecord(asset) || !nonempty(asset.source)) return null;
    urls.push(asset.source);
  }
  return {
    id: value.id,
    channelId: value.channelId,
    text: value.text,
    dueAt: value.dueAt,
    status: value.status,
    imageUrls: urls,
    schedulingType: value.schedulingType,
  };
}

export function createBufferAdapter(
  config: BufferConfig,
  options: AdapterOptions = {},
) {
  const ready = () =>
    readiness(
      {
        BUFFER_API_KEY: config.apiKey,
        BUFFER_ORGANIZATION_ID: config.organizationId,
        BUFFER_TIKTOK_CHANNEL_ID: config.channelId,
      },
      [
        "Caller must serialize writes per channel and persist action fingerprints; Buffer createPost has no documented idempotency key.",
        "TikTok photo automatic publishing must be verified for the connected channel before writes are enabled.",
        "Native AI photo disclosure through this API is unverified; generated-photo writes are rejected.",
      ],
    );
  const gql = (
    query: string,
    variables: Record<string, unknown>,
    write = false,
  ) =>
    requestGraphql(
      "https://api.buffer.com",
      { Authorization: `Bearer ${config.apiKey}` },
      query,
      variables,
      options,
      write,
    );
  async function readPosts(
    statuses?: string[],
  ): Promise<ExternalResult<BufferPost[]>> {
    if (!ready().ready) return unavailable(ready());
    const collected = new Map<string, BufferPost>();
    let after: string | undefined;
    const cursors = new Set<string>();
    for (let page = 0; page < 10; page++) {
      const result = await gql(POSTS, {
        input: {
          organizationId: config.organizationId,
          filter: {
            channelIds: [config.channelId],
            ...(statuses ? { status: statuses } : {}),
          },
        },
        after,
      });
      if (result.status !== "succeeded")
        return { status: result.status, reason: result.reason };
      const connection = result.data?.posts;
      if (
        !isRecord(connection) ||
        !Array.isArray(connection.edges) ||
        !isRecord(connection.pageInfo) ||
        typeof connection.pageInfo.hasNextPage !== "boolean"
      )
        return { status: "unknown", reason: "Invalid Buffer post connection" };
      for (const edge of connection.edges) {
        const post = isRecord(edge) ? parsePost(edge.node) : null;
        if (!post || post.channelId !== config.channelId)
          return {
            status: "unknown",
            reason: "Buffer returned invalid or unexpected channel data",
          };
        collected.set(post.id, post);
      }
      if (!connection.pageInfo.hasNextPage)
        return { status: "succeeded", data: [...collected.values()] };
      const cursor = connection.pageInfo.endCursor;
      if (!nonempty(cursor) || cursors.has(cursor))
        return {
          status: "unknown",
          reason: "Buffer pagination did not advance",
        };
      cursors.add(cursor);
      after = cursor;
    }
    return {
      status: "unknown",
      reason:
        "Buffer read exceeded the bounded page limit; incomplete data cannot authorize a write",
    };
  }
  async function findScheduledPost(
    input: BufferPhotoPost,
  ): Promise<ExternalResult<BufferPost | null>> {
    const response = await readPosts();
    if (response.status !== "succeeded")
      return { status: response.status, reason: response.reason };
    const matches = response.data!.filter(
      (post) =>
        post.text === input.text &&
        post.dueAt !== null &&
        Date.parse(post.dueAt) === Date.parse(input.dueAt) &&
        JSON.stringify(post.imageUrls) === JSON.stringify(input.imageUrls),
    );
    if (matches.length > 1)
      return {
        status: "unknown",
        reason:
          "Multiple external posts match the action fingerprint; human reconciliation required",
      };
    const match = matches[0];
    if (match && !["scheduled", "sending", "sent"].includes(match.status))
      return {
        status: "rejected",
        externalId: match.id,
        reason: `Matching Buffer post has status ${match.status}; do not duplicate it`,
      };
    if (match && match.schedulingType !== "automatic")
      return {
        status: "rejected",
        externalId: match.id,
        reason: "Matching Buffer post needs manual notification publishing",
      };
    return {
      status: "succeeded",
      ...(match ? { externalId: match.id } : {}),
      data: match ?? null,
    };
  }
  async function readChannel(): Promise<
    ExternalResult<{
      id: string;
      service: string;
      connected: boolean;
      queuePaused: boolean;
    }>
  > {
    if (!ready().ready) return unavailable(ready());
    const result = await gql(CHANNEL, { input: { id: config.channelId } });
    if (result.status !== "succeeded")
      return { status: result.status, reason: result.reason };
    const channel = result.data?.channel;
    if (
      !isRecord(channel) ||
      channel.id !== config.channelId ||
      !nonempty(channel.service) ||
      typeof channel.isDisconnected !== "boolean" ||
      typeof channel.isLocked !== "boolean" ||
      typeof channel.isQueuePaused !== "boolean"
    )
      return { status: "unknown", reason: "Invalid Buffer channel response" };
    return {
      status: "succeeded",
      data: {
        id: channel.id as string,
        service: channel.service,
        connected: !channel.isDisconnected && !channel.isLocked,
        queuePaused: channel.isQueuePaused,
      },
    };
  }
  return {
    readiness: ready,
    readPosts,
    readQueue: () => readPosts(["scheduled", "sending"]),
    findScheduledPost,
    readChannel,
    async schedulePhotoPost(
      input: BufferPhotoPost,
    ): Promise<ExternalResult<BufferPost>> {
      if (!ready().ready) return unavailable(ready());
      if (!config.photoAutopublishVerified)
        return {
          status: "rejected",
          reason:
            "BUFFER_TIKTOK_PHOTOS_VERIFIED must follow a verified channel capability check",
        };
      if (input.aiGenerated)
        return {
          status: "rejected",
          reason:
            "Native AI-generated photo disclosure is not verified through Buffer; use an approved disclosure-capable route",
        };
      if (
        !actionKeyValid(input.actionKey) ||
        !nonempty(input.text) ||
        input.text.length > 4000 ||
        (input.title?.length ?? 0) > 90 ||
        !Number.isFinite(Date.parse(input.dueAt)) ||
        input.imageUrls.length < 1 ||
        input.imageUrls.length > 10 ||
        !input.imageUrls.every(validHttpsUrl)
      )
        return {
          status: "rejected",
          reason: "Invalid TikTok photo post input",
        };
      const existing = await findScheduledPost(input);
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
          reason: "Existing matching post recovered; no new write",
        };
      if (Date.parse(input.dueAt) <= (options.now ?? Date.now)())
        return {
          status: "rejected",
          reason: "Scheduled date must be in the future",
        };
      const channel = await readChannel();
      if (channel.status !== "succeeded")
        return { status: channel.status, reason: channel.reason };
      if (
        !channel.data!.connected ||
        channel.data!.queuePaused ||
        channel.data!.service !== "tiktok"
      )
        return {
          status: "rejected",
          reason: "TikTok channel is disconnected, locked, or paused",
        };
      const queue = await readPosts(["scheduled", "sending"]);
      if (queue.status !== "succeeded")
        return { status: queue.status, reason: queue.reason };
      if (queue.data!.length >= (config.maxQueuedPosts ?? 10))
        return { status: "rejected", reason: "Buffer queue capacity reached" };
      const result = await gql(
        CREATE,
        {
          input: {
            channelId: config.channelId,
            text: input.text,
            assets: input.imageUrls.map((url) => ({ image: { url } })),
            metadata: { tiktok: { title: input.title } },
            schedulingType: "automatic",
            mode: "customScheduled",
            dueAt: new Date(input.dueAt).toISOString(),
            needsApproval: false,
            source: `noorly-operations/${input.actionKey}`,
          },
        },
        true,
      );
      if (result.status === "succeeded") {
        const payload = result.data?.createPost;
        if (isRecord(payload) && payload.__typename === "PostActionSuccess") {
          const post = parsePost(payload.post);
          if (
            post &&
            post.channelId === config.channelId &&
            post.text === input.text &&
            post.dueAt !== null &&
            Date.parse(post.dueAt) === Date.parse(input.dueAt) &&
            JSON.stringify(post.imageUrls) ===
              JSON.stringify(input.imageUrls) &&
            post.schedulingType === "automatic" &&
            ["scheduled", "sending", "sent"].includes(post.status)
          )
            return { status: "succeeded", externalId: post.id, data: post };
        }
        if (isRecord(payload) && payload.__typename === "MutationError")
          return {
            status: "rejected",
            reason: "Buffer rejected the scheduled post",
          };
      } else if (result.status === "rejected")
        return { status: result.status, reason: result.reason };
      // A single read-only lookup can recover a lost acknowledgement. Never resubmit here.
      const recovered = await findScheduledPost(input);
      if (recovered.status === "succeeded" && recovered.data)
        return {
          status: "succeeded",
          externalId: recovered.data.id,
          data: recovered.data,
          reason:
            "Confirmed by read-only reconciliation after ambiguous submission",
        };
      return {
        status: "unknown",
        reason:
          "Buffer submission outcome unresolved; retain action reservation and reconcile before any retry",
      };
    },
  };
}
