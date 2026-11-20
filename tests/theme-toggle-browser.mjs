// The Light/Dark toggle sits in the header, next to the wallet controls. Measured in a real browser (Chromium through playwright) at desktop, tablet and
// phone widths, with the wallet disconnected and connected, in both themes: the toggle is visible, inside the screen, clickable, big enough to tap, never
// overlaps another header control, never changes the header's height or the position of the network selector, deployment mode or content, the bar never
// overflows horizontally, the theme is saved and restored after a reload, the keyboard works, the accessible name follows the state, and the page raises
// no console error or CSP violation. A mock EIP-1193 provider drives the wallet; no real transaction or node is used. Not executed where Chromium cannot
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

// A mock wallet we can steer: account, chain and balance change without any real transaction.
const walletScript = () => {
  window.__wallet = {
    accounts: ['0x00000000000000000000000000000000000a11ce'],
    chain: '0xaa36a7',                                       // Ethereum Sepolia (11155111)
    balance: '0xde0b6b3a7640000',                            // 1 ETH
    listeners: {},
    on(evt, cb) { (this.listeners[evt] = this.listeners[evt] || []).push(cb); },
    removeListener() {},
    emit(evt, ...args) { (this.listeners[evt] || []).forEach((cb) => cb(...args)); },
    async request({ method }) {
      switch (method) {
        case 'eth_requestAccounts': case 'eth_accounts': return this.accounts;
        case 'eth_chainId': return this.chain;
        case 'net_version': return String(parseInt(this.chain, 16));
        case 'wallet_switchEthereumChain': case 'wallet_addEthereumChain': return null;
        case 'eth_getBalance': return this.balance;
        default: throw Object.assign(new Error('unsupported ' + method), { code: -32601 });
      }
    },
  };
  window.ethereum = window.__wallet;
};

const TOL = 0.5;
const SNAP = ['#globalBar', '#netBanner', '#gbarMode', '#currentContract', '#sec-home'];
const CONTROLS = ['#netBanner', '#gbarMode .dm-trigger', '#balanceBadge', '#walletStatus', '#themeBtn', '#connectBtn'];

