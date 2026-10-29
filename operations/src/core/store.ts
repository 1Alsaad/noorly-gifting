import { randomUUID } from "node:crypto";
import {
  BASE_READINESS,
  budgetUsage,
  decideAction,
  LIMITS,
  liveReadiness,
  money,
  PolicyError,
  profitQualified,
  stockholmMonth,
} from "./policy.js";
import type {
  Action,
  AuditRecord,
  Control,
  Decision,
  Job,
  JobRequest,
  Mode,
  OpsSnapshot,
  OpsState,
  OpsStore,
  PaidOrderObligation,
  ProductEvidence,
  ReadinessCheck,
  Reservation,
  SpendRequest,
  StoreOptions,
  VerifiedOrder,
} from "./types.js";

export function initialState(now: Date): OpsState {
  return {
    version: 1,
    control: {
      mode: "observe",
      observationStartedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      readiness: {},
    },
    reservations: {},
    prepaidBalances: {},
    orders: {},
    obligations: {},
    products: {},
    jobs: {},
    supplierRecoveries: {},
  };
}
function requireText(value: string, name: string): void {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > 2048 ||
    ["__proto__", "prototype", "constructor"].includes(value)
  )
    throw new PolicyError(
      "INVALID_INPUT",
      `${name} is required and must be a safe identifier/text of at most 2048 characters`,
    );
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
function leaseDuration(ms: number): void {
  if (!Number.isInteger(ms) || ms < 1000 || ms > 900_000)
    throw new PolicyError(
      "INVALID_LEASE",
      "Lease duration must be 1 second to 15 minutes",
    );
}
type Tx = <T>(
  operation: (
    state: OpsState,
    audit: (
      event: string,
      data: Record<string, unknown>,
      actor?: string,
    ) => void,
    now: Date,
  ) => T,
) => Promise<T>;

