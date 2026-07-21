import { RuntimeContractError, assertRecord, cloneValue, hashRecord } from "./worldops_event_bus.js";

const STATUS = new Set(["queued", "sending", "acked", "conflict", "rejected", "superseded"]);
const COMMAND_FIELDS = [
  "command_id",
  "idempotency_key",
  "room_id",
  "session_id",
  "actor_member_id",
  "command_type",
  "expected_version",
  "payload",
  "client_time",
];

function requireId(value, name) {
  if (typeof value !== "string" || !value.trim() || /[\r\n]/.test(value)) {
    throw new RuntimeContractError("INVALID_OFFLINE_OPERATION_FIELD", `${name} must be a non-empty single-line string`);
  }
  return value;
}

function commandBody(command) {
  const body = {};
  for (const field of COMMAND_FIELDS) {
    if (field in command && command[field] !== undefined) body[field] = cloneValue(command[field]);
  }
  if (!("payload" in body)) body.payload = {};
  return body;
}

export class WorldOpsOfflineOperationQueue {
  constructor({ cache = null, cacheKey = "offline-operations", maxOperations = 5000, now = () => new Date().toISOString() } = {}) {
    this.cache = cache;
    this.cacheKey = cacheKey;
    this.maxOperations = Math.max(1, Number(maxOperations) || 5000);
    this.now = now;
    this.operations = [];
    this.blockedByConflict = null;
    this.authoritative = false;
  }

  async restore() {
    if (!this.cache) return this.export();
    const saved = this.cache.get(this.cacheKey, null);
    if (!saved) return this.export();
    assertRecord(saved, "offline queue cache");
    if (saved.authoritative !== false) {
      throw new RuntimeContractError("OFFLINE_QUEUE_AUTHORITY_INVALID", "cached offline queue must be explicitly non-authoritative");
    }
    if (!Array.isArray(saved.operations)) {
      throw new RuntimeContractError("INVALID_OFFLINE_QUEUE_CACHE", "cached operations must be an array");
    }
    const seenCommands = new Set();
    const seenIdempotency = new Set();
    const restored = [];
    for (const raw of saved.operations) {
      assertRecord(raw, "cached operation");
      requireId(raw.command_id, "command_id");
      requireId(raw.idempotency_key, "idempotency_key");
      if (!STATUS.has(raw.status)) {
        throw new RuntimeContractError("INVALID_OFFLINE_STATUS", `invalid cached status: ${raw.status}`);
      }
      if (seenCommands.has(raw.command_id)) {
        throw new RuntimeContractError("DUPLICATE_OFFLINE_COMMAND", `duplicate cached command: ${raw.command_id}`);
      }
      if (seenIdempotency.has(raw.idempotency_key)) {
        throw new RuntimeContractError("DUPLICATE_OFFLINE_IDEMPOTENCY_KEY", `duplicate cached idempotency key: ${raw.idempotency_key}`);
      }
      seenCommands.add(raw.command_id);
      seenIdempotency.add(raw.idempotency_key);
      this.#validateCommand(raw);
      const expectedHash = await hashRecord(commandBody(raw));
      if (raw.command_hash !== expectedHash) {
        throw new RuntimeContractError("OFFLINE_COMMAND_HASH_MISMATCH", `cached command hash mismatch: ${raw.command_id}`);
      }
      const operation = cloneValue(raw);
      operation.authoritative = false;
      if (operation.status === "sending") {
        operation.status = "queued";
        operation.interrupted_at = this.now();
      }
      restored.push(operation);
    }
    if (saved.blockedByConflict !== null && !restored.some(row => row.command_id === saved.blockedByConflict && row.status === "conflict")) {
      throw new RuntimeContractError("OFFLINE_CONFLICT_POINTER_INVALID", "blockedByConflict does not identify a conflict operation");
    }
    this.operations = restored;
    this.blockedByConflict = saved.blockedByConflict || null;
    await this.#persist();
    return this.export();
  }

  async enqueue(command) {
    const stored = await this.#prepare(command);
    this.operations.push(stored);
    await this.#persist();
    return cloneValue(stored);
  }

  nextBatch(limit = 20) {
    if (this.blockedByConflict) return [];
    return cloneValue(this.operations.filter(operation => operation.status === "queued").slice(0, Math.max(0, Number(limit) || 0)));
  }