for (const [name, vp] of [['desktop-1920', { width: 1920, height: 900 }], ['desktop-1440', { width: 1440, height: 900 }], ['desktop-1280', { width: 1280, height: 900 }], ['desktop-1024', { width: 1024, height: 900 }], ['tablet-900', { width: 900, height: 1000 }], ['tablet-768', { width: 768, height: 1000 }], ['mobile-640', { width: 640, height: 900 }], ['mobile-390', { width: 390, height: 844 }], ['mobile-320', { width: 320, height: 700 }]]) {
  const isMobile = name.startsWith('mobile-');
  const ctx = await browser.newContext({ viewport: vp, hasTouch: isMobile, isMobile });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(String(e)));
  await page.addInitScript(walletScript);
  await page.goto(origin + '/', { waitUntil: 'load' });
  await page.evaluate(() => { activeNetwork = 'sepolia'; renderNetBanner(); updateSideNet(); renderSimpleForm('erc20'); genSimple('erc20'); });
  await page.waitForTimeout(200);

  const rect = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: b.top, left: b.left, right: b.right, bottom: b.bottom, h: b.height, w: b.width }; }, sel);
  const snapshot = async () => { const o = {}; for (const s of SNAP) o[s] = await rect(s); return o; };
  const eq = (a, b) => Math.abs(a - b) <= TOL;
  const moved = (base, cur) => Object.keys(base).filter((k) => base[k] && cur[k] && (!eq(base[k].top, cur[k].top) || !eq(base[k].left, cur[k].left) || !eq(base[k].h, cur[k].h)));
  const theme = () => page.evaluate(() => document.body.classList.contains('light') ? 'light' : 'dark');

  // geometry of the whole header at this moment: visible, inside the screen, no overlap, no overflow, tap size
  const check = async (what) => {
    const g = await page.evaluate((sels) => {
      const vw = window.innerWidth;
      const rects = sels.map((s) => { const e = document.querySelector(s); if (!e || e.offsetParent === null) return { s, missing: true }; const b = e.getBoundingClientRect(); return { s, l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height }; });
      const overlaps = [];
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const a = rects[i], c = rects[j]; if (a.missing || c.missing) continue; if (a.l < c.r - 0.5 && c.l < a.r - 0.5 && a.t < c.b - 0.5 && c.t < a.b - 0.5) overlaps.push(a.s + ' x ' + c.s); }
      const clipped = rects.filter((r) => r.missing || r.r > vw + 0.5 || r.l < -0.5).map((r) => r.s);
      const t = document.getElementById('themeBtn').getBoundingClientRect();
      const cx = t.left + t.width / 2, cy = t.top + t.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, overlaps, clipped, tw: t.width, th: t.height, clickable: !!hit && (hit.id === 'themeBtn' || !!hit.closest('#themeBtn')) };
    }, CONTROLS);
    ok(g.overflow <= 0, what + ': no horizontal overflow', g.overflow + 'px');
    ok(g.clipped.length === 0, what + ': every header control, including the theme toggle, is inside the screen', g.clipped.join(','));
    ok(g.overlaps.length === 0, what + ': no header control overlaps another', g.overlaps.join(' | '));
    ok(g.clickable, what + ': the theme toggle is the element under its own centre (clickable, not covered)');
    const min = isMobile ? 44 : 32;
    ok(g.tw >= min && g.th >= min, what + ': tap target at least ' + min + 'px', Math.round(g.tw) + 'x' + Math.round(g.th));
  };

  const base = await snapshot();
  const nameOf = () => page.getAttribute('#themeBtn', 'aria-label');

  // structure
  ok(await page.evaluate(() => document.querySelectorAll('#themeBtn').length === 1 && document.querySelectorAll('.spine #themeBtn').length === 0 && !!document.querySelector('#globalBar .walletbar #themeBtn')), name + ': exactly one toggle, in the header, none in the sidebar');
  ok(await page.evaluate(() => !!document.getElementById('resetSavedBtn') && !!document.querySelector('.spine #resetSavedBtn')), name + ': Reset saved data stays in the sidebar');
  ok(await page.evaluate(() => { const b = document.getElementById('themeBtn'), s = document.getElementById('connectBtn'); return !!(b.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING); }), name + ': the toggle sits before Connect Wallet');
  ok(await page.evaluate(() => { const o = (id) => Number(getComputedStyle(document.getElementById(id)).order); return o('balanceBadge') < o('themeBtn') && o('walletStatus') < o('themeBtn') && o('themeBtn') < o('connectBtn'); }), name + ': visual order: balance and status first, then the theme toggle, then connect');

  // disconnected, dark
  ok((await theme()) === 'dark' && (await nameOf()) === 'Switch to light mode', name + ': starts dark, named Switch to light mode');
  ok(await page.evaluate(() => { const v = (c) => getComputedStyle(document.querySelector('#themeBtn .' + c)).display; return v('ti-sun') !== 'none' && v('ti-moon') === 'none'; }), name + ': dark mode shows the sun (switch to light)');
  await check(name + ' dark/disconnected');
  const hDark = (await rect('#globalBar')).h;

  // toggle to light by click
  await page.click('#themeBtn');
  ok((await theme()) === 'light' && (await nameOf()) === 'Switch to dark mode', name + ': click switches to light, name becomes Switch to dark mode');
  ok(await page.evaluate(() => { const v = (c) => getComputedStyle(document.querySelector('#themeBtn .' + c)).display; return v('ti-moon') !== 'none' && v('ti-sun') === 'none'; }), name + ': light mode shows the moon (switch to dark)');
  ok(await page.evaluate(() => localStorage.getItem('cf_theme')) === 'light', name + ': saved as cf_theme=light');
  ok(eq(hDark, (await rect('#globalBar')).h), name + ': the header height is the same in light mode', hDark + ' vs ' + (await rect('#globalBar')).h);
  ok(await page.evaluate(() => getComputedStyle(document.body).backgroundColor !== 'rgb(0, 0, 0)' && document.body.classList.contains('light')), name + ': existing .light classes still apply');
  await check(name + ' light/disconnected');
  ok(moved(base, await snapshot()).length === 0, name + ': nothing moved after switching theme', moved(base, await snapshot()).join(' | '));

  // keyboard: focus the toggle, Enter and Space both activate, focus is visible
  await page.focus('#themeBtn');
  await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  ok(await page.evaluate(() => { const s = getComputedStyle(document.getElementById('themeBtn')); return document.activeElement.id === 'themeBtn' && s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; }), name + ': keyboard focus shows a visible outline');
  await page.keyboard.press('Enter');
  ok((await theme()) === 'dark', name + ': Enter switches light to dark');
  await page.keyboard.press('Space');
  ok((await theme()) === 'light', name + ': Space switches dark to light');

  // reload: the saved light theme is restored, and the toggle is correct, without errors
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(150);
  ok((await theme()) === 'light' && (await nameOf()) === 'Switch to dark mode', name + ': after a reload the saved light theme is restored');
  await page.click('#themeBtn');
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(150);
  ok((await theme()) === 'dark' && (await nameOf()) === 'Switch to light mode', name + ': after a reload the saved dark theme is restored');

  // connected wallet, long address, a big balance, a network label change: both themes
  await page.evaluate(() => { activeNetwork = 'sepolia'; renderNetBanner(); updateSideNet(); renderSimpleForm('erc20'); genSimple('erc20'); });
  await page.waitForTimeout(150);
  const base2 = await snapshot();
  await page.click('#connectBtn');
  await page.waitForFunction(() => /Connected/.test(document.getElementById('connectBtn').textContent));
  for (const th of ['dark', 'light']) {
    if ((await theme()) !== th) await page.click('#themeBtn');
    await page.evaluate(async () => { window.__wallet.balance = '0x' + (10n ** 30n).toString(16); await refreshBalance(); });
    await page.waitForTimeout(80);
    await check(name + ' ' + th + '/connected, huge balance');
    ok(moved(base2, await snapshot()).length === 0, name + ' ' + th + ': connecting and a huge balance do not move the header', moved(base2, await snapshot()).join(' | '));
    await page.evaluate(() => { window.__wallet.chain = '0xaa37dc'; window.__wallet.emit('chainChanged', '0xaa37dc'); });
    await page.waitForTimeout(120);
    await check(name + ' ' + th + '/connected, other network');
    await page.evaluate(() => { window.__wallet.chain = '0xaa36a7'; window.__wallet.emit('chainChanged', '0xaa36a7'); });
    await page.waitForTimeout(120);
  }
  // a long network name in the banner
  await page.evaluate(() => { activeNetwork = 'avalanche'; renderNetBanner(); });
  await page.waitForTimeout(80);
  await check(name + ': long network name');
  // the toggle keeps working while connected, and a click does not disconnect or navigate
  const before = await theme();
  await page.click('#themeBtn');
  ok((await theme()) !== before, name + ': the toggle works with a connected wallet');
  ok(await page.evaluate(() => /Connected/.test(document.getElementById('connectBtn').textContent)), name + ': toggling does not disconnect the wallet');
  // disconnect
  await page.evaluate(() => { window.__wallet.emit('accountsChanged', []); });
  await page.waitForTimeout(100);
  await check(name + ': disconnected again');

  // the toggle works from other pages (the header is global)
  for (const sec of ['nlai', 'lab', 'history', 'auditor']) {
    await page.evaluate((s) => document.querySelector('.nav-item[data-section="' + s + '"]').click(), sec);
    await page.waitForTimeout(80);
    const t0 = await theme();
    await page.evaluate(() => document.getElementById('themeBtn').click());
    ok((await theme()) !== t0, name + ': the toggle works on the ' + sec + ' page');
  }
  ok(problems.length === 0, name + ': no console errors or CSP violations', problems.slice(0, 3).join(' | '));
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'theme-' + name + '.png') });
  await ctx.close();
}

await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
