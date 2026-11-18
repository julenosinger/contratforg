// Phase 11.3: the header must not move when the wallet connects, disconnects, switches accounts or networks, or refreshes its balance.
// Measured in a real browser (Chromium through playwright) with getBoundingClientRect(): the two-region bar (#globalBar) keeps its height,
// and the network selector (#netBanner), the deployment mode (#gbarMode), the current-contract bar (#currentContract) and the main content
// (#sec-home) keep their top/left while the wallet text changes. A mock EIP-1193 provider drives the real connectWallet/refreshBalance/accountsChanged
///chainChanged paths; no real transaction or node is used. Not executed where Chromium cannot start (it then prints a notice and exits 0, unless
// REQUIRE_BROWSER=1). SHOTS=/dir saves screenshots.
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

const TOL = 0.5;   // documented sub-pixel rendering rounding only; a real wrap is ~44px, never this small

// The positions that must never move when the wallet changes (only the wallet text is allowed to change).
const SNAP = ["#globalBar", "#netBanner", "#gbarMode", "#currentContract", "#sec-home"];

let page;   // the current page, set per viewport

for (const [name, vp] of [['desktop-1920', { width: 1920, height: 900 }], ['desktop-1440', { width: 1440, height: 900 }], ['desktop-1280', { width: 1280, height: 900 }], ['desktop-1024', { width: 1024, height: 900 }], ['tablet-900', { width: 900, height: 1000 }], ['tablet-768', { width: 768, height: 1000 }], ['mobile-640', { width: 640, height: 900 }], ['mobile-390', { width: 390, height: 844 }], ['mobile-320', { width: 320, height: 700 }]]) {
  const isMobile = name.startsWith('mobile-');
  const ctx = await browser.newContext({ viewport: vp, hasTouch: isMobile, isMobile });
  page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(String(e)));
  await page.addInitScript(walletScript);
  await page.goto(origin + '/', { waitUntil: 'load' });
  // A real contract so the current-contract bar is present, and a testnet so the banner is stable.
  await page.evaluate(() => { activeNetwork = 'sepolia'; renderNetBanner(); updateSideNet(); renderSimpleForm('erc20'); genSimple('erc20'); });
  await page.waitForTimeout(200);

  const isDesktop = !isMobile;

  const rect = (sel) => page.evaluate((s) => {
    const e = document.querySelector(s); if (!e) return null;
    const b = e.getBoundingClientRect();
    return { top: b.top, left: b.left, h: b.height, w: b.width };
  }, sel);
  const snapshot = async () => { const out = {}; for (const s of SNAP) out[s] = await rect(s); return out; };
  const eq = (a, b) => Math.abs(a - b) <= TOL;
  const moved = (base, cur) => Object.keys(base).filter((k) => base[k] && cur[k] && (!eq(base[k].top, cur[k].top) || !eq(base[k].left, cur[k].left) || !eq(base[k].h, cur[k].h)));
  const visibleAndInside = async (what) => {
    const bad = await page.evaluate(() => {
      const vw = window.innerWidth;
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const sels = ['#netBanner', '#gbarMode .dm-trigger', '#balanceBadge', '#walletStatus', '#connectBtn'];
      const clipped = sels.map((s) => { const e = document.querySelector(s); if (!e) return s + ':missing'; const b = e.getBoundingClientRect(); return (b.right > vw + 0.5 || b.left < -0.5 || e.offsetParent === null) ? s + ':clipped@' + Math.round(b.left) + '..' + Math.round(b.right) : null; }).filter(Boolean);
      return { overflow, clipped };
    });
    ok(bad.overflow <= 0, what + ': no horizontal overflow', 'scroll overflow ' + bad.overflow + 'px');
    ok(bad.clipped.length === 0, what + ': every header control visible inside the screen', bad.clipped.join(' | '));
  };
  const base = await snapshot();
  const noMove = async (label, fn) => {
    await fn();
    await page.waitForTimeout(80);
    const cur = await snapshot();
    const mv = moved(base, cur);
    ok(mv.length === 0, `${name}: ${label} — no header/content movement`, mv.join(' | '));
    await visibleAndInside(`${name}: ${label}`);
    return cur;
  };

  if (isDesktop) {
    await noMove('disconnected → connected', async () => { await page.click('#connectBtn'); await page.waitForFunction(() => /Connected/.test(document.getElementById('connectBtn').textContent)); });
    await noMove('connected → different account', async () => { await page.evaluate(() => { window.__wallet.accounts = ['0x00000000000000000000000000000000000b0b0b']; window.__wallet.emit('accountsChanged', ['0x00000000000000000000000000000000000b0b0b']); }); await page.waitForTimeout(100); });
    // A wallet-driven network switch (chainChanged) only changes the status label; it does not resize the banner or the left region.
    await noMove('connected → different network', async () => { await page.evaluate(() => { window.__wallet.chain = '0xaa37dc'; window.__wallet.emit('chainChanged', '0xaa37dc'); }); await page.waitForTimeout(150); });
    await noMove('small balance → large balance', async () => { await page.evaluate(async () => { window.__wallet.balance = '0x' + (10n ** 30n).toString(16); await refreshBalance(); }); });
    await noMove('rapid consecutive wallet updates', async () => { await page.evaluate(async () => { for (let i = 0; i < 8; i++) { setWalletConnected('0x00000000000000000000000000000000000a11ce'); await refreshBalance(); } }); });
    await noMove('connected → disconnected', async () => { await page.evaluate(() => { window.__wallet.emit('accountsChanged', []); }); await page.waitForTimeout(100); });
    // the balance badge truncates (ellipsis) instead of widening the bar: the text is clipped, not the layout
    ok(await page.evaluate(() => { const b = document.getElementById('balanceBadge'); return getComputedStyle(b).overflow === 'hidden' && getComputedStyle(b).textOverflow === 'ellipsis' && getComputedStyle(b).whiteSpace === 'nowrap'; }), name + ': the balance badge truncates with an ellipsis', '');
    // the network banner keeps its width cap and truncates a long name instead of widening the left region
    ok(await page.evaluate(() => { activeNetwork = 'avalanche'; renderNetBanner(); const b = document.getElementById('netBanner'); return b.getBoundingClientRect().width <= 241 && getComputedStyle(b.querySelector('.nb-net')).textOverflow === 'ellipsis'; }), name + ': a long network name truncates inside the capped banner', '');
  } else {
    // Mobile: same no-overflow / no-clip guarantees across the wallet states, and the header must not move within the viewport either.
    await noMove('mobile: disconnected → connected', async () => { await page.click('#connectBtn'); await page.waitForFunction(() => /Connected/.test(document.getElementById('connectBtn').textContent)); });
    await noMove('mobile: large balance', async () => { await page.evaluate(async () => { window.__wallet.balance = '0x' + (10n ** 30n).toString(16); await refreshBalance(); }); });
    await noMove('mobile: disconnected again', async () => { await page.evaluate(() => { window.__wallet.emit('accountsChanged', []); }); await page.waitForTimeout(100); });
  }

  ok(problems.length === 0, name + ': no console errors', problems.slice(0, 3).join(' | '));
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'header-' + name + '.png') });
  await ctx.close();
}

await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
