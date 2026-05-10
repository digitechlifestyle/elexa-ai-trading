#!/usr/bin/env node
/**
 * Elexa AI Trading — end-to-end smoke test.
 *
 * Run against any deployed environment by setting BASE, EMAIL, PASSWORD env
 * vars. Falls back to defaults for the production Vercel deployment.
 *
 * Usage:
 *   node scripts/e2e-test.mjs
 *   BASE=http://localhost:3000 node scripts/e2e-test.mjs
 *   EMAIL=test@test.com PASSWORD=password node scripts/e2e-test.mjs
 *
 * Exit code: 0 if all tests pass, 1 if any fail.
 */

const APP = process.env.BASE ?? "https://elexa-ai-trading.vercel.app";
const EMAIL = process.env.EMAIL ?? "test@test.com";
const PASS = process.env.PASSWORD ?? "password";

const results = [];
let cookies = "";

const pass = (name, msg = "") => results.push({ ok: true, name, msg });
const fail = (name, msg) => results.push({ ok: false, name, msg });

async function login() {
  const fd = new URLSearchParams({ email: EMAIL, password: PASS });
  const r = await fetch(`${APP}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: fd.toString(),
    redirect: "manual",
  });
  if (r.status !== 307) {
    fail("login", `status ${r.status}`);
    return false;
  }
  const setCookies = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  cookies = setCookies.map((c) => c.split(";")[0]).join("; ");
  if (!cookies) {
    fail("login", "no cookies set");
    return false;
  }
  pass("login");
  return true;
}

async function placeTrade(exchange, symbol, qty, side) {
  const r = await fetch(`${APP}/api/trading/paper`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({ exchange, symbol, qty, side }),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}

async function getPage(path) {
  const r = await fetch(`${APP}${path}`, { headers: { Cookie: cookies } });
  return r.status;
}

async function runAgent(agent, input) {
  const r = await fetch(`${APP}/api/agents/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookies },
    body: JSON.stringify({ agent, input }),
  });
  const j = await r.json().catch(() => ({}));
  return { status: r.status, body: j };
}

async function main() {
  console.log(`Testing ${APP} as ${EMAIL}\n`);

  if (!(await login())) {
    print();
    process.exit(1);
  }

  const trades = [
    ["alpaca", "AAPL", 1, "buy", "stock"],
    ["alpaca", "GLD", 1, "buy", "commodity gold"],
    ["alpaca", "SLV", 1, "buy", "commodity silver"],
    ["alpaca", "USO", 1, "buy", "commodity oil"],
    ["alpaca", "BTC", 0.001, "buy", "crypto"],
    ["alpaca", "ETH", 0.01, "buy", "crypto"],
    ["alpaca", "XRP", 10, "buy", "crypto"],
    ["alpaca", "SOL", 0.1, "buy", "crypto"],
    ["alpaca", "DOGE", 100, "buy", "meme"],
    ["alpaca", "SHIB", 100000, "buy", "meme"],
  ];

  for (const [ex, sym, qty, side, label] of trades) {
    const r = await placeTrade(ex, sym, qty, side);
    if (r.status === 201) {
      pass(`buy ${sym} ${qty} (${label})`, `id=${r.body?.trade?.id?.slice(0, 8)}`);
    } else {
      fail(`buy ${sym} ${qty} (${label})`, `status=${r.status} err=${r.body?.error}`);
    }
  }

  // Negative cases
  const bad1 = await placeTrade("alpaca", "FAKE123", 1, "buy");
  if (bad1.status >= 400 && bad1.status < 500) {
    pass("bad symbol rejected", `status=${bad1.status} code=${bad1.body?.code}`);
  } else {
    fail("bad symbol rejected", `status=${bad1.status}`);
  }

  const bad2 = await placeTrade("alpaca", "AAPL", 0, "buy");
  if (bad2.status >= 400 && bad2.status < 500) {
    pass("zero qty rejected", `status=${bad2.status}`);
  } else {
    fail("zero qty rejected", `status=${bad2.status}`);
  }

  const bad3 = await placeTrade("alpaca", "AAPL", 100, "buy");
  if (bad3.status === 422) {
    pass("oversize blocked", `code=${bad3.body?.code}`);
  } else {
    fail("oversize blocked", `status=${bad3.status}`);
  }

  // Pages
  for (const path of ["/dashboard", "/dashboard/portfolio", "/dashboard/journal", "/dashboard/agents", "/guide"]) {
    const status = await getPage(path);
    if (status === 200) pass(`page ${path}`);
    else fail(`page ${path}`, `status=${status}`);
  }

  // Agents
  const ag1 = await runAgent("quant", "Briefly analyze AAPL momentum");
  if (ag1.status === 200 && ag1.body?.run?.output) {
    pass("agent quant", `output_len=${ag1.body.run.output.length}`);
  } else {
    fail("agent quant", `status=${ag1.status}`);
  }

  const ag2 = await runAgent("compliance", "Our system guarantees consistent profits.");
  const out = ag2.body?.run?.output ?? "";
  if (ag2.status === 200 && /flag|guarant|risk/i.test(out)) {
    pass("agent compliance flags guarantees", `output_len=${out.length}`);
  } else {
    fail("agent compliance flags guarantees", `status=${ag2.status}`);
  }

  print();
  const total = results.length;
  const passed = results.filter((r) => r.ok).length;
  process.exit(passed === total ? 0 : 1);
}

function print() {
  console.log("=== RESULTS ===");
  for (const r of results) {
    console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.msg ? `  [${r.msg}]` : ""}`);
  }
  const total = results.length;
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${total} passed`);
}

main().catch((e) => {
  console.error(`FATAL: ${e.message}`);
  process.exit(1);
});
