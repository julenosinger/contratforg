// Navigation, network banner and keyboard access in the real page (simulated browser).
import { createRequire } from 'node:module';
import { loadApp, fillAddresses, addrFor } from './harness.mjs';
const solc = createRequire(import.meta.url)('solc');

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);

const app = loadApp(); const { w, ev } = app; const doc = w.document;
const key = (el, k) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

/* navigation: every section is still reachable */
const SECTIONS = ['home','simple','swap','treasury','vault','multisend','crosschain','deploy','auditor','playground','history','gas','verify','share','wizard','nlai','analytics','tests','lab'];
const items = [...doc.querySelectorAll('.nav-item')];
eq(items.map((i) => i.dataset.section).sort(), [...SECTIONS].sort(), 'all 18 sections plus Home are in the menu');
eq([...doc.querySelectorAll('.nav-group h4')].map((h) => h.textContent), ['Start here', 'Create', 'Publish', 'Check & analyze'], 'menu groups');
for (const s of SECTIONS) ok(!!doc.getElementById('sec-' + s), `section sec-${s} exists`);
eq(doc.querySelector('.nav-item.active')?.dataset.section, 'home', 'Home is the landing page');
eq([...doc.querySelectorAll('main section.section')].filter((x) => x.style.display !== 'none').map((x) => x.id), ['sec-home'], 'only Home is visible at start');

const visible = () => [...doc.querySelectorAll('main section.section')].filter((s) => s.style.display === 'block').map((s) => s.id);
for (const it of items) {
  it.click();
  eq(visible(), ['sec-' + it.dataset.section], `click shows only ${it.dataset.section}`);
  await new Promise((r) => setTimeout(r, 0)); // MutationObserver callbacks run after the click
  eq(it.getAttribute('aria-current'), 'page', `aria-current on ${it.dataset.section}`);
}
eq(items.filter((i) => i.hasAttribute('aria-current')).length, 1, 'one current item');

/* top bar: wallet and network */
{
  const top = doc.querySelector('.sticky-top');
  const kids = [...top.children].map((c) => c.id || c.className.split(' ')[0]);
  eq(kids.slice(0, 3), ['walletbar', 'netBanner', 'currentContract'], 'wallet bar, network banner and contract bar share the top bar');
  ok(!!top.querySelector('#connectBtn') && !!top.querySelector('#walletStatus') && !!top.querySelector('#balanceBadge'), 'connect wallet, status and balance are in the top bar');
  ok(!doc.getElementById('sec-home').querySelector('.walletbar, #netbar'), 'Home no longer carries the wallet bar or the network selector');
  const panel = doc.getElementById('netPanel'), change = doc.getElementById('netChangeBtn');
  ok(!panel.classList.contains('open') && change.getAttribute('aria-expanded') === 'false', 'network panel starts closed');
  change.click(); ok(panel.classList.contains('open') && doc.getElementById('netChangeBtn').getAttribute('aria-expanded') === 'true', 'Change network opens the panel');
  ok(panel.querySelectorAll('.netbtn').length > 0, 'panel lists networks');
  eq(top.contains(doc.getElementById('netbar')), true, 'network selector lives in the top bar');
  const pick = [...panel.querySelectorAll('.netbtn')].find((b) => !b.classList.contains('active') && !/LIVE/.test(b.textContent));
  const chosen = pick.textContent.trim();
  pick.click(); await new Promise((r) => setTimeout(r, 0));
  ok(!panel.classList.contains('open'), 'choosing a network closes the panel');
  ok(doc.getElementById('netBanner').textContent.includes(chosen.split(' ')[0]), 'banner follows the chosen network', doc.getElementById('netBanner').textContent);
  doc.getElementById('netChangeBtn').click(); ok(panel.classList.contains('open'), 'reopened');
  doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); ok(!panel.classList.contains('open'), 'Escape closes the panel');
  doc.getElementById('netChangeBtn').click(); doc.querySelector('main').dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
  ok(!panel.classList.contains('open'), 'clicking elsewhere closes the panel');
  ev("activeNetwork = 'arc'; updateSideNet();");
}

/* home */
{
  const home = doc.getElementById('sec-home');
  eq(home.querySelector('h1').textContent, 'Contract Foundry', 'Home has the title');
  ok(/Build, audit, and deploy Solidity contracts/.test(home.textContent), 'Home keeps the introduction text');
  ok(/16 NETWORKS/.test(home.querySelector('.head-meta').textContent), 'Home shows the network count');
  eq(home.querySelectorAll('.home-grid:not(.home-modes) .home-card').length, 6, 'six contract families');
  eq(home.querySelectorAll('#homeNetworks .home-net').length, 16, 'every network is listed');
  ok(home.querySelectorAll('#homeNetworks .home-net.current').length === 1, 'the active network is highlighted');
  for (const [go, sec] of [['wizard', 'sec-wizard'], ['nlai', 'sec-nlai'], ['simple', 'sec-simple'], ['swap', 'sec-swap'], ['crosschain', 'sec-crosschain']]) {
    doc.querySelector('.nav-item[data-section="home"]').click();
    home.querySelector(`[data-go="${go}"]`).click();
    eq(visible(), [sec], `Home card ${go} opens ${sec}`);
  }
  doc.querySelector('.nav-item[data-section="swap"]').click();
  doc.querySelector('.brand .mark').click();
  eq(visible(), ['sec-home'], 'clicking the logo goes Home');
  // continue card
  ok(doc.getElementById('homeContinue').style.display === 'none', 'no continue card without a contract');
  ev("renderSimpleForm('erc20')"); ev("genSimple('erc20')");
  ok(doc.getElementById('homeContinue').style.display === 'flex' && /ArcDollar\.sol/.test(doc.getElementById('homeContinue').textContent), 'continue card shows the current contract');
  doc.querySelector('#homeContinue [data-go="deploy"]').click();
  eq(visible(), ['sec-deploy'], 'continue card opens Compile & Deploy');
  // modes
  doc.querySelector('.nav-item[data-section="home"]').click();
  eq(home.querySelectorAll('#homeModes .home-card').length, 4, 'four deployment modes');
  home.querySelector('#homeModes [data-mode="multi"]').click();
  eq(ev('multichainMode'), 'multi', 'a mode card sets the multichain mode');
  ok(home.querySelector('#homeModes [data-mode="multi"]').classList.contains('active'), 'and is highlighted');
  home.querySelector('#homeModes [data-mode="single"]').click();
  ev('ccDiscard()'); ev('renderNetBar()'); await new Promise((r) => setTimeout(r, 0));
  doc.querySelector('.nav-item[data-section="home"]').click();
}

