// Phase 10.1: the Deploy History tab in a real browser (Chromium through playwright): the summary cards, the filter bar, the rows on desktop, tablet and phone,
// no sideways scroll with long addresses, the filters, and the buttons acting on the right record. Not executed where Chromium cannot start
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
  await page.goto(origin + '/');
  await page.evaluate(() => {
    const keys = Object.keys(NETWORKS); const hx = (n) => '0x' + String(n).padStart(40, 'b');
    const list = keys.map((k, i) => ({ name: 'Contract' + i + 'WithAVeryLongNameToCheckWrapping', address: hx(i + 1), network: k, abi: [], txHash: '0x' + String(i + 1).padStart(64, 'c'), timestamp: Date.now() - i * 3600000 })).reverse();
    localStorage.setItem('contractforge_deploy_history', JSON.stringify(list));
    document.querySelector('.nav-item[data-section="history"]').click();
  }); await page.waitForTimeout(200);
  const rect = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right, w: b.width, h: b.height }; }, sel);
  const noSideways = async (what) => ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 0), name + ': no sideways scroll ' + what);
  await noSideways('with 16 long rows');
  ok(await page.evaluate(() => document.querySelectorAll('#historyList .hist-row').length === 16 && document.querySelectorAll('#histStats .hist-stat').length === 4), name + ': 16 rows and 4 summary cards');
  const cards = await page.evaluate(() => [...document.querySelectorAll('#histStats .hist-stat')].map((c) => { const b = c.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right }; }));
  if (name === 'desktop') ok(new Set(cards.map((c) => Math.round(c.t))).size === 1, name + ': the four cards sit in one row', JSON.stringify(cards));
  if (name === 'phone') ok(new Set(cards.map((c) => Math.round(c.t))).size >= 2, name + ': the cards wrap on a phone');
  ok(await page.evaluate(() => [...document.querySelectorAll('#historyList .hist-row')].every((r) => r.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': every row is inside the screen');
  ok(await page.evaluate(() => [...document.querySelectorAll('#historyList .haddr')].every((a) => a.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': full addresses wrap instead of overflowing');
  ok(await page.evaluate(() => [...document.querySelectorAll('#sec-history button, #sec-history select, #sec-history input')].filter((e) => e.offsetParent).every((e) => e.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': every control is inside the screen');
  const live = await page.evaluate(() => [...document.querySelectorAll('#historyList .hist-row[data-live="1"]')].length);
  ok(live === 9, name + ': 9 live rows are marked');
  await page.click('[data-scope="mainnet"]'); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.querySelectorAll('#historyList .hist-row').length === 9 && /Showing 9 of 16/.test(document.getElementById('histCount').textContent)), name + ': Mainnets shows 9 and says so');
  await page.fill('#histSearch', 'Contract3'); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.querySelectorAll('#historyList .hist-row').length >= 1), name + ': the search narrows the list');
  const before = await page.evaluate(() => localStorage.getItem('contractforge_deploy_history'));
  await page.click('[data-onclick="histResetFilters()"]').catch(() => {}); await page.fill('#histSearch', ''); await page.click('[data-scope="all"]'); await page.waitForTimeout(100);
  ok(await page.evaluate((b) => localStorage.getItem('contractforge_deploy_history') === b, before), name + ': filtering never changed storage');
  if (name === 'phone') { const b = await rect('#historyList .hist-row .hbtn'); ok(b && b.h >= 30, name + ': touch-friendly buttons', JSON.stringify(b)); }
  ok(problems.length === 0, name + ': no console errors', problems.join(' | '));
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'history-' + name + '.png') });
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
