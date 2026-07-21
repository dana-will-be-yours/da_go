import { RuntimeContractError, assertRecord, cloneValue } from "./worldops_event_bus.js";

const ID_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const HOOKS = ["preflight", "start", "ready", "suspend", "resume", "stop", "rollback"];

function normalizeManifest(manifest) {
  assertRecord(manifest, "module manifest");
  if (typeof manifest.id !== "string" || !ID_PATTERN.test(manifest.id)) {
    throw new RuntimeContractError("INVALID_MODULE_ID", "module id must use lowercase stable identifiers");
  }
  if (typeof manifest.version !== "string" || !manifest.version.trim()) {
    throw new RuntimeContractError("INVALID_MODULE_VERSION", "module version is required");
  }
  const dependencies = manifest.dependencies ?? [];
  const capabilities = manifest.capabilities ?? [];
  if (!Array.isArray(dependencies) || dependencies.some(id => typeof id !== "string" || !ID_PATTERN.test(id))) {
    throw new RuntimeContractError("INVALID_MODULE_DEPENDENCIES", "module dependencies must be stable identifiers");
  }
  if (!Array.isArray(capabilities) || capabilities.some(id => typeof id !== "string" || !id.trim())) {
    throw new RuntimeContractError("INVALID_MODULE_CAPABILITIES", "module capabilities must be strings");
  }
  return Object.freeze({
    id: manifest.id,
    version: manifest.version,
    dependencies: Object.freeze([...new Set(dependencies)]),
    capabilities: Object.freeze([...new Set(capabilities)]),
    description: String(manifest.description || ""),
    dataAuthority: manifest.dataAuthority || "client-cache",
    canonWriteAllowed: false,
  });
}

function normalizeHooks(hooks) {
  assertRecord(hooks, "module hooks");
  for (const key of Object.keys(hooks)) {
    if (!HOOKS.includes(key)) {
      throw new RuntimeContractError("UNKNOWN_MODULE_HOOK", `unknown module hook: ${key}`);
    }
    if (typeof hooks[key] !== "function") {
      throw new RuntimeContractError("INVALID_MODULE_HOOK", `${key} hook must be a function`);
    }
  }
  return hooks;
}

function normalizeError(error) {
  return {
    name: error?.name || "Error",
    code: error?.code || null,
    message: error?.message || "Unknown module lifecycle error",
  };
}

export class WorldOpsModuleLoader {
  constructor({ now = () => new Date().toISOString(), timeoutMs = 15000, receiptStore = null, errorBoundary = null } = {}) {
    this.now = now;
    this.timeoutMs = Math.max(1, Number(timeoutMs) || 15000);
    this.receiptStore = receiptStore;
    this.errorBoundary = errorBoundary;
    this.modules = new Map();
    this.order = [];
    this.started = [];
    this.state = "idle";
    this.lastReceipt = null;
  }

  register(manifest, hooks = {}) {
    const normalized = normalizeManifest(manifest);
    const normalizedHooks = normalizeHooks(hooks);
    if (this.modules.has(normalized.id)) {
      throw new RuntimeContractError("DUPLICATE_MODULE", `module already registered: ${normalized.id}`);
    }
    this.modules.set(normalized.id, { manifest: normalized, hooks: normalizedHooks, status: "registered" });
    this.order = [];
    return cloneValue(normalized);
  }

  resolveOrder() {
    const ids = [...this.modules.keys()].sort();
    const missing = [];
    for (const id of ids) {
      for (const dependency of this.modules.get(id).manifest.dependencies) {
        if (!this.modules.has(dependency)) missing.push({ module_id: id, dependency });
      }
    }
    if (missing.length) {
      throw new RuntimeContractError("MISSING_MODULE_DEPENDENCY", "one or more module dependencies are missing", { missing });
    }

    const marks = new Map();
    const result = [];
    const stack = [];
    const visit = id => {
      const mark = marks.get(id);
      if (mark === "done") return;
      if (mark === "visiting") {
        const cycleStart = stack.indexOf(id);
        throw new RuntimeContractError("MODULE_DEPENDENCY_CYCLE", "module dependency cycle detected", {
          cycle: [...stack.slice(cycleStart), id],
        });
      }
      marks.set(id, "visiting");
      stack.push(id);
      for (const dependency of [...this.modules.get(id).manifest.dependencies].sort()) visit(dependency);
      stack.pop();
      marks.set(id, "done");
      result.push(id);
    };
    for (const id of ids) visit(id);
    this.order = result;
    return [...result];
  }

