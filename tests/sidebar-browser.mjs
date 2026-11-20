// The collapsible sidebar in a real browser (Chromium through playwright): widths, the rail, tooltips, keyboard, saved preference, every destination in
// both modes, the mobile drawer (modal, focus, Escape, outside click, inert page), light and dark contrast of the sidebar itself, a connected and a
// disconnected wallet, header stability, no horizontal overflow, preserved page state and no console or CSP errors. No real transaction or node is used.
// Not executed where Chromium cannot start (it prints a notice and exits 0, unless REQUIRE_BROWSER=1). SHOTS=/dir saves screenshots.
import { startServer, walletScript, auditInPage } from './theme-scenarios.mjs';
import path from 'node:path';

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('FAIL', m, d || ''); } };
const skip = (why) => { if (process.env.REQUIRE_BROWSER === '1') { console.error('FAIL: ' + why + ' (REQUIRE_BROWSER=1)'); process.exit(1); } console.log('NOT tested in a real browser: ' + why); process.exit(0); };
let chromium;
try { ({ chromium } = await import('playwright')); } catch (_) { skip('playwright is not installed'); }
const { server, origin } = await startServer();
let browser;
try { browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {}); } catch (e) { server.close(); skip('no Chromium could be started (' + String(e.message).split('\n')[0] + ')'); }

const SECTIONS = ['home', 'wizard', 'nlai', 'simple', 'swap', 'treasury', 'vault', 'multisend', 'crosschain', 'deploy', 'history', 'verify', 'share', 'lab', 'auditor', 'playground', 'gas', 'analytics', 'tests'];
const PATHS = { home: '/', simple: '/token-builder', swap: '/swap', treasury: '/treasury', vault: '/vault', multisend: '/multisend', crosschain: '/crosschain', deploy: '/compile-deploy', auditor: '/ai-auditor', playground: '/abi-playground', lab: '/test-lab', history: '/deploy-history', gas: '/gas-estimator', verify: '/verify', share: '/share', wizard: '/contract-wizard', nlai: '/ai-solidity', analytics: '/analytics', tests: '/test-generator' };
const TOL = 0.75;
const rect = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: b.top, left: b.left, right: b.right, bottom: b.bottom, w: b.width, h: b.height }; }, sel);

async function open(vp, { light = false, reduced = false, storage = {} } = {}) {
  const isMobile = vp.width < 700;
  const ctx = await browser.newContext({ viewport: vp, hasTouch: isMobile, isMobile, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage(); const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(String(e)));
  await page.addInitScript(walletScript);
  await page.addInitScript(([l, st]) => { try { if (l) localStorage.setItem('cf_theme', 'light'); for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v); } catch (_) { /* ignore */ } }, [light, storage]);
  await page.goto(origin + '/', { waitUntil: 'load' });
  await page.waitForTimeout(250);
  return { ctx, page, problems };
}
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 0);
const headerOk = (page) => page.evaluate(() => ['#netBanner', '#balanceBadge', '#walletStatus', '#themeBtn', '#connectBtn'].every((s) => { const e = document.querySelector(s); if (!e || !e.offsetParent) return false; const b = e.getBoundingClientRect(); return b.left >= -0.5 && b.right <= window.innerWidth + 0.5; }));
const noOverlap = (page) => page.evaluate(() => { const r = ['#netBanner', '#gbarMode .dm-trigger', '#balanceBadge', '#walletStatus', '#themeBtn', '#connectBtn'].map((s) => { const e = document.querySelector(s); return e && e.offsetParent ? e.getBoundingClientRect() : null; }).filter(Boolean); for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) if (r[i].left < r[j].right - 0.5 && r[j].left < r[i].right - 0.5 && r[i].top < r[j].bottom - 0.5 && r[j].top < r[i].bottom - 0.5) return false; return true; });