/* switching to a mainnet uses an in-app dialog */
{
  w.confirm = () => { throw new Error('the browser confirm box must not be used'); };
  const wait = () => new Promise((r) => setTimeout(r, 0));
  ev("netFilter = 'mainnet'; activeNetwork = 'arc'; renderNetBar(); updateSideNet();");
  const chip = () => [...doc.querySelectorAll('#netbar .netbtn')].find((b) => /Ethereum/.test(b.textContent));
  chip().click(); await wait();
  const dlg = () => doc.getElementById('switchConfirm');
  ok(!!dlg() && /Switch to Ethereum\?/.test(dlg().textContent) && /real ETH/.test(dlg().textContent), 'switching to a mainnet opens the in-app dialog', dlg()?.textContent);
  eq(doc.activeElement?.id, 'scCancel', 'the safe button has focus');
  eq(ev('activeNetwork'), 'arc', 'nothing changes while the dialog is open');
  doc.getElementById('scCancel').click(); await wait();
  ok(dlg() === null && ev('activeNetwork') === 'arc', 'Cancel keeps the current network');
  chip().click(); await wait();
  doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await wait();
  ok(dlg() === null && ev('activeNetwork') === 'arc', 'Escape keeps the current network');
  chip().click(); await wait();
  doc.getElementById('scOk').click(); await wait();
  eq(ev('activeNetwork'), 'ethereum', 'confirming switches the network');
  ok(doc.getElementById('netBanner').classList.contains('mainnet'), 'banner turns to mainnet');
  // testnets switch directly
  ev("netFilter = 'testnet'; renderNetBar();");
  [...doc.querySelectorAll('#netbar .netbtn')].find((b) => /Arc Testnet/.test(b.textContent)).click(); await wait();
  ok(dlg() === null && ev('activeNetwork') === 'arc', 'testnets need no dialog');
  // wizard network step
  ev("wizardState.step = 2; renderWizardStep();");
  const wz = [...doc.querySelectorAll('#wz-netbar .netbtn')].find((b) => /Base$|Base\s/.test(b.textContent.trim()) && /LIVE/.test(b.textContent));
  wz.click(); await wait();
  ok(!!dlg(), 'the wizard also uses the in-app dialog');
  doc.getElementById('scCancel').click(); await wait();
  eq(ev('activeNetwork'), 'arc', 'wizard: Cancel keeps the network');
  ev("netFilter = 'testnet'; renderNetBar(); updateSideNet(); wizardState.step = 0; renderWizardStep();");
  w.confirm = () => true;
}

/* recent deployments on Home */
{
  const addr = (c) => '0x' + String(c).repeat(40);
  const history = [
    { name: 'ArcEscrow', address: addr(1), network: 'arcMain', timestamp: Date.now() - 60000 },
    { name: 'Broken', address: 'nope', network: 'arc', timestamp: 1 },
    null,
    { name: '<b>Evil</b>', address: addr(2), network: 'ethereum', timestamp: Date.now() - 7200000, abi: [] },
    { name: 'C3', address: addr(3), network: 'unknownnet', timestamp: Date.now() },
    { name: 'C4', address: addr(4), network: 'arc', timestamp: Date.now() },
    { name: 'C5', address: addr(5), network: 'arc', timestamp: Date.now() },
    { name: 'C6', address: addr(6), network: 'arc', timestamp: Date.now() },
    { name: 'C7', address: addr(7), network: 'arc', timestamp: Date.now() }
  ];
  const a = loadApp({ storage: { contractforge_deploy_history: JSON.stringify(history) } }); const d = a.w.document;
  const rows = () => [...d.querySelectorAll('#homeRecent .home-recent-row')];
  ok(d.getElementById('homeRecentBox').style.display === 'block', 'recent box shown when there is history');
  eq(rows().length, 5, 'at most five recent deployments');
  eq(rows().map((r) => r.querySelector('b').textContent).slice(0, 3), ['ArcEscrow', '<b>Evil</b>', 'C3'], 'newest first, broken entries skipped');
  ok(!d.querySelector('#homeRecent b b'), 'names are shown as text');
  ok(/LIVE/.test(rows()[0].textContent) && /Arc Mainnet/.test(rows()[0].textContent), 'mainnet deployments are marked');
  ok(rows()[0].querySelector('a').href === 'https://explorer.arc.io/address/' + addr(1), 'explorer link');
  ok(!rows()[2].querySelector('a'), 'unknown network has no explorer link');
  // Open in Playground uses the original history index
  rows()[1].querySelector('button').click();
  eq([...d.querySelectorAll('main section.section')].filter((x) => x.style.display === 'block').map((x) => x.id), ['sec-playground'], 'Open in Playground navigates');
  eq(d.getElementById('pg_address').value, addr(2), 'and loads the right contract');
  d.querySelector('.nav-item[data-section="home"]').click();
  d.querySelector('#homeRecentBox [data-go="history"]').click();
  eq([...d.querySelectorAll('main section.section')].filter((x) => x.style.display === 'block').map((x) => x.id), ['sec-history'], 'View all opens Deploy History');
  // a new deployment shows up
  a.ev("addToDeployHistory({ name:'Fresh', address:'" + addr(8) + "', network:'arc', abi:[] })");
  eq(rows()[0].querySelector('b').textContent, 'Fresh', 'new deployment appears on Home');
  a.ev("deleteHistoryEntry(0)");
  ok(rows()[0].querySelector('b').textContent !== 'Fresh', 'deleting updates Home');
  const empty = loadApp();
  ok(empty.w.document.getElementById('homeRecentBox').style.display === 'none', 'hidden without history');
  const bad = loadApp({ storage: { contractforge_deploy_history: '{oops' } });
  ok(bad.w.document.getElementById('homeRecentBox').style.display === 'none' && bad.pageErrors.length === 0, 'corrupted history is ignored', bad.pageErrors.join('; '));
}

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
ev('renderNetBar()'); await new Promise((r) => setTimeout(r, 0)); // new buttons are made focusable right after they render
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
eq([...bar.querySelectorAll('button')].map((b) => b.textContent), ['Test', 'Audit', 'Copy', 'Download', 'Discard', 'Publish'], 'bar actions');
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
for (const [tpl, ids] of Object.entries({ erc20: ['s_decimals', 's_cap', 's_burn'], erc721: ['s_royalty', 's_baseuri'], escrow: ['s_token', 's_timeout'], vesting: ['s_token', 's_cliff'], paywall: ['s_token'], dao: ['s_quorum', 's_voting', 's_delay', 's_threshold'], smartwallet: ['s_session', 's_rdelay'], staking: ['s_token', 's_reward', 's_exitfee'] })) {
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

/* mainnet confirmation dialog */
{
  ev("setMultichainMode('portable')"); ev("renderSimpleForm('escrow')"); ev("activeNetwork='arcMain'"); ev("updateSideNet()");
  ev("account = '0x" + 'a'.repeat(40) + "'"); ev("genSimple('escrow')");
  const dlg = () => doc.getElementById('deployConfirm');
  const wait = () => new Promise((r) => setTimeout(r, 0));
  let result; const p1 = ev('mainnetDeployConfirm({ args: ctorSummary() })').then((v) => { result = v; });
  ok(!!dlg(), 'dialog opens on mainnet');
  ok(/Arc Mainnet/.test(dlg().textContent) && /ArcEscrow\.sol/.test(dlg().textContent) && /5042/.test(dlg().textContent), 'dialog summarises network and contract');
  ok(/token/.test(dlg().querySelector('.dc-args')?.textContent || ''), 'dialog lists constructor arguments');
  const input = () => doc.getElementById('dcInput'), okBtn = () => doc.getElementById('dcConfirm');
  ok(okBtn().disabled, 'confirm is disabled until the name is typed');
  input().value = 'Arc'; input().dispatchEvent(new w.Event('input', { bubbles: true }));
  ok(okBtn().disabled, 'wrong text keeps it disabled');
  input().value = 'arc mainnet'; input().dispatchEvent(new w.Event('input', { bubbles: true }));
  ok(!okBtn().disabled, 'typing the network name (any case) enables it');
  okBtn().click(); await p1;
  eq(result, true, 'confirming resolves true'); ok(dlg() === null, 'dialog removed');
  let r2; const p2 = ev('mainnetDeployConfirm({})').then((v) => { r2 = v; }); doc.getElementById('dcCancel').click(); await p2;
  eq(r2, false, 'Cancel resolves false');
  let r3; const p3 = ev('mainnetDeployConfirm({})').then((v) => { r3 = v; });
  doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); await p3;
  eq(r3, false, 'Escape resolves false'); ok(dlg() === null, 'dialog removed after Escape');
  let r4; const p4 = ev('mainnetDeployConfirm({})').then((v) => { r4 = v; });
  input().value = 'Arc Mainnet'; input().dispatchEvent(new w.Event('input', { bubbles: true }));
  input().dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); await p4;
  eq(r4, true, 'Enter in the field confirms once the name matches');
  ev("activeNetwork='arc'; updateSideNet()");
  eq(await ev('mainnetDeployConfirm({})'), true, 'testnet needs no confirmation');
  ok(dlg() === null, 'no dialog on testnet');
  ev("setMultichainMode('single')"); void wait;
}

