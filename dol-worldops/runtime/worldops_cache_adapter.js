import { RuntimeContractError, cloneValue, hashRecord } from "./worldops_event_bus.js";

class MemoryStorage {
  constructor() {
    this.map = new Map();
  }

  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.map.set(key, String(value));
  }

  removeItem(key) {
    this.map.delete(key);
  }

  key(index) {
    return [...this.map.keys()][index] ?? null;
  }

  get length() {
    return this.map.size;
  }
}

function validateKey(key) {
  if (typeof key !== "string" || !key.trim() || key.includes("\n")) {
    throw new RuntimeContractError("INVALID_CACHE_KEY", "cache key must be a non-empty single-line string");
  }
}

export class WorldOpsClientCache {
  constructor({
    namespace = "worldops",
    schemaVersion = "1",
    storage = globalThis.localStorage,
    nowMs = () => Date.now(),
    nowIso = () => new Date().toISOString(),
    defaultTtlMs = null,
    maxReceipts = 1000,
  } = {}) {
    if (typeof namespace !== "string" || !namespace.trim()) {
      throw new RuntimeContractError("INVALID_CACHE_NAMESPACE", "cache namespace is required");
    }
    this.namespace = namespace;
    this.schemaVersion = String(schemaVersion);
    this.storage = storage || new MemoryStorage();
    this.nowMs = nowMs;
    this.nowIso = nowIso;
    this.defaultTtlMs = defaultTtlMs;
    this.maxReceipts = Math.max(1, Number(maxReceipts) || 1000);
    this.authoritative = false;
    this.receipts = [];
  }

  #storageKey(key) {
    validateKey(key);
    return `${this.namespace}:${key}`;
  }

  async set(key, value, { ttlMs = this.defaultTtlMs } = {}) {
    const createdAtMs = this.nowMs();
    const envelope = {
      schema_version: this.schemaVersion,
      authoritative: false,
      created_at: this.nowIso(),
      created_at_ms: createdAtMs,
      expires_at_ms: ttlMs === null ? null : createdAtMs + Math.max(0, Number(ttlMs) || 0),
      value: cloneValue(value),
    };
    this.storage.setItem(this.#storageKey(key), JSON.stringify(envelope));
    this.#pushReceipt({
      operation: "set",
      key,
      at: this.nowIso(),
      value_hash: await hashRecord(value),
      authoritative: false,
    });
    return cloneValue(envelope);
  }

  get(key, fallback = null) {
    const storageKey = this.#storageKey(key);
    const raw = this.storage.getItem(storageKey);
    if (raw === null) return cloneValue(fallback);
    try {
      const envelope = JSON.parse(raw);
      if (envelope.schema_version !== this.schemaVersion) {
        this.storage.removeItem(storageKey);
        this.#pushReceipt({ operation: "schema_miss", key, at: this.nowIso(), authoritative: false });
        return cloneValue(fallback);
      }
      if (envelope.expires_at_ms !== null && this.nowMs() >= envelope.expires_at_ms) {
        this.storage.removeItem(storageKey);
        this.#pushReceipt({ operation: "expired", key, at: this.nowIso(), authoritative: false });
        return cloneValue(fallback);
      }
      this.#pushReceipt({ operation: "get", key, at: this.nowIso(), authoritative: false });
      return cloneValue(envelope.value);
    } catch {
      this.storage.removeItem(storageKey);
      this.#pushReceipt({ operation: "corrupt", key, at: this.nowIso(), authoritative: false });
      return cloneValue(fallback);
    }
  }

  remove(key) {
    this.storage.removeItem(this.#storageKey(key));
    this.#pushReceipt({ operation: "remove", key, at: this.nowIso(), authoritative: false });
  }

  clear() {
    const prefix = `${this.namespace}:`;
    const keys = [];
    for (let index = 0; index < this.storage.length; index += 1) {
      const key = this.storage.key(index);
      if (key?.startsWith(prefix)) keys.push(key);
    }
    for (const key of keys) this.storage.removeItem(key);
    this.#pushReceipt({ operation: "clear", count: keys.length, at: this.nowIso(), authoritative: false });
    return keys.length;
  }

  #pushReceipt(receipt) {
    this.receipts.push(receipt);
    if (this.receipts.length > this.maxReceipts) this.receipts.shift();
  }

  exportReceipts() {
    return cloneValue(this.receipts);
  }
}