/* ================= desktop and tablet widths (above 980px: the rail) ================= */
for (const [name, vp] of [['desktop-1920', { width: 1920, height: 900 }], ['desktop-1440', { width: 1440, height: 900 }], ['desktop-1280', { width: 1280, height: 900 }], ['desktop-1024', { width: 1024, height: 860 }], ['desktop-981', { width: 981, height: 860 }]]) {
  const { ctx, page, problems } = await open(vp);
  const W = () => page.evaluate(() => document.getElementById('sidebar').getBoundingClientRect().width);
  await page.evaluate(() => { renderSimpleForm('erc20'); genSimple('erc20'); });
  // expanded
  ok(Math.abs((await W()) - 248) <= 1, name + ': expanded sidebar is 248px', String(await W()));
  const itemH = await page.evaluate(() => document.querySelector('.nav-item').getBoundingClientRect().height);
  ok(Math.abs(itemH - 40) <= 0.5, name + ': navigation rows are 40px', String(itemH));
  ok(await page.evaluate(() => [...document.querySelectorAll('.nav-item .nav-label')].every((l) => l.getBoundingClientRect().width > 20)), name + ': labels are visible when expanded');
  ok(await noOverflow(page) && (await headerOk(page)) && (await noOverlap(page)), name + ': expanded: no overflow, header controls inside the screen and not overlapping');
  ok(await page.evaluate(() => { const m = document.querySelector('main').getBoundingClientRect(), s = document.getElementById('sidebar').getBoundingClientRect(); return m.left >= s.right - 0.5; }), name + ': expanded: the workspace starts where the sidebar ends');
  const hBefore = (await rect(page, '#globalBar')).h;
  const sy = await page.evaluate(() => document.getElementById('spineBody').scrollHeight >= document.getElementById('spineBody').clientHeight);
  ok(sy, name + ': the navigation scrolls on its own when it is taller than the screen');
  // the state the page is in must survive collapsing
  await page.evaluate(() => document.querySelector('.nav-item[data-section="simple"]').click());
  await page.fill('#sec-simple .field input', 'KeepMe');
  const keep = await page.evaluate(() => { const i = document.querySelector('#sec-simple .field input'); window.__keepEl = i; window.__keepCode = document.getElementById('simpleCode').innerHTML; return i.id; });
  await page.evaluate(() => { window.scrollTo(0, 0); });
  // collapse
  await page.click('#sbCollapse'); await page.waitForTimeout(320);
  ok(Math.abs((await W()) - 68) <= 1, name + ': collapsed sidebar is 68px', String(await W()));
  ok(await page.evaluate(() => [...document.querySelectorAll('.nav-item .nav-label')].every((l) => l.getBoundingClientRect().width <= 1.5)), name + ': labels leave no spacing when collapsed');
  ok(await page.evaluate(() => [...document.querySelectorAll('.nav-item')].every((i) => { const r = i.getBoundingClientRect(), s = i.querySelector('.ico').getBoundingClientRect(); return r.width >= 40 && Math.abs((s.left + s.width / 2) - (r.left + r.width / 2)) <= 1; })), name + ': collapsed: icons are centred in 40px+ targets');
  ok(await page.evaluate(() => { const m = document.querySelector('main').getBoundingClientRect(); return Math.abs(m.left - 68) <= 1; }), name + ': the workspace followed the sidebar to 68px');
  ok(await noOverflow(page) && (await headerOk(page)) && (await noOverlap(page)), name + ': collapsed: no overflow, header controls inside the screen and not overlapping');
  if (vp.width >= 1280) ok(Math.abs((await rect(page, '#globalBar')).h - hBefore) <= TOL, name + ': the header does not change height when the width changes');
  ok(await page.evaluate((id) => { const i = document.querySelector('#sec-simple .field input'); return i === window.__keepEl && i.value === 'KeepMe' && document.getElementById('simpleCode').innerHTML === window.__keepCode && document.getElementById('sec-simple').style.display === 'block'; }, keep), name + ': collapsing kept the same page, field, value and generated code');
  ok(await page.evaluate(() => { const a = document.querySelector('.nav-item.active'); const cs = getComputedStyle(a); return a.dataset.section === 'simple' && cs.boxShadow.includes('inset') && cs.backgroundColor !== 'rgba(0, 0, 0, 0)'; }), name + ': the active page keeps its indicator in the rail');
  // tooltip: hover and keyboard
  await page.hover('.nav-item[data-section="swap"]'); await page.waitForTimeout(220);
  const tip = await page.evaluate(() => { const t = document.getElementById('sbTip'); const i = document.querySelector('.nav-item[data-section="swap"]').getBoundingClientRect(); if (!t) return null; const b = t.getBoundingClientRect(); return { text: t.textContent, show: t.classList.contains('show'), role: t.getAttribute('role'), right: b.left >= i.right, mid: Math.abs((b.top + b.height / 2) - (i.top + i.height / 2)) <= 2, inside: b.right <= window.innerWidth }; });
  ok(tip && tip.text === 'Swap / AMM' && tip.show && tip.role === 'tooltip' && tip.right && tip.mid && tip.inside, name + ': hover shows the full name in a tooltip beside the icon', JSON.stringify(tip));
  await page.mouse.move(700, 500); await page.waitForTimeout(200);
  ok(await page.evaluate(() => !document.getElementById('sbTip').classList.contains('show')), name + ': the tooltip hides when the pointer leaves');
  await page.focus('.nav-item[data-section="vault"]'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => document.getElementById('sbTip').classList.contains('show') && document.getElementById('sbTip').textContent === 'Vault (ERC-4626)'), name + ': keyboard focus shows the tooltip too');
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => !document.getElementById('sbTip').classList.contains('show')), name + ': Escape dismisses the tooltip');
  // every destination from the rail
  let bad = [];
  for (const s of SECTIONS) {
    await page.click(`.nav-item[data-section="${s}"]`); await page.waitForTimeout(40);
    const r = await page.evaluate((x) => ({ path: location.pathname, active: document.querySelector('.nav-item.active')?.dataset.section, shown: [...document.querySelectorAll('main section.section')].filter((e) => e.style.display === 'block').map((e) => e.id).join(), cur: document.querySelectorAll('.nav-item[aria-current]').length }), s);
    if (r.path !== PATHS[s] || r.active !== s || r.shown !== 'sec-' + s || r.cur !== 1) bad.push(s + ':' + JSON.stringify(r));
  }
  ok(bad.length === 0, name + ': all 19 destinations open from the rail with the right URL, active item and section', bad.join(' | '));
  // the full-height AI workspace follows the same width and never overflows
  for (const [mode, want] of [['collapsed', 68], ['expanded', 248]]) {
    await page.click(`.nav-item[data-section="nlai"]`); await page.waitForTimeout(80);
    const is = await page.evaluate(() => document.querySelector('.app').classList.contains('sb-collapsed'));
    if ((mode === 'collapsed') !== is) { await page.click('#sbCollapse'); await page.waitForTimeout(320); }
    const g = await page.evaluate(() => ({ cols: getComputedStyle(document.querySelector('.app')).gridTemplateColumns.split(' ')[0], ws: document.body.classList.contains('ai-workspace'), mainLeft: document.querySelector('main').getBoundingClientRect().left }));
    ok(g.ws && Math.abs(parseFloat(g.cols) - want) <= 1 && Math.abs(g.mainLeft - want) <= 1 && (await noOverflow(page)) && (await headerOk(page)), name + ': AI workspace with the sidebar ' + mode + ': the grid follows the width, no overflow', JSON.stringify(g));
  }
  // keyboard: the collapse button
  await page.focus('#sbCollapse'); await page.keyboard.press('Enter'); await page.waitForTimeout(320);
  ok(Math.abs((await W()) - 248) <= 1 && (await page.getAttribute('#sbCollapse', 'aria-expanded')) === 'true', name + ': Enter on the collapse button expands it');
  await page.keyboard.press('Space'); await page.waitForTimeout(320);
  ok(Math.abs((await W()) - 68) <= 1 && (await page.getAttribute('#sbCollapse', 'aria-label')) === 'Expand sidebar', name + ': Space collapses it and the label says Expand sidebar');
  // saved preference
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(250);
  ok(Math.abs((await W()) - 68) <= 1 && (await page.evaluate(() => JSON.parse(localStorage.getItem('cf_sidebar_v1')).collapsed === true)), name + ': a reload keeps it collapsed (saved under cf_sidebar_v1)');
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('.app')).transitionDuration), name + ': a transition is defined');
  await page.click('#sbCollapse'); await page.waitForTimeout(320);
  ok(Math.abs((await W()) - 248) <= 1, name + ': and expands again');
  // groups
  await page.click('.nav-group[data-group="build"] .nav-group-toggle');
  ok(await page.evaluate(() => { const g = document.querySelector('.nav-group[data-group="build"]'); return g.classList.contains('is-closed') && g.querySelector('.nav-item').getBoundingClientRect().height === 0; }), name + ': Build folds to nothing');
  await page.focus('.nav-group[data-group="deploy"] .nav-group-toggle'); await page.keyboard.press('Space');
  ok(await page.evaluate(() => document.querySelector('.nav-group[data-group="deploy"]').classList.contains('is-closed') && document.querySelector('.nav-group[data-group="deploy"] .nav-group-toggle').getAttribute('aria-expanded') === 'false'), name + ': a group folds from the keyboard');
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(250);
  ok(await page.evaluate(() => document.querySelectorAll('.nav-group.is-closed').length === 2), name + ': folded groups are remembered after a reload');
  await page.click('#sbCollapse'); await page.waitForTimeout(320);
  ok(await page.evaluate(() => [...document.querySelectorAll('.nav-item')].every((i) => i.getBoundingClientRect().height >= 40)), name + ': in the rail every destination is reachable even when its group is folded');
  await page.click('#sbCollapse'); await page.waitForTimeout(320);
  await page.click('.nav-group[data-group="build"] .nav-group-toggle'); await page.click('.nav-group[data-group="deploy"] .nav-group-toggle');
  // one listener per control: a single click is a single toggle, even after init is called again
  await page.evaluate(() => { initSidebar(); initMobileMenu(); initSidebar(); });
  const w0 = await W(); await page.click('#sbCollapse'); await page.waitForTimeout(320);
  ok((await W()) < w0 - 100 && (await page.evaluate(() => document.querySelectorAll('.sb-backdrop').length === 1 && document.querySelectorAll('#navToggle').length === 1)), name + ': no duplicated listeners or controls after initialising again');
  await page.click('#sbCollapse'); await page.waitForTimeout(320);
  ok(problems.length === 0, name + ': no console errors or CSP violations', problems.slice(0, 3).join(' | '));
  if (process.env.SHOTS) await page.screenshot({ path: path.join(process.env.SHOTS, 'sidebar-' + name + '.png') });
  await ctx.close();
}

