// Phase 12.1: Test Generator (section 17). generateTests(), copyTests() and downloadTests() are unchanged: same request, same output, same file names. The page
// now shows an overview and a progress beside the form. These tests (AI answers are simulated; nothing real is called) prove: the request is exactly the one the page
// always sent, nothing is sent until you press Generate, the overview says whether the tests on screen belong to the source and settings on screen, a failed or
// unavailable AI is shown as what it is, nothing is claimed about running the tests, the Hardhat and "Both" cases are described truthfully, and it all holds on all 16 networks.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const FOUNDRY = '```solidity\n// SPDX-License-Identifier: MIT\ncontract T is Test {\n function test_a() public {}\n function testB() public {}\n function test_c() public {}\n function helper() public {}\n}\n```';
const HARDHAT = "```js\ndescribe('X', () => {\n it('a', async () => {});\n it('b', async () => {});\n});\n```";

function fresh() {
  const a = loadApp(); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  a.alerts = []; a.w.alert = (m) => a.alerts.push(String(m));
  a.w.__ai = []; let plan = { text: FOUNDRY, outputTokens: 321 }; let hold = null;
  a.ev(`aiFetch = (action, payload) => { window.__ai.push([action, payload]); return window.__aiNext(); }`);
  a.w.__aiNext = () => { if (hold) return hold.then(() => typeof plan === 'function' ? plan() : plan); return Promise.resolve().then(() => { if (plan instanceof Error) throw plan; return plan; }); };
  const ctl = { answer: (p) => { plan = p; }, hold: () => { let go; hold = new Promise((r) => { go = r; }); return () => { hold = null; go(); }; } };
  const settle = async () => { await tick(); await tick(); await tick(); };
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await settle(); };
  const net = async (k) => { a.ev(`activeNetwork = '${k}'; updateSideNet();`); await settle(); };
  const setv = async (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new a.w.Event('change', { bubbles: true })); await settle(); };
  const rows = () => Object.fromEntries([...d.querySelectorAll('#tgSummary .bld-row')].map((r) => [r.querySelector('dt').textContent, { text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', flag: (r.querySelector('.bld-flag') || {}).textContent || '', state: r.dataset.state }]));
  const prog = () => Object.fromEntries([...d.querySelectorAll('#tgProgress li')].map((l) => [l.querySelector('b').textContent, { state: l.dataset.state, text: l.querySelector('.bld-t').textContent }]));
  const gen = () => a.ev("renderSimpleForm('erc20'); genSimple('erc20')");
  const press = async () => { d.getElementById('genTestsBtn').click(); await settle(); await settle(); };
  return { ...a, d, ctl, go, net, setv, rows, prog, gen, press, settle };
}
const NETS = (a) => JSON.parse(a.ev('JSON.stringify(Object.entries(NETWORKS).map(([k, n]) => [k, n.label, !!n.isMainnet]))'));

/* 1. the page: ids, handlers, defaults are as they were */
{
  const a = fresh(); const { d } = a;
  for (const id of ['test_framework', 'test_coverage', 'test_contractLabel', 'genTestsBtn', 'testOutput', 'testCards', 'testCode']) ok(!!d.getElementById(id), 'id: ' + id);
  eq([...d.querySelectorAll('#sec-tests [data-onclick]')].map((b) => b.textContent + ':' + b.getAttribute('data-onclick')), ['Generate Tests:generateTests()', 'Download:downloadTests()', 'Copy:copyTests()'], 'Generate, Download and Copy keep their handlers');
  eq([[...d.getElementById('test_framework').options].map((o) => o.value), [...d.getElementById('test_coverage').options].map((o) => o.value), d.getElementById('test_contractLabel').disabled, d.getElementById('test_contractLabel').value], [['foundry', 'hardhat', 'both'], ['basic', 'full', 'security'], true, '— generate a contract first'], 'the options, the default and the disabled contract field are unchanged');
  eq(d.getElementById('testOutput').style.display, 'none', 'the output starts hidden');
  ok(['test_framework', 'test_coverage', 'test_contractLabel'].every((id) => !!d.querySelector(`label[for="${id}"]`)), 'every field has a label');
  eq([...d.getElementById('sec-tests').outerHTML.matchAll(/\son[a-z]+="/gi)].length, 0, 'csp: no inline handler');
  eq([d.querySelector('#sec-tests .section-head .n').textContent, d.querySelector('#sec-tests .section-head h2').textContent, d.getElementById('sec-tests').classList.contains('bld')], ['17', 'Test Generator', true], 'number and heading are unchanged');
  const cs = css.slice(css.indexOf('/* ---- Test Generator (section 17)'), css.indexOf('/* ---- Share & Export (section 13)'));
  const sels = []; cs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, s) => { sels.push(...s.split(',').map((x) => x.trim())); return ''; });
  ok(sels.filter((s) => !s.startsWith('@')).length >= 4 && sels.filter((s) => !s.startsWith('@')).every((s) => /^(\.light\s+)?\.bld#sec-tests/.test(s)), 'css: every rule of this tab is scoped to #sec-tests', JSON.stringify(sels.filter((s) => !s.startsWith('@') && !/^(\.light\s+)?\.bld#sec-tests/.test(s))));
  ok(d.getElementById('tgSummary').children.length >= 6 && d.querySelectorAll('#tgProgress li').length === 3 && d.querySelectorAll('#tgNotes li').length === 3, 'overview: rows, three steps and three notes');
  eq(d.querySelectorAll('#tgSummary, #tgProgress, #tgNotes, #tgEmpty').length, 4, 'no duplicated ids');
  eq(a.ev("CFBuilder.viewKeys().includes('tests')"), true, 'registered with the shared engine');
}

/* 2. nothing is sent until Generate is pressed */
{
  const a = fresh(); const { d } = a; a.gen(); await a.settle();
  await a.go('tests'); await a.setv('test_framework', 'hardhat'); await a.setv('test_coverage', 'security'); await a.go('home'); await a.go('tests');
  eq([a.ev('window.__ai.length'), a.alerts], [0, []], 'opening the tab, changing the settings and coming back asks the AI nothing and alerts nothing');
  const before = a.ev('JSON.stringify([pendingSource, typeof lastTestCode])');
  for (let i = 0; i < 8; i++) { a.ev('tgRender()'); await a.setv('test_coverage', ['basic', 'full'][i % 2]); }
  eq(a.ev('JSON.stringify([pendingSource, typeof lastTestCode])'), before, 'drawing the overview does not touch the contract or the tests');
  eq([a.ev('window.__ai.length'), d.getElementById('testOutput').style.display], [0, 'none'], 'and nothing was generated');
}

/* 3. the request, the output and the file names are what they always were (the facts also locked by analysis-tabs-audit) */
{
  const a = fresh(); const { d } = a; a.gen(); await a.go('tests');
  await a.press();
  const [act, pl] = a.ev('window.__ai[0]');
  eq([a.ev('window.__ai.length'), act, Object.keys(pl).sort(), pl.name, pl.code === a.ev('pendingSource.code'), pl.framework, pl.coverage], [1, 'tests', ['code', 'coverage', 'framework', 'name'], a.ev('pendingSource.name'), true, 'foundry', 'basic'], 'one request: "tests" with the name, the whole source, the framework and the coverage');
  eq([d.getElementById('testCode').textContent.startsWith('// SPDX'), d.getElementById('testCode').textContent.includes('```'), d.getElementById('testOutput').style.display, d.getElementById('genTestsBtn').disabled, d.getElementById('genTestsBtn').textContent, d.getElementById('test_contractLabel').value], [true, false, 'block', false, 'Generate Tests', a.ev('pendingSource.name') + '.sol'], 'the fences are stripped, the output shows, the button is back');
  ok(/3 test functions/.test(d.getElementById('testCards').textContent) && /321 tokens/.test(d.getElementById('testCards').textContent), 'the card keeps its own count and token figure');
  const files = []; a.w.URL.createObjectURL = () => 'blob:x'; a.w.HTMLAnchorElement.prototype.click = function () { files.push(this.download); };
  for (const [fw, ext] of [['foundry', '.t.sol'], ['hardhat', '.test.js'], ['both', '.t.sol']]) { await a.setv('test_framework', fw); a.ev('downloadTests()'); eq(files[files.length - 1], a.ev('pendingSource.name') + ext, `download with ${fw}: ${ext}`); }
  let copied = null; Object.defineProperty(a.w.navigator, 'clipboard', { value: { writeText: (t) => { copied = t; return Promise.resolve(); } }, configurable: true });
  a.ev('copyTests()'); await a.settle(); eq(copied === a.ev('lastTestCode'), true, 'copy puts the shown text on the clipboard');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 4. the overview follows what really happened */
{
  const a = fresh(); const { d } = a;
  await a.go('tests'); eq([a.rows().Contract.text, a.rows().Contract.state, a.prog().Source.state, a.prog()['Tests written'].state, a.prog()['Review and run'].state], ['None', 'missing', 'todo', 'locked', 'locked'], 'no contract: the steps are not available');
  a.gen(); await a.go('home'); await a.go('tests');
  let r = a.rows(), p = a.prog();
  eq([r.Contract.text, r.Tests.text, r.Tests.state, p.Source.state, p['Tests written'].state], [a.ev('pendingSource.name') + '.sol', 'Not generated yet', 'missing', 'done', 'todo'], 'a contract, no tests: "Not generated yet"');
  eq([r.Framework.text, r.Coverage.text, r['Deployment Mode'].text], ['Foundry', 'Happy paths only', 'Single network'], 'framework, coverage and mode are the ones chosen');
  ok(!('Counted in the text' in r) && !('Download saves' in r), 'no count and no download line before there are tests');
  // while waiting
  const release = a.ctl.hold(); d.getElementById('genTestsBtn').click(); await a.settle();
  eq([a.rows().Tests.text, a.prog()['Tests written'], d.getElementById('genTestsBtn').disabled], ['Waiting for the AI…', { state: 'todo', text: 'Waiting for the AI…' }, true], 'while the AI is working it says so');
  release(); await a.settle(); await a.settle();
  r = a.rows(); p = a.prog();
  eq([r.Tests.text, r.Tests.state, p['Tests written'].state, p['Tests written'].text], [`For ${a.ev('pendingSource.name')}.sol (Foundry, basic)`, 'ok', 'done', 'Written for this source, with these settings.'], 'tests on screen for this source and these settings');
  eq([r['Counted in the text'].text, r['Counted in the text'].flag, r['Download saves'].text, p['Review and run']], ['3 "function test" lines', 'Counted by the page from the text; the tests were not compiled or run', a.ev('pendingSource.name') + '.t.sol', { state: 'todo', text: 'Not tracked here: read the tests and run them yourself (forge test or npx hardhat test). This page never compiles or runs them.' }], 'the count is labelled as a count of text, and the review step is never marked done');
  eq(a.ev('typeof compileSource + typeof compilePending'), 'functionfunction', 'compile functions exist');
  // outdated: the settings change, then the contract changes
  await a.setv('test_coverage', 'security');
  eq([a.rows().Tests.state, a.rows().Tests.flag, a.prog()['Tests written'].state], ['missing', 'The framework or coverage changed since', 'stale'], 'a setting changed after generation: outdated');
  await a.setv('test_coverage', 'basic');
  eq(a.prog()['Tests written'].state, 'done', 'set back: current again');
  a.ev("renderSimpleForm('erc20'); document.getElementById('s_name').value = 'OtherToken'; genSimple('erc20')"); await a.go('home'); await a.go('tests');
  eq([a.rows().Tests.flag, a.prog()['Tests written'].state, a.prog()['Tests written'].text, a.rows()['Download saves'].state], ['The contract on screen is not the one these were written for', 'stale', 'The contract changed after these tests were written. Generate again.', 'missing'], 'the contract changed after: outdated, and the download line warns');
  eq(a.d.getElementById('testCode').textContent.startsWith('// SPDX'), true, 'the old text is still shown and still downloadable (as before)');
  await a.press(); await a.go('home'); await a.go('tests');
  eq([a.rows().Tests.state, a.prog()['Tests written'].state], ['ok', 'done'], 'regenerated for the new contract: current');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 5. Hardhat and "Both": what the count and the file really are */
{
  const a = fresh(); const { d } = a; a.gen(); await a.go('tests');
  a.ctl.answer({ text: HARDHAT, outputTokens: 50 }); await a.setv('test_framework', 'hardhat'); await a.press();
  ok(/0 test functions/.test(d.getElementById('testCards').textContent), 'the card counts Foundry-style functions, so a Hardhat text shows 0 there (KNOWN, unchanged)');
  let r = a.rows();
  eq([r['Counted in the text'].text, r['Download saves'].text, a.prog()['Tests written'].state], ['2 it() blocks', a.ev('pendingSource.name') + '.test.js', 'done'], 'the overview counts it() blocks for Hardhat, and the download is .test.js');
  a.ctl.answer({ text: FOUNDRY + '\n' + HARDHAT, outputTokens: 99 }); await a.setv('test_framework', 'both'); await a.press();
  r = a.rows();
  eq([r.Framework.text, r.Framework.flag, r['Download saves'].text, d.getElementById('tgFwNote').textContent], ['Foundry and Hardhat', 'One text for both: saving it gives a single .t.sol file', a.ev('pendingSource.name') + '.t.sol', 'Both comes as one text and is saved as a single .t.sol file.'], '"Both" is one text saved as a single .t.sol (KNOWN), and the page says so');
  eq(r['Counted in the text'].text, '3 "function test" lines', 'with Both the page counts the Foundry lines only');
  await a.setv('test_framework', 'hardhat');
  eq([a.rows()['Download saves'].text, a.rows().Tests.state, a.prog()['Tests written'].state], [a.ev('pendingSource.name') + '.test.js', 'missing', 'stale'], 'switching to Hardhat after a Both text: the file name changes with the choice while the text does not: marked outdated');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 6. an AI that fails, is unavailable, answers empty, or fails after a success */
{
  const a = fresh(); const { d } = a; a.gen(); await a.go('tests');
  a.ctl.answer(new Error('AI is not configured on this deployment.')); await a.press();
  let r = a.rows(), p = a.prog();
  eq([r.Tests.text, r.Tests.state, r.Tests.flag, p['Tests written'].state, p['Tests written'].text, d.getElementById('testOutput').style.display, d.getElementById('genTestsBtn').disabled], ['AI unavailable', 'bad', 'AI is not configured on this deployment.', 'attention', 'The AI is unavailable: AI is not configured on this deployment.', 'none', false], 'unavailable is shown as unavailable, the button is back, nothing is shown as a result');
  ok([...d.querySelectorAll('#deployConsole .line .msg')].map((m) => m.textContent).includes('Test gen error: AI is not configured on this deployment.'), 'the page\'s own console line is unchanged');
  a.ctl.answer(new Error('Request timed out')); await a.press();
  r = a.rows(); eq([r.Tests.text, r.Tests.flag, a.prog()['Tests written'].text], ['Request failed', 'Request timed out', 'The request failed: Request timed out'], 'another failure is a failure, with its own message');
  a.ctl.answer({ text: '', outputTokens: 4 }); await a.press();
  eq([a.rows().Tests.text, a.rows().Tests.state, a.prog()['Tests written'].state, 'Counted in the text' in a.rows()], ['The AI answered with no text', 'bad', 'attention', false], 'an empty answer is not a success and has no count');
  // success, then a failed regeneration: Download still holds the earlier text
  a.ctl.answer({ text: FOUNDRY, outputTokens: 1 }); await a.press(); eq(a.prog()['Tests written'].state, 'done', 'a success');
  a.ctl.answer(new Error('boom')); await a.press();
  r = a.rows();
  eq([r.Tests.text, r.Tests.flag.includes('Download would still save the earlier tests for ' + a.ev('pendingSource.name'))], ['Request failed', true], 'after a failed regeneration the overview says Download would still save the earlier tests');
  eq([a.ev('lastTestCode').startsWith('// SPDX'), a.alerts.length], [true, 0], 'and that is true: the earlier text is still there (KNOWN)');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 7. a draft, and a click with no contract */
{
  const a = fresh(); const { d } = a;
  await a.go('tests'); await a.press();
  eq([a.alerts, a.ev('window.__ai.length')], [['Generate a contract first (sections 01-06 or AI → Solidity).'], 0], 'no contract: the page\'s own alert, and nothing is asked of the AI');
  eq(a.prog()['Tests written'].state, 'locked', 'the overview did not invent a run');
  a.ev("document.getElementById('tre_signers').value = ''; genTreasury()"); await a.go('home'); await a.go('tests');
  const why = a.ev('reqBlockReason()');
  eq([a.rows().Source.text, a.rows().Source.state, a.prog().Source.state, a.rows().Source.flag.endsWith(why)], ['Draft', 'missing', 'draft', true], 'a draft is shown as a draft, with the reason');
  await a.press();
  eq([a.ev('window.__ai.length'), a.prog()['Tests written'].state, a.prog()['Review and run'].state], [1, 'done', 'todo'], 'tests can still be written for a draft (as before)');
}

/* 8. all 16 networks and every mode */
{
  const a = fresh(); const { d } = a; a.gen(); await a.go('tests'); await a.press();
  for (const [k, label, main] of NETS(a)) {
    await a.net(k);
    const r = a.rows(); const chain = a.ev(`NETWORKS['${k}'].chainIdDec`);
    eq([r.Network.text, r.Network.flag.startsWith('Mainnet'), a.rows().Tests.text.startsWith('For ')], [`${label} (${chain})`, main, true], `${k}: network ${main ? 'with the mainnet warning' : 'without it'}; the tests on screen are still listed (they do not depend on the network)`);
  }
  for (const m of ['portable', 'multi', 'cross', 'single']) { a.ev(`setMultichainMode('${m}')`); await a.settle(); eq(a.rows()['Deployment Mode'].text, a.ev(`MC_MODES['${m}'].label`), `mode ${m}`); }
  eq(a.ev('window.__ai.length'), 1, 'sixteen network changes and four mode changes asked the AI nothing more');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 9. text from the contract, the AI and the page is only ever text */
{
  const a = fresh(); const { d } = a; const EVIL = '<img src=x onerror=window.__xss=1>';
  a.ev(`pendingSource = { name: ${JSON.stringify('X' + EVIL)}, code: 'contract X {}', template: 'erc20' }`);
  a.ctl.answer({ text: '```js\n' + EVIL + '\nit(' + JSON.stringify(EVIL) + ')\n```', outputTokens: 1 });
  await a.go('tests'); await a.press();
  const html = d.getElementById('sec-tests').innerHTML;
  eq([a.w.__xss, d.querySelectorAll('#sec-tests img').length, a.w.eval('typeof __xss')], [undefined, 0, 'undefined'], 'nothing in the contract name, the AI text or the overview becomes markup');
  ok(d.getElementById('tgSummary').textContent.includes(EVIL) || d.getElementById('tgSummary').textContent.includes('<img'), 'the name is shown as text in the overview');
  ok(![...d.querySelectorAll('#sec-tests *')].some((el) => [...el.attributes].some((at) => /__xss|onerror/.test(at.value) && at.name !== 'id')), 'no attribute carries the payload');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 10. navigation and the other tabs */
{
  const a = fresh(); const { d } = a; a.gen(); await a.go('tests'); await a.press();
  const shot = () => JSON.stringify([a.rows(), a.prog()]);
  const s0 = shot();
  for (const s of ['home', 'wizard', 'swap', 'tests', 'deploy', 'tests', 'auditor', 'tests', 'lab', 'tests']) await a.go(s);
  eq(shot(), s0, 'after ten navigations the overview is the same');
  eq([d.querySelectorAll('#tgSummary .bld-row').length, d.querySelectorAll('#tgProgress li').length, d.querySelectorAll('#tgNotes li').length], [a.ev("document.querySelectorAll('#tgSummary .bld-row').length"), 3, 3], 'no duplicated rows');
  
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
