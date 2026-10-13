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