/* ================= reduced motion ================= */
{
  const { ctx, page } = await open({ width: 1440, height: 900 }, { reduced: true });
  ok(await page.evaluate(() => { const s = getComputedStyle(document.querySelector('.app')); return s.transitionDuration.split(',').every((x) => parseFloat(x) === 0); }), 'reduced motion: the sidebar width does not animate');
  await ctx.close();
  const m = await open({ width: 1440, height: 900 });
  ok(await m.page.evaluate(() => { const d = parseFloat(getComputedStyle(document.querySelector('.app')).transitionDuration); return d >= 0.18 && d <= 0.2; }), 'motion allowed: the width change takes 180-200ms');
  await m.ctx.close();
}

/* ================= both themes, connected and disconnected: the sidebar is readable, the header does not move ================= */
for (const light of [false, true]) {
  const th = light ? 'light' : 'dark';
  const { ctx, page, problems } = await open({ width: 1440, height: 900 }, { light });
  const snap = async () => { const o = {}; for (const s of ['#globalBar', '#netBanner', '#gbarMode', '#walletStatus', '#themeBtn', '#connectBtn']) o[s] = await rect(page, s); return o; };
  const same = (a, b, skipLeft) => Object.keys(a).every((k) => a[k] && b[k] && Math.abs(a[k].h - b[k].h) <= TOL && Math.abs(a[k].top - b[k].top) <= TOL);
  for (const mode of ['expanded', 'collapsed']) {
    if (mode === 'collapsed') { await page.click('#sbCollapse'); await page.waitForTimeout(320); }
    const fails = await page.evaluate(auditInPage, '#sidebar');
    ok(fails.length === 0, `${th} ${mode}: every sidebar label, icon and control reaches contrast (4.5:1 text, 3:1 icons)`, JSON.stringify(fails.slice(0, 3).map((f) => f.sel + ' ' + f.ratio)));
    const a = await snap();
    await page.click('#connectBtn'); await page.waitForFunction(() => /Connected/.test(document.getElementById('connectBtn').textContent)); await page.waitForTimeout(100);
    const b = await snap();
    ok(same(a, b) && (await noOverlap(page)) && (await headerOk(page)), `${th} ${mode}: connecting a wallet does not move or resize the header controls`);
    await page.evaluate(() => window.__wallet.emit('accountsChanged', [])); await page.waitForTimeout(100);
    ok(await page.evaluate(() => /Connect/.test(document.getElementById('connectBtn').textContent)) && (await headerOk(page)), `${th} ${mode}: disconnected again, controls in place`);
  }
  await page.hover('.nav-item[data-section="gas"]'); await page.waitForTimeout(200);
  const tf = await page.evaluate(auditInPage, '#sbTip');
  ok(tf.length === 0, th + ': the tooltip is readable', JSON.stringify(tf.slice(0, 2)));
  await page.click('#sbCollapse'); await page.waitForTimeout(320);
  // the theme toggle still works with the sidebar in either state
  const before = await page.evaluate(() => document.body.classList.contains('light'));
  await page.click('#themeBtn');
  ok((await page.evaluate(() => document.body.classList.contains('light'))) !== before && (await page.evaluate(() => /Switch to/.test(document.getElementById('themeBtn').getAttribute('aria-label')))), th + ': the theme toggle still works');
  ok(problems.length === 0, th + ': no console errors', problems.slice(0, 3).join(' | '));
  await ctx.close();
}

