// The collapsible sidebar: groups, icons, the collapse button, saved preference, group folding, the mobile drawer's state handling, and that none of it
// disturbs routing, saved data or the page shown. jsdom checks markup, state and storage; it does NOT measure geometry (sidebar-browser.mjs does that
// in a real browser).
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const KEY = 'cf_sidebar_v1';

const GROUPS = {
  Home: [['home', 'Home']],
  Build: [['wizard', 'Contract Wizard'], ['nlai', 'AI → Solidity'], ['simple', 'Token / Escrow / NFT'], ['swap', 'Swap / AMM'], ['treasury', 'Treasury'], ['vault', 'Vault (ERC-4626)'], ['multisend', 'MultiSend'], ['crosschain', 'Crosschain (CCTP)']],
  Deploy: [['deploy', 'Compile & Deploy'], ['history', 'Deploy History'], ['verify', 'Verify on Explorer'], ['share', 'Share / Export']],
  Analyze: [['lab', 'Test Lab'], ['auditor', 'AI Auditor'], ['playground', 'ABI Playground'], ['gas', 'Gas Estimator'], ['analytics', 'Analytics'], ['tests', 'Test Generator']],
};
const visible = (d) => [...d.querySelectorAll('main section.section')].filter((s) => s.style.display === 'block').map((s) => s.id);

