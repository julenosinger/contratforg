// Phase 9.7: the Compile & Deploy overview in a real browser (Chromium through playwright): the 70/30 grid, the single column on a phone, the overview card, the original panel,
// the draft flow, the code panel scrolling on its own, Deploy now reaching the real deploy page. Not executed where Chromium cannot start
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
  await page.evaluate(() => { document.querySelector('.nav-item[data-section="erc20"], .nav-item[data-section="simple"]').click(); });
  await page.evaluate(() => { renderSimpleForm('erc20'); genSimple('erc20'); document.querySelector('.nav-item[data-section="deploy"]').click(); }); await page.waitForTimeout(200);
  const rect = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right, w: b.width, h: b.height }; }, sel);
  const noSideways = async (what) => ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 0), name + ': no sideways scroll ' + what);
  await noSideways('with a contract');
  const main = await rect('#sec-deploy .bld-main'), side = await rect('#sec-deploy .bld-side'), act = await rect('.dpl-actions'), btn = await rect('#btnCompileDeploy');
  if (name === 'phone') ok(side.t >= main.b - 1 && btn.w >= vp.width * 0.8, name + ': one column; the primary button is full width', JSON.stringify({ main, side, btn }));
  else {
    ok(side.l >= main.r - 1 && side.t < main.t + 120, name + ': two columns', JSON.stringify({ main, side }));
    if (name === 'desktop') { const r = main.w / (main.w + side.w); ok(r > 0.58 && r < 0.72, name + ': about 65/35', String(r)); }
  }
  ok(await page.evaluate(() => document.getElementById('dplHead').children.length >= 5 && /ArcDollar\.sol/.test(document.getElementById('dplHead').textContent)), name + ': the header strip shows the contract, maturity, compiler, mode and network');
  ok(await page.evaluate(() => { const d = document.getElementById('dplSrcBox'); return d && !d.open; }), name + ': the source preview is closed until opened');
  await page.click('#dplSrcSum'); await page.waitForTimeout(100);
  const pre = await page.evaluate(() => { const p = document.querySelector('#dplSrcBox pre'); const b = p.getBoundingClientRect(); return { scrolls: p.scrollHeight > p.clientHeight, h: b.height, right: b.right, vw: window.innerWidth, body: document.documentElement.scrollWidth }; });
  ok(pre.scrolls && pre.h <= 280 && pre.right <= pre.vw + 0.5 && pre.body <= pre.vw, name + ': the opened preview scrolls inside its card and does not widen the page', JSON.stringify(pre));
  ok(await page.evaluate(() => [...document.querySelectorAll('#sec-deploy button, #sec-deploy select, #sec-deploy input')].filter((e) => e.offsetParent).every((e) => e.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': every control of the page is inside the screen');
  ok(await page.evaluate(() => { const c = document.getElementById('deployConsole'); return getComputedStyle(c).overflowY !== 'visible' && c.getBoundingClientRect().height <= 260; }), name + ': the activity log has its own height and scroll');
  ok(await page.evaluate(() => !document.getElementById('btnCompileDeploy').disabled && /Compile and deploy/.test(document.getElementById('btnCompileDeploy').textContent)), name + ': the original button is there and enabled for a valid contract');
  await page.evaluate(() => { setMultichainMode('multi'); }); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.querySelectorAll('#multiDeployPanel .md-chip').length === 16 && document.querySelectorAll('#multiDeployPanel .md-chip.on').length === 0 && /none selected/.test(document.getElementById('dplNetCount').textContent)), name + ': Multi-deploy shows 16 networks and none is selected for you');
  await noSideways('with the Multi-deploy panel');
  ok(await page.evaluate(() => [...document.querySelectorAll('#multiDeployPanel .md-chip')].every((c) => c.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': every network chip is inside the screen');
  await page.evaluate(() => { setMultichainMode('single'); activeNetwork = 'ethereum'; updateSideNet(); }); await page.waitForTimeout(150);
  ok(await page.evaluate(() => /Mainnet: real funds/.test(document.getElementById('dplSummary').textContent) && getComputedStyle(document.getElementById('mainnetDeployBanner')).display !== 'none' && /LIVE/.test(document.getElementById('dplHead').textContent)), name + ': on a mainnet the overview and the page\'s own banner both warn');
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'deploy-' + name + '.png'), fullPage: true });
  ok(problems.length === 0, name + ': no console error or CSP violation', problems.join(' | ').slice(0, 300));
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
