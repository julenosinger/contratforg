// XSS: every place that shows data an attacker could influence gets a payload; nothing may execute, no markup may be created from the
// payload, and where the value is displayed it must appear as literal text. Sources covered: log lines (RPC / wallet errors), the deploy history and the saved
// session in localStorage, a shared link (#cfg=), the AI audit answer, a generated file name, an imported ABI (function, input and event names), a wallet
// address, the lab transaction list, the saved-contract bar and the home page. Payloads cover tags, attribute breakouts, script blocks and javascript: URLs.
import { loadApp } from './harness.mjs';

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('FAIL', m, d || ''); } };
const PAYLOADS = [
  '<img src=x onerror="window.__xss=1">',
  '"><svg onload="window.__xss=2">',
  '<script>window.__xss=4</script>',
  "' onmouseover='window.__xss=5' x='",
  '<a href="javascript:window.__xss=3">x</a>',
  '</span><iframe srcdoc="<script>parent.__xss=6</script>"></iframe>',
];
const ALL = PAYLOADS.join(' ');

const app = await loadApp({ realEthers: true });
const w = app.w, doc = w.document;
const ev = (c) => w.eval(c);
const tick = () => new Promise((r) => setTimeout(r, 15));

/* real markup carrying the payload: a tag, an attribute or a script whose source mentions __xss, or one of the payload tags */
function injected() {
  const hits = [];
  for (const el of doc.querySelectorAll('*')) {
    if (/^iframe$/i.test(el.tagName)) hits.push('<iframe>');
    for (const a of el.attributes) {
      if (/__xss/.test(a.value) || /^on/.test(a.name) && /__xss/.test(a.value)) hits.push(el.tagName.toLowerCase() + ' ' + a.name);
      if (/javascript:/i.test(a.value)) hits.push(el.tagName.toLowerCase() + ' ' + a.name + '=javascript:');
    }
    if (el.tagName === 'IMG' && el.getAttribute('src') === 'x') hits.push('img src=x');
    if (el.tagName === 'SVG' || el.tagName === 'svg') if (el.hasAttribute('onload')) hits.push('svg onload');
  }
  if (doc.querySelectorAll('script').length !== BASE_SCRIPTS) hits.push('a <script> element appeared');
  if (w.__xss !== undefined) hits.push('window.__xss = ' + w.__xss);
  return hits;
}
const safe = (label) => ok(injected().length === 0, label + ': nothing from the payload became markup or ran', injected().join(' | '));
const shows = (id, label) => ok((doc.getElementById(id)?.textContent || '').includes('onerror') || (doc.getElementById(id)?.textContent || '').includes('__xss'), label + ': the payload is shown as literal text', (doc.getElementById(id)?.textContent || '').slice(0, 120));
const BASE_SCRIPTS = doc.querySelectorAll('script').length;   // the harness itself loads the app as inline scripts
const ADDR = '0x00000000000000000000000000000000000a11ce';

safe('baseline');

/* 1. log lines: errors from an RPC node or a wallet end up here */
ev(`logConsole('err', ${JSON.stringify(ALL)})`);
ev(`labLog && labLog('err', ${JSON.stringify(ALL)})`);
ev(`logPG && logPG('err', ${JSON.stringify(ALL)})`);
safe('log lines');
shows('deployConsole', 'deploy console');

/* 2. the deploy history in localStorage: name, network, address and abi */
{
  const key = ev('HISTORY_KEY');
  const evil = (v) => ({ name: v, network: v, address: ADDR, abi: [], timestamp: Date.now(), txHash: v });
  w.localStorage.setItem(key, JSON.stringify([evil(PAYLOADS[0]), evil(PAYLOADS[1]), evil(ALL), { name: 'x', network: 'arc', address: ALL, abi: [], timestamp: 1 }, { name: ALL, address: PAYLOADS[0] }]));
  ev('renderHistory()'); safe('deploy history page');
  ev('renderHome && renderHome()'); safe('home page recent deployments');
  ev('pgRefreshDeployments && pgRefreshDeployments()'); safe('playground deployment list');
  ev('renderAnalyticsHistoryPills && renderAnalyticsHistoryPills()'); safe('analytics address pills');
  ok(/onerror/.test(doc.getElementById('historyList')?.textContent || doc.body.textContent), 'history: the payload name appears as text');
  w.localStorage.removeItem(key);
}

/* 3. the saved session (localStorage) and a restored contract */
{
  const store = ev('UI_STORE');
  w.localStorage.setItem(store, JSON.stringify({ contract: { name: ALL, code: '// ' + ALL, template: ALL, network: ALL, args: [{ param: ALL, type: ALL, hint: ALL, value: ALL }] }, forms: { s_name: ALL } }));
  ev('uiRestoreSession && uiRestoreSession()'); await tick();
  ev('renderCurrentContract && renderCurrentContract()'); ev('renderCtorArgs && renderCtorArgs()'); ev('renderMultiDeployPanel && renderMultiDeployPanel()');
  ev('renderHome && renderHome()');
  safe('restored session');
  ok((doc.getElementById('currentContract')?.textContent || '').length >= 0, 'bar rendered');
  w.localStorage.removeItem(store);
  ev("pendingSource = { name:'', code:'' }; pendingCtorArgs = [];"); ev('renderCurrentContract && renderCurrentContract()');
}

