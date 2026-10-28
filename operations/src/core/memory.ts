import { randomUUID } from "node:crypto";
import { initialState, StateOpsStore } from "./store.js";
import type { AuditRecord, OpsState, StoreOptions } from "./types.js";

/** Test/preview repository. Production must use PostgresOpsStore. */
export class MemoryOpsStore extends StateOpsStore {
  private state: OpsState;
  private audit: AuditRecord[] = [];
  private queue: Promise<void> = Promise.resolve();
  constructor(options: StoreOptions = {}) {
    super(options);
    this.state = initialState(this.clock());
  }
  async initialize(): Promise<void> {}
  protected transact = async <T>(
    operation: (
      state: OpsState,
      audit: (
        event: string,
        data: Record<string, unknown>,
        actor?: string,
      ) => void,
      now: Date,
    ) => T,
  ): Promise<T> => {
    const before = this.queue;
    let unlock!: () => void;
    this.queue = new Promise<void>((resolve) => {
      unlock = resolve;
    });
    await before;
    try {
      const now = this.clock();
      const draft = structuredClone(this.state);
      const events: AuditRecord[] = [];
      const result = operation(
        draft,
        (event, data, actor = "runtime") =>
          events.push({
            id: randomUUID(),
            at: now.toISOString(),
            actor,
            event,
            data: structuredClone(data),
          }),
        now,
      );
      this.state = draft;
      this.audit.push(...events);
      return result;
    } finally {
      unlock();
    }
  };
  async readAudit(limit = 100): Promise<AuditRecord[]> {
    return structuredClone(
      this.audit.slice(-Math.min(Math.max(limit, 1), 1000)).reverse(),
    );
  }
}
