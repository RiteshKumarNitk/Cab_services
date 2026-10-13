import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { parsePageParams, listResponse, LEGACY_CAP, MAX_LIMIT } from "../pagination";

const sp = (q: string) => new URLSearchParams(q);

describe("parsePageParams", () => {
  test("no params: legacy array mode, capped, fetching one extra row to detect truncation", () => {
    assert.deepEqual(parsePageParams(sp("")), { paged: false, page: 1, limit: LEGACY_CAP, skip: 0, take: LEGACY_CAP + 1 });
  });

  test("page and limit", () => {
    assert.deepEqual(parsePageParams(sp("page=3&limit=20")), { paged: true, page: 3, limit: 20, skip: 40, take: 20 });
  });

  test("limit alone uses page 1; page alone uses the default limit", () => {
    assert.equal(parsePageParams(sp("limit=10")).skip, 0);
    assert.equal(parsePageParams(sp("page=2"), 25).take, 25);
  });

  test("clamps invalid and oversized values", () => {
    assert.equal(parsePageParams(sp("limit=100000")).take, MAX_LIMIT);
    assert.equal(parsePageParams(sp("page=-4&limit=0")).page, 1);
    assert.equal(parsePageParams(sp("page=abc&limit=xyz")).take, 50);
  });
});

describe("listResponse", () => {
  test("legacy mode returns a plain array and flags truncation", async () => {
    const rows = Array.from({ length: LEGACY_CAP + 1 }, (_, i) => i);
    const res = await listResponse("items", rows, parsePageParams(sp("")), async () => { throw new Error("no count in legacy mode"); });
    const body = await res.json();
    assert.ok(Array.isArray(body));
    assert.equal(body.length, LEGACY_CAP);
    assert.equal(res.headers.get("X-Has-More"), "true");
  });

  test("legacy mode without truncation has no header", async () => {
    const res = await listResponse("items", [1, 2], parsePageParams(sp("")), async () => 2);
    assert.equal(res.headers.get("X-Has-More"), null);
    assert.deepEqual(await res.json(), [1, 2]);
  });

  test("paged mode returns the leads/trips-style envelope", async () => {
    const res = await listResponse("bookings", [{ id: "a" }], parsePageParams(sp("page=2&limit=1")), async () => 3);
    assert.deepEqual(await res.json(), { bookings: [{ id: "a" }], total: 3, page: 2, limit: 1, totalPages: 3 });
  });
});
