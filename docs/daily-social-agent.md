# Noorly daily Instagram and Facebook agent

The agent prepares one Swedish post per day and publishes it to the configured
Instagram professional account and Facebook Page. The scheduled run is at 09:17
in Europe Stockholm time, including daylight saving changes. GitHub may delay
scheduled runs, so this is a target time rather than a delivery guarantee.

This integration is ready for configuration and review. It is disabled until
credentials, account IDs and approved content have been supplied. The storefront
catalogue and artwork are described as fictional placeholders in the existing
README. They are deliberately not treated as approved social content.

## Daily flow

1. Load approved briefs, factual claims, image descriptions and media URLs from
   `social/briefs.json`.
2. Verify the configured model supports structured output. Acquire a durable
   Redis lease and load the journal for the current Stockholm date.
3. If there is no saved plan, use the last thirty completed posts to select a
   topic and draft distinct Swedish captions for Instagram and Facebook.
4. Validate the selected brief and captions. A second model call reviews factual
   accuracy and tone. The agent can revise twice, then stops if review fails.
5. Save the approved plan. Create and poll the Instagram image container, record
   publishing intent, publish, and save the returned ID. Independently publish
   the Facebook photo with a shop link and campaign tracking parameters.
6. Save completion history. Workflow logs and the Actions run summary show the
   channel results. Failures make the run fail, using the repository owner's
   GitHub Actions notification settings.

The agent chooses copy and topics within supplied briefs. Account IDs, URLs and
media remain controlled by configuration. It never creates ads or sets budgets.
Both posts use an approved photograph. This version publishes image feed posts;
it does not generate images, publish Reels or Stories, or handle comments.

## Configure the integration

Add these repository Actions secrets under Settings then Secrets and variables
then Actions. Use private secret fields rather than chat messages or source code.

| Secret                      | Purpose                                                                         |
| --------------------------- | ------------------------------------------------------------------------------- |
| `AI_GATEWAY_API_KEY`        | Vercel AI Gateway authentication for the external Actions runner                |
| `META_PAGE_ACCESS_TOKEN`    | A Page token authorized for organic publishing and its linked Instagram account |
| `RATE_LIMIT_PROVIDER_URL`   | HTTPS Redis REST endpoint using the same command contract as the storefront     |
| `RATE_LIMIT_PROVIDER_TOKEN` | Redis REST authentication with GET SET EVAL and DEL access                      |

The existing storefront Redis service can be reused if available. Configure the
same durable primary in every runner. GitHub Actions does not inherit the
storefront's Vercel environment variables. Retain Redis data and backups; clearing
the journal can permit duplicate posts. Do not configure eviction or short TTLs
for journal keys.

Add these Actions variables.

| Variable                    | Value                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `NOORLY_SOCIAL_ENABLED`     | Leave unset until the activation steps below pass; set to `true` to enable publishing                         |
| `NOORLY_SOCIAL_MODEL`       | An exact structured output model ID from the live AI Gateway model list                                       |
| `META_GRAPH_VERSION`        | The supported Graph API version selected for your Meta application, such as `v26.0`                           |
| `META_PAGE_ID`              | `106073768227048` is the Noorly Page discovered during integration; verify it is the intended publishing Page |
| `META_INSTAGRAM_ACCOUNT_ID` | The professional account ID linked to that Page, verified through the Meta API                                |

Use the Instagram API with Facebook Login flow for this adapter. Complete the
appropriate Meta application setup and account authorization. Typical permissions
include `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`,
`instagram_basic` and `instagram_content_publish`; required access level and app
review depend on the app's users and business setup. Ads connector access alone
does not establish organic publishing permission. The agent checks the Page to
Instagram relationship before any publish attempt. It does not create or expand
application permissions. Review token expiry and renew credentials through your
normal private credential management process.

## Approve real content

Replace the unapproved example in `social/briefs.json` with real briefs. Add
several topics for rotation. Each needs a unique ID, specific topic, verified
facts, accurate image description, HTTPS image URL and shop path. Set
`approved: true` only after reviewing these fields together.

