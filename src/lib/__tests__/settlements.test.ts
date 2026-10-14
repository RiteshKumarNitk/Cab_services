import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeTripSettlement } from "../settlements";

describe("computeTripSettlement (driver allowance + reimbursed expenses − advance)", () => {
  test("allowance plus reimbursed expenses", () => {
    assert.deepEqual(computeTripSettlement({ driverAllowance: 300, expenses: [450, 120] }), {
      earnings: 300, expenses: 570, advancePaid: 0, netPayable: 870,
    });
  });

  test("advance already paid is deducted", () => {
    assert.equal(computeTripSettlement({ driverAllowance: 300, expenses: [450], advancePaid: 200 }).netPayable, 550);
  });

  test("no allowance and no expenses settles at zero", () => {
    assert.deepEqual(computeTripSettlement({ driverAllowance: null, expenses: [] }), { earnings: 0, expenses: 0, advancePaid: 0, netPayable: 0 });
  });

  test("rounds to paise", () => {
    assert.equal(computeTripSettlement({ driverAllowance: 0.1, expenses: [0.2] }).netPayable, 0.3);
  });
});
