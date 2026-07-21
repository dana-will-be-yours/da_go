import { RuntimeContractError, cloneValue } from "./worldops_event_bus.js";

const ID_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const DEFAULT_RESERVED = new Set(["canon.write", "formal.collection.enable", "database.destructive"]);

function normalizeIds(values, name) {
  if (!Array.isArray(values) || values.some(value => typeof value !== "string" || !ID_PATTERN.test(value))) {
    throw new RuntimeContractError("INVALID_CAPABILITY_LIST", `${name} must contain stable lowercase identifiers`);
  }
  return [...new Set(values)].sort();
}

export class WorldOpsCapabilityRegistry {
  constructor({ reserved = [...DEFAULT_RESERVED] } = {}) {
    this.reserved = new Set(normalizeIds(reserved, "reserved capabilities"));
    this.roles = new Map();
    this.sealed = false;
  }

  registerRole(roleId, capabilities = []) {
    if (this.sealed) throw new RuntimeContractError("CAPABILITY_REGISTRY_SEALED", "capability registry is sealed");
    if (typeof roleId !== "string" || !ID_PATTERN.test(roleId)) {
      throw new RuntimeContractError("INVALID_ROLE_ID", "role id must use lowercase stable identifiers");
    }
    if (this.roles.has(roleId)) throw new RuntimeContractError("DUPLICATE_ROLE", `role already registered: ${roleId}`);
    const normalized = normalizeIds(capabilities, "role capabilities");
    const denied = normalized.filter(capability => this.reserved.has(capability));
    if (denied.length) throw new RuntimeContractError("RESERVED_CAPABILITY", "reserved capabilities cannot be granted by the client", { denied });
    this.roles.set(roleId, Object.freeze(normalized));
    return { roleId, capabilities: [...normalized] };
  }

  seal() {
    this.sealed = true;
    return this.snapshot();
  }

  resolve({ roles = [], explicit = [] } = {}) {
    const roleIds = normalizeIds(roles, "roles");
    const explicitIds = normalizeIds(explicit, "explicit capabilities");
    const unknown = roleIds.filter(roleId => !this.roles.has(roleId));
    if (unknown.length) throw new RuntimeContractError("UNKNOWN_ROLE", "one or more roles are not registered", { unknown });
    const denied = explicitIds.filter(capability => this.reserved.has(capability));
    if (denied.length) throw new RuntimeContractError("RESERVED_CAPABILITY", "reserved capabilities cannot be supplied by the client", { denied });
    const result = new Set(explicitIds);
    for (const roleId of roleIds) {
      for (const capability of this.roles.get(roleId)) result.add(capability);
    }
    return [...result].sort();
  }

  assertAll(required, available) {
    const requiredIds = normalizeIds(required, "required capabilities");
    const availableIds = new Set(normalizeIds(available, "available capabilities"));
    const missing = requiredIds.filter(capability => !availableIds.has(capability));
    if (missing.length) throw new RuntimeContractError("CAPABILITY_DENIED", "required capabilities are missing", { missing });
    return true;
  }

  snapshot() {
    return cloneValue({
      sealed: this.sealed,
      reserved: [...this.reserved].sort(),
      roles: [...this.roles.entries()].map(([roleId, capabilities]) => ({ roleId, capabilities: [...capabilities] })),
      canonWriteAllowed: false,
    });
  }
}
