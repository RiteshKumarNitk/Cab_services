import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { netPaid, invoicePaymentState } from "../finance";

describe("netPaid", () => {
  test("sums payments and subtracts refunds", () => {
    assert.equal(netPaid([]), 0);
    assert.equal(netPaid([{ amount: 2000, type: "ADVANCE" }, { amount: 3200, type: "FULL" }]), 5200);
    assert.equal(netPaid([{ amount: 5000, type: "FULL" }, { amount: 500, type: "REFUND" }]), 4500);
  });

  test("rounds to paise", () => {
    assert.equal(netPaid([{ amount: 0.1, type: "ADVANCE" }, { amount: 0.2, type: "ADVANCE" }]), 0.3);
  });
});

describe("invoicePaymentState", () => {
  test("a new invoice with no payments is unpaid", () => {
    assert.deepEqual(invoicePaymentState({ total: 5460, status: "DRAFT" }, 0), {
      paidAmount: 0, paymentStatus: "PENDING", status: "DRAFT",
    });
  });

  test("partial and full payment", () => {
    assert.equal(invoicePaymentState({ total: 5460, status: "SENT" }, 2000).status, "PARTIALLY_PAID");
    assert.equal(invoicePaymentState({ total: 5460, status: "SENT" }, 2000).paymentStatus, "PARTIAL");
    assert.equal(invoicePaymentState({ total: 5460, status: "PARTIALLY_PAID" }, 5460).status, "PAID");
  });

  test("a refund that reduces the balance re-opens the invoice", () => {
    assert.equal(invoicePaymentState({ total: 5460, status: "PAID" }, 5000).status, "PARTIALLY_PAID");
    assert.equal(invoicePaymentState({ total: 5460, status: "PAID" }, 0).status, "SENT");
  });

  test("cancelled invoices stay cancelled", () => {
    assert.equal(invoicePaymentState({ total: 5460, status: "CANCELLED" }, 5460).status, "CANCELLED");
  });
});
