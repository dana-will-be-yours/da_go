import { RuntimeContractError, assertRecord, cloneValue, hashRecord } from "./worldops_event_bus.js";

const ID_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;

function normalizeManifest(manifest) {
  assertRecord(manifest, "macro manifest");
  if (typeof manifest.id !== "string" || !ID_PATTERN.test(manifest.id)) {
    throw new RuntimeContractError("INVALID_MACRO_ID", "macro id must use lowercase stable identifiers");
  }
  if (typeof manifest.version !== "string" || !manifest.version.trim()) {
    throw new RuntimeContractError("INVALID_MACRO_VERSION", "macro version is required");
  }
  const capabilities = manifest.capabilities ?? [];
  if (!Array.isArray(capabilities) || capabilities.some(value => typeof value !== "string" || !value.trim())) {
    throw new RuntimeContractError("INVALID_MACRO_CAPABILITIES", "macro capabilities must be strings");
  }
  return Object.freeze({
    id: manifest.id,
    version: manifest.version,
    description: String(manifest.description || ""),
    capabilities: Object.freeze([...new Set(capabilities)]),
    deterministic: manifest.deterministic !== false,
    canonWriteAllowed: false,
  });
}

export class WorldOpsMacroRegistry {
  constructor({ now = () => new Date().toISOString(), maxReceipts = 1000 } = {}) {
    this.now = now;
    this.maxReceipts = Math.max(1, Number(maxReceipts) || 1000);
    this.entries = new Map();
    this.invocationSeq = 0;
    this.receipts = [];
  }

  register(manifest, handler) {
    const normalized = normalizeManifest(manifest);
    if (typeof handler !== "function") {
      throw new RuntimeContractError("INVALID_MACRO_HANDLER", "macro handler must be a function");
    }
    if (this.entries.has(normalized.id)) {
      throw new RuntimeContractError("DUPLICATE_MACRO", `macro already registered: ${normalized.id}`);
    }
    this.entries.set(normalized.id, { manifest: normalized, handler });
    return cloneValue(normalized);
  }

  unregister(id) {
    return this.entries.delete(id);
  }

  list() {
    return [...this.entries.values()].map(entry => cloneValue(entry.manifest));
  }

  async invoke(id, input = {}, context = {}) {
    assertRecord(input, "macro input");
    assertRecord(context, "macro context");
    const entry = this.entries.get(id);
    if (!entry) throw new RuntimeContractError("UNKNOWN_MACRO", `macro is not registered: ${id}`);
    const available = new Set(Array.isArray(context.capabilities) ? context.capabilities : []);
    const missing = entry.manifest.capabilities.filter(capability => !available.has(capability));
    if (missing.length) {
      throw new RuntimeContractError("MACRO_CAPABILITY_DENIED", `missing macro capabilities: ${missing.join(", ")}`, { missing });
    }

    const startedAt = this.now();
    const invocationId = `macro-${++this.invocationSeq}`;
    try {
      const output = await entry.handler(cloneValue(input), context);
      const receipt = {
        invocation_id: invocationId,
        macro_id: id,
        macro_version: entry.manifest.version,
        started_at: startedAt,
        ended_at: this.now(),
        input_hash: await hashRecord(input),
        output_hash: await hashRecord(output),
        status: "fulfilled",
      };
      this.#pushReceipt(receipt);
      return { output: cloneValue(output), receipt: cloneValue(receipt) };
    } catch (error) {
      const receipt = {
        invocation_id: invocationId,
        macro_id: id,
        macro_version: entry.manifest.version,
        started_at: startedAt,
        ended_at: this.now(),
        input_hash: await hashRecord(input),
        output_hash: null,
        status: "rejected",
        error: {
          name: error?.name || "Error",
          code: error?.code || null,
          message: error?.message || "Unknown macro error",
        },
      };
      this.#pushReceipt(receipt);
      throw error;
    }
  }

  #pushReceipt(receipt) {
    this.receipts.push(receipt);
    if (this.receipts.length > this.maxReceipts) this.receipts.shift();
  }

  exportReceipts() {
    return cloneValue(this.receipts);
  }
}
