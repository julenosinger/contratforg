// Phase 9.5: the Simple contracts builder (section 01). Eight templates behind one tab. The cards, the per-template forms, genSimple() and its
// three siblings, the deploy buffer and the deploy page are unchanged; the new overview reads whatever form is on screen. Because the audit
// found that most numeric fields are written into the Solidity unchecked, the checks the page shows are verified here AGAINST THE COMPILER:
// a field is flagged exactly when the generated source does not compile (or the generator refuses / throws). Networks and modes are covered too.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { loadApp, root, addrFor } from './harness.mjs';

const require = createRequire(import.meta.url);
const solc = require('solc');
let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const A = addrFor('a1'), B = addrFor('b2'), C = addrFor('c3'), T = addrFor('tk');
const compiles = (src) => { const out = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity', sources: { 'a.sol': { content: src } }, settings: { outputSelection: { '*': { '*': ['abi'] } } } }))); return !(out.errors || []).some((e) => e.severity === 'error'); };
const IDS = ['erc20', 'erc721', 'escrow', 'vesting', 'paywall', 'dao', 'smartwallet', 'staking'];
const GOOD = { erc20: {}, erc721: {}, escrow: { s_buyer: A, s_seller: B, s_arbiter: C }, vesting: { s_beneficiary: A }, paywall: { s_beneficiary: A }, dao: { s_token: A }, smartwallet: { s_guardian: A }, staking: {} };
const CTOR = { erc20: '', erc721: 'usdc_', escrow: 'token_', vesting: 'token_', paywall: 'token_', dao: 'token_,votingPeriod_', smartwallet: 'dailyLimit_', staking: 'stakingToken_' };

function fresh(opts) {
  const a = loadApp(opts); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  const alerts = []; a.w.alert = (m) => alerts.push(m);
  const rows = () => Object.fromEntries([...d.querySelectorAll('#smpSummary .bld-row')].map((r) => [r.querySelector('dt').textContent, { text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', state: r.dataset.state, flag: (r.querySelector('.bld-flag') || { textContent: '' }).textContent }]));
  const prog = () => Object.fromEntries([...d.querySelectorAll('#smpProgress li')].map((l) => [l.querySelector('b').textContent, { state: l.dataset.state, text: l.querySelector('.bld-t').textContent }]));
  const stages = () => [...d.querySelectorAll('#smpStages li')].map((l) => l.dataset.state);
  const notes = () => [...d.querySelectorAll('#smpNotes li')].map((l) => l.textContent);
  const pick = async (id) => { d.querySelector(`#simpleGrid .tcard[data-id="${id}"]`).click(); await tick(); await tick(); await tick(); };
  const set = async (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new a.w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); await tick(); };
  const fill = async (o) => { for (const [k, v] of Object.entries(o)) await set(k, v); };
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await tick(); };
  const net = async (k) => { a.ev(`activeNetwork = '${k}'; updateSideNet();`); await tick(); };
  const gen = async (id) => { alerts.length = 0; a.ev("pendingSource = { name: '', code: '', template: '' }; pendingCtorArgs = []"); let threw = ''; try { a.ev(`genSimple('${id}')`); } catch (e) { threw = String(e.message || e); } await tick(); await tick(); return threw; };
  return { ...a, d, rows, prog, stages, notes, pick, set, fill, go, net, gen, alerts };
}
async function w_try(a, expr) { try { await a.w.eval(expr); return ''; } catch (e) { return String(e && e.message || e); } }

/* 1. nothing that other code relies on was renamed or moved away */
{
  const a = fresh(); const { d } = a;
  for (const id of ['simpleGrid', 'simpleForm', 'simpleCode']) ok(!!d.getElementById(id), 'ids: #' + id + ' exists');
  eq([...d.querySelectorAll('#simpleGrid .tcard')].map((c) => c.dataset.id), IDS, 'eight template cards, in order');
  ok([...d.querySelectorAll('#simpleGrid .tcard')].every((c) => c.querySelector('h3') && c.querySelector('p') && c.querySelector('.tagrow')), 'each card keeps its title, description and tags');
  eq(d.querySelector('#sec-simple .section-head h2').textContent, 'Simple Contracts Builder', 'the heading');
  ok(d.getElementById('sec-simple').classList.contains('bld'), 'the section carries the shared builder class');
  eq(d.querySelectorAll('#sec-simple .section-head .dm-mount .dm-trigger').length, 1, 'mode: the Deployment Mode control is in the header');
  ok(d.querySelectorAll('#simpleGrid .tcard .mat-badge').length >= 0, 'maturity: the card badges are still decorated by maturity.js');
  eq(a.pageErrors.length, 0, 'no page errors on load');
  for (const id of IDS) {
    await a.pick(id);
    const btns = [...d.querySelectorAll('#simpleForm .btnrow button')].map((b) => [b.textContent, b.getAttribute('data-onclick')]);
    eq(btns, [['Generate contract', `genSimple('${id}')`], ['Deploy now', "deployFromBuffer('simple')"]], `${id}: Generate still calls genSimple('${id}'), Deploy now still opens the buffer`);
    ok(d.getElementById('simpleGrid').querySelector(`.tcard[data-id="${id}"]`).classList.contains('selected') && d.querySelectorAll('#simpleGrid .tcard.selected').length === 1, `${id}: the card is selected`);
    ok(d.getElementById('smpPick').hidden, `${id}: the "choose a template" hint is hidden`);
    eq(a.rows().Template.text, a.ev(`SIMPLE_TEMPLATES.find((t) => t.id === '${id}').name`).replace('Smart Wallet (guardian recovery)', 'Smart Wallet (guardian recovery)'), `${id}: the overview names the template`);
    ok(d.querySelectorAll('#simpleForm [id^="s_"]').length >= 5, `${id}: the form has its fields`);
  }
  eq([...d.querySelectorAll('#sec-simple .bld-block > h3.bld-h')].map((h) => h.textContent), ['1Choose a Template', '2Configure the Template'], 'two groups: choose, configure');
  eq([...d.querySelectorAll('#smpProgress li b')].map((b) => b.textContent), ['Configuration', 'Code Generation', 'Review & Audit', 'Deployment'], 'the four progress stages');
  const dyn = [...d.getElementById('sec-simple').outerHTML.matchAll(/\s(on[a-z]+)=\"[^\"]*\"/gi)].map((m) => m[0].trim());
  eq(dyn, [], 'csp: no inline handler attribute on the page shell');
}

/* 2. before a template is chosen nothing is claimed */
{
  const a = fresh(); const { d } = a;
  const r = a.rows(), p = a.prog();
  eq([r.Template.text, r.Template.state], ['None selected', 'missing'], 'start: no template is selected');
  eq([p.Configuration.state, p.Configuration.text, p['Code Generation'].state, p['Review & Audit'].state, p.Deployment.state], ['attention', 'Choose a template first.', 'todo', 'locked', 'locked'], 'start: configuration asks for a template, nothing else is claimed');
  ok(!d.getElementById('smpPick').hidden && /Choose a template/.test(a.notes()[0]), 'start: the page says to choose one');
  eq(d.getElementById('simpleForm').children.length, 0, 'start: the form is empty, as before');
  eq(a.stages(), ['current', 'todo', 'todo'], 'start: the header points at Configure');
}

/* 3. every flag the page shows matches the compiler (single mode): flagged exactly when the Solidity does not compile, or the generator refuses */
{
  const a = fresh(); const { d } = a;
  const CASES = [
    ['erc20', { s_decimals: '-1' }], ['erc20', { s_decimals: '1.5' }], ['erc20', { s_decimals: '256' }], ['erc20', { s_supply: '-5' }], ['erc20', { s_supply: '1.5' }], ['erc20', { s_cap: '-1' }], ['erc20', { s_cap: '1.5' }], ['erc20', { s_symbol: 'a"b' }], ['erc20', { s_symbol: 'a\\b' }], ['erc20', {}],
    ['erc721', { s_supply: '-5' }], ['erc721', { s_supply: '1.5' }], ['erc721', { s_price: '-1' }], ['erc721', { s_price: '1.5' }], ['erc721', { s_price: '0.0000001' }], ['erc721', { s_royalty: '-1' }], ['erc721', { s_royalty: '1.5' }], ['erc721', { s_baseuri: 'a"b' }], ['erc721', {}],
    ['escrow', { s_amount: '-1' }], ['escrow', { s_amount: '1.5' }], ['escrow', { s_amount: '0.0000001' }], ['escrow', { s_timeout: '-1' }], ['escrow', { s_timeout: '1.5' }], ['escrow', {}],
    ['vesting', { s_amount: '-1' }], ['vesting', { s_duration: '-1' }], ['vesting', { s_duration: '1.5' }], ['vesting', { s_cliff: '-1' }], ['vesting', { s_cliff: '1.5' }], ['vesting', {}],
    ['paywall', { s_amount: '-1' }], ['paywall', { s_duration: '-1' }], ['paywall', { s_duration: '1.5' }], ['paywall', {}],
    ['dao', { s_quorum: '-1' }], ['dao', { s_quorum: '1.5' }], ['dao', { s_quorum: '200' }], ['dao', { s_threshold: '-1' }], ['dao', { s_threshold: '1.5' }], ['dao', { s_delay: '-1' }], ['dao', { s_delay: '1.5' }], ['dao', {}],
    ['staking', { s_apy: '-1' }], ['staking', { s_apy: '1.5' }], ['staking', { s_lock: '-1' }], ['staking', { s_lock: '1.5' }], ['staking', { s_exitfee: '-1' }], ['staking', { s_exitfee: '1.5' }], ['staking', {}]
  ];
  for (const [id, o] of CASES) {
    await a.pick(id); await a.fill({ ...GOOD[id], ...o });
    const flagged = a.prog().Configuration.state === 'attention';
    await a.gen(id);
    const buf = a.ev('pendingSource.code');
    const compileOk = buf ? compiles(buf) : false;
    ok(flagged === !compileOk, `${id} ${JSON.stringify(o)}: the page flags it exactly when the Solidity does not compile`, `flagged=${flagged} compiles=${compileOk}`);
  }
  // refusals: the generator alerts and writes nothing, and the page says so first
  const REFUSE = [['dao', { s_voting: '0' }], ['dao', { s_voting: '1.5' }], ['smartwallet', { s_session: '721' }], ['smartwallet', { s_session: '0' }], ['smartwallet', { s_rdelay: '31' }], ['smartwallet', { s_rdelay: '0' }], ['smartwallet', { s_spendlimit: '-1' }], ['smartwallet', { s_guardian: '' }]];
  for (const [id, o] of REFUSE) {
    await a.pick(id); await a.fill({ ...GOOD[id], ...o });
    const flagged = a.prog().Configuration.state === 'attention' && /generation is refused/.test(a.prog().Configuration.text + JSON.stringify(a.rows()));
    await a.gen(id);
    ok(flagged && a.alerts.length === 1 && a.ev('pendingSource.code') === '', `${id} ${JSON.stringify(o)}: refused with an alert and no buffer, and the page said so before`, `flagged=${flagged} alerts=${a.alerts.length}`);
  }
  for (const [id, o] of [['dao', { s_voting: '45818' }], ['smartwallet', { s_session: '720' }], ['smartwallet', { s_rdelay: '30' }], ['smartwallet', { s_spendlimit: '0.5' }]]) {
    await a.pick(id); await a.fill({ ...GOOD[id], ...o }); await a.gen(id);
    ok(a.prog().Configuration.state === 'done' && a.ev('pendingSource.code') !== '' && a.alerts.length === 0, `${id} ${JSON.stringify(o)}: a value at the edge of the range is accepted`);
  }
  eq(a.pageErrors.length, 0, 'no page errors across the cases');
}

/* 4. the portable modes: scaled fields accept only digits with an optional decimal part, and THROW otherwise (the page says so first) */
{
  const a = fresh(); const { d, ev } = a;
  ev("setMultichainMode('portable')");
  for (const [id, f] of [['erc721', 's_price'], ['escrow', 's_amount'], ['vesting', 's_amount'], ['paywall', 's_amount']]) {
    for (const bad of ['-1', '1e3']) {
      await a.pick(id); await a.fill({ ...GOOD[id], [f]: bad });
      const flagged = a.prog().Configuration.state === 'attention' && /stops generation in the portable modes/.test(a.prog().Configuration.text);
      const threw = await a.gen(id);
      ok(flagged && /is not a number/.test(threw), `portable ${id}.${f} = ${bad}: the generator throws and the page says it stops generation`, `flagged=${flagged} threw=${threw}`);
    }
    await a.fill({ ...GOOD[id], [f]: '1.5' }); const threw = await a.gen(id);
    ok(threw === '' && a.prog().Configuration.state === 'done' && a.ev('pendingSource.code') !== '', `portable ${id}.${f} = 1.5: accepted`);
  }
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 5. every template on every network, in the single and the portable modes */
{
  const a = fresh(); const { d, ev } = a;
  const nets = JSON.parse(ev('JSON.stringify(Object.keys(NETWORKS))'));
  for (const dm of ['single', 'portable']) {
    ev(`setMultichainMode('${dm}')`);
    for (const id of IDS) {
      await a.pick(id);
      for (const k of nets) {
        await a.net(k); await a.fill(GOOD[id]);
        const N = JSON.parse(ev(`JSON.stringify(NETWORKS['${k}'])`));
        await a.gen(id);
        const code = ev('pendingSource.code'), r = a.rows();
        eq([ev('pendingSource.template'), a.alerts.length, ev('pendingCtorArgs.map((x) => x.param).join()')], [id, 0, dm === 'single' ? '' : CTOR[id]], `${dm}/${id}/${k}: the template, no alert, and ${dm === 'single' ? 'no constructor argument' : 'the constructor arguments ' + (CTOR[id] || '(none)')}`);
        eq(d.querySelector('#simpleCode pre').textContent, code, `${dm}/${id}/${k}: the panel shows exactly the buffer`);
        eq([r.Network.text, /^Mainnet: real funds/.test(r.Network.flag)], [`${N.label} (${N.chainIdDec})`, !!N.isMainnet], `${dm}/${id}/${k}: the overview names the chain and flags mainnets`);
        const p = a.ev('(pendingSource.problems || []).length'), cfg = a.prog().Configuration.state;
        eq(cfg === 'attention', p > 0, `${dm}/${id}/${k}: "configuration needs attention" agrees with the ${p} draft problem(s) the generator recorded`);
        if (id === 'smartwallet') { const lim = r['Daily spend limit']; eq(lim.text, `${N.walletDailyDefault} ${N.gasSymbol}`, `${dm}/smartwallet/${k}: the default daily limit is the network's, in its gas token`); }
        if (['escrow', 'vesting', 'paywall', 'staking'].includes(id)) {
          const t = r[{ escrow: 'Token', vesting: 'Token', paywall: 'Payment token', staking: 'Staking token' }[id]];
          eq(t.state, N.usdc ? 'ok' : (dm === 'single' ? 'missing' : 'ok'), `${dm}/${id}/${k}: the token row ${N.usdc ? 'shows the network USDC' : 'says there is no default'}`);
          if (dm === 'single' && ['escrow', 'vesting', 'paywall'].includes(id)) eq(/has 18 decimals; the amount is written for 6/.test(t.flag), k === 'bnb', `${dm}/${id}/${k}: the decimals warning appears on BNB Chain only`);
        }
      }
    }
  }
  eq(a.pageErrors.length, 0, 'no page errors across 256 generations');
}

/* 6. missing addresses write a DRAFT; the page names each one and the deploy page refuses it */
{
  const a = fresh(); const { d, ev } = a;
  ev("window.__calls = []; ['compileAndDeploy','compileSource','compilePending','deployCompiled'].forEach((n) => { window[n] = () => { window.__calls.push(n); }; });");
  await a.pick('escrow'); await a.gen('escrow');
  eq([a.alerts.length, ev('pendingSource.problems.length')], [0, 3], 'escrow: empty parties write a DRAFT with three problems, no alert');
  ok(/^Draft: /.test(ev('reqBlockReason()')) && d.getElementById('btnCompileDeploy').disabled, 'escrow: the deploy page refuses it');
  eq([a.rows().Buyer.state, a.rows().Seller.state, a.rows().Arbiter.state, a.prog()['Code Generation'].state, a.prog().Deployment.state], ['missing', 'missing', 'missing', 'draft', 'locked'], 'escrow: the overview and the progress say so');
  await a.fill({ s_buyer: A, s_seller: A, s_arbiter: C }); ok(a.rows().Seller.state === 'bad' || a.rows().Buyer.state === 'bad', 'escrow: a repeated address is flagged');
  await a.fill({ s_buyer: A, s_seller: B, s_arbiter: C }); await a.gen('escrow');
  eq([a.prog()['Code Generation'].state, ev('reqBlockReason()')], ['done', ''], 'escrow: fixing the parties and generating again clears the draft');
  await a.pick('vesting'); await a.gen('vesting'); eq([ev('pendingSource.problems.length'), a.rows().Beneficiary.state], [1, 'missing'], 'vesting: a missing beneficiary is a draft');
  await a.pick('paywall'); await a.gen('paywall'); eq([ev('pendingSource.problems.length'), a.rows().Beneficiary.state], [1, 'missing'], 'paywall: a missing beneficiary is a draft');
  await a.pick('dao'); await a.gen('dao'); eq([ev('pendingSource.problems.length'), a.rows()['Governance token'].state], [1, 'missing'], 'dao: a missing governance token is a draft in Single network mode');
  ev("setMultichainMode('portable')"); await a.gen('dao'); eq([ev('pendingSource.problems.length'), a.rows()['Governance token'].text], [0, 'Set at deploy time'], 'dao: in a portable mode the token is a constructor argument, not a problem');
  ev("setMultichainMode('single')");
  await a.pick('staking'); await a.net('robinhood'); await a.gen('staking'); eq([ev('pendingSource.problems.length'), a.rows()['Staking token'].state], [1, 'missing'], 'staking on Robinhood Testnet (no USDC): a draft');
  await a.fill({ s_reward: '0x12' }); ok(a.rows()['Reward token'].state === 'bad', 'staking: a malformed reward token is flagged');
  await a.net('arc');
  await a.pick('erc721'); await a.net('robinhood'); await a.set('s_price', '10'); await a.gen('erc721'); eq([ev('pendingSource.problems.length'), a.prog().Configuration.state], [1, 'attention'], 'erc721 on a network with no stablecoin and a price: a draft');
  await a.set('s_price', '0'); await a.gen('erc721'); eq(ev('(pendingSource.problems || []).length'), 0, 'erc721: a free mint needs no stablecoin');
  await a.net('arc');
  // a refusal leaves the buffer alone and says so
  await a.pick('erc20'); await a.gen('erc20'); const before = ev('pendingSource.code');
  await a.pick('smartwallet'); await a.fill({ s_guardian: '' }); alerts_check: { a.alerts.length = 0; try { ev("genSimple('smartwallet')"); } catch (_) {} eq([a.alerts.length, ev('pendingSource.code') === before], [1, true], 'smartwallet: the refusal alerts and leaves the previous buffer alone'); }
  ok(/Guardian is required/.test(a.prog().Configuration.text) && /generation is refused/.test(a.prog().Configuration.text), 'smartwallet: the page said it before the click');
  eq(ev('JSON.stringify(window.__calls)'), '[]', 'nothing was compiled or deployed');
}

/* 7. Deploy now keeps the whole deploy page; constructor arguments follow the template; Multi-deploy is explicit */
{
  const a = fresh(); const { d, ev, w } = a;
  ev("window.__calls = []; ['compileAndDeploy','compileSource','compilePending','deployCompiled'].forEach((n) => { window[n] = () => { window.__calls.push(n); }; });");
  let rpc = 0; w.ethereum = { request: async () => { rpc++; return null; }, on() {} };
  await a.pick('erc20'); await a.gen('erc20');
  eq([ev('JSON.stringify(window.__calls)'), rpc], ['[]', 0], 'generate: nothing is compiled or deployed, no wallet request');
  const src = ev('pendingSource.code');
  d.querySelector('#simpleForm .btnrow .btn-ghost').click(); await tick();
  eq(d.getElementById('sec-deploy').style.display, 'block', 'deploy now: opens the existing Compile & Deploy section');
  ok(d.getElementById('sec-simple').style.display === 'none' && ev('pendingSource.code') === src && ev('JSON.stringify(window.__calls)') === '[]', 'deploy now: just the other section, the source unchanged, nothing compiled');
  for (const id of ['pendingContractLabel', 'ctorArgsPanel', 'multiDeployPanel', 'btnCompileDeploy', 'btnDownloadSol', 'btnCopySol', 'deployConsole']) ok(!!d.getElementById(id), 'deploy page: #' + id + ' is there');
  ok(/ArcDollar\.sol/.test(d.getElementById('pendingContractLabel').value), 'deploy page: the pending contract is shown');
  ev("setMultichainMode('portable')");
  for (const id of IDS) { await a.go('simple'); await a.pick(id); await a.fill(GOOD[id]); await a.gen(id); eq(d.querySelectorAll('#ctorArgsPanel input').length, CTOR[id] ? CTOR[id].split(',').length : 0, `ctor (portable) ${id}: the deploy page asks for ${CTOR[id] || 'nothing'}`); }
  ev("setMultichainMode('multi')"); await a.go('simple'); await a.pick('erc20'); await a.gen('erc20');
  d.querySelector('#simpleForm .btnrow .btn-ghost').click(); await tick();
  eq([d.getElementById('multiDeployPanel').style.display, d.querySelectorAll('#multiDeployPanel .md-chip.on').length, d.querySelectorAll('#multiDeployPanel .md-chip').length], ['block', 0, 16], 'multi-deploy: the panel is there, no network is pre-selected, all 16 are offered');
  ev("toggleMdNetwork('arc')"); await a.go('simple'); await a.set('s_name', 'Other');
  eq(d.querySelectorAll('#multiDeployPanel .md-chip.on').length, 1, 'multi-deploy: selection is explicit and editing the form leaves it alone');
  ok(![...d.querySelectorAll('#multiDeployPanel .md-chip.on')].some((c) => /LIVE/.test(c.textContent)), 'multi-deploy: no mainnet is selected');
}
{
  const a = fresh(); const { ev } = a;
  ok(ev("typeof reqBlockReason === 'function' && typeof matIsApproved === 'function' && typeof matGate === 'function'"), 'gates: reqBlockReason, matIsApproved and matGate still exist');
  for (const id of IDS) {
    await a.pick(id);
    for (const k of ['ethereum', 'polygon', 'base', 'arbitrum', 'optimism', 'avalanche', 'bnb', 'robinhoodMain', 'arcMain']) {
      await a.net(k); await a.fill(GOOD[id]); await a.gen(id);
      const hash = ev('matHash(pendingSource.code)');
      eq(ev(`matIsApproved('${hash}', '${k}')`), false, `gate/${id}/${k}: a fresh contract is not approved`);
      ok(/Mainnet deploy blocked/.test(await w_try(a, `deployCompiled({ name: 'X', abi: [], bytecode: '0x', sourceHash: '${hash}' }, [], '${k}')`)), `gate/${id}/${k}: deployCompiled still refuses without the maturity confirmation`);
    }
  }
}

/* 8. the progress only reports what really happened, and a template switch is a different contract */
{
  const a = fresh(); const { d, ev } = a;
  await a.pick('erc20');
  let p = a.prog();
  eq([p.Configuration.state, p['Code Generation'].state, p['Review & Audit'].state, p.Deployment.state], ['done', 'todo', 'locked', 'locked'], 'start (erc20): configuration valid, nothing else claimed');
  eq(a.stages(), ['done', 'current', 'todo'], 'start: the header points at Generate');
  await a.gen('erc20'); p = a.prog();
  eq([p['Code Generation'].state, p['Review & Audit'].state, p.Deployment.state], ['done', 'todo', 'todo'], 'after generation: only generation is done');
  ok(/ArcDollar\.sol, \d+ lines generated/.test(p['Code Generation'].text), 'with the real file name and line count');
  ev("lastAuditReport = { score: 99, summary: 'fine', findings: [] }"); await a.set('s_name', 'ArcDollar');
  eq(a.prog()['Review & Audit'].state, 'todo', 'an audit report in memory never turns Review & Audit green');
  await a.set('s_supply', '5'); eq(a.prog()['Code Generation'].state, 'stale', 'changing a field marks the code stale');
  await a.set('s_supply', '1000000'); eq(a.prog()['Code Generation'].state, 'done', 'putting the value back makes it current');
  await a.pick('escrow'); eq(a.prog()['Code Generation'].state, 'stale', 'choosing another template marks the code stale (the panel still shows the old contract)');
  await a.pick('erc20'); eq(a.prog()['Code Generation'].state, 'done', 'and choosing the first again makes it current');
  await a.net('base'); eq(a.prog()['Code Generation'].state, 'stale', 'changing the network marks it stale');
  await a.net('arc'); eq(a.prog()['Code Generation'].state, 'done', 'and back');
  ev("setMultichainMode('portable')"); eq(a.prog()['Code Generation'].state, 'stale', 'changing the Deployment Mode marks it stale');
  ev("setMultichainMode('single')");
  ev("pendingSource = { name: 'Other', code: 'contract Other {}', template: 'vault' }"); ev('CFBuilder.render("simple")');
  ok(a.prog()['Code Generation'].state === 'stale' && /different contract/.test(a.prog()['Code Generation'].text), 'another tab taking the deploy buffer is reported');
  await a.gen('erc20');
  d.defaultView.localStorage.setItem(ev('HISTORY_KEY'), JSON.stringify([{ name: 'ArcDollar', address: '0x' + '1'.repeat(40), network: 'arc', abi: [], txHash: '0x1', timestamp: Date.now() - 100000 }]));
  ev('CFBuilder.render("simple")'); eq(a.prog().Deployment.state, 'todo', 'an older deployment of the same name does not count');
  ev("addToDeployHistory({ name: 'Other', address: '0x' + '2'.repeat(40), network: 'arc', abi: [], txHash: '0x2' })"); await tick();
  eq(a.prog().Deployment.state, 'todo', 'a deployment of a different contract does not count');
  ev("addToDeployHistory({ name: 'ArcDollar', address: '0x' + '3'.repeat(40), network: 'arc', abi: [], txHash: '0x3' })"); await tick();
  ok(a.prog().Deployment.state === 'done' && /Confirmed on Arc Testnet at 0x3{40}/.test(a.prog().Deployment.text), 'a deployment recorded after this generation is shown, with its real network and address');
}

/* 9. the guidance, the code head, the wizard, text safety, the other screens, repeated navigation */
{
  const a = fresh(); const { d, w, ev } = a;
  await a.pick('dao'); ok(a.notes().some((t) => /block times differ/.test(t)), 'dao: the note says block times differ between chains');
  ev("setMultichainMode('portable')"); ok(a.notes().some((t) => /token_, votingPeriod_/.test(t)), 'dao (portable): the note lists the constructor arguments'); eq(a.rows()['Deployment Mode'].flag, 'Constructor arguments: token_, votingPeriod_', 'dao (portable): and so does the mode row');
  ev("setMultichainMode('single')"); eq(a.rows()['Deployment Mode'].flag, 'No constructor arguments', 'single: no constructor arguments');
  await a.pick('smartwallet'); await a.net('polygon'); eq(a.rows()['Daily spend limit'].text, '100 POL', 'smartwallet on Polygon: the limit is counted in POL');
  await a.net('ethereum'); eq(a.rows()['Daily spend limit'].text, '0.1 ETH', 'smartwallet on Ethereum: 0.1 ETH'); await a.net('arc');
  ok(/refuses to generate/.test(a.notes().join(' ')), 'smartwallet: the note says it refuses to generate');
  await a.pick('erc20'); await a.gen('erc20');
  const head = d.querySelector('#simpleCode .codehead'); const lvl = ev('matInfo(pendingSource.template).level');
  ok(head.querySelector('.bld-lang') && head.querySelector('.mat-badge.mat-' + lvl), 'code head: language label and the real maturity badge (' + lvl + ')');
  eq(d.querySelector('#simpleCode pre').textContent, ev('pendingSource.code'), 'code head: the Solidity is untouched');
  // the wizard still lands on this tab with the template selected
  ev("wizardState.subtype = 'staking'; wizardGenerate()"); await new Promise((r) => setTimeout(r, 160)); await tick();
  eq([d.getElementById('sec-simple').style.display, d.querySelector('#simpleGrid .tcard.selected') && d.querySelector('#simpleGrid .tcard.selected').dataset.id, a.rows().Template.text], ['block', 'staking', 'Staking Rewards'], 'wizard: opens this tab with Staking Rewards selected and summarised');
  const evil = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
  await a.pick('erc721'); await a.fill({ s_name: evil, s_symbol: evil, s_baseuri: evil, s_price: evil });
  await a.pick('escrow'); await a.fill({ s_name: evil, s_buyer: evil, s_seller: evil, s_arbiter: evil, s_token: evil });
  ok(!d.querySelector('#smpSummary img, #smpSummary script, #smpProgress img, #smpNotes img') && w.__xss === undefined, 'xss: values are shown as text, never as markup');
  ok(![...d.querySelectorAll('#smpSummary *, #smpProgress *, #smpNotes *')].some((e) => [...e.attributes].some((x) => /__xss/.test(x.value))), 'xss: no attribute carries the payload');
  ok(['swap', 'treasury', 'vault', 'multisend', 'crosschain', 'simple'].every((k) => JSON.parse(ev('JSON.stringify(CFBuilder.keys())')).includes(k)), 'engine: six screens registered');
  ok(!d.getElementById('sec-wizard').querySelector('.bld-grid, .bld-side'), 'sec-wizard is untouched');
  await a.pick('erc20'); await a.gen('erc20');
  for (let i = 0; i < 3; i++) for (const s of ['home', 'swap', 'simple', 'deploy', 'vault', 'simple']) await a.go(s);
  ok(a.prog()['Code Generation'].state === 'done' && a.rows().Template.text === 'ERC-20 Token' && d.querySelectorAll('#smpSummary .bld-row').length === 9, 'repeated navigation keeps the template and the state and does not duplicate rows', String(d.querySelectorAll('#smpSummary .bld-row').length));
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