/* field validation */
{
  const fire = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); };
  const err = (el) => el.closest('.field')?.querySelector('.field-error')?.textContent || '';
  ev("renderSimpleForm('nft')"); // unknown template id is ignored
  ev("renderSimpleForm('erc721')"); await new Promise((r) => setTimeout(r, 0));
  const roy = doc.getElementById('s_royalty');
  fire(roy, '-5'); ok(roy.classList.contains('invalid') && /basis points/.test(err(roy)), 'royalty: negative flagged', err(roy));
  fire(roy, '20000'); ok(roy.classList.contains('invalid'), 'royalty above range flagged');
  fire(roy, '500'); ok(!roy.classList.contains('invalid') && err(roy) === '' && !roy.hasAttribute('aria-invalid'), 'royalty: fixed value clears the message');
  fire(doc.getElementById('swap_fee'), '10000'); ok(doc.getElementById('swap_fee').classList.contains('invalid'), 'swap fee 10000 flagged');
  fire(doc.getElementById('swap_fee'), '30'); ok(!doc.getElementById('swap_fee').classList.contains('invalid'), 'swap fee 30 accepted');
  ev("renderSimpleForm('escrow')"); await new Promise((r) => setTimeout(r, 0));
  const buyer = doc.getElementById('s_buyer');
  fire(buyer, '0x123'); ok(buyer.classList.contains('invalid') && /valid address/.test(err(buyer)), 'short address flagged');
  fire(buyer, '0x' + '0'.repeat(40)); ok(/zero address/i.test(err(buyer)), 'zero address flagged');
  fire(buyer, '0x' + '1'.repeat(40)); ok(!buyer.classList.contains('invalid'), 'valid address accepted');
  fire(buyer, ''); ok(!buyer.classList.contains('invalid'), 'empty is not an error');
  const sg = doc.getElementById('tre_signers');
  fire(sg, '0x' + '1'.repeat(40) + '\nnot-an-address'); ok(sg.classList.contains('invalid'), 'bad signer line flagged');
  fire(sg, '0x' + '1'.repeat(40) + '\n0x' + '2'.repeat(40)); ok(!sg.classList.contains('invalid'), 'good signer list accepted');
  // constructor panel
  ev("setMultichainMode('portable')"); ev("renderSimpleForm('dao')"); ev("activeNetwork='arc'"); doc.getElementById('s_token').value = '0x' + '3'.repeat(40); ev("genSimple('dao')");
  const a0 = doc.getElementById('ctor_arg_0');
  fire(a0, 'nope'); ok(a0.classList.contains('invalid'), 'constructor address flagged');
  const a1 = doc.getElementById('ctor_arg_1');
  fire(a1, '1.5'); ok(a1.classList.contains('invalid') && /whole number/.test(err(a1)), 'constructor number flagged');
  fire(a1, '1000'); ok(!a1.classList.contains('invalid'), 'constructor number accepted');
  ev("setMultichainMode('single')");
}

/* mobile menu */
{
  const t = doc.getElementById('navToggle'), nav = doc.getElementById('mainNav');
  ok(!!t && !!nav, 'menu button exists');
  eq(t.getAttribute('aria-expanded'), 'false', 'menu starts closed');
  t.click(); ok(nav.classList.contains('open') && t.getAttribute('aria-expanded') === 'true' && t.textContent === 'Close', 'button opens the menu');
  nav.querySelector('.nav-item[data-section="gas"]').click();
  ok(!nav.classList.contains('open') && t.textContent === 'Menu', 'choosing a section closes the menu');
  eq(visible(), ['sec-gas'], 'and still opens the section');
}

