// Phase 12.6: the Test Lab tab in a real browser (Chromium through playwright): the two columns, the single column on a phone, the balances table, the function cards and the log kept inside the screen,
// no sideways scroll, and the overview text and controls inside the screen. The lab here is the real simulator and the real in-page compiler. The AI is simulated in the page; nothing real is called. Not executed where Chromium cannot start
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
  await page.evaluate(() => { renderSimpleForm('erc20'); genSimple('erc20'); activeNetwork = 'bnb'; updateSideNet(); document.querySelector('.nav-item[data-section="lab"]').click(); }); await page.waitForTimeout(200);
  const rect = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right, w: b.width, h: b.height }; }, sel);
  const noSideways = async (what) => ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 0), name + ': no sideways scroll ' + what);
  await noSideways('at start');
  const main = await rect('#sec-lab .bld-main'), side = await rect('#sec-lab .bld-side');
  if (name === 'phone') ok(side.t >= main.b - 1, name + ': one column, the overview below', JSON.stringify({ main, side }));
  else ok(side.l >= main.r - 1 && side.t < main.t + 120, name + ': two columns', JSON.stringify({ main, side }));
  await page.click('[data-onclick="labLoadContract()"]'); await page.waitForFunction(() => /Ready:/.test(document.getElementById('labStatus').textContent), null, { timeout: 120000 }); await page.waitForTimeout(300);
  await noSideways('with the lab running');
  ok(await page.evaluate(() => [...document.querySelectorAll('#lab_balances, #lab_functions .fn-card, #lab_txs, #labContract, #sec-lab .lab-card')].filter((e) => e.offsetParent).every((e) => e.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': the balances, the function cards and the lab cards stay inside the screen');
  ok(await page.evaluate(() => { const l = document.getElementById('lab_log'); return l.getBoundingClientRect().right <= window.innerWidth + 0.5 && getComputedStyle(l).overflow !== 'visible'; }), name + ': the log stays inside the screen and scrolls inside itself');
  ok(await page.evaluate(() => [...document.querySelectorAll('#labSummary dd, #labProgress li, #labNotes li')].every((e) => e.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': the overview text wraps inside the screen');
  ok(await page.evaluate(() => [...document.querySelectorAll('#sec-lab button, #sec-lab select, #sec-lab input')].filter((e) => e.offsetParent).every((e) => e.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': every control is inside the screen');
  ok((await page.evaluate(() => document.querySelector('#labProgress li:last-child').dataset.state)) !== 'done', name + ': the review step is never shown as done');
  ok(problems.length === 0, name + ': no console errors', problems.join(' | '));
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'lab-' + name + '.png') });
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
