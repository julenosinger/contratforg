// Phase 8.4: the Deployment Mode control in a real browser (Chromium through playwright): placement, popover anchoring and clipping,
// the phone bottom sheet, stacking, focus, and that the AI workspace geometry does not move. Real computed styles and rectangles.
// Without a usable browser it prints a notice and exits 0, unless REQUIRE_BROWSER=1 (same rule as csp-browser.mjs). SHOTS=/dir saves screenshots.
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
  const nav = async (s) => { await page.evaluate((x) => document.querySelector('.nav-item[data-section="' + x + '"]').click(), s); await page.waitForTimeout(150); };
  const rect = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right, w: b.width, h: b.height }; }, sel);
  ok(await page.evaluate(() => !document.getElementById('mcSelector') && !document.querySelector('.spine .mc-btn')), name + ': the old sidebar selector is gone');

  for (const sec of ['wizard', 'simple', 'swap', 'treasury', 'vault', 'multisend', 'crosschain']) {
    await nav(sec);
    const tr = await rect(`#sec-${sec} .dm-trigger`);
    ok(tr && tr.h >= 30 && tr.l >= 0 && tr.r <= vp.width + 0.5, name + ': ' + sec + ' control is visible and inside the screen', JSON.stringify(tr));
    ok(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 0), name + ': ' + sec + ' has no sideways scroll');
  }
  await nav('wizard');
  const before = await rect('#sec-wizard .dm-trigger');
  await page.click('#sec-wizard .dm-trigger');
  const pop = await rect('#dmPopover');
  ok(pop && pop.l >= 0 && pop.r <= vp.width + 0.5 && pop.t >= 0 && pop.b <= vp.height + 0.5, name + ': the popover is fully on screen', JSON.stringify(pop));
  ok(await page.evaluate(() => { const o = document.querySelector('#dmPopover .dm-opt[aria-selected="true"]').getBoundingClientRect(); const top = document.elementFromPoint(o.left + o.width / 2, o.top + o.height / 2); return !!top && !!top.closest('#dmPopover'); }), name + ': the popover is on top of the page (not clipped or covered)');
  ok(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('dm-opt')), name + ': focus moved into the options');
  if (name === 'phone') { ok(pop.l <= 12 && vp.width - pop.r <= 12 && vp.height - pop.b <= 24, name + ': it is a bottom sheet', JSON.stringify(pop)); ok(await page.evaluate(() => [...document.querySelectorAll('#dmPopover .dm-opt')].every((o) => o.getBoundingClientRect().height >= 54)), name + ': options are touch-sized'); }
  else ok(Math.abs(pop.l - before.l) < 40 || pop.r >= vp.width - 12, name + ': it is anchored under its control', JSON.stringify({ pop, before }));
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'mode-' + name + '.png') });
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => document.getElementById('dmPopover').hidden && document.activeElement.classList.contains('dm-trigger')), name + ': Escape closes it and focus returns');
  // choose a mode with the real pointer: every control follows, the page does not navigate or compile
  await page.click('#sec-wizard .dm-trigger'); await page.click('#dmPopover .dm-opt[data-dm-mode="multi"]');
  ok(await page.evaluate(() => [...document.querySelectorAll('.dm-trigger .dm-v')].every((v) => v.textContent === 'Multi-deploy') && localStorage.getItem('cf_mc_mode') === 'multi' && document.getElementById('sec-wizard').style.display === 'block'), name + ': every control shows Multi-deploy, it is stored, and we stayed on the page');
  await page.reload(); await nav('swap');
  ok(await page.evaluate(() => [...document.querySelectorAll('.dm-trigger .dm-v')].every((v) => v.textContent === 'Multi-deploy')), name + ': the mode survives a reload');
  // scrolling the page closes it instead of leaving it floating
  await page.click('#sec-swap .dm-trigger'); await page.evaluate(() => window.scrollBy(0, 40)); await page.waitForTimeout(80);
  ok(await page.evaluate(() => document.getElementById('dmPopover').hidden), name + ': scrolling closes the popover');

  // the AI composer
  await nav('nlai');
  const chat0 = await rect('#aiChat'), comp0 = await rect('#aiComposer');
  await page.click('#sec-nlai .dm-trigger');
  const apop = await rect('#dmPopover'), atr = await rect('#sec-nlai .dm-trigger');
  ok(apop && apop.t >= 0 && apop.b <= vp.height + 0.5 && apop.b <= atr.t + 2, name + ': in the AI composer the popover opens upward and fits', JSON.stringify({ apop, atr }));
  const chat1 = await rect('#aiChat'), comp1 = await rect('#aiComposer');
  ok(Math.abs(chat1.h - chat0.h) < 1 && Math.abs(comp1.b - comp0.b) < 1, name + ': opening it does not move the fullscreen chat or the composer', JSON.stringify({ chat0, chat1 }));
  await page.keyboard.press('Escape');
  ok(await page.evaluate(() => { const c = [...document.querySelector('#sec-nlai .ai-controls').children]; return c.every((e) => e.getBoundingClientRect().right <= window.innerWidth + 0.5); }), name + ': the toolbar controls all fit the width');
  const chat2 = await rect('#aiChat');
  ok(Math.abs(chat2.b - vp.height) <= 2, name + ': the workspace still reaches the bottom of the screen', JSON.stringify(chat2));
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'mode-ai-' + name + '.png') });
  ok(problems.length === 0, name + ': no console error or CSP violation', problems.join(' | ').slice(0, 300));
  await ctx.close();
}
await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