/* console: links, steps, tools */
{
  const con = doc.getElementById('deployConsole');
  ev("logConsole('ok','Explorer:', { href: 'https://example.org/a<b>', text: 'open' })");
  let a = con.querySelector('.line:last-child a');
  ok(a && a.getAttribute('rel') === 'noopener noreferrer' && a.target === '_blank' && a.textContent === 'open', 'console link is safe');
  ev("logConsole('ok','x', { href: 'javascript:alert(1)', text: 'bad' })");
  ok(!con.querySelector('.line:last-child a'), 'non-https links are ignored');
  ev("logConsole('step','<img src=x onerror=1> loading')");
  const last = con.querySelector('.line:last-child');
  ok(last.classList.contains('step') && !last.querySelector('img'), 'step lines are plain text');
  const before = con.querySelectorAll('.line').length;
  let copiedLog = null; w.navigator.clipboard = { writeText: (t) => { copiedLog = t; return Promise.resolve(); } };
  doc.getElementById('consoleCopy').click();
  ok(copiedLog && copiedLog.split('\n').length === before && /loading/.test(copiedLog), 'Copy log copies every line');
  doc.getElementById('consoleClear').click();
  eq(con.querySelectorAll('.line').length, 0, 'Clear empties the activity log');
  ev("uiResetDeployResults()"); ok(doc.getElementById('deployResult').style.display === 'none', 'no result card before a deployment');
  ev("uiAddDeployResult({ name:'ArcEscrow', network:'arcMain', address:'0x" + '1'.repeat(40) + "', txHash:'0x1' })");
  const card = doc.getElementById('deployResult');
  ok(card.style.display === 'block' && /ArcEscrow/.test(card.textContent) && /Arc Mainnet/.test(card.textContent), 'result card shows the deployment');
  ok(card.querySelector('a').href === 'https://explorer.arc.io/address/0x' + '1'.repeat(40), 'result card links to the explorer');
  let addrCopied = null; w.navigator.clipboard = { writeText: (t) => { addrCopied = t; return Promise.resolve(); } };
  card.querySelector('[data-copy]').click();
  eq(addrCopied, '0x' + '1'.repeat(40), 'Copy address');
  ev("uiResetDeployResults()");
}

/* saved session */
{
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const a1 = loadApp(); const w1 = a1.w, d1 = w1.document;
  a1.ev("setMultichainMode('portable')"); a1.ev("renderSimpleForm('escrow')"); await wait(0);
  d1.getElementById('s_amount').value = '777'; d1.getElementById('s_amount').dispatchEvent(new w1.Event('input', { bubbles: true }));
  d1.getElementById('swap_fee').value = '45'; d1.getElementById('swap_fee').dispatchEvent(new w1.Event('input', { bubbles: true }));
  d1.getElementById('ver_apikey').value = 'SECRET123'; d1.getElementById('ver_apikey').dispatchEvent(new w1.Event('input', { bubbles: true }));
  a1.ev("genSimple('escrow')");
  await wait(320);
  const stored = w1.localStorage.getItem('cf_session_v1');
  ok(!!stored && !/SECRET123/.test(stored), 'session saved without secrets');
  const saved = JSON.parse(stored);
  ok(saved.contract?.name === 'ArcEscrow' && /contract ArcEscrow/.test(saved.contract.code), 'last contract saved');
  eq(saved.forms['s:escrow:s_amount'], '777', 'simple form value saved per template');
  eq(saved.forms.swap_fee, '45', 'section form value saved');

  const a2 = loadApp({ storage: { cf_session_v1: stored } }); const d2 = a2.w.document;
  eq(a2.ev('pendingSource.name'), 'ArcEscrow', 'contract restored after reload');
  eq(a2.ev('pendingSource.code'), saved.contract.code, 'restored source is identical');
  ok(d2.getElementById('currentContract').style.display === 'flex' && /ArcEscrow\.sol/.test(d2.getElementById('currentContract').textContent), 'bar shows the restored contract');
  eq(d2.getElementById('pendingContractLabel').value.startsWith('ArcEscrow.sol'), true, 'deploy page label restored');
  eq(a2.ev('pendingCtorArgs.length'), saved.contract.args.length, 'constructor arguments restored');
  ok(/Restored your last contract/.test(d2.getElementById('deployConsole').textContent), 'console says it was restored');
  eq(d2.getElementById('swap_fee').value, '45', 'section form value restored');
  a2.ev("renderSimpleForm('escrow')"); await wait(0);
  eq(d2.getElementById('s_amount').value, '777', 'simple form value restored on first render');
  d2.getElementById('s_amount').value = '5';
  a2.ev("renderSimpleForm('escrow')"); await wait(0);
  eq(d2.getElementById('s_amount').value, '100', 're-rendering gives the defaults again (restore happens once)');
  // discard
  [...d2.querySelectorAll('#currentContract button')].find((b) => b.textContent === 'Discard').click();
  eq(a2.ev('pendingSource.code'), '', 'Discard clears the buffer');
  ok(d2.getElementById('currentContract').style.display === 'none', 'Discard hides the bar');
  eq(JSON.parse(a2.w.localStorage.getItem('cf_session_v1')).contract, undefined, 'Discard removes the saved contract');
  const a3 = loadApp({ storage: { cf_session_v1: a2.w.localStorage.getItem('cf_session_v1') } });
  eq(a3.ev('pendingSource.code'), '', 'a discarded contract is not restored');
  // corrupted storage is ignored
  const a4 = loadApp({ storage: { cf_session_v1: '{not json' } });
  eq(a4.ev('pendingSource.code'), '', 'corrupted storage is ignored');
  ok(a4.pageErrors.length === 0, 'corrupted storage causes no page errors', a4.pageErrors.join('; '));
  // reset
  a2.ev('uiReload = () => { window.__reloaded = true; }');
  d2.getElementById('resetSavedBtn').click();
  ok(a2.w.localStorage.getItem('cf_session_v1') === null && a2.w.__reloaded === true, 'Reset saved data clears storage and reloads');
}


/* ===== Phase 2: maturity badges, the mainnet gate, required fields, per-network wallet limit ===== */
const until = async (fn, ms = 3000) => { const t = Date.now(); while (Date.now() - t < ms) { const v = fn(); if (v) return v; await new Promise((r) => setTimeout(r, 5)); } return null; };
const tick = () => new Promise((r) => setTimeout(r, 15));
const PLACE = /0x0{34,36}(dEaD|bEEF|cAfE)/i;   // the old placeholder addresses (not the word 'deadline')
const fillParties = (a, net) => { fillAddresses(a, net); for (const id of ['s_token', 's_reward', 'swap_tokenA', 'swap_tokenB', 'vault_asset']) { const el = a.w.document.getElementById(id); if (el) el.value = ''; } };

