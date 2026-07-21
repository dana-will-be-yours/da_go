import { RuntimeContractError, assertRecord, cloneValue, hashRecord } from "./worldops_event_bus.js";

function requireString(value, name) {
  if (typeof value !== "string" || !value.trim()) throw new RuntimeContractError("INVALID_SNAPSHOT_FIELD", `${name} is required`);
  return value;
}

function normalizeSnapshot(snapshot, { roomId, schemaVersion }) {
  assertRecord(snapshot, "room snapshot");
  const normalized = {
    snapshot_id: requireString(snapshot.snapshot_id || `initial-${roomId}`, "snapshot_id"),
    room_id: requireString(snapshot.room_id, "room_id"),
    room_version: Number(snapshot.room_version),
    schema_version: requireString(String(snapshot.schema_version ?? ""), "schema_version"),
    cursor: snapshot.cursor ?? null,
    created_at: snapshot.created_at ?? null,
    state: cloneValue(snapshot.state ?? {}),
    authoritative: Boolean(snapshot.authoritative),
  };
  assertRecord(normalized.state, "snapshot state");
  if (normalized.room_id !== roomId) throw new RuntimeContractError("SNAPSHOT_ROOM_MISMATCH", "snapshot room does not match request");
  if (normalized.schema_version !== String(schemaVersion)) throw new RuntimeContractError("SNAPSHOT_SCHEMA_MISMATCH", "snapshot schema does not match runtime schema");
  if (!Number.isInteger(normalized.room_version) || normalized.room_version < 0) throw new RuntimeContractError("INVALID_SNAPSHOT_VERSION", "snapshot room_version must be a non-negative integer");
  if (normalized.authoritative !== true) throw new RuntimeContractError("UNTRUSTED_SNAPSHOT", "server snapshot must be marked authoritative");
  return normalized;
}

export class WorldOpsSnapshotManager {
  constructor({ adapter, cache, schemaVersion = "1", now = () => new Date().toISOString(), maxReceipts = 500 } = {}) {
    assertRecord(adapter, "snapshot adapter");
    if (typeof adapter.load !== "function") throw new RuntimeContractError("INVALID_SNAPSHOT_ADAPTER", "snapshot adapter.load is required");
    if (!cache || typeof cache.set !== "function" || typeof cache.get !== "function") throw new RuntimeContractError("INVALID_SNAPSHOT_CACHE", "a client cache adapter is required");
    this.adapter = adapter;
    this.cache = cache;
    this.schemaVersion = String(schemaVersion);
    this.now = now;
    this.maxReceipts = Math.max(1, Number(maxReceipts) || 500);
    this.current = null;
    this.receipts = [];
  }

  #key(roomId) {
    return `room.${roomId}.snapshot`;
  }

  async hydrate({ roomId, sessionId, cursor = null } = {}) {
    requireString(roomId, "roomId");
    requireString(sessionId, "sessionId");
    const startedAt = this.now();
    const source = await this.adapter.load({ room_id: roomId, session_id: sessionId, cursor, schema_version: this.schemaVersion });
    const snapshot = normalizeSnapshot(source, { roomId, schemaVersion: this.schemaVersion });
    this.current = Object.freeze(cloneValue(snapshot));
    await this.cache.set(this.#key(roomId), snapshot);
    const receipt = {
      hydrated_at: this.now(),
      started_at: startedAt,
      room_id: roomId,
      session_id: sessionId,
      snapshot_id: snapshot.snapshot_id,
      room_version: snapshot.room_version,
      snapshot_hash: await hashRecord(snapshot),
      cache_authoritative: false,
      formal_runtime_allowed: false,
    };
    this.#pushReceipt(receipt);
    return { snapshot: cloneValue(snapshot), receipt: cloneValue(receipt) };
  }

  readLocal(roomId) {
    requireString(roomId, "roomId");
    return this.cache.get(this.#key(roomId), null);
  }

  async requestSnapshot({ roomId, sessionId, expectedVersion, reason = "manual", clientStateDigest = null } = {}) {
    requireString(roomId, "roomId");
    requireString(sessionId, "sessionId");
    if (!Number.isInteger(Number(expectedVersion)) || Number(expectedVersion) < 0) {
      throw new RuntimeContractError("INVALID_EXPECTED_VERSION", "expectedVersion must be a non-negative integer");
    }
    if (typeof this.adapter.requestSnapshot !== "function") {
      throw new RuntimeContractError("SNAPSHOT_REQUEST_UNAVAILABLE", "snapshot adapter.requestSnapshot is required");
    }
    const response = await this.adapter.requestSnapshot({
      room_id: roomId,
      session_id: sessionId,
      expected_version: Number(expectedVersion),
      reason: String(reason),
      client_state_digest: clientStateDigest,
    });
    assertRecord(response, "snapshot request response");
    if (response.accepted !== true) {
      throw new RuntimeContractError("SNAPSHOT_REQUEST_REJECTED", response.reason || "snapshot request was rejected", { response: cloneValue(response) });
    }
    const receipt = {
      requested_at: this.now(),
      room_id: roomId,
      session_id: sessionId,
      expected_version: Number(expectedVersion),
      reason: String(reason),
      request_id: response.request_id ?? null,
      accepted: true,
      authoritative_snapshot_written_by_client: false,
      formal_runtime_allowed: false,
    };
    this.#pushReceipt(receipt);
    return cloneValue(receipt);
  }

  clearLocal(roomId) {
    requireString(roomId, "roomId");
    this.cache.remove(this.#key(roomId));
    if (this.current?.room_id === roomId) this.current = null;
  }

  #pushReceipt(receipt) {
    this.receipts.push(receipt);
    if (this.receipts.length > this.maxReceipts) this.receipts.shift();
  }

  exportReceipts() {
    return cloneValue(this.receipts);
  }
}
