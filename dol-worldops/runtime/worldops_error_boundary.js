import { RuntimeContractError, assertRecord, cloneValue } from "./worldops_event_bus.js";

function normalizeError(error) {
  return {
    name: error?.name || "Error",
    code: error?.code || null,
    message: error?.message || "Unknown error",
    details: cloneValue(error?.details || {}),
    stack: typeof error?.stack === "string" ? error.stack : null,
  };
}

export class WorldOpsErrorBoundary {
  constructor({ receiptStore = null, eventBus = null, now = () => new Date().toISOString() } = {}) {
    this.receiptStore = receiptStore;
    this.eventBus = eventBus;
    this.now = now;
  }

  async capture(error, context = {}) {
    assertRecord(context, "error context");
    const report = {
      error_id: `error-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      captured_at: this.now(),
      error: normalizeError(error),
      context: cloneValue(context),
      canon_write_allowed: false,
    };
    if (this.receiptStore) {
      await this.receiptStore.append(report, { category: "error", source: context.source || "runtime" });
    }
    if (this.eventBus) {
      await this.eventBus.emit("runtime.error", report, { capabilities: context.capabilities || [] });
    }
    return cloneValue(report);
  }

  async run(operation, context = {}) {
    if (typeof operation !== "function") {
      throw new RuntimeContractError("INVALID_BOUNDARY_OPERATION", "error boundary operation must be a function");
    }
    try {
      return await operation();
    } catch (error) {
      const report = await this.capture(error, context);
      throw new RuntimeContractError("RUNTIME_OPERATION_FAILED", error?.message || "Runtime operation failed", { report });
    }
  }
}