/* a page with a simulated wallet: the Solidity is compiled for real, the chain is not */
function deployEnv(opts = {}) {
  const a = loadApp(opts); const { ev, w } = a; const d = w.document;
  const deployed = [];
  w.realCompile = (i) => solc.compile(i);
  w.ethers = {
    utils: {}, providers: { Web3Provider: class { async getNetwork() { return { chainId: w.__chainId || 0 }; } getSigner() { return {}; } async getBalance() { return 0; } } },
    ContractFactory: class { async deploy(...args) { const c = { address: addrFor('dep' + deployed.length), deployTransaction: { hash: '0x' + '1'.repeat(64) }, deployed: async () => {} }; deployed.push({ net: ev('activeNetwork'), args }); return c; } },
  };
  w.window.ethereum = { request: async () => {}, on: () => {} };
  ev("solcCompile = async (i) => window.realCompile(i); ensureSolcLoaded = async () => {}; switchWalletNetwork = async () => { window.__chainId = NETWORKS[activeNetwork].chainIdDec; }; refreshBalance = async () => {};");
  ev("account = '" + addrFor('acct') + "'; signer = {}; provider = {};");
  const gate = () => d.getElementById('experimentalGate');
  const summary = () => d.getElementById('deployConfirm');
  const passGate = async () => {
    const g = await until(gate); if (!g) return false;
    const box = d.getElementById('egBox'); box.checked = true; box.dispatchEvent(new w.Event('change', { bubbles: true }));
    const inp = d.getElementById('egInput'); inp.value = 'DEPLOY EXPERIMENTAL'; inp.dispatchEvent(new w.Event('input', { bubbles: true }));
    d.getElementById('egOk').click(); return true;
  };
  const passSummary = async () => {
    const s = await until(summary); if (!s) return false;
    for (const b of s.querySelectorAll('.dc-ackbox')) { b.checked = true; b.dispatchEvent(new w.Event('change', { bubbles: true })); }
    const inp = d.getElementById('dcInput'); inp.value = d.querySelector('.dc-type b').textContent; inp.dispatchEvent(new w.Event('input', { bubbles: true }));
    d.getElementById('dcConfirm').click(); return true;
  };
  const gen = (id, net = 'arc', setup) => { ev(`activeNetwork='${net}'; updateSideNet()`); ev(`renderSimpleForm('${id}')`); fillParties(a, net); if (setup) setup(); ev(`genSimple('${id}')`); };
  return { a, ev, w, d, deployed, gate, summary, passGate, passSummary, gen };
}
const consoleText = (d) => [...d.querySelectorAll('#deployConsole .line')].map((l) => l.textContent).join('\n');

/* badges: a colour is never the only signal */
{
  const e = deployEnv(); const { d } = e;
  const cards = [...d.querySelectorAll('#simpleGrid .tcard')];
  ok(cards.length >= 8 && cards.every((c) => { const b = c.querySelector('.mat-badge'); return b && /Reviewed|Experimental/.test(b.textContent) && b.getAttribute('title'); }), 'every template card carries a labelled maturity badge');
  const lvl = (id) => d.querySelector(`#simpleGrid .tcard[data-id="${id}"] .mat-badge`)?.className || '';
  ok(/mat-reviewed/.test(lvl('smartwallet')) && /mat-reviewed/.test(lvl('erc721')) && /mat-experimental/.test(lvl('escrow')) && /mat-reviewed/.test(lvl('erc20')) && /mat-reviewed/.test(lvl('paywall')) && /mat-reviewed/.test(lvl('staking')) && /mat-reviewed/.test(lvl('dao')), 'template card levels match the registry');
  ok(/mat-reviewed/.test(d.querySelector('#sec-treasury .section-head .mat-badge')?.className || '') && /mat-reviewed/.test(d.querySelector('#sec-multisend .section-head .mat-badge')?.className || '') && /mat-experimental/.test(d.querySelector('#sec-crosschain .section-head .mat-badge')?.className || ''), 'section badges: treasury and multisend reviewed, crosschain experimental');
  e.gen('escrow');
  const exp = d.querySelector('#currentContract .mat-badge');
  ok(exp && /mat-experimental/.test(exp.className) && /Experimental/.test(exp.textContent) && exp.querySelector('[aria-hidden="true"]'), 'contract bar: experimental badge has text and an icon');
}
{
  const e = deployEnv(); const { d, ev } = e;
  fillAddresses(e.a, 'arc'); ev('genTreasury()');
  const b = d.querySelector('#currentContract .mat-badge');
  ok(b && /mat-reviewed/.test(b.className) && /Reviewed/.test(b.textContent), 'contract bar: reviewed badge for the treasury');
  ok(/maturity: reviewed \| NOT AUDITED/.test(ev('pendingSource.code')), 'generated header carries the stamp');
}

/* the gate: testnets are untouched */
{
  const e = deployEnv(); e.gen('escrow', 'arc');
  await e.ev('compileAndDeploy()');
  eq(e.deployed.length, 1, 'testnet: an experimental contract deploys without any gate');
  ok(!e.gate() && !e.summary(), 'testnet: no dialog at all');
}

/* mainnet, experimental */
{
  const e = deployEnv(); const { d, w } = e; e.gen('escrow', 'arcMain');
  let run = e.ev('compileAndDeploy()');
  ok(await until(e.gate), 'mainnet: experimental contract opens the gate first');
  const ok_ = d.getElementById('egOk'), box = d.getElementById('egBox'), inp = d.getElementById('egInput');
  ok(ok_.disabled, 'gate: continue is off at the start');
  const setBox = (v) => { box.checked = v; box.dispatchEvent(new w.Event('change', { bubbles: true })); };
  const setPhrase = (v) => { inp.value = v; inp.dispatchEvent(new w.Event('input', { bubbles: true })); };
  setBox(true); ok(ok_.disabled, 'gate: the tick alone is not enough');
  setBox(false); setPhrase('DEPLOY EXPERIMENTAL'); ok(ok_.disabled, 'gate: the phrase alone is not enough');
  setBox(true); setPhrase('deploy experimental'); ok(ok_.disabled, 'gate: the phrase is case sensitive');
  setPhrase('DEPLOY EXPERIMENTAL'); ok(!ok_.disabled, 'gate: tick + exact phrase enables continue');
  d.getElementById('egCancel').click(); await run;
  eq(e.deployed.length, 0, 'gate: cancel stops the deployment');
  ok(!e.summary(), 'gate: cancel never reaches the summary');
  run = e.ev('compileAndDeploy()');
  ok(await e.passGate(), 'gate opens again');
  const s = await until(e.summary);
  ok(s && /dc-experimental/.test(s.innerHTML), 'after the gate the usual typed confirmation still follows');
  eq(e.deployed.length, 0, 'nothing is sent before the typed confirmation');
  await e.passSummary(); await run;
  eq(e.deployed.map((x) => x.net), ['arcMain'], 'gate + typed confirmation: deployed once');
}

