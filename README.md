This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

This project uses **pnpm** (version pinned in `package.json` → `packageManager`; enable it with `corepack enable`).

```bash
pnpm install          # build scripts for Prisma, esbuild, sharp, unrs-resolver are allow-listed in pnpm-workspace.yaml
pnpm prisma:generate
pnpm dev
```

Checks: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.

> pnpm is the only package manager (`package-lock.json` was removed on 2026-10-13). Don't run `npm install`.

### Neon

This app runs on Neon project **CarService** (`neon.ts` declares Postgres, Neon Auth and the private `assets` bucket). After `neon login`, `neon deploy` provisions what `neon.ts` declares and writes `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_AUTH_*` and `AWS_*` (object storage) into `.env`. Set `AUTH_TRUST_HOST=true` wherever the app runs outside Vercel.

### Database migrations

Schema changes go through Prisma Migrate (`prisma/migrations/`, baseline `0_init`).

* Production: `pnpm prisma:status`, then `pnpm prisma:deploy` (applies pending migrations only, never resets).
* **Warning:** `.env` currently points at the production Neon database. Never run `pnpm prisma:migrate` (`migrate dev`) or `prisma db push` against it: `migrate dev` can offer to reset the database. Use a Neon branch / separate `DATABASE_URL` for development.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Demo data and logins

`pnpm prisma:seed` (or `node node_modules/tsx/dist/cli.mjs prisma/seed.ts`) loads website content, pricing, fleet and an Indian demo dataset: one account per staff role, 4 drivers, 6 customers, and leads and bookings at every lifecycle stage (`*-DEMO-*` numbers).

* Passwords are **random per account and printed once** at the end of the run. They are never stored in the repo. Re-running never resets them.
* `SEED_PASSWORD=...` sets one password for all *new* accounts (local dev only).
* Staff sign in at `/admin/login`; drivers and customers at `/login`.





I seeded your CarService database with an Indian demo dataset: website content, pricing, fleet, 18 accounts, and bookings at every stage. All 18 logins were tested in the running app and each signs in with the correct role.

**Save these passwords now.** They were generated randomly, appear only here, and are not stored anywhere in the project. I deleted the temporary file that held them.

## Staff (sign in at `/admin/login`)

| Role | Name | Login ID | Password |
|---|---|---|---|
| SUPER_ADMIN | Ritesh Kumar | `superadmin@aradhana.example` | `sr9ENEQBea4C5rwa1!` |
| ADMIN | Anil Mathur | `admin@aradhana.example` | `m_zKnOc7Wn9vBWPu2!` |
| BOOKING_MANAGER (Operations Manager) | Deepak Joshi | `ops@aradhana.example` | `XH4Rbbf0wjHhZzXk4!` |
| SUPPORT_EXECUTIVE (Sales Executive) | Kavita Sharma | `sales@aradhana.example` | `wsI6y4q6PrbS_s-X7!` |
| FLEET_MANAGER | Manoj Yadav | `fleet@aradhana.example` | `LAmPU0JRe-ZA1YdB3!` |
| DRIVER_MANAGER | Harish Choudhary | `drivers@aradhana.example` | `OgpJwCoRkes0_OeH0!` |
| FINANCE | Pooja Jain | `finance@aradhana.example` | `B4ebK0bCxyMX8N-s8!` |
| CONTENT_MANAGER | Neha Kapoor | `content@aradhana.example` | `lOsx8hFL6hJ8GP6a7!` |

## Drivers (sign in at `/login`)

| Name | Login ID | Password | Vehicle | Trips |
|---|---|---|---|---|
| Suresh Kumar | `suresh.kumar@aradhana.example` | `oAzKgF-P4LmJXO736!` | Innova Crysta RJ-14-XX-2001 | Airport run tomorrow; past airport trip (rated 5★) |
| Ramesh Meena | `ramesh.meena@aradhana.example` | `uMHBcpvbzNHoGX4O6!` | Honda City RJ-14-XX-1002 | Jaipur → Agra in 2 days, ready to start |
| Mahendra Singh Shekhawat | `mahendra.shekhawat@aradhana.example` | `fi7r47Wg681vVE1M8!` | Scorpio RJ-14-XX-2002 | Jaipur → Jodhpur, in progress today |
| Abdul Rashid | `abdul.rashid@aradhana.example` | `PPWrJIgOR-E1rPu73!` | Etios RJ-14-XX-1001 | Jaipur → Ajmer, completed 5 days ago |

## Customers (sign in at `/login`)

| Name | Login ID | Password | Bookings |
|---|---|---|---|
| Rajesh Sharma | `rajesh.sharma@example.com` | `1xXKzspeL7mYInWP5!` | Ajmer trip invoiced (₹1,000 advance paid, balance due); airport trip closed and rated |
| Priya Singh | `priya.singh@example.com` | `rN1T_KAkK8RrAN5L1!` | Jaipur → Delhi in 3 days, awaiting a vehicle |
| Vikram Singh Rathore | `vikram.rathore@example.com` | `sMsszBkhZmcuONyk3!` | Jodhpur round trip, in progress |
| Anita Gupta | `anita.gupta@example.com` | `ZXSlJsf4jz5U3ktl1!` | Agra day trip, dispatched; her trip OTP is on her booking page |
| Mohammed Irfan | `mohammed.irfan@example.com` | `k4C5yT-FA9TmeQDI2!` | Airport drop tomorrow, vehicle and driver assigned |
| Sneha Agarwal | `sneha.agarwal@example.com` | `m-fHSxx09Bfne_He5!` | Amer Fort booking cancelled; Pushkar quotation awaiting her approval |

There are also 3 open leads without accounts: Amit Verma (new website enquiry), Karan Mehta (contacted, follow-up due) and Sneha's quotation stage.

## What else is in the data
- **Every stage is represented:** the dispatch board has items in the Awaiting, Ready and Running lanes. Each booking comes from an approved quotation, as the app's rules require.
- **Finance:** 2 invoices (one paid in full, one partly paid), payments matching the invoice balances, trip expenses, one driver settlement paid, and one 5★ rating.
- **An alert to test with:** the Scorpio's insurance expires in 10 days.
- **Website:** settings, menus, About/Privacy/Terms pages, a blog post, the fleet catalogue and pricing.

## How it was verified
- **Logins:** all 18 accounts signed in through the app with the correct role. Staff see all 7 bookings; each driver and customer sees only their own.
- **Re-running the seed** created nothing new and left every password unchanged.
- **Type-check** passes.

## What changed in the project
- [prisma/seed.ts](prisma/seed.ts) is rewritten: random passwords printed once, safe to re-run, and all demo records numbered `*-DEMO-*` so they're easy to find and remove. Setting `SEED_PASSWORD=…` gives every *new* account one password, for local development.
- The README no longer lists the old `admin123` / `driver123` / `customer123` logins, and documents the seed instead.

## Notes
- **This is your production database.** Before real customers use it, change these passwords or delete the demo accounts and `*-DEMO-*` records.
- **Login IDs** use reserved test domains (`@aradhana.example`, `@example.com`) so no real inbox is involved.
- **Phone numbers** are made up but follow the real Indian format, so some could belong to actual people. Don't send SMS to them.
