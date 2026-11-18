// Phase 11.5: URL routing & deep-link navigation. In a real browser (Chromium through Playwright) served by a local server
// that reproduces the Vercel/Cloudflare SPA fallback (dotless paths serve index.html; real files are served as-is): every
// section has a stable URL, refresh and direct navigation preserve the page, Back/Forward work, the sidebar and URL always
// agree, and navigation never connects a wallet, changes the network or reloads the page. Not executed where Chromium cannot
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

// The production route registry, mirrored here so the test fails if the app and test drift apart.
const ROUTES = {
  '/': 'home', '/token-builder': 'simple', '/swap': 'swap', '/treasury': 'treasury', '/vault': 'vault',
  '/multisend': 'multisend', '/crosschain': 'crosschain', '/compile-deploy': 'deploy', '/ai-auditor': 'auditor',
  '/abi-playground': 'playground', '/test-lab': 'lab', '/deploy-history': 'history', '/gas-estimator': 'gas',
  '/verify': 'verify', '/share': 'share', '/contract-wizard': 'wizard', '/ai-solidity': 'nlai',
  '/analytics': 'analytics', '/test-generator': 'tests',
};

const headers = {};
{ let cur = false; for (const l of fs.readFileSync(path.join(dir, '_headers'), 'utf8').split('\n')) { if (l.startsWith('/')) { cur = l.trim() === '/*'; continue; } const m = l.match(/^\s+([A-Za-z-]+):\s*(.*)$/); if (cur && m) headers[m[1]] = m[2]; } }
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.toml': 'text/plain' };
const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0].split('#')[0];
  const f = path.join(dir, u === '/' ? 'index.html' : u);
  // SPA fallback, like the Vercel rewrite: a dotless path serves index.html; a real file (has an extension) is served as-is.
  if (u !== '/' && !/\.[^/]+$/.test(u)) {
    res.writeHead(200, { ...headers, 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
    res.end(fs.readFileSync(path.join(dir, 'index.html')));
    return;
  }
  if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { ...headers, 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
try { browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {}); } catch (e) { server.close(); skip('no Chromium could be started (' + String(e.message).split('\n')[0] + ')'); }

// A wallet that records every request, so navigation proves it never asks the wallet.
const walletScript = () => {
  window.__wallet = { calls: [], chainId: '0x13b2', on() {}, removeListener() {},
    async request(req) { window.__wallet.calls.push(req.method); if (req.method === 'eth_requestAccounts' || req.method === 'eth_accounts') return ['0x00000000000000000000000000000000000a11ce']; if (req.method === 'eth_chainId') return this.chainId; if (req.method === 'net_version') return String(parseInt(this.chainId, 16)); if (req.method === 'wallet_switchEthereumChain' || req.method === 'wallet_addEthereumChain') return null; if (req.method === 'eth_getBalance') return '0x0'; throw Object.assign(new Error('x'), { code: -32601 }); } };
  window.ethereum = window.__wallet;
};

const current = (page) => page.evaluate(() => ({
  path: window.location.pathname, hash: window.location.hash,
  active: document.querySelector('.nav-item.active')?.dataset.section || null,
  visible: [...document.querySelectorAll('main section.section')].filter((s) => s.style.display !== 'none').map((s) => s.id),
  walletCalls: window.__wallet.calls.length,
}));

// Click a sidebar item; on narrow screens the nav is collapsed behind the Menu toggle, so open it first.
const clickNav = async (page, section) => {
  const hidden = await page.evaluate(() => { const n = document.querySelector('.nav'); return n && getComputedStyle(n).display === 'none'; });
  if (hidden) await page.click('#navToggle');
  await page.click(`.nav-item[data-section="${section}"]`);
};

const viewports = [['mobile-390', { width: 390, height: 844 }], ['mobile-640', { width: 640, height: 900 }], ['tablet-768', { width: 768, height: 1000 }], ['desktop-1024', { width: 1024, height: 900 }], ['desktop-1280', { width: 1280, height: 900 }], ['desktop-1440', { width: 1440, height: 900 }]];

for (const [name, vp] of viewports) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: name.startsWith('mobile-'), isMobile: name.startsWith('mobile-') });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(String(e)));
  await page.addInitScript(walletScript);

  // 1. fresh / opens Home
  await page.goto(origin + '/', { waitUntil: 'load' });
  await page.waitForTimeout(150);
  let s = await current(page);
  ok(s.path === '/' && s.active === 'home' && s.visible.includes('sec-home'), name + ': fresh / opens Home', JSON.stringify(s));

  // 2-3. click AI → Solidity updates the URL; refresh keeps it
  await clickNav(page, 'nlai');
  await page.waitForTimeout(80);
  s = await current(page);
  ok(s.path === '/ai-solidity' && s.active === 'nlai' && s.visible.includes('sec-nlai'), name + ': clicking AI → Solidity updates the URL and section', JSON.stringify(s));
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(150);
  s = await current(page);
  ok(s.path === '/ai-solidity' && s.active === 'nlai', name + ': refresh /ai-solidity stays on AI → Solidity', JSON.stringify(s));

  // 4-5. direct /vault and refresh
  await page.goto(origin + '/vault', { waitUntil: 'load' }); await page.waitForTimeout(150);
  s = await current(page);
  ok(s.path === '/vault' && s.active === 'vault' && s.visible.includes('sec-vault'), name + ': direct /vault opens Vault', JSON.stringify(s));
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(150);
  s = await current(page);
  ok(s.path === '/vault' && s.active === 'vault', name + ': refresh /vault preserves the page', JSON.stringify(s));

  // 7. direct /compile-deploy opens without any wallet activity
  await page.goto(origin + '/compile-deploy', { waitUntil: 'load' }); await page.waitForTimeout(150);
  s = await current(page);
  ok(s.active === 'deploy' && s.visible.includes('sec-deploy') && s.walletCalls === 0, name + ': direct /compile-deploy opens without wallet activity', JSON.stringify(s));

  // 8-9. Back and Forward
  await page.goto(origin + '/', { waitUntil: 'load' }); await page.waitForTimeout(100);
  await clickNav(page, 'swap'); await page.waitForTimeout(60);
  await clickNav(page, 'treasury'); await page.waitForTimeout(60);
  s = await current(page); ok(s.path === '/treasury', name + ': after two clicks the URL is /treasury');
  await page.goBack(); await page.waitForTimeout(80);
  s = await current(page); ok(s.path === '/swap' && s.active === 'swap', name + ': Back returns to /swap', JSON.stringify(s));
  await page.goForward(); await page.waitForTimeout(80);
  s = await current(page); ok(s.path === '/treasury' && s.active === 'treasury', name + ': Forward returns to /treasury', JSON.stringify(s));

  // 13. repeated clicks to the same route do not duplicate history entries
  await page.goto(origin + '/', { waitUntil: 'load' }); await page.waitForTimeout(100);
  await clickNav(page, 'vault'); await page.waitForTimeout(60);
  await clickNav(page, 'vault'); await page.waitForTimeout(60);
  const len = await page.evaluate(() => history.length);
  await page.goBack(); await page.waitForTimeout(80);
  s = await current(page);
  ok(s.path === '/' && s.active === 'home', name + ': clicking the same route twice adds no history (Back goes straight Home)', JSON.stringify({ len, s }));

  // 10. sidebar active state matches the URL
  await page.goto(origin + '/share', { waitUntil: 'load' }); await page.waitForTimeout(150);
  s = await current(page);
  ok(s.active === 'share', name + ': sidebar active state matches /share', s.active);

  // 18. network unchanged by navigation
  await page.goto(origin + '/', { waitUntil: 'load' }); await page.waitForTimeout(100);
  const netBefore = await page.evaluate(() => activeNetwork);
  await clickNav(page, 'vault'); await page.waitForTimeout(60);
  await clickNav(page, 'swap'); await page.waitForTimeout(60);
  const netAfter = await page.evaluate(() => activeNetwork);
  ok(netBefore === 'arcMain' && netAfter === 'arcMain', name + ': navigation never changes the network', JSON.stringify({ netBefore, netAfter }));

  // 17. wallet remains disconnected (no requests) through navigation
  s = await current(page);
  ok(s.walletCalls === 0, name + ': navigation never asks the wallet', String(s.walletCalls));

  // 19. form state survives internal navigation (write a value, navigate away and back — the section is hidden, not re-rendered)
  await page.goto(origin + '/token-builder', { waitUntil: 'load' }); await page.waitForTimeout(150);
  await page.evaluate(() => { renderSimpleForm('erc20'); const el = document.getElementById('s_supply'); if (el) el.value = '12345'; });
  await clickNav(page, 'home'); await page.waitForTimeout(60);
  await clickNav(page, 'simple'); await page.waitForTimeout(60);
  const formVal = await page.evaluate(() => document.getElementById('s_supply')?.value);
  ok(formVal === '12345', name + ': builder form state survives internal navigation', JSON.stringify({ formVal }));

  // 25. dark and light themes still work
  await page.evaluate(() => { toggleTheme(); });
  ok(await page.evaluate(() => document.body.classList.contains('light')), name + ': light theme toggles on after routing');
  await page.evaluate(() => { toggleTheme(); });

  ok(problems.length === 0, name + ': no console errors', problems.slice(0, 3).join(' | '));
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'routing-' + name + '.png') });
  await ctx.close();
}