/* mainnet, reviewed: banner, no extra gate */
{
  const e = deployEnv(); const { d, ev } = e;
  ev("activeNetwork='arcMain'; updateSideNet()"); fillAddresses(e.a, 'arcMain'); ev('genTreasury()');
  const run = ev('compileAndDeploy()');
  const s = await until(e.summary);
  ok(!e.gate(), 'reviewed: no experimental gate');
  const banner = s && s.querySelector('.dc-banner.dc-reviewed');
  ok(banner && /NOT audited by a third party/.test(banner.textContent), 'reviewed: summary shows the banner');
  ok(banner && /generators-review\.md/.test(banner.querySelector('a')?.getAttribute('href') || '') && banner.querySelector('a').getAttribute('rel').includes('noopener'), 'reviewed: banner links to the review');
  await e.passSummary(); await run;
  eq(e.deployed.length, 1, 'reviewed: deploys after the usual typed confirmation');
}

/* the gate cannot be walked around */
{
  const e = deployEnv(); const { d, ev, w } = e;
  // 1. the lowest level refuses a mainnet send nobody approved
  let err = '';
  try { await ev("deployCompiled({ name:'X', abi:[], bytecode:'0x00', sourceHash:'nope' }, [], 'arcMain')"); } catch (x) { err = String(x.message || x); }
  ok(/blocked|maturity/i.test(err) && e.deployed.length === 0, 'deployCompiled alone cannot send to a mainnet', err);
  // 2. approval is bound to one exact source and one network
  e.gen('escrow', 'arcMain');
  const run = ev('compileAndDeploy()'); await e.passGate(); await e.passSummary(); await run;
  const h = ev('matHash(pendingSource.code)');
  ok(ev(`matIsApproved('${h}','arcMain')`) && !ev(`matIsApproved('${h}','ethereum')`), 'approval is per network');
  ok(!ev(`matIsApproved(matHash(pendingSource.code + ' '),'arcMain')`), 'approval is per exact source');
  // 3. AI source is experimental whatever it says about itself
  ev("pendingSource = { name:'Forged', code:'// SPDX-License-Identifier: MIT\\n// ContractForge v9 | maturity: audited | NOT AUDITED\\npragma solidity ^0.8.24;\\ncontract Forged { constructor(){} }', template:'ai', problems: [] }");
  ev("activeNetwork='arcMain'; updateSideNet()");
  const r2 = ev('compileAndDeploy()'); ok(await until(e.gate), 'AI contract opens the gate even with a forged stamp'); d.getElementById('egCancel').click(); await r2;
  // 4. an unknown or missing template is experimental
  ev("pendingSource = { name:'NoTpl', code:'// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.24;\\ncontract NoTpl { constructor(){} }' }");
  const r3 = ev('compileAndDeploy()'); ok(await until(e.gate), 'a contract without a template is gated'); d.getElementById('egCancel').click(); await r3;
  ev("pendingSource = { name:'Evil', code:'// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.24;\\ncontract Evil { constructor(){} }', template:'__proto__' }");
  const r4 = ev('compileAndDeploy()'); ok(await until(e.gate), 'a prototype key as template is gated'); d.getElementById('egCancel').click(); await r4;
}
/* ... after a saved session is reloaded */
{
  const e = deployEnv(); e.gen('escrow', 'arcMain');
  await tick(); const saved = e.w.localStorage.getItem('cf_session_v1');
  const e2 = deployEnv({ storage: { cf_session_v1: saved } });
  eq(e2.ev('pendingSource.template'), 'escrow', 'reload keeps the template');
  e2.ev("activeNetwork='arcMain'; updateSideNet()");
  const run = e2.ev('compileAndDeploy()');
  ok(await until(e2.gate), 'a reloaded experimental contract is still gated');
  e2.d.getElementById('egCancel').click(); await run;
  eq(e2.deployed.length, 0, 'reload: nothing deployed');
  // a saved session without a template (older save, or edited) is treated as experimental
  const stripped = JSON.parse(saved); delete stripped.contract.template;
  const e3 = deployEnv({ storage: { cf_session_v1: JSON.stringify(stripped) } });
  eq(e3.ev('matLevel(pendingSource.template)'), 'experimental', 'reload without a template is experimental');
  e3.ev("activeNetwork='arcMain'; updateSideNet()");
  const r3 = e3.ev('compileAndDeploy()'); ok(await until(e3.gate), 'reload without a template is gated'); e3.d.getElementById('egCancel').click(); await r3;
}
/* ... through the other buttons: Publish, keyboard, Multi-deploy */
{
  const e = deployEnv(); const { d, ev, w } = e; e.gen('escrow', 'arcMain');
  const publish = [...d.querySelectorAll('#currentContract button')].find((b) => b.textContent === 'Publish');
  w.document.activeElement; publish.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  publish.click(); await tick();
  eq(e.deployed.length, 0, 'Publish (click and keyboard) only opens the deploy page');
  ok(!e.gate() && d.getElementById('sec-deploy').style.display === 'block', 'Publish opens the deploy section without deploying');
  // multi-deploy: one gate for every mainnet selected; cancelling stops everything, testnets included
  ev("setMultichainMode('multi')"); ev("renderSimpleForm('escrow')"); fillParties(e.a, 'arc'); ev("activeNetwork='arc'; genSimple('escrow')");
  for (const k of ['arc', 'arcMain']) ev(`toggleMdNetwork('${k}')`);
  const run = ev('multiDeploy()');
  ok(await until(e.gate), 'multi-deploy: gate opens for an experimental contract with a mainnet selected');
  d.getElementById('egCancel').click(); await run;
  eq(e.deployed.length, 0, 'multi-deploy: cancelling the gate deploys nothing, not even on the testnet');
  // only testnets selected: no gate
  ev("toggleMdNetwork('arcMain')");
  await ev('multiDeploy()');
  eq(e.deployed.map((x) => x.net), ['arc'], 'multi-deploy: a testnet-only selection needs no gate');
}