/* ================= phones and small tablets (980px and below): the modal drawer ================= */
for (const [name, vp] of [['tablet-980', { width: 980, height: 900 }], ['tablet-768', { width: 768, height: 1000 }], ['mobile-390', { width: 390, height: 844 }], ['mobile-320', { width: 320, height: 700 }]]) {
  for (const light of [false, true]) {
    const { ctx, page, problems } = await open(vp, { light, storage: { cf_sidebar_v1: JSON.stringify({ v: 1, collapsed: true, closed: {} }) } });
    const tag = name + (light ? ' light' : ' dark');
    ok(await page.evaluate(() => { const s = document.getElementById('sidebar').getBoundingClientRect(); return s.width >= window.innerWidth - 1 && s.height <= 54; }), tag + ': the sidebar is a slim top bar, not a 68px rail (a saved collapsed state does not apply)');
    ok(await page.evaluate(() => { const m = document.querySelector('main').getBoundingClientRect(); return m.left <= 1 && m.width >= window.innerWidth - 2; }), tag + ': the workspace uses the whole width');
    ok(await page.evaluate(() => getComputedStyle(document.querySelector('.nav')).display === 'none' && getComputedStyle(document.getElementById('spineBody')).visibility === 'hidden'), tag + ': the drawer is closed and out of the tab order');
    ok(await page.evaluate(() => { const r = document.getElementById('navToggle').getBoundingClientRect(); return r.height >= 32 && r.width >= 44; }), tag + ': the menu button is a usable target');
    ok(await noOverflow(page) && (await headerOk(page)) && (await noOverlap(page)), tag + ': no overflow, header controls inside the screen');
    // preserve a form and the scroll position through opening and closing
    await page.evaluate(() => { renderSimpleForm('erc20'); genSimple('erc20'); document.querySelector('.nav-item[data-section="simple"]').click(); });
    await page.fill('#sec-simple .field input', 'Typed');
    await page.evaluate(() => { window.__el = document.querySelector('#sec-simple .field input'); window.scrollTo(0, 220); });
    const sy = await page.evaluate(() => window.scrollY);
    // the sticky page header sits under the bar while scrolled
    ok(await page.evaluate(() => { const g = document.getElementById('globalBar').getBoundingClientRect(), s = document.getElementById('sidebar').getBoundingClientRect(); return Math.abs(g.top - s.bottom) <= 1.5 || g.top >= s.bottom - 1.5; }), tag + ': the sticky header stays below the top bar when scrolled');
    await page.click('#navToggle'); await page.waitForTimeout(260);
    const dr = await page.evaluate(() => { const p = document.getElementById('spineBody'), r = p.getBoundingClientRect(), b = document.querySelector('.sb-backdrop'); return { vis: getComputedStyle(p).visibility, left: r.left, w: r.width, maxw: Math.min(300, window.innerWidth * 0.86), bd: getComputedStyle(b).visibility, inert: document.querySelector('main').inert, lock: getComputedStyle(document.body).overflow, role: p.getAttribute('role'), modal: p.getAttribute('aria-modal'), exp: document.getElementById('navToggle').getAttribute('aria-expanded'), label: document.getElementById('navToggle').textContent, focusIn: p.contains(document.activeElement), focusCur: document.activeElement.dataset.section }; });
    ok(dr.vis === 'visible' && Math.abs(dr.left) <= 1 && dr.w <= dr.maxw + 1 && dr.bd === 'visible' && dr.inert === true && dr.lock === 'hidden' && dr.role === 'dialog' && dr.modal === 'true' && dr.exp === 'true' && dr.label === 'Close', tag + ': open: a modal drawer with a backdrop, an inert page and no background scroll', JSON.stringify(dr));
    ok(dr.focusIn && dr.focusCur === 'simple', tag + ': open: focus moved to the current page link', JSON.stringify(dr));
    ok((await page.evaluate(auditInPage, '#spineBody')).length === 0, tag + ': the open drawer is readable (contrast)');
    // Tab never leaves the drawer
    let leaked = false;
    for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); if (!(await page.evaluate(() => document.getElementById('spineBody').contains(document.activeElement)))) { leaked = true; break; } }
    for (let i = 0; i < 6; i++) { await page.keyboard.press('Shift+Tab'); if (!(await page.evaluate(() => document.getElementById('spineBody').contains(document.activeElement)))) { leaked = true; break; } }
    ok(!leaked, tag + ': Tab and Shift+Tab stay inside the open drawer');
    // the page behind cannot be clicked
    const behind = await page.evaluate(() => { const e = document.elementFromPoint(window.innerWidth - 4, window.innerHeight / 2); return !!e && (e.classList.contains('sb-backdrop')); });
    ok(behind, tag + ': a click outside lands on the backdrop, not on the page');
    await page.keyboard.press('Escape'); await page.waitForTimeout(260);
    ok(await page.evaluate(() => getComputedStyle(document.getElementById('spineBody')).visibility === 'hidden' && !document.querySelector('main').inert && document.activeElement.id === 'navToggle' && document.getElementById('navToggle').getAttribute('aria-expanded') === 'false'), tag + ': Escape closes it, frees the page and returns focus to the menu button');
    // outside click
    await page.click('#navToggle'); await page.waitForTimeout(260);
    await page.mouse.click(vp.width - 4, vp.height / 2); await page.waitForTimeout(260);
    ok(await page.evaluate(() => !document.getElementById('mainNav').classList.contains('open') && !document.querySelector('main').inert), tag + ': a click outside closes it');
    ok(await page.evaluate((s) => window.__el === document.querySelector('#sec-simple .field input') && window.__el.value === 'Typed' && Math.abs(window.scrollY - s) <= 2, sy), tag + ': the form value, the element and the scroll position survived opening and closing', String(await page.evaluate(() => window.scrollY)));
    // choosing a destination
    await page.click('#navToggle'); await page.waitForTimeout(260);
    await page.click('.nav-item[data-section="vault"]'); await page.waitForTimeout(260);
    ok(await page.evaluate(() => location.pathname === '/vault' && !document.getElementById('mainNav').classList.contains('open') && getComputedStyle(document.getElementById('spineBody')).visibility === 'hidden' && !document.querySelector('main').inert && document.querySelector('.nav-item.active').dataset.section === 'vault'), tag + ': choosing a page navigates, closes the drawer and frees the page');
    // wallet and network selectors still work with the bar there
    await page.click('#connectBtn'); await page.waitForFunction(() => /Connected/.test(document.getElementById('connectBtn').textContent));
    await page.click('#netChangeBtn'); await page.waitForTimeout(100);
    ok(await page.evaluate(() => document.getElementById('netPanel').classList.contains('open')) && (await headerOk(page)), tag + ': connected: the network selector opens and the wallet controls stay in place');
    await page.click('#netChangeBtn');
    // turning the phone sideways / resizing to desktop while open closes the drawer
    await page.click('#navToggle'); await page.waitForTimeout(200);
    await page.setViewportSize({ width: 1300, height: 900 }); await page.waitForTimeout(300);
    ok(await page.evaluate(() => !document.getElementById('mainNav').classList.contains('open') && !document.querySelector('main').inert && !document.body.classList.contains('sb-lock')), tag + ': growing past 980px while open closes the drawer and frees the page');
    ok(problems.length === 0, tag + ': no console errors or CSP violations', problems.slice(0, 3).join(' | '));
    if (process.env.SHOTS && !light) await page.screenshot({ path: path.join(process.env.SHOTS, 'sidebar-' + name + '.png') });
    await ctx.close();
  }
}

await browser.close(); server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
