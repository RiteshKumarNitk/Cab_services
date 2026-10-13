import { PrismaClient, type Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes, randomInt } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// Shared helpers for the HTTP integration suite. Run via scripts/run-integration.mjs, which
// starts the app against an isolated test database (e.g. a disposable Neon branch).

export const BASE = process.env.INTEGRATION_BASE_URL ?? "";
const DB_URL = process.env.INTEGRATION_DATABASE_URL ?? "";

function forbiddenHosts(): Set<string> {
  const hosts = new Set((process.env.INTEGRATION_FORBIDDEN_HOSTS ?? "").split(",").filter(Boolean));
  // Defence in depth when the file is run directly: also read the project's env files.
  for (const f of [".env", ".env.local"]) {
    const p = path.join(process.cwd(), f);
    if (!existsSync(p)) continue;
    for (const m of readFileSync(p, "utf8").matchAll(/^DATABASE_URL(?:_UNPOOLED)?\s*=\s*"?([^"\r\n]+)"?/gm)) {
      try { hosts.add(new URL(m[1]).hostname); } catch { /* ignore */ }
    }
  }
  return hosts;
}

export function assertSafeTarget() {
  if (!BASE || !DB_URL) {
    throw new Error("Set INTEGRATION_BASE_URL and INTEGRATION_DATABASE_URL (use `pnpm test:integration -- --env-file ...`).");
  }
  const host = new URL(DB_URL).hostname;
  if (forbiddenHosts().has(host)) throw new Error(`Refusing to run against the project's configured database (${host}).`);
}

export const prisma = new PrismaClient({ datasources: { db: { url: DB_URL || "postgresql://invalid" } } });

/** Unique id for this run; every record the suite creates carries it. */
export const RUN = randomBytes(4).toString("hex");

/** A far-future day (no overlap with seeded demo data), at hh:mm local time. */
const BASE_DAY = 400 + randomInt(0, 300);
export function day(offset = 0, hh = 9, mm = 0): Date {
  const d = new Date(Date.now() + (BASE_DAY + offset) * 86_400_000);
  d.setHours(hh, mm, 0, 0);
  return d;
}
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const uniquePhone = () => `9${String(randomInt(100_000_000, 999_999_999))}`;

// ---------- HTTP client with a cookie jar (real NextAuth sessions) ----------

export class Client {
  private jar = new Map<string, string>();
  user: { id: string; role: string; email: string } | null = null;

  async req(method: string, url: string, body?: unknown, init: RequestInit = {}) {
    const headers = new Headers(init.headers);
    if (this.jar.size) headers.set("cookie", [...this.jar].map(([k, v]) => `${k}=${v}`).join("; "));
    let payload = init.body;
    if (body !== undefined && !(body instanceof FormData) && !(body instanceof URLSearchParams)) {
      headers.set("content-type", "application/json");
      payload = JSON.stringify(body);
    } else if (body !== undefined) {
      payload = body as BodyInit;
    }
    const res = await fetch(BASE + url, { ...init, method, headers, body: payload, redirect: "manual" });
    for (const c of res.headers.getSetCookie()) {
      const [kv] = c.split(";");
      const i = kv.indexOf("=");
      this.jar.set(kv.slice(0, i), kv.slice(i + 1));
    }
    const text = await res.text();
    let json: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
    try { json = text ? JSON.parse(text) : null; } catch { json = text; }
    return { status: res.status, json, headers: res.headers };
  }
  get = (url: string) => this.req("GET", url);
  post = (url: string, body?: unknown) => this.req("POST", url, body);
  put = (url: string, body?: unknown) => this.req("PUT", url, body);
  patch = (url: string, body?: unknown) => this.req("PATCH", url, body);

  async login(email: string, password: string) {
    const { json } = await this.get("/api/auth/csrf");
    await this.req("POST", "/api/auth/callback/credentials",
      new URLSearchParams({ csrfToken: json.csrfToken, email, password, callbackUrl: BASE }),
      { headers: { "content-type": "application/x-www-form-urlencoded" } });
    const s = await this.get("/api/auth/session");
    this.user = s.json?.user ?? null;
    if (!this.user) throw new Error(`Login failed for ${email}`);
    return this;
  }
}

// ---------- Run-scoped fixtures ----------

export const created = { userIds: [] as string[], vehicleIds: [] as string[] };
const PASSWORD = randomBytes(18).toString("base64url");

export async function makeUser(role: Role, label: string) {
  const user = await prisma.user.create({
    data: {
      email: `it-${RUN}-${label}@example.invalid`,
      name: `IT ${label} ${RUN}`,
      phone: `+91${uniquePhone()}`,
      role,
      passwordHash: await bcrypt.hash(PASSWORD, 10),
    },
  });
  created.userIds.push(user.id);
  if (role === "DRIVER") await prisma.driverStatus.create({ data: { driverId: user.id, online: false } });
  const client = await new Client().login(user.email, PASSWORD);
  return { user, client };
}

export async function makeVehicle(label: string, opts: { insuranceExpiry?: Date } = {}) {
  const v = await prisma.vehicle.create({
    data: {
      plateNumber: `IT-${RUN}-${label}`, name: `IT ${label}`, model: "Test Sedan", color: "White",
      type: "SEDAN", seats: 4, luggage: 2, insuranceExpiry: opts.insuranceExpiry ?? day(365),
      fitnessExpiry: day(365), permitExpiry: day(365), rcExpiry: day(365),
    },
  });
  created.vehicleIds.push(v.id);
  return v;
}

/** Poll until `fn` returns a truthy value (for fire-and-forget event subscribers). */
export async function eventually<T>(fn: () => Promise<T>, timeoutMs = 5000): Promise<T> {
  const start = Date.now();
  for (;;) {
    const v = await fn();
    if (v || Date.now() - start > timeoutMs) return v;
    await new Promise((r) => setTimeout(r, 250));
  }
}

/** Remove everything this run created (the test branch is disposable, but keep it clean). */
export async function cleanup() {
  const users = created.userIds;
  const leads = await prisma.lead.findMany({ where: { name: { contains: RUN } }, select: { id: true } });
  const leadIds = leads.map((l) => l.id);
  const bookings = await prisma.booking.findMany({ where: { OR: [{ leadId: { in: leadIds } }, { customerId: { in: users } }] }, select: { id: true } });
  const bookingIds = bookings.map((b) => b.id);
  const trips = await prisma.trip.findMany({ where: { bookingId: { in: bookingIds } }, select: { id: true } });
  const tripIds = trips.map((t) => t.id);

  await prisma.rating.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.settlement.deleteMany({ where: { OR: [{ tripId: { in: tripIds } }, { driverId: { in: users } }] } });
  await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.invoice.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.expense.deleteMany({ where: { OR: [{ bookingId: { in: bookingIds } }, { paidById: { in: users } }] } });
  await prisma.cancellation.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.followUp.deleteMany({ where: { OR: [{ leadId: { in: leadIds } }, { userId: { in: users } }] } });
  await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } }); // cascades dispatch + trip
  await prisma.quotation.deleteMany({ where: { leadId: { in: leadIds } } });
  await prisma.lead.deleteMany({ where: { id: { in: leadIds } } });
  await prisma.notification.deleteMany({ where: { userId: { in: users } } });
  await prisma.auditLog.deleteMany({ where: { OR: [{ userId: { in: users } }, { entityId: { in: [...bookingIds, ...leadIds] } }] } });
  await prisma.vehicle.deleteMany({ where: { id: { in: created.vehicleIds } } });
  await prisma.driverStatus.deleteMany({ where: { driverId: { in: users } } });
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
}
