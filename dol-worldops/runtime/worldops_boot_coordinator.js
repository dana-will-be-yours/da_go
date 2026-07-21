import { RuntimeContractError, assertRecord, cloneValue, hashRecord } from "./worldops_event_bus.js";

function normalizeError(error) {
  return {
    name: error?.name || "Error",
    code: error?.code || null,
    message: error?.message || "Unknown boot lifecycle error",
  };
}

function requireInterface(value, name, methods) {
  if (!value || typeof value !== "object") throw new RuntimeContractError("INVALID_BOOT_DEPENDENCY", `${name} is required`);
  for (const method of methods) {
    if (typeof value[method] !== "function") throw new RuntimeContractError("INVALID_BOOT_DEPENDENCY", `${name}.${method} is required`);
  }
}

export class WorldOpsBootCoordinator {
  constructor({
    runtime,
    configLoader,
    capabilityRegistry,
    permissionGate,
    handshake,
    snapshotManager,
    receiptSink = null,
    scheduler = { setInterval: globalThis.setInterval?.bind(globalThis), clearInterval: globalThis.clearInterval?.bind(globalThis) },
    now = () => new Date().toISOString(),
    maxReceipts = 500,
  } = {}) {
    requireInterface(runtime, "runtime", ["start", "stop", "suspend", "resume", "status"]);
    requireInterface(configLoader, "configLoader", ["load"]);
    requireInterface(capabilityRegistry, "capabilityRegistry", ["resolve"]);
    requireInterface(permissionGate, "permissionGate", ["authorize"]);
    requireInterface(handshake, "handshake", ["open", "close"]);
    requireInterface(snapshotManager, "snapshotManager", ["hydrate", "requestSnapshot"]);
    if (receiptSink !== null) requireInterface(receiptSink, "receiptSink", ["flush"]);
    this.runtime = runtime;
    this.configLoader = configLoader;
    this.capabilityRegistry = capabilityRegistry;
    this.permissionGate = permissionGate;
    this.handshake = handshake;
    this.snapshotManager = snapshotManager;
    this.receiptSink = receiptSink;
    this.scheduler = scheduler;
    this.now = now;
    this.maxReceipts = Math.max(1, Number(maxReceipts) || 500);
    this.state = "idle";
    this.current = null;
    this.autosnapshotTimer = null;
    this.receipts = [];
  }

  async start({
    configSource = {},
    configOverrides = {},
    roles = [],
    explicitCapabilities = [],
    roomId,
    clientId,
    credential = null,
    deviceMode = "desktop",
    lastCursor = null,
    route = { resource: "room.play", action: "enter" },
    context = {},
  } = {}) {
    if (!["idle", "stopped", "failed"].includes(this.state)) {
      throw new RuntimeContractError("INVALID_BOOT_STATE", `cannot start boot coordinator from ${this.state}`);
    }
    assertRecord(route, "boot route");
    assertRecord(context, "boot context");
    const startedAt = this.now();
    const phases = [];
    this.state = "starting";

    try {
      const configResult = await this.configLoader.load(configSource, configOverrides);
      const config = configResult.config;
      phases.push({ phase: "config", status: "fulfilled", receipt: configResult.receipt });

      const clientCapabilities = this.capabilityRegistry.resolve({ roles, explicit: explicitCapabilities });
      phases.push({ phase: "client_capabilities", status: "fulfilled", count: clientCapabilities.length });

      const handshakeResult = await this.handshake.open({
        clientId,
        roomId,
        runtimeVersion: config.runtimeVersion,
        schemaVersion: config.schemaVersion,
        deviceMode,
        credential,
        lastCursor,
      });
      const serverCapabilities = new Set(handshakeResult.session.capabilities);
      const capabilities = clientCapabilities.filter(capability => serverCapabilities.has(capability));
      phases.push({ phase: "session_handshake", status: "fulfilled", receipt: handshakeResult.receipt });

      const permissionReceipt = await this.permissionGate.authorize({
        resource: route.resource,
        action: route.action,
        capabilities,
        subject: handshakeResult.session.session_id,
      });
      phases.push({ phase: "permission", status: "fulfilled", receipt: permissionReceipt });

      const snapshotResult = await this.snapshotManager.hydrate({
        roomId,
        sessionId: handshakeResult.session.session_id,
        cursor: handshakeResult.session.snapshot_cursor,
      });
      phases.push({ phase: "snapshot", status: "fulfilled", receipt: snapshotResult.receipt });

      const runtimeReceipt = await this.runtime.start({
        ...context,
        config: cloneValue(config),
        session: cloneValue(handshakeResult.session),
        snapshot: cloneValue(snapshotResult.snapshot),
        capabilities: [...capabilities],
        deviceMode,
      });
      phases.push({ phase: "runtime", status: "fulfilled", receipt: runtimeReceipt });

      this.current = {
        config: cloneValue(config),
        session: cloneValue(handshakeResult.session),
        snapshot: cloneValue(snapshotResult.snapshot),
        capabilities: [...capabilities],
        deviceMode,
        route: cloneValue(route),
      };
      this.state = "ready";
      this.#startAutosnapshot();
      const receipt = {
        boot_status: "ready",
        started_at: startedAt,
        ended_at: this.now(),
        room_id: roomId,
        session_id: handshakeResult.session.session_id,
        effective_capability_count: capabilities.length,
        phases,
        recovery: [],
        formal_runtime_allowed: false,
      };
      await this.#record(receipt, "boot.start");
      return cloneValue(receipt);
    } catch (error) {
      this.#clearAutosnapshot();
      const recovery = [];
      if (this.runtime.status().started || ["ready", "suspended", "stop_failed"].includes(this.runtime.status().moduleLoader?.state)) {
        try {
          await this.runtime.stop({ reason: "boot_failure" });
          recovery.push({ phase: "runtime_stop", status: "fulfilled" });
        } catch (stopError) {
          recovery.push({ phase: "runtime_stop", status: "rejected", error: normalizeError(stopError) });
        }
      }
      try {
        const closeReceipt = await this.handshake.close({ reason: "boot_failure" });
        recovery.push({ phase: "handshake_close", status: "fulfilled", receipt: closeReceipt });
      } catch (closeError) {
        recovery.push({ phase: "handshake_close", status: "rejected", error: normalizeError(closeError) });
      }
      this.current = null;
      this.state = "failed";
      const receipt = {
        boot_status: "failed",
        started_at: startedAt,
        ended_at: this.now(),
        room_id: roomId ?? null,
        phases,
        recovery,
        error: normalizeError(error),
        formal_runtime_allowed: false,
      };
      await this.#record(receipt, "boot.start");
      if (this.runtime.errors) await this.runtime.errors.capture(error, { source: "boot-coordinator.start", phases });
      throw new RuntimeContractError("BOOT_PIPELINE_FAILED", error?.message || "boot pipeline failed", { receipt });
    }
  }

