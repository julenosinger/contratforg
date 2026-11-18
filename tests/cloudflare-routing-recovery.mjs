// Phase 11.5.1: Cloudflare Pages deep-link recovery. Reproduces Cloudflare's real SPA serving behavior in a local server
// (a top-level 404.html would be served for unmatched routes and, here, redirect to "/"; without it, index.html is served
// at the requested URL with a 200) and proves every route survives direct navigation and F5 with no root redirect. It also
// distinguishes an HTTP redirect (301/302/308) from a JavaScript redirect (location.href). Not executed where Chromium cannot
// start (it then prints a notice and exits 0, unless REQUIRE_BROWSER=1). SHOTS=/dir saves screenshots.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, '../contractforge-deploy');
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('FAIL', m, d || ''); } };
const skip = (why) => { if (process.env.REQUIRE_BROWSER === '1') { console.error('FAIL: ' + why + ' (REQUIRE_BROWSER=1)'); process.exit(1); } console.log('NOT tested in a real browser: ' + why); process.exit(0); };
let chromium;
try { ({ chromium } = await import('playwright')); } catch (_) { skip('playwright is not installed'); }

const ROUTES = {
  '/': 'home', '/token-builder': 'simple', '/swap': 'swap', '/treasury': 'treasury', '/vault': 'vault',
  '/multisend': 'multisend', '/crosschain': 'crosschain', '/compile-deploy': 'deploy', '/ai-auditor': 'auditor',
  '/abi-playground': 'playground', '/test-lab': 'lab', '/deploy-history': 'history', '/gas-estimator': 'gas',
  '/verify': 'verify', '/share': 'share', '/contract-wizard': 'wizard', '/ai-solidity': 'nlai',
  '/analytics': 'analytics', '/test-generator': 'tests',
};
const SECTIONS = [...new Set(Object.values(ROUTES))];

const headers = {};
{ let cur = false; for (const l of fs.readFileSync(path.join(dir, '_headers'), 'utf8').split('\n')) { if (l.startsWith('/')) { cur = l.trim() === '/*'; continue; } const m = l.match(/^\s+([A-Za-z-]+):\s*(.*)$/); if (cur && m) headers[m[1]] = m[2]; } }
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.toml': 'text/plain' };

// The fix under test: there must be no top-level 404.html (its presence disables Cloudflare's SPA fallback, and the old one
// redirected to "/"). Assert this directly so a regression that re-adds it fails here.
{
  const p404 = path.join(dir, '404.html');
  ok(!fs.existsSync(p404), 'no top-level 404.html is shipped (Cloudflare serves index.html for unmatched routes)', p404);
  const redirects = fs.existsSync(path.join(dir, '_redirects')) ? fs.readFileSync(path.join(dir, '_redirects'), 'utf8') : '';
  ok(/\/index\.html\s+200/.test(redirects), 'the _redirects SPA fallback (/* /index.html 200) is present', redirects.trim());
}

