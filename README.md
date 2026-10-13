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


Admin	admin@aradhana.com	admin123
Driver	driver@aradhana.com	driver123
Customer	customer@aradhana.com	customer123