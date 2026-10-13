# Aradhana Travel: Architecture

**Last updated:** 2026-10-13. This describes the code as it is, not the target. For the target, see [PRODUCT_SPECIFICATION.md](PRODUCT_SPECIFICATION.md).

## 1. Shape of the system

A single Next.js 16 App Router application serves four audiences from one codebase and one PostgreSQL database:

```
src/app/
  (public)/        Public website (CMS-backed marketing pages, enquiry/contact forms, login/register)
  customer/        Customer portal (bookings, quotations, invoices, profile, tracking)
  driver/          Driver app (mobile-first web: trips, expenses, incidents, earnings)
  admin/           ERP back office (ops, CRM, fleet, drivers, finance, reports, CMS, settings)
  api/             Route handlers (JSON APIs used by client components)
src/lib/           Domain services, auth, event bus, CMS data access
src/proxy.ts       Request gate (Next 16 "proxy", formerly middleware): page-level role routing
prisma/            schema.prisma (migrations in prisma/migrations), seed.ts
```

Data access styles in use (all three talk to the same Prisma client):

| Style | Where | Used for |
|---|---|---|
| Server components calling Prisma directly | `admin/finance`, `admin/reports/*`, `admin/cms/*` pages, public CMS pages | Read-heavy dashboards and content |
| Server actions (`"use server"`) | `src/lib/admin-cms.ts`, `src/lib/admin-crm.ts` | CMS writes |
| Route handlers + TanStack Query | `src/app/api/**`, `src/lib/hooks.ts` | Operational workflows (bookings, dispatch, finance, driver app) |

## 2. Authorization

* **Authentication:** NextAuth v5 credentials provider (`src/lib/auth.ts`), JWT sessions carrying `id` and `role`. Phone OTP sign-in exchanges a verified OTP for a 60-second one-time token, which is then used as the credentials password. OTP sign-in is for `CUSTOMER` accounts only.
* **Page gate:** `src/proxy.ts` sends unauthenticated users to the right login page and keeps non-staff out of `/admin`, non-drivers out of `/driver`. This is coarse routing, **not** the security boundary.
* **API boundary:** every route handler checks the role itself. Role groups live in `src/lib/authz-roles.ts` (`ADMIN_ROLES`, `OPS_ROLES`, `CRM_ROLES`, `FINANCE_ROLES`, `FINANCE_READ_ROLES`, `STAFF_ROLES`). `requireRole()` in `src/lib/authz.ts` returns the session or a ready 401/403 response. Older routes still have local role arrays with the same contents. Consolidate them when you touch them.
* **Ownership checks:** customers and drivers only see their own bookings (`/api/bookings`, `/api/bookings/[id]`). The trip OTP is stripped from responses to drivers.

## 3. Core workflow and where each rule lives

```
Website form ──POST /api/enquiries──▶ Lead (NEW)            src/lib/enquiries.ts (dedupe 24h)
Lead ── follow-ups ── Quotation (DRAFT→SENT→APPROVED)       /api/admin/leads, /api/admin/followups, /api/admin/quotations
APPROVED quotation ──POST /api/admin/leads/[id]/convert──▶  src/lib/lead-conversion.ts
      Booking (BOOKING_CONFIRMED) + Dispatch (PENDING)       (one transaction, idempotent)
Dispatch board ──assign-vehicle──▶ VEHICLE_ASSIGNED          src/lib/operations-queue.ts
               ──assign-driver───▶ DRIVER_ASSIGNED             + vehicle-availability.ts / driver-availability.ts
               ──finalize────────▶ READY_FOR_DISPATCH + Trip(SCHEDULED, otp)   ← only place a Trip is created
Driver app ──PUT /api/bookings/[id]/status──▶ TRIP_STARTED (OTP) → PICKUP_COMPLETED → DROP_COMPLETED → TRIP_COMPLETED
      Trip.status mirrored: IN_PROGRESS → PICKED_UP → REACHED_DESTINATION → COMPLETED
Finance ── invoices (one active per booking, never paid on creation) ── payments (update invoice balance) ── settlements (manual)
```

### Booking state machine

`src/lib/booking-lifecycle.ts` is pure and unit-tested. It is the single source for:

* `BOOKING_TRANSITIONS`: allowed next statuses (spec §8.1, plus legacy statuses kept for older rows)
* `checkTransition()`: who may perform each transition
  * Customer: approve a sent quote; cancel own booking before the trip starts
  * Driver: start/pickup/drop/complete own trip only (start requires the customer OTP)
  * Ops roles: any valid transition **except** `VEHICLE_ASSIGNED` / `DRIVER_ASSIGNED` / `READY_FOR_DISPATCH`, which only the dispatch service can set (it runs the availability checks and creates the trip)
  * Finance: `TRIP_COMPLETED → INVOICE_GENERATED → CLOSED`
* `TRIP_STATUS_FOR_BOOKING`: how `Trip.status` follows the booking
* `bookingWindow()` / `windowsOverlap()`: the assignment window (whole calendar days, pickup day to return day; decision D3)

