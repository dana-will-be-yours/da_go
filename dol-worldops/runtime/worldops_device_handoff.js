import { RuntimeContractError, assertRecord, cloneValue } from "./worldops_event_bus.js";

export class WorldOpsDeviceHandoffClient {
  constructor({ transport, now = () => new Date().toISOString() } = {}) {
    assertRecord(transport, "handoff transport");
    if (typeof transport.issue !== "function" || typeof transport.consume !== "function") {
      throw new RuntimeContractError("INVALID_HANDOFF_TRANSPORT", "transport.issue and transport.consume are required");
    }
    this.transport = transport;
    this.now = now;
    this.pending = null;
    this.authoritative = false;
  }

  async issue(request) {
    assertRecord(request, "handoff issue request");
    if (this.pending) {
      throw new RuntimeContractError("HANDOFF_EXPORT_REQUIRED", "the existing handoff must be exported before issuing another");
    }
    const result = await this.transport.issue(cloneValue(request));
    assertRecord(result, "handoff issue response");
    if (typeof result.handoff_token !== "string" || result.handoff_token.length < 32) {
      throw new RuntimeContractError("INVALID_HANDOFF_TOKEN", "server did not return a valid handoff token");
    }
    this.pending = {
      handoff_id: result.handoff_id,
      handoff_token: result.handoff_token,
      room_id: result.room_id,
      session_id: result.session_id,
      target_device_class: result.target_device_class,
      cursor: result.cursor,
      received_at: this.now(),
    };
    return cloneValue(this.pending);
  }

  exportTransferPayload() {
    if (!this.pending) throw new RuntimeContractError("HANDOFF_NOT_ISSUED", "no pending handoff exists");
    const payload = cloneValue(this.pending);
    this.pending = null;
    return payload;
  }

  async consume(payload, targetDevice) {
    assertRecord(payload, "handoff payload");
    assertRecord(targetDevice, "target device");
    if (typeof targetDevice.device_id !== "string" || typeof targetDevice.device_class !== "string") {
      throw new RuntimeContractError("INVALID_TARGET_DEVICE", "target device_id and device_class are required");
    }
    if (payload.target_device_class !== targetDevice.device_class) {
      throw new RuntimeContractError("HANDOFF_DEVICE_CLASS_MISMATCH", "target device class does not match the handoff payload");
    }
    const result = await this.transport.consume({
      handoff_token: payload.handoff_token,
      room_id: payload.room_id,
      session_id: payload.session_id,
      target_device_id: targetDevice.device_id,
      target_device_class: targetDevice.device_class,
    });
    assertRecord(result, "handoff consume response");
    if (result.status !== "consumed") throw new RuntimeContractError("HANDOFF_NOT_CONSUMED", "handoff was not consumed");
    return cloneValue(result);
  }
}
