// Phase 10.4: the unified header (level 1: network, deployment mode, wallet; level 2: the contract bar with an Actions menu) and the Home dashboard.
// The elements keep their ids, handlers and state. These tests prove: the network card still opens the panel and warns on mainnets (16 networks), the mode
// control is the shared one, the wallet controls are where they were, the Actions menu behaves as a menu and its items run the same handlers with the same
// disabled states, DRAFT restrictions hold, nothing in the header or Home changes the contract, network or mode by itself, and Home shows real records only.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const A = addrFor('a1'), B = addrFor('b2'), C = addrFor('c3');
const HK = 'contractforge_deploy_history';

function fresh() {
  const a = loadApp(); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  const alerts = []; a.w.alert = (m) => alerts.push(m);
  const settle = async () => { await tick(); await tick(); await tick(); };
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await settle(); };
  const net = async (k) => { a.ev(`activeNetwork = '${k}'; updateSideNet();`); await settle(); };
  const shown = () => [...d.querySelectorAll('main section.section')].filter((s) => s.style.display === 'block').map((s) => s.id.replace('sec-', ''));
  const key = (el, k) => el.dispatchEvent(new a.w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  const GEN = {
    erc20: () => a.ev("renderSimpleForm('erc20'); genSimple('erc20')"),
    swap: () => a.ev('genSwap()'), vault: () => a.ev('genVault()'), multisend: () => a.ev('genMultisend()'), crosschain: () => a.ev('genCrosschain()'),
    treasury: (good = true) => { d.getElementById('tre_signers').value = good ? [A, B, C].join('\n') : ''; a.ev('genTreasury()'); }
  };
  const clip = []; Object.defineProperty(a.w.navigator, 'clipboard', { value: { writeText: (x) => { clip.push(x); return Promise.resolve(); } }, configurable: true });
  const files = []; a.w.Blob = class { constructor(p) { this.t = p.join(''); } }; a.w.URL.createObjectURL = (b) => { a.last = b; return 'x'; }; a.w.URL.revokeObjectURL = () => {}; a.w.HTMLAnchorElement.prototype.click = function () { files.push(this.download); };
  const fetches = []; a.w.fetch = async (u) => { fetches.push(String(u)); return { json: async () => ({}) }; };
  return { ...a, d, alerts, settle, go, net, shown, key, GEN, clip, files, fetches };
}
const cs = (a, sel, prop) => a.w.getComputedStyle(a.d.querySelector(sel))[prop];
const NETS = (a) => JSON.parse(a.ev('JSON.stringify(Object.entries(NETWORKS).map(([k, n]) => [k, n.label, !!n.isMainnet, n.chainIdDec]))'));

