// Phase 9.1: the Treasury builder (section 03). The page is reorganised; genTreasury(), the deploy buffer and the deploy page are not.
// These tests prove the generator still behaves as the Phase 9.0 audit recorded (draft instead of refusal, "Accepted tokens" unused,
// mode-dependent constructor), Deploy now still opens the same Compile & Deploy section, the overview reads the real form, and the
// progress never reports a result that did not happen.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, fillAddresses, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const S = (n) => Array.from({ length: n }, (_, i) => addrFor('sg' + i));

function fresh(opts) {
  const a = loadApp(opts); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  const set = (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new a.w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
  const rows = () => Object.fromEntries([...d.querySelectorAll('#treSummary .bld-row')].map((r) => [r.querySelector('dt').textContent, { text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', state: r.dataset.state, flag: (r.querySelector('.bld-flag') || { textContent: '' }).textContent }]));
  const prog = () => Object.fromEntries([...d.querySelectorAll('#treProgress li')].map((l) => [l.querySelector('b').textContent, { state: l.dataset.state, text: l.querySelector('.bld-t').textContent }]));
  const stages = () => [...d.querySelectorAll('#treStages li')].map((l) => l.dataset.state);
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await tick(); };
  const gen = async () => { a.ev('genTreasury()'); await tick(); await tick(); };
  a.w.alert = () => {};
  return { ...a, d, set, rows, prog, stages, go, gen };
}
async function w_try(a, expr) { try { await a.w.eval(expr); return ''; } catch (e) { return String(e && e.message || e); } }

/* 1. nothing that other code relies on was renamed or moved away */
{
  const a = fresh(); const { d } = a;
  for (const id of ['tre_name', 'tre_threshold', 'tre_signers', 'tre_streaming', 'tre_tokens', 'treasuryCode']) ok(!!d.getElementById(id), 'ids: #' + id + ' exists');
  eq([d.getElementById('tre_name').value, d.getElementById('tre_threshold').value, d.getElementById('tre_signers').value, d.getElementById('tre_streaming').value, d.getElementById('tre_tokens').value], ['ArcTreasury', '2', '', 'yes', 'USDC, EURC'], 'defaults are unchanged');
  eq([d.getElementById('tre_threshold').type, d.getElementById('tre_threshold').getAttribute('min')], ['number', '1'], 'the threshold is still a number field with min 1');
  eq(d.getElementById('tre_signers').getAttribute('aria-required'), 'true', 'the signers field is still marked required');
  eq([...d.getElementById('tre_streaming').options].map((o) => [o.value, o.textContent]), [['yes', 'Yes — linear vesting/streams (Sablier-style)'], ['no', 'No — vault multisig only']], 'streaming: both options, same values and text');
  eq([...d.querySelectorAll('#sec-treasury .btnrow button')].map((b) => [b.textContent, b.getAttribute('data-onclick')]), [['Generate contract', 'genTreasury()'], ['Deploy now', "deployFromBuffer('treasury')"]], 'buttons: Generate still calls genTreasury(), Deploy now still opens the buffer');
  ok(d.querySelector('#sec-treasury details.adv') && ['tre_streaming', 'tre_tokens'].every((id) => d.querySelector('#sec-treasury details.adv #' + id)), 'advanced: the advanced block holds streaming and accepted tokens, as before');
  eq(d.querySelectorAll('#sec-treasury details.adv').length, 1, 'advanced: and the page script did not add a second one');
  ok(['tre_name', 'tre_signers', 'tre_threshold', 'tre_streaming', 'tre_tokens'].every((id) => d.querySelector(`label[for="${id}"]`)), 'a11y: every control has a label');
  ok(d.querySelector('#sec-treasury .field label[for="tre_signers"]') && d.querySelector('#sec-treasury .field #tre_signers'), 'the required-field marker still finds the signers label inside its .field');
  eq(d.querySelectorAll('#sec-treasury .section-head .dm-mount .dm-trigger').length, 1, 'mode: the Deployment Mode control is in the header');
  ok(d.querySelector('#sec-treasury .section-head .mat-slot .mat-badge'), 'maturity: the existing badge is still next to the title');
  eq(d.querySelector('#sec-treasury .section-head h2').textContent, 'Treasury Builder', 'the heading');
  ok(d.getElementById('sec-treasury').classList.contains('bld'), 'the section carries the shared builder class that scopes its styles');
  eq([...d.getElementById('sec-treasury').outerHTML.matchAll(/\s(on[a-z]+|style)="[^"]*"/gi)].map((m) => m[0].trim()), ['style="display:none;"', 'style="display:none;"'], 'csp: only the two display:none the page script toggles; no inline handlers');
  eq(a.pageErrors.length, 0, 'no page errors on load');
}

/* 2. layout and styles are scoped */
{
  const a = fresh(); const { d } = a;
  eq([...d.querySelectorAll('#sec-treasury .bld-block h3')].map((h) => h.textContent), ['1Treasury Identity', '2Signers & Approval', '3Treasury Features'], 'the three configuration groups, in order');
  ok(d.querySelector('#sec-treasury .bld-main') && d.querySelector('#sec-treasury .bld-side'), 'two columns: configuration and overview');
  eq([...d.querySelectorAll('#treStages li')].map((l) => l.textContent), ['1Configure', '2Generate', '3Review & Deploy'], 'the three header steps');
  eq([...d.querySelectorAll('#treProgress li b')].map((b) => b.textContent), ['Configuration', 'Code Generation', 'Review & Audit', 'Deployment'], 'the four progress stages');
  const start = css.indexOf('/* ---- Builder screens that share the engine'), end = css.indexOf('/* ---- Swap / AMM builder');
  const block = css.slice(start, end);
  const sels = []; block.replace(/\/\*[\s\S]*?\*\//g, '').replace(/:is\([^)]*\)/g, ':is()').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, sel) => { sels.push(...sel.split(',').map((s) => s.trim())); return ''; });
  eq(sels.filter((s) => s && !s.startsWith('@') && !/^(\.light\s+)?\.bld(?![\w-])/.test(s)), [], 'css: every shared rule is scoped to .bld');
  ok(/grid-template-columns:minmax\(0,7fr\) minmax\(0,3fr\)/.test(block), 'css: 70/30 columns');
  ok(block.slice(block.indexOf('@media (max-width:860px)')).includes('.bld .bld-grid{grid-template-columns:minmax(0,1fr);}'), 'css: one column on narrow screens');
  eq(a.w.getComputedStyle(d.querySelector('#sec-treasury .bld-grid')).display, 'grid', 'computed: the grid is a grid');
  ok(/\.bld \.codepanel pre\{[^}]*overflow:auto/.test(block), 'code: the code scrolls on its own');
  // the swap rules were not touched
  ok(css.includes('#sec-swap .swb{display:grid;grid-template-columns:minmax(0,7fr) minmax(0,3fr)'), 'swap: its own rules are still there');
  ok(!/#sec-treasury/.test(block), 'css: nothing is keyed to a single section id');
}

/* 3. the generator is untouched: same Solidity, same buffer, same particularities */
{
  const a = fresh(); const { d, ev } = a;
  const sg = S(3).join('\n');
  a.set('tre_signers', sg); a.set('tre_threshold', '2');
  await a.gen();
  const code1 = ev('pendingSource.code');
  eq([ev('pendingSource.template'), ev('pendingSource.name'), ev('pendingSource.problems.length')], ['treasury', 'ArcTreasury', 0], 'generate: template, name and an empty problem list');
  eq(d.querySelector('#treasuryCode pre').textContent, code1, 'generate: the code panel shows exactly the buffer');
  ok(/ArcTreasury\.sol/.test(d.querySelector('#treasuryCode .filename').textContent) && /\d+ lines/.test(d.querySelector('#treasuryCode .codehead').textContent), 'generate: file name and real line count');
  ok(/Stream/.test(code1) && /threshold = 2;/.test(code1), 'generate: streaming and the threshold are in the Solidity');
  await a.gen(); eq(ev('pendingSource.code'), code1, 'generate: the same inputs give the same Solidity');
  a.set('tre_tokens', 'DAI, WETH, FOO'); await a.gen();
  eq(ev('pendingSource.code'), code1, 'audit fact: "Accepted tokens" changes nothing in the Solidity');
  a.set('tre_streaming', 'no'); await a.gen();
  ok(ev('pendingSource.code') !== code1 && /enum Kind \{ Transfer, ReplaceSigner \}/.test(ev('pendingSource.code')) && /enum Kind \{ Transfer, Stream, CloseStream, ReplaceSigner \}/.test(code1), 'streaming off: a different contract without the Stream kinds');
  ok(ev('pendingSource.code').split('\n').length < code1.split('\n').length, 'streaming off: fewer lines');
  ok(/^\/\/ ContractForge v.* maturity: /m.test(ev('pendingSource.code')), 'the maturity stamp is still written by matStamp');
  eq(ev("matInfo(pendingSource.template).level"), ev("matInfo('treasury').level"), 'maturity comes from maturity.js');
  eq(a.pageErrors.length, 0, 'no page errors while generating');
}

/* 4. a bad form writes a DRAFT, never a refusal, and the page says so */
{
  const a = fresh(); const { d, ev } = a;
  ev("window.__calls = []; ['compileAndDeploy','compileSource','compilePending','deployCompiled'].forEach((n) => { window[n] = () => { window.__calls.push(n); }; });");
  let alerts = 0; a.w.alert = () => { alerts++; };
  await a.gen();
  eq(alerts, 0, 'draft: an empty signers list does not raise an alert');
  eq(ev('pendingSource.problems.join("|")'), 'Signers are required: enter one address per line', 'draft: the generator recorded its own problem');
  ok(/^Draft: /.test(ev('reqBlockReason()')) && d.getElementById('btnCompileDeploy').disabled, 'draft: the deploy page blocks it');
  const p = a.prog();
  eq([p['Code Generation'].state, p['Deployment'].state], ['draft', 'locked'], 'progress: generation is a draft, deployment is locked');
  ok(/DRAFT/.test(p['Code Generation'].text) && /Blocked until the draft is fixed: Signers are required/.test(p['Deployment'].text), 'progress: and says why', JSON.stringify(p));
  eq(a.stages(), ['current', 'done', 'todo'], 'header: configure needs attention, generate is done, Review & Deploy is not offered for a draft');
  eq(ev('JSON.stringify(window.__calls)'), '[]', 'draft: nothing was compiled or deployed');
  a.set('tre_signers', S(3).join('\n')); await a.gen();
  eq([a.prog()['Code Generation'].state, a.prog()['Deployment'].state, ev('reqBlockReason()')], ['done', 'todo', ''], 'fixing the form and generating again clears the draft');
  ok(!d.getElementById('btnCompileDeploy').disabled, 'and the deploy page accepts it');
}

/* 5. Deploy now keeps the whole deploy page; constructor and Multi-deploy follow the generated ABI */
{
  const a = fresh(); const { d, ev, w } = a;
  ev("window.__calls = []; ['compileAndDeploy','compileSource','compilePending','deployCompiled'].forEach((n) => { window[n] = () => { window.__calls.push(n); }; });");
  let rpc = 0; w.ethereum = { request: async () => { rpc++; return null; }, on() {} };
  a.set('tre_signers', S(3).join('\n')); await a.gen();
  eq([ev('JSON.stringify(window.__calls)'), rpc], ['[]', 0], 'generate: nothing is compiled or deployed, no wallet request');
  const src = ev('pendingSource.code');
  d.querySelector('#sec-treasury .btnrow .btn-ghost').click(); await tick();
  eq(d.getElementById('sec-deploy').style.display, 'block', 'deploy now: opens the existing Compile & Deploy section');
  ok(d.getElementById('sec-treasury').style.display === 'none' && !d.body.classList.contains('ai-workspace'), 'deploy now: no modal or extra flow, just the other section');
  eq([ev('JSON.stringify(window.__calls)'), ev('pendingSource.code') === src], ['[]', true], 'deploy now: nothing compiled, the source is unchanged');
  for (const id of ['pendingContractLabel', 'ctorArgsPanel', 'multiDeployPanel', 'btnCompileDeploy', 'btnDownloadSol', 'btnCopySol', 'deployConsole']) ok(!!d.getElementById(id), 'deploy page: #' + id + ' is there');
  ok(/ArcTreasury\.sol/.test(d.getElementById('pendingContractLabel').value), 'deploy page: the pending contract is shown');
  // constructor: none in single mode, the gas-token alias in the portable modes
  eq(d.querySelectorAll('#ctorArgsPanel input').length, 0, 'ctor: single mode needs none');
  ev("setMultichainMode('portable')"); await a.gen();
  eq(ev('pendingCtorArgs.map((x) => x.param).join()'), 'gasTokenAlias_', 'ctor: portable mode asks for the gas-token alias');
  eq(d.querySelectorAll('#ctorArgsPanel input').length, 1, 'ctor: the deploy page shows the input');
  eq(d.querySelector('#ctorArgsPanel input').value, ev('NETWORKS.arc.usdc'), 'ctor: with the Arc default');
  ev("setMultichainMode('multi')"); await a.gen();
  d.querySelector('#sec-treasury .btnrow .btn-ghost').click(); await tick();
  eq(d.getElementById('multiDeployPanel').style.display, 'block', 'multi-deploy: the panel is there in multi mode');
  eq(d.querySelectorAll('#multiDeployPanel .md-chip.on').length, 0, 'multi-deploy: no network is pre-selected');
  ev("toggleMdNetwork('arc')"); a.set('tre_threshold', '3');
  eq(d.querySelectorAll('#multiDeployPanel .md-chip.on').length, 1, 'multi-deploy: selection is explicit and editing the form leaves it alone');
  ok(![...d.querySelectorAll('#multiDeployPanel .md-chip.on')].some((c) => /LIVE/.test(c.textContent)), 'multi-deploy: no mainnet is selected');
}

/* 6. security gates are the existing ones */
{
  const a = fresh(); const { ev } = a;
  ev("activeNetwork = 'arcMain'; updateSideNet();"); a.set('tre_signers', S(3).join('\n')); await a.gen();
  ok(ev("typeof reqBlockReason === 'function' && typeof matIsApproved === 'function' && typeof matGate === 'function'"), 'gates: reqBlockReason, matIsApproved and matGate still exist');
  const hash = ev('matHash(pendingSource.code)');
  eq(ev(`matIsApproved('${hash}', 'arcMain')`), false, 'gates: a fresh treasury is not approved for mainnet');
  ok(/Mainnet deploy blocked/.test(await w_try(a, `deployCompiled({ name: 'X', abi: [], bytecode: '0x', sourceHash: '${hash}' }, [], 'arcMain')`)), 'gates: deployCompiled still refuses a mainnet without the maturity confirmation');
}

/* 7. the overview reads the real form and state */
{
  const a = fresh(); const { d, ev } = a;
  let r = a.rows();
  eq([r.Project.text, r.Signers.state, r.Signers.text, r.Streaming.text, r.Network.text, r['Deployment Mode'].text], ['ArcTreasury', 'missing', 'None yet', 'Enabled', 'Arc Testnet (5042002)', 'Single network'], 'summary: starts from the real defaults');
  a.set('tre_signers', S(3).join('\n')); r = a.rows();
  eq([r.Signers.text, r.Signers.state, r.Approval.text, r.Approval.state], ['3 signers', 'ok', '2 of 3', 'ok'], 'summary: counts the signers and the approval');
  eq(d.getElementById('treOf').textContent, '2 of 3', 'the threshold chip reads 2 of 3');
  a.set('tre_threshold', '4'); r = a.rows();
  eq([r.Approval.state, r.Approval.flag], ['bad', 'Higher than the number of signers'], 'summary: a threshold above the signers is flagged');
  eq(d.getElementById('treOf').getAttribute('data-bad'), '1', 'the chip is flagged too');
  for (const bad of ['0', '1.5', '-2']) { a.set('tre_threshold', bad); ok(a.rows().Approval.state === 'bad' && /whole number of at least 1/.test(a.prog().Configuration.text), `threshold "${bad}" is flagged: the contract would not compile or deploy`, JSON.stringify(a.rows().Approval)); }
  a.set('tre_threshold', '1'); r = a.rows(); ok(r.Approval.state === 'ok' && /single signer/i.test(r.Approval.flag), 'a threshold of 1 with several signers is called out');
  a.set('tre_threshold', '2');
  a.set('tre_signers', S(2).join('\n') + '\n0x123'); r = a.rows();
  eq([r.Signers.state, r.Signers.text], ['bad', '2 of 3 valid'], 'summary: counts the valid addresses');
  ok(/Signer 3 must be an address/.test(r.Signers.flag), 'summary: and names the first problem', r.Signers.flag);
  a.set('tre_signers', S(1).join('\n') + '\n' + S(1)[0]); r = a.rows();
  ok(r.Signers.state === 'bad' && /must be different/.test(r.Signers.flag), 'summary: duplicates are flagged');
  a.set('tre_signers', S(3).join('\n'));
  a.set('tre_streaming', 'no'); r = a.rows(); eq(r.Streaming.text, 'Disabled', 'summary: streaming follows the select');
  ok(/Vault multisig only/.test(d.getElementById('treStream').textContent) && !/Stream and CloseStream/.test(d.getElementById('treStream').textContent), 'guidance: the streaming card follows the select');
  a.set('tre_streaming', 'yes'); ok(/Stream and CloseStream/.test(d.getElementById('treStream').textContent), 'guidance: and back');
  // network and mode are the app's own state
  r = a.rows(); eq([r['Gas-token alias'].text, r['Gas-token alias'].state], [ev('NETWORKS.arc.usdc'), 'ok'], 'summary: on Arc the alias is the USDC ERC-20 address');
  ok(/native currency/.test(r['Gas-token alias'].flag), 'summary: with the real consequence');
  ev("activeNetwork = 'ethereum'; updateSideNet();"); await tick(); r = a.rows();
  eq([r.Network.text, r['Gas-token alias'].text], ['Ethereum (1)', 'None'], 'summary: follows the active network (no alias where the gas token has no ERC-20 address)');
  ev("setMultichainMode('portable')"); r = a.rows();
  eq([r['Deployment Mode'].text, r['Gas-token alias'].text], ['Portable', 'Set at deploy time'], 'summary: follows the Deployment Mode, and the alias becomes a constructor argument');
  ev("setMultichainMode('single'); activeNetwork = 'arc'; updateSideNet();");
  ok(/not used by the generator/i.test(d.querySelector('#sec-treasury label[for="tre_tokens"]').parentElement.textContent), 'accepted tokens: the page says the field is not used');
  ok(!/Uniswap|AMM/.test(d.getElementById('sec-treasury').textContent), 'no wording borrowed from another tab');
  ok(!/\bgas\b.*\d+\s*(gwei|USDC)|audit score/i.test(d.getElementById('treSummary').textContent), 'no invented gas estimate or audit score');
}

/* 8. the progress only reports what really happened */
{
  const a = fresh(); const { d, ev } = a;
  a.set('tre_signers', S(3).join('\n'));
  let p = a.prog();
  eq([p.Configuration.state, p['Code Generation'].state, p['Review & Audit'].state, p.Deployment.state], ['done', 'todo', 'locked', 'locked'], 'start: configuration looks valid, nothing else claimed');
  eq(a.stages(), ['done', 'current', 'todo'], 'start: the header points at Generate');
  await a.gen(); p = a.prog();
  eq([p['Code Generation'].state, p['Review & Audit'].state, p.Deployment.state], ['done', 'todo', 'todo'], 'after generation: only generation is done');
  ok(/ArcTreasury\.sol, \d+ lines generated/.test(p['Code Generation'].text), 'with the real file name and line count');
  ev("lastAuditReport = { score: 99, summary: 'fine', findings: [] }"); ev('renderCurrentContract()'); a.set('tre_name', 'ArcTreasury');
  eq(a.prog()['Review & Audit'].state, 'todo', 'an audit report in memory never turns Review & Audit green');
  a.set('tre_threshold', '3'); p = a.prog();
  eq(p['Code Generation'].state, 'stale', 'changing the form marks the generated code as stale');
  ok(/Generate again/.test(p['Code Generation'].text), 'and says what to do');
  a.set('tre_threshold', '2'); eq(a.prog()['Code Generation'].state, 'done', 'putting the value back makes it current again');
  ev("pendingSource = { name: 'Other', code: 'contract Other {}', template: 'vault' }"); ev('CFBuilder.render("treasury")');
  ok(a.prog()['Code Generation'].state === 'stale' && /different contract/.test(a.prog()['Code Generation'].text), 'another tab taking the deploy buffer is reported');
  await a.gen();
  // deployment: a confirmed, newer, same-name history entry only
  const hk = ev('HISTORY_KEY');
  d.defaultView.localStorage.setItem(hk, JSON.stringify([{ name: 'ArcTreasury', address: '0x' + '1'.repeat(40), network: 'arc', abi: [], txHash: '0x1', timestamp: Date.now() - 100000 }]));
  ev('CFBuilder.render("treasury")'); eq(a.prog().Deployment.state, 'todo', 'an older deployment of the same name does not count');
  ev("addToDeployHistory({ name: 'ArcTreasury', address: '0x' + '3'.repeat(40), network: 'arc', abi: [], txHash: '0x3' })"); await tick();
  eq(a.prog().Deployment.state, 'done', 'a deployment recorded after this generation is shown');
  ok(/Confirmed on Arc Testnet at 0x3{40}/.test(a.prog().Deployment.text), 'with its real network and address');
}

/* 9. the code panel head, text safety, CSP */
{
  const a = fresh(); const { d, w, ev } = a;
  a.set('tre_signers', S(3).join('\n')); await a.gen();
  const head = d.querySelector('#treasuryCode .codehead');
  ok(head.querySelector('.bld-lang') && head.querySelector('.bld-lang').textContent === 'Solidity', 'code head: language label');
  const lvl = ev('matInfo("treasury").level');
  ok(head.querySelector('.mat-badge') && head.querySelector('.mat-badge').classList.contains('mat-' + lvl), 'code head: the real maturity badge (' + lvl + ')');
  eq(!!head.querySelector('.bld-warn'), lvl === 'experimental', 'code head: "Not audited" only when the template is experimental');
  eq(d.querySelector('#treasuryCode pre').textContent, ev('pendingSource.code'), 'code head: the Solidity itself is untouched');
  const evil = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
  a.set('tre_name', evil); a.set('tre_signers', evil + '\n' + S(1)[0]);
  const sec = d.getElementById('sec-treasury');
  ok(!sec.querySelector('#treSummary img, #treSummary script, #treProgress img, #treSignersNote img') && w.__xss === undefined, 'xss: the overview shows values as text, never as markup');
  ok(![...sec.querySelectorAll('#treSummary *, #treProgress *')].some((e) => [...e.attributes].some((x) => /__xss/.test(x.value))), 'xss: no attribute carries the payload');
}

/* 10. one section more on the shared engine, the others as they were */
{
  const a = fresh(); const { d, ev } = a;
  ok(['swap', 'treasury'].every((k) => JSON.parse(ev('JSON.stringify(CFBuilder.keys())')).includes(k)), 'engine: Swap and Treasury are registered');
  ok([...d.querySelectorAll('.bld')].map((s) => s.id).includes('sec-treasury'), 'the Treasury carries the shared builder class');
  for (const id of ['sec-simple', 'sec-wizard']) ok(!d.getElementById(id).querySelector('.bld-grid, .bld-side'), id + ' is untouched');
  a.set('tre_signers', S(3).join('\n')); await a.gen();
  ev("setMultichainMode('multi')"); eq(a.rows()['Deployment Mode'].text, 'Multi-deploy', 'the mode control keeps the overview in step');
  eq(a.prog()['Code Generation'].state, 'stale', 'and a mode change marks the generated code as stale (the constructor depends on it)');
  await a.gen();
  for (let i = 0; i < 3; i++) for (const s of ['home', 'swap', 'treasury', 'deploy', 'treasury']) await a.go(s);
  ok(a.prog()['Code Generation'].state === 'done' && d.querySelectorAll('#treSummary .bld-row').length === 7, 'repeated navigation keeps the state and does not duplicate rows');
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
