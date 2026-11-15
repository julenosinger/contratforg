// Phase 9.5: the Simple contracts builder in a real browser (Chromium through playwright): the 70/30 grid, the single column on a phone, the template cards, the form,
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
  await page.evaluate(() => document.querySelector('.nav-item[data-section="simple"]').click()); await page.waitForTimeout(150);
  const rect = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right, w: b.width, h: b.height }; }, sel);
  ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 0), name + ': no sideways scroll');
  const main = await rect('#sec-simple .bld-main'), side = await rect('#sec-simple .bld-side'), grid = await rect('#simpleGrid');
  if (name === 'phone') ok(side.t >= main.b - 1 && grid.w > 300, name + ': one column, the cards use the full width, the overview last', JSON.stringify({ main, side, grid }));
  else {
    ok(side.l >= main.r - 1 && side.t < main.t + 80, name + ': two columns', JSON.stringify({ main, side }));
    if (name === 'desktop') { const r = main.w / (main.w + side.w); ok(r > 0.62 && r < 0.76, name + ': about 70/30', String(r)); }
  }
  ok(await page.evaluate(() => document.querySelectorAll('#simpleGrid .tcard').length === 8 && document.getElementById('simpleForm').children.length === 0), name + ': eight cards, no form yet, as before');
  ok(await page.evaluate(() => document.querySelector('#smpSummary .bld-row dd').textContent.includes('None selected')), name + ': the overview says no template is selected');
  await page.click('#simpleGrid .tcard[data-id="escrow"]'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => document.getElementById('s_buyer') && /Buyer/.test(document.getElementById('smpSummary').textContent)), name + ': choosing Escrow shows its form and its summary');
  ok(await page.evaluate(() => [...document.querySelectorAll('#simpleForm input, #simpleForm select')].filter((e) => e.offsetParent).every((e) => e.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': every form control is inside the screen');
  await page.click('#simpleForm .btnrow .btn-primary'); await page.waitForSelector('#simpleCode pre'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.querySelector('#smpProgress li:nth-child(2)').dataset.state === 'draft' && document.querySelector('#smpProgress li:nth-child(4)').dataset.state === 'locked' && document.getElementById('btnCompileDeploy').disabled), name + ': an escrow with no parties is a DRAFT: deployment locked');
  await page.click('#simpleGrid .tcard[data-id="erc20"]'); await page.waitForTimeout(250);
  await page.click('#simpleForm .btnrow .btn-primary'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => [...document.querySelectorAll('#sec-simple button, #sec-simple input, #sec-simple select')].filter((e) => e.offsetParent).every((e) => e.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': every control is inside the screen');
  // a mainnet is flagged in the overview, a testnet is not
  const netText = async (key) => { await page.evaluate((k) => { activeNetwork = k; updateSideNet(); }, key); await page.waitForTimeout(80); return page.evaluate(() => [...document.querySelectorAll('#smpSummary .bld-row')].find((r) => r.querySelector('dt').textContent === 'Network').textContent); };
  ok(/Mainnet: real funds/.test(await netText('ethereum')) && !/Mainnet/.test(await netText('sepolia')), name + ': the Network row warns on a mainnet only');
  const code = await page.evaluate(() => { const p = document.querySelector('#simpleCode pre'); const b = p.getBoundingClientRect(); return { scrolls: p.scrollHeight > p.clientHeight, h: b.height, right: b.right, vw: window.innerWidth, bodyW: document.documentElement.scrollWidth, head: document.querySelector('#simpleCode .codehead').textContent }; });
  ok(code.scrolls && code.h <= 530 && code.right <= code.vw + 0.5 && code.bodyW <= code.vw, name + ': the code scrolls inside its panel and does not widen the page', JSON.stringify(code));
  ok(/ArcDollar\.sol/.test(code.head) && /Solidity/.test(code.head), name + ': the code head shows file and language');
  ok(await page.evaluate(() => document.querySelector('#smpProgress li:nth-child(2)').dataset.state === 'done' && document.querySelector('#smpProgress li:nth-child(4)').dataset.state === 'todo'), name + ': generation done, deployment not claimed');
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'multisend-' + name + '.png'), fullPage: true });
  await page.click('#simpleForm .btnrow .btn-ghost'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => getComputedStyle(document.getElementById('sec-deploy')).display !== 'none' && !document.getElementById('btnCompileDeploy').disabled && !!document.getElementById('ctorArgsPanel') && !!document.getElementById('multiDeployPanel')), name + ': Deploy now opens the real Compile & Deploy page');
  ok(problems.length === 0, name + ': no console error or CSP violation', problems.join(' | ').slice(0, 300));
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