/* 1. level 1: the structure, the ids and the CSS scope */
{
  const a = fresh(); const { d } = a;
  eq([...d.querySelector('.sticky-top').children].map((c) => c.id || c.className.split(' ')[0]), ['globalBar', 'currentContract', 'netPanel'], 'two levels: the global bar and the contract bar (the network panel opens below them)');
  ok(!!d.querySelector('#globalBar > .gbar-left > #netBanner') && !!d.querySelector('#globalBar > .gbar-left > #gbarMode.dm-mount') && !!d.querySelector('#globalBar > .walletbar > #walletStatus') && !!d.querySelector('#globalBar #balanceBadge') && !!d.querySelector('#globalBar #connectBtn'), 'level 1 holds the network card, the deployment mode and the wallet controls');
  eq(['netBanner', 'netPanel', 'netChangeBtn', 'currentContract', 'walletStatus', 'balanceBadge', 'connectBtn', 'globalBar'].map((id) => d.querySelectorAll('#' + id).length), [1, 1, 1, 1, 1, 1, 1, 1], 'every id exists once');
  eq(d.getElementById('connectBtn').getAttribute('data-onclick'), 'connectWallet()', 'Connect Wallet keeps its handler');
  eq(['order'].map(() => ['#balanceBadge', '#walletStatus', '#connectBtn'].map((s) => cs(a, s, 'order'))), [['1', '2', '3']], 'the wallet controls read: balance, status, connect');
  eq([cs(a, '#netBanner', 'display'), cs(a, '#gbarMode .dm-trigger', 'display') !== 'none'], ['flex', true], 'the banner is still a flex row and the mode trigger is drawn');
  ok(!d.querySelector('#globalBar').outerHTML.match(/\son[a-z]+="/i) && !/style=/.test(d.querySelector('#globalBar .wb-actions').outerHTML), 'csp: no inline handler, and no inline style on the wallet actions');
  const blk = css.slice(css.indexOf('/* ---- Unified header and Home (Phase 10.4)'), css.indexOf('/* ---- Deploy History (section 10)'));
  const sels = []; blk.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, s) => { sels.push(...s.split(',').map((x) => x.trim())); return ''; });
  eq(sels.filter((s) => s && !s.startsWith('@') && !/^(\.light )?(\.sticky-top|\.gbar|\.cc-|\.home-)/.test(s)), [], 'css: every new rule is scoped to the header, the contract bar or Home');
  ok(/@media \(max-width:640px\)\{[^}]*\.gbar \.gbar-left\{width:100%;\}/.test(blk) && /@media \(max-width:900px\)/.test(blk), 'css: tablet and phone layouts exist');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 2. the network card: all 16 networks, mainnet warnings, and the panel */
{
  const a = fresh(); const { d } = a; const nets = NETS(a);
  for (const [k, label, main, chain] of nets) {
    await a.net(k); const b = d.getElementById('netBanner');
    eq([b.classList.contains(main ? 'mainnet' : 'testnet'), b.querySelector('.nb-tag').textContent, b.querySelector('.nb-net').textContent, b.querySelector('.nb-chain').textContent], [true, main ? 'MAINNET' : 'TESTNET', label, 'chain ' + chain], `${k}: tag, name and chain`);
    const note = b.querySelector('.nb-note'); const hidden = cs(a, '#netBanner .nb-note', 'position') === 'absolute' && cs(a, '#netBanner .nb-note', 'width') === '1px';
    const shownLine = cs(a, '#netBanner .nb-note', 'display') !== 'none' && cs(a, '#netBanner .nb-note', 'position') !== 'absolute';
    eq([note.textContent, main ? shownLine : hidden], [main ? 'Real funds. Transactions cannot be undone.' : 'Test funds only.', true], `${k}: ${main ? 'the real-funds warning is visible' : 'the test-funds note is kept for screen readers only'}`);
  }
  await a.net('arc');
  const btn = d.getElementById('netChangeBtn');
  eq([btn.textContent, btn.getAttribute('aria-controls'), btn.getAttribute('aria-expanded'), cs(a, '#netChangeBtn', 'position')], ['Change network', 'netPanel', 'false', 'absolute'], 'the whole card is the (transparent) Change network button, labelled and linked to the panel');
  btn.click(); eq([d.getElementById('netPanel').classList.contains('open'), d.getElementById('netChangeBtn').getAttribute('aria-expanded')], [true, 'true'], 'clicking the card opens the network panel');
  d.querySelector('#netbar .netbtn').click(); await a.settle(); eq(d.getElementById('netPanel').classList.contains('open'), false, 'choosing a network closes it');
  d.getElementById('netChangeBtn').click(); a.key(d.body, 'Escape'); eq(d.getElementById('netPanel').classList.contains('open'), false, 'Escape closes it');
  eq([a.ev('typeof window.ethereum'), a.fetches.length], ['undefined', 0], 'changing the network in the page asks no wallet and sends nothing');
}

/* 3. the deployment mode in the header is the shared control */
{
  const a = fresh(); const { d } = a;
  const tr = d.querySelector('#gbarMode .dm-trigger');
  eq([tr.getAttribute('aria-haspopup'), tr.querySelector('.dm-v').textContent, cs(a, '#gbarMode .dm-k', 'display')], ['listbox', 'Single network', 'none'], 'the trigger shows the real mode, without the long label');
  tr.click(); eq([d.getElementById('dmPopover').hidden, a.ev('multichainMode')], [false, 'single'], 'opening it changes nothing');
  d.querySelector('#dmPopover [data-dm-mode="multi"]').click(); await a.settle();
  eq([a.ev('multichainMode'), tr.querySelector('.dm-v').textContent, d.querySelector('#sec-swap .dm-trigger .dm-v').textContent, /Multi-deploy mode/.test(d.getElementById('netBanner').textContent)], ['multi', 'Multi-deploy', 'Multi-deploy', true], 'choosing a mode uses the existing setter and every control follows');
  a.ev("setMultichainMode('single')"); await a.settle();
}

/* 4. level 2: the contract bar */
{
  const a = fresh(); const { d } = a; const bar = d.getElementById('currentContract');
  eq(bar.style.display, 'none', 'no contract: the bar is not shown');
  a.GEN.erc20(); await a.settle();
  const name = a.ev('pendingSource.name');
  eq([bar.style.display, bar.querySelector('.cc-info b').textContent, /\d+ lines/.test(bar.textContent), bar.querySelectorAll('.mat-badge').length], ['flex', name + '.sol', true, 1], 'a contract: its file name, line count and maturity badge');
  eq(bar.textContent.includes(a.ev('pendingSource.code').split('\n').length + ' lines'), true, 'the line count is the real one');
  const menu = d.getElementById('ccMenu'), mb = d.getElementById('ccMenuBtn');
  eq([mb.getAttribute('aria-haspopup'), mb.getAttribute('aria-expanded'), menu.hidden, menu.getAttribute('role'), [...menu.children].map((b) => b.getAttribute('role'))], ['menu', 'false', true, 'menu', ['menuitem', 'menuitem', 'menuitem', 'menuitem', 'menuitem']], 'the menu starts closed and is a menu of five items');
  eq([...menu.querySelectorAll('button')].map((b) => b.textContent + ':' + b.getAttribute('data-onclick')), ['Test:ccTest()', 'Audit:ccAudit()', 'Copy:copySource()', 'Download:downloadSource()', 'Discard:ccDiscard()'], 'the five items keep their handlers');
  eq([bar.querySelector('.btn-primary').textContent, bar.querySelector('.btn-primary').getAttribute('data-onclick')], ['Publish', 'ccPublish()'], 'Publish stays the one prominent button');
  // keyboard
  mb.focus(); a.key(mb, 'ArrowDown'); eq([menu.hidden, mb.getAttribute('aria-expanded'), d.activeElement.textContent], [false, 'true', 'Test'], 'ArrowDown on the button opens it and focuses the first item');
  a.key(d.activeElement, 'ArrowDown'); eq(d.activeElement.textContent, 'Audit', 'ArrowDown moves on');
  a.key(d.activeElement, 'End'); eq(d.activeElement.textContent, 'Discard', 'End goes to the last item');
  a.key(d.activeElement, 'ArrowDown'); eq(d.activeElement.textContent, 'Test', 'and it wraps round');
  a.key(d.activeElement, 'ArrowUp'); eq(d.activeElement.textContent, 'Discard', 'ArrowUp wraps back');
  a.key(d.activeElement, 'Home'); eq(d.activeElement.textContent, 'Test', 'Home goes to the first');
  a.key(d.activeElement, 'Escape'); eq([d.getElementById('ccMenu').hidden, d.getElementById('ccMenuBtn').getAttribute('aria-expanded'), d.activeElement.id], [true, 'false', 'ccMenuBtn'], 'Escape closes it and returns the focus to the button');
  mb.click(); d.querySelector('main').dispatchEvent(new a.w.MouseEvent('click', { bubbles: true })); eq(d.getElementById('ccMenu').hidden, true, 'a click outside closes it');
  mb.click(); a.key(d.activeElement, 'Tab'); eq(d.getElementById('ccMenu').hidden, true, 'Tab closes it');
  mb.click(); mb.click(); eq(d.getElementById('ccMenu').hidden, true, 'the button toggles it');
  // the items run their handlers
  mb.click(); [...d.querySelectorAll('#ccMenu button')].find((b) => b.textContent === 'Copy').click(); await a.settle();
  eq([a.clip, d.getElementById('ccMenu').hidden], [[a.ev('pendingSource.code')], true], 'Copy copies the source and the menu closes');
  mb.click(); [...d.querySelectorAll('#ccMenu button')].find((b) => b.textContent === 'Download').click(); await a.settle();
  eq(a.files, [name + '.sol'], 'Download saves the .sol');
  mb.click(); [...d.querySelectorAll('#ccMenu button')].find((b) => b.textContent === 'Test').click(); await a.settle(); eq(a.shown(), ['lab'], 'Test opens the Test Lab');
  d.getElementById('ccMenuBtn').click(); [...d.querySelectorAll('#ccMenu button')].find((b) => b.textContent === 'Audit').click(); await a.settle(); eq(a.shown(), ['auditor'], 'Audit opens the auditor');
  d.querySelector('#currentContract .btn-primary').click(); await a.settle(); eq(a.shown(), ['deploy'], 'Publish goes to Compile & Deploy');
  d.getElementById('ccMenuBtn').click(); [...d.querySelectorAll('#ccMenu button')].find((b) => b.textContent === 'Discard').click(); await a.settle();
  eq([d.getElementById('currentContract').style.display, a.ev('pendingSource.code')], ['none', ''], 'Discard clears the contract and hides the bar');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 5. DRAFT and the security restrictions are still enforced, now inside the menu */
{
  const a = fresh(); const { d } = a; a.GEN.treasury(false); await a.settle();
  const reason = a.ev('reqBlockReason()'); ok(!!reason, 'setup: an empty treasury is a draft');
  const items = Object.fromEntries([...d.querySelectorAll('#ccMenu button')].map((b) => [b.textContent, { dis: b.disabled, title: b.title }]));
  eq(Object.fromEntries(Object.entries(items).map(([k, v]) => [k, v.dis])), { Test: true, Audit: false, Copy: true, Download: true, Discard: false }, 'a draft: Test, Copy and Download are disabled; Audit and Discard are not');
  ok(['Test', 'Copy', 'Download'].every((k) => items[k].title === reason) && d.querySelector('#currentContract .btn-primary').disabled, 'and each carries the reason; Publish is disabled too');
  ok(/DRAFT: \d+ to fix/.test(d.querySelector('#currentContract .cc-chip.draft').textContent) && d.querySelector('#currentContract .cc-why').textContent === reason, 'the DRAFT chip and the reason alert are shown');
  d.getElementById('ccMenuBtn').click(); a.key(d.activeElement, 'End'); eq(d.activeElement.textContent, 'Discard', 'keyboard navigation skips disabled items');
  a.key(d.activeElement, 'Home'); eq(d.activeElement.textContent, 'Audit', 'the first enabled item gets the focus');
  const before = a.shown(); a.ev('ccPublish()'); a.ev('ccTest()'); await a.settle(); eq(a.shown(), before, 'ccPublish() and ccTest() do nothing for a draft');
  // security: the mainnet gate still refuses
  for (const k of ['ethereum', 'arcMain']) { await a.net(k); const r = await a.w.eval(`deployCompiled({ name: 'X', abi: [], bytecode: '0x00', sourceHash: 'zz' }, [], '${k}').then(() => 'ran', (e) => String(e.message))`); ok(/blocked|confirm|approv|maturity/i.test(r), `${k}: the mainnet maturity gate still refuses (${r.slice(0, 60)})`); }
}

/* 6. the bar and the menu survive redraws: one set of listeners, no duplicated ids */
{
  const a = fresh(); const { d } = a; a.GEN.erc20(); await a.settle();
  let adds = 0; const ad = a.w.document.addEventListener; a.w.document.addEventListener = function (...x) { adds++; return ad.apply(this, x); };
  for (let i = 0; i < 12; i++) { a.ev('renderCurrentContract()'); await a.go(['home', 'swap', 'deploy', 'history'][i % 4]); }
  a.w.document.addEventListener = ad;
  eq([adds, d.querySelectorAll('#ccMenuBtn').length, d.querySelectorAll('#ccMenu').length, d.querySelectorAll('#currentContract .cc-info').length], [0, 1, 1, 1], 'twelve redraws add no listener and no duplicate id');
  d.getElementById('ccMenuBtn').click(); eq(d.getElementById('ccMenu').hidden, false, 'and the menu still opens once per click');
  d.getElementById('ccMenuBtn').click(); eq(d.getElementById('ccMenu').hidden, true, 'and closes once per click');
  eq([a.ev('pendingSource.name') !== '', d.getElementById('currentContract').style.display], [true, 'flex'], 'the contract survived the navigation');
}

/* 7. the header on every page, and in the AI workspace */
{
  const a = fresh(); const { d } = a; a.GEN.erc20(); await a.settle();
  for (const s of [...d.querySelectorAll('.nav-item[data-section]')].map((n) => n.dataset.section)) {
    await a.go(s);
    const ai = s === 'nlai';
    ok(cs(a, '#globalBar', 'display') !== 'none' && cs(a, '#connectBtn', 'display') !== 'none' && cs(a, '#walletStatus', 'display') !== 'none', `${s}: the global bar and the wallet controls are there`);
    eq([cs(a, '#gbarLeft', 'display') === 'none', cs(a, '#netBanner', 'display') === 'none', cs(a, '#currentContract', 'display') === 'none'], [ai, ai, ai], `${s}: ${ai ? 'the AI workspace hides the network card and the contract bar (as before)' : 'the network card and the contract bar are shown'}`);
  }
}

/* 8. Home: the hero, the builders by category, and the lists */
{
  const a = fresh(); const { d } = a; const home = d.getElementById('sec-home');
  eq(home.querySelector('h1').textContent, 'Build something powerful.', 'the heading');
  eq([...home.querySelectorAll('.home-cta .btn')].map((b) => b.textContent + ':' + b.dataset.go + ':' + b.classList.contains('btn-primary')), ['Create Contract:wizard:true', 'Build with AI:nlai:false', 'Explore Templates:simple:false'], 'three actions: the Wizard (primary), the AI and the templates');
  for (const [txt, sec] of [['Create Contract', 'wizard'], ['Build with AI', 'nlai'], ['Explore Templates', 'simple']]) { await a.go('home'); [...home.querySelectorAll('.home-cta .btn')].find((b) => b.textContent === txt).click(); await a.settle(); eq(a.shown(), [sec], `${txt} opens ${sec}`); }
  await a.go('home');
  eq([...home.querySelectorAll('.home-cat')].map((c) => c.querySelector('.home-cat-h').textContent + ':' + [...c.querySelectorAll('.home-card')].map((x) => x.dataset.go).join(',')), ['Simple:simple', 'DeFi:swap,treasury,vault', 'Payments:multisend,crosschain'], 'six builders in three categories');
  eq(home.querySelectorAll('.home-grid:not(.home-modes) .home-card').length, 6, 'six contract families');
  for (const s of ['simple', 'swap', 'treasury', 'vault', 'multisend', 'crosschain']) { await a.go('home'); home.querySelector(`.home-card[data-go="${s}"]`).click(); await a.settle(); eq(a.shown(), [s], `the ${s} card opens ${s}`); }
  await a.go('home');
  eq([...home.querySelectorAll('details.home-fold')].map((x) => x.open), [true, true], 'the modes and the networks sections are collapsible and open');
  eq([home.querySelectorAll('#homeModes .home-card').length, home.querySelectorAll('#homeNetworks .home-net').length, home.querySelectorAll('#homeNetworks .home-net.current').length], [4, 16, 1], 'all four modes and all 16 networks, one current');
  const snap = () => JSON.stringify([a.ev('activeNetwork'), a.ev('multichainMode'), a.ev('[...mdState.selected]')]);
  const s0 = snap(); home.querySelectorAll('details.home-fold').forEach((x) => { x.open = false; x.open = true; }); a.ev('renderHome()'); eq(snap(), s0, 'collapsing and redrawing never changes the network, the mode or the selection');
  home.querySelector('#homeModes [data-mode="portable"]').click(); await a.settle(); eq(a.ev('multichainMode'), 'portable', 'a mode card still sets the mode (only when clicked)'); a.ev("setMultichainMode('single')");
}

/* 9. Home: the active contract card tells only what is real, and Continue goes to the builder that made it */
{
  const a = fresh(); const { d } = a; const cont = d.getElementById('homeContinue');
  eq(cont.style.display, 'none', 'no contract: no card');
  const cases = [['erc20', () => a.GEN.erc20(), 'simple'], ['swap', () => a.GEN.swap(), 'swap'], ['treasury', () => a.GEN.treasury(), 'treasury'], ['vault', () => a.GEN.vault(), 'vault'], ['multisend', () => a.GEN.multisend(), 'multisend'], ['crosschain', () => a.GEN.crosschain(), 'crosschain']];
  for (const [label, gen, to] of cases) {
    await a.net('sepolia'); gen(); await a.settle(); const ps = a.ev('pendingSource');
    eq([cont.style.display, cont.querySelector('.hc-name').textContent, cont.querySelector('.hc-actions [data-go]:first-child').dataset.go, cont.querySelector('.hc-actions [data-go]:first-child').textContent], ['flex', ps.name + '.sol', to, 'Continue'], `${label}: the card names the file and Continue goes to ${to}`);
    ok(cont.querySelector('.mat-badge') && /Ethereum Sepolia/.test(cont.textContent) && /Single network/.test(cont.textContent) && /constructor argument|No constructor arguments/.test(cont.textContent), `${label}: maturity, network, mode and constructor information are shown`);
  }
  a.ev("setMultichainMode('portable')"); a.GEN.crosschain(); await a.settle(); eq([a.ev('pendingSource.template'), cont.querySelector('.hc-actions [data-go]').dataset.go], ['bridge', 'crosschain'], 'the V2 bridge also continues in the Crosschain builder'); a.ev("setMultichainMode('single')");
  eq(JSON.parse(a.ev("JSON.stringify(['ai', 'imported', 'zzz', ''].map(uiBuilderFor))")), ['nlai', 'deploy', 'deploy', 'deploy'], 'AI contracts continue in the AI tab; imported or unknown ones at the deploy page');
  eq([...cont.querySelectorAll('.hc-actions [data-go]')].map((b) => b.textContent + ':' + b.dataset.go), ['Continue:crosschain', 'Audit:auditor', 'Review & Deploy:deploy'], 'actions: Continue, Audit, Review & Deploy');
  await a.go('home'); cont.querySelector('[data-go="auditor"]').click(); await a.settle(); eq(a.shown(), ['auditor'], 'Audit opens the auditor');
  await a.go('home'); cont.querySelector('[data-go="deploy"]').click(); await a.settle(); eq(a.shown(), ['deploy'], 'Review & Deploy opens the deploy page');
  await a.net('arcMain'); a.GEN.vault(); await a.settle(); ok(!!cont.querySelector('.md-live') && /Arc Mainnet/.test(cont.textContent), 'on a mainnet the card marks the network LIVE');
  a.GEN.treasury(false); await a.settle(); ok(/DRAFT: \d+ to fix/.test(cont.querySelector('.cc-chip.draft').textContent), 'a draft is shown as a draft');
  ok(!/\b(audited|safe|ready|verified|secure)\b/i.test(cont.textContent.replace(/Audit\b/g, '')), 'the card never claims the contract is audited, safe or ready');
  a.ev("pendingSource = { name: 'Zed', code: '// x', template: 'imported' }"); a.ev('renderHome()'); eq(cont.querySelector('.hc-actions [data-go]').dataset.go, 'deploy', 'an imported contract continues at the deploy page');
  const evil = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
  a.ev(`pendingSource = { name: ${JSON.stringify(evil)}, code: '// x', template: ${JSON.stringify(evil)} }`); a.ev('renderHome()'); a.ev('renderCurrentContract()'); await a.settle();
  eq([d.querySelectorAll('#homeContinue img, #homeContinue script, #currentContract img, #currentContract script').length, a.w.__xss], [0, undefined], 'hostile names and templates are text in the card and the bar');
  eq([...d.querySelectorAll('#homeContinue *, #currentContract *')].flatMap((e) => [...e.attributes].map((x) => x.value)).filter((x) => /__xss|<img|<script/.test(x)).length, 0, 'and no attribute carries them');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 10. Home: recent deployments are the real records, with their storage indexes */
{
  const a = fresh(); const { d } = a;
  const recs = Array.from({ length: 7 }, (_, i) => ({ name: 'Rec' + i, address: '0x' + String(i + 1).padStart(40, 'a'), network: i % 2 ? 'arcMain' : 'arc', abi: [], txHash: '0x' + i, timestamp: Date.now() - i * 3600000 }));
  recs.splice(2, 0, { name: 'Broken', address: 'nope', network: 'arc' });
  a.w.localStorage.setItem(HK, JSON.stringify(recs)); a.ev('renderHome()');
  const rows = [...d.querySelectorAll('#homeRecent .home-recent-row')];
  eq([d.getElementById('homeRecentBox').style.display, rows.length], ['block', 5], 'at most five records are shown');
  eq(rows.map((r) => r.querySelector('.hr-main b').textContent), ['Rec0', 'Rec1', 'Rec2', 'Rec3', 'Rec4'], 'they are the real records, newest first, and the broken one is skipped');
  eq(rows.map((r) => Number(r.querySelector('[data-onclick^="loadHistoryIntoPlayground"]').getAttribute('data-onclick').match(/\((\d+)\)/)[1])), [0, 1, 3, 4, 5], 'the Playground buttons carry each record\'s index in storage');
  ok(rows[1].querySelector('.md-live') && !rows[0].querySelector('.md-live'), 'a mainnet record is marked LIVE');
  ok(rows.every((r) => /^0x/.test(r.querySelector('code').textContent) && r.querySelector('a.btn[href^="https://"]') !== null), 'each shows its address and an Explorer link');
  a.w.localStorage.removeItem(HK); a.ev('renderHome()'); eq(d.getElementById('homeRecentBox').style.display, 'none', 'no history: the section is hidden (nothing invented)');
}

/* 11. nothing here writes, sends or changes state by itself */
{
  const a = fresh(); const { d } = a; a.GEN.erc20(); await a.settle();
  const snap = () => JSON.stringify([a.ev('activeNetwork'), a.ev('multichainMode'), a.ev('pendingSource.code').length, a.ev('pendingCtorArgs.length'), a.ev('[...mdState.selected]')]);
  const s0 = snap(); let writes = 0; const si = a.w.Storage.prototype.setItem; a.w.Storage.prototype.setItem = function (...x) { writes++; return si.apply(this, x); };
  for (let i = 0; i < 10; i++) { await a.go(['home', 'swap', 'wizard', 'deploy', 'home'][i % 5]); a.ev('renderHome(); renderNetBanner()'); }
  d.getElementById('netChangeBtn').click(); d.getElementById('ccMenuBtn').click(); d.querySelector('#gbarMode .dm-trigger').click(); await a.settle();
  a.w.Storage.prototype.setItem = si;
  eq([snap() === s0, a.fetches.length, a.ev("typeof window.ethereum")], [true, 0, 'undefined'], 'navigating and opening the menus changes no state, sends nothing and never touches a wallet');
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
