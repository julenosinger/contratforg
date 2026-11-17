// Phase 12.0: the audit of the six analysis tabs (Test Lab 18, AI Auditor 08, ABI Playground 09, Gas Estimator 11, Analytics 16, Test Generator 17), written as a test.
// Every fact was read from the code and checked by running it with a stand-in for the wallet, the RPC node and the AI service (nothing real is called).
// Later phases redesign these tabs one by one; this file must keep passing so a redesign cannot silently change an id, a handler, what a function sends or reads,
// or what a tab claims. Facts that are known defects are locked as they are and marked (KNOWN): fixing one is a decision, and then the line is updated on purpose.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8'), pgJs = fs.readFileSync(path.join(root, 'playground.js'), 'utf8'), labJs = fs.readFileSync(path.join(root, 'lab.js'), 'utf8');

function fresh(real = false) {
  const alerts = []; const a = loadApp({ realEthers: real, alerts }); const d = a.w.document;
  const fetches = []; a.w.fetch = async (u, o) => { fetches.push(String(u)); return { ok: true, status: 200, json: async () => ({}), text: async () => '' }; };
  const settle = async () => { await tick(); await tick(); await tick(); };
  const log = (id) => [...d.querySelectorAll('#' + id + ' .line .msg')].map((m) => m.textContent);
  const blobs = []; const files = [];
  a.w.Blob = class { constructor(p, o) { this.text = p.join(''); this.type = o && o.type; } }; a.w.URL.createObjectURL = (b) => { blobs.push(b); return 'blob:x'; }; a.w.URL.revokeObjectURL = () => {};
  a.w.HTMLAnchorElement.prototype.click = function () { files.push({ name: this.download, text: blobs[blobs.length - 1] && blobs[blobs.length - 1].text, type: blobs[blobs.length - 1] && blobs[blobs.length - 1].type }); };
  const clip = []; Object.defineProperty(a.w.navigator, 'clipboard', { value: { writeText: (x) => { clip.push(x); return Promise.resolve(); } }, configurable: true });
  return { ...a, d, alerts, fetches, settle, log, files, clip };
}
const gen = (a) => a.ev("renderSimpleForm('erc20'); genSimple('erc20')");

