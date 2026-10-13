// Integration test runner: starts the built app against an ISOLATED database and runs
// tests/integration/*.test.ts over HTTP.
//
//   pnpm build
//   pnpm test:integration -- --env-file <path-to-test-branch.env> [--port 3100]
//
// The env file must hold the test database's DATABASE_URL / DATABASE_URL_UNPOOLED (and, optionally,
// the branch's AWS_* object-storage variables), e.g. from:
//   neon branches create --name e2e-test --parent production --expires-at <ISO>
//   neon env pull --branch e2e-test --file <path> -s postgres,object-storage
//
// Safety: refuses to run if the test database host equals the host in the project's .env /
// .env.local (production). Values from the env file are passed to the app as process env, which
// Next.js never overrides from .env files, and nothing is written to the project's env files.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

function parseEnv(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/.exec(line);
    if (m) out[m[1]] = m[2];
  }
  return out;
}
const hostOf = (url) => {
  try { return new URL(url).hostname; } catch { return ""; }
};

const envFile = arg("env-file");
if (!envFile || !existsSync(envFile)) {
  console.error("Usage: pnpm test:integration -- --env-file <test-branch.env> [--port 3100]");
  process.exit(2);
}
const testEnv = parseEnv(envFile);
const testHosts = [testEnv.DATABASE_URL, testEnv.DATABASE_URL_UNPOOLED].map(hostOf).filter(Boolean);
if (testHosts.length === 0) {
  console.error(`No DATABASE_URL in ${envFile}`);
  process.exit(2);
}

// Guard: never run against the database the project is configured for.
const forbidden = new Set();
for (const f of [".env", ".env.local"]) {
  const p = path.join(root, f);
  if (!existsSync(p)) continue;
  const e = parseEnv(p);
  for (const k of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]) if (e[k]) forbidden.add(hostOf(e[k]));
}
const clash = testHosts.filter((h) => forbidden.has(h));
if (clash.length) {
  console.error(`Refusing to run: test database host ${clash.join(", ")} is the project's configured database.`);
  process.exit(2);
}

if (!existsSync(path.join(root, ".next", "BUILD_ID"))) {
  console.error("No production build found. Run `pnpm build` first.");
  process.exit(2);
}

const port = Number(arg("port", "3100"));
const base = `http://localhost:${port}`;
const appEnv = {
  ...process.env,
  ...testEnv,
  NEXTAUTH_URL: base,
  AUTH_TRUST_HOST: "true",
  NODE_ENV: "production",
};

console.log(`Test database: ${testHosts.join(", ")}`);
console.log(`Starting app on ${base} ...`);
const server = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "-p", String(port)], {
  cwd: root, env: appEnv, stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (d) => (serverLog += d));
server.stderr.on("data", (d) => (serverLog += d));

const stop = () => { if (!server.killed) server.kill(); };
process.on("exit", stop);

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`${base}/api/auth/csrf`);
      if (res.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`App did not start on ${base}\n${serverLog.slice(-2000)}`);
}

try {
  await waitForServer();
  const code = await new Promise((resolve) => {
    const tests = spawn(process.execPath, [path.join(root, "node_modules/tsx/dist/cli.mjs"), "--test", "--test-concurrency=1", "tests/integration/*.test.ts"], {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        INTEGRATION_BASE_URL: base,
        INTEGRATION_DATABASE_URL: testEnv.DATABASE_URL_UNPOOLED || testEnv.DATABASE_URL,
        INTEGRATION_FORBIDDEN_HOSTS: [...forbidden].join(","),
      },
    });
    tests.on("exit", (c) => resolve(c ?? 1));
  });
  if (code !== 0 && /error/i.test(serverLog)) {
    console.log("\n--- last app server output ---\n" + serverLog.slice(-3000));
  }
  stop();
  process.exit(code);
} catch (err) {
  console.error(err.message);
  stop();
  process.exit(1);
}