  async markSending(commandId) {
    const operation = this.#require(commandId);
    if (operation.status !== "queued") {
      throw new RuntimeContractError("OFFLINE_OPERATION_NOT_QUEUED", `cannot send operation in ${operation.status}`);
    }
    operation.status = "sending";
    operation.attempt_count += 1;
    operation.last_attempt_at = this.now();
    await this.#persist();
    return cloneValue(operation);
  }

  async applyResponse(commandId, response) {
    assertRecord(response, "command response");
    const operation = this.#require(commandId);
    if (!["sending", "queued"].includes(operation.status)) {
      throw new RuntimeContractError("OFFLINE_RESPONSE_STATE_INVALID", `cannot apply response to operation in ${operation.status}`);
    }
    const mapping = { accepted: "acked", duplicate: "acked", conflict: "conflict", rejected: "rejected" };
    const nextStatus = mapping[response.status];
    if (!nextStatus) {
      throw new RuntimeContractError("INVALID_COMMAND_RESPONSE_STATUS", `unsupported response status: ${response.status}`);
    }
    operation.status = nextStatus;
    operation.response = cloneValue(response);
    operation.completed_at = this.now();
    if (nextStatus === "conflict") this.blockedByConflict = commandId;
    await this.#persist();
    return cloneValue(operation);
  }

  async rebaseConflict(commandId, replacement) {
    const original = this.#require(commandId);
    if (original.status !== "conflict" || this.blockedByConflict !== commandId) {
      throw new RuntimeContractError("OFFLINE_CONFLICT_NOT_ACTIVE", "operation is not the active conflict");
    }
    assertRecord(replacement, "replacement command");
    if (replacement.command_id === original.command_id || replacement.idempotency_key === original.idempotency_key) {
      throw new RuntimeContractError("REBASE_REQUIRES_NEW_IDENTITY", "rebased command requires a new command_id and idempotency_key");
    }
    const queued = await this.#prepare(replacement);
    original.status = "superseded";
    original.superseded_at = this.now();
    original.superseded_by = replacement.command_id;
    this.blockedByConflict = null;
    this.operations.push(queued);
    await this.#persist();
    return cloneValue(queued);
  }

  async discardTerminal(commandId) {
    const operation = this.#require(commandId);
    if (!["rejected", "superseded", "acked"].includes(operation.status)) {
      throw new RuntimeContractError("OFFLINE_OPERATION_NOT_TERMINAL", `cannot discard operation in ${operation.status}`);
    }
    this.operations = this.operations.filter(row => row.command_id !== commandId);
    await this.#persist();
    return true;
  }

  async discardRejected(commandId) {
    return this.discardTerminal(commandId);
  }

  export() {
    return cloneValue({ operations: this.operations, blockedByConflict: this.blockedByConflict, authoritative: false });
  }

  #validateCommand(command) {
    assertRecord(command, "command");
    const required = ["command_id", "idempotency_key", "room_id", "session_id", "actor_member_id", "command_type"];
    for (const field of required) requireId(command[field], field);
    if (!Number.isInteger(command.expected_version) || command.expected_version < 0) {
      throw new RuntimeContractError("INVALID_EXPECTED_VERSION", "expected_version must be a non-negative integer");
    }
    assertRecord(command.payload ?? {}, "command payload");
  }

  async #prepare(command) {
    this.#validateCommand(command);
    if (this.operations.some(operation => operation.command_id === command.command_id)) {
      throw new RuntimeContractError("DUPLICATE_OFFLINE_COMMAND", `command already queued: ${command.command_id}`);
    }
    if (this.operations.some(operation => operation.idempotency_key === command.idempotency_key)) {
      throw new RuntimeContractError("DUPLICATE_OFFLINE_IDEMPOTENCY_KEY", `idempotency key already queued: ${command.idempotency_key}`);
    }
    if (this.operations.length >= this.maxOperations) {
      throw new RuntimeContractError("OFFLINE_QUEUE_FULL", `offline queue reached ${this.maxOperations} operations`);
    }
    const body = commandBody(command);
    return {
      ...body,
      status: "queued",
      queued_at: this.now(),
      attempt_count: 0,
      response: null,
      command_hash: await hashRecord(body),
      authoritative: false,
    };
  }

  #require(commandId) {
    requireId(commandId, "commandId");
    const operation = this.operations.find(row => row.command_id === commandId);
    if (!operation) {
      throw new RuntimeContractError("OFFLINE_OPERATION_NOT_FOUND", `offline operation not found: ${commandId}`);
    }
    return operation;
  }

  async #persist() {
    if (this.cache) await this.cache.set(this.cacheKey, this.export());
  }
}