  async #callHook(moduleId, hook, context) {
    const entry = this.modules.get(moduleId);
    const fn = entry.hooks[hook];
    if (!fn) return undefined;
    const operation = Promise.resolve().then(() => fn({
      module: cloneValue(entry.manifest),
      context,
      loader: this,
    }));
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(
        new RuntimeContractError("MODULE_HOOK_TIMEOUT", `${moduleId}.${hook} exceeded ${this.timeoutMs}ms`)
      ), this.timeoutMs);
    });
    try {
      return await Promise.race([operation, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }

  async start(context = {}) {
    assertRecord(context, "runtime context");
    if (!["idle", "stopped", "failed"].includes(this.state)) {
      throw new RuntimeContractError("INVALID_LOADER_STATE", `cannot start loader from ${this.state}`);
    }
    const startedAt = this.now();
    const order = this.resolveOrder();
    const steps = [];
    this.state = "starting";
    this.started = [];

    try {
      for (const id of order) {
        const entry = this.modules.get(id);
        entry.status = "preflighting";
        await this.#callHook(id, "preflight", context);
        steps.push({ module_id: id, hook: "preflight", status: "fulfilled" });
        entry.status = "starting";
        await this.#callHook(id, "start", context);
        this.started.push(id);
        steps.push({ module_id: id, hook: "start", status: "fulfilled" });
        entry.status = "readying";
        await this.#callHook(id, "ready", context);
        entry.status = "ready";
        steps.push({ module_id: id, hook: "ready", status: "fulfilled" });
      }
      this.state = "ready";
      return await this.#completeReceipt({
        runtime_status: "ready",
        started_at: startedAt,
        ended_at: this.now(),
        order,
        steps,
        rollback: [],
        formal_runtime_allowed: false,
      });
    } catch (error) {
      const rollback = await this.#rollback(context, error);
      this.state = "failed";
      const receipt = await this.#completeReceipt({
        runtime_status: "failed",
        started_at: startedAt,
        ended_at: this.now(),
        order,
        steps,
        rollback,
        error: normalizeError(error),
        formal_runtime_allowed: false,
      });
      if (this.errorBoundary) await this.errorBoundary.capture(error, { source: "module-loader.start", order });
      throw new RuntimeContractError("RUNTIME_START_FAILED", error?.message || "Runtime start failed", { receipt });
    }
  }

  async #rollback(context, cause) {
    const results = [];
    for (const id of [...this.started].reverse()) {
      const entry = this.modules.get(id);
      try {
        if (entry.hooks.rollback) await this.#callHook(id, "rollback", { ...context, cause });
        else if (entry.hooks.stop) await this.#callHook(id, "stop", { ...context, cause });
        entry.status = "rolled_back";
        results.push({ module_id: id, status: "fulfilled" });
      } catch (error) {
        entry.status = "rollback_failed";
        results.push({ module_id: id, status: "rejected", error: normalizeError(error) });
      }
    }
    this.started = [];
    return results;
  }

  async suspend(context = {}) {
    assertRecord(context, "runtime context");
    if (this.state !== "ready") {
      throw new RuntimeContractError("INVALID_LOADER_STATE", `cannot suspend loader from ${this.state}`);
    }
    const startedAt = this.now();
    const steps = [];
    this.state = "suspending";
    for (const id of [...this.started].reverse()) {
      const entry = this.modules.get(id);
      try {
        entry.status = "suspending";
        await this.#callHook(id, "suspend", context);
        entry.status = "suspended";
        steps.push({ module_id: id, hook: "suspend", status: "fulfilled" });
      } catch (error) {
        entry.status = "suspend_failed";
        steps.push({ module_id: id, hook: "suspend", status: "rejected", error: normalizeError(error) });
      }
    }
    this.state = steps.some(step => step.status === "rejected") ? "suspend_failed" : "suspended";
    const receipt = await this.#completeReceipt({
      runtime_status: this.state,
      started_at: startedAt,
      ended_at: this.now(),
      steps,
      formal_runtime_allowed: false,
    });
    if (this.state === "suspend_failed") {
      throw new RuntimeContractError("RUNTIME_SUSPEND_FAILED", "one or more modules failed to suspend", { receipt });
    }
    return receipt;
  }

  async resume(context = {}) {
    assertRecord(context, "runtime context");
    if (this.state !== "suspended") {
      throw new RuntimeContractError("INVALID_LOADER_STATE", `cannot resume loader from ${this.state}`);
    }
    const startedAt = this.now();
    const steps = [];
    const resumed = [];
    this.state = "resuming";
    try {
      for (const id of this.started) {
        const entry = this.modules.get(id);
        entry.status = "resuming";
        await this.#callHook(id, "resume", context);
        entry.status = "ready";
        resumed.push(id);
        steps.push({ module_id: id, hook: "resume", status: "fulfilled" });
      }
      this.state = "ready";
      return await this.#completeReceipt({
        runtime_status: "ready",
        started_at: startedAt,
        ended_at: this.now(),
        steps,
        recovery: [],
        formal_runtime_allowed: false,
      });
    } catch (error) {
      const recovery = [];
      for (const id of [...resumed].reverse()) {
        const entry = this.modules.get(id);
        try {
          await this.#callHook(id, "suspend", { ...context, cause: error });
          entry.status = "suspended";
          recovery.push({ module_id: id, status: "fulfilled" });
        } catch (recoveryError) {
          entry.status = "suspend_failed";
          recovery.push({ module_id: id, status: "rejected", error: normalizeError(recoveryError) });
        }
      }
      this.state = recovery.some(step => step.status === "rejected") ? "resume_recovery_failed" : "suspended";
      const receipt = await this.#completeReceipt({
        runtime_status: "resume_failed",
        loader_state: this.state,
        started_at: startedAt,
        ended_at: this.now(),
        steps,
        recovery,
        error: normalizeError(error),
        formal_runtime_allowed: false,
      });
      if (this.errorBoundary) await this.errorBoundary.capture(error, { source: "module-loader.resume", recovery });
      throw new RuntimeContractError("RUNTIME_RESUME_FAILED", error?.message || "Runtime resume failed", { receipt });
    }
  }

  async stop(context = {}) {
    assertRecord(context, "runtime context");
    if (!["ready", "suspended", "suspend_failed", "resume_recovery_failed", "stop_failed"].includes(this.state)) {
      if (["idle", "stopped", "failed"].includes(this.state) && this.started.length === 0) {
        return await this.#completeReceipt({
          runtime_status: "already_stopped",
          stopped_at: this.now(),
          steps: [],
          formal_runtime_allowed: false,
        });
      }
      throw new RuntimeContractError("INVALID_LOADER_STATE", `cannot stop loader from ${this.state}`);
    }
    const steps = [];
    this.state = "stopping";
    for (const id of [...this.started].reverse()) {
      const entry = this.modules.get(id);
      try {
        await this.#callHook(id, "stop", context);
        entry.status = "stopped";
        steps.push({ module_id: id, status: "fulfilled" });
      } catch (error) {
        entry.status = "stop_failed";
        steps.push({ module_id: id, status: "rejected", error: normalizeError(error) });
      }
    }
    this.started = [];
    this.state = steps.some(step => step.status === "rejected") ? "stop_failed" : "stopped";
    const receipt = await this.#completeReceipt({
      runtime_status: this.state,
      stopped_at: this.now(),
      steps,
      formal_runtime_allowed: false,
    });
    if (this.state === "stop_failed") {
      throw new RuntimeContractError("RUNTIME_STOP_FAILED", "one or more modules failed to stop", { receipt });
    }
    return receipt;
  }

  status() {
    return {
      state: this.state,
      order: [...this.order],
      started: [...this.started],
      modules: [...this.modules.entries()].map(([id, entry]) => ({
        id,
        status: entry.status,
        manifest: cloneValue(entry.manifest),
      })),
      lastReceipt: cloneValue(this.lastReceipt),
    };
  }

  async #completeReceipt(receipt) {
    await this.#storeReceipt(receipt);
    this.lastReceipt = receipt;
    return cloneValue(receipt);
  }

  async #storeReceipt(receipt) {
    if (this.receiptStore) {
      await this.receiptStore.append(receipt, { category: "lifecycle", source: "module-loader" });
    }
  }
}