  async suspend({ reason = "manual", context = {} } = {}) {
    if (this.state !== "ready") throw new RuntimeContractError("INVALID_BOOT_STATE", `cannot suspend from ${this.state}`);
    assertRecord(context, "suspend context");
    this.#clearAutosnapshot();
    const steps = [];
    const errors = [];
    try {
      const snapshotReceipt = await this.#requestSnapshot(reason);
      steps.push({ phase: "snapshot_request", status: "fulfilled", receipt: snapshotReceipt });
    } catch (error) {
      errors.push(error);
      steps.push({ phase: "snapshot_request", status: "rejected", error: normalizeError(error) });
    }
    try {
      const runtimeReceipt = await this.runtime.suspend({ ...context, reason });
      steps.push({ phase: "runtime_suspend", status: "fulfilled", receipt: runtimeReceipt });
    } catch (error) {
      errors.push(error);
      steps.push({ phase: "runtime_suspend", status: "rejected", error: normalizeError(error) });
    }
    this.state = errors.length ? "suspend_failed" : "suspended";
    const receipt = { boot_status: this.state, at: this.now(), reason, steps, formal_runtime_allowed: false };
    await this.#record(receipt, "boot.suspend");
    if (errors.length) throw new RuntimeContractError("BOOT_SUSPEND_FAILED", "one or more suspend phases failed", { receipt });
    return cloneValue(receipt);
  }

  async resume({ context = {} } = {}) {
    if (this.state !== "suspended") throw new RuntimeContractError("INVALID_BOOT_STATE", `cannot resume from ${this.state}`);
    assertRecord(context, "resume context");
    try {
      const runtimeReceipt = await this.runtime.resume({ ...context, session: cloneValue(this.current.session) });
      this.state = "ready";
      this.#startAutosnapshot();
      const receipt = { boot_status: "ready", at: this.now(), steps: [{ phase: "runtime_resume", status: "fulfilled", receipt: runtimeReceipt }], formal_runtime_allowed: false };
      await this.#record(receipt, "boot.resume");
      return cloneValue(receipt);
    } catch (error) {
      this.state = "suspended";
      const receipt = { boot_status: "resume_failed", at: this.now(), error: normalizeError(error), formal_runtime_allowed: false };
      await this.#record(receipt, "boot.resume");
      throw new RuntimeContractError("BOOT_RESUME_FAILED", error?.message || "boot resume failed", { receipt });
    }
  }

