import { RuntimeContractError, assertRecord, cloneValue, hashRecord } from "./worldops_event_bus.js";

export class WorldOpsReceiptStore {
  constructor({ now = () => new Date().toISOString(), maxReceipts = 5000 } = {}) {
    this.now = now;
    this.maxReceipts = Math.max(1, Number(maxReceipts) || 5000);
    this.seq = 0;
    this.receipts = [];
  }

  async append(receipt, { category = "runtime", source = "worldops" } = {}) {
    assertRecord(receipt, "receipt");
    if (typeof category !== "string" || !category.trim()) {
      throw new RuntimeContractError("INVALID_RECEIPT_CATEGORY", "receipt category is required");
    }
    if (typeof source !== "string" || !source.trim()) {
      throw new RuntimeContractError("INVALID_RECEIPT_SOURCE", "receipt source is required");
    }
    const stored = {
      store_receipt_id: `receipt-${++this.seq}`,
      category,
      source,
      stored_at: this.now(),
      authoritative: false,
      body_hash: await hashRecord(receipt),
      body: cloneValue(receipt),
    };
    this.receipts.push(stored);
    if (this.receipts.length > this.maxReceipts) this.receipts.shift();
    return cloneValue(stored);
  }

  query({ category = null, source = null, limit = null } = {}) {
    let rows = this.receipts.filter(row =>
      (category === null || row.category === category) &&
      (source === null || row.source === source));
    if (limit !== null) rows = rows.slice(-Math.max(0, Number(limit) || 0));
    return cloneValue(rows);
  }

  export() {
    return cloneValue(this.receipts);
  }

  clear() {
    const count = this.receipts.length;
    this.receipts.length = 0;
    return count;
  }
}
