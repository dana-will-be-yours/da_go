import assert from "node:assert/strict";
import { MemoryStorage, WorldOpsClientCache } from "../runtime/worldops_cache_adapter.js";
import { WorldOpsDeviceHandoffClient } from "../runtime/worldops_device_handoff.js";
import { WorldOpsOfflineOperationQueue } from "../runtime/worldops_offline_queue.js";

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

async function rejectsCode(fn, code) {
  await assert.rejects(fn, error => error?.code === code);
}

function command(id, key, expectedVersion = 0) {
  return {
    command_id: id,
    idempotency_key: key,
    room_id: "ROOM-1",
    session_id: "SESSION-1",
    actor_member_id: "MEMBER-1",
    command_type: "room.message.append",
    expected_version: expectedVersion,
    payload: { text: id },
  };
}

test("offline queue persists non-authoritative queued commands", async () => {
  const cache = new WorldOpsClientCache({ namespace: "p04", storage: new MemoryStorage() });
  const queue = new WorldOpsOfflineOperationQueue({ cache });
  await queue.enqueue(command("CMD-1", "IDEM-1"));
  assert.equal(queue.nextBatch().length, 1);
  assert.equal(queue.export().authoritative, false);
  const restored = new WorldOpsOfflineOperationQueue({ cache });
  await restored.restore();
  assert.equal(restored.nextBatch()[0].command_id, "CMD-1");
});

test("queue blocks duplicate command and idempotency identities", async () => {
  const queue = new WorldOpsOfflineOperationQueue();
  await queue.enqueue(command("CMD-1", "IDEM-1"));
  await rejectsCode(() => queue.enqueue(command("CMD-1", "IDEM-2")), "DUPLICATE_OFFLINE_COMMAND");
  await rejectsCode(() => queue.enqueue(command("CMD-2", "IDEM-1")), "DUPLICATE_OFFLINE_IDEMPOTENCY_KEY");
});

test("accepted and duplicate responses terminate operations", async () => {
  const queue = new WorldOpsOfflineOperationQueue();
  await queue.enqueue(command("CMD-1", "IDEM-1"));
  await queue.markSending("CMD-1");
  const acked = await queue.applyResponse("CMD-1", { status: "accepted", room_version: 1 });
  assert.equal(acked.status, "acked");
  assert.equal(queue.nextBatch().length, 0);
});

test("version conflict blocks later sends until explicit rebase", async () => {
  const queue = new WorldOpsOfflineOperationQueue();
  await queue.enqueue(command("CMD-1", "IDEM-1", 0));
  await queue.enqueue(command("CMD-2", "IDEM-2", 1));
  await queue.markSending("CMD-1");
  await queue.applyResponse("CMD-1", { status: "conflict", current_version: 5 });
  assert.deepEqual(queue.nextBatch(), []);
  await rejectsCode(
    () => queue.rebaseConflict("CMD-1", command("CMD-1", "IDEM-3", 5)),
    "REBASE_REQUIRES_NEW_IDENTITY",
  );
  await queue.rebaseConflict("CMD-1", command("CMD-3", "IDEM-3", 5));
  assert.deepEqual(queue.nextBatch().map(row => row.command_id), ["CMD-2", "CMD-3"]);
});

test("restore requeues interrupted sends and rejects tampered cached commands", async () => {
  const storage = new MemoryStorage();
  const cache = new WorldOpsClientCache({ namespace: "p04-restore", storage });
  const queue = new WorldOpsOfflineOperationQueue({ cache });
  await queue.enqueue(command("CMD-1", "IDEM-1"));
  await queue.markSending("CMD-1");
  const restored = new WorldOpsOfflineOperationQueue({ cache });
  await restored.restore();
  assert.equal(restored.nextBatch()[0].status, "queued");
  assert.ok(restored.nextBatch()[0].interrupted_at);

  const raw = JSON.parse(storage.getItem("p04-restore:offline-operations"));
  raw.value.operations[0].payload.text = "tampered";
  storage.setItem("p04-restore:offline-operations", JSON.stringify(raw));
  const tampered = new WorldOpsOfflineOperationQueue({ cache });
  await rejectsCode(() => tampered.restore(), "OFFLINE_COMMAND_HASH_MISMATCH");
});

test("failed conflict rebase leaves the original conflict active", async () => {
  const queue = new WorldOpsOfflineOperationQueue();
  await queue.enqueue(command("CMD-1", "IDEM-1", 0));
  await queue.enqueue(command("CMD-2", "IDEM-2", 1));
  await queue.markSending("CMD-1");
  await queue.applyResponse("CMD-1", { status: "conflict", current_version: 5 });
  await rejectsCode(
    () => queue.rebaseConflict("CMD-1", command("CMD-2", "IDEM-3", 5)),
    "DUPLICATE_OFFLINE_COMMAND",
  );
  assert.equal(queue.export().blockedByConflict, "CMD-1");
  assert.equal(queue.export().operations.find(row => row.command_id === "CMD-1").status, "conflict");
});

test("handoff client exports plaintext token once without client authority", async () => {
  const calls = [];
  const client = new WorldOpsDeviceHandoffClient({
    transport: {
      issue: async request => ({
        handoff_id: "H-1",
        handoff_token: "x".repeat(40),
        room_id: request.room_id,
        session_id: request.session_id,
        target_device_class: request.target_device_class,
        cursor: request.cursor,
      }),
      consume: async request => { calls.push(request); return { status: "consumed", cursor: 9 }; },
    },
  });
  await client.issue({ room_id: "ROOM-1", session_id: "SESSION-1", target_device_class: "mobile", cursor: 9 });
  await rejectsCode(
    () => client.issue({ room_id: "ROOM-1", session_id: "SESSION-1", target_device_class: "mobile", cursor: 9 }),
    "HANDOFF_EXPORT_REQUIRED",
  );
  const payload = client.exportTransferPayload();
  await rejectsCode(async () => client.exportTransferPayload(), "HANDOFF_NOT_ISSUED");
  await rejectsCode(
    () => client.consume(payload, { device_id: "TABLET-1", device_class: "tablet" }),
    "HANDOFF_DEVICE_CLASS_MISMATCH",
  );
  const result = await client.consume(payload, { device_id: "PHONE-1", device_class: "mobile" });
  assert.equal(result.status, "consumed");
  assert.equal(client.authoritative, false);
  assert.equal(calls[0].target_device_id, "PHONE-1");
});

let passed = 0;
for (const { name, fn } of tests) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
    break;
  }
}
console.log(`${passed}/${tests.length} P04 offline queue and handoff tests passed`);