// A server that reproduces Cloudflare Pages' behavior: real files are served as-is; any unmatched path serves index.html
// with a 200 (the default SPA behavior when there is no 404.html). It never emits an HTTP redirect for SPA routes.
const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0].split('#')[0];
  const f = path.join(dir, u === '/' ? 'index.html' : u);
  const isFile = u !== '/' && /\.[^/]+$/.test(u) && fs.existsSync(f) && fs.statSync(f).isFile();
  if (isFile) {
    res.writeHead(200, { ...headers, 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(fs.readFileSync(f));
    return;
  }
  // SPA fallback: serve index.html at the requested URL with a 200 (never a redirect).
  res.writeHead(200, { ...headers, 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
  res.end(fs.readFileSync(path.join(dir, 'index.html')));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
try { browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {}); } catch (e) { server.close(); skip('no Chromium could be started (' + String(e.message).split('\n')[0] + ')'); }

const walletScript = () => {
  window.__wallet = { calls: [], chainId: '0x13b2', on() {}, removeListener() {},
    async request(req) { window.__wallet.calls.push(req.method); if (req.method === 'eth_requestAccounts' || req.method === 'eth_accounts') return ['0x00000000000000000000000000000000000a11ce']; if (req.method === 'eth_chainId') return this.chainId; if (req.method === 'net_version') return String(parseInt(this.chainId, 16)); if (req.method === 'wallet_switchEthereumChain' || req.method === 'wallet_addEthereumChain') return null; if (req.method === 'eth_getBalance') return '0x0'; throw Object.assign(new Error('x'), { code: -32601 }); } };
  window.ethereum = window.__wallet;
};

// For every route: direct navigation returns the app (HTTP 200, no redirect), the URL is preserved, and the right section shows.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const problems = [];
  const redirects = [];
  page.on('pageerror', (e) => problems.push(String(e)));
  page.on('response', (r) => { if (r.status() >= 300 && r.status() < 400) redirects.push(r.status() + ' ' + r.url()); });
  await page.addInitScript(walletScript);

  for (const [route, section] of Object.entries(ROUTES)) {
    const resp = await page.goto(origin + route, { waitUntil: 'load' });
    await page.waitForTimeout(100);
    const s = await page.evaluate(() => ({
      url: window.location.href, path: window.location.pathname,
      active: document.querySelector('.nav-item.active')?.dataset.section || null,
      visible: [...document.querySelectorAll('main section.section')].filter((x) => x.style.display !== 'none').map((x) => x.id),
      walletCalls: window.__wallet.calls.length,
    }));
    ok(resp && resp.status() === 200, `${route}: the document response is 200 (not a redirect)`, resp ? String(resp.status()) : 'no response');
    ok(s.path === route, `${route}: the URL is preserved (no redirect to /)`, JSON.stringify(s));
    ok(s.active === section && s.visible.includes('sec-' + section), `${route}: the correct section is shown and active`, JSON.stringify(s));

    // F5 / reload preserves the route
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(100);
    const r = await page.evaluate(() => ({ path: window.location.pathname, active: document.querySelector('.nav-item.active')?.dataset.section || null }));
    ok(r.path === route && r.active === section, `${route}: F5 preserves the route and section`, JSON.stringify(r));
  }

  // No HTTP redirects were issued by the server for any route
  ok(redirects.length === 0, 'no HTTP redirect (3xx) was issued for any SPA route', redirects.join(' | '));
  // No JavaScript root-redirect ran (the app's router never forces '/')
  ok(await page.evaluate(() => window.location.pathname !== '/'), 'after navigation the URL is not forced back to /', await page.evaluate(() => window.location.pathname));
  // Wallet and network remain untouched across all this navigation
  ok(await page.evaluate(() => activeNetwork === 'arcMain'), 'the network stays Arc Mainnet');
  ok(await page.evaluate(() => window.__wallet.calls.length === 0), 'navigation never asks the wallet');
  ok(problems.length === 0, 'no console errors across the route sweep', problems.slice(0, 3).join(' | '));
  await ctx.close();
}

// Distinguish an HTTP redirect from a JavaScript redirect: the server returns 200 with no Location, and the app never sets location.href='/'.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  let httpRedirect = false, jsRootRedirect = false;
  page.on('response', (r) => { if (r.status() >= 300 && r.status() < 400) httpRedirect = true; });
  await page.addInitScript(() => { const orig = window.location.replace; window.__jsRedirects = []; window.location.replace = (u) => { window.__jsRedirects.push(String(u)); return orig.call(window.location, u); }; });
  const resp = await page.goto(origin + '/ai-solidity', { waitUntil: 'load' });
  await page.waitForTimeout(150);
  const jsRedirects = await page.evaluate(() => window.__jsRedirects || []);
  ok(resp.status() === 200 && !httpRedirect, 'the /ai-solidity document is served directly (HTTP 200, no 3xx)', String(resp.status()));
  ok(jsRedirects.length === 0, 'no JavaScript location.replace to / ran', JSON.stringify(jsRedirects));
  ok(await page.evaluate(() => window.location.pathname === '/ai-solidity'), 'the URL stays /ai-solidity');
  await ctx.close();
}

// Static assets keep their real content types (the SPA fallback must not turn .js/.css into HTML).
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const assets = { '/app.js': 'javascript', '/app.css': 'css', '/favicon.svg': 'svg', '/vendor/MANIFEST.json': 'json' };
  for (const [p, want] of Object.entries(assets)) {
    const resp = await page.goto(origin + p, { waitUntil: 'load' });
    const ct = resp ? resp.headers()['content-type'] || '' : '';
    ok(resp && resp.status() === 200 && ct.includes(want), `${p} serves its real type (${want})`, ct);
  }
  await ctx.close();
}

// Back/Forward and share-link compatibility across the Cloudflare-style server.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(walletScript);
  await page.goto(origin + '/', { waitUntil: 'load' }); await page.waitForTimeout(80);
  await page.goto(origin + '/vault', { waitUntil: 'load' }); await page.waitForTimeout(80);
  await page.goto(origin + '/swap', { waitUntil: 'load' }); await page.waitForTimeout(80);
  await page.goBack(); await page.waitForTimeout(80);
  ok(await page.evaluate(() => window.location.pathname === '/vault' && document.querySelector('.nav-item.active')?.dataset.section === 'vault'), 'Back returns to /vault');
  await page.goForward(); await page.waitForTimeout(80);
  ok(await page.evaluate(() => window.location.pathname === '/swap' && document.querySelector('.nav-item.active')?.dataset.section === 'swap'), 'Forward returns to /swap');
  // #cfg= share link still imports
  const cfg = Buffer.from(unescape(encodeURIComponent(JSON.stringify({ network: 'arcMain', name: 'Shared', code: '// x' }))), 'binary').toString('base64');
  await page.goto(origin + '/#cfg=' + cfg, { waitUntil: 'load' }); await page.waitForTimeout(200);
  ok(await page.evaluate(() => pendingSource.name === 'Shared' && pendingSource.template === 'imported'), '#cfg= share link still imports');
  await ctx.close();
}

// Mobile routing works (nav toggle on small screens) and /compile-deploy never deploys.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(walletScript);
  await page.goto(origin + '/', { waitUntil: 'load' }); await page.waitForTimeout(100);
  const hidden = await page.evaluate(() => getComputedStyle(document.querySelector('.nav')).display === 'none');
  ok(hidden, 'mobile: the sidebar is behind the Menu toggle');
  await page.click('#navToggle'); await page.waitForTimeout(60);
  await page.click('.nav-item[data-section="vault"]'); await page.waitForTimeout(80);
  ok(await page.evaluate(() => window.location.pathname === '/vault'), 'mobile: clicking a nav item navigates to /vault');
  await page.goto(origin + '/compile-deploy', { waitUntil: 'load' }); await page.waitForTimeout(120);
  ok(await page.evaluate(() => window.__wallet.calls.length === 0 && document.querySelector('.nav-item.active')?.dataset.section === 'deploy'), '/compile-deploy opens without any wallet or deploy activity');
  await ctx.close();
}

await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
