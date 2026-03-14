// benchmark.js — EcoPower 2.0 Real Performance Benchmark
// Run: node benchmark.js

const BASE = 'http://localhost:5005';
let token = null;
let userId = null;
let adminId = null;
let enterpriseId = null;

const results = [];

async function time(label, fn, runs = 5) {
  const times = [];
  let lastResult = null;
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    try { lastResult = await fn(); } catch (e) { lastResult = { error: e.message }; }
    times.push(performance.now() - t0);
  }
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = Math.min(...times);
  const max = Math.max(...times);
  const p95 = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)] || max;
  results.push({ label, avg: avg.toFixed(1), min: min.toFixed(1), max: max.toFixed(1), p95: p95.toFixed(1), runs });
  console.log(`  ${label.padEnd(52)} avg=${avg.toFixed(0)}ms  min=${min.toFixed(0)}ms  max=${max.toFixed(0)}ms  p95=${p95.toFixed(0)}ms`);
  return lastResult;
}

async function post(path, body, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;
  const r = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return r.json();
}

async function get(path) {
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const r = await fetch(`${BASE}${path}`, { headers });
  return r.json();
}

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║     EcoPower 2.0 — Live Performance Benchmark               ║');
  console.log('║     Target: http://localhost:5005  |  MongoDB Atlas          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ── 1. AUTH ──────────────────────────────────────────────────────────────
  console.log('── 1. Authentication ──────────────────────────────────────────');

  const loginData = await time('POST /api/users/login (consumer)', async () => {
    const d = await post('/api/users/login', { email: 'rahul.sharma@gmail.com', password: 'password123' });
    if (d.token) { token = d.token; userId = d.userId; }
    return d;
  }, 5);

  await time('POST /api/users/login (admin)', async () => {
    const d = await post('/api/users/login', { email: 'admin@ecopower.com', password: 'password123' });
    if (d.token) { adminId = d.userId; }
    return d;
  }, 5);

  await time('POST /api/users/login (enterprise)', async () => {
    const d = await post('/api/users/login', { email: 'vikram@techcorp.in', password: 'password123' });
    if (d.token) { enterpriseId = d.userId; }
    return d;
  }, 5);

  await time('POST /api/users/login (wrong password — error path)', async () => {
    return post('/api/users/login', { email: 'rahul.sharma@gmail.com', password: 'wrongpass' });
  }, 3);

  // ── 2. TELEMETRY ─────────────────────────────────────────────────────────
  console.log('\n── 2. Telemetry Dashboard ─────────────────────────────────────');

  await time('GET /api/telemetry/dashboard (consumer, 7d)', () =>
    get(`/api/telemetry/dashboard?userId=${userId}&role=consumer&range=7d`), 5);

  await time('GET /api/telemetry/dashboard (consumer, 30d)', () =>
    get(`/api/telemetry/dashboard?userId=${userId}&role=consumer&range=30d`), 5);

  await time('GET /api/telemetry/dashboard (consumer, 90d)', () =>
    get(`/api/telemetry/dashboard?userId=${userId}&role=consumer&range=90d`), 5);

  await time('GET /api/telemetry/dashboard (consumer, 1y)', () =>
    get(`/api/telemetry/dashboard?userId=${userId}&role=consumer&range=1y`), 5);

  await time('GET /api/telemetry/dashboard (admin, 30d)', () =>
    get(`/api/telemetry/dashboard?role=admin&range=30d`), 5);

  await time('GET /api/telemetry/dashboard (admin, 1y)', () =>
    get(`/api/telemetry/dashboard?role=admin&range=1y`), 5);

  await time('GET /api/telemetry/latest (by locationId)', async () => {
    const locs = await get(`/api/locations?userId=${userId}&role=consumer`);
    if (Array.isArray(locs) && locs.length > 0) {
      return get(`/api/telemetry/latest?locationId=${locs[0]._id || locs[0].locationId}`);
    }
    return { skipped: true };
  }, 3);

  // ── 3. INVOICES ──────────────────────────────────────────────────────────
  console.log('\n── 3. Invoices ────────────────────────────────────────────────');

  await time('GET /api/invoices (consumer)', () =>
    get(`/api/invoices?userId=${userId}&role=consumer`), 5);

  await time('GET /api/invoices (admin — all)', () =>
    get(`/api/invoices?role=admin`), 5);

  // ── 4. DEVICES ───────────────────────────────────────────────────────────
  console.log('\n── 4. Devices ─────────────────────────────────────────────────');

  await time('GET /api/devices (consumer)', () =>
    get(`/api/devices?userId=${userId}&role=consumer`), 5);

  await time('GET /api/devices (admin — all)', () =>
    get(`/api/devices?role=admin`), 5);

  // ── 5. PLANS ─────────────────────────────────────────────────────────────
  console.log('\n── 5. Plans & Subscriptions ───────────────────────────────────');

  await time('GET /api/plans', () => get('/api/plans'), 5);

  await time('GET /api/subscriptions (consumer)', () =>
    get(`/api/subscriptions?userId=${userId}&role=consumer`), 5);

  // ── 6. CARBON ────────────────────────────────────────────────────────────
  console.log('\n── 6. Carbon & Sustainability ─────────────────────────────────');

  await time('GET /api/carbon (consumer)', () =>
    get(`/api/carbon?userId=${userId}&role=consumer`), 5);

  await time('GET /api/carbon (admin — aggregate)', () =>
    get(`/api/carbon?role=admin`), 5);

  // ── 7. NOTIFICATIONS ─────────────────────────────────────────────────────
  console.log('\n── 7. Notifications ───────────────────────────────────────────');

  await time('GET /api/notifications (consumer)', () =>
    get(`/api/notifications?userId=${userId}&role=consumer`), 5);

  await time('GET /api/notifications (admin)', () =>
    get(`/api/notifications?role=admin`), 5);

  // ── 8. SUPPORT TICKETS ───────────────────────────────────────────────────
  console.log('\n── 8. Support Tickets ─────────────────────────────────────────');

  await time('GET /api/tickets (consumer)', () =>
    get(`/api/tickets?userId=${userId}&role=consumer`), 5);

  await time('GET /api/tickets (admin — all)', () =>
    get(`/api/tickets?role=admin`), 5);

  // ── 9. LOCATIONS ─────────────────────────────────────────────────────────
  console.log('\n── 9. Locations ───────────────────────────────────────────────');

  await time('GET /api/locations (consumer)', () =>
    get(`/api/locations?userId=${userId}&role=consumer`), 5);

  await time('GET /api/locations (admin)', () =>
    get(`/api/locations?role=admin`), 5);

  // ── 10. USERS ────────────────────────────────────────────────────────────
  console.log('\n── 10. Users ──────────────────────────────────────────────────');

  await time('GET /api/users (admin)', () =>
    get(`/api/users?role=admin`), 5);

  // ── 11. PAYMENTS ─────────────────────────────────────────────────────────
  console.log('\n── 11. Payments ───────────────────────────────────────────────');

  await time('GET /api/payments (consumer)', () =>
    get(`/api/payments?userId=${userId}&role=consumer`), 5);

  await time('GET /api/payment-methods (consumer)', () =>
    get(`/api/payment-methods?userId=${userId}`), 5);

  // ── 12. CONCURRENT LOAD ──────────────────────────────────────────────────
  console.log('\n── 12. Concurrent Load (simulating dashboard mount) ───────────');

  await time('Consumer dashboard mount (4 parallel requests)', async () => {
    return Promise.all([
      get(`/api/telemetry/dashboard?userId=${userId}&role=consumer&range=30d`),
      get(`/api/carbon?userId=${userId}&role=consumer`),
      get(`/api/invoices?userId=${userId}&role=consumer`),
      get(`/api/devices?userId=${userId}&role=consumer`),
    ]);
  }, 5);

  await time('Admin dashboard mount (6 parallel requests)', async () => {
    return Promise.all([
      get(`/api/locations?role=admin`),
      get(`/api/devices?role=admin`),
      get(`/api/tickets?role=admin`),
      get(`/api/telemetry/dashboard?role=admin&range=30d`),
      get(`/api/invoices?role=admin`),
      get(`/api/users?role=admin`),
    ]);
  }, 5);

  await time('Enterprise dashboard mount (5 parallel requests)', async () => {
    return Promise.all([
      get(`/api/telemetry/dashboard?userId=${enterpriseId}&role=enterprise&range=30d`),
      get(`/api/carbon?userId=${enterpriseId}&role=enterprise`),
      get(`/api/invoices?userId=${enterpriseId}&role=enterprise`),
      get(`/api/devices?userId=${enterpriseId}&role=enterprise`),
      get(`/api/locations?userId=${enterpriseId}&role=enterprise`),
    ]);
  }, 5);

  // ── 13. HEALTH ───────────────────────────────────────────────────────────
  console.log('\n── 13. Health Check ───────────────────────────────────────────');

  await time('GET /api/health', () => get('/api/health'), 10);

  // ── SUMMARY TABLE ────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║  BENCHMARK SUMMARY TABLE                                                    ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  ${'Endpoint'.padEnd(52)} ${'Avg'.padStart(6)} ${'Min'.padStart(6)} ${'Max'.padStart(6)} ${'p95'.padStart(6)}  ║`);
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  for (const r of results) {
    const label = r.label.length > 52 ? r.label.slice(0, 49) + '...' : r.label;
    console.log(`║  ${label.padEnd(52)} ${(r.avg+'ms').padStart(6)} ${(r.min+'ms').padStart(6)} ${(r.max+'ms').padStart(6)} ${(r.p95+'ms').padStart(6)}  ║`);
  }
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  // Slowest endpoints
  const sorted = [...results].sort((a, b) => parseFloat(b.avg) - parseFloat(a.avg));
  console.log('\n  TOP 5 SLOWEST ENDPOINTS:');
  sorted.slice(0, 5).forEach((r, i) => console.log(`  ${i+1}. ${r.label} — ${r.avg}ms avg`));

  // Fastest endpoints
  console.log('\n  TOP 5 FASTEST ENDPOINTS:');
  sorted.slice(-5).reverse().forEach((r, i) => console.log(`  ${i+1}. ${r.label} — ${r.avg}ms avg`));

  console.log('\n  Total endpoints benchmarked:', results.length);
  const overallAvg = (results.reduce((s, r) => s + parseFloat(r.avg), 0) / results.length).toFixed(1);
  console.log('  Overall average response time:', overallAvg + 'ms');
  console.log('  All times include: network (localhost) + Express routing + MongoDB Atlas round-trip\n');

  return results;
}

run().catch(console.error);