// Full route sweep (all 19 routes) on one desktop viewport: every registered path maps to its section and survives refresh.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(String(e)));
  await page.addInitScript(walletScript);
  for (const [route, section] of Object.entries(ROUTES)) {
    await page.goto(origin + route, { waitUntil: 'load' });
    await page.waitForTimeout(120);
    const s = await current(page);
    ok(s.active === section && s.visible.includes('sec-' + section) && s.path === route, `route ${route} → ${section}`, JSON.stringify(s));
    await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(120);
    const r = await current(page);
    ok(r.active === section, `route ${route} survives refresh`, JSON.stringify(r));
  }
  // 14. unknown route is handled safely (falls back to Home, no crash)
  await page.goto(origin + '/nonexistent-route', { waitUntil: 'load' }); await page.waitForTimeout(150);
  const u = await current(page);
  ok(u.active === 'home' && u.visible.includes('sec-home'), 'unknown route falls back to Home safely', JSON.stringify(u));
  // 15. #cfg= share link still imports
  const cfg = Buffer.from(unescape(encodeURIComponent(JSON.stringify({ network: 'arcMain', name: 'Shared', code: '// shared' }))), 'binary').toString('base64');
  await page.goto(origin + '/#cfg=' + cfg, { waitUntil: 'load' }); await page.waitForTimeout(200);
  const imported = await page.evaluate(() => pendingSource.name === 'Shared' && pendingSource.template === 'imported' && activeNetwork === 'arcMain');
  ok(imported, '#cfg= share link still imports the shared configuration');
  ok(problems.length === 0, 'no page errors across the route sweep', problems.slice(0, 3).join(' | '));
  await ctx.close();
}

await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
