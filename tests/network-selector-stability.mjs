// Phase 11.4.1: network-selector stability. In a real browser (Chromium through Playwright): the collapsed selector carries no verbose
// warning, the mainnet switch confirmation names the real source network, and switching the Mainnets/Testnets/All category never closes
// the panel. A mock EIP-1193 provider records every request so we can prove filter changes never ask the wallet. Not executed where
// Chromium cannot start (it then prints a notice and exits 0, unless REQUIRE_BROWSER=1). SHOTS=/dir saves screenshots.
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

const headers = {};
{ let cur = false; for (const l of fs.readFileSync(path.join(dir, '_headers'), 'utf8').split('\n')) { if (l.startsWith('/')) { cur = l.trim() === '/*'; continue; } const m = l.match(/^\s+([A-Za-z-]+):\s*(.*)$/); if (cur && m) headers[m[1]] = m[2]; } }
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0]; const f = path.join(dir, u === '/' ? 'index.html' : u);
  if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { ...headers, 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
try { browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {}); } catch (e) { server.close(); skip('no Chromium could be started (' + String(e.message).split('\n')[0] + ')'); }

// A wallet we can steer and that records every request, so we can prove filter changes never ask it.
const walletScript = () => {
  window.__wallet = {
    calls: [], chainId: '0x13b2',
    on() {}, removeListener() {},
    async request(req) { window.__wallet.calls.push(req.method); if (req.method === 'eth_requestAccounts' || req.method === 'eth_accounts') return ['0x00000000000000000000000000000000000a11ce']; if (req.method === 'eth_chainId') return this.chainId; if (req.method === 'net_version') return String(parseInt(this.chainId, 16)); if (req.method === 'wallet_switchEthereumChain' || req.method === 'wallet_addEthereumChain') return null; if (req.method === 'eth_getBalance') return '0x0'; throw Object.assign(new Error('unsupported'), { code: -32601 }); },
  };
  window.ethereum = window.__wallet;
};

const tab = async (page, name) => page.evaluate((n) => { const b = [...document.querySelectorAll('#netbar button')].find((x) => x.textContent.trim() === n); if (b) b.click(); }, name);

