// Navigation, network banner and keyboard access in the real page (simulated browser).
import { loadApp } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);

const app = loadApp(); const { w, ev } = app; const doc = w.document;
const key = (el, k) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

/* navigation: every section is still reachable */
const SECTIONS = ['simple','swap','treasury','vault','multisend','crosschain','deploy','auditor','playground','history','gas','verify','share','wizard','nlai','analytics','tests'];
const items = [...doc.querySelectorAll('.nav-item')];
eq(items.map((i) => i.dataset.section).sort(), [...SECTIONS].sort(), 'all 17 sections are in the menu');
eq([...doc.querySelectorAll('.nav-group h4')].map((h) => h.textContent), ['Start here', 'Create', 'Publish', 'Check & analyze'], 'menu groups');
for (const s of SECTIONS) ok(!!doc.getElementById('sec-' + s), `section sec-${s} exists`);
eq(doc.querySelector('.nav-item.active')?.dataset.section, 'simple', 'default section is still Token / Escrow / NFT');

const visible = () => [...doc.querySelectorAll('main section.section')].filter((s) => s.style.display === 'block').map((s) => s.id);
for (const it of items) {
  it.click();
  eq(visible(), ['sec-' + it.dataset.section], `click shows only ${it.dataset.section}`);
  await new Promise((r) => setTimeout(r, 0)); // MutationObserver callbacks run after the click
  eq(it.getAttribute('aria-current'), 'page', `aria-current on ${it.dataset.section}`);
}
eq(items.filter((i) => i.hasAttribute('aria-current')).length, 1, 'one current item');

/* keyboard */
ok(items.every((i) => i.getAttribute('tabindex') === '0' && i.getAttribute('role') === 'button'), 'menu items are focusable');
key(items[0], 'Enter');
eq(visible(), ['sec-' + items[0].dataset.section], 'Enter opens a section');
key(items[3], ' ');
eq(visible(), ['sec-' + items[3].dataset.section], 'Space opens a section');
ev("renderSimpleForm('erc20')");
const field = doc.getElementById('s_name');
let clicked = false; field.closest('.field')?.addEventListener('click', () => { clicked = true; });
key(field, 'Enter');
ok(!clicked, 'Enter inside a field is not hijacked');
// dynamically created buttons become focusable and respond to the keyboard
const net = doc.querySelector('#netbar .netbtn');
ok(!!net && net.getAttribute('tabindex') === '0', 'network buttons are focusable');
const before = ev('activeNetwork');
const other = [...doc.querySelectorAll('#netbar .netbtn')].find((b) => !b.classList.contains('active') && !b.querySelector('.chip[style*="C9A24B"]'));
key(other, 'Enter');
ok(ev('activeNetwork') !== before, 'Enter selects a network');

/* banner */
const banner = doc.getElementById('netBanner');
ev("activeNetwork = 'arc'; updateSideNet();");
ok(banner.classList.contains('testnet') && /TESTNET/.test(banner.textContent) && /Arc Testnet/.test(banner.textContent), 'testnet banner', banner.textContent);
ev("activeNetwork = 'arcMain'; updateSideNet();");
ok(banner.classList.contains('mainnet') && /MAINNET/.test(banner.textContent) && /Arc Mainnet/.test(banner.textContent) && /Real funds/.test(banner.textContent), 'mainnet banner', banner.textContent);
ev("setMultichainMode('multi')");
ok(/Multi-deploy mode/.test(banner.textContent), 'banner shows the multichain mode');
ev("setMultichainMode('single')");
ok(!/mode/.test(banner.textContent), 'no mode label in single mode');

/* texts */
ok(!/All features free|Tier gates/.test(doc.querySelector('.spine').textContent), 'stale tier text removed');
ok(/multichain/.test(doc.getElementById('headVersion').textContent), 'version text updated');
ok(/16 NETWORKS/.test(doc.querySelector('.head-meta').textContent), 'header counts networks', doc.querySelector('.head-meta').textContent);
ok(!!doc.getElementById('themeBtn') && !!doc.getElementById('mcSelector') && !!doc.getElementById('sidenet'), 'sidebar controls kept');

ok(app.pageErrors.length === 0, 'page errors', app.pageErrors.join('; '));
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
