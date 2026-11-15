// Phase 8.5: the Swap / AMM builder in a real browser (Chromium through playwright): the 70/30 grid, the single column on a phone,
// balanced token cards, no sideways overflow, the generated code scrolling on its own, Deploy now reaching the real deploy page.
// Without a usable browser it prints a notice and exits 0, unless REQUIRE_BROWSER=1. SHOTS=/dir saves screenshots.
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

for (const [name, vp] of [['desktop', { width: 1366, height: 800 }], ['tablet', { width: 900, height: 1000 }], ['phone', { width: 390, height: 780 }]]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: name === 'phone', isMobile: name === 'phone' });
  const page = await ctx.newPage(); const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(String(e)));
  await page.goto(origin + '/');
  await page.evaluate(() => document.querySelector('.nav-item[data-section="swap"]').click()); await page.waitForTimeout(150);
  const rect = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right, w: b.width, h: b.height }; }, sel);
  const noX = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 0);
  ok(await noX(), name + ': no sideways scroll on the builder');
  const main = await rect('.swb-main'), side = await rect('.swb-side'), pair = [await rect('#swap_tokenA'), await rect('#swap_tokenB')];
  if (name === 'phone') {
    ok(side.t >= main.b - 1 && Math.abs(main.w - side.w) < 4, name + ': one column, the overview under the configuration', JSON.stringify({ main, side }));
    ok(pair[1].t > pair[0].b - 1, name + ': Token B stacks under Token A');
  } else {
    ok(side.l >= main.r - 1 && side.t < main.t + 80, name + ': two columns side by side', JSON.stringify({ main, side }));
    if (name === 'desktop') { const ratio = main.w / (main.w + side.w); ok(ratio > 0.62 && ratio < 0.76, name + ': about 70/30', String(ratio)); }
    ok(Math.abs(pair[0].w - pair[1].w) < 2 && Math.abs(pair[0].t - pair[1].t) < 2, name + ': the two token fields are balanced', JSON.stringify(pair));
  }
  ok(await page.evaluate(() => [...document.querySelectorAll('#sec-swap button, #sec-swap input, #sec-swap select')].filter((e) => e.offsetParent).every((e) => e.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': every control is inside the screen');
  if (name === 'phone') ok(await page.evaluate(() => [...document.querySelectorAll('#sec-swap .swb-actions .btn')].every((b) => b.getBoundingClientRect().height >= 44)), name + ': the buttons are touch-sized');
  // generate with real addresses typed in, then look at the code panel
  await page.fill('#swap_tokenA', '0x' + 'a'.repeat(40)); await page.fill('#swap_tokenB', '0x' + 'b'.repeat(40));
  await page.fill('#swap_fee', '45');
  ok(await page.evaluate(() => document.getElementById('swbFeePct').textContent === '= 0.45%'), name + ': 45 bps shows 0.45%');
  await page.click('#sec-swap .swb-actions .btn-primary'); await page.waitForSelector('#swapCode pre'); await page.waitForTimeout(200);
  const code = await page.evaluate(() => { const p = document.querySelector('#swapCode pre'); const b = p.getBoundingClientRect(); return { scrolls: p.scrollHeight > p.clientHeight, h: b.height, right: b.right, vw: window.innerWidth, head: document.querySelector('#swapCode .codehead').textContent, bodyW: document.documentElement.scrollWidth }; });
  ok(code.scrolls && code.h <= 530 && code.right <= code.vw + 0.5 && code.bodyW <= code.vw, name + ': the code scrolls inside its panel and does not widen the page', JSON.stringify(code));
  ok(/ArcSwapAMM\.sol/.test(code.head) && /lines/.test(code.head) && /Solidity/.test(code.head), name + ': the code head shows file, lines and language');
  ok(await page.evaluate(() => document.querySelector('#swbProgress li:nth-child(2)').dataset.state === 'done'), name + ': Code Generation is done after a real generation');
  ok(await page.evaluate(() => document.querySelector('#swbProgress li:nth-child(4)').dataset.state === 'todo'), name + ': Deployment is not claimed');
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'swap-' + name + '.png'), fullPage: true });
  await page.click('#sec-swap .swb-actions .btn-ghost'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => getComputedStyle(document.getElementById('sec-deploy')).display !== 'none' && !!document.getElementById('ctorArgsPanel') && !!document.getElementById('btnCompileDeploy') && !!document.getElementById('multiDeployPanel')), name + ': Deploy now opens the existing Compile & Deploy page');
  ok(problems.length === 0, name + ': no console error or CSP violation', problems.join(' | ').slice(0, 300));
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
