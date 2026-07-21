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
  }

  async start(context = {}) {
    if (this.started) {
      throw new RuntimeContractError("RUNTIME_ALREADY_STARTED", "runtime is already started");
    }
    const receipt = await this.modules.start({
      ...context,
      runtime: this,
      capabilities: Array.isArray(context.capabilities) ? context.capabilities : [],
    });
    this.started = true;
    await this.events.emit("runtime.ready", { order: receipt.order }, {
      capabilities: context.capabilities || [],
    });
    return cloneValue(receipt);
  }

  async stop(context = {}) {
    if (!this.started && !["ready", "stop_failed"].includes(this.modules.state)) {
      return { runtime_status: "already_stopped", formal_runtime_allowed: false };
    }
    let widgetError = null;
    try {
      await this.widgets.unmountAll();
    } catch (error) {
      widgetError = error;
      await this.errors.capture(error, { source: "runtime.stop.widgets" });
    }
    const receipt = await this.modules.stop({ ...context, runtime: this });
    this.started = false;
    await this.events.emit("runtime.stopped", { status: receipt.runtime_status }, {
      capabilities: context.capabilities || [],
    });
    if (widgetError) {
      throw new RuntimeContractError("RUNTIME_WIDGET_CLEANUP_FAILED", widgetError.message, { receipt });
    }
    return cloneValue(receipt);
  }

  status() {
    return {
      started: this.started,
      authoritative: false,
      moduleLoader: this.modules.status(),
      macros: this.macros.list(),
      widgets: this.widgets.list(),
      receiptCount: this.receipts.export().length,
      eventReceiptCount: this.events.exportReceipts().length,
    };
  }
}