/* 1. structure: four groups with the requested destinations, every one with an icon and a label, and nothing renamed underneath */
{
  const a = loadApp(); const d = a.w.document;
  const groups = [...d.querySelectorAll('.nav-group')];
  eq(groups.map((g) => g.querySelector('h4').textContent), Object.keys(GROUPS), 'four groups: Home, Build, Deploy, Analyze');
  for (const g of groups) {
    const name = g.querySelector('h4').textContent;
    eq([...g.querySelectorAll('.nav-item')].map((i) => [i.dataset.section, i.querySelector('.nav-label').textContent.trim()]), GROUPS[name], 'group ' + name + ': the destinations, in order');
  }
  eq(d.querySelectorAll('.nav-item').length, 19, '19 destinations, none lost');
  ok([...d.querySelectorAll('.nav-item')].every((i) => i.querySelectorAll('svg.ico[aria-hidden="true"]').length === 1 && !!d.getElementById('sec-' + i.dataset.section)), 'every destination has one decorative icon and its section still exists');
  ok(!d.querySelector('.nav-group[data-group="home"] .nav-group-toggle'), 'Home is a single link, not a folding group');
  ok(groups.every((g) => g.getAttribute('role') === 'group' && g.getAttribute('aria-labelledby') === g.querySelector('h4').id), 'every group is labelled by its heading');
  const toggles = [...d.querySelectorAll('.nav-group-toggle')];
  eq(toggles.map((t) => [t.tagName, t.getAttribute('aria-expanded'), !!d.getElementById(t.getAttribute('aria-controls'))]), [['BUTTON', 'true', true], ['BUTTON', 'true', true], ['BUTTON', 'true', true]], 'group headings are real buttons that control their list');
  const c = d.getElementById('sbCollapse');
  eq([c.tagName, c.type, c.getAttribute('aria-expanded'), c.getAttribute('aria-label'), c.getAttribute('aria-controls')], ['BUTTON', 'button', 'true', 'Collapse sidebar', 'mainNav'], 'the collapse button is a labelled button');
  ok(!/\son[a-z]+="/i.test(d.getElementById('sidebar').outerHTML), 'csp: no inline handler in the sidebar');
  ok(!!d.querySelector('#sidebar #resetSavedBtn') && /Reset saved data/.test(d.getElementById('resetSavedBtn').textContent) && !!d.getElementById('sidenet'), 'Reset saved data and the active-network card are still in the sidebar');
  ok(!!d.querySelector('#globalBar #themeBtn') && !d.querySelector('#sidebar #themeBtn'), 'the theme toggle is still in the header');
  eq(a.pageErrors, [], 'no initialization errors');
}

/* 2. collapse / expand, saved preference, and a clean slate for bad data */
{
  const a = loadApp(); const d = a.w.document; const app = d.querySelector('.app'); const btn = d.getElementById('sbCollapse');
  a.w.localStorage.setItem('contractforge_deploy_history', '[]'); a.w.localStorage.setItem('cf_theme', 'dark');
  ok(!app.classList.contains('sb-collapsed') && a.w.localStorage.getItem(KEY) === null, 'starts expanded and writes nothing until the user chooses');
  btn.click();
  ok(app.classList.contains('sb-collapsed') && btn.getAttribute('aria-expanded') === 'false' && btn.getAttribute('aria-label') === 'Expand sidebar', 'collapse: class, aria-expanded and label follow');
  eq(JSON.parse(a.w.localStorage.getItem(KEY)), { v: 1, collapsed: true, closed: {} }, 'the preference is saved under its own versioned key');
  eq(a.w.localStorage.getItem('cf_theme') + a.w.localStorage.getItem('contractforge_deploy_history'), 'dark[]', 'no other saved data was touched');
  btn.click();
  ok(!app.classList.contains('sb-collapsed') && btn.getAttribute('aria-label') === 'Collapse sidebar' && JSON.parse(a.w.localStorage.getItem(KEY)).collapsed === false, 'expand again');
  btn.click();
  const saved = a.w.localStorage.getItem(KEY);
  const b = loadApp({ storage: { [KEY]: saved } }); const d2 = b.w.document;
  ok(d2.querySelector('.app').classList.contains('sb-collapsed') && d2.getElementById('sbCollapse').getAttribute('aria-expanded') === 'false', 'after a reload the collapsed state is restored');
  for (const bad of ['not json', '[1,2]', '"x"', 'null', '{"collapsed":"yes","closed":[1]}']) {
    const c = loadApp({ storage: { [KEY]: bad } });
    ok(!c.w.document.querySelector('.app').classList.contains('sb-collapsed') && c.pageErrors.length === 0 && c.w.document.querySelectorAll('.nav-group.is-closed').length === 0, 'unreadable saved value ' + bad + ' falls back to the default without an error');
  }
}

/* 3. groups fold and unfold; folded groups keep their pages reachable (through the toggle) and mark the group that holds the open page */
{
  const a = loadApp(); const d = a.w.document; const g = d.querySelector('.nav-group[data-group="build"]'); const t = g.querySelector('.nav-group-toggle');
  t.click();
  ok(g.classList.contains('is-closed') && t.getAttribute('aria-expanded') === 'false', 'Build folds');
  eq(JSON.parse(a.w.localStorage.getItem(KEY)).closed, { build: true }, 'the folded group is saved');
  ok(g.querySelectorAll('.nav-item').length === 8, 'folding hides, never removes, the items');
  d.querySelector('.nav-item[data-section="vault"]').click(); await tick();
  eq(visible(d), ['sec-vault'], 'a page in a folded group is still reachable and opens');
  ok(g.classList.contains('has-active') && !d.querySelector('.nav-group[data-group="deploy"]').classList.contains('has-active'), 'the folded group that holds the open page is marked');
  eq(d.querySelector('.nav-item.active').dataset.section, 'vault', 'the active item is vault');
  const b = loadApp({ storage: { [KEY]: a.w.localStorage.getItem(KEY) } });
  ok(b.w.document.querySelector('.nav-group[data-group="build"]').classList.contains('is-closed') && b.w.document.querySelector('.nav-group[data-group="build"] .nav-group-toggle').getAttribute('aria-expanded') === 'false', 'a folded group stays folded after a reload');
  t.click();
  ok(!g.classList.contains('is-closed') && t.getAttribute('aria-expanded') === 'true' && JSON.parse(a.w.localStorage.getItem(KEY)).closed.build === undefined, 'Build unfolds and the saved flag is removed');
}

/* 4. every destination works while collapsed, with the active item following, and the routing is untouched */
{
  const a = loadApp(); const d = a.w.document;
  d.getElementById('sbCollapse').click();
  for (const items of Object.values(GROUPS)) for (const [sec] of items) {
    d.querySelector(`.nav-item[data-section="${sec}"]`).click(); await tick();
    ok(visible(d).join() === 'sec-' + sec && d.querySelector('.nav-item.active').dataset.section === sec && d.querySelector(`.nav-item[data-section="${sec}"]`).getAttribute('aria-current') === 'page' && d.querySelectorAll('.nav-item[aria-current]').length === 1, 'collapsed: ' + sec + ' opens, is active and is the only current item');
  }
  eq(a.pageErrors, [], 'no errors while navigating collapsed');
}

/* 5. the page and its unsaved data survive collapsing, folding and the drawer */
{
  const a = loadApp(); const d = a.w.document; const w = a.w;
  a.ev("renderSimpleForm('erc20'); genSimple('erc20')");
  d.querySelector('.nav-item[data-section="simple"]').click(); await tick();
  const field = d.querySelector('#sec-simple .field input'); field.value = 'MyToken'; field.dispatchEvent(new w.Event('input', { bubbles: true }));
  const code = d.getElementById('simpleCode').innerHTML; const section = d.getElementById('sec-simple');
  d.getElementById('sbCollapse').click(); d.querySelector('.nav-group[data-group="build"] .nav-group-toggle').click(); d.getElementById('navToggle').click(); d.getElementById('navToggle').click(); d.getElementById('sbCollapse').click();
  ok(d.getElementById('sec-simple') === section && d.querySelector('#sec-simple .field input') === field && field.value === 'MyToken' && d.getElementById('simpleCode').innerHTML === code && visible(d).join() === 'sec-simple', 'the same section, field, value and generated code after collapse, fold and drawer toggling');
}

/* 6. no duplicated listeners: initialising again changes nothing */
{
  const a = loadApp(); const d = a.w.document; const app = d.querySelector('.app');
  a.ev('initSidebar(); initSidebar(); initMobileMenu(); initMobileMenu();');
  d.getElementById('sbCollapse').click();
  ok(app.classList.contains('sb-collapsed'), 'one click toggles exactly once after repeated init');
  d.querySelector('.nav-group[data-group="deploy"] .nav-group-toggle').click();
  ok(d.querySelector('.nav-group[data-group="deploy"]').classList.contains('is-closed'), 'one group click folds exactly once after repeated init');
  eq([d.querySelectorAll('#navToggle').length, d.querySelectorAll('.sb-backdrop').length, d.querySelectorAll('#sbTip').length <= 1], [1, 1, true], 'one menu button and one backdrop');
}

/* 7. the mobile drawer: state, focus, Escape, outside click, selecting a page */
{
  const a = loadApp(); const d = a.w.document; const t = d.getElementById('navToggle'); const nav = d.getElementById('mainNav'); const sp = d.getElementById('sidebar'); const bd = d.querySelector('.sb-backdrop'); const main = d.querySelector('main');
  t.click();
  ok(nav.classList.contains('open') && sp.classList.contains('drawer-open') && bd.classList.contains('show') && t.getAttribute('aria-expanded') === 'true' && t.textContent === 'Close', 'open: nav, drawer, backdrop and button agree');
  ok(main.inert === true && d.querySelector('.brand').inert === true && d.body.classList.contains('sb-lock'), 'open: the page behind is inert and scroll is locked');
  const panel = d.getElementById('spineBody');
  eq([panel.getAttribute('role'), panel.getAttribute('aria-modal'), !!panel.getAttribute('aria-label')], ['dialog', 'true', true], 'open: the drawer is a modal dialog with a name');
  eq(d.activeElement && d.activeElement.dataset.section, 'home', 'open: focus moves to the current page link');
  d.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ok(!nav.classList.contains('open') && !sp.classList.contains('drawer-open') && !bd.classList.contains('show') && main.inert === false && !d.body.classList.contains('sb-lock') && d.activeElement === t && !panel.hasAttribute('role'), 'Escape closes, restores the page and returns focus to the menu button');
  t.click(); bd.click();
  ok(!nav.classList.contains('open') && main.inert === false, 'a click outside (the backdrop) closes it');
  t.click(); d.querySelector('.nav-item[data-section="gas"]').click(); await tick();
  ok(!nav.classList.contains('open') && t.textContent === 'Menu' && visible(d).join() === 'sec-gas' && main.inert === false, 'choosing a page closes the drawer and opens the page');
  eq(a.pageErrors, [], 'no errors');
}

/* 8. the css: widths, timing, reduced motion, and no !important in the sidebar block */
{
  const i = css.indexOf('SIDEBAR: collapsible rail'); const j = css.indexOf('/* ---- Unified header and Home (Phase 10.4)');
  const blk = css.slice(css.lastIndexOf('/* ====', i), j);
  ok(/\.app\{--sb-w:248px;display:grid;grid-template-columns:var\(--sb-w\) 1fr/.test(css) && /\.app\.sb-collapsed\{--sb-w:68px;\}/.test(blk), 'css: 248px expanded, 68px collapsed, one variable');
  ok(/transition:grid-template-columns \.19s ease/.test(blk), 'css: the width change takes 190ms');
  ok(/@media \(prefers-reduced-motion:reduce\)\{[^@]*\.app\.sb-ready[^@]*transition:none/.test(blk), 'css: reduced motion switches the transitions off');
  ok(/\.nav-item\{position:relative;height:40px/.test(blk), 'css: rows are 40px');
  ok(!/!important/.test(blk), 'css: the sidebar block needs no !important');
  ok(/body\.ai-workspace \.app\{grid-template-columns:var\(--sb-w\) minmax\(0,1fr\)/.test(css), 'css: the full-height AI workspace follows the same width');
  ok(/@media \(min-width:981px\)\{[\s\S]*\.sb-collapsed/.test(blk) && /@media \(max-width:980px\)\{[\s\S]*\.spine-body\{position:fixed/.test(blk), 'css: the rail is desktop only, phones get the drawer');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