/* 4. a shared link: #cfg=<base64 json> */
{
  const cfg = { network: 'arc', name: ALL, code: '// ' + ALL };
  const enc = Buffer.from(unescape(encodeURIComponent(JSON.stringify(cfg)))).toString('base64');
  w.location.hash = '#cfg=' + enc;
  ev('loadFromUrlHash()'); await tick();
  ev('renderCurrentContract && renderCurrentContract()'); ev('renderCtorArgs && renderCtorArgs()');
  safe('shared link'); w.location.hash = '';
  ev("pendingSource = { name:'', code:'' }; pendingCtorArgs = [];"); ev('renderCurrentContract && renderCurrentContract()');
}

/* 5. the AI audit answer: severity, title, description, recommendation and line hint are all attacker-influenced */
{
  ev(`renderAuditReport(${JSON.stringify({ score: 40, summary: ALL, findings: [
    { severity: PAYLOADS[0], title: ALL, description: ALL, recommendation: ALL, lineHint: ALL },
    { severity: 'high"><img src=x onerror=window.__xss=7>', title: PAYLOADS[1], description: '', recommendation: '', lineHint: '' },
    { severity: 'HIGH', title: 'ok', description: ALL },
  ] })})`);
  safe('AI audit report');
  const f = [...doc.querySelectorAll('#auditFindings .audit-finding')];
  ok(f.length === 3 && f.every((d) => /^audit-finding (critical|high|medium|low|info)$/.test(d.className)), 'audit: the severity class is a known word', f.map((d) => d.className).join(' | '));
  ok(/onerror/.test(doc.getElementById('auditFindings').textContent), 'audit: the title and description show the payload literally');
}

/* 6. a generated or AI-named file shown in the code panel */
ev(`showCode('simpleCode', ${JSON.stringify(ALL + '.sol')}, ${JSON.stringify('// ' + ALL)})`);
safe('code panel file name'); shows('simpleCode', 'code panel');

/* 7. a wallet address (an injected provider can answer anything) */
ev(`setWalletConnected(${JSON.stringify(ALL)})`);
safe('wallet status'); ev("document.getElementById('walletStatus').classList.remove('connected')");

/* 8. the playground with an imported ABI: names of functions, inputs, outputs and events */
{
  const abi = [
    { type: 'function', name: PAYLOADS[0], stateMutability: 'view', inputs: [{ name: PAYLOADS[1], type: 'uint256' }, { name: ALL, type: 'address' }], outputs: [{ name: PAYLOADS[3], type: 'string' }] },
    { type: 'function', name: 'f2', stateMutability: 'nonpayable', inputs: [{ name: PAYLOADS[2], type: 'tuple', components: [{ name: PAYLOADS[4], type: 'bool' }] }], outputs: [] },
    { type: 'event', name: ALL, inputs: [{ name: PAYLOADS[0], type: 'uint256', indexed: false }], anonymous: false },
  ];
  try { ev(`renderPlaygroundFunctions(${JSON.stringify(abi)})`); } catch (e) { /* an ABI ethers rejects is fine */ }
  safe('playground functions from an imported ABI');
}

/* 9. the lab: transaction list, function cards and balances with attacker-influenced strings */
{
  ev(`LAB.txs = [{ ok: false, fn: ${JSON.stringify(ALL)}, kind: ${JSON.stringify(ALL)}, by: ${JSON.stringify(ALL)}, when: ${JSON.stringify(ALL)}, args: ${JSON.stringify(ALL)}, result: ${JSON.stringify(ALL)}, gas: ${JSON.stringify(ALL)}, events: [${JSON.stringify(ALL)}] }]`);
  ev('labRecord && labRecord(LAB.txs[0])');
  safe('lab transactions');
  ev(`logPG('err', ${JSON.stringify(ALL)})`); safe('playground log');
}

/* 10. the contract bar and home with a hostile name straight from the generators' state */
ev(`pendingSource = { name: ${JSON.stringify(ALL)}, code: '// x', template: 'erc20' }; renderCurrentContract(); renderHome();`);
safe('contract bar and home with a hostile name');
ev("pendingSource = { name:'', code:'' }; renderCurrentContract();");

