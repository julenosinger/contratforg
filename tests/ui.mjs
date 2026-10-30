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

/* current contract bar */
const bar = doc.getElementById('currentContract');
ok(bar.style.display === 'none', 'bar hidden before anything is generated');
ev("renderSimpleForm('erc20')"); ev("genSimple('erc20')");
ok(bar.style.display === 'flex' && /ArcDollar\.sol/.test(bar.textContent), 'bar shows the generated contract', bar.textContent);
ok(!/constructor argument/.test(bar.textContent), 'no constructor chip when there are none');
eq([...bar.querySelectorAll('button')].map((b) => b.textContent), ['Audit', 'Copy', 'Download', 'Publish'], 'bar actions');
doc.querySelector('.nav-item[data-section="swap"]').click();
[...bar.querySelectorAll('button')].find((b) => b.textContent === 'Publish').click();
eq(visible(), ['sec-deploy'], 'Publish opens Compile & Deploy from any section');
eq(doc.querySelector('.nav-item.active')?.dataset.section, 'deploy', 'menu follows Publish');
[...bar.querySelectorAll('button')].find((b) => b.textContent === 'Audit').click();
eq(visible(), ['sec-auditor'], 'Audit opens the auditor');
let copied = null; w.navigator.clipboard = { writeText: (t) => { copied = t; return Promise.resolve(); } };
[...bar.querySelectorAll('button')].find((b) => b.textContent === 'Copy').click();
ok(copied && copied.includes('contract ArcDollar'), 'Copy copies the source');
ev("setMultichainMode('portable')"); ev("renderSimpleForm('escrow')"); ev("activeNetwork='arc'"); ev("genSimple('escrow')");
ok(/Portable/.test(bar.textContent) && /1 constructor argument/.test(bar.textContent), 'bar shows mode and constructor arguments', bar.textContent);
ev("setMultichainMode('single')");
const sticky = doc.querySelector('.sticky-top');
ok(sticky.contains(banner) && sticky.contains(bar), 'banner and bar share the sticky header');

/* advanced options keep ids and values */
for (const [tpl, ids] of Object.entries({ erc20: ['s_decimals', 's_cap', 's_burn'], erc721: ['s_royalty', 's_baseuri'], escrow: ['s_token', 's_timeout'], vesting: ['s_token', 's_cliff'], paywall: ['s_token'], dao: ['s_quorum', 's_voting', 's_delay', 's_threshold'], smartwallet: ['s_entrypoint', 's_session'], staking: ['s_token', 's_reward', 's_exitfee'] })) {
  ev(`renderSimpleForm('${tpl}')`);
  await new Promise((r) => setTimeout(r, 0)); // the form is reorganised right after it renders
  const d = doc.querySelector('#simpleForm details.adv');
  ok(!!d, `${tpl}: advanced block`);
  eq(ids.map((id) => !!d?.querySelector('#' + id)), ids.map(() => true), `${tpl}: advanced fields moved`);
  ok(!!doc.querySelector('#simpleForm .btnrow button'), `${tpl}: generate button still outside`);
  ok(!d?.querySelector('#s_name'), `${tpl}: name stays visible`);
}
for (const [sec, ids] of Object.entries({ 'sec-swap': ['swap_fee', 'swap_multi'], 'sec-treasury': ['tre_streaming', 'tre_tokens'], 'sec-vault': ['vault_perf', 'vault_cap'], 'sec-multisend': ['ms_max', 'ms_fee', 'ms_owner'], 'sec-crosschain': ['cc_tokenmessenger', 'cc_msgtransmitter', 'cc_usdc', 'cc_resume'] })) {
  const d = doc.querySelector(`#${sec} details.adv`);
  ok(!!d, `${sec}: advanced block`);
  eq(ids.map((id) => !!d?.querySelector('#' + id)), ids.map(() => true), `${sec}: advanced fields moved`);
}
ev("renderSimpleForm('erc20')"); await new Promise((r) => setTimeout(r, 0)); doc.getElementById('s_decimals').value = '6'; ev("genSimple('erc20')");
ok(/uint8  public decimals = 6;/.test(ev('pendingSource.code')), 'a value changed inside Advanced options is used');

/* texts */
ok(!/All features free|Tier gates/.test(doc.querySelector('.spine').textContent), 'stale tier text removed');
ok(/multichain/.test(doc.getElementById('headVersion').textContent), 'version text updated');
ok(/16 NETWORKS/.test(doc.querySelector('.head-meta').textContent), 'header counts networks', doc.querySelector('.head-meta').textContent);
ok(!!doc.getElementById('themeBtn') && !!doc.getElementById('mcSelector') && !!doc.getElementById('sidenet'), 'sidebar controls kept');

ok(app.pageErrors.length === 0, 'page errors', app.pageErrors.join('; '));
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
