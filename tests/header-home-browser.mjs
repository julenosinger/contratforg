// Phase 10.4: the unified header and the Home dashboard in a real browser (Chromium through playwright): the height of level 1, the wrap on a phone, the Actions menu
// opening inside the screen, no sideways scroll, the three builder categories and the active-contract card. Not executed where Chromium cannot start (it then prints a notice and exits 0,
// unless REQUIRE_BROWSER=1). SHOTS=/dir saves screenshots.
// (it then prints a notice and exits 0, unless REQUIRE_BROWSER=1). SHOTS=/dir saves screenshots.
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
const addr = (i) => '0x' + String(i).repeat(40);

for (const [name, vp] of [['desktop', { width: 1366, height: 800 }], ['tablet', { width: 900, height: 1000 }], ['phone', { width: 390, height: 780 }]]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: name === 'phone', isMobile: name === 'phone' });
  const page = await ctx.newPage(); const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(String(e)));
  await page.goto(origin + '/'); await page.waitForTimeout(200);
  const rect = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right, w: b.width, h: b.height }; }, sel);
  const noSideways = async (what) => ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 0), name + ': no sideways scroll ' + what);
  await noSideways('on Home');
  const g = await rect('#globalBar');
  if (name === 'desktop') ok(g.h <= 72, name + ': level 1 is compact (a testnet)', JSON.stringify(g));
  ok(await page.evaluate(() => [...document.querySelectorAll('#globalBar button, #globalBar .badge, #globalBar .status')].filter((e) => e.offsetParent).every((e) => e.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': every header control is inside the screen');
  const nb = await rect('#netBanner'), wb = await rect('.walletbar');
  if (name !== 'phone') ok(nb.b <= g.b + 1 && wb.t >= g.t - 1 && Math.abs((nb.t + nb.b) / 2 - (wb.t + wb.b) / 2) < 30, name + ': network and wallet share the one row', JSON.stringify({ nb, wb }));
  await page.evaluate(() => { activeNetwork = 'arcMain'; updateSideNet(); }); await page.waitForTimeout(150);
  ok(await page.evaluate(() => /Real funds/.test(document.querySelector('#netBanner .nb-note').textContent) && getComputedStyle(document.querySelector('#netBanner .nb-note')).display !== 'none'), name + ': on a mainnet the real-funds line is visible');
  await noSideways('on a mainnet');
  await page.evaluate(() => { activeNetwork = 'arc'; updateSideNet(); renderSimpleForm('erc20'); genSimple('erc20'); }); await page.waitForTimeout(200);
  ok(await rect('#currentContract').then((r) => r && r.h > 0 && r.h <= (name === 'phone' ? 140 : 72)), name + ': level 2 is compact');
  await page.click('#ccMenuBtn'); await page.waitForTimeout(100);
  const mn = await rect('#ccMenu');
  ok(mn && mn.l >= -0.5 && mn.r <= vp.width + 0.5 && mn.b <= vp.height + 0.5, name + ': the Actions menu opens inside the screen', JSON.stringify(mn));
  ok(await page.evaluate(() => document.activeElement && document.activeElement.closest('#ccMenu') !== null), name + ': and the focus is in it');
  await page.keyboard.press('Escape'); ok(await page.evaluate(() => document.getElementById('ccMenu').hidden && document.activeElement.id === 'ccMenuBtn'), name + ': Escape closes it and gives the focus back');
  await page.click('#ccMenuBtn'); await page.mouse.click(5, vp.height - 5); ok(await page.evaluate(() => document.getElementById('ccMenu').hidden), name + ': a click outside closes it');
  await noSideways('with the contract bar');
  ok(await page.evaluate(() => getComputedStyle(document.getElementById('gbarMode')).display !== 'none' && !!document.querySelector('#gbarMode .dm-trigger')), name + ': the deployment mode control is in the header');
  await page.evaluate(() => document.querySelector('.nav-item[data-section="home"]').click()); await page.waitForTimeout(150);
  const cards = await page.evaluate(() => [...document.querySelectorAll('#homeBuilders > .home-card')].map((c) => { const b = c.getBoundingClientRect(); return { t: Math.round(b.top), l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height), clip: c.scrollHeight > c.clientHeight + 1 || c.scrollWidth > c.clientWidth + 1 }; }));
  ok(cards.length === 6 && cards.every((c) => c.r <= vp.width + 0.5), name + ': six cards, all inside the screen', JSON.stringify(cards));
  ok(cards.every((c) => !c.clip), name + ': no card clips its text', JSON.stringify(cards));
  ok(cards.every((c) => Math.abs(c.w - cards[0].w) <= 1), name + ': equal widths', JSON.stringify(cards.map((c) => c.w)));
  const rows = [...new Set(cards.map((c) => c.t))];
  if (name === 'desktop') ok(rows.length === 2 && cards.slice(0, 3).every((c) => c.t === cards[0].t) && cards.slice(3).every((c) => c.t === cards[3].t), name + ': a 3 x 2 grid', JSON.stringify(cards));
  if (name === 'tablet') ok(rows.length === 3 && new Set(cards.map((c) => c.l)).size === 2, name + ': a 2 x 3 grid', JSON.stringify(cards));
  if (name === 'phone') ok(rows.length === 6 && new Set(cards.map((c) => c.l)).size === 1, name + ': a single column of six', JSON.stringify(cards));
  ok(rows.every((t) => { const r = cards.filter((c) => c.t === t); return r.every((c) => c.h === r[0].h); }), name + ': cards in a row have the same height', JSON.stringify(cards.map((c) => c.h)));
  await page.focus('#homeBuilders .home-card'); await page.keyboard.press('Tab'); ok(await page.evaluate(() => document.activeElement.classList.contains('home-card')), name + ': Tab moves from card to card');
  ok(await page.evaluate(() => { const c = document.getElementById('homeContinue'); return c.style.display === 'flex' && /ArcDollar\.sol/.test(c.textContent) && c.getBoundingClientRect().right <= window.innerWidth + 0.5; }), name + ': the active-contract card is shown inside the screen');
  ok(await page.evaluate(() => [...document.querySelectorAll('#sec-home *')].filter((e) => e.offsetParent).every((e) => e.getBoundingClientRect().right <= window.innerWidth + 1)), name + ': nothing on Home overflows');
  ok(problems.length === 0, name + ': no console errors', problems.join(' | '));
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'home-' + name + '.png') });
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