The customer-facing timeline (simplified labels) is in `src/lib/customer-timeline.ts`.

### Concurrency and idempotency

| Operation | Protection |
|---|---|
| Vehicle/driver assignment | Postgres advisory lock per vehicle/driver and per dispatch (`pg_advisory_xact_lock`), then availability is re-checked and written inside the same transaction |
| Dispatch finalize | Lock per dispatch; a repeat call returns the existing trip (`200`); `Trip.bookingId` is unique |
| Lead conversion | Returns the existing booking if the lead was converted; `Booking.leadId` / `quotationId` are unique, and a `P2002` race is caught |
| Booking status change | Optimistic check (`updateMany where status = <read status>`), `409` if it changed in between |
| Payments | An identical payment by the same user within 2 minutes returns the first one |
| Invoices | One non-cancelled invoice per booking; invoice-number collisions are retried |
| Enquiries | Same phone + pickup + date within 24h returns the existing open lead |

## 4. Events, notifications, audit, webhooks

`src/lib/event-bus.ts` is an in-process pub/sub. Services emit events **after** their transaction commits. On the first `emit`, the bus lazily loads `src/lib/event-init.ts`, which subscribes:

* `notifications.ts`: in-app `Notification` rows (channel `PUSH`) for customers and drivers
* `audit-logger.ts`: an `AuditLog` row for every business event
* `webhook-dispatcher.ts`: HMAC-signed POSTs to active `Webhook` URLs

Limitations: delivery is fire-and-forget in the request process, with no retry or outbox (plan P3-7). No external channel (SMS, WhatsApp, email) is configured (decision D2). No UI reads notifications yet (P3-4).

## 5. Data model notes

* 43 models and 17 enums in `prisma/schema.prisma`. Key relations: `Lead 1─* Quotation`, `Lead 1─1 Booking`, `Quotation 1─1 Booking`, `Booking 1─1 Dispatch`, `Booking 1─1 Trip`, `Booking 1─* Payment / Invoice / Expense`, `Invoice 1─* Payment`.
* `Booking.status` uses the full `BookingStatus` enum (spec), plus legacy values (`PENDING`, `PRICE_SENT`, `CONFIRMED`, `VEHICLE_READY`, `STARTED`, `COMPLETED`) kept for older rows.
* Bookings store `pickupDate` (DateTime) and `pickupTime` ("HH:MM") separately and have no end time, which is why assignment windows are whole days.
* `User.email` is required and unique, so phone-only customers get a placeholder `customer_<digits>@aradhanatravel.com`.
* Several "status" columns are free strings (`Settlement.status`, `VehicleMaintenance.status`, `DriverLeave.status`, `Payment.type`, `Expense.category`). The API layer validates the allowed values.

## 5a. Client data refresh policy

TanStack Query in `src/lib/hooks.ts`. Polling is **opt-in**: lists refresh on window focus and after mutations (which invalidate `["bookings"]`/`["booking"]`). Only screens that must see other users' changes poll, using the shared intervals in `POLL`:

| Interval | Used by |
|---|---|
| `POLL.live` 10 s | Booking detail, only while `isLiveBookingStatus()` (dispatch or trip in progress) |
| `POLL.queue` 15 s | Driver dashboard (newly dispatched trips) |
| `POLL.list` 30 s | Admin bookings list |

Don't add polling to history, earnings or settings-style pages.

## 5b. Tooling

* Package manager: **pnpm** (`packageManager` in `package.json`; `pnpm-workspace.yaml` allow-lists the install scripts of `/client`, `/engines`, `prisma`, `esbuild`, `sharp`, `unrs-resolver`). `package-lock.json` remains until the migration is reviewed (P1-8).
* `next.config.ts` pins `turbopack.root` to the project directory.

## 5c. List endpoints and pagination

`src/lib/pagination.ts`, same convention as `/api/admin/leads` and `/api/admin/trips`:

* `?page=N&limit=M` (limit capped at 200) returns `{ <items>, total, page, limit, totalPages }`
* with no paging params the endpoint returns a plain array (backward compatible), capped at the 500 newest rows; `X-Has-More: true` marks truncation

New list UIs should use paged mode (see `admin/bookings`).

## 5d. Schema migrations

Prisma Migrate, `prisma/migrations/` (baseline `0_init` plus incremental migrations). `.env` points at **production**: use `prisma migrate deploy` there, never `migrate dev` or `db push`. Index changes must be justified by measured plans (TESTING_STATUS §8).

## 6. Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL (Neon) connection string |
| `NEXTAUTH_SECRET` | JWT signing secret |
| `NEXTAUTH_URL` | Public base URL |

Not yet present but required by planned work: SMS/email provider credentials (D2), and a separate test database URL (P1-2).

## 7. Testing

Pure domain rules (`booking-lifecycle`, `enquiry-validation`, `finance`) are unit-tested with `node:test` through `tsx` (`npm test`). Services that touch the database are not yet covered (plan P1-2). See [TESTING_STATUS.md](TESTING_STATUS.md).
