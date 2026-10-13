# Aradhana Travel: Implementation Plan

**Last updated:** 2026-10-13
**Basis:** the evidence in [PROJECT_STATUS.md](PROJECT_STATUS.md). Task IDs are referenced from there.

Order: decisions → Phase 1 foundations → Phase 2 critical gaps (mostly done) → Phase 3 operations → Phase 4 fleet, drivers, finance → Phase 5 website/CMS → Phase 6 reporting/settings → Phase 7 release.
When a dependency forces a different order, the reason is given in the task.

---

## Decisions needed from the business owner

| ID | Decision | Why it matters | Recommendation |
|---|---|---|---|
| **D1** | Confirm the persona → role mapping (Ops Manager = `BOOKING_MANAGER`, Sales Exec = `SUPPORT_EXECUTIVE`, …). Or add explicit `OPS_MANAGER` / `SALES_EXECUTIVE` roles (needs a migration). | Every permission check depends on it | Keep the current roles and confirm the mapping. Revisit once real staff accounts exist. |
| **D2** | SMS / WhatsApp / email provider (e.g. MSG91, Twilio, AWS SES) and who owns the account | Phone OTP login does not work in production without it. Quotations and notifications are never delivered externally. | Pick one SMS provider first (OTP + booking SMS). Email second. |
| **D3** | Assignment granularity: a vehicle/driver holds **one booking per calendar day** (current, safe) or time-based windows (needs a reliable trip end time or duration on bookings) | Fleet utilisation for short local/airport trips | Keep day-based until bookings capture an estimated duration. Then switch `bookingWindow()` (one function). |
| **D4** | Should public driver self-registration exist? If yes, should new drivers start inactive until approved? | Unvetted drivers are assignable immediately | New drivers start `isActive=false`; Driver Manager approves |
| **D5** | Remove the "mark paid" button on the bookings list (sets paid without a payment record)? | Finance integrity: money marked received with no transaction | Replace it with "Record payment" (opens the existing dialog) |
| **D6** | Remove seed credentials from `README.md`, and confirm the seed is never run on production | Default admin password | Yes |
| **D7** | Are the hard-coded tour prices, ratings, review counts and offers real? | Truthful-claims requirement; one offer has expired | Move them to the CMS, or hide them until verified |
| **D8** | Is the Neon database in `.env` production? | Determines whether migrations need a maintenance window | Create a separate dev/test database |

---

## Phase 1: Foundations (blocks safe schema work and DB-backed tests)

| ID | Task | Acceptance criteria | Validation |
|---|---|---|---|
| P1-1 | Baseline Prisma migrations. Generate `prisma/migrations/0_init` from the current schema with `prisma migrate diff --from-empty`, then mark it applied on existing DBs with `migrate resolve --applied`. **Non-destructive; needs D8 first.** | `prisma migrate status` is clean on dev and prod. Future changes go through `migrate dev` / `migrate deploy`. | Run against a copy of prod first |
| P1-2 | Separate test database plus DB-backed integration tests for the services in `src/lib` (conversion, dispatch, status, payments) | The tests in the "Integration tests to add" section of TESTING_STATUS.md pass | `npm test` with `DATABASE_URL` pointing at the test DB |
| P1-3 | CI workflow: install, `typecheck`, `lint`, `test`, `build` | CI is red on any failure | GitHub Actions run on a PR |
| P1-4 | Fix the 25 pre-existing lint errors (`no-explicit-any` in the CSV export, React 19 hook-purity rules on several pages) | `eslint src` reports 0 errors | `npm run lint` |
| P1-5 | Build must not cache empty CMS pages: fail the build or skip prerender when the DB is unreachable | No `PrismaClientInitializationError` in build logs on CI with a test DB | `next build` |
| P1-6 | Move the OTP and auth-token stores into the database (or Redis) | OTP login works across instances and restarts | Integration test |
| P1-7 | Fix the business timezone at `Asia/Kolkata` for day windows, shift checks and dashboard "today" | Unit tests with UTC host time pass | `TZ=UTC npm test` |

## Phase 2: Critical gaps

✅ Done this session (code-verified, unit-tested where pure): S1–S10, the driver-availability bug, vehicle/driver overlap, dispatch idempotency and transactions, lead-conversion idempotency, trip/booking status sync, server-side trip OTP, event system initialization, finance input integrity, website enquiry/contact/feedback persistence. See PROJECT_STATUS §6.

Remaining:

| ID | Task | Acceptance criteria |
|---|---|---|
| P2-1 | Quotation lifecycle: validate transitions (`DRAFT→SENT→APPROVED/REJECTED`, `→EXPIRED`); lock pricing after `APPROVED`; reject approving an expired quote | A `PATCH` with an invalid transition returns 400. Pricing edits on an approved quote return 409. |
| P2-2 | Lock down `PATCH/DELETE /api/admin/trips/[id]`: status changes go through `bookings/[id]/status`; vehicle/driver changes go through availability checks; replace hard delete with cancel | No trip status change without the matching booking status. No delete of trips that have payments or expenses. |
| P2-3 | Implement D5 (remove or replace "mark paid") | `Booking.paymentStatus` derived from recorded payments |
| P2-4 | Rate limiting on `/api/auth/*`, `/api/enquiries`, `/api/contact` (DB- or Redis-backed) | 429 after N requests per IP per window |
| P2-5 | Cancelling a booking releases its dispatch (and trip) so it no longer blocks availability | A cancelled booking does not appear in overlap checks (already excluded by status) or on the board (already filtered). Trip is marked `CANCELLED` (done). Add a test. |

