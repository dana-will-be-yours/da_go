import { RuntimeContractError, assertRecord, cloneValue, hashRecord } from "./worldops_event_bus.js";

function requireString(value, name) {
  if (typeof value !== "string" || !value.trim()) throw new RuntimeContractError("INVALID_HANDSHAKE_FIELD", `${name} is required`);
  return value;
}

function normalizeCapabilities(values) {
  if (!Array.isArray(values) || values.some(value => typeof value !== "string" || !value.trim())) {
    throw new RuntimeContractError("INVALID_HANDSHAKE_CAPABILITIES", "handshake capabilities must be non-empty strings");
  }
  return [...new Set(values)].sort();
}

export class WorldOpsSessionHandshake {
  constructor({ transport, now = () => new Date().toISOString(), maxReceipts = 100 } = {}) {
    assertRecord(transport, "handshake transport");
    if (typeof transport.open !== "function") throw new RuntimeContractError("INVALID_HANDSHAKE_TRANSPORT", "transport.open is required");
    this.transport = transport;
    this.now = now;
    this.maxReceipts = Math.max(1, Number(maxReceipts) || 100);
    this.state = "closed";
    this.current = null;
    this.receipts = [];
  }

  async open(request) {
    assertRecord(request, "handshake request");
    if (this.state !== "closed") throw new RuntimeContractError("HANDSHAKE_ALREADY_OPEN", "a session handshake is already open");
    const normalized = {
      client_id: requireString(request.clientId, "clientId"),
      room_id: requireString(request.roomId, "roomId"),
      runtime_version: requireString(request.runtimeVersion, "runtimeVersion"),
      schema_version: requireString(String(request.schemaVersion ?? ""), "schemaVersion"),
      device_mode: requireString(request.deviceMode || "desktop", "deviceMode"),
      credential: request.credential ?? null,
      last_cursor: request.lastCursor ?? null,
    };
    if (normalized.credential !== null && typeof normalized.credential !== "string") {
      throw new RuntimeContractError("INVALID_HANDSHAKE_CREDENTIAL", "credential must be null or a string");
    }
    this.state = "opening";
    const openedAt = this.now();
    try {
      const response = await this.transport.open(cloneValue(normalized));
      assertRecord(response, "handshake response");
      if (response.accepted !== true) {
        throw new RuntimeContractError("HANDSHAKE_REJECTED", response.reason || "server rejected the session handshake");
      }
      const session = {
        session_id: requireString(response.session_id, "response.session_id"),
        room_id: requireString(response.room_id, "response.room_id"),
        room_version: Number(response.room_version),
        schema_version: requireString(String(response.schema_version ?? ""), "response.schema_version"),
        snapshot_cursor: response.snapshot_cursor ?? null,
        server_time: response.server_time ?? null,
        capabilities: normalizeCapabilities(response.capabilities ?? []),
        formal_runtime_allowed: false,
      };
      if (session.room_id !== normalized.room_id) throw new RuntimeContractError("HANDSHAKE_ROOM_MISMATCH", "server returned a different room id");
      if (!Number.isInteger(session.room_version) || session.room_version < 0) throw new RuntimeContractError("INVALID_ROOM_VERSION", "room_version must be a non-negative integer");
      if (session.schema_version !== normalized.schema_version) {
        throw new RuntimeContractError("HANDSHAKE_SCHEMA_MISMATCH", "server and client schema versions differ", {
          client: normalized.schema_version,
          server: session.schema_version,
        });
      }
      this.current = Object.freeze(cloneValue(session));
      this.state = "open";
      const receipt = {
        opened_at: openedAt,
        completed_at: this.now(),
        session_id: session.session_id,
        room_id: session.room_id,
        room_version: session.room_version,
        credential_hash: normalized.credential === null ? null : await hashRecord({ credential: normalized.credential }),
        request_hash: await hashRecord({ ...normalized, credential: normalized.credential === null ? null : "[REDACTED]" }),
        response_hash: await hashRecord(session),
        status: "open",
        formal_runtime_allowed: false,
      };
      this.#pushReceipt(receipt);
      return { session: cloneValue(session), receipt: cloneValue(receipt) };
    } catch (error) {
      this.state = "closed";
      this.current = null;
      const receipt = {
        opened_at: openedAt,
        completed_at: this.now(),
        room_id: normalized.room_id,
        status: "rejected",
        error: { name: error?.name || "Error", code: error?.code || null, message: error?.message || "Unknown handshake error" },
        formal_runtime_allowed: false,
      };
      this.#pushReceipt(receipt);
      throw error;
    }
  }

  async close(context = {}) {
    assertRecord(context, "handshake close context");
    if (this.state === "closed") return { status: "already_closed", formal_runtime_allowed: false };
    const session = cloneValue(this.current);
    let closeError = null;
    try {
      if (typeof this.transport.close === "function") await this.transport.close({ session, context: cloneValue(context) });
    } catch (error) {
      closeError = error;
    } finally {
      this.current = null;
      this.state = "closed";
    }
    const receipt = {
      closed_at: this.now(),
      session_id: session?.session_id ?? null,
      room_id: session?.room_id ?? null,
      status: closeError ? "close_failed" : "closed",
      error: closeError ? { name: closeError?.name || "Error", code: closeError?.code || null, message: closeError?.message || "Unknown close error" } : null,
      formal_runtime_allowed: false,
    };
    this.#pushReceipt(receipt);
    if (closeError) throw new RuntimeContractError("HANDSHAKE_CLOSE_FAILED", closeError.message, { receipt });
    return cloneValue(receipt);
  }

  #pushReceipt(receipt) {
    this.receipts.push(receipt);
    if (this.receipts.length > this.maxReceipts) this.receipts.shift();
  }

  exportReceipts() {
    return cloneValue(this.receipts);
  }
}
