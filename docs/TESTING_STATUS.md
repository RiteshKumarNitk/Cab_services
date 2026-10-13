# Aradhana Travel: Testing Status

**Last run:** 2026-10-13, Windows 11, Node v23.5.0

## 1. How to run

| Check | Command | Notes |
|---|---|---|
| Type-check | `npm run typecheck` | `tsc --noEmit` |
| Lint | `npm run lint` | ESLint 9, `eslint-config-next` 16 |
| Unit tests | `npm test` | `tsx --test "src/**/__tests__/*.test.ts"` (Node's built-in runner; no extra dependency) |
| Build | `npm run build` | Needs `DATABASE_URL` reachable, or prerendered CMS pages are cached empty |

> On the audit machine the npm shim could not find `tsx` on the shell's PATH, so the suite was run with `node node_modules/tsx/dist/cli.mjs --test "src/**/__tests__/*.test.ts"`. The result is identical.

## 2. Results

| Check | Baseline (before changes) | Current | Detail |
|---|---|---|---|
| Type-check | ✅ pass | ✅ pass | |
| Lint | ❌ 26 errors / 181 warnings | ❌ 25 errors / 172 warnings | All remaining errors existed before this session: `no-explicit-any` (CSV export, others), React 19 `react-hooks/purity` and `set-state-in-effect` (dispatch board, driver trip page, several admin pages), `no-unescaped-entities`. Tracked as plan P1-4. |
| Unit tests | none existed | ✅ **38 passed / 0 failed / 0 skipped** (9 suites) | |
| Build | ✅ exit 0 (with a middleware deprecation warning) | ✅ exit 0 | Logged `PrismaClientInitializationError: Can't reach database server` for prerendered CMS pages in both runs. The audit machine has no route to the Neon host. |
| Integration tests (DB) | ❌ not run | ❌ not run | **Not possible:** no test database. The `.env` database may be production (D8), so it was deliberately not used. |
| E2E | ❌ not run | ❌ not run | No E2E tooling in the repo |
| Migrations | n/a | n/a | No `prisma/migrations` directory exists (plan P1-1). No schema changes were made this session. |

## 3. What the unit tests cover

| File | Covers |
|---|---|
| `src/lib/__tests__/booking-lifecycle.test.ts` | Invalid transitions rejected; terminal states; assignment statuses only via dispatch; customer may cancel only pre-trip and only their own booking; **customer can no longer progress or close a trip** (previous bug); driver may run only their own trip and cannot cancel; finance close-out only; content/support roles blocked; OTP required only for driver start; 4-digit OTP; trip-status mirroring; assignment-window overlap (same day, consecutive days, multi-day, bad return date); shift parsing |
| `src/lib/__tests__/enquiry-validation.test.ts` | Indian mobile normalization; past pickup dates rejected; round trip needs a later return date; field-level messages; honeypot; enum validation; optional email |
| `src/lib/__tests__/finance.test.ts` | Net paid with refunds; rounding; invoice payment state (pending → partial → paid; refund reopens; cancelled stays cancelled; a new invoice is never paid) |

## 4. Not covered yet (gaps, by risk)

These are the main gaps. The code paths exist and type-check, but have **not been executed against a database**:

1. Lead conversion: idempotency, the approved-quotation rule, customer resolution, the `P2002` race (`src/lib/lead-conversion.ts`)
2. Dispatch: advisory-lock concurrency, overlap detection through `Dispatch` and `Booking`, finalize idempotency, OTP generation (`src/lib/operations-queue.ts`)
3. Booking status route: optimistic `409`, cancellation record, trip status sync, OTP check
4. Payments and invoices: duplicate guard, invoice balance recalculation, one-invoice-per-booking `409`
5. Role checks on every route (401/403 matrix)
6. Enquiry dedupe query (`mode: "insensitive"` on `pickupAddress`)
7. All UI states (loading/error/empty/success) were changed by reading the code only, not exercised in a browser

### Integration tests to add (plan P1-2), each against a disposable test DB

| Flow | Test |
|---|---|
| Enquiry → Lead → Quotation | POST enquiry twice → one lead; create quote; approve |
| Quotation approval → Booking | Convert twice in parallel → one booking, one dispatch; convert without an approved quote → 400 |
| Booking → Assignment → Dispatch | Two bookings same day, same vehicle → second assignment 400; parallel assign → exactly one succeeds; finalize twice → one trip |
| Dispatch → Trip execution | Driver start with wrong OTP → 400; correct → `TRIP_STARTED`, trip `IN_PROGRESS`; customer tries `PICKUP_COMPLETED` → 403 |
| Completion → Invoice → Payment → Settlement | Invoice twice → 409; partial then full payment → invoice `PAID`; repeat payment within 2 min → same id |
| Customer data access | Customer A reads booking B → 403; driver reads `/api/admin/payments` → 403; CSV export as customer → 403 |

## 5. Manual smoke test checklist (until E2E exists)

1. Homepage form: submit a trip → success reference shown → lead appears in Admin → Leads with source `WEBSITE`. Submit the same trip again → same reference.
2. Contact and feedback forms → entries in Admin → CMS → Contacts.
3. Approve a quotation → convert → booking appears on the Dispatch Board (Awaiting).
4. Assign vehicle → assign driver (the dropdown lists drivers only) → Dispatch → toast "trip created"; the customer booking page shows the OTP.
5. Log in as the driver → trip page → Start with a wrong OTP (error toast) → with the right OTP → pickup → drop → complete.
6. Try registering via the API with `"role":"ADMIN"` → 400.
7. As a customer, call `GET /api/admin/payments` → 403.

## 6. pnpm migration verification (2026-10-13)

Run in an **isolated copy** of the repo, so the project's npm-installed `node_modules` was not touched. The copy was deleted afterwards.

| Step | Result |
|---|---|
| `pnpm import` (from `package-lock.json`) | ✅ 739 packages resolved |
| `pnpm install --frozen-lockfile` | ✅ installed. pnpm 11 blocks dependency build scripts by default, so they were allow-listed via `pnpm approve-builds` for the six packages that need them. |
| Direct dependency versions vs npm install | ✅ 36/36 identical |
| Install scripts and `prisma generate` | ✅. Run with `node` directly: in this tool environment, `cmd.exe` children get an empty PATH, so pnpm (and npm) lifecycle scripts can't find `node`. This is an environment limitation; it also explains the earlier `npm test` shim failure. |
| `tsc --noEmit` | ✅ |
| Unit tests | ✅ 39/39 |
| ESLint | Same as npm: 25 errors / 172 warnings, all pre-existing |
| `next build` | ✅ exit 0, 139/139 static pages, route table identical to the npm build (149 lines). It must run from a short path: a first attempt in a deeply nested temp directory hit the Windows 260-char path limit in Turbopack chunk names. |

Re-run on your machine before deleting `package-lock.json`: `corepack enable && pnpm install --frozen-lockfile && pnpm typecheck && pnpm test && pnpm build`.

## 7. Second-session results (after the performance changes)

| Check | Result |
|---|---|
| Type-check | ✅ |
| Unit tests | ✅ 39/39 (adds `isLiveBookingStatus`) |
| Lint | 25 errors / 172 warnings (unchanged, all pre-existing) |
| `next build` (npm install, with DB access) | ✅ exit 0, and the "inferred your workspace root" warning is gone after `turbopack.root` |

## 8. Session 3 (2026-10-13): pnpm switch, pagination, migrations, indexes

### Checks on the real project (pnpm-installed `node_modules`)

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | ✅ 635 packages. The six allow-listed build scripts were run with `node` directly (tool-environment PATH issue, see §6). |
| Type-check | ✅ |
| Unit tests | ✅ **46/46** (adds `pagination.test.ts`: param parsing and clamping, legacy array plus `X-Has-More`, paged envelope) |
| Lint | 25 errors / 172 warnings (unchanged, all pre-existing) |
| `next build` | ✅ 139/139 static pages. A first attempt failed while Neon was waking from suspend: `/blog/[slug]` `generateStaticParams` cannot reach the DB, which fails the build (P1-5). The retry passed. |
| Schema drift, prod DB vs `schema.prisma` (read-only `migrate diff --from-schema-datasource`) | ✅ empty diff: production matches the schema exactly |
| `prisma validate` | ✅ |

### Query-plan measurements (P3-9)

**Production (read-only transaction):** Booking 1 row, Vehicle 9, User 5, Dispatch/Trip/Payment/Invoice 0. Every hot query ran in ≤ 1.1 ms. At this size the planner seq-scans regardless, so production plans cannot show index value.

**At scale:** synthetic copies in session `TEMP` tables on the same Neon Postgres, inside a transaction that was **rolled back** (nothing written to `public`). Data: 200,000 bookings over 3 years, 200 vehicles, 300 drivers, 50,000 customers, about 5% active; 200,000 dispatches, 1,000 undispatched. Existing schema indexes recreated, `ANALYZE`d, warm-cache second run reported. Two runs gave consistent numbers (second run shown):

| Query (code path) | Before | After | Index |
|---|---|---|---|
| Q1 vehicle overlap (`checkVehicleAvailability`) | 7.42 ms (bitmap on status only) | 0.50 ms | `Booking(vehicleId, pickupDate)` |
| Q2 driver overlap (`checkDriverAvailability`) | 0.41 ms | 0.48 ms | none needed: existing `Booking(driverId)` suffices, so `(driverId, pickupDate)` was **not** added |
| Q3 dispatch overlap, vehicle | 13.17 ms (seq scan) | 0.73 ms | `Dispatch(vehicleId)` |
| Q3b dispatch overlap, driver | 14.32 ms (seq scan) | 0.57 ms | `Dispatch(driverId)` |
| Q4 calendar month (`/api/admin/calendar`) | 45.91 ms (seq scan) | 0.60 ms | `Booking(pickupDate)` |
| Q5 dashboard today (`getOperationsDashboard`) | 29.96 ms (seq scan) | 0.06 ms | `Booking(pickupDate)` |

Limits: synthetic distribution, warm cache, single client, server-side execution time only (no network). The scripts are kept outside the repo.

### Migrations

* `prisma/migrations/0_init` was generated from the schema (`migrate diff --from-empty`): 43 tables, 17 enums, 123 indexes. It matches production (empty drift diff).
* `prisma/migrations/20261013000000_add_assignment_indexes`: the 4 indexes above.
* **Not yet applied to production.** `migrate status` reports `0_init` pending. The baseline/deploy step was blocked by the tool's permission policy for production deploys and is left for you to run (IMPLEMENTATION_PLAN P1-1).

## 9. Neon services end-to-end (2026-10-13)

Production build (`next build`) against the new CarService DB: ✅ exit 0, 135/135 static pages (fewer than before because the new DB has no blog or fleet rows to prerender). Unit tests: ✅ 52/52 (adds `uploads.test.ts`).

`next start` plus an HTTP test script (temporary users with random passwords, everything removed afterwards, residue check: 0 rows left):

| # | Check | Result |
|---|---|---|
| 1 | `GET /` renders from the new DB | ✅ 200 |
| 2 | `POST /api/enquiries` creates a lead, row persisted | ✅ 201 |
| 3 | Duplicate enquiry returns the same lead | ✅ 200 |
| 4 | Anonymous upload rejected | ✅ 401 |
| 5 | Driver signs in (NextAuth credentials) | ✅ (needed `AUTH_TRUST_HOST`) |
| 6 | Driver uploads a receipt to the `assets` bucket | ✅ 201 |
| 7 | Owner gets a presigned redirect to the branch storage endpoint | ✅ 302 |
| 8 | Presigned URL returns identical bytes (sha256) | ✅ 200 |
| 9 | Unsigned object URL denied (bucket private) | ✅ 403 |
| 10 | Another driver cannot read the object | ✅ 404 |
| 11 | Expense stores the key, not the bytes | ✅ 201 |
| 12 | Inline base64 receipt rejected | ✅ 400 |
| 13 | Another driver cannot attach the key | ✅ 400 |
| 14 | Neon Auth JWKS serves an EdDSA key | ✅ 200 |
| 15 | Neon Auth `/ok` | ✅ 200 |

## 10. End-to-end workflow integration suite (2026-10-13)

**What:** `tests/integration/workflow.test.ts` drives the full business workflow over HTTP against the production build, with real NextAuth logins for every actor (ops manager, sales executive, finance, 3 drivers, 2 customers). Uses the existing `node:test` + `tsx` setup; no new dependencies.

**Where it runs:** an isolated, disposable Neon branch (`e2e-test-20261013`, copy of `production`, auto-expires 2026-10-15). Never production:
* `scripts/run-integration.mjs` refuses to start if the test database host equals the host in `.env`/`.env.local` (verified: exit 2 when pointed at production).
* `tests/integration/helpers.ts` repeats the check before connecting.
* Branch variables are passed as process env only; project env files are not modified.
* Every record carries a run id and is deleted afterwards. Read-only residue check: 0 test users/leads/vehicles on the branch and in production. Production unchanged (7 bookings, 18 users).

**How to run:**
```bash
neon branches create --project-id small-star-85128616 --name e2e-test --parent production --expires-at <ISO>
neon env pull --project-id small-star-85128616 --branch e2e-test --file <outside-repo>/e2e.env -s postgres,object-storage
pnpm build
pnpm test:integration -- --env-file <outside-repo>/e2e.env
```

**Result: 32 passed, 0 failed, 5 TODO (known gaps), 55 s.** The first run had 3 failures: 2 real bugs (fixed, below) and 1 wrong test expectation (corrected).

| Step | Verified behaviour |
|---|---|
| 1 Enquiry | Public enquiry → `NEW` `WEBSITE` lead; duplicate submission returns the same lead (1 row); invalid input → 400 with field errors |
| 2 Lead | Sales finds it by phone; customers get 401/403 on the CRM API |
| 3 Quotation | Sales creates (DRAFT) and sends; sales **cannot** approve (403); ops manager approves (`approvedById` set) |
| 4 Booking | Conversion refused without an approved quote (400 `requiresQuotation`); approved → exactly one `BOOKING_CONFIRMED` booking, matched to the existing customer by email, fare copied from the quote, dispatch `PENDING`, lead `WON`; repeat call returns the same booking (200) |
| 5 Availability | Driver before vehicle → 400; vehicle with expired insurance → 400; vehicle already booked that day → 400; driver already assigned that day → 400; **two parallel assignments of one vehicle → exactly one succeeds** |
| 6 Dispatch | Assignment statuses can't be set via the status API (400); customers can't dispatch (403/401); finalize creates one trip with a 4-digit OTP; repeat finalize returns the same trip; notification and audit-log subscribers fire |
| 7 Trip | Customer sees the OTP, assigned driver doesn't, other driver/customer get 403; wrong OTP → 400; other driver → 403; customer can't cancel/progress a running trip (403); pickup → drop → complete updates booking and trip (`COMPLETED`, actual times); `TRIP_COMPLETED → TRIP_STARTED` → 400; driver logs an expense |
| 8 Invoice | Finance-only (401/403 otherwise); total = subtotal + GST − discount; client-sent `paidAmount` ignored (starts 0, PENDING); customer taken from booking; second invoice for the booking → 409; finance moves booking to `INVOICE_GENERATED` |
| 9 Payment / settlement | Negative amount → 400; advance → invoice `PARTIALLY_PAID`; identical resubmission → same payment id; final payment → invoice `PAID` (paid = total); booking `paymentStatus` → `PAID`; settlement net payable = earnings − advance − expenses; marked paid |
| 10 Close | Finance closes; other customer can't rate (403); customer rates once, second rating → 409; final record graph consistent (lead, approved quote, fare match, dispatched, trip completed, 1 invoice PAID, payments sum = total, rating) |
| Pagination | Paged envelope (`total`, `totalPages`), legacy array, status filter; customers/drivers see only their own bookings; payments filter by booking with paging |
| Security | Customer CSV export → 403; self-registration as ADMIN → 400 |

**Not covered (TODO in the suite, features missing):** auto-invoice on trip completion (P4-4), settlement calculated from persisted data (P4-3), server-side quotation total validation and quotation transition rules (P2-1), customer quotation approval in the portal (P5-2). Also not covered: browser UI flows (no E2E browser tool), object-storage receipt upload inside this suite (covered separately in §9), notifications delivery to external channels (none configured).

### Bugs found by the suite and fixed

| Bug | Impact | Fix |
|---|---|---|
| `GET /api/bookings/[id]` returned **500 for every booking**. Prisma rejects `select` + `include` on the same relation (`driver`). Present since the initial commit. | Customer booking page, driver trip page, admin booking workspace and public tracking were all broken | `driver: { select: { …, driverStatus: true } }` in `src/app/api/bookings/[id]/route.ts` |
| `Booking.paymentStatus` never changed when payments were recorded | Bookings stayed `PENDING` after full payment; the bookings list and reports showed wrong payment state | `recalculateBookingPayment()` in `src/lib/finance.ts`, called in the payment transaction (+2 unit tests) |

### Commands and results (this session)

| Command | Result |
|---|---|
| `tsc --noEmit` | ✅ |
| Unit tests (`pnpm test`) | ✅ 54/54 |
| Integration (`pnpm test:integration -- --env-file …`) | ✅ 32 pass, 0 fail, 5 todo |
| ESLint (`src`) | 25 errors / 171 warnings, all pre-existing; new/changed files: 0 problems |
| `next build` | ✅ 140/140 static pages |
| `prisma validate` | ✅ |
| `prisma migrate status` (production, read-only) | ✅ up to date, 2 migrations |
| Runner guard against production `.env` | ✅ refused (exit 2) |

## 11. Quotation pricing and status rules (2026-10-13)

**Suites:** `src/lib/__tests__/quotation-rules.test.ts` (17 unit tests) and `tests/integration/quotations.test.ts` (18 HTTP tests on the guarded Neon test branch). `workflow.test.ts` fixtures moved to the calculator rule (₹3,990 example), and its two quotation TODOs are now real tests.

| Command | Result |
|---|---|
| `tsc --noEmit` | ✅ |
| Unit tests | ✅ 71/71 |
| Integration (both suites) | ✅ 50 pass, 0 fail, 3 TODO (auto-invoice P4-4, settlement calc P4-3, customer portal approval P5-2) |
| `next build` | ✅ 140/140 |
| ESLint `src` | 25 errors / 171 warnings, identical to before. All 13 warnings in touched files pre-existed (unused imports in the quotation page, unused variables in the seed content block) |
| Residue (read-only) | 0 test users on branch and production |

Integration coverage:

| Area | Tests |
|---|---|
| Totals | computed when omitted; matching client total accepted; tampered total → 400 with expected amount; negative line, GST > 28 %, discount > subtotal + GST → 400; draft edit recomputes (₹4,200), wrong total in edit → 400 and nothing stored; unpriced draft cannot be sent; legacy row with inconsistent stored total cannot be sent |
| Transitions | draft creation leaves lead `NEW`, sending sets `QUOTATION_SENT`; sales cannot approve/reject (403); customer/driver/anonymous → 401; DRAFT → APPROVED, APPROVED → DRAFT/SENT/REJECTED, REJECTED → SENT → 400; approval past `validUntil` → 400; approval audit-logged with approver |
| Price lock | price/line edits after SENT or APPROVED → 409 (`totalFare`, `discount`, `perKmCharge`, `gst`, `baseFare`); price change combined with a status change → 400; approved quote cannot be deleted (409); draft can |
| Conversion | 3 parallel conversions → 1 booking; booking `totalFare` = approved ₹3,990; converted quote frozen (status change and delete → 409) |
| Concurrency | simultaneous approve + reject → exactly one wins (other 400/409); simultaneous edit + send → stored total always matches stored lines |

**Found while testing:** approval audit entries were filed under the lead, because the audit logger preferred `leadId` over an explicit `entityId`. Fixed in `src/lib/audit-logger.ts`; only the quotation events set `entityId`, so no other audit entries change.

## 12. Automatic invoice on trip completion, P4-4 (2026-10-13)

**Suites:** `src/lib/__tests__/invoicing.test.ts` (7 unit tests for `planAutoInvoice`) and `tests/integration/invoicing.test.ts` (7 HTTP tests). `workflow.test.ts` now expects the automatic invoice; its P4-4 TODO became real assertions.

| Command | Result |
|---|---|
| `tsc --noEmit` | ✅ |
| Unit tests | ✅ 78/78 |
| Integration (workflow + quotations + invoicing) | ✅ **58 pass, 0 fail, 2 TODO** (settlement calculation P4-3, customer portal approval P5-2), 201 s |
| `next build` | ✅ 140/140 |
| ESLint `src` | 25 errors / 171 warnings, unchanged; changed/new files: 0 problems |
| Post-run, read-only | test branch: injected trigger/function removed (0/0), 0 test users. Production: 0 test users, counts unchanged (7 bookings, 2 invoices, 2 payments) |

| Integration test | Verified |
|---|---|
| Happy path | `TRIP_COMPLETED` → response `INVOICE_GENERATED`, `autoInvoice.created`; exactly 1 invoice `INV-nnnnn`, DRAFT, subtotal 3800 / GST 190 / discount 90 / total 3900 from the approved quotation (client-sent amounts ignored); paid 0, PENDING; no payment created; booking fare = invoice total; trip COMPLETED; `INVOICE_GENERATED` audit entry. Repeat completion → 400, still 1 invoice |
| Concurrency | 3 parallel completions (driver ×2 + ops) → exactly one 200, others 400/409, 1 invoice |
| Existing invoice | Manual invoice + ₹500 payment before completion → `autoInvoice.existing`, invoice and payment rows byte-identical afterwards, still 1 invoice |
| Not invoiceable | Approved quotation with inconsistent pricing (legacy) → trip completes, booking stays `TRIP_COMPLETED`, `autoInvoice.skipped` with reason, 0 invoices, `INVOICE_SKIPPED` audit entry; manual invoice + finance `INVOICE_GENERATED` still work |
| Authorization | Customer / other driver → 403, anonymous → 401, driver/customer manual invoice → 401; nothing changed. Ops completing on the driver's behalf → invoice created |
| Atomicity | A temporary DB trigger on the **test branch** makes the invoice INSERT fail → completion returns 500; booking stays `DROP_COMPLETED`, `endTime` null, trip `REACHED_DESTINATION`, 0 invoices. Trigger removed → retry creates exactly 1 invoice |
| Numbering | Two parallel completions on different bookings → consecutive, unique invoice numbers |
