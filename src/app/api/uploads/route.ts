import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { buildObjectKey, canReadObject, checkUpload, type UploadFolder } from "@/lib/uploads";
import { presignedGetUrl, putObject } from "@/lib/storage";

// File uploads to Neon Object Storage (private `assets` bucket).
//   POST multipart/form-data { file, folder }  ->  201 { key }
//   GET  ?key=<key>                            ->  302 to a 5-minute presigned URL
// Store the returned key on the owning record (e.g. Expense.receiptUrl), never the file bytes.

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const folder = String(form?.get("folder") ?? "");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Send the file as multipart field \"file\"" }, { status: 400 });
  }

  const check = checkUpload({ folder, role: session.user.role, contentType: file.type, size: file.size });
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status });

  const key = buildObjectKey(folder as UploadFolder, session.user.id, check.ext, randomUUID());
  try {
    await putObject(key, new Uint8Array(await file.arrayBuffer()), file.type);
  } catch (error) {
    console.error("Upload to object storage failed:", error);
    return NextResponse.json({ error: "Could not store the file. Please try again." }, { status: 502 });
  }
  return NextResponse.json({ key, contentType: file.type, size: file.size }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!canReadObject(key, { id: session.user.id, role: session.user.role })) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    return NextResponse.redirect(await presignedGetUrl(key), { status: 302 });
  } catch (error) {
    console.error("Presigning object URL failed:", error);
    return NextResponse.json({ error: "File unavailable" }, { status: 502 });
  }
}