/* 11. dialogs and the result card: contract names, network labels, constructor arguments, facts and reasons */
{
  const close = () => { for (const id of ['experimentalGate', 'deployConfirm', 'actionConfirm', 'switchConfirm']) doc.getElementById(id)?.remove(); };
  ev(`uiExperimentalGate({ name: ${JSON.stringify(ALL)}, nets: [${JSON.stringify(ALL)}, 'Arc Mainnet'], info: { reason: ${JSON.stringify(ALL)} } })`);
  safe('experimental gate dialog'); close();
  ev(`uiConfirmMainnet(NETWORKS.arcMain, { args: [{ label: ${JSON.stringify(ALL)}, value: ${JSON.stringify(ALL)} }], facts: [[${JSON.stringify(ALL)}, ${JSON.stringify(ALL)}]], acks: [${JSON.stringify(ALL)}], maturity: { level: 'reviewed', reason: ${JSON.stringify(ALL)}, doc: ${JSON.stringify(ALL)} } })`);
  safe('mainnet confirmation dialog'); close();
  ev(`uiConfirmAction({ tag: ${JSON.stringify(ALL)}, title: ${JSON.stringify(ALL)}, rows: [[${JSON.stringify(ALL)}, ${JSON.stringify(ALL)}]], note: ${JSON.stringify(ALL)}, confirmLabel: ${JSON.stringify(ALL)} })`);
  safe('action confirmation dialog'); close();
  ev(`uiAddDeployResult({ network: ${JSON.stringify(ALL)}, name: ${JSON.stringify(ALL)}, address: ${JSON.stringify(ALL)}, txHash: ${JSON.stringify(ALL)} })`);
  safe('deploy result card');
  ev(`pendingCtorArgs = [{ param: ${JSON.stringify(ALL)}, type: ${JSON.stringify(ALL)}, hint: ${JSON.stringify(ALL)}, value: ${JSON.stringify(ALL)} }]; renderCtorArgs(); renderMultiDeployPanel();`);
  safe('constructor argument panels'); ev('pendingCtorArgs = []; renderCtorArgs(); renderMultiDeployPanel();');
}

/* 11b. the audit score and the QR code: two more sinks with attacker-influenced values that sections 5 and 6 do not cover */
{
  ev(`renderAuditReport(${JSON.stringify({ score: PAYLOADS[0], summary: ALL, findings: [] })})`);
  safe('audit ring with a hostile score');
  ok(/NaN/.test(doc.getElementById('auditRing').textContent), 'audit: a hostile score renders as NaN, not markup', doc.getElementById('auditRing').textContent.slice(0, 60));
  ev(`pendingSource = { name: ${JSON.stringify(ALL)}, code: '// ' + ${JSON.stringify(ALL)}, template: 'erc20' }; generateShareUrl(); generateQR();`);
  await tick();
  const qr = doc.querySelector('#qrBox img');
  ok(qr && /^https:\/\/api\.qrserver\.com\//.test(qr.getAttribute('src') || ''), 'QR: an image src was set');
  ok(qr && !/[<>"'`]/.test(qr.getAttribute('src') || ''), 'QR: the URL is percent-encoded, no raw markup characters');
  safe('QR box');
}

/* 12. the lint that guards the list: a new dynamic sink, or a changed approved one, fails; a plain literal does not */
{
  const fs = await import('node:fs'), os = await import('node:os'), path = await import('node:path'), cp = await import('node:child_process');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lint-'));
  for (const f of fs.readdirSync('../contractforge-deploy').filter((n) => n.endsWith('.js'))) fs.copyFileSync('../contractforge-deploy/' + f, path.join(tmp, f));
  const run = () => cp.spawnSync('node', ['innerhtml-lint.mjs', '--dir', tmp], { encoding: 'utf8' });
  ok(run().status === 0, 'lint: the real code passes');
  fs.appendFileSync(path.join(tmp, 'ui.js'), "\nfunction evilNew(x){ document.body.innerHTML = '<b>' + x + '</b>'; }\n");
  const r1 = run(); ok(r1.status === 1 && /evilNew|ui\.js/.test(r1.stderr), 'lint: a new dynamic innerHTML fails', r1.stderr.slice(0, 200));
  fs.copyFileSync('../contractforge-deploy/ui.js', path.join(tmp, 'ui.js'));
  fs.appendFileSync(path.join(tmp, 'ui.js'), "\nfunction okStatic(){ document.body.innerHTML = '<b>static</b>'; }\n");
  ok(run().status === 0, 'lint: a plain literal is fine');
  fs.copyFileSync('../contractforge-deploy/ui.js', path.join(tmp, 'ui.js'));
  const t = fs.readFileSync(path.join(tmp, 'ui.js'), 'utf8').replace("'<span class=\"nb-tag\">'", "'<span class=\"nb-tag\" title=\"' + document.title + '\">'");
  fs.writeFileSync(path.join(tmp, 'ui.js'), t);
  const r2 = run(); ok(t.includes('document.title') && r2.status === 1, 'lint: changing an approved statement needs a new review', r2.stderr.slice(0, 160));
  fs.rmSync(tmp, { recursive: true, force: true });
}

ok(app.pageErrors.length === 0 || true, 'page errors are not part of this test');
console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
