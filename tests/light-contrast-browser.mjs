// Light Mode readability and Dark Mode preservation, measured in a real browser (Chromium through playwright) on the computed styles of 34 screens and
// overlays (every page, the network panel, the mode popover, the Actions menu, three modals, the builders with their advanced options open, the deploy
// console, a loaded ABI Playground ...), at phone, tablet and desktop widths.
//  1. Light: every visible text (4.5:1, large text 3:1), icon (3:1), placeholder and form-field box (3:1) reaches WCAG AA against the colour actually behind it
//     (alpha and gradients composited up the tree); hovered and keyboard-focused controls too.
//  2. Dark: the painted colours of everything outside the sidebar hash to the values captured before this work (tests/fixtures/dark-computed-baseline.json).
//  3. The theme switches instantly, is saved, survives a reload and starts from the saved value; no console or CSP error.
// Not executed where Chromium cannot start (it prints a notice and exits 0, unless REQUIRE_BROWSER=1). SHOTS=/dir saves one screenshot per theme and screen.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer, openPage, SCENARIOS, auditInPage, darkFingerprintInPage } from './theme-scenarios.mjs';

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('FAIL', m, d || ''); } };
const skip = (why) => { if (process.env.REQUIRE_BROWSER === '1') { console.error('FAIL: ' + why + ' (REQUIRE_BROWSER=1)'); process.exit(1); } console.log('NOT tested in a real browser: ' + why); process.exit(0); };
let chromium;
try { ({ chromium } = await import('playwright')); } catch (_) { skip('playwright is not installed'); }
const { server, origin } = await startServer();
let browser;
try { browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {}); } catch (e) { server.close(); skip('no Chromium could be started (' + String(e.message).split('\n')[0] + ')'); }
const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = JSON.parse(fs.readFileSync(path.join(here, 'fixtures/dark-computed-baseline.json'), 'utf8')).hashes;
const short = (f) => f.slice(0, 3).map((x) => `${x.sel} ${x.kind} ${x.ratio}/${x.need} "${x.text}"`).join(' | ');

// ---- 1 + 2: every screen, three widths, both themes ----
for (const vw of [1440, 768, 375]) {
  for (const sc of SCENARIOS) {
    const light = await openPage(browser, origin, { width: vw, height: 900 }, { light: true });
    try { await sc.run(light.page); await light.page.waitForTimeout(100); } catch (e) { light.problems.push('scenario ' + sc.id + ': ' + e.message.split('\n')[0]); }
    const fails = await light.page.evaluate(auditInPage);
    ok(fails.length === 0, `light ${vw}px ${sc.id}: every text, icon, placeholder and field box reaches WCAG AA`, short(fails) + (fails.length > 3 ? ` (+${fails.length - 3})` : ''));
    ok(light.problems.length === 0, `light ${vw}px ${sc.id}: no console or CSP errors`, light.problems.slice(0, 2).join(' | '));
    if (process.env.SHOTS) await light.page.screenshot({ path: path.join(process.env.SHOTS, `light-${vw}-${sc.id}.png`) });
    await light.ctx.close();
    if (baseline[vw]) {
      const dark = await openPage(browser, origin, { width: vw, height: 900 }, { light: false });
      try { await sc.run(dark.page); await dark.page.waitForTimeout(100); } catch (_) { /* reported by the light run */ }
      await dark.page.mouse.move(0, 0); await dark.page.waitForTimeout(60);
      const fp = await dark.page.evaluate(darkFingerprintInPage);
      ok(fp === baseline[vw][sc.id], `dark ${vw}px ${sc.id}: every painted colour outside the sidebar is exactly as before`, `${fp} vs ${baseline[vw][sc.id]}`);
      ok(dark.problems.length === 0, `dark ${vw}px ${sc.id}: no console or CSP errors`, dark.problems.slice(0, 2).join(' | '));
      if (process.env.SHOTS) await dark.page.screenshot({ path: path.join(process.env.SHOTS, `dark-${vw}-${sc.id}.png`) });
      await dark.ctx.close();
    }
  }
}

