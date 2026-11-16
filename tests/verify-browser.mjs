// Phase 10.2: the Verify on Explorer tab in a real browser (Chromium through playwright): the two columns, the single column on a phone, long addresses and error text wrapping, no sideways scroll,
// and Submit sending nothing until pressed. Not executed where Chromium cannot start
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
  const page = await ctx.newPage(); const problems = []; const sent = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(String(e)));
  page.on('request', (r) => { if (/etherscan|api\./.test(r.url()) && r.method() === 'POST') sent.push(r.url()); });
  await page.goto(origin + '/');
  await page.evaluate(() => { renderSimpleForm('erc20'); genSimple('erc20'); activeNetwork = 'sepolia'; updateSideNet(); document.querySelector('.nav-item[data-section="verify"]').click(); }); await page.waitForTimeout(200);
  const rect = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right, w: b.width, h: b.height }; }, sel);
  const noSideways = async (what) => ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 0), name + ': no sideways scroll ' + what);
  await noSideways('at start');
  const main = await rect('#sec-verify .bld-main'), side = await rect('#sec-verify .bld-side');
  if (name === 'phone') ok(side.t >= main.b - 1, name + ': one column, the overview below the form', JSON.stringify({ main, side }));
  else ok(side.l >= main.r - 1 && side.t < main.t + 120, name + ': two columns', JSON.stringify({ main, side }));
  await page.fill('#ver_address', '0x' + 'ab'.repeat(20)); await page.fill('#ver_apikey', 'KEY' + 'x'.repeat(60)); await page.fill('#ver_constructor', '0x' + '00'.repeat(200)); await page.waitForTimeout(150);
  await noSideways('with long values');
  ok(await page.evaluate(() => [...document.querySelectorAll('#verSummary dd, #verProgress .bld-t, #sec-verify .bld-note')].every((e) => e.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': the overview text wraps inside the screen');
  ok(await page.evaluate(() => [...document.querySelectorAll('#sec-verify button, #sec-verify input')].filter((e) => e.offsetParent).every((e) => e.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': every control is inside the screen');
  ok(await page.evaluate(() => { const c = document.getElementById('verifyLog'); return getComputedStyle(c).overflowY !== 'visible' && c.getBoundingClientRect().height <= 260; }), name + ': the activity log has its own height and scroll');
  ok(await page.evaluate(() => document.getElementById('ver_apikey').type === 'password' && !document.body.innerHTML.includes('KEYxxxx')), name + ': the key is a password field and is not written into the page');
  ok(sent.length === 0, name + ': nothing was sent before Submit', sent.join(','));
  await page.evaluate(() => { activeNetwork = 'arc'; updateSideNet(); }); await page.waitForTimeout(150);
  ok(await page.evaluate(() => /Not available here/.test(document.getElementById('verSummary').textContent)), name + ': on Arc Testnet the overview says verification is not available');
  ok(problems.length === 0, name + ': no console errors', problems.join(' | '));
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'verify-' + name + '.png') });
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
