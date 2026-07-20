import { RuntimeContractError, assertRecord, cloneValue, hashRecord } from "./worldops_event_bus.js";

const ID_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const DEVICE_MODES = new Set(["desktop", "tablet", "mobile"]);

function normalizeManifest(manifest) {
  assertRecord(manifest, "widget manifest");
  if (typeof manifest.id !== "string" || !ID_PATTERN.test(manifest.id)) {
    throw new RuntimeContractError("INVALID_WIDGET_ID", "widget id must use lowercase stable identifiers");
  }
  if (typeof manifest.version !== "string" || !manifest.version.trim()) {
    throw new RuntimeContractError("INVALID_WIDGET_VERSION", "widget version is required");
  }
  const deviceModes = manifest.deviceModes ?? [...DEVICE_MODES];
  if (!Array.isArray(deviceModes) || !deviceModes.length || deviceModes.some(mode => !DEVICE_MODES.has(mode))) {
    throw new RuntimeContractError("INVALID_WIDGET_DEVICE_MODES", "widget deviceModes must use desktop, tablet, or mobile");
  }
  const capabilities = manifest.capabilities ?? [];
  if (!Array.isArray(capabilities) || capabilities.some(value => typeof value !== "string" || !value.trim())) {
    throw new RuntimeContractError("INVALID_WIDGET_CAPABILITIES", "widget capabilities must be strings");
  }
  return Object.freeze({
    id: manifest.id,
    version: manifest.version,
    description: String(manifest.description || ""),
    deviceModes: Object.freeze([...new Set(deviceModes)]),
    capabilities: Object.freeze([...new Set(capabilities)]),
    canonWriteAllowed: false,
  });
}

export class WorldOpsWidgetRegistry {
  constructor({ now = () => new Date().toISOString(), maxReceipts = 1000 } = {}) {
    this.now = now;
    this.maxReceipts = Math.max(1, Number(maxReceipts) || 1000);
    this.entries = new Map();
    this.mounts = new Map();
    this.mountSeq = 0;
    this.receipts = [];
  }

  register(manifest, renderer) {
    const normalized = normalizeManifest(manifest);
    if (typeof renderer !== "function") {
      throw new RuntimeContractError("INVALID_WIDGET_RENDERER", "widget renderer must be a function");
    }
    if (this.entries.has(normalized.id)) {
      throw new RuntimeContractError("DUPLICATE_WIDGET", `widget already registered: ${normalized.id}`);
    }
    this.entries.set(normalized.id, { manifest: normalized, renderer });
    return cloneValue(normalized);
  }

  list() {
    return [...this.entries.values()].map(entry => cloneValue(entry.manifest));
  }

  async mount(id, target, props = {}, context = {}) {
    assertRecord(props, "widget props");
    assertRecord(context, "widget context");
    const entry = this.entries.get(id);
    if (!entry) throw new RuntimeContractError("UNKNOWN_WIDGET", `widget is not registered: ${id}`);
    const deviceMode = context.deviceMode || "desktop";
    if (!entry.manifest.deviceModes.includes(deviceMode)) {
      throw new RuntimeContractError("WIDGET_DEVICE_DENIED", `widget ${id} does not support ${deviceMode}`);
    }
    const available = new Set(Array.isArray(context.capabilities) ? context.capabilities : []);
    const missing = entry.manifest.capabilities.filter(capability => !available.has(capability));
    if (missing.length) {
      throw new RuntimeContractError("WIDGET_CAPABILITY_DENIED", `missing widget capabilities: ${missing.join(", ")}`, { missing });
    }

    const startedAt = this.now();
    const mountId = `widget-${++this.mountSeq}`;
    try {
      const result = await entry.renderer({ target, props: cloneValue(props), context });
      const cleanup = typeof result === "function"
        ? result
        : typeof result?.cleanup === "function"
          ? result.cleanup
          : null;
      this.mounts.set(mountId, { widgetId: id, cleanup, target });
      const receipt = {
        mount_id: mountId,
        widget_id: id,
        widget_version: entry.manifest.version,
        device_mode: deviceMode,
        started_at: startedAt,
        ended_at: this.now(),
        props_hash: await hashRecord(props),
        status: "mounted",
      };
      this.#pushReceipt(receipt);
      return cloneValue(receipt);
    } catch (error) {
      const receipt = {
        mount_id: mountId,
        widget_id: id,
        widget_version: entry.manifest.version,
        device_mode: deviceMode,
        started_at: startedAt,
        ended_at: this.now(),
        props_hash: await hashRecord(props),
        status: "rejected",
        error: { name: error?.name || "Error", code: error?.code || null, message: error?.message || "Unknown widget error" },
      };
      this.#pushReceipt(receipt);
      throw error;
    }
  }

  async unmount(mountId) {
    const mount = this.mounts.get(mountId);
    if (!mount) return false;
    if (mount.cleanup) await mount.cleanup();
    this.mounts.delete(mountId);
    this.#pushReceipt({
      mount_id: mountId,
      widget_id: mount.widgetId,
      ended_at: this.now(),
      status: "unmounted",
    });
    return true;
  }

  async unmountAll() {
    const ids = [...this.mounts.keys()].reverse();
    for (const id of ids) await this.unmount(id);
  }

  #pushReceipt(receipt) {
    this.receipts.push(receipt);
    if (this.receipts.length > this.maxReceipts) this.receipts.shift();
  }

  exportReceipts() {
    return cloneValue(this.receipts);
  }
}