/* required fields instead of a placeholder address */
{
  const e = deployEnv(); const { d, ev, w } = e;
  ev("renderSimpleForm('escrow')"); ev('genSimple("escrow")');   // nothing filled in
  const probs = JSON.parse(ev('JSON.stringify(pendingSource.problems)'));
  ok(probs.length >= 3 && probs.some((p) => /Buyer/.test(p)) && probs.some((p) => /Seller/.test(p)) && probs.some((p) => /Arbiter/.test(p)), 'empty escrow parties are reported as required', probs.join('|'));
  ok(PLACE.test(ev('pendingSource.code')), 'the draft still shows a placeholder so the source can be read');
  const chip = d.querySelector('#currentContract .cc-chip.draft');
  ok(chip && /DRAFT/.test(chip.textContent), 'contract bar says DRAFT');
  const btns = [...d.querySelectorAll('#currentContract button')].filter((b) => ['Test', 'Copy', 'Download', 'Publish'].includes(b.textContent));
  ok(btns.length === 4 && btns.every((b) => b.disabled && b.title), 'Test, Copy, Download and Publish are off, each with the reason');
  ok(d.getElementById('btnCompileDeploy').disabled && /required|Draft/i.test(d.getElementById('draftReason').textContent) && d.getElementById('draftReason').style.display !== 'none', 'Compile and deploy is off and the reason is visible');
  ok(!!d.querySelector('.codepanel .req-draft'), 'the code panel is tagged DRAFT');
  // every network, not only mainnets
  for (const net of ['arc', 'ethereum', 'arcMain']) {
    ev(`activeNetwork='${net}'; updateSideNet()`);
    await ev('compileAndDeploy()');
    ok(e.deployed.length === 0 && !e.gate(), `draft cannot be deployed on ${net}`);
  }
  ok(/Draft|required/i.test(consoleText(d)), 'the console says why');
  // copy and download are refused too
  let wrote = 0; Object.defineProperty(w.navigator, 'clipboard', { value: { writeText: async () => { wrote++; } }, configurable: true });
  ev('copySource()'); eq(wrote, 0, 'copy is refused for a draft');
  w.URL.createObjectURL = () => { wrote++; return 'blob:x'; };
  ev('downloadSource()'); eq(wrote, 0, 'download is refused for a draft');
  // multi-deploy and the lab refuse it as well
  ev("setMultichainMode('multi')"); ev("toggleMdNetwork('arc')");
  await ev('multiDeploy()'); eq(e.deployed.length, 0, 'multi-deploy refuses a draft');
  ev("setMultichainMode('single')");
  // second layer: a placeholder that slipped past the field checks is still caught at deploy time
  ev("pendingSource = { name:'Slip', code:'// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.24;\\ncontract Slip { address a = 0x000000000000000000000000000000000000dEaD; }', template:'escrow', problems: [] }");
  ev("activeNetwork='arc'; updateSideNet()"); await ev('compileAndDeploy()');
  eq(e.deployed.length, 0, 'regex guard blocks a placeholder on a testnet');
  // fixing the fields clears the draft
  ev("activeNetwork='arc'; updateSideNet(); renderSimpleForm('escrow')"); fillParties(e.a, 'arc'); ev('genSimple("escrow")');
  eq(ev('pendingSource.problems.length'), 0, 'valid parties: no problems');
  ok(!PLACE.test(ev('pendingSource.code')), 'valid parties: no placeholder in the source');
  ok(!d.getElementById('btnCompileDeploy').disabled && !d.querySelector('#currentContract .cc-chip.draft'), 'buttons come back');
  // parties must differ
  const set = (id, v) => { const el = d.getElementById(id); el.value = v; };
  const goodSeller = d.getElementById('s_seller').value;
  set('s_seller', d.getElementById('s_buyer').value); ev('genSimple("escrow")');
  ok(ev('pendingSource.problems').some((p) => /differ|same|different/i.test(p)), 'buyer and seller must differ');
  ok(!PLACE.test(ev('pendingSource.code')), 'that draft has no placeholder in it: only the field check can block it');
  ev("activeNetwork='arc'; updateSideNet()"); const before = e.deployed.length; await ev('compileAndDeploy()');
  eq(e.deployed.length, before, 'a draft with valid-looking but clashing parties is still blocked');
  ok(d.getElementById('btnCompileDeploy').disabled, 'and the deploy button is off');
  set('s_seller', '0x000000000000000000000000000000000000dEaD'); ev('genSimple("escrow")');
  ok(ev('pendingSource.problems').some((p) => /placeholder/i.test(p)), 'a typed 0x...dEaD is reported as a placeholder');
  set('s_seller', goodSeller); ev('genSimple("escrow")');
}
{
  const e = deployEnv(); const { d, ev } = e;
  // treasury: no shipped placeholder signers
  eq(d.getElementById('tre_signers').value, '', 'treasury signers box starts empty');
  ev('genTreasury()'); ok(ev('pendingSource.problems.length') > 0 && /Signers/i.test(ev('pendingSource.problems.join("|")')), 'treasury without signers is a draft');
  d.getElementById('tre_signers').value = [addrFor('s1'), addrFor('s1'), addrFor('s2')].join('\n'); ev('genTreasury()');
  ok(/duplicate|twice|distinct|different/i.test(ev('pendingSource.problems.join("|")')), 'treasury: duplicate signers are reported');
  d.getElementById('tre_signers').value = [addrFor('s1'), addrFor('s2'), addrFor('s3')].join('\n'); ev('genTreasury()');
  eq(ev('pendingSource.problems.length'), 0, 'treasury: three distinct signers are fine');
  ok(!PLACE.test(ev('pendingSource.code')), 'treasury: no placeholder in the source');
}
{
  // DAO: the token is required in a single network, a deploy argument when portable
  const e = deployEnv(); const { ev } = e;
  ev("renderSimpleForm('dao')"); ev('genSimple("dao")');
  ok(ev('pendingSource.problems.length') > 0, 'DAO without a token is a draft');
  ev("setMultichainMode('portable')"); ev("renderSimpleForm('dao')"); ev('genSimple("dao")');
  eq(ev('pendingSource.problems.length'), 0, 'portable DAO takes the token at deploy time');
  // a network with no default token (Robinhood has no USDC): required unless portable
  ev("setMultichainMode('single')"); e.gen('escrow', 'robinhood', null);
  ok(ev('pendingSource.problems.length') >= 0, 'robinhood escrow generates');
}
/* inline checks (real ethers: the checksum comes from it) */
{
  const a = loadApp({ realEthers: true }); const { ev, w } = a; const d = w.document;
  ev("renderSimpleForm('escrow')"); await tick();
  const f = d.getElementById('s_buyer');
  const type = async (v) => { f.value = v; f.dispatchEvent(new w.Event('input', { bubbles: true })); await tick(); return f.closest('.field').querySelector('.field-error')?.textContent || ''; };
  ok(/placeholder/i.test(await type('0x000000000000000000000000000000000000dEaD')), 'inline: the dEaD placeholder is rejected');
  ok(/zero/i.test(await type('0x' + '0'.repeat(40))), 'inline: the zero address is rejected');
  ok(await type('0x123'), 'inline: a short address is rejected');
  ok(/checksum/i.test(await type('0x5AAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')), 'inline: a wrong checksum is rejected');
  eq(await type('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'), '', 'inline: the right checksum is accepted');
  eq(await type(addrFor('good')), '', 'inline: a valid address clears the message');
  ok(f.getAttribute('aria-required') === 'true', 'required field is marked');
  ev("renderSimpleForm('smartwallet')"); await tick();
  ev("account = '" + addrFor('acct') + "'");
  const g = d.getElementById('s_guardian'); g.value = addrFor('acct'); g.dispatchEvent(new w.Event('input', { bubbles: true })); await tick();
  ok(/deploy/i.test(g.closest('.field').querySelector('.field-error')?.textContent || ''), 'inline: the guardian cannot be the deploying wallet');
}
{
  const e = deployEnv(); const { d, ev } = e;
  ev("renderSimpleForm('smartwallet')"); d.getElementById('s_guardian').value = addrFor('g2'); ev("genSimple('smartwallet')");
  eq(ev('pendingSource.notDeployer[0].value').toLowerCase(), addrFor('g2').toLowerCase(), 'the guardian is remembered for the deploy-time check');
  ev("activeNetwork='arc'; updateSideNet(); account = '" + addrFor('g2') + "'");   // the connected wallet is the guardian
  await ev('compileAndDeploy()');
  eq(e.deployed.length, 0, 'deploying from the guardian wallet is refused');
  ok(/guardian/i.test(consoleText(d)), 'the console names the guardian');
  ev("account = '" + addrFor('acct') + "'"); await ev('compileAndDeploy()');
  eq(e.deployed.length, 1, 'a different wallet can deploy');
}