## Phase 3: Operations completion

| ID | Task | Acceptance criteria |
|---|---|---|
| P3-1 | Ops dashboard "urgent" panel: trips starting within 60 min without a driver, document expiries within 30 days, overdue invoices | Matches spec §5.6. Counts link to filtered lists. |
| P3-2 | Fix dashboard "Drops today" (currently all in-progress bookings) and the dispatch "Delayed" lane (use time since last status change, add `Dispatch.updatedAt`) | Numbers match a manual query on a seeded DB |
| P3-3 | Booking workspace tabs: Payments (with Record Payment), Activity (audit log by `entityId`), Notes, Docs | Spec §5.1 |
| P3-4 | Notification centre UI (bell + list) reading `/api/notifications` | Customer and driver see their notifications. Mark-read works. |
| P3-5 | Clean up the driver dashboard and rides list: remove legacy `REQUESTED`/`ACCEPTED`/`STARTED`/`COMPLETED` actions, link to the trip page | No buttons that always fail |
| P3-6 | Public booking self-service pages (`booking/track`, `edit`, `reschedule`, `cancel`): require login or a signed token; implement reschedule as a request to ops (not a status) | No page posts an invalid status |
| P3-7 | Reliable event delivery: outbox table and retry for webhooks and notifications (needs P1-1) | A failed webhook is retried with backoff. No duplicate business writes. |

## Phase 4: Fleet, drivers, finance

| ID | Task | Acceptance criteria |
|---|---|---|
| P4-1 | Maintenance module (replace the "Coming Soon" stub): schedule, complete, cost → `Expense` | A scheduled maintenance blocks assignment (already enforced). Completing it unblocks. |
| P4-2 | Driver workspace: leave (request/approve), shifts, attendance, trips, ratings, incidents (admin review). Needs an API for `DriverLeave` / `DriverShift`. | Spec §5.5. Approved leave blocks assignment (already enforced). |
| P4-3 | Settlement calculation from persisted data: completed trips × driver pay rule (**needs the business rule**), minus advances, plus or minus trip expenses. Idempotent per driver per period. | Re-running for the same period does not duplicate. Driver earnings page reads settlements. |
| P4-4 | Auto-generate the invoice on `TRIP_COMPLETED` (spec §9 rule) through an idempotent event subscriber that respects the one-active-invoice-per-booking rule | Exactly one invoice per completed booking, created as `DRAFT`, never marked paid |
| P4-5 | Invoice/receipt PDF and print view | Downloadable PDF with GST breakdown |
| P4-6 | Fleet expenses: fix the `?type=` vs `category` mismatch on the fuel page; give `FLEET_MANAGER` write access to expenses (permission matrix) | Fuel page shows only fuel expenses |
| P4-7 | Document expiry reminders (daily job → notifications) | Notification created 30/7/1 days before expiry |

## Phase 5: Website and CMS

| ID | Task | Acceptance criteria |
|---|---|---|
| P5-1 | Move tours, destinations and offers into the CMS (D7) | No hard-coded prices, ratings or offers in `src/lib` |
| P5-2 | Customer quotation view and approve in the portal (needs a lead↔customer link, e.g. `Lead.customerId`, migration after P1-1) | Customer can approve a `SENT` quote. Server validates ownership and expiry. |
| P5-3 | Quotation delivery via the provider chosen in D2 | Sent quote is logged in the lead activity |
| P5-4 | Check pages against WEBSITE_DESIGN.md (brand colours `#B91C1C`/`#F59E0B`, Playfair Display/Inter, mobile CTA bar, accessibility) | Lighthouse a11y ≥ 90 on key pages |

## Phase 6: Reporting and settings

| ID | Task |
|---|---|
| P6-1 | Settings → Organization and Roles screens (replace stub) |
| P6-2 | Audit log viewer filters by entity and links to the workspace |
| P6-3 | Report filters and exports for every department (spec "reports embedded everywhere") |

## Phase 7: Release readiness

| ID | Task |
|---|---|
| P7-1 | E2E tests (Playwright) for the six priority flows in TESTING_STATUS.md |
| P7-2 | Security review: dependency audit, headers/CSP, session settings, secrets rotation (`NEXTAUTH_SECRET`) |
| P7-3 | Production config check: `NEXTAUTH_URL`, DB connection pooling for Neon, error monitoring |
| P7-4 | Performance: N+1 in `findAvailableVehicles` / `findAvailableDrivers` (one availability query per candidate), pagination on bookings/payments/invoices lists |

---

## Next unfinished task

**P1-1 (migrations baseline), blocked on D8.** Until that is answered, the next safe task that needs no database is **P2-1 (quotation lifecycle validation)**.