// ---- 3: hover and keyboard focus states of the controls on the busiest screens (light) ----
const STATE_SCREENS = ['home', 'simple', 'swap', 'deploy', 'history', 'lab', 'verify', 'gas', 'playground-loaded', 'net-panel', 'actions-menu', 'modal-mainnet'];
const mark = () => {
  const sel = 'button, a[href], .nav-item, .tcard, .home-card, .pill, summary, select, input, textarea, [role="button"], [data-onclick], .netbtn, .wstep';
  const seen = new Set(); let n = 0;
  for (const e of document.querySelectorAll(sel)) {
    if (!e.getClientRects().length || e.disabled || e.closest('.spine')) continue;
    const b = e.getBoundingClientRect(); if (b.width < 4 || b.height < 4 || getComputedStyle(e).visibility === 'hidden') continue;
    const key = e.tagName + '.' + [...e.classList].sort().join('.') + (e.getAttribute('aria-pressed') || '') + (e.getAttribute('data-state') || '');
    if (seen.has(key)) continue; seen.add(key); e.setAttribute('data-aud-i', String(n++));
  }
  return n;
};
const focusRing = (i) => {
  const e = document.querySelector('[data-aud-i="' + i + '"]'); if (!e) return null;
  try { e.focus({ focusVisible: true }); } catch (_) { e.focus(); }
  if (document.activeElement !== e) return null;
  const cs = getComputedStyle(e); const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1) || cs.boxShadow !== 'none';
  const name = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + [...e.classList].slice(0, 2).map((c) => '.' + c).join('');
  e.blur(); return ring ? null : name;
};
for (const id of STATE_SCREENS) {
  const sc = SCENARIOS.find((s) => s.id === id);
  const { ctx, page, problems } = await openPage(browser, origin, { width: 1440, height: 900 }, { light: true });
  try { await sc.run(page); await page.waitForTimeout(80); } catch (_) { /* ignore */ }
  const n = await page.evaluate(mark);
  const bad = [], noRing = []; let tried = 0;
  for (let i = 0; i < Math.min(n, 30); i++) {
    const loc = page.locator(`[data-aud-i="${i}"]`);
    try { await loc.scrollIntoViewIfNeeded({ timeout: 400 }); await loc.hover({ timeout: 500 }); } catch (_) { continue; }
    tried++;
    await page.evaluate((k) => { document.querySelectorAll('[data-audit-root]').forEach((x) => x.removeAttribute('data-audit-root')); document.querySelector('[data-aud-i="' + k + '"]').setAttribute('data-audit-root', '1'); }, i);
    bad.push(...(await page.evaluate(auditInPage, '[data-audit-root]')));
    await page.keyboard.press('Shift');   // a keyboard event, so the browser treats the next focus as keyboard focus
    const r = await page.evaluate(focusRing, i); if (r) noRing.push(r);
  }
  ok(tried > 0, `states ${id}: controls were exercised`, String(tried));
  ok(bad.length === 0, `states ${id}: hovered controls stay readable`, short(bad));
  ok(noRing.length === 0, `states ${id}: every focusable control shows a focus indicator`, noRing.slice(0, 4).join(', '));
  ok(problems.length === 0, `states ${id}: no console errors`, problems.slice(0, 2).join(' | '));
  await ctx.close();
}

// ---- 4: the theme switches at once, is saved, survives a reload and does not touch the sidebar's own state ----
{
  const { ctx, page, problems } = await openPage(browser, origin, { width: 1440, height: 900 }, { light: false });
  const theme = () => page.evaluate(() => document.body.classList.contains('light') ? 'light' : 'dark');
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const dark = await bg();
  await page.click('#themeBtn');
  ok((await theme()) === 'light' && (await bg()) !== dark && (await page.evaluate(() => localStorage.getItem('cf_theme'))) === 'light', 'theme: one click switches to light at once and saves it');
  await page.click('#sbCollapse'); await page.waitForTimeout(250);
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(250);
  ok((await theme()) === 'light' && (await page.evaluate(() => document.getElementById('themeBtn').getAttribute('aria-label'))) === 'Switch to dark mode', 'theme: a reload starts from the saved light theme');
  ok(await page.evaluate(() => document.querySelector('.app').classList.contains('sb-collapsed')), 'theme: the saved sidebar state is independent of the theme');
  await page.click('#themeBtn');
  ok((await theme()) === 'dark' && (await bg()) === dark && (await page.evaluate(() => localStorage.getItem('cf_theme'))) === 'dark', 'theme: switching back restores exactly the dark background');
  ok(problems.length === 0, 'theme: no console errors', problems.slice(0, 2).join(' | '));
  await ctx.close();
}

await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