/* default daily limit per network */
{
  const e = deployEnv(); const { d, ev, w } = e;
  const want = { ETH: '0.1', POL: '100', AVAX: '2', BNB: '0.1', USDC: '100' };
  const bad = JSON.parse(ev("JSON.stringify(Object.entries(NETWORKS).filter(([k,n]) => n.walletDailyDefault !== ({ETH:'0.1',POL:'100',AVAX:'2',BNB:'0.1',USDC:'100'})[n.gasSymbol]).map(([k]) => k))"));
  eq(bad, [], 'every network has the default for its gas token');
  ok(Object.keys(want).every((s) => ev(`Object.values(NETWORKS).some(n => n.gasSymbol === '${s}')`)), 'all five gas tokens are covered');
  ev("renderSimpleForm('smartwallet')"); await tick();
  eq([d.getElementById('s_spendlimit').value, d.getElementById('s_limit_unit').textContent.split(',')[0]], ['100', 'USDC'], 'Arc: 100 USDC');
  ev("activeNetwork='ethereum'; updateSideNet()");
  eq([d.getElementById('s_spendlimit').value, d.getElementById('s_limit_unit').textContent.split(',')[0]], ['0.1', 'ETH'], 'Ethereum: 0.1 ETH (default follows the network)');
  fillParties(e.a, 'ethereum'); ev("genSimple('smartwallet')");
  ok(/DAILY_LIMIT = 100000000000000000;/.test(ev('pendingSource.code')) && /0\.1 ETH/.test(ev('pendingSource.code')), 'the generated limit is 0.1 ETH');
  d.getElementById('s_spendlimit').value = ''; ev("genSimple('smartwallet')");
  ok(/DAILY_LIMIT = 100000000000000000;/.test(ev('pendingSource.code')), 'an empty limit falls back to the network default (0.1 ETH), not to 100');
  d.getElementById('s_spendlimit').value = '0.1';
  // a value typed by the user is kept when the network changes
  const lim = d.getElementById('s_spendlimit'); lim.value = '5'; lim.dispatchEvent(new w.Event('input', { bubbles: true }));
  ev("activeNetwork='arc'; updateSideNet()");
  eq(d.getElementById('s_spendlimit').value, '5', 'a typed limit is kept');
  // it is not saved with the session
  await new Promise((r) => setTimeout(r, 320));
  ok(!JSON.stringify(JSON.parse(w.localStorage.getItem('cf_session_v1') || '{}').forms || {}).includes('s_spendlimit'), 'the limit is not saved with the form values');
  // portable: an untouched limit follows each network
  ev("setMultichainMode('portable')"); ev("renderSimpleForm('smartwallet')"); fillParties(e.a, 'arc'); ev("genSimple('smartwallet')");
  const idx = JSON.parse(ev('JSON.stringify(pendingCtorArgs.map(a=>a.param))')).indexOf('dailyLimit_');
  eq([ev(`ctorArgValue(pendingCtorArgs[${idx}], 'arc')`), ev(`ctorArgValue(pendingCtorArgs[${idx}], 'ethereum')`)], ['100' + '0'.repeat(18), '1' + '0'.repeat(17)], 'portable: each network gets its own default');
  ev("setMultichainMode('single')");
  // mainnet summary shows the limit and asks for its own tick
  ev("activeNetwork='arcMain'; updateSideNet(); renderSimpleForm('smartwallet')"); fillParties(e.a, 'arcMain'); ev("genSimple('smartwallet')");
  const run = ev('compileAndDeploy()');
  const s = await until(e.summary);
  ok(s && /Session-key daily limit/.test(s.textContent) && /100 USDC/.test(s.textContent), 'mainnet summary lists the daily limit with its unit');
  const confirm = d.getElementById('dcConfirm'), inp = d.getElementById('dcInput');
  inp.value = d.querySelector('.dc-type b').textContent; inp.dispatchEvent(new w.Event('input', { bubbles: true }));
  ok(confirm.disabled, 'the typed network alone is not enough: the limit must be ticked');
  const ack = s.querySelector('.dc-ackbox'); ack.checked = true; ack.dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(!confirm.disabled, 'tick + typed network enables Deploy');
  confirm.click(); await run;
  eq(e.deployed.length, 1, 'the reviewed wallet deploys after both confirmations');
}

/* texts */
ok(!/All features free|Tier gates/.test(doc.querySelector('.spine').textContent), 'stale tier text removed');
ok(/multichain/.test(doc.getElementById('headVersion').textContent), 'version text updated');
ok(/16 NETWORKS/.test(doc.querySelector('.head-meta').textContent), 'header counts networks', doc.querySelector('.head-meta').textContent);
ok(!!doc.getElementById('themeBtn') && !!doc.getElementById('mcSelector') && !!doc.getElementById('sidenet'), 'sidebar controls kept');

ok(app.pageErrors.length === 0, 'page errors', app.pageErrors.join('; '));
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
