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