  async stop({ reason = "manual", context = {} } = {}) {
    if (["idle", "stopped"].includes(this.state)) return { boot_status: "already_stopped", formal_runtime_allowed: false };
    assertRecord(context, "stop context");
    this.#clearAutosnapshot();
    const steps = [];
    const errors = [];
    if (this.current) {
      try {
        const snapshotReceipt = await this.#requestSnapshot(reason);
        steps.push({ phase: "snapshot_request", status: "fulfilled", receipt: snapshotReceipt });
      } catch (error) {
        errors.push(error);
        steps.push({ phase: "snapshot_request", status: "rejected", error: normalizeError(error) });
      }
    }
    try {
      const runtimeReceipt = await this.runtime.stop({ ...context, reason });
      steps.push({ phase: "runtime_stop", status: "fulfilled", receipt: runtimeReceipt });
    } catch (error) {
      errors.push(error);
      steps.push({ phase: "runtime_stop", status: "rejected", error: normalizeError(error) });
    }
    try {
      const closeReceipt = await this.handshake.close({ reason });
      steps.push({ phase: "handshake_close", status: "fulfilled", receipt: closeReceipt });
    } catch (error) {
      errors.push(error);
      steps.push({ phase: "handshake_close", status: "rejected", error: normalizeError(error) });
    }
    try {
      const flushReceipt = await this.flushReceipts({ reason: `stop:${reason}` });
      steps.push({ phase: "receipt_flush", status: "fulfilled", receipt: flushReceipt });
    } catch (error) {
      errors.push(error);
      steps.push({ phase: "receipt_flush", status: "rejected", error: normalizeError(error) });
    }
    this.current = null;
    this.state = errors.length ? "stop_failed" : "stopped";
    const receipt = { boot_status: this.state, at: this.now(), reason, steps, formal_runtime_allowed: false };
    await this.#record(receipt, "boot.stop");
    if (errors.length) throw new RuntimeContractError("BOOT_STOP_FAILED", "one or more stop phases failed", { receipt });
    return cloneValue(receipt);
  }

  async flushReceipts({ reason = "manual" } = {}) {
    const payload = {
      reason,
      flushed_at: this.now(),
      runtime_receipts: this.runtime.receipts?.export?.() ?? [],
      event_receipts: this.runtime.events?.exportReceipts?.() ?? [],
      macro_receipts: this.runtime.macros?.exportReceipts?.() ?? [],
      widget_receipts: this.runtime.widgets?.exportReceipts?.() ?? [],
      snapshot_receipts: this.snapshotManager.exportReceipts?.() ?? [],
      handshake_receipts: this.handshake.exportReceipts?.() ?? [],
      permission_receipts: this.permissionGate.exportReceipts?.() ?? [],
      formal_runtime_allowed: false,
    };
    const receipt = this.receiptSink
      ? await this.receiptSink.flush(cloneValue(payload))
      : { status: "local_only", payload_hash: await hashRecord(payload), record_count: Object.values(payload).filter(Array.isArray).reduce((sum, rows) => sum + rows.length, 0) };
    return cloneValue(receipt);
  }

  status() {
    return cloneValue({
      state: this.state,
      current: this.current,
      autosnapshot_active: this.autosnapshotTimer !== null,
      runtime: this.runtime.status(),
      formal_runtime_allowed: false,
    });
  }

  async #requestSnapshot(reason) {
    if (!this.current) throw new RuntimeContractError("NO_ACTIVE_BOOT_SESSION", "there is no active boot session");
    return this.snapshotManager.requestSnapshot({
      roomId: this.current.session.room_id,
      sessionId: this.current.session.session_id,
      expectedVersion: this.current.snapshot.room_version,
      reason,
      clientStateDigest: await hashRecord({ runtime: this.runtime.status(), cache_authoritative: false }),
    });
  }

  #startAutosnapshot() {
    this.#clearAutosnapshot();
    const interval = Number(this.current?.config?.autosnapshotIntervalMs ?? 0);
    if (!Number.isFinite(interval) || interval <= 0 || typeof this.scheduler?.setInterval !== "function") return;
    this.autosnapshotTimer = this.scheduler.setInterval(() => {
      void this.#requestSnapshot("interval").catch(async error => {
        await this.#record({ boot_status: this.state, at: this.now(), phase: "autosnapshot", status: "rejected", error: normalizeError(error), formal_runtime_allowed: false }, "boot.autosnapshot");
      });
    }, interval);
  }

  #clearAutosnapshot() {
    if (this.autosnapshotTimer !== null && typeof this.scheduler?.clearInterval === "function") {
      this.scheduler.clearInterval(this.autosnapshotTimer);
    }
    this.autosnapshotTimer = null;
  }

  async #record(receipt, source) {
    this.receipts.push(cloneValue(receipt));
    if (this.receipts.length > this.maxReceipts) this.receipts.shift();
    if (this.runtime.receipts?.append) await this.runtime.receipts.append(receipt, { category: "boot", source });
  }

  exportReceipts() {
    return cloneValue(this.receipts);
  }
}