All images and shop links must use `siteOrigin`. Update that origin when the
canonical production domain is ready. Images must be public JPEGs under 8 MiB,
320 to 1440 pixels wide, with an aspect ratio between 0.8 and 1.91. A square
1080 pixel photograph works well. The adapter checks the response type, JPEG
header and dimensions and rejects redirects. The image must remain accessible
to Meta without a session or expiring credentials. Use media you have permission
to publish. No sample image is approved by this change.

Do not add expiring promotions or stock promises to evergreen briefs. Update
or remove a brief when its facts change. Editing an already saved day's brief
stops its retries so changed content can be reviewed.

## Activate and verify

1. Merge the integration so the workflow exists on the default branch. Configure
   approved briefs, variables and secrets. Keep `NOORLY_SOCIAL_ENABLED` unset.
2. In Actions open Noorly daily social posts and run it with mode `dry-run`.
   This verifies images and generates reviewed captions without Meta writes or
   Redis writes. It uses model credits, and proposed captions appear in the run
   log and summary. Inspect both captions and the chosen photo. Dry runs do not
   reserve the day or approve a fixed draft; the publish run generates its own
   plan with the same validation and model review rules.
3. Confirm the intended accounts and token permissions. Set
   `NOORLY_SOCIAL_ENABLED=true`, then manually run mode `publish` for the first
   controlled live test. This immediately publishes today's posts.
4. Verify both visible posts in the intended accounts. Rerun mode `publish` on
   the same day and verify that the saved journal prevents a second post on
   either channel. Scheduled runs then follow the same journal.
5. Enable GitHub Actions failure notifications and check the next scheduled run.
   Public repositories can have schedules disabled after inactivity. Monitor
   schedule health; this workflow is not a real-time delivery SLA.

Unset `NOORLY_SOCIAL_ENABLED` to stop future publishing. It does not interrupt a
run that has already started; cancel that Actions run separately if needed.
Stopping the workflow does not remove existing posts.

## Recover a failed run

Run mode `publish` again on the same date after correcting a preflight, model,
image or container preparation error. The agent reuses the saved plan and skips
completed channels. The Redis lease expires after twenty minutes if a process
dies; Actions has a twelve minute job timeout. An active lease blocks another
runner, and every journal write checks lease ownership atomically.

State keys use `noorly:social:PAGE_ID:INSTAGRAM_ID:day:YYYY-MM-DD`. The history
and lock use the same namespace with `history` and `lock` suffixes. Records have
separate `instagram` and `facebook` states, including the Instagram container ID,
published IDs and timestamps. Store errors stop publishing rather than falling
back to an ephemeral local file.

If a channel is `publishing` or `unknown`, automatic replay is blocked. Inspect
the actual feed and the saved caption/container before changing anything. A
successful Meta publish followed by a lost response cannot be safely retried
blindly. With the workflow paused and no active lease, an operator can reconcile
the affected record in the Redis console: set `status` to `published` and add
the verified `id` if the post exists. Only reset to `pending` after confirming
that no post was published. Preserve the other channel, brief and draft. Do not
delete the whole record to retry. Then resume and rerun to complete the day.

There is no automatic backfill of missed prior dates and no exactly-once
guarantee across Meta and Redis. The design favors avoiding duplicates when
external delivery is uncertain. A partially completed day is not appended to
history until both channels are reconciled or published.

## Validation and references

Run `pnpm test:social` or `node --test social/agent.check.mjs` with Node 24 or later. Tests cover
Stockholm dates, content approval, bounded revision, duplicate detection, durable
intent writes, concurrent runs, partial completion, lost publish responses,
media checks, account relationship checks and Redis lease ownership. They use
fake network responses and do not publish to real accounts.

The integration uses only Node built-in modules and does not change the
storefront dependency lockfile or browser code. A live model request and actual
Meta publishing must be verified during activation; local tests do not establish
provider access or delivery.

- [Meta Instagram API collection](https://www.postman.com/meta/instagram/overview)
- [Meta Instagram content publishing](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/content-publishing/)
- [Meta Page photo publishing](https://developers.facebook.com/docs/graph-api/reference/page/photos/)
- [AI Gateway structured outputs](https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions/structured-outputs)
- [Live model catalogue](https://ai-gateway.vercel.sh/v1/models)
- [GitHub workflow schedules](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
