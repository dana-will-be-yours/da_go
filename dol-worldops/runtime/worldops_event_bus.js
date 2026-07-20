export class RuntimeContractError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "RuntimeContractError";
    this.code = code;
    this.details = details;
  }
}

export function assertRecord(value, name = "value") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RuntimeContractError("INVALID_RECORD", `${name} must be a plain object`);
  }
}

export function cloneValue(value) {
  if (value === undefined || value === null || typeof value !== "object") return value;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function canonicalize(value) {
  if (value === null || typeof value !== "object") {
    if (typeof value === "number" && !Number.isFinite(value)) return String(value);
    if (typeof value === "undefined") return null;
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalize);
  const out = {};
  for (const key of Object.keys(value).sort()) out[key] = canonicalize(value[key]);
  return out;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export async function hashRecord(value) {
  const data = new TextEncoder().encode(canonicalJson(value));
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(digest)]
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  let hash = 2166136261;
  for (const byte of data) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function normalizeCapabilities(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some(item => typeof item !== "string" || !item.trim())) {
    throw new RuntimeContractError("INVALID_CAPABILITIES", "capabilities must be an array of non-empty strings");
  }
  return [...new Set(value)];
}

export class WorldOpsEventBus {
  constructor({ now = () => new Date().toISOString(), maxReceipts = 1000 } = {}) {
    this.now = now;
    this.maxReceipts = Math.max(1, Number(maxReceipts) || 1000);
    this.listeners = new Map();
    this.receipts = [];
    this.listenerSeq = 0;
    this.receiptSeq = 0;
  }

  on(eventType, handler, { once = false, priority = 0, capability = null } = {}) {
    if (typeof eventType !== "string" || !eventType.trim()) {
      throw new RuntimeContractError("INVALID_EVENT", "eventType is required");
    }
    if (typeof handler !== "function") {
      throw new RuntimeContractError("INVALID_HANDLER", "handler must be a function");
    }
    if (capability !== null && (typeof capability !== "string" || !capability.trim())) {
      throw new RuntimeContractError("INVALID_CAPABILITY", "capability must be null or a non-empty string");
    }
    const entry = {
      id: `listener-${++this.listenerSeq}`,
      handler,
      once: Boolean(once),
      priority: Number(priority) || 0,
      capability: capability || null,
    };
    const list = this.listeners.get(eventType) || [];
    list.push(entry);
    list.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
    this.listeners.set(eventType, list);
    return () => this.off(eventType, entry.id);
  }

  off(eventType, listenerId) {
    const list = this.listeners.get(eventType) || [];
    const next = list.filter(entry => entry.id !== listenerId);
    if (next.length) this.listeners.set(eventType, next);
    else this.listeners.delete(eventType);
  }

  async emit(eventType, payload = {}, context = {}) {
    if (typeof eventType !== "string" || !eventType.trim()) {
      throw new RuntimeContractError("INVALID_EVENT", "eventType is required");
    }
    assertRecord(payload, "payload");
    assertRecord(context, "context");
    const startedAt = this.now();
    const list = [...(this.listeners.get(eventType) || [])];
    const availableCapabilities = new Set(normalizeCapabilities(context.capabilities));
    const outcomes = [];

    for (const entry of list) {
      if (entry.capability && !availableCapabilities.has(entry.capability)) {
        outcomes.push({ listener_id: entry.id, status: "skipped_capability" });
        continue;
      }
      try {
        const value = await entry.handler(cloneValue(payload), context);
        outcomes.push({ listener_id: entry.id, status: "fulfilled", value: cloneValue(value) });
      } catch (error) {
        outcomes.push({
          listener_id: entry.id,
          status: "rejected",
          error: {
            name: error?.name || "Error",
            code: error?.code || null,
            message: error?.message || "Unknown runtime error",
          },
        });
      } finally {
        if (entry.once) this.off(eventType, entry.id);
      }
    }

    const receipt = {
      receipt_id: `event-${++this.receiptSeq}`,
      event_type: eventType,
      started_at: startedAt,
      ended_at: this.now(),
      listener_count: list.length,
      outcomes,
      payload_hash: await hashRecord(payload),
    };
    this.receipts.push(receipt);
    if (this.receipts.length > this.maxReceipts) this.receipts.shift();
    return cloneValue(receipt);
  }

  exportReceipts() {
    return cloneValue(this.receipts);
  }

  clearReceipts() {
    this.receipts.length = 0;
  }
}