/** All policy mutations pass through one atomic storage transaction. */
export abstract class StateOpsStore implements OpsStore {
  protected readonly clock: () => Date;
  constructor(options: StoreOptions = {}) {
    this.clock = options.clock ?? (() => new Date());
  }
  abstract initialize(): Promise<void>;
  protected abstract transact: Tx;
  abstract readAudit(limit?: number): Promise<AuditRecord[]>;
  async snapshot(): Promise<OpsSnapshot> {
    return this.transact((state, _audit, now) => ({
      ...structuredClone(state),
      month: stockholmMonth(now),
      budgets: {
        software: {
          limitOre: LIMITS.softwareMonthlyOre,
          usedOre: budgetUsage(state, "software", now),
        },
        ads: {
          limitOre: profitQualified(state, now)
            ? LIMITS.adsMaximumMonthlyOre
            : LIMITS.adsInitialMonthlyOre,
          usedOre: budgetUsage(state, "ads", now),
          profitQualified: profitQualified(state, now),
        },
        supplier: {
          limitOre: LIMITS.supplierFloatOre,
          usedOre: budgetUsage(state, "supplier", now),
        },
      },
    }));
  }
  async getControl(): Promise<Control> {
    return this.transact((state) => structuredClone(state.control));
  }
  async recordHeartbeat(): Promise<Control> {
    return this.transact((state, audit, now) => {
      const age =
        now.getTime() - Date.parse(state.control.lastHeartbeatAt ?? "");
      if (
        !Number.isFinite(age) ||
        age < 0 ||
        age > LIMITS.heartbeatGapMs ||
        state.control.mode === "paused"
      ) {
        state.control.observationStartedAt = now.toISOString();
        if (state.control.mode === "live") state.control.mode = "observe";
        audit(
          "observation.restarted",
          {
            reason:
              state.control.mode === "paused" ? "paused" : "heartbeat_gap",
          },
          "trusted_scheduler",
        );
      }
      state.control.lastHeartbeatAt = now.toISOString();
      state.control.updatedAt = now.toISOString();
      return structuredClone(state.control);
    });
  }
  async setMode(mode: Mode, actor: string): Promise<Control> {
    requireText(actor, "actor");
    if (!["observe", "live", "paused"].includes(mode))
      throw new PolicyError("INVALID_MODE", "Unknown operation mode");
    return this.transact((state, audit, now) => {
      if (mode === "live" && state.control.mode === "paused")
        throw new PolicyError(
          "NOT_READY",
          "Resume observation after pausing before enabling live operations",
        );
      if (mode === "live") {
        const reasons = liveReadiness(state, now);
        if (reasons.length)
          throw new PolicyError("NOT_READY", reasons.join(" "));
      }
      if (mode === "paused" || state.control.mode === "paused") {
        state.control.observationStartedAt = now.toISOString();
        delete state.control.lastHeartbeatAt;
      }
      state.control.mode = mode;
      state.control.updatedAt = now.toISOString();
      audit("control.mode_changed", { mode }, actor);
      return structuredClone(state.control);
    });
  }
  async recordReadiness(
    check: ReadinessCheck,
    outcome: "pass" | "fail",
    evidenceRef: string,
  ): Promise<void> {
    const checks: ReadinessCheck[] = [
      "connectors",
      "budget_reconciliation",
      "webhook_deduplication",
      "recovery",
      "social",
      "supplier",
      "checkout",
      "tracking_consent",
    ];
    if (!checks.includes(check) || !["pass", "fail"].includes(outcome))
      throw new PolicyError("INVALID_READINESS", "Unknown readiness result");
    requireText(evidenceRef, "evidenceRef");
    await this.transact((state, audit, now) => {
      const previous = state.control.readiness[check];
      // Re-importing the same proof is idempotent; it must not restart a healthy run.
      if (previous?.outcome === outcome && previous.evidenceRef === evidenceRef)
        return;
      state.control.readiness[check] = {
        outcome,
        evidenceRef,
        // This is the start of continuous qualification, not the latest receipt time.
        // The audit records when a newer successful proof was received.
        checkedAt:
          previous?.outcome === "pass" && outcome === "pass"
            ? previous.checkedAt
            : now.toISOString(),
      };
      const qualificationChanged = previous
        ? previous.outcome !== outcome
        : outcome === "pass";
      if (
        (BASE_READINESS as readonly ReadinessCheck[]).includes(check) &&
        qualificationChanged
      ) {
        state.control.observationStartedAt = now.toISOString();
        state.control.updatedAt = now.toISOString();
        delete state.control.lastHeartbeatAt;
        if (state.control.mode === "live") state.control.mode = "observe";
        audit(
          "observation.restarted",
          { reason: "baseline_readiness_changed", check },
          "trusted_verifier",
        );
      }
      audit(
        "readiness.recorded",
        { check, outcome, evidenceRef },
        "trusted_verifier",
      );
    });
  }
  async authorizeAction(
    action: Action,
    context: { productId?: string; orderId?: string } = {},
  ): Promise<Decision> {
    return this.transact((state, audit, now) => {
      const decision = decideAction(
        state,
        action,
        now,
        context.productId,
        context.orderId,
      );
      audit(
        "action.checked",
        {
          action,
          productId: context.productId ?? null,
          orderId: context.orderId ?? null,
          ...decision,
        },
        "policy",
      );
      return decision;
    });
  }
  async recordPaidOrder(order: PaidOrderObligation): Promise<void> {
    for (const key of ["orderId", "productId", "sourceRef"] as const)
      requireText(order[key], key);
    if (order.holdReason) requireText(order.holdReason, "holdReason");
    else
      for (const key of ["supplierProductId", "supplierVariantId"] as const)
        requireText(order[key], key);
    if (order.lines) {
      const lineIds = new Set<string>();
      for (const line of order.lines) {
        for (const key of ["lineItemId", "productId", "variantId"] as const)
          requireText(line[key], key);
        if (!order.holdReason)
          for (const key of ["supplierProductId", "supplierVariantId"] as const)
            requireText(line[key], key);
        if (
          !Number.isSafeInteger(line.quantity) ||
          line.quantity < 1 ||
          lineIds.has(line.lineItemId)
        )
          throw new PolicyError(
            "INVALID_ORDER_LINES",
            "Order line quantities and IDs must be valid and unique",
          );
        lineIds.add(line.lineItemId);
      }
    }
    money(order.amountPaidOre);
    money(order.refundedOre);
    if (order.source !== "shopify_paid_order")
      throw new PolicyError(
        "MISSING_PROVENANCE",
        "Trusted paid Shopify order required",
      );
    for (const key of [
      "paidAt",
      "importedAt",
      "sourceUpdatedAt",
      "cancelledAt",
      "fulfilledAt",
    ] as const)
      if (order[key] !== undefined && !Number.isFinite(Date.parse(order[key]!)))
        throw new PolicyError("INVALID_DATE", `Invalid ${key}`);
    await this.transact((state, audit) => {
      const previous = state.obligations[order.orderId];
      if (
        previous &&
        Date.parse(order.sourceUpdatedAt ?? order.importedAt) <
          Date.parse(previous.sourceUpdatedAt ?? previous.importedAt)
      ) {
        audit(
          "order.stale_import_ignored",
          { orderId: order.orderId },
          "trusted_shopify_connector",
        );
        return;
      }
      state.obligations[order.orderId] = structuredClone({
        ...order,
        ...(previous?.fulfilledAt ? { fulfilledAt: previous.fulfilledAt } : {}),
        ...(previous?.cancelledAt ? { cancelledAt: previous.cancelledAt } : {}),
      });
      audit(
        "order.obligation_imported",
        {
          orderId: order.orderId,
          productId: order.productId,
          sourceRef: order.sourceRef,
          held: Boolean(order.holdReason),
        },
        "trusted_shopify_connector",
      );
    });
  }
  async recordEvidence(evidence: ProductEvidence): Promise<void> {
    requireText(evidence.id, "product id");
    requireText(evidence.provenance.actor, "evidence actor");
    if (!evidence.provenance.evidenceRefs.length)
      throw new PolicyError(
        "MISSING_PROVENANCE",
        "Evidence references are required",
      );
    await this.transact((state, audit) => {
      state.products[evidence.id] = structuredClone(evidence);
      audit(
        "product.evidence_recorded",
        { productId: evidence.id, refs: evidence.provenance.evidenceRefs },
        evidence.provenance.actor,
      );
    });
  }
  async reserveSpend(request: SpendRequest): Promise<Reservation> {
    requireText(request.idempotencyKey, "idempotencyKey");
    requireText(request.purpose, "purpose");
    money(request.amountOre);
    if (
      !["software", "ads", "supplier"].includes(request.category) ||
      request.amountOre === 0
    )
      throw new PolicyError(
        "INVALID_SPEND",
        "Positive amount and known category required",
      );
    const normalized: SpendRequest = {
      ...request,
      funding: request.funding ?? "cash",
      kind: request.kind ?? "usage",
    };
    if (
      !["cash", "prepaid"].includes(normalized.funding!) ||
      !["usage", "prepaid_topup"].includes(normalized.kind!)
    )
      throw new PolicyError("INVALID_SPEND", "Invalid funding or kind");
    if (
      (normalized.funding === "prepaid" ||
        normalized.kind === "prepaid_topup") &&
      (normalized.category !== "software" || !normalized.prepaidAccount)
    )
      throw new PolicyError(
        "INVALID_PREPAID",
        "Prepaid accounts are supported only for software and require an account",
      );
    if (normalized.kind === "prepaid_topup" && normalized.funding !== "cash")
      throw new PolicyError(
        "INVALID_PREPAID",
        "Prepaid topups require cash funding",
      );
    if (normalized.prepaidAccount)
      requireText(normalized.prepaidAccount, "prepaidAccount");
    return this.transact((state, audit, now) => {
      const previous = Object.values(state.reservations).find(
        (r) => r.idempotencyKey === normalized.idempotencyKey,
      );
      if (previous) {
        const {
          id: _id,
          status: _status,
          createdAt: _created,
          actualOre: _actual,
          settledAt: _settled,
          receiptId: _receipt,
          releaseReason: _reason,
          ...original
        } = previous;
        if (canonical(original) !== canonical(normalized))
          throw new PolicyError(
            "IDEMPOTENCY_CONFLICT",
            "Spend key was already used for a different request",
          );
        return structuredClone(previous);
      }
      const action =
        normalized.category === "ads"
          ? "activate_ads"
          : normalized.category === "supplier"
            ? "fulfill_order"
            : "research";
      const decision = decideAction(
        state,
        action,
        now,
        normalized.productId,
        normalized.orderId,
      );
      if (!decision.allowed)
        throw new PolicyError("ACTION_DENIED", decision.reasons.join(" "));
      if (normalized.funding === "prepaid") {
        const account = normalized.prepaidAccount!;
        const pending = Object.values(state.reservations)
          .filter(
            (r) =>
              r.status === "reserved" &&
              r.funding === "prepaid" &&
              r.prepaidAccount === account,
          )
          .reduce((n, r) => n + r.amountOre, 0);
        if (
          (state.prepaidBalances[account] ?? 0) - pending <
          normalized.amountOre
        )
          throw new PolicyError(
            "PREPAID_EXHAUSTED",
            "Insufficient confirmed prepaid balance",
          );
      } else {
        const limit =
          normalized.category === "software"
            ? LIMITS.softwareMonthlyOre
            : normalized.category === "supplier"
              ? LIMITS.supplierFloatOre
              : profitQualified(state, now)
                ? LIMITS.adsMaximumMonthlyOre
                : LIMITS.adsInitialMonthlyOre;
        if (
          budgetUsage(state, normalized.category, now) + normalized.amountOre >
          limit
        )
          throw new PolicyError(
            "BUDGET_EXCEEDED",
            `${normalized.category} budget is exhausted`,
          );
      }
      const reservation: Reservation = {
        ...normalized,
        id: randomUUID(),
        status: "reserved",
        createdAt: now.toISOString(),
      };
      state.reservations[reservation.id] = reservation;
      audit("spend.reserved", {
        reservationId: reservation.id,
        category: reservation.category,
        amountOre: reservation.amountOre,
        funding: reservation.funding,
        idempotencyKey: reservation.idempotencyKey,
      });
      return structuredClone(reservation);
    });
  }
  async settleSpend(
    id: string,
    settlement: { actualOre: number; receiptId: string },
  ): Promise<Reservation> {
    money(settlement.actualOre);
    requireText(settlement.receiptId, "receiptId");
    return this.transact((state, audit, now) => {
      const r = state.reservations[id];
      if (!r) throw new PolicyError("NOT_FOUND", "Reservation not found");
      if (r.status === "settled") {
        if (
          r.actualOre === settlement.actualOre &&
          r.receiptId === settlement.receiptId
        )
          return structuredClone(r);
        throw new PolicyError(
          "IDEMPOTENCY_CONFLICT",
          "Reservation already settled differently",
        );
      }
      if (r.status !== "reserved")
        throw new PolicyError(
          "RESERVATION_CLOSED",
          "Released reservation cannot be settled",
        );
      if (settlement.actualOre > r.amountOre)
        throw new PolicyError(
          "RESERVATION_EXCEEDED",
          "Actual charge exceeds authorized reservation",
        );
      if (
        Object.values(state.reservations).some(
          (other) => other.receiptId === settlement.receiptId,
        )
      )
        throw new PolicyError(
          "DUPLICATE_RECEIPT",
          "Receipt already belongs to another reservation",
        );
      r.status = "settled";
      r.actualOre = settlement.actualOre;
      r.receiptId = settlement.receiptId;
      r.settledAt = now.toISOString();
      if (r.funding === "prepaid")
        state.prepaidBalances[r.prepaidAccount!] =
          (state.prepaidBalances[r.prepaidAccount!] ?? 0) -
          settlement.actualOre;
      if (r.kind === "prepaid_topup")
        state.prepaidBalances[r.prepaidAccount!] =
          (state.prepaidBalances[r.prepaidAccount!] ?? 0) +
          settlement.actualOre;
      audit("spend.settled", {
        reservationId: id,
        actualOre: settlement.actualOre,
        receiptId: settlement.receiptId,
      });
      return structuredClone(r);
    });
  }
  /** Only call after the trusted adapter proves the action was never submitted or was rejected without charge. */
  async releaseSpend(id: string, reason: string): Promise<Reservation> {
    requireText(reason, "reason");
    return this.transact((state, audit) => {
      const r = state.reservations[id];
      if (!r) throw new PolicyError("NOT_FOUND", "Reservation not found");
      if (r.status === "settled")
        throw new PolicyError(
          "RESERVATION_CLOSED",
          "Settled charges cannot be released",
        );
      if (r.status === "released") return structuredClone(r);
      r.status = "released";
      r.releaseReason = reason;
      audit("spend.released", { reservationId: id, reason });
      return structuredClone(r);
    });
  }
  async recordVerifiedOrder(order: VerifiedOrder): Promise<void> {
    requireText(order.id, "order id");
    if (
      order.source !== "shopify_supplier_payment" ||
      new Set(order.sourceRefs).size < 3
    )
      throw new PolicyError(
        "MISSING_PROVENANCE",
        "Independent store, supplier and payment records are required",
      );
    for (const key of [
      "revenueOre",
      "productCostOre",
      "shippingCostOre",
      "paymentFeeOre",
      "adCostOre",
      "refundsOre",
      "returnsReprintsOre",
      "personalizationLabourOre",
    ] as const)
      money(order[key], key);
    for (const key of [
      "paidAt",
      "fulfilledAt",
      "payoutReceivedAt",
      "verifiedAt",
    ] as const)
      if (order[key] !== undefined && !Number.isFinite(Date.parse(order[key]!)))
        throw new PolicyError("INVALID_DATE", `Invalid ${key}`);
    await this.transact((state, audit) => {
      state.orders[order.id] = structuredClone(order);
      audit(
        "order.verified",
        { orderId: order.id, sourceRefs: order.sourceRefs },
        "trusted_reconciler",
      );
    });
  }
  async recoverSupplierFloat(recovery: {
    receiptId: string;
    amountOre: number;
  }): Promise<void> {
    requireText(recovery.receiptId, "receiptId");
    money(recovery.amountOre);
    await this.transact((state, audit, now) => {
      const previous = state.supplierRecoveries[recovery.receiptId];
      if (previous) {
        if (previous.amountOre !== recovery.amountOre)
          throw new PolicyError(
            "IDEMPOTENCY_CONFLICT",
            "Recovery receipt reused with another amount",
          );
        return;
      }
      const committed =
        Object.values(state.reservations)
          .filter((r) => r.category === "supplier" && r.status === "settled")
          .reduce((sum, r) => sum + (r.actualOre ?? 0), 0) -
        Object.values(state.supplierRecoveries).reduce(
          (sum, r) => sum + r.amountOre,
          0,
        );
      if (recovery.amountOre > committed)
        throw new PolicyError(
          "RECOVERY_EXCEEDED",
          "Recovery cannot exceed unrecovered supplier charges",
        );
      state.supplierRecoveries[recovery.receiptId] = {
        amountOre: recovery.amountOre,
        at: now.toISOString(),
      };
      audit("supplier.float_recovered", recovery, "trusted_reconciler");
    });
  }
  async enqueueJob(request: JobRequest): Promise<Job> {
    requireText(request.dedupKey, "dedupKey");
    requireText(request.type, "job type");
    if (request.runAt && !Number.isFinite(Date.parse(request.runAt)))
      throw new PolicyError("INVALID_DATE", "Invalid runAt");
    if (
      request.maxAttempts !== undefined &&
      (!Number.isInteger(request.maxAttempts) ||
        request.maxAttempts < 1 ||
        request.maxAttempts > 20)
    )
      throw new PolicyError("INVALID_ATTEMPTS", "maxAttempts must be 1–20");
    return this.transact((state, audit, now) => {
      const previous = Object.values(state.jobs).find(
        (j) => j.dedupKey === request.dedupKey,
      );
      if (previous) {
        if (
          previous.type !== request.type ||
          canonical(previous.payload) !== canonical(request.payload)
        )
          throw new PolicyError(
            "IDEMPOTENCY_CONFLICT",
            "Job dedup key reused for a different payload",
          );
        return structuredClone(previous);
      }
      const job: Job = {
        ...structuredClone(request),
        maxAttempts: request.maxAttempts ?? 5,
        id: randomUUID(),
        state: "queued",
        attempts: 0,
        createdAt: now.toISOString(),
        availableAt: request.runAt ?? now.toISOString(),
      };
      state.jobs[job.id] = job;
      audit("job.enqueued", {
        jobId: job.id,
        type: job.type,
        dedupKey: job.dedupKey,
      });
      return structuredClone(job);
    });
  }
  async leaseJob(workerId: string, leaseMs: number): Promise<Job | null> {
    requireText(workerId, "workerId");
    leaseDuration(leaseMs);
    return this.transact((state, audit, now) => {
      for (const job of Object.values(state.jobs))
        if (
          job.state === "leased" &&
          Date.parse(job.leaseExpiresAt!) <= now.getTime()
        ) {
          job.state =
            job.attempts >= (job.maxAttempts ?? 5) ? "dead" : "queued";
          job.availableAt = now.toISOString();
          job.lastError = "Worker lease expired";
          delete job.leaseToken;
          delete job.leaseOwner;
          delete job.leaseExpiresAt;
          audit("job.lease_recovered", { jobId: job.id, state: job.state });
        }
      const job = Object.values(state.jobs)
        .filter(
          (j) =>
            j.state === "queued" && Date.parse(j.availableAt) <= now.getTime(),
        )
        .sort(
          (a, b) =>
            a.availableAt.localeCompare(b.availableAt) ||
            a.createdAt.localeCompare(b.createdAt),
        )[0];
      if (!job) return null;
      job.state = "leased";
      job.attempts += 1;
      job.leaseToken = randomUUID();
      job.leaseOwner = workerId;
      job.leaseExpiresAt = new Date(now.getTime() + leaseMs).toISOString();
      audit("job.leased", { jobId: job.id, workerId, attempt: job.attempts });
      return structuredClone(job);
    });
  }
  private activeLease(
    state: OpsState,
    id: string,
    token: string,
    now: Date,
  ): Job {
    const job = state.jobs[id];
    if (
      !job ||
      job.state !== "leased" ||
      job.leaseToken !== token ||
      Date.parse(job.leaseExpiresAt!) <= now.getTime()
    )
      throw new PolicyError(
        "STALE_LEASE",
        "Job lease is stale or belongs to another worker",
      );
    return job;
  }
  async heartbeatJob(
    id: string,
    token: string,
    leaseMs: number,
  ): Promise<void> {
    leaseDuration(leaseMs);
    await this.transact((state, _audit, now) => {
      const job = this.activeLease(state, id, token, now);
      job.leaseExpiresAt = new Date(now.getTime() + leaseMs).toISOString();
    });
  }
  async completeJob(id: string, token: string, result: unknown): Promise<void> {
    await this.transact((state, audit, now) => {
      const job = this.activeLease(state, id, token, now);
      job.state = "completed";
      job.result = structuredClone(result);
      job.completedAt = now.toISOString();
      delete job.leaseToken;
      delete job.leaseOwner;
      delete job.leaseExpiresAt;
      audit("job.completed", { jobId: id });
    });
  }
  async failJob(
    id: string,
    token: string,
    error: string,
    retryDelayMs: number,
  ): Promise<void> {
    if (
      !Number.isSafeInteger(retryDelayMs) ||
      retryDelayMs < 0 ||
      retryDelayMs > 86400000
    )
      throw new PolicyError("INVALID_DELAY", "Retry delay must be 0–24 hours");
    await this.transact((state, audit, now) => {
      const job = this.activeLease(state, id, token, now);
      job.state = job.attempts >= (job.maxAttempts ?? 5) ? "dead" : "queued";
      job.availableAt = new Date(now.getTime() + retryDelayMs).toISOString();
      job.lastError = error.slice(0, 2048);
      delete job.leaseToken;
      delete job.leaseOwner;
      delete job.leaseExpiresAt;
      audit("job.failed", {
        jobId: id,
        state: job.state,
        attempt: job.attempts,
      });
    });
  }
  async appendAudit(
    event: string,
    data: Record<string, unknown>,
    actor = "runtime",
  ): Promise<void> {
    requireText(event, "audit event");
    requireText(actor, "audit actor");
    await this.transact((_state, audit) => audit(event, data, actor));
  }
}