/* 1. what each tab is made of: number, title, menu entry, ids and handlers */
{
  const a = fresh(); const { d } = a;
  const T = [['lab', '18', 'Test Lab', 'Test Lab', ['labStatus', 'labContract', 'labArgs', 'lab_acting', 'lab_acting_addr', 'lab_balances', 'lab_time', 'lab_time_n', 'lab_time_unit', 'lab_mine_n', 'lab_token', 'lab_token_amt', 'lab_approve_all', 'lab_filter', 'lab_search', 'lab_functions', 'lab_txs', 'lab_log']],
    ['auditor', '08', 'AI Security Auditor', 'AI Auditor', ['audit_focus', 'auditContractLabel', 'runAuditBtn', 'auditResults', 'auditScoreBox', 'auditRing', 'auditScoreLabel', 'auditScoreSub', 'auditFindings']],
    ['playground', '09', 'ABI Playground', 'ABI Playground', ['pg_deployments', 'pg_address', 'pg_abisrc', 'pg_customAbiField', 'pg_customAbi', 'pg_context', 'pg_filter', 'pg_search', 'pg_functions', 'pg_calls', 'pg_log']],
    ['gas', '11', 'Gas Estimator', 'Gas Estimator', ['gas_ethprice', 'gas_gweioverride', 'gasMeter', 'g_units', 'g_unitssub', 'g_gwei', 'g_gweisub', 'g_native', 'g_nativesub', 'g_usd', 'g_usdsub', 'g_bytecode', 'g_functions', 'gasLog']],
    ['analytics', '16', 'Contract Analytics', 'Analytics', ['an_address', 'an_blocks', 'an_history_pills', 'analyticsData', 'an_kpis', 'an_bars', 'an_barlabels', 'an_events']],
    ['tests', '17', 'Test Generator', 'Test Generator', ['test_framework', 'test_coverage', 'test_contractLabel', 'genTestsBtn', 'testOutput', 'testCards', 'testCode']]];
  for (const [s, n, h2, nav, ids] of T) {
    const sec = d.getElementById('sec-' + s);
    eq([sec.querySelector('.section-head .n').textContent, sec.querySelector('.section-head h2').textContent, d.querySelector(`.nav-item[data-section="${s}"]`).textContent.replace(/\s+/g, ' ').trim()], [n, h2, n + ' ' + nav], `${s}: its number, title and menu entry`);
    eq(ids.filter((id) => !sec.querySelector('#' + id)), [], `${s}: all ${ids.length} ids exist inside the section`);
    eq(ids.filter((id) => d.querySelectorAll('#' + id).length !== 1), [], `${s}: and each exists once`);
  }
  const H = (s) => [...new Set([...d.getElementById('sec-' + s).querySelectorAll('[data-onclick], [data-onchange], [data-oninput]')].map((b) => b.getAttribute('data-onclick') || b.getAttribute('data-onchange') || b.getAttribute('data-oninput')))].sort();
  eq(H('tests'), ['copyTests()', 'downloadTests()', 'generateTests()'], 'tests: handlers');
  eq(H('auditor'), ['downloadAuditReport()', 'runAudit()'], 'auditor: handlers');
  eq(H('gas'), ['estimateGas()'], 'gas: handlers');
  eq(H('analytics'), ['loadAnalytics()', 'refreshAnalytics()'], 'analytics: handlers');
  eq(H('playground'), ["filterFns('all',this)", "filterFns('event',this)", "filterFns('read',this)", "filterFns('write',this)", 'loadPlayground()', 'onAbiSrcChange()', 'pgSelectDeployment()', 'subscribeEvents()'], 'playground: handlers');
  eq(H('lab'), ['labAdvance(2592000)', 'labAdvance(3600)', 'labAdvance(604800)', 'labAdvance(86400)', 'labAdvanceCustom()', 'labApprove()', "labFilter('all',this)", "labFilter('event',this)", "labFilter('read',this)", "labFilter('write',this)", 'labLoadContract()', 'labMine()', 'labMint()', 'labSelectAccount()', 'labSmoke()'], 'lab: handlers (the time buttons are 1 hour, 1 day, 7 days and 30 days)');
  eq(['audit_focus', 'test_framework', 'test_coverage', 'lab_time_unit', 'pg_abisrc'].map((id) => [...d.querySelectorAll('#' + id + ' option')].map((o) => o.value).join(',')), ['full,security,gas,logic', 'foundry,hardhat,both', 'basic,full,security', '60,3600,86400', 'last,custom,history'], 'the options of the selects');
  eq([d.getElementById('an_blocks').value, d.getElementById('gas_ethprice').value, d.getElementById('gas_gweioverride').value], ['10000', '0', '0'], 'defaults: 10,000 blocks of look-back; a manual price and a gwei override of 0 (meaning: use the network\'s)');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 2. Test Generator: what it sends, what it shows, what it never does */
{
  const a = fresh(); const { d } = a;
  a.ev("window.__calls = []; window.__ran = []; aiFetch = async (action, payload) => { window.__calls.push([action, payload, d_btn()]); return window.__reply; }; function d_btn(){ const b = document.getElementById('genTestsBtn'); return [b.disabled, b.textContent]; }; compileSource = async () => { window.__ran.push('compileSource'); }; compilePending = async () => { window.__ran.push('compilePending'); };");
  await a.w.eval('generateTests()');
  eq([a.alerts, a.ev('window.__calls.length')], [['Generate a contract first (sections 01-06 or AI → Solidity).'], 0], 'without a contract: the page says so and asks the AI nothing');
  gen(a); const name = a.ev('pendingSource.name'), code = a.ev('pendingSource.code');
  const REPLY = '```solidity\n// SPDX\ncontract T {\n  function test_a() public {}\n  function testB() public {}\n  function helper() internal {}\n  function test_c() public {}\n}\n```';
  a.ev(`window.__reply = { text: ${JSON.stringify(REPLY)}, output_tokens: 321 }`);
  await a.w.eval('generateTests()');
  const [act, payload, btn] = a.ev('window.__calls[0]');
  eq([act, Object.keys(payload).sort(), payload.name, payload.code === code, payload.framework, payload.coverage], ['tests', ['code', 'coverage', 'framework', 'name'], name, true, 'foundry', 'basic'], 'the request: action "tests" with the name, the whole source, the framework and the coverage (defaults foundry and basic)');
  eq(btn, [true, 'Generating…'], 'while it waits, the button is disabled and says Generating…');
  eq([d.getElementById('genTestsBtn').disabled, d.getElementById('genTestsBtn').textContent, d.getElementById('testOutput').style.display, d.getElementById('test_contractLabel').value], [false, 'Generate Tests', 'block', name + '.sol'], 'afterwards: the button is back, the output is shown and the label names the contract');
  eq(d.getElementById('testCode').textContent, '// SPDX\ncontract T {\n  function test_a() public {}\n  function testB() public {}\n  function helper() internal {}\n  function test_c() public {}\n}', 'the code fences are removed and nothing else changes');
  ok(/— 3 test functions/.test(d.getElementById('testCards').textContent) && /Foundry \(\.t\.sol\) · basic coverage/.test(d.getElementById('testCards').textContent), 'the count is the number of "function test…" lines in the text (3 of the 4 functions) (KNOWN: it counts text, nothing is run)');
  eq(a.ev('window.__ran'), [], 'it never compiles the tests or the contract');
  eq(a.fetches, [], 'and makes no other request (only the AI call, which is stubbed here)');
  // hardhat, download and copy
  d.getElementById('test_framework').value = 'hardhat'; await a.w.eval('generateTests()');
  ok(/Hardhat \(Mocha\/Chai\) · basic coverage/.test(d.getElementById('testCards').textContent), 'hardhat: the card says Hardhat');
  d.getElementById('test_coverage').value = 'security'; d.getElementById('test_framework').value = 'both'; await a.w.eval('generateTests()');
  ok(/Foundry \+ Hardhat · security coverage/.test(d.getElementById('testCards').textContent), 'both: the card says Foundry + Hardhat and the coverage');
  a.ev("document.getElementById('test_framework').value = 'hardhat'"); d.querySelector('[data-onclick="downloadTests()"]').click();
  d.getElementById('test_framework').value = 'foundry'; d.querySelector('[data-onclick="downloadTests()"]').click();
  eq(a.files.map((f) => f.name), [name + '.test.js', name + '.t.sol'], 'download: .test.js for Hardhat, .t.sol otherwise');
  d.querySelector('[data-onclick="copyTests()"]').click(); await a.settle(); eq(a.clip, [d.getElementById('testCode').textContent], 'copy puts the generated text on the clipboard');
  // errors and the empty state
  const b = fresh(); b.ev("aiFetch = async () => { throw new Error('AI is not available on this deployment.'); }"); gen(b);
  await b.w.eval('generateTests()');
  eq([b.d.getElementById('genTestsBtn').disabled, b.d.getElementById('genTestsBtn').textContent, b.d.getElementById('testOutput').style.display], [false, 'Generate Tests', 'none'], 'when the AI fails: the button recovers and no output is shown');
  ok(b.log('deployConsole').some((m) => m === 'Test gen error: AI is not available on this deployment.'), 'and the console says what went wrong');
  const c = fresh(); c.d.querySelector('[data-onclick="downloadTests()"]').click(); c.d.querySelector('[data-onclick="copyTests()"]').click();
  eq([c.alerts, c.files.length, c.clip.length], [['Generate tests first.'], 0, 0], 'download before generating: the page says so; copy does nothing');
  ok(/lastTestCode/.test(appJs) && !/lastTestCode\s*=\s*\{/.test(appJs), 'the text is kept in one variable, with nothing recording which source it was written for (KNOWN: it can be stale)');
  eq(a.pageErrors.length + b.pageErrors.length, 0, 'no page errors');
}

/* 3. AI Auditor */
{
  const a = fresh(); const { d } = a;
  a.ev("window.__calls = []; aiFetch = async (action, payload) => { window.__calls.push([action, payload, [document.getElementById('runAuditBtn').disabled, document.getElementById('runAuditBtn').textContent]]); return window.__reply; };");
  await a.w.eval('runAudit()');
  eq([a.alerts, a.ev('window.__calls.length')], [['Generate a contract first (sections 01–06), then run the audit.'], 0], 'without a contract: the page says so and asks the AI nothing');
  d.querySelector('[data-onclick="downloadAuditReport()"]').click();
  eq([a.alerts[1], a.files.length], ['Run an audit first.', 0], 'download before any audit: the page says so');
  gen(a); const name = a.ev('pendingSource.name'), code = a.ev('pendingSource.code');
  const REPORT = { score: 88, summary: 'Looks fine.', findings: [{ severity: 'low', title: 'T1', description: 'D1', recommendation: 'R1', lineHint: 'x = 1;' }, { severity: 'high', title: 'T2', description: 'D2' }] };
  a.ev(`window.__reply = { text: '\`\`\`json\\n' + ${JSON.stringify(JSON.stringify(REPORT))} + '\\n\`\`\`' }`);
  d.getElementById('audit_focus').value = 'security'; await a.w.eval('runAudit()');
  const [act, payload, btn] = a.ev('window.__calls[0]');
  eq([act, Object.keys(payload).sort(), payload.name, payload.code === code, payload.focus], ['audit', ['code', 'focus', 'name'], name, true, 'security'], 'the request: action "audit" with the name, the whole source and the focus');
  eq(btn, [true, 'Auditing…'], 'while it waits: the button is disabled and says Auditing…');
  eq([d.getElementById('runAuditBtn').disabled, d.getElementById('runAuditBtn').textContent, d.getElementById('auditResults').style.display, d.getElementById('auditContractLabel').value], [false, 'Run AI Audit', 'block', name + '.sol'], 'afterwards: the button is back, the results are shown and the label names the contract');
  eq(a.ev('JSON.stringify(lastAuditReport)'), JSON.stringify(REPORT), 'the report is kept in memory exactly as the AI gave it (the code fences are removed)');
  eq([d.getElementById('auditScoreLabel').textContent, [...d.querySelectorAll('#auditFindings .audit-finding h4')].map((h) => h.textContent)], ['Secure', ['T2', 'T1']], 'a score of 88 is labelled "Secure" and every finding is listed, the most severe first (KNOWN: the word comes from the model\'s own number)');
  eq([95, 80, 79, 60, 59, 40, 39, -5, 500].map((s) => { a.ev(`renderAuditReport({ score: ${s}, summary: 'x', findings: [] })`); return d.getElementById('auditScoreLabel').textContent; }), ['Secure', 'Secure', 'Moderate risk', 'Moderate risk', 'High risk', 'High risk', 'Critical issues', 'Critical issues', 'Secure'], 'the score labels: 80 and up Secure, 60 Moderate risk, 40 High risk, below that Critical issues; the score is clamped to 0 to 100');
  eq(a.ev("document.getElementById('auditScoreLabel').textContent"), 'Secure', 'a score of 500 is clamped to 100');
  a.ev(`renderAuditReport(${JSON.stringify(REPORT)}); lastAuditReport = ${JSON.stringify(REPORT)}`);
  d.querySelector('[data-onclick="downloadAuditReport()"]').click();
  const f = a.files[0]; ok(f && f.name === name + '_audit.md' && f.type === 'text/markdown' && f.text.includes('# Security Audit — ' + name) && f.text.includes('## Score: 88/100') && f.text.includes('### 1. [LOW] T1') && f.text.includes('**Recommendation:** R1'), 'the report downloads as markdown with the name, the score, each finding and its recommendation');
  // bad answers and a failure leave the earlier report alone
  a.ev(`window.__reply = { text: 'not json' }`); await a.w.eval('runAudit()');
  ok(/^Audit error: /.test(a.alerts[a.alerts.length - 1]) && a.ev('lastAuditReport.score') === 88 && !d.getElementById('runAuditBtn').disabled, 'an answer that is not JSON: an alert, the earlier report is kept and the button recovers');
  a.ev("aiFetch = async () => { throw new Error('AI is not available on this deployment.'); }"); await a.w.eval('runAudit()');
  eq(a.alerts[a.alerts.length - 1], 'Audit error: AI is not available on this deployment.', 'an unavailable AI service is reported as it is');
  ok(/lastAuditReport = report;/.test(appJs) && !/lastAuditHash|auditedHash|lastAuditSource/.test(appJs), 'nothing records which source was audited (KNOWN: this is why no builder can show "Review & Audit" as done)');
  eq(a.fetches, [], 'no other request');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 4. Gas Estimator: where each number comes from (the wallet, the RPC node, a formula, a price source) */
{
  const BIG = (a, v) => a.w.ethers.BigNumber.from(v);
  const setup = (a, { code = true, wallet = true, bytecode = '0x' + '60'.repeat(100), est = 500000, gwei = '1000000000', estThrows = false } = {}) => {
    if (code) gen(a);
    a.w.ethers = Object.assign({}, a.w.ethers);
    a.w.__est = []; a.w.__gp = 0;
    a.ev(`provider = { getGasPrice: async () => { window.__gp++; return ethers.BigNumber.from('${gwei}'); }, estimateGas: async (tx) => { window.__est.push(tx); ${estThrows ? "throw new Error('no estimateGas');" : ''} return ethers.BigNumber.from(${est}); } }; signer = ${wallet ? '{}' : 'null'};`);
    if (bytecode !== null) a.ev(`window.__lastCompiledBytecode = '${bytecode}'; window.__lastCompiledABI = [{ type: 'constructor', inputs: [] }, { type: 'function', name: 'f', inputs: [], outputs: [], stateMutability: 'view' }];`);
    a.d.getElementById('gasLog').textContent = '';
  };
  const run = async (a) => { await a.w.eval('estimateGas()'); await a.settle(); return a.log('gasLog'); };
  const txt = (a, id) => a.d.getElementById(id).textContent;
  let a = fresh(true); setup(a, { code: false });
  ok((await run(a)).includes('Generate and compile a contract first.'), 'no contract: it says so');
  a = fresh(true); setup(a, { wallet: false });
  ok((await run(a)).includes('Connect your wallet first.'), 'no wallet: it says so (the estimate needs a connected wallet)');
  a = fresh(true); setup(a, { bytecode: null });
  ok((await run(a)).includes('Compile the contract first (section 07) to get bytecode.'), 'nothing compiled: it says so');
  // a normal estimate
  a = fresh(true); await a.ev("activeNetwork = 'sepolia'"); setup(a); a.d.getElementById('gas_ethprice').value = '2000';
  const L = await run(a);
  eq([txt(a, 'g_units'), txt(a, 'g_gwei'), txt(a, 'g_native'), txt(a, 'g_nativesub'), txt(a, 'g_usd'), txt(a, 'g_usdsub'), txt(a, 'g_bytecode'), txt(a, 'g_functions'), a.d.getElementById('gasMeter').style.display], ['500,000', '1.000', '0.000500', 'ETH', '$1.0000', 'at $2000/ETH', '100', '2', 'grid'], 'the meter: gas units, gwei, cost in the gas token, cost in dollars at the manual price, bytecode size and ABI items');
  eq([a.ev('window.__est.length'), Object.keys(a.ev('window.__est[0]')), a.ev('window.__est[0].data') === a.ev('window.__lastCompiledBytecode')], [1, ['data'], true], 'the estimate asks the node about the creation bytecode only: no constructor arguments are included (KNOWN)');
  ok(L.includes('Gas price: 1.000 gwei') && L.some((m) => /^Estimate complete: 500,000 gas units × 1\.000 gwei = 0\.000500 ETH/.test(m)), 'the console tells the same story');
  eq(a.fetches, [], 'a manual price needs no request');
  // override and fallback
  a = fresh(true); setup(a); a.d.getElementById('gas_gweioverride').value = '2.5'; await run(a);
  eq([txt(a, 'g_gwei'), a.ev('window.__gp')], ['2.500', 0], 'a gwei override replaces the network price (the node is not asked for it)');
  a = fresh(true); setup(a, { bytecode: '0x00ff00ff', estThrows: true }); const L2 = await run(a);
  eq(txt(a, 'g_units'), '32,416', 'without estimateGas: 32,000 + 200 per non-zero byte + 4 per byte (32,000 + 2 x 200 + 4 x 4)');
  ok(L2.includes('estimateGas not available on this network — using approximation.'), 'and the console says it is an approximation');
  // size warnings
  for (const [bytes, kind, text] of [[24577, 'err', 'Bytecode exceeds 24 576 byte limit (EIP-170). Contract will fail to deploy.'], [20001, 'warn', 'Bytecode is large (20001 bytes). Consider splitting the contract.'], [20000, null, null]]) {
    a = fresh(true); setup(a, { bytecode: '0x' + '60'.repeat(bytes) }); await run(a);
    const lines = [...a.d.querySelectorAll('#gasLog .line')].map((l) => l.className.replace('line ', '') + ':' + l.querySelector('.msg').textContent);
    eq(kind ? lines.includes(kind + ':' + text) : lines.every((x) => !/EIP-170|is large/.test(x)), true, `${bytes} bytes: ${kind ? 'the ' + kind + ' about the size' : 'no size warning'}`);
  }
  // the dollar price on all 16 networks
  const nets = JSON.parse(fresh(true).ev('JSON.stringify(Object.entries(NETWORKS).map(([k, n]) => [k, n.gasSymbol, !!n.isMainnet]))'));
  eq(nets.length, 16, '16 networks');
  for (const [k, sym] of nets) {
    a = fresh(true); a.ev(`activeNetwork = '${k}'`); setup(a);
    a.w.fetch = async (u) => { a.fetches.push(String(u)); return { json: async () => ({ ethereum: { usd: 2000 }, 'matic-network': { usd: 0.5 } }) }; };
    await run(a);
    if (sym === 'USDC') eq([a.fetches.length, txt(a, 'g_usdsub'), txt(a, 'g_usd')], [0, 'at $1/USDC', '$0.0005'], `${k} (gas token USDC): no request, the price is fixed at $1`);
    else {
      const id = sym === 'POL' ? 'matic-network' : 'ethereum';
      eq([a.fetches.length, a.fetches[0], txt(a, 'g_nativesub')], [1, `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`, sym], `${k} (${sym}): one request to CoinGecko for ${id}${sym === 'AVAX' || sym === 'BNB' ? ' (KNOWN: the Ethereum price is used for ' + sym + ')' : ''}`);
    }
  }
  a = fresh(true); a.ev("activeNetwork = 'sepolia'"); setup(a); a.w.fetch = async () => { throw new Error('offline'); }; const L3 = await run(a);
  eq([txt(a, 'g_usd'), txt(a, 'g_usdsub'), L3.includes('Could not fetch live price — USD estimate unavailable. Set a manual price.')], ['—', 'set a price manually', true], 'if the price service is unreachable: the dollar figure is withheld, not invented');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 5. Analytics: what it reads and how it labels it */
{
  const prep = (a, { logs = [{ blockNumber: 49999, topics: ['0x1'], data: '0x', transactionHash: '0x' + '1'.repeat(64) }, { blockNumber: 45000, topics: ['0x2'], data: '0x', transactionHash: '0x' + '2'.repeat(64) }], latest = 50000, throwLogs = false } = {}) => {
    a.w.ethers = Object.assign({}, a.w.ethers, { Contract: class { async decimals() { return 6; } async balanceOf() { return a.w.ethers.BigNumber.from('2500000'); } } });
    a.w.__logs = logs; a.w.__f = null; a.w.__nonce = 0; a.w.__getNetwork = 0;
    a.ev(`provider = { getBlockNumber: async () => ${latest}, getTransactionCount: async () => 7, getBalance: async () => ethers.BigNumber.from('1500000000000000000'), getNetwork: async () => { window.__getNetwork++; return { chainId: 1 }; }, getLogs: async (f) => { window.__f = f; ${throwLogs ? "throw new Error('query returned more than 10000 results');" : ''} return window.__logs; } }`);
  };
  const kpis = (a) => [...a.d.querySelectorAll('#an_kpis .an-card')].map((c) => [c.querySelector('.anl').textContent, c.querySelector('.anv').textContent, c.querySelector('.ans').textContent]);
  let a = fresh(true);
  await a.w.eval('loadAnalytics()'); eq(a.alerts, ['Enter a contract address.'], 'no address: the page says so');
  a.d.getElementById('an_address').value = addrFor('x'); await a.w.eval('loadAnalytics()'); eq(a.alerts[1], 'Connect your wallet first.', 'no wallet: the page says so (it reads through the wallet\'s connection)');
  prep(a); await a.w.eval('loadAnalytics()');
  eq(a.ev('window.__f'), { address: addrFor('x'), fromBlock: 40000, toBlock: 50000 }, 'it asks for the logs of that address from (latest - 10,000) to latest');
  const K = kpis(a); const net = a.ev('NETWORKS[activeNetwork]');
  eq(K.slice(0, 5), [['Transactions', '7', 'lifetime nonce'], ['Events (range)', '2', 'last 10,000 blocks'], ['Native balance', '1.5000', net.gasSymbol], ['USDC balance', '2.50 USDC', 'on ' + net.label], ['From block', '40,000', 'start of range']], 'the cards: "Transactions" is the account nonce (KNOWN: for a contract that is not a count of transactions to it), events in range, native and USDC balances, and the first block');
  eq(K.map((k) => k[0]), ['Transactions', 'Events (range)', 'Native balance', 'USDC balance', 'From block', 'Latest block'], 'six cards in all');
  eq([a.d.getElementById('an_barlabels').textContent.replace(/\s/g, ''), a.d.querySelectorAll('#an_bars .bar').length, a.d.getElementById('analyticsData').style.display], ['-10000now', 10, 'block'], 'ten bars of events over the range, labelled -10000 and now');
  ok(/Topic: 0x2… tx: 0x2{12}…/.test(a.d.getElementById('an_events').textContent) && a.d.querySelectorAll('#an_events .line').length === 2, 'the events are listed with the block, the first topic and the transaction');
  ok(!/getNetwork|getChainId|chainId/.test(a.w.eval('loadAnalytics.toString()')) && a.ev('window.__getNetwork') === 0, 'it never checks which chain the connection is on (KNOWN: the labels come from the active network, whatever chain the wallet is on)');
  // a look-back longer than the chain, and failures
  a.d.getElementById('an_blocks').value = '100000'; await a.w.eval('loadAnalytics()');
  eq([a.ev('window.__f.fromBlock'), kpis(a)[1][2]], [0, 'last 100,000 blocks'], 'a look-back longer than the chain starts at block 0');
  const b = fresh(true); b.d.getElementById('an_address').value = addrFor('x'); prep(b, { throwLogs: true }); await b.w.eval('loadAnalytics()');
  ok(b.log('deployConsole').includes('Analytics error: query returned more than 10000 results') && b.d.getElementById('analyticsData').style.display !== 'block', 'a node that refuses the range: the error is shown as it is and no result is drawn');
  // all 16 networks
  const nets = JSON.parse(fresh(true).ev('JSON.stringify(Object.entries(NETWORKS).map(([k, n]) => [k, n.label, n.gasSymbol, !!n.usdc]))'));
  for (const [k, label, sym, hasUsdc] of nets) {
    const c = fresh(true); c.ev(`activeNetwork = '${k}'`); c.d.getElementById('an_address').value = addrFor('x'); prep(c); await c.w.eval('loadAnalytics()');
    const kk = kpis(c); eq([kk[2][2], kk[3][1], kk[3][2]], [sym, hasUsdc ? '2.50 USDC' : '—', 'on ' + label], `${k}: the native balance is in ${sym}; the USDC balance is ${hasUsdc ? 'read from the network\'s USDC' : 'not available (no USDC address here)'}`);
  }
  a.ev("setAnalyticsAddress('0x12')"); a.ev(`setAnalyticsAddress('${addrFor('y')}')`); eq(a.d.getElementById('an_address').value, addrFor('y'), 'a pill only fills in a valid address');
  eq(a.pageErrors.length + b.pageErrors.length, 0, 'no page errors');
}

/* 6. ABI Playground and Test Lab: the facts a redesign must not move (their behaviour has its own suites, playground.mjs and lab.mjs) */
{
  const a = fresh(); const { d } = a;
  ok(/Connect your wallet to send transactions\./.test(pgJs) && /await signer\.getChainId\(\)/.test(pgJs) && /always read-only/.test(pgJs), 'playground: reading never needs a wallet; sending needs one, on the contract\'s own chain');
  ok(/Wallet not connected: read-only \(calls and events work, sending needs a wallet\)\./.test(pgJs), 'playground: without a wallet it says it is read-only');
  eq([a.ev('pgFilter'), a.ev('typeof pgNetKey + typeof pgOpenEntry + typeof pgRefreshDeployments + typeof loadHistoryIntoPlayground')], ['all', 'functionfunctionfunctionfunction'], 'playground: the filter starts at "all" and the history hooks exist');
  a.w.localStorage.setItem('contractforge_deploy_history', JSON.stringify([{ name: 'P', address: addrFor('p1'), network: 'sepolia', abi: [{ type: 'function', name: 'ping', inputs: [], outputs: [], stateMutability: 'view' }], txHash: '0x1', timestamp: Date.now() }, { name: 'Q', address: addrFor('p2'), network: 'arc', abi: [], txHash: '0x2', timestamp: Date.now() }]));
  a.ev('loadHistoryIntoPlayground(1)'); await a.settle();
  eq([d.getElementById('sec-playground').style.display, d.getElementById('pg_address').value, d.getElementById('pg_abisrc').value], ['block', addrFor('p2'), 'history'], 'playground: a history record opens by its index in storage');
  eq(a.fetches, [], 'playground: opening it sends no request of its own');
  const names = JSON.parse(a.ev('JSON.stringify(LAB_NAMES)')), aux = JSON.parse(a.ev('JSON.stringify(LAB_AUX)'));
  eq(names, ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'], 'lab: five test accounts');
  eq(aux, { usdc: '0x00000000000000000000000000000000000055dc', eurc: '0x00000000000000000000000000000000000000ec', messenger: '0x0000000000000000000000000000000000000a11', transmitter: '0x0000000000000000000000000000000000000a12' }, 'lab: test USDC, test EURC and the two CCTP stand-ins live at fixed fake addresses');
  ok(/No wallet, no network, no real funds/.test(labJs) && /lab-evm\.js/.test(labJs) && !/signer|provider\./.test(labJs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'lab: a simulation that uses neither the wallet nor a node, with its engine loaded on first use');
  d.querySelector('.nav-item[data-section="lab"]').click(); await a.settle();
  eq([d.getElementById('sec-lab').style.display, a.fetches.length], ['block', 0], 'lab: opening the tab sends nothing');
  // a draft cannot be sent to the Test Lab from the contract bar
  d.getElementById('tre_signers').value = ''; a.ev('genTreasury()'); await a.settle(); d.querySelector('.nav-item[data-section="home"]').click(); await a.settle();
  a.ev('ccTest()'); await a.settle(); eq(d.getElementById('sec-lab').style.display, 'none', 'lab: Test in the contract bar does nothing for a draft');
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
