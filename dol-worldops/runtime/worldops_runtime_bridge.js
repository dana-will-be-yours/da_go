import { WorldOpsEventBus, RuntimeContractError, cloneValue } from "./worldops_event_bus.js";
import { WorldOpsMacroRegistry } from "./worldops_macro_registry.js";
import { WorldOpsWidgetRegistry } from "./worldops_widget_registry.js";
import { WorldOpsClientCache } from "./worldops_cache_adapter.js";
import { WorldOpsReceiptStore } from "./worldops_receipt_store.js";
import { WorldOpsErrorBoundary } from "./worldops_error_boundary.js";
import { WorldOpsModuleLoader } from "./worldops_module_loader.js";

export class WorldOpsRuntimeBridge {
  constructor({ namespace = "worldops", schemaVersion = "1", storage = undefined, now = () => new Date().toISOString() } = {}) {
    this.receipts = new WorldOpsReceiptStore({ now });
    this.events = new WorldOpsEventBus({ now });
    this.errors = new WorldOpsErrorBoundary({ receiptStore: this.receipts, eventBus: this.events, now });
    this.macros = new WorldOpsMacroRegistry({ now });
    this.widgets = new WorldOpsWidgetRegistry({ now });
    this.cache = new WorldOpsClientCache({ namespace, schemaVersion, storage, nowIso: now });
    this.modules = new WorldOpsModuleLoader({ now, receiptStore: this.receipts, errorBoundary: this.errors });
    this.started = false;
    this.suspended = false;
    this.formalRuntimeAllowed = false;
  }

  async start(context = {}) {
    if (this.started) throw new RuntimeContractError("RUNTIME_ALREADY_STARTED", "runtime is already started");
    const receipt = await this.modules.start({
      ...context,
      runtime: this,
      capabilities: Array.isArray(context.capabilities) ? context.capabilities : [],
    });
    this.started = true;
    this.suspended = false;
    await this.events.emit("runtime.ready", { order: receipt.order }, { capabilities: context.capabilities || [] });
    return cloneValue(receipt);
  }

  async suspend(context = {}) {
    if (!this.started || this.suspended) {
      throw new RuntimeContractError("INVALID_RUNTIME_STATE", this.suspended ? "runtime is already suspended" : "runtime is not started");
    }
    const receipt = await this.modules.suspend({ ...context, runtime: this });
    this.suspended = true;
    await this.events.emit("runtime.suspended", { status: receipt.runtime_status }, { capabilities: context.capabilities || [] });
    return cloneValue(receipt);
  }

  async resume(context = {}) {
    if (!this.started || !this.suspended) {
      throw new RuntimeContractError("INVALID_RUNTIME_STATE", !this.started ? "runtime is not started" : "runtime is not suspended");
    }
    const receipt = await this.modules.resume({ ...context, runtime: this });
    this.suspended = false;
    await this.events.emit("runtime.resumed", { status: receipt.runtime_status }, { capabilities: context.capabilities || [] });
    return cloneValue(receipt);
  }

  async stop(context = {}) {
    if (!this.started && !["ready", "suspended", "suspend_failed", "resume_recovery_failed", "stop_failed"].includes(this.modules.state)) {
      return { runtime_status: "already_stopped", formal_runtime_allowed: false };
    }
    const failures = [];
    try {
      await this.widgets.unmountAll();
    } catch (error) {
      failures.push({ phase: "widgets", error });
      await this.errors.capture(error, { source: "runtime.stop.widgets" });
    }

    let moduleReceipt = null;
    try {
      moduleReceipt = await this.modules.stop({ ...context, runtime: this });
    } catch (error) {
      failures.push({ phase: "modules", error });
      moduleReceipt = error?.details?.receipt ?? this.modules.lastReceipt;
      await this.errors.capture(error, { source: "runtime.stop.modules" });
    } finally {
      this.started = false;
      this.suspended = false;
    }

    await this.events.emit("runtime.stopped", {
      status: moduleReceipt?.runtime_status ?? "stop_failed",
      failure_count: failures.length,
    }, { capabilities: context.capabilities || [] });

    if (failures.length) {
      throw new RuntimeContractError("RUNTIME_STOP_FAILED", "runtime cleanup did not complete without errors", {
        failures: failures.map(row => ({
          phase: row.phase,
          name: row.error?.name || "Error",
          code: row.error?.code || null,
          message: row.error?.message || "Unknown stop error",
        })),
        receipt: cloneValue(moduleReceipt),
      });
    }
    return cloneValue(moduleReceipt);
  }

  status() {
    return {
      started: this.started,
      suspended: this.suspended,
      authoritative: false,
      formalRuntimeAllowed: false,
      moduleLoader: this.modules.status(),
      macros: this.macros.list(),
      widgets: this.widgets.list(),
      receiptCount: this.receipts.export().length,
      eventReceiptCount: this.events.exportReceipts().length,
    };
  }
}
