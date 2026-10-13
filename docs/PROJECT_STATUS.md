# Aradhana Travel: Project Status

**Audit date:** 2026-10-13
**Audited commit:** `531f46e` on `master`, plus the uncommitted Phase 2 changes described in [§6](#6-changes-made-in-this-session-phase-2)
**Requirements:** [PRODUCT_SPECIFICATION.md](PRODUCT_SPECIFICATION.md) (ERP) and [WEBSITE_DESIGN.md](WEBSITE_DESIGN.md) (public website)
**Related:** [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [TESTING_STATUS.md](TESTING_STATUS.md)

Every status below comes from reading the code. The configured database was unreachable in the sandboxed audit run. It is reachable outside the sandbox (the second-session build read CMS data from it), but it may be production (D8), so it was deliberately **not** used for testing. **No workflow has been run end to end against real data.** That means no item is marked `COMPLETE` (verified against acceptance criteria). The best rating a working feature can get here is "implemented (code-verified)". There is no completion percentage, because there is no weighted, runtime-verified inventory to calculate one from.

---

## 1. Technology stack

| Layer | Technology | Evidence |
|---|---|---|
| Framework | Next.js **16.2.10** (App Router, Turbopack), React 19.2 | `package.json` |
| Language | TypeScript 5 (strict type-check passes) | `tsconfig.json` |
| Database | PostgreSQL on Neon, via Prisma **5.22** | `prisma/schema.prisma` (43 models, 17 enums) |
| Schema management | Prisma Migrate. Baseline `0_init` and an index migration added 2026-10-13; **not yet applied to production** (P1-1) | `prisma/migrations/` |
| Auth | NextAuth v5 beta (credentials and phone OTP), JWT sessions | `src/lib/auth.ts` |
| UI | Tailwind 4, shadcn/base-ui, lucide, framer-motion, sonner, recharts | `package.json` |
| Data fetching | TanStack Query (client), server components with Prisma (server), server actions (CMS) | `src/lib/hooks.ts`, `src/lib/admin-cms.ts` |
| Validation | `zod` 4 (installed; first used in this session for enquiries and contact) | `src/lib/enquiry-validation.ts` |
| Tests | `node:test` through `tsx` (46 unit tests) | `src/lib/__tests__/` |
| Package manager | pnpm 11.27.1 (npm lockfile removed 2026-10-13) | `pnpm-lock.yaml`, `pnpm-workspace.yaml` |
| CI / deploy config | **None** (no `.github/`, no `vercel.json`, no Dockerfile) | repo root |

Environment variables (names only): `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. They are in `.env` and `.env.local`, which are git-ignored.

### Role mapping (spec persona → schema `Role`)

The schema roles do not match the spec personas one to one. Current code treats them like this (see `src/lib/authz-roles.ts`):

| Spec persona | Schema role(s) used in code |
|---|---|
| Super Admin / Admin | `SUPER_ADMIN`, `ADMIN` |
| Operations Manager | `BOOKING_MANAGER` (plus `FLEET_MANAGER` and `DRIVER_MANAGER` in `OPS_ROLES`) |
| Sales Executive | `SUPPORT_EXECUTIVE` (CRM and quotations, but **cannot convert** leads) |
| Fleet Manager / Driver Manager | `FLEET_MANAGER` / `DRIVER_MANAGER` |
| Finance Executive | `FINANCE` |
| (not in spec) | `CONTENT_MANAGER` (CMS only) |
| Driver / Customer | `DRIVER` / `CUSTOMER` |

This mapping is an assumption. It needs to be confirmed (decision **D1** in the plan).

---

## 2. Check results

| Check | Command | Before (baseline) | After this session |
|---|---|---|---|
| Type-check | `tsc --noEmit` | ✅ pass | ✅ pass |
| Lint | `eslint src` | ❌ 26 errors, 181 warnings | ❌ 25 errors, 172 warnings (all remaining errors existed before; none were introduced) |
| Unit tests | `npm test` | n/a (no tests existed) | ✅ 38 passed, 0 failed |
| Production build | `next build` | ✅ exit 0, with a `middleware` deprecation warning | ✅ exit 0, no deprecation warning |
| DB-backed tests / E2E | n/a | ❌ **could not run**: no DB reachable, no test DB, no E2E tooling | ❌ still cannot run |

Build caveat: during `next build` every prerendered CMS page logged `PrismaClientInitializationError: Can't reach database server`. The build still exits 0 and **caches empty CMS content** for static pages (ISR revalidates every 1h). A deploy built without DB access will serve empty CMS sections until revalidation.

Full details: [TESTING_STATUS.md](TESTING_STATUS.md).

---

## 3. Feature inventory

Status key: `IMPLEMENTED*` means code-verified only, not run against a database · `PARTIAL` · `STUB` · `MOCK` · `MISSING` · `BLOCKED`.
"Fixed" means the problem was corrected in this session (§6).

### 3.1 Core pipeline (spec §4)

| Step | Status | Evidence |
|---|---|---|
| Website enquiry → Lead | `IMPLEMENTED*` (was `MOCK`) | The homepage `TripRequestForm` was a `setTimeout`, so nothing was saved. Fixed: `POST /api/enquiries` validates, de-duplicates within 24h and creates a `NEW` lead with source `WEBSITE`. |
| Lead workspace, follow-ups, lead scoring | `IMPLEMENTED*` | `admin/leads/[id]`, `/api/admin/leads`, `/api/admin/followups` (follow-up outcomes update lead status) |
| Quotation with pricing calculator | `PARTIAL` | Calculator and status buttons exist in `admin/quotations/[id]`. Status changes are not validated (any status → any status), and pricing can be edited after approval. "Send" only flips the status: nothing is delivered to the customer. |
| Customer approval of quotation | `PARTIAL` | Only staff can approve. The customer portal cannot see pre-booking quotations (`/api/quotations?customerOnly` only returns quotations already linked to a booking). |
| Approved quotation → Booking | `IMPLEMENTED*` (fixed) | Was not idempotent, not transactional, fell back to the **admin's own user id** as the customer when the lead had no email, and dropped `returnDate`. A second server-action path skipped the approved-quotation rule. Now one service, `src/lib/lead-conversion.ts`, used by both. |
| Booking → Operations queue (Dispatch entry) | `IMPLEMENTED*` | Created in the same transaction as the booking |
| Vehicle availability and assignment | `IMPLEMENTED*` (fixed) | Overlaps were missed (assignments held on `Dispatch` were ignored, and the current booking conflicted with itself). Documents were only checked against "now". |
| Driver availability and assignment | `IMPLEMENTED*` (was **broken**) | An operator-precedence bug (`dropTime.getTime() - pickupDate.getTime() / 60000`) made **every driver assignment fail** with "would exceed max hours". Any trip that never reached `COMPLETED` also blocked its driver permanently. Fixed. |
| Dispatch finalize → Trip creation | `IMPLEMENTED*` (fixed) | Double-clicking created duplicate trips (or a 500 error). Writes were not transactional. No trip OTP was generated. Now locked, transactional and idempotent. |
| Booking status during dispatch | `IMPLEMENTED*` (fixed) | Booking status was never moved to `VEHICLE_ASSIGNED` or `DRIVER_ASSIGNED`. It is now synced by the dispatch service. |
| Trip execution (start/pickup/drop/complete) | `IMPLEMENTED*` (fixed) | `Trip.status` was never updated (stayed `SCHEDULED` forever). The OTP was compared in the browser and the driver could read it from the API. Customers could mark their own trip completed and closed. All fixed server-side. |
| Driver expenses and incidents | `IMPLEMENTED*` (driver side) / `MISSING` (admin review UI for incidents) | `/api/driver/expenses`, `/api/driver/incidents`. No admin incident screen. |
| Invoice on trip completion | `MISSING` | Spec says invoices are auto-generated by an event subscriber. No such subscriber exists. Invoices are manual only. |
| Payments | `IMPLEMENTED*` (fixed) | No input validation, no duplicate guard, invoice balance never updated. Fixed. |
| Invoices | `PARTIAL` (fixed in part) | The UI sent the customer's **name** as `customerId` (FK violation, so creation failed for any booking with a customer). The API accepted a client-supplied `paidAmount` (marking money received without a payment) and allowed duplicate invoices per booking. Fixed. No PDF or receipt output, and no send. |
| Driver settlements | `PARTIAL` | Manual entry of earnings, advance and expenses. Not calculated from persisted trips and expenses (spec §4D). No duplicate protection. |
| Post-trip rating | `IMPLEMENTED*` (fixed) | Only accepted the legacy `COMPLETED` status, so pipeline bookings could never be rated. The client could also rate any user id. Fixed. |

### 3.2 ERP modules (spec §1)

| Module | Status | Evidence / gap |
|---|---|---|
| Ops dashboard | `PARTIAL` | `getOperationsDashboard()` uses real aggregates. "Drops today" actually counts all in-progress bookings. There are no urgent alerts for document expiry or overdue invoices (spec §5.6). |
| Dispatch board | `IMPLEMENTED*` (fixed) | Five lanes. Failed assignments used to be silent, the vehicle and driver lists returned 401 for anyone but `ADMIN` (so the board broke for ops managers), and the driver dropdown listed **all users**, customers included. Fixed. The "Delayed" lane uses age since dispatch creation, not since the last state change. |
| Calendar | `IMPLEMENTED*` | `/api/admin/calendar` (bookings / vehicles / drivers views) |
| Bookings list and workspace | `PARTIAL` | The workspace has no Payments, Docs, Activity or Comm tabs (spec §5.1). The list has a "mark paid" action that sets `paymentStatus=PAID` **without recording a payment** (decision D5). |
| Trips list and detail | `PARTIAL` | `PATCH /api/admin/trips/[id]` lets ops set any trip status, vehicle or driver with no lifecycle or availability checks. `DELETE` hard-deletes trips. |
| Customers (CRM) | `PARTIAL` | List and profile exist. Customer workspace says "Booking history coming soon". No Comm or Notes tabs. |
| Follow-ups | `IMPLEMENTED*` | |
| Fleet: vehicles | `IMPLEMENTED*` | CRUD is `ADMIN`/`SUPER_ADMIN` only (the spec gives Fleet Manager CRUD) |
| Fleet: maintenance | `STUB` | `admin/maintenance` is a "Coming Soon" page. The `VehicleMaintenance` model exists and is used by availability checks and the calendar. |
| Fleet: fuel / expenses | `PARTIAL` | `admin/fleet/fuel` reads `/api/admin/expenses?type=FUEL`, but the API filters on `category`, so the `type` parameter is ignored. |
| Fleet: documents and expiry alerts | `PARTIAL` | Expiry dates are enforced at assignment. No alerts or notifications. |
| Drivers workspace | `PARTIAL` | List and edit only. No attendance, leave, shifts, trips, ratings or incidents tabs (spec §5.5). `DriverLeave` and `DriverShift` have **no admin API or UI** but are enforced by availability checks. |
| Finance dashboard / reports | `IMPLEMENTED*` | Server components with Prisma aggregates |
| Refunds | `PARTIAL` | `REFUND` payment type only. No refund workflow. |
| Reports (8 report pages, CSV export) | `IMPLEMENTED*` (fixed) | **CSV export was open to any logged-in user**, customers included (all leads and customer PII). Fixed. |
| CMS (homepage, fleet, pricing, nav, pages, FAQ, testimonials, gallery, blog, contacts, settings) | `IMPLEMENTED*` | Server actions with role checks in `src/lib/admin-cms.ts` |
| Settings: organization, roles | `STUB` | `admin/settings` is "Coming Soon" |
| Settings: webhooks | `IMPLEMENTED*` | Delivery only works now that the event system is initialized (fixed) |
| Audit log | `IMPLEMENTED*` (was effectively `MISSING`) | `initEventSystem()` was **never called**, so no audit rows, notifications or webhooks were ever produced. Fixed: initialized lazily on first event. |
| Notifications | `PARTIAL` | In-app DB rows only (`channel: PUSH`). **No UI reads them** (`/api/notifications` has no caller). No email, SMS or WhatsApp provider is configured, so external channels are `BLOCKED`. |

### 3.3 Driver app and customer portal

| Area | Status | Evidence / gap |
|---|---|---|
| Driver trip page (start with OTP, pickup, drop, complete, notes) | `IMPLEMENTED*` (fixed) | |
| Driver dashboard / rides list | `PARTIAL` | Contains legacy actions for statuses that don't exist in the enum (`REQUESTED`, `ACCEPTED`, so they are dead code) and `rides` uses legacy `STARTED`/`COMPLETED`. Drivers should use the trip page. |
| Driver earnings | `PARTIAL` (misleading) | Sums `booking.fare`, which is the **customer's fare**, not the driver's pay. It should come from `Settlement`. Converted bookings now carry `fare = totalFare` (needed by the finance dialogs), so this page shows the customer fare for them too until P4-3 is done. |
| Customer dashboard, bookings, history, invoices, profile, tracking | `IMPLEMENTED*` | Booking detail now shows the trip OTP (fixed) |
| Customer quotations | `PARTIAL` | See quotation approval above |
| Public "track / cancel / edit / reschedule / print / download" pages | `PARTIAL` / `STUB` | They call `/api/bookings/[id]`, which requires login. `edit` only updates `driverNotes`. `reschedule` sends a non-existent status `RESCHEDULED` (always 400). |

### 3.4 Public website (WEBSITE_DESIGN.md)

| Area | Status | Evidence / gap |
|---|---|---|
| Home, About, FAQ, Fleet, Pricing, Gallery, Blog, Testimonials, static pages | `IMPLEMENTED*` | CMS-backed through `src/lib/cms.ts` |
| Services pages | `IMPLEMENTED*` | |
| Tours, destinations | `MOCK` (static) | Hard-coded in `src/lib/tour-packages.ts` and `src/lib/destinations.ts`, including **prices, ratings and review counts** that need business verification |
| Offers | `MOCK` (static) | Hard-coded offers with promo codes no system honours, and a "valid until Jul 31, 2026" that has **already expired** |
| Contact form | `IMPLEMENTED*` (was `MOCK`) | It was a `setTimeout`. Now `POST /api/contact` writes to `ContactSubmission`, shown in Admin → CMS → Contacts. |
| Feedback form | `IMPLEMENTED*` (was `MOCK`) | Same endpoint, `department: feedback` |
| Customer login / register | `IMPLEMENTED*` (fixed) | See security findings |
| Phone OTP delivery | `BLOCKED` | No SMS gateway. The OTP is only logged in development. **Phone login does not work in production** until a provider is configured. |
| Online payments, maps / live tracking | `MISSING` (not in scope until a provider is chosen) | |

---

## 4. Security findings

| # | Severity | Finding | Status |
|---|---|---|---|
| S1 | **Critical** | `POST /api/auth/register` accepted `role` from the body: **anyone could self-register as `SUPER_ADMIN`** | Fixed: only `CUSTOMER` or `DRIVER`, minimum password length 8 |
| S2 | **Critical** | Universal OTP `000000` accepted in every environment, so **anyone could sign in as any user (including admins) knowing only their phone number** | Fixed: universal OTP only when `NODE_ENV !== "production"`; OTP sign-in limited to `CUSTOMER` accounts; 5-attempt limit; crypto-random codes |
| S3 | High | Dispatch endpoints (assign vehicle/driver, finalize, list) only required "logged in". Customers and drivers could dispatch. | Fixed: `OPS_ROLES` |
| S4 | High | Finance GET endpoints (payments, invoices, settlements, expenses) exposed all financial data and customer PII to any logged-in user | Fixed: finance read roles |
| S5 | High | CSV report export open to any logged-in user | Fixed |
| S6 | High | `/api/quotations` and `/api/invoices` returned **all** records to drivers | Fixed |
| S7 | High | Booking status endpoint let customers mark their own trips started, completed and closed, and let managers bypass availability checks by passing `vehicleId`/`driverId` | Fixed: role-specific transitions; assignment states only via dispatch |
| S8 | Medium | Trip OTP verified in the browser, and the driver received it in the API response | Fixed: server-side verification; OTP hidden from the driver |
| S9 | Medium | `/api/drivers/available` exposed live driver names, phones and locations to customers | Fixed |
| S10 | Medium | `PUT /api/bookings/[id]` (driver notes) could be called by any logged-in user on any booking | Fixed |
| S11 | Medium | In-memory OTP and auth-token stores do not work across serverless instances | Open (P1-6 in the plan) |
| S12 | Medium | No rate limiting on login, OTP or public forms (honeypot only) | Open |
| S13 | Low | `README.md` lists seed credentials (`admin123`, …). Unsafe if the seed is ever run against production. | Open (D6) |
| S14 | Low | Self-registered drivers are immediately active and assignable, with no vetting | Open (D4) |

---

## 5. Known bugs and risks (open)

1. **No migrations.** The schema is applied without a migration history, so production schema changes cannot be reviewed or rolled back (plan P1-1).
2. **Business rules not yet enforced:** quotation status transitions; editing an approved quotation's price; manual "mark paid" without a payment; `PATCH /api/admin/trips/[id]` bypasses lifecycle and availability; trip hard-delete.
3. **Day-granularity assignment windows.** A vehicle or driver can hold one booking per calendar day, because bookings have no reliable end time. This is safe against double-booking but may under-use the fleet for short local trips (decision D3).
4. **Timezone.** Day boundaries and shift checks use the server timezone. On a UTC host, IST midnight-to-05:30 falls on the previous day (plan P1-7).
5. **Event delivery is in-process and fire-and-forget.** A crash after commit loses notifications and webhooks. There is no retry or outbox.
6. **Driver online check** now applies only to trips starting today. The previous code blocked any future assignment for a driver who was offline at assignment time.
7. Prerendered CMS pages can be cached empty if built without DB access (§2).
8. Hard-coded marketing content (tours, destinations, offers) contains unverified prices and ratings and an expired offer.

---

## 6. Changes made in this session (Phase 2)

| Area | Files |
|---|---|
| Shared authorization | `src/lib/authz.ts`, `src/lib/authz-roles.ts` (new) |
| Booking lifecycle rules (pure, tested) | `src/lib/booking-lifecycle.ts` (new), `src/app/api/bookings/[id]/status/route.ts` |
| Availability fixes | `src/lib/vehicle-availability.ts`, `src/lib/driver-availability.ts` |
| Dispatch (transactions, locks, idempotency, OTP, status sync, events) | `src/lib/operations-queue.ts`, `src/app/api/admin/dispatch/**` |
| Lead conversion (single path) | `src/lib/lead-conversion.ts` (new), `src/app/api/admin/leads/[id]/convert/route.ts`, `src/lib/admin-crm.ts` |
| Finance integrity | `src/lib/finance.ts` (new), `src/app/api/admin/payments/route.ts`, `src/app/api/admin/invoices/route.ts`, `finance-dialogs.tsx` |
| Auth hardening | `src/app/api/auth/{register,send-otp,verify-otp}/route.ts`, `src/lib/otp.ts`, `src/proxy.ts` (renamed from the deprecated `middleware.ts`; adds the `FINANCE` role, which was locked out of `/admin`) |
| Endpoint permissions | admin users / vehicles / pricing / webhooks / audit / expenses / settlements / CSV, `/api/quotations`, `/api/invoices`, `/api/drivers/available`, `/api/bookings/[id]` |
| Event system initialized | `src/lib/event-bus.ts`, `src/lib/audit-logger.ts`, `src/lib/notifications.ts` (driver dispatch notification) |
| Website enquiries | `src/lib/enquiry-validation.ts`, `src/lib/enquiries.ts`, `src/app/api/enquiries/route.ts`, `src/app/api/contact/route.ts` (new); `TripRequestForm.tsx`, contact and feedback pages; `POST /api/bookings` now records an enquiry instead of creating an unvetted booking |
| UI feedback | dispatch board, driver trip page (OTP entry), customer booking page (OTP display), `useUpdateBookingStatus` (no more false "success") |
| Tests and scripts | `src/lib/__tests__/*.test.ts`, `package.json` (`test`, `typecheck`) |

**API behaviour changes:** `POST /api/bookings` (customer) now returns `{ reference, duplicate, message }` and creates a Lead, not a Booking. Invoice `PATCH` can no longer set `paidAmount`, `paymentStatus` or `paidAt`. Finalize and convert return `200` with the existing record on repeat calls (still `201` on creation). Assigning a driver now requires a vehicle first (spec §8.2). Drivers can no longer cancel bookings (permission matrix: Bookings = R for Driver). No UI in the repo depended on the removed behaviours.

---

## 7. Architecture and performance audit (second pass, 2026-10-13)

Scope: package manager, data-access patterns, request volume, client/server split, module boundaries. All findings come from reading the code. **No query timings or bundle sizes were measured**, because no profiling of a running app against data was possible here. Numbers below are counts from the code or configuration, not runtime measurements.

### Findings

| # | Finding | Evidence | Status |
|---|---|---|---|
| A1 | **Aggressive polling of unbounded lists.** `useBookings` refetched the full bookings list every **5 s** and `useBooking` every **3 s** on 9 pages. That included pages whose data only changes through the viewer's own actions: customer bookings/history, driver earnings/expenses/incidents. | `src/lib/hooks.ts` | **Fixed**: polling is opt-in (see below) |
| A2 | `/api/bookings` returned the full `Vehicle` row (32 columns, including document expiry dates) to customers and drivers. List views read only `name`, `model`, `plateNumber`. | `src/app/api/bookings/route.ts` | **Fixed**: 6-field `select` |
| A3 | Unbounded `findMany` (no `take`) in 20 API routes, including `/api/bookings`, payments, invoices, expenses, settlements, users, vehicles, dispatch. Payload and query cost grow with history. | grep of `src/app/api` | Open: P3-8 (needs paginated response shape plus UI paging) |
| A4 | Missing indexes for hot filters: `Booking.vehicleId` and `Booking.pickupDate` (availability overlap check, calendar, dashboard), `Dispatch.vehicleId` / `driverId` (overlap check). `Booking` is indexed only on customer, driver, status, type, createdAt, lead, quotation. | `prisma/schema.prisma` | Open: P3-9. Needs `EXPLAIN` on real data and a migration (P1-1). |
| A5 | `findAvailableVehicles` / `findAvailableDrivers` are N+1 (about 4 queries per candidate) but currently **unused**. | grep: no callers | Open: delete, or batch, when a "suggest available" UI is built |
| A6 | 44 of 100 `page.tsx` routes are entirely client components (20 of 48 admin pages); 64 files under `src/app` declare `"use client"`. Several admin list pages fetch on the client what a Server Component could render (e.g. `admin/bookings`, `admin/customers`, `admin/trips`). Oversized components: `(public)/page.tsx` 720 lines, `driver/page.tsx` 628, `admin/quotations/[id]` 587, `admin/finance` 580. | `grep "use client"`, `wc -l` | Open: P3-10, page by page, measured with build output and React profiler |
| A7 | Business rules still duplicated in places: role arrays declared locally in ~10 routes (same contents as `src/lib/authz-roles.ts`); fare maths in `src/lib/utils.ts` and again in the quotation page. | grep | Open: P3-11 (consolidate when touching each route) |
| A8 | Route handlers are a mix of thin (dispatch, convert, status: they call services in `src/lib`) and fat (invoices, payments, settlements, leads, quotations contain the business logic inline). | read | Open: P3-11, extract `src/lib/{quotations,finance}` services as each is changed |
| A9 | Next.js inferred the workspace root from a stray `C:\Users\RiteshKumar\package-lock.json`, widening resolution and file watching to the home directory. | build warning | **Fixed**: `turbopack.root` in `next.config.ts` |
| A10 | Admin bookings page redirected every role except exactly `ADMIN` (SUPER_ADMIN and ops managers bounced to `/`). | `src/app/admin/bookings/page.tsx` | **Fixed**: `STAFF_ROLES` |

### Request volume change (A1), from configuration, per focused browser tab

TanStack Query pauses interval polling in background tabs by default. Lists still refetch on window focus and after any booking mutation.

| Page | Before | After |
|---|---|---|
| Admin → Bookings | 12 req/min | 2 req/min (`POLL.list` 30 s) |
| Driver dashboard (incoming trips) | 12 req/min | 4 req/min (`POLL.queue` 15 s) |
| Driver trip page | 20 req/min, always | 6 req/min while the booking is in dispatch or on the trip; **0** once completed or cancelled |
| Customer bookings, customer history, driver rides, earnings, expenses, incidents | 12 req/min each | 0 (focus and mutation refresh only) |

Each `/api/bookings` request runs one `findMany` plus relation queries for customer, driver, vehicle and rating, over the **whole** history for staff.

### Modular-monolith assessment

One Next.js app and one database remain the right shape. There is no scaling or isolation requirement that would justify splitting services. The domain modules already forming in `src/lib` should be the boundary for each department:

| Department | Module(s) today | Gaps |
|---|---|---|
| CRM | `admin-crm.ts`, `enquiries.ts`, `enquiry-validation.ts`, `lead-scoring.ts`, `lead-conversion.ts` | Lead/follow-up logic still inline in routes |
| Quotations | none (inline in `api/admin/quotations/**`) | Extract with P2-1 |
| Bookings / lifecycle | `booking-lifecycle.ts`, `customer-timeline.ts` | |
| Operations / dispatch | `operations-queue.ts`, `vehicle-availability.ts`, `driver-availability.ts` | |
| Finance | `finance.ts` | Payment/invoice/settlement writes inline in routes |
| CMS | `cms.ts`, `admin-cms.ts` | |
| Platform | `auth.ts`, `authz*.ts`, `event-bus.ts`, `notifications.ts`, `audit-logger.ts`, `webhook-dispatcher.ts` | |

A repository layer is **not** recommended. Prisma already is the data-access abstraction, and wrapping simple queries would add indirection without value. Services should take an optional transaction client (`Db`), as the availability checks now do.

### Package manager (Phase 4)

The project used **npm** (`package-lock.json`, no CI or deployment config). The pnpm migration was verified in an isolated copy (details in TESTING_STATUS §6) and applied **additively**:
* added `pnpm-lock.yaml` (generated by `pnpm import` from `package-lock.json`; all 36 direct dependencies resolve to the same versions)
* added `pnpm-workspace.yaml` (`allowBuilds` for the six packages with required install scripts: Prisma ×3, esbuild, sharp, unrs-resolver)
* added `"packageManager": "pnpm@11.27.1"` and pnpm setup notes in the README
* **kept** `package-lock.json` and the existing npm-installed `node_modules`, pending your review (P1-8)

## 8. Session 3 (2026-10-13)

| Item | Outcome |
|---|---|
| pnpm switch (P1-8) | ✅ Done. `package-lock.json` deleted; `node_modules` reinstalled by pnpm; type-check, 46 tests and build pass. `corepack enable` needs admin rights on this machine, but the global pnpm already matches the pinned 11.27.1. |
| Pagination (P3-8) | ✅ 11 list endpoints accept `page`/`limit`. Legacy callers get the 500 newest rows plus `X-Has-More`. Admin bookings page paginated (50/page). Dispatch board no longer returns every dispatch ever made. |
| Security fix found on the way | `GET /api/admin/follow-ups` (CRM call notes) only required login. Now CRM roles only. |
| Fleet fuel page | Fixed the `?type=` vs `?category=` mismatch: it now shows fuel expenses only |
| Production schema drift | ✅ None (read-only check) |
| Migrations baseline (P1-1) | Prepared, **not applied** (see TESTING_STATUS §8) |
| Indexes (P3-9) | 4 indexes measured at 200k rows (7–45 ms → 0.06–0.7 ms), added as a migration, **not applied**. Production currently has 1 booking, so the benefit only appears with growth. |

## 9. Session 4 (2026-10-13): Neon setup

| Item | Outcome |
|---|---|
| Neon project | Linked to **CarService** (`small-star-85128616`), branch `production`, org `org-holy-glitter-98985798` (`.neon`, git-ignored) |
| Database | App now uses the CarService Neon DB (`ep-dawn-bird…`, pooled URL as `DATABASE_URL`, direct as `DATABASE_URL_UNPOOLED`). Prisma `directUrl` added for migrations. Both migrations applied (`migrate status`: up to date). The previous DB (`ep-delicate-recipe…`) is no longer referenced; old env files kept as git-ignored `*.backup-2026-10-13`. No data was copied from the old DB. The new DB was then seeded with website content, pricing, fleet and an Indian demo dataset (18 accounts, `*-DEMO-*` records; see README "Demo data and logins"). |
| Object Storage | Private bucket `assets` declared in `neon.ts` and provisioned. Wired via the Files SDK `neon` adapter (`src/lib/storage.ts`) and `/api/uploads` (upload, plus presigned 5-min reads with ownership checks). Driver expense receipts now upload to storage and store the key. Before this they were saved as base64 data URLs inside `Expense.receiptUrl`. |
| Neon Auth | Provisioned (`auth: true`), healthy (JWKS and `/ok` verified). **Not wired into login**: the app keeps NextAuth (Auth.js), per the neon-auth skill ("keep a working Auth.js unless asked to migrate"). Migrating would move every account and role, and needs your decision (D9). |
| Fix found while testing | Auth.js rejected all requests under `next start` (`UntrustedHost`): login was broken in any non-Vercel production run. Fixed with `AUTH_TRUST_HOST=true` in `.env.local`. **Set it in the production host's env too.** |
| Agent tooling | Neon MCP server (`.mcp.json`, OAuth, no key stored); skills `neon`, `neon-postgres`, `neon-object-storage`, `neon-auth` in `.claude/skills/` |

### Database configuration check (2026-10-13, read-only)

| Check | Result |
|---|---|
| `.env` `DATABASE_URL` (pooled, used by app and Prisma Client) | `ep-dawn-bird-b334ztap-pooler.c-4.ap-southeast-1.aws.neon.tech` |
| `.env` `DATABASE_URL_UNPOOLED` (Prisma `directUrl`, used by Migrate) | `ep-dawn-bird-b334ztap.c-4.ap-southeast-1.aws.neon.tech` |
| `.env.local` `DATABASE_URL` (Next.js runtime override) | same pooled host |
| Endpoint ownership (Neon API) | `ep-dawn-bird-b334ztap` → branch `production` (`br-billowing-glade-b3gk5x33`, default) → project CarService `small-star-85128616`, state active |
| `prisma migrate status` | ✅ "Database schema is up to date!" (2 migrations) |
| Pooled read-only query | ✅ `_prisma_migrations`: `0_init`, `20261013000000_add_assignment_indexes` |
| Old host `ep-delicate-recipe…` | Only in the git-ignored `.env.local.backup-2026-10-13`. Not read by Prisma or Next.js. |
| Persistent Windows `DATABASE_URL` (User/Machine) | none |

A `P1001` against the old host means `DATABASE_URL` is set in that terminal's process environment, which takes precedence over `.env` (Prisma never overrides an existing variable). Check with `echo $env:DATABASE_URL` and clear it with `Remove-Item Env:DATABASE_URL`, or open a new terminal.

## 10. Session 5 (2026-10-13): end-to-end workflow verification

The core workflow (enquiry → lead → quotation → approval → booking → availability → dispatch → trip → invoice → payment → settlement → close → review) is now **runtime-verified** by an HTTP integration suite against a disposable Neon branch: 32 checks pass, and 5 known gaps are recorded as TODO. Details: TESTING_STATUS §10.

Status changes from this verification:
* **Booking detail API** (`GET /api/bookings/[id]`) was returning 500 for every booking (pre-existing). Fixed. The customer booking page, driver trip page and admin booking workspace depend on it.
* **Booking payment status** now follows recorded payments (was never updated). Fixed.
* Steps 1–10 above move from "code-verified" to "runtime-verified via API". UI flows are still verified by code reading only.

## 11. Session 6 (2026-10-13): quotation pricing and status rules (P2-1)

**Root causes (all in `/api/admin/quotations`):** `POST` stored the client's `totalFare` unchecked and marked the lead `QUOTATION_SENT` while still a draft. `PATCH` allowed any status → any status (only APPROVED/REJECTED were role-checked), accepted price edits in every status including APPROVED, trusted the client total, allowed price and status changes in one request, and had no concurrency control. `DELETE` removed any quotation, including converted ones (unlinking the booking).

**Now enforced server-side** (`src/lib/quotation-rules.ts`, `src/lib/quotations.ts`; routes are thin wrappers):
* **Totals** use the existing calculator rule: `perKm × km + night + driver + parking + toll + permit + state tax`, GST % on that, minus a ₹ discount. Rounded to paise. A client total must match within ₹0.01, otherwise 400 with the expected amount.
* **Transitions:** DRAFT → SENT; SENT → UNDER_REVIEW / APPROVED / REJECTED / EXPIRED; UNDER_REVIEW → APPROVED / REJECTED / EXPIRED. APPROVED, REJECTED and EXPIRED are terminal. Managers (SUPER_ADMIN, ADMIN, BOOKING_MANAGER) review, approve, reject and expire. Sending and approving re-validate the stored pricing; approval also checks `validUntil`. Converted quotations can't change.
* **Price lock:** pricing editable only in DRAFT. Pricing and status can't change in the same request. Only unconverted drafts can be deleted.
* **Concurrency:** every write is conditional on the row's `status` and `updatedAt` (optimistic lock), giving 409 on conflict.
* **Conversion** books the approved quotation's stored, validated total (it can't change after approval).
* **UI:** the quotation page now shows the server's error instead of failing silently.

**No schema change.** Price lines are already columns on `Quotation` (Float, as used across the project). No migration.

**Data note:** the 8 demo quotations in production (`QT-DEMO-*`, from the seed) store GST as a ₹ amount, not a rate, so they break the rule (read-only audit). The seed is fixed for future runs. The existing rows need a data correction, pending approval (D13).

## 12. Session 7 (2026-10-13): automatic invoice on trip completion (P4-4)

**Authoritative path:** `PUT /api/bookings/[id]/status` with `TRIP_COMPLETED` (assigned driver or ops roles) is the only code that completes a booking. In the **same transaction** it now:
1. takes a per-booking invoicing lock (`pg_advisory_xact_lock`), also used by the manual `POST /api/admin/invoices`;
2. reuses an existing active invoice untouched, **or** creates a DRAFT invoice priced from the booking's approved quotation via the server pricing rule (`src/lib/invoicing.ts`, `planAutoInvoice`). The number is allocated under a global lock, the invoice is unpaid, and no payment is recorded;
3. moves the booking to `INVOICE_GENERATED` (spec §8.1/§9) when an invoice exists.

If the booking has no approved quotation, its pricing is inconsistent, or the booking fare differs from the approved total, the trip **still completes**. The booking stays `TRIP_COMPLETED`, an `INVOICE_SKIPPED` audit event records the reason, and finance invoices manually (existing flow). Any database error during invoicing rolls back the whole completion (verified with an injected failure).

**Concurrency:** optimistic booking-status update (the second completion gets 409), plus the per-booking advisory lock shared by the auto and manual paths (one active invoice per booking), plus a global lock for invoice numbers (replaces the P2002 retry loop).

**Known edge cases (not changed):**
* Advance payments recorded **before** completion without an `invoiceId` are not linked to the auto-generated invoice, so the invoice shows ₹0 paid while the booking shows PARTIAL. Finance must record later payments against the invoice. Linking them automatically needs a decision (D14).
* The 8 seeded `QT-DEMO-*` quotations (GST stored as ₹, D13) would be **skipped**, not invoiced, if their bookings were completed.
* `PATCH /api/admin/trips/[id]` can still set a trip to COMPLETED without touching the booking, so no invoice is created (open P2-2).
* Auto invoices have no due date (no payment-terms rule exists); finance sets it when sending.
* Audit/webhook events are emitted after commit and in-process (no outbox, P3-7).
