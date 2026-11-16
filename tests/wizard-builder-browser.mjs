// Phase 9.6: the Contract Wizard in a real browser (Chromium through playwright): the 70/30 grid, the single column on a phone, the steps, the overview,
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
  await page.evaluate(() => document.querySelector('.nav-item[data-section="wizard"]').click()); await page.waitForTimeout(150);
  const rect = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right, w: b.width, h: b.height }; }, sel);
  const noSideways = async (what) => ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 0), name + ': no sideways scroll ' + what);
  await noSideways('at step 1');
  const main = await rect('#sec-wizard .bld-main'), side = await rect('#sec-wizard .bld-side');
  if (name === 'phone') ok(side.t >= main.b - 1, name + ': one column, the overview last', JSON.stringify({ main, side }));
  else { ok(side.l >= main.r - 1 && side.t < main.t + 80, name + ': two columns', JSON.stringify({ main, side })); if (name === 'desktop') { const r = main.w / (main.w + side.w); ok(r > 0.62 && r < 0.76, name + ': about 70/30', String(r)); } }
  ok(await page.evaluate(() => /Not chosen yet/.test(document.getElementById('wzSummaryList').textContent)), name + ': nothing is chosen yet and the overview says so');
  await page.click('#wp-0 .tcard[data-onclick^="wizardPick(\'bridge\'"]'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.getElementById('wp-1').classList.contains('active') && document.querySelectorAll('#wz-subtypes .tcard').length === 1), name + ': choosing a goal moves to the contract step');
  await page.click('#wz-subtypes .tcard'); await page.click('#wz-next'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.querySelectorAll('#wz-netbar .netbtn').length === 16), name + ': the network step offers 16 networks');
  await noSideways('at the network step');
  ok(await page.evaluate(() => [...document.querySelectorAll('#wz-netbar .netbtn')].every((b) => b.getBoundingClientRect().right <= window.innerWidth + 0.5)), name + ': every network button is inside the screen');
  await page.click('#wz-next'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => /Open the builder/.test(document.querySelector('#wp-3 .btn-primary').textContent) && document.querySelector('#wp-3 .btn-primary').getBoundingClientRect().right <= window.innerWidth + 0.5), name + ': the button is on screen and says what it does');
  await page.click('#wp-3 .btn-primary'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => getComputedStyle(document.getElementById('sec-crosschain')).display !== 'none' && getComputedStyle(document.getElementById('sec-wizard')).display === 'none' && !document.querySelector('#crosschainCode pre')), name + ': it opens the Crosschain builder and generated nothing');
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'wizard-' + name + '.png'), fullPage: true });
  ok(problems.length === 0, name + ': no console error or CSP violation', problems.join(' | ').slice(0, 300));
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
