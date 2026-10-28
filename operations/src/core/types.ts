export type MoneyOre = number;
export type Mode = "observe" | "live" | "paused";
export type SpendCategory = "software" | "ads" | "supplier";
export type ReadinessCheck =
  | "connectors"
  | "budget_reconciliation"
  | "webhook_deduplication"
  | "recovery"
  | "social"
  | "supplier"
  | "checkout"
  | "tracking_consent";
export type Action =
  | "research"
  | "analyze"
  | "draft"
  | "publish_social"
  | "publish_product"
  | "activate_ads"
  | "fulfill_order"
  | "send_support"
  | "refund";
export interface Decision {
  allowed: boolean;
  reasons: string[];
}
export interface ReadinessResult {
  outcome: "pass" | "fail";
  evidenceRef: string;
  checkedAt: string;
}
export interface Control {
  mode: Mode;
  observationStartedAt: string;
  lastHeartbeatAt?: string;
  updatedAt: string;
  readiness: Partial<Record<ReadinessCheck, ReadinessResult>>;
}
export interface SpendRequest {
  idempotencyKey: string;
  category: SpendCategory;
  amountOre: MoneyOre;
  purpose: string;
  funding?: "cash" | "prepaid";
  prepaidAccount?: string;
  kind?: "usage" | "prepaid_topup";
  productId?: string;
  orderId?: string;
}
export interface Reservation extends SpendRequest {
  id: string;
  status: "reserved" | "settled" | "released";
  createdAt: string;
  actualOre?: MoneyOre;
  settledAt?: string;
  receiptId?: string;
  releaseReason?: string;
}
export interface VerifiedOrder {
  id: string;
  source: "shopify_supplier_payment";
  sourceRefs: string[];
  paidAt?: string;
  fulfilledAt?: string;
  payoutReceivedAt?: string;
  revenueOre: MoneyOre;
  productCostOre: MoneyOre;
  shippingCostOre: MoneyOre;
  paymentFeeOre: MoneyOre;
  adCostOre: MoneyOre;
  refundsOre: MoneyOre;
  returnsReprintsOre: MoneyOre;
  personalizationLabourOre: MoneyOre;
  verifiedAt: string;
}
export interface PaidOrderObligation {
  orderId: string;
  productId: string;
  paidAt: string;
  amountPaidOre: MoneyOre;
  refundedOre: MoneyOre;
  source: "shopify_paid_order";
  sourceRef: string;
  supplierProductId: string;
  supplierVariantId: string;
  importedAt: string;
  cancelledAt?: string;
  fulfilledAt?: string;
  sourceUpdatedAt?: string;
  holdReason?: string;
  lines?: Array<{
    lineItemId: string;
    productId: string;
    variantId: string;
    quantity: number;
    supplierProductId: string;
    supplierVariantId: string;
  }>;
}
export interface ProductEvidence {
  id: string;
  title: string;
  search: {
    country: string;
    monthlySearches: number;
    method: "absolute_volume" | "relative_trends";
    sourceUrl: string;
    observedAt: string;
    period: string;
  };
  trends: {
    country: string;
    sourceUrl: string;
    observedAt: string;
    seasonalWindow: string;
  };
  marketplace: {
    country: string;
    sourceUrl: string;
    rating: number;
    reviewCount: number;
    recentPurchaseEstimate?: number;
    observedAt: string;
  };
  supplier: {
    productId: string;
    variantId: string;
    quoteId: string;
    integration: "shopify_direct" | "unverified";
    shippingCountry: string;
    sourceUrl: string;
    observedAt: string;
    deliveryDaysMax: number;
  };
  pricing: {
    sellingPriceOre: MoneyOre;
    productCostOre: MoneyOre;
    shippingCostOre: MoneyOre;
    paymentFeeOre: MoneyOre;
    adCostAllowanceOre: MoneyOre;
    returnsReprintsAllowanceOre: MoneyOre;
    personalizationLabourOre: MoneyOre;
  };
  provenance: { actor: string; evidenceRefs: string[] };
}
export interface JobRequest {
  dedupKey: string;
  type: string;
  payload: Record<string, unknown>;
  runAt?: string;
  maxAttempts?: number;
}
export interface Job extends JobRequest {
  id: string;
  state: "queued" | "leased" | "completed" | "dead";
  attempts: number;
  createdAt: string;
  availableAt: string;
  leaseToken?: string;
  leaseOwner?: string;
  leaseExpiresAt?: string;
  result?: unknown;
  lastError?: string;
  completedAt?: string;
}
export interface AuditRecord {
  id: string;
  at: string;
  actor: string;
  event: string;
  data: Record<string, unknown>;
}
export interface OpsState {
  version: 1;
  control: Control;
  reservations: Record<string, Reservation>;
  prepaidBalances: Record<string, number>;
  orders: Record<string, VerifiedOrder>;
  obligations: Record<string, PaidOrderObligation>;
  products: Record<string, ProductEvidence>;
  jobs: Record<string, Job>;
  supplierRecoveries: Record<string, { amountOre: number; at: string }>;
}
export interface OpsSnapshot extends OpsState {
  month: string;
  budgets: {
    software: { limitOre: number; usedOre: number };
    ads: { limitOre: number; usedOre: number; profitQualified: boolean };
    supplier: { limitOre: number; usedOre: number };
  };
}
/** Trusted backend interface. Do not expose record*, setMode, settle/release, or recovery methods as model tools. */
export interface OpsStore {
  initialize(): Promise<void>;
  snapshot(): Promise<OpsSnapshot>;
  getControl(): Promise<Control>;
  recordHeartbeat(): Promise<Control>;
  setMode(mode: Mode, actor: string): Promise<Control>;
  recordReadiness(
    check: ReadinessCheck,
    outcome: "pass" | "fail",
    evidenceRef: string,
  ): Promise<void>;
  authorizeAction(
    action: Action,
    context?: { productId?: string; orderId?: string },
  ): Promise<Decision>;
  recordPaidOrder(order: PaidOrderObligation): Promise<void>;
  recordEvidence(evidence: ProductEvidence): Promise<void>;
  reserveSpend(request: SpendRequest): Promise<Reservation>;
  settleSpend(
    id: string,
    settlement: { actualOre: number; receiptId: string },
  ): Promise<Reservation>;
  releaseSpend(id: string, reason: string): Promise<Reservation>;
  recordVerifiedOrder(order: VerifiedOrder): Promise<void>;
  recoverSupplierFloat(recovery: {
    receiptId: string;
    amountOre: number;
  }): Promise<void>;
  enqueueJob(request: JobRequest): Promise<Job>;
  leaseJob(workerId: string, leaseMs: number): Promise<Job | null>;
  heartbeatJob(id: string, token: string, leaseMs: number): Promise<void>;
  completeJob(id: string, token: string, result: unknown): Promise<void>;
  failJob(
    id: string,
    token: string,
    error: string,
    retryDelayMs: number,
  ): Promise<void>;
  appendAudit(
    event: string,
    data: Record<string, unknown>,
    actor?: string,
  ): Promise<void>;
  readAudit(limit?: number): Promise<AuditRecord[]>;
}
export interface StoreOptions {
  clock?: () => Date;
}
