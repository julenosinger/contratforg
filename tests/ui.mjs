// Navigation, network banner and keyboard access in the real page (simulated browser).
import { loadApp } from './harness.mjs';

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
for (const [tpl, ids] of Object.entries({ erc20: ['s_decimals', 's_cap', 's_burn'], erc721: ['s_royalty', 's_baseuri'], escrow: ['s_token', 's_timeout'], vesting: ['s_token', 's_cliff'], paywall: ['s_token'], dao: ['s_quorum', 's_voting', 's_delay', 's_threshold'], smartwallet: ['s_session'], staking: ['s_token', 's_reward', 's_exitfee'] })) {
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

/* texts */
ok(!/All features free|Tier gates/.test(doc.querySelector('.spine').textContent), 'stale tier text removed');
ok(/multichain/.test(doc.getElementById('headVersion').textContent), 'version text updated');
ok(/16 NETWORKS/.test(doc.querySelector('.head-meta').textContent), 'header counts networks', doc.querySelector('.head-meta').textContent);
ok(!!doc.getElementById('themeBtn') && !!doc.getElementById('mcSelector') && !!doc.getElementById('sidenet'), 'sidebar controls kept');

ok(app.pageErrors.length === 0, 'page errors', app.pageErrors.join('; '));
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
