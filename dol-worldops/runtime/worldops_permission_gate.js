import { RuntimeContractError, assertRecord, cloneValue } from "./worldops_event_bus.js";

const ID_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;

function normalizeCapabilities(values, name) {
  if (!Array.isArray(values) || values.some(value => typeof value !== "string" || !value.trim())) {
    throw new RuntimeContractError("INVALID_POLICY_CAPABILITIES", `${name} must contain non-empty strings`);
  }
  return [...new Set(values)].sort();
}

function wildcardMatch(pattern, value) {
  if (pattern === "*") return true;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*");
  return new RegExp(`^${escaped}$`).test(value);
}

export class WorldOpsPermissionGate {
  constructor({ policies = [], now = () => new Date().toISOString(), maxReceipts = 1000 } = {}) {
    this.now = now;
    this.maxReceipts = Math.max(1, Number(maxReceipts) || 1000);
    this.policies = new Map();
    this.receipts = [];
    for (const policy of policies) this.addPolicy(policy);
  }

  addPolicy(policy) {
    assertRecord(policy, "permission policy");
    if (typeof policy.id !== "string" || !ID_PATTERN.test(policy.id)) {
      throw new RuntimeContractError("INVALID_POLICY_ID", "policy id must use lowercase stable identifiers");
    }
    if (this.policies.has(policy.id)) throw new RuntimeContractError("DUPLICATE_POLICY", `policy already exists: ${policy.id}`);
    if (typeof policy.resource !== "string" || !policy.resource.trim()) throw new RuntimeContractError("INVALID_POLICY_RESOURCE", "policy resource is required");
    if (typeof policy.action !== "string" || !policy.action.trim()) throw new RuntimeContractError("INVALID_POLICY_ACTION", "policy action is required");
    if (!["allow", "deny"].includes(policy.effect)) throw new RuntimeContractError("INVALID_POLICY_EFFECT", "policy effect must be allow or deny");
    const normalized = Object.freeze({
      id: policy.id,
      resource: policy.resource,
      action: policy.action,
      effect: policy.effect,
      allOf: Object.freeze(normalizeCapabilities(policy.allOf ?? [], "allOf")),
      anyOf: Object.freeze(normalizeCapabilities(policy.anyOf ?? [], "anyOf")),
      priority: Number(policy.priority) || 0,
    });
    this.policies.set(normalized.id, normalized);
    return cloneValue(normalized);
  }

  async authorize({ resource, action, capabilities = [], subject = null } = {}) {
    if (typeof resource !== "string" || !resource.trim()) throw new RuntimeContractError("INVALID_AUTH_RESOURCE", "authorization resource is required");
    if (typeof action !== "string" || !action.trim()) throw new RuntimeContractError("INVALID_AUTH_ACTION", "authorization action is required");
    const available = new Set(normalizeCapabilities(capabilities, "authorization capabilities"));
    const matching = [...this.policies.values()]
      .filter(policy => wildcardMatch(policy.resource, resource) && wildcardMatch(policy.action, action))
      .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
    const satisfied = matching.filter(policy =>
      policy.allOf.every(capability => available.has(capability)) &&
      (policy.anyOf.length === 0 || policy.anyOf.some(capability => available.has(capability))));
    const deny = satisfied.find(policy => policy.effect === "deny");
    const allow = satisfied.find(policy => policy.effect === "allow");
    const decision = deny ? "deny" : allow ? "allow" : "deny";
    const receipt = {
      decided_at: this.now(),
      resource,
      action,
      subject: subject === null ? null : String(subject),
      decision,
      matched_policy_ids: satisfied.map(policy => policy.id),
      default_deny: !deny && !allow,
      canon_write_allowed: false,
    };
    this.receipts.push(receipt);
    if (this.receipts.length > this.maxReceipts) this.receipts.shift();
    if (decision !== "allow") throw new RuntimeContractError("PERMISSION_DENIED", `permission denied for ${action} ${resource}`, { receipt });
    return cloneValue(receipt);
  }

  exportReceipts() {
    return cloneValue(this.receipts);
  }
}
