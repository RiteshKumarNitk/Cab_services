import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { checkUpload, buildObjectKey, parseObjectKey, canReadObject, isOwnedObjectKey, MAX_UPLOAD_BYTES } from "../uploads";

const uid = "5f0c2a1e-1111-4222-8333-944455556666";
const key = buildObjectKey("receipts", uid, "png", "a1b2c3d4-0000-4000-8000-000000000001");

describe("checkUpload", () => {
  test("accepts a driver's image receipt", () => {
    assert.deepEqual(checkUpload({ folder: "receipts", role: "DRIVER", contentType: "image/png", size: 1000 }), { ok: true, ext: "png" });
  });

  test("rejects customers, unknown folders, bad types, empty and oversized files", () => {
    assert.equal(checkUpload({ folder: "receipts", role: "CUSTOMER", contentType: "image/png", size: 10 }).ok, false);
    assert.equal(checkUpload({ folder: "avatars", role: "ADMIN", contentType: "image/png", size: 10 }).ok, false);
    assert.equal(checkUpload({ folder: "receipts", role: "DRIVER", contentType: "text/html", size: 10 }).ok, false);
    assert.equal(checkUpload({ folder: "receipts", role: "DRIVER", contentType: "image/png", size: 0 }).ok, false);
    const big = checkUpload({ folder: "receipts", role: "DRIVER", contentType: "application/pdf", size: MAX_UPLOAD_BYTES + 1 });
    assert.deepEqual(big, { ok: false, status: 413, error: "File is larger than 5 MB" });
  });
});

describe("object keys", () => {
  test("round-trips folder and owner", () => {
    assert.equal(key, `receipts/${uid}/a1b2c3d4-0000-4000-8000-000000000001.png`);
    assert.deepEqual(parseObjectKey(key), { folder: "receipts", ownerId: uid });
  });

  test("rejects legacy data URLs, path tricks and unknown folders", () => {
    assert.equal(parseObjectKey("data:image/png;base64,AAAA"), null);
    assert.equal(parseObjectKey(`receipts/../${uid}/x.png`), null);
    assert.equal(parseObjectKey(`secrets/${uid}/x.png`), null);
    assert.equal(parseObjectKey(`receipts/${uid}/x.exe`), null);
  });

  test("owner and staff can read; other users cannot", () => {
    assert.equal(canReadObject(key, { id: uid, role: "DRIVER" }), true);
    assert.equal(canReadObject(key, { id: "someone-else", role: "DRIVER" }), false);
    assert.equal(canReadObject(key, { id: "someone-else", role: "CUSTOMER" }), false);
    assert.equal(canReadObject(key, { id: "admin", role: "FINANCE" }), true);
  });

  test("only the owner can attach a key, and only in the right folder", () => {
    assert.equal(isOwnedObjectKey(key, uid, "receipts"), true);
    assert.equal(isOwnedObjectKey(key, "someone-else", "receipts"), false);
    assert.equal(isOwnedObjectKey(key, uid, "incidents"), false);
  });
});