for (const [name, vp] of [['mobile-390', { width: 390, height: 844 }], ['mobile-640', { width: 640, height: 900 }], ['tablet-768', { width: 768, height: 1000 }], ['desktop-1024', { width: 1024, height: 900 }], ['desktop-1280', { width: 1280, height: 900 }], ['desktop-1440', { width: 1440, height: 900 }]]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: name.startsWith('mobile-'), isMobile: name.startsWith('mobile-') });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(String(e)));
  await page.addInitScript(walletScript);
  await page.goto(origin + '/', { waitUntil: 'load' });
  await page.waitForTimeout(200);

  const state = () => page.evaluate(() => ({
    net: activeNetwork, filter: netFilter,
    open: document.getElementById('netPanel').classList.contains('open'),
    note: getComputedStyle(document.querySelector('#netBanner .nb-note')).position,
    tooltip: document.getElementById('netChangeBtn').getAttribute('title') || '',
    btns: [...document.querySelectorAll('#netbar .netbtn')].map((b) => ({ t: b.textContent.trim(), active: b.classList.contains('active') })),
    dialog: !!document.getElementById('switchConfirm'),
    dialogCancel: (document.getElementById('scCancel') || {}).textContent || '',
    netLabel: document.querySelector('#netBanner .nb-net').textContent,
    netChain: document.querySelector('#netBanner .nb-chain').textContent,
    walletCalls: window.__wallet.calls.slice(),
  }));
  const open = () => page.click('#netChangeBtn');
  const pick = async (label) => page.evaluate((l) => { const b = [...document.querySelectorAll('#netbar .netbtn')].find((x) => x.textContent.trim().startsWith(l)); if (b) b.click(); }, label);

  // 1-2. fresh load: Arc Mainnet selected, no verbose warning (screen-reader only), warning in the tooltip
  {
    const s = await state();
    ok(s.net === 'arcMain' && s.filter === 'mainnet', name + ': fresh load — Arc Mainnet selected, Mainnets category', JSON.stringify({ net: s.net, filter: s.filter }));
    ok(s.netLabel === 'Arc Mainnet' && s.netChain === 'chain 5042', name + ': the collapsed selector shows the name and chain id');
    ok(s.note === 'absolute', name + ': the collapsed selector carries no visible warning line', s.note);
    ok(/Real funds/.test(s.tooltip), name + ': the mainnet warning is in the tooltip', s.tooltip);
    ok(!/Real funds/.test((await page.evaluate(() => document.getElementById('netBanner').textContent.split('Change network')[0]))), name + ': the visible banner text has no verbose warning');
    const bannerH = await page.evaluate(() => document.getElementById('netBanner').getBoundingClientRect().height);
    ok(bannerH > 0 && bannerH < 56, name + ': the banner is compact (the warning line is gone)', String(bannerH));
  }

  // 3. open the panel
  await open(); await page.waitForTimeout(100);
  ok((await state()).open, name + ': clicking the selector opens the panel');

  // 4-9. category switching never closes the panel and never changes the active network
  {
    const s0 = await state();
    await tab(page, 'Testnets'); await page.waitForTimeout(60);
    let s = await state();
    ok(s.open && s.filter === 'testnet' && s.net === 'arcMain', name + ': Mainnets → Testnets keeps the panel open and the network unchanged', JSON.stringify({ open: s.open, filter: s.filter, net: s.net }));
    ok(s.btns.every((b) => !/LIVE/.test(b.t)), name + ': Testnets shows testnet networks only');
    await tab(page, 'All'); await page.waitForTimeout(60);
    s = await state();
    ok(s.open && s.filter === 'all' && s.btns.length === 16, name + ': Testnets → All keeps the panel open and lists all 16 networks', String(s.btns.length));
    await tab(page, 'Mainnets'); await page.waitForTimeout(60);
    s = await state();
    ok(s.open && s.filter === 'mainnet' && s.net === 'arcMain', name + ': All → Mainnets keeps the panel open and the network unchanged', JSON.stringify({ open: s.open, net: s.net }));
    ok(s.btns.every((b) => /LIVE/.test(b.t)), name + ': Mainnets shows mainnet networks only');
    // active network is visually identified
    ok(s.btns.find((b) => /Arc Mainnet/.test(b.t))?.active, name + ': the active network is highlighted');
  }

  // 10-13. selecting another mainnet: correct source label, cancel keeps state, confirm switches exactly once
  {
    await pick('Polygon'); await page.waitForTimeout(80);
    let s = await state();
    ok(s.dialog, name + ': selecting a mainnet opens the confirmation');
    ok(/Switch to Polygon\?/.test(await page.evaluate(() => document.getElementById('switchConfirm').textContent)), name + ': the dialog names the destination (Polygon)');
    ok(/Stay on Arc Mainnet/.test(s.dialogCancel), name + ': the cancel button names the real source network', s.dialogCancel);
    ok(s.net === 'arcMain', name + ': nothing changes while the dialog is open');
    // 12. cancel
    await page.click('#scCancel'); await page.waitForTimeout(80);
    s = await state();
    ok(!s.dialog && s.net === 'arcMain', name + ': cancel preserves the active network');
    // 13. confirm
    await pick('Polygon'); await page.waitForTimeout(80);
    await page.click('#scOk'); await page.waitForTimeout(120);
    s = await state();
    ok(s.net === 'polygon' && !s.open && !s.dialog, name + ': confirming switches to the destination and closes the panel once', JSON.stringify({ net: s.net, open: s.open, dialog: s.dialog }));
  }

  // 14-15. selecting the already-active network: no redundant confirmation, closes
  {
    await open(); await page.waitForTimeout(80);
    await pick('Polygon'); await page.waitForTimeout(80);
    let s = await state();
    ok(!s.dialog && s.net === 'polygon' && !s.open, name + ': selecting the already-active network closes without a redundant confirmation', JSON.stringify({ dialog: s.dialog, net: s.net, open: s.open }));
  }

  // 16-17. mainnet → testnet: no misleading mainnet-entry warning
  {
    await open(); await page.waitForTimeout(80);
    await tab(page, 'Testnets'); await page.waitForTimeout(60);
    const s0 = await state();
    ok(s0.btns.every((b) => !/LIVE/.test(b.t)), name + ': mainnet → testnet shows testnet options');
    await pick('Arc Testnet'); await page.waitForTimeout(80);
    const s = await state();
    ok(!s.dialog && s.net === 'arc' && !s.open, name + ': mainnet → testnet switches directly with no mainnet-entry warning', JSON.stringify({ dialog: s.dialog, net: s.net }));
    // back to Arc Mainnet for the remaining checks
    await page.evaluate(() => { activeNetwork = 'arcMain'; updateSideNet(); });
  }

  // 18. reopen repeatedly (no duplicate listeners)
  {
    for (let i = 0; i < 4; i++) { await open(); await page.waitForTimeout(40); await page.keyboard.press('Escape'); await page.waitForTimeout(40); }
    const s = await state();
    ok(!s.open, name + ': reopening and escaping repeatedly leaves the panel closed (no stuck listeners)', s.open);
  }

  // 19. click outside closes
  {
    await open(); await page.waitForTimeout(60);
    await page.evaluate(() => { const h = document.querySelector('#sec-home .home-hero h1'); if (h) h.click(); else document.querySelector('main section.section').click(); }); await page.waitForTimeout(60);
    ok(!(await state()).open, name + ': clicking outside closes the panel');
  }

  // 20. Escape closes
  {
    await open(); await page.waitForTimeout(60);
    await page.keyboard.press('Escape'); await page.waitForTimeout(60);
    ok(!(await state()).open, name + ': Escape closes the panel');
  }

  // 21. keyboard accessibility: focus a network and press Enter
  {
    await open(); await page.waitForTimeout(60);
    await tab(page, 'Testnets'); await page.waitForTimeout(40);
    await page.evaluate(() => { const b = [...document.querySelectorAll('#netbar .netbtn')].find((x) => /Arc Testnet/.test(x.textContent)); b.focus(); });
    await page.keyboard.press('Enter'); await page.waitForTimeout(80);
    const s = await state();
    ok(s.net === 'arc' && !s.open, name + ': a focused network button activates on Enter', JSON.stringify({ net: s.net, open: s.open }));
    await page.evaluate(() => { activeNetwork = 'arcMain'; updateSideNet(); });
  }

  // 23. filter changes never ask the wallet
  {
    const before = (await state()).walletCalls.length;
    await open(); await page.waitForTimeout(40);
    await tab(page, 'Testnets'); await tab(page, 'All'); await tab(page, 'Mainnets'); await tab(page, 'Testnets'); await tab(page, 'All');
    await page.waitForTimeout(80);
    const after = (await state()).walletCalls.length;
    ok(after === before, name + ': rapid filter switching never asks the wallet', JSON.stringify({ before, after }));
    await page.keyboard.press('Escape');
  }

  // 26. pending confirmation cancel (already partially covered; verify no stuck dialog)
  {
    await open(); await page.waitForTimeout(40);
    await tab(page, 'Mainnets'); await page.waitForTimeout(40);
    await pick('Ethereum'); await page.waitForTimeout(80);
    ok(await state().then((s) => s.dialog), name + ': a pending confirmation is shown');
    await page.click('#scCancel'); await page.waitForTimeout(60);
    ok(!(await state()).dialog, name + ': cancelling the pending confirmation removes it cleanly');
    await page.keyboard.press('Escape');
  }

  // 24. network mismatch detection (wallet on a different chain)
  {
    await page.evaluate(() => { window.__wallet.chainId = '0xaa36a7'; }); // Sepolia
    const mismatch = await page.evaluate(() => { const c = gasWalletChain(); return c !== null && c !== NETWORKS.arcMain.chainIdDec; });
    ok(mismatch, name + ': a wallet on another chain is detected as a mismatch against Arc Mainnet');
  }

  // 27. dark and light themes both render
  {
    await page.evaluate(() => { toggleTheme(); });
    const light = await page.evaluate(() => document.body.classList.contains('light'));
    ok(light, name + ': light theme toggles on');
    const bannerVisible = await page.evaluate(() => document.getElementById('netBanner').getBoundingClientRect().width > 0);
    ok(bannerVisible, name + ': the selector is visible in the light theme');
    await page.evaluate(() => { toggleTheme(); });
  }

  // 28. stable header geometry across a network switch (heights, not scroll-affected tops)
  {
    const g0 = await page.evaluate(() => ({ h: document.getElementById('globalBar').getBoundingClientRect().height, b: document.getElementById('netBanner').getBoundingClientRect().height }));
    await page.evaluate(() => { activeNetwork = 'sepolia'; updateSideNet(); }); await page.waitForTimeout(60);
    const g1 = await page.evaluate(() => ({ h: document.getElementById('globalBar').getBoundingClientRect().height, b: document.getElementById('netBanner').getBoundingClientRect().height }));
    ok(Math.abs(g0.h - g1.h) < 1 && Math.abs(g0.b - g1.b) < 1, name + ': switching the network does not change the header or banner height', JSON.stringify({ g0, g1 }));
  }

  ok(problems.length === 0, name + ': no console errors', problems.slice(0, 3).join(' | '));
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'netselect-' + name + '.png') });
  await ctx.close();
}

await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
