// Pure rules for user uploads stored in Neon Object Storage (no I/O, unit tested).
// Object keys have the shape `<folder>/<ownerId>/<uuid>.<ext>`; the key, not the
// file bytes, is what gets stored in Postgres (e.g. Expense.receiptUrl).

import { STAFF_ROLES, hasRole } from "./authz-roles";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/** Folders and who may upload into them. */
export const UPLOAD_FOLDERS = {
  receipts: ["DRIVER", ...STAFF_ROLES],
  incidents: ["DRIVER", ...STAFF_ROLES],
} as const;

export type UploadFolder = keyof typeof UPLOAD_FOLDERS;

export type UploadCheck = { ok: true; ext: string } | { ok: false; status: 400 | 403 | 413; error: string };

export function checkUpload(input: { folder: string; role: string; contentType: string; size: number }): UploadCheck {
  const allowedRoles = (UPLOAD_FOLDERS as Record<string, readonly string[]>)[input.folder];
  if (!allowedRoles) return { ok: false, status: 400, error: `Unknown upload folder "${input.folder}"` };
  if (!allowedRoles.includes(input.role)) return { ok: false, status: 403, error: "Forbidden" };
  const ext = EXTENSION_BY_TYPE[input.contentType];
  if (!ext) return { ok: false, status: 400, error: "Only JPEG, PNG, WebP images or PDF files are allowed" };
  if (input.size <= 0) return { ok: false, status: 400, error: "File is empty" };
  if (input.size > MAX_UPLOAD_BYTES) return { ok: false, status: 413, error: "File is larger than 5 MB" };
  return { ok: true, ext };
}

export function buildObjectKey(folder: UploadFolder, ownerId: string, ext: string, id: string): string {
  return `${folder}/${ownerId}/${id}.${ext}`;
}

const KEY_PATTERN = /^(receipts|incidents)\/([A-Za-z0-9-]+)\/([A-Za-z0-9-]+)\.(jpg|png|webp|pdf)$/;

/** Parse a stored object key; null for anything else (e.g. legacy data: URLs). */
export function parseObjectKey(key: string): { folder: UploadFolder; ownerId: string } | null {
  const m = KEY_PATTERN.exec(key);
  return m ? { folder: m[1] as UploadFolder, ownerId: m[2] } : null;
}

/** Staff can read any upload; everyone else only their own. */
export function canReadObject(key: string, user: { id: string; role: string }): boolean {
  const parsed = parseObjectKey(key);
  if (!parsed) return false;
  return hasRole(user.role, STAFF_ROLES) || parsed.ownerId === user.id;
}

/** A user may attach a key to a record only if it is a valid key they own. */
export function isOwnedObjectKey(key: string, userId: string, folder: UploadFolder): boolean {
  const parsed = parseObjectKey(key);
  return !!parsed && parsed.folder === folder && parsed.ownerId === userId;
}
