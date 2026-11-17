// Phase 12.2: AI Auditor (section 08). runAudit(), renderAuditReport(), downloadAuditReport() and buildAuditMarkdown() are unchanged: same request, same report, same file.
// The page now shows an overview and a progress beside the form. These tests (AI answers are simulated; nothing real is called) prove: the request is exactly the one the page
// always sent, nothing is sent until you press Run AI Audit, the overview says whether the report on screen is about the source and focus on screen, a failed or unavailable
// AI is shown as what it is (and the page's own alert still appears and alert() is put back), the score is called the AI's number, the known mislabelled download is described,
// and it all holds on all 16 networks.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const REPORT = { score: 88, summary: 'Looks reasonable.', findings: [{ severity: 'low', title: 'T1', description: 'd1', recommendation: 'r1' }, { severity: 'high', title: 'T2', description: 'd2', recommendation: 'r2', lineHint: 'x = y;' }] };

function fresh() {
  const a = loadApp(); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  a.alerts = []; const alertFn = (m) => a.alerts.push(String(m)); a.w.alert = alertFn;
  a.w.__ai = []; let plan = { text: JSON.stringify(REPORT) }; let hold = null;
  a.ev(`aiFetch = (action, payload) => { window.__ai.push([action, payload]); return window.__aiNext(); }`);
  a.w.__aiNext = () => { const go = () => Promise.resolve().then(() => { if (plan instanceof Error) throw plan; return plan; }); return hold ? hold.then(go) : go(); };
  const ctl = { report: (r) => { plan = { text: JSON.stringify(r) }; }, raw: (t) => { plan = { text: t }; }, fail: (m) => { plan = new Error(m); }, hold: () => { let rel; hold = new Promise((r) => { rel = r; }); return () => { hold = null; rel(); }; } };
  const settle = async () => { await tick(); await tick(); await tick(); };
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await settle(); };
  const net = async (k) => { a.ev(`activeNetwork = '${k}'; updateSideNet();`); await settle(); };
  const setv = async (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new a.w.Event('change', { bubbles: true })); await settle(); };
  const rows = () => Object.fromEntries([...d.querySelectorAll('#audSummary .bld-row')].map((r) => [r.querySelector('dt').textContent, { text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', flag: (r.querySelector('.bld-flag') || {}).textContent || '', state: r.dataset.state }]));
  const prog = () => Object.fromEntries([...d.querySelectorAll('#audProgress li')].map((l) => [l.querySelector('b').textContent, { state: l.dataset.state, text: l.querySelector('.bld-t').textContent }]));
  const gen = (name) => a.ev(`renderSimpleForm('erc20'); ${name ? `document.getElementById('s_name').value = '${name}';` : ''} genSimple('erc20')`);
  const press = async () => { d.getElementById('runAuditBtn').click(); await settle(); await settle(); };
  return { ...a, d, ctl, go, net, setv, rows, prog, gen, press, settle, alertFn };
}
const NETS = (a) => JSON.parse(a.ev('JSON.stringify(Object.entries(NETWORKS).map(([k, n]) => [k, n.label, !!n.isMainnet]))'));

/* 1. the page: ids, handlers, defaults and the proxy's limit */
{
  const a = fresh(); const { d } = a;
  for (const id of ['audit_focus', 'auditContractLabel', 'runAuditBtn', 'auditResults', 'auditScoreBox', 'auditRing', 'auditScoreLabel', 'auditScoreSub', 'auditFindings']) ok(!!d.getElementById(id), 'id: ' + id);
  eq([...d.querySelectorAll('#sec-auditor [data-onclick]')].map((b) => b.textContent + ':' + b.getAttribute('data-onclick')), ['Run AI Audit:runAudit()', 'Download Report:downloadAuditReport()'], 'Run and Download keep their handlers');
  eq([[...d.getElementById('audit_focus').options].map((o) => o.value), d.getElementById('auditContractLabel').disabled, d.getElementById('auditContractLabel').value, d.getElementById('auditResults').style.display], [['full', 'security', 'gas', 'logic'], true, '— generate a contract first', 'none'], 'the options, the default, the disabled field and the hidden report are unchanged');
  ok(['audit_focus', 'auditContractLabel'].every((id) => !!d.querySelector(`label[for="${id}"]`)), 'every field has a label');
  eq([...d.getElementById('sec-auditor').outerHTML.matchAll(/\son[a-z]+="/gi)].length, 0, 'csp: no inline handler');
  eq([d.querySelector('#sec-auditor .section-head .n').textContent, d.querySelector('#sec-auditor .section-head h2').textContent, d.getElementById('sec-auditor').classList.contains('bld')], ['08', 'AI Security Auditor', true], 'number and heading are unchanged');
  ok(!/computed from the findings/.test(d.getElementById('sec-auditor').textContent) && /does not compute it/.test(d.querySelector('#sec-auditor .bld-sub').textContent), 'the intro no longer says the page computes the score (it is the AI\'s number)');
  const cs = css.slice(css.indexOf('/* ---- AI Security Auditor (section 08)'), css.indexOf('/* ---- Test Generator (section 17)'));
  const sels = []; cs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, s) => { sels.push(...s.split(',').map((x) => x.trim())); return ''; });
  const real = sels.filter((s) => !s.startsWith('@'));
  ok(real.length >= 4 && real.every((s) => /^(\.light\s+)?\.bld#sec-auditor/.test(s)), 'css: every rule of this tab is scoped to #sec-auditor', JSON.stringify(real.filter((s) => !/^(\.light\s+)?\.bld#sec-auditor/.test(s))));
  ok(d.getElementById('audSummary').children.length >= 5 && d.querySelectorAll('#audProgress li').length === 3 && d.querySelectorAll('#audNotes li').length === 4, 'overview: rows, three steps and four notes');
  eq(a.ev("CFBuilder.viewKeys().includes('auditor')"), true, 'registered with the shared engine');
  const lim = (f) => Number((fs.readFileSync(path.join(root, '..', f), 'utf8').match(/AI_MAX_BODY\s*=\s*(\d+)/) || [])[1]);
  eq([lim('functions/api/ai.js'), lim('api/ai.js'), a.ev('AUD_MAX_CODE')], [60000, 60000, 60000], 'the size limit shown is the one both AI services enforce');
  const tok = (f) => Number((fs.readFileSync(path.join(root, '..', f), 'utf8').match(/AI_MAX_TOKENS\s*=\s*\{\s*audit:\s*(\d+)/) || [])[1]);
  eq([tok('functions/api/ai.js'), tok('api/ai.js')], [2000, 2000], 'both AI services cap the audit answer at 2,000 tokens (the note about a cut-off report)');
}

/* 2. nothing is sent until Run AI Audit is pressed; the header's Audit only opens the tab */
{
  const a = fresh(); const { d } = a; a.gen(); await a.settle();
  a.ev('ccAudit()'); await a.settle();
  eq([d.getElementById('sec-auditor').style.display, a.ev('window.__ai.length'), a.alerts], ['block', 0, []], 'Audit in the contract bar opens the tab and asks the AI nothing');
  await a.setv('audit_focus', 'gas'); await a.setv('audit_focus', 'full'); await a.go('home'); await a.go('auditor');
  const before = a.ev('JSON.stringify([pendingSource, lastAuditReport])');
  for (let i = 0; i < 8; i++) { a.ev('audRender()'); await a.setv('audit_focus', ['security', 'logic'][i % 2]); }
  eq([a.ev('JSON.stringify([pendingSource, lastAuditReport])') === before, a.ev('window.__ai.length'), d.getElementById('auditResults').style.display, a.alerts], [true, 0, 'none', []], 'changing the focus and drawing the overview touch neither the contract nor the report, and ask nothing');
}

/* 3. the request, the report and the files are what they always were */
{
  const a = fresh(); const { d } = a; a.gen(); await a.go('auditor');
  await a.setv('audit_focus', 'security'); await a.press();
  const [act, pl] = a.ev('window.__ai[0]');
  eq([a.ev('window.__ai.length'), act, Object.keys(pl).sort(), pl.name, pl.code === a.ev('pendingSource.code'), pl.focus], [1, 'audit', ['code', 'focus', 'name'], a.ev('pendingSource.name'), true, 'security'], 'one request: "audit" with the name, the whole source and the focus');
  eq([d.getElementById('auditResults').style.display, d.getElementById('runAuditBtn').disabled, d.getElementById('runAuditBtn').textContent, d.getElementById('auditContractLabel').value, a.alerts, a.ev('lastAuditReport.score')], ['block', false, 'Run AI Audit', a.ev('pendingSource.name') + '.sol', [], 88], 'the report shows, the button is back, no alert');
  eq([[...d.querySelectorAll('#auditFindings .audit-finding h4')].map((h) => h.textContent), d.getElementById('auditScoreLabel').textContent, /1 high · 1 low/.test(d.getElementById('auditScoreSub').textContent)], [['T2', 'T1'], 'Secure', true], 'the page\'s own report: most severe first, the label, the counts');
  const files = []; a.w.URL.createObjectURL = () => 'blob:x'; a.w.HTMLAnchorElement.prototype.click = function () { files.push(this.download); };
  a.ev('downloadAuditReport()'); eq(files, [a.ev('pendingSource.name') + '_audit.md'], 'Download Report saves <contract>_audit.md');
  ok(a.ev('buildAuditMarkdown(lastAuditReport)').startsWith('# Security Audit — ' + a.ev('pendingSource.name')), 'and the report is titled with the contract on screen');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 4. the overview follows what really happened */
{
  const a = fresh(); const { d } = a;
  await a.go('auditor'); eq([a.rows().Contract.text, a.rows().Contract.state, a.prog().Source.state, a.prog()['Audit run'].state, a.prog().Review.state], ['None', 'missing', 'todo', 'locked', 'locked'], 'no contract: the steps are not available');
  a.gen(); await a.go('home'); await a.go('auditor');
  let r = a.rows(), p = a.prog();
  eq([r.Contract.text, r.Report.text, r.Report.state, p.Source.state, p['Audit run'].state, r.Focus.text, r.Focus.flag, r['Deployment Mode'].text], [a.ev('pendingSource.name') + '.sol', 'No audit yet', 'missing', 'done', 'todo', 'Full audit (all categories)', '', 'Single network'], 'a contract, no audit');
  ok(!('Score' in r) && !('Findings' in r) && !('Download saves' in r), 'no score, no findings and no download line before there is a report');
  const release = a.ctl.hold(); d.getElementById('runAuditBtn').click(); await a.settle();
  eq([a.rows().Report.text, a.prog()['Audit run'], d.getElementById('runAuditBtn').disabled, d.getElementById('runAuditBtn').textContent], ['Waiting for the AI…', { state: 'todo', text: 'Waiting for the AI…' }, true, 'Auditing…'], 'while the AI is working it says so');
  const tapped = a.w.alert !== a.alertFn; release(); await a.settle(); await a.settle();
  eq([tapped, a.w.alert === a.alertFn], [true, true], 'alert() was passed through while waiting and is the very same function again afterwards');
  r = a.rows(); p = a.prog();
  eq([r.Report.text, r.Report.state, p['Audit run'].state, p['Audit run'].text, r.Score.text, r.Findings.text], [`Of ${a.ev('pendingSource.name')}.sol (Full audit (all categories))`, 'ok', 'done', 'The AI answered for this source, with this focus.', '88/100', '1 high · 1 low'], 'a report for this source and focus');
  ok(/A number given by the AI, shown above as "Secure": not computed by this page and not a guarantee/.test(r.Score.flag), 'the score is called the AI\'s number');
  eq([r['Download saves'].text, r['Download saves'].state, p.Review.state], [a.ev('pendingSource.name') + '_audit.md', 'ok', 'todo'], 'the download line, and the review step is never done');
  eq(p.Review.text, 'Not tracked here: read each finding and decide. An AI audit is advisory and is not a security guarantee.', 'the review step says what it is');
  await a.setv('audit_focus', 'gas');
  eq([a.rows().Report.state, a.rows().Report.flag, a.prog()['Audit run'].state, a.rows().Focus.flag, d.getElementById('audFocusNote').textContent], ['missing', 'The focus changed since this report', 'stale', 'The score and its label refer to this focus only', 'The score and its label refer to "Gas optimization only" only.'], 'a different focus after the audit: outdated, and the score is tied to its focus');
  await a.setv('audit_focus', 'full'); eq(a.prog()['Audit run'].state, 'done', 'back to the same focus: current again');
  a.gen('OtherToken'); await a.go('home'); await a.go('auditor');
  eq([a.rows().Report.flag, a.prog()['Audit run'].state, a.prog()['Audit run'].text, a.rows()['Download saves'].state], ['The contract on screen is not the one this report is about', 'stale', 'The contract changed after this report. Run the audit again.', 'missing'], 'the contract changed after: outdated');
  await a.press(); await a.go('home'); await a.go('auditor');
  eq([a.rows().Report.state, a.prog()['Audit run'].state], ['ok', 'done'], 'run again for the new contract: current');
  a.ctl.report({ score: 150, summary: 's', findings: [] }); await a.press();
  eq([a.rows().Score.text, a.rows().Findings.text], ['100/100', 'None'], 'a score above 100 is shown as the page shows it, clamped to 100; no findings reads "None"');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 5. the known mislabelled download: a report about A, downloaded while B is on screen */
{
  const a = fresh(); const { d } = a; a.gen('AlphaToken'); await a.go('auditor'); await a.press();
  a.gen('BetaToken'); await a.go('home'); await a.go('auditor');
  const files = []; a.w.URL.createObjectURL = () => 'blob:x'; a.w.HTMLAnchorElement.prototype.click = function () { files.push(this.download); };
  a.ev('downloadAuditReport()');
  eq([files, a.ev('buildAuditMarkdown(lastAuditReport)').startsWith('# Security Audit — BetaToken')], [['BetaToken_audit.md'], true], 'the file and its title name the contract on screen (BetaToken) although the report is about AlphaToken (KNOWN)');
  const r = a.rows();
  eq([r['Download saves'].text, r['Download saves'].state, r['Download saves'].flag], ['BetaToken_audit.md', 'missing', 'Titled with the contract on screen now (BetaToken), but the report is about AlphaToken'], 'and the overview says so');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 6. an AI that fails, is unavailable, answers badly, or fails after a success: the page's own alert still appears */
{
  const a = fresh(); const { d } = a; a.gen(); await a.go('auditor');
  a.ctl.fail('AI is not configured on this deployment.'); await a.press();
  let r = a.rows(), p = a.prog();
  eq(a.alerts, ['Audit error: AI is not configured on this deployment.'], 'the page\'s own alert is shown, unchanged');
  eq([r.Report.text, r.Report.state, r.Report.flag, p['Audit run'].state, p['Audit run'].text, d.getElementById('auditResults').style.display, d.getElementById('runAuditBtn').disabled, a.w.alert === a.alertFn], ['AI unavailable', 'bad', 'AI is not configured on this deployment.', 'attention', 'The AI is unavailable: AI is not configured on this deployment.', 'none', false, true], 'unavailable is shown as unavailable; nothing is shown as a result; alert() is back');
  a.ctl.fail('Too many AI requests. Wait a minute and try again.'); await a.press();
  eq([a.rows().Report.text, a.rows().Report.flag, a.prog()['Audit run'].text], ['Audit failed', 'Too many AI requests. Wait a minute and try again.', 'The audit did not complete: Too many AI requests. Wait a minute and try again.'], 'another failure is a failure, with its own message');
  a.ctl.raw('{"score": 80, "summary": "cut off', ); await a.press();
  ok(a.alerts[a.alerts.length - 1].startsWith('Audit error: ') && a.rows().Report.text === 'Audit failed' && a.prog()['Audit run'].state === 'attention', 'an answer that is not valid JSON (for example a report cut off) is a failure with the page\'s own message');
  a.ctl.report(REPORT); await a.press(); eq(a.prog()['Audit run'].state, 'done', 'a success');
  a.ctl.fail('boom'); await a.press();
  r = a.rows();
  eq([r.Report.text, r.Report.flag.includes('Download would still save the earlier report (of ' + a.ev('pendingSource.name') + ')')], ['Audit failed', true], 'after a failed run the overview says Download would still save the earlier report');
  eq([a.ev('lastAuditReport.score'), a.w.alert === a.alertFn, a.ev('window.__ai.length')], [88, true, 5], 'and that is true: the earlier report is still there (KNOWN); alert() was restored every time');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 7. a click with no contract, a draft, and a source over the AI service's limit */
{
  const a = fresh(); const { d } = a;
  await a.go('auditor'); await a.press();
  eq([a.alerts, a.ev('window.__ai.length'), a.w.alert === a.alertFn], [['Generate a contract first (sections 01–06), then run the audit.'], 0, true], 'no contract: the page\'s own alert, nothing asked of the AI, alert() untouched');
  eq(a.prog()['Audit run'].state, 'locked', 'and the overview did not invent a run');
  a.ev("document.getElementById('tre_signers').value = ''; genTreasury()"); await a.go('home'); await a.go('auditor');
  const why = a.ev('reqBlockReason()');
  eq([a.rows().Source.text, a.rows().Source.state, a.prog().Source.state, a.rows().Source.flag.endsWith(why)], ['Draft', 'missing', 'draft', true], 'a draft is shown as a draft, with the reason');
  await a.press(); eq([a.ev('window.__ai.length'), a.prog()['Audit run'].state], [1, 'done'], 'a draft can be audited (as before)');
  a.ev(`pendingSource = { name: 'Big', code: 'contract Big {}' + ' '.repeat(60000), template: 'erc20' }`); await a.go('home'); await a.go('auditor');
  eq([a.rows().Size.text, a.rows().Size.state, a.rows().Size.flag], ['60,015 characters', 'bad', 'More than the 60,000 the AI service accepts: it will refuse this source'], 'a source over 60,000 characters is marked as too large for the service');
  await a.press(); eq(a.ev('window.__ai.length'), 2, 'the page still sends it (as before): the service decides');
}

/* 8. all 16 networks and every mode */
{
  const a = fresh(); const { d } = a; a.gen(); await a.go('auditor'); await a.press();
  for (const [k, label, main] of NETS(a)) {
    await a.net(k);
    const r = a.rows(); const chain = a.ev(`NETWORKS['${k}'].chainIdDec`);
    eq([r.Network.text, r.Network.flag.startsWith('Mainnet'), r.Report.text.startsWith('Of ')], [`${label} (${chain})`, main, true], `${k}: network ${main ? 'with the mainnet warning' : 'without it'}; the report on screen is still listed`);
  }
  for (const m of ['portable', 'multi', 'cross', 'single']) { a.ev(`setMultichainMode('${m}')`); await a.settle(); eq(a.rows()['Deployment Mode'].text, a.ev(`MC_MODES['${m}'].label`), `mode ${m}`); }
  eq(a.ev('window.__ai.length'), 1, 'sixteen network changes and four mode changes asked the AI nothing more');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 9. text from the contract, the AI and the page is only ever text */
{
  const a = fresh(); const { d } = a; const EVIL = '<img src=x onerror=window.__xss=1>';
  a.ev(`pendingSource = { name: ${JSON.stringify('X' + EVIL)}, code: 'contract X {}', template: 'erc20' }`);
  a.ctl.report({ score: 50, summary: EVIL, findings: [{ severity: EVIL, title: EVIL, description: EVIL, recommendation: EVIL, lineHint: EVIL }, { severity: 'high', title: 'ok', description: 'ok' }] });
  await a.go('auditor'); await a.press();
  eq([a.w.__xss, d.querySelectorAll('#sec-auditor img').length, a.w.eval('typeof __xss')], [undefined, 0, 'undefined'], 'nothing in the contract name, the report or the overview becomes markup');
  ok(d.getElementById('audSummary').textContent.includes('<img'), 'the name is shown as text in the overview');
  ok(![...d.querySelectorAll('#sec-auditor *')].some((el) => [...el.attributes].some((at) => /__xss|onerror/.test(at.value) && at.name !== 'id')), 'no attribute carries the payload');
  eq(a.rows().Findings.text, '1 high · 1 info', 'an unknown severity is counted as info, as the page draws it');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 10. navigation and the other tabs */
{
  const a = fresh(); const { d } = a; a.gen(); await a.go('auditor'); await a.press();
  const shot = () => JSON.stringify([a.rows(), a.prog()]);
  const s0 = shot();
  for (const s of ['home', 'wizard', 'swap', 'auditor', 'deploy', 'auditor', 'tests', 'auditor', 'lab', 'auditor']) await a.go(s);
  eq(shot(), s0, 'after ten navigations the overview is the same');
  eq([d.querySelectorAll('#audProgress li').length, d.querySelectorAll('#audNotes li').length, a.w.alert === a.alertFn], [3, 4, true], 'no duplicated rows; alert() is the original');
  
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
