// Phase 9.0: the shared builder engine (builder.js), tested with synthetic screens that have nothing to do with Swap / AMM.
// What it proves: the engine only reads, reports only what really happened, binds its listeners once, and can serve several screens.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const cf = (w) => w.eval('CFBuilder');
const tick = () => new Promise((r) => setTimeout(r, 0));

/* a throw-away screen: section, one input, summary, progress, header steps and a code panel, all created by the test */
function screen(app, key, extra = {}) {
  const d = app.w.document;
  const sec = d.createElement('section'); sec.id = 'sec-' + key; sec.style.display = 'block';
  sec.innerHTML = `<input id="${key}_name" value="Alpha"><input id="${key}_fee" value="5">
    <ol id="${key}Stages"><li data-step="configure"></li><li data-step="generate"></li><li data-step="deploy"></li></ol>
    <dl id="${key}Sum"></dl><ol id="${key}Prog"></ol><div id="${key}Code" style="display:none"></div>`;
  d.body.appendChild(sec);
  const g = (id) => d.getElementById(key + '_' + id).value;
  const cfg = {
    key, prefix: 'tst', section: 'sec-' + key, codePanel: key + 'Code', summary: key + 'Sum', progress: key + 'Prog', stages: key + 'Stages',
    isTemplate: (t) => t === key + '-tpl',
    read: () => ({ name: g('name'), fee: g('fee') }),
    problems: (v) => (/^\d+$/.test(v.fee) ? [] : ['Fee must be a number']),
    signature: (v) => JSON.stringify([v.name, v.fee, app.ev('activeNetwork')]),
    summaryRows: (v, row) => { row('Name', v.name, v.name ? 'ok' : 'bad', v.name ? '' : 'Enter a name'); row('Fee', v.fee, 'ok', '', true); },
    ...extra
  };
  return { sec, cfg, d, key, code: d.getElementById(key + 'Code'), prog: () => [...d.querySelectorAll(`#${key}Prog li`)].map((li) => li.dataset.state),
    texts: () => [...d.querySelectorAll(`#${key}Prog li`)].map((li) => li.querySelector('.tst-t').textContent),
    head: () => [...d.querySelectorAll(`#${key}Stages li`)].map((li) => li.dataset.state),
    // what a generator does: fill the panel the way showCode() does and put the same text in the deploy buffer
    generate: (code = 'contract A {}\n// two') => {
      app.ev(`pendingSource = { name: 'Alpha', code: ${JSON.stringify(code)}, template: '${key}-tpl' }`);
      d.getElementById(key + 'Code').innerHTML = '<div class="codehead"><span class="filename">Alpha.sol</span></div><pre></pre>';
      d.getElementById(key + 'Code').querySelector('pre').textContent = code;
    } };
}

/* 1. registration */
{
  const app = loadApp(); const s = screen(app, 'one'); const { w, ev } = app;
  ok(typeof cf(w) === 'object', 'the engine is a page global');
  eq(JSON.parse(ev('JSON.stringify(CFBuilder.keys())')), ['swap', 'treasury', 'vault', 'multisend', 'crosschain'], 'the screens registered at load (add a key here when a later phase registers one)');
  let threw = '';
  try { cf(w).register({ key: 'x' }); } catch (e) { threw = e.message; }
  ok(/missing/.test(threw), 'a config without the required parts is refused', threw);
  const m1 = cf(w).register(s.cfg);
  const m2 = cf(w).register(s.cfg);
  ok(m1 === m2, 'registering the same key twice returns the same screen');
  ok(JSON.parse(ev('JSON.stringify(CFBuilder.keys())')).includes('one'), 'the new screen is listed');
}

/* 2. listeners and observers are bound once */
{
  const app = loadApp(); const s = screen(app, 'two'); const { w } = app;
  const calls = [];
  const orig = s.sec.addEventListener.bind(s.sec); s.sec.addEventListener = (t, ...r) => { calls.push(t); return orig(t, ...r); };
  const MO = w.MutationObserver; let observers = 0;
  w.MutationObserver = class extends MO { constructor(cb) { super(cb); observers++; } };
  cf(w).register(s.cfg); const first = [calls.length, observers];
  for (let i = 0; i < 10; i++) { cf(w).register(s.cfg); cf(w).renderAll(); cf(w).render('two'); }
  eq([calls.length, observers], first, 'redrawing and registering again adds no listener and no observer');
  eq(calls.sort(), ['change', 'input'], 'a screen listens to input and change on its own section only');
}

/* 3. summary and the honest four steps */
{
  const app = loadApp(); const s = screen(app, 'three'); const { w, ev } = app; const d = s.d;
  ev("pendingSource = { name: '', code: '' }");
  cf(w).register(s.cfg); ok(s.d.querySelectorAll('#threeSum .tst-row').length === 0, 'registering does not draw by itself (the first draw comes with renderAll at page load)'); cf(w).render('three');
  const rows = [...d.querySelectorAll('#threeSum .tst-row')];
  eq(rows.map((r) => r.querySelector('dt').textContent), ['Name', 'Fee'], 'summary rows come from the screen');
  ok(rows[1].querySelector('dd').classList.contains('mono'), 'a mono row is marked');
  eq(s.prog(), ['done', 'todo', 'locked', 'locked'], 'before any code: configuration done, the rest not started');
  eq(s.head(), ['done', 'current', 'todo'], 'header steps follow');
  ok(d.querySelector('#threeStages li[data-step="generate"]').getAttribute('aria-current') === 'step', 'one step is marked current for assistive technology');
  d.getElementById('three_fee').value = 'x'; d.getElementById('three_fee').dispatchEvent(new w.Event('input', { bubbles: true }));
  eq(s.prog()[0], 'attention', 'a problem makes the configuration step an attention step');
  ok(/Fee must be a number/.test(s.texts()[0]), 'and shows the first problem', s.texts()[0]);
  eq(s.head(), ['current', 'todo', 'todo'], 'with a problem, configure is the current step');
  d.getElementById('three_fee').value = '7'; d.getElementById('three_fee').dispatchEvent(new w.Event('input', { bubbles: true }));
  // generation
  s.generate(); await tick();
  eq(s.prog(), ['done', 'done', 'todo', 'todo'], 'after a real generation: code done, review and deploy NOT claimed');
  ok(/Alpha\.sol, 2 lines generated/.test(s.texts()[1]), 'the generated text names the real file and line count', s.texts()[1]);
  ok(s.code.getAttribute('data-sig') && /^\d+$/.test(s.code.getAttribute('data-gen-at')), 'what was generated, and when, lives in two attributes on the panel');
  ok(!!s.code.querySelector('.tst-lang') && s.code.querySelector('.tst-lang').textContent === 'Solidity', 'the code head gets a language label');
  ok(!!s.code.querySelector('.mat-badge'), 'and a maturity badge for the template');
  eq(s.head(), ['done', 'done', 'current'], 'header: only the deploy step remains');
  ev('lastAuditReport = { score: 99, summary: "great", findings: [] }'); cf(w).render('three');
  eq(s.prog()[2], 'todo', 'Review & Audit never turns done on its own, even with an audit report in memory');
  // stale: the form changed
  d.getElementById('three_name').value = 'Beta'; d.getElementById('three_name').dispatchEvent(new w.Event('input', { bubbles: true }));
  eq(s.prog()[1], 'stale', 'changing the form after generating marks the code stale');
  ok(/form changed/.test(s.texts()[1]), 'with an explanation', s.texts()[1]);
  d.getElementById('three_name').value = 'Alpha'; d.getElementById('three_name').dispatchEvent(new w.Event('input', { bubbles: true }));
  eq(s.prog()[1], 'done', 'putting the form back makes it current again');
  // stale: the network changed
  ev("activeNetwork = 'sepolia'; updateSideNet();"); await tick();
  eq(s.prog()[1], 'stale', 'a network change makes the code stale (it is network specific)');
  ev("activeNetwork = 'arc'; updateSideNet();"); await tick();
  eq(s.prog()[1], 'done', 'and back');
  // stale: someone else took the deploy buffer
  ev("pendingSource = { name: 'Other', code: 'contract Z {}', template: 'treasury' }"); cf(w).render('three');
  eq(s.prog()[1], 'stale', 'another contract in the deploy buffer makes the code stale');
  ok(/different contract/.test(s.texts()[1]), 'and says so', s.texts()[1]);
  ev(`pendingSource = { name: 'Alpha', code: 'contract A {}\\n// two', template: 'three-tpl' }`); cf(w).render('three');
  eq(s.prog()[1], 'done', 'the right contract back in the buffer is current again');
  ev(`pendingSource = { name: 'Alpha', code: 'contract CHANGED {}', template: 'three-tpl' }`); cf(w).render('three');
  eq(s.prog()[1], 'stale', 'the same template with different code is not "the code on screen"');
}

/* 4. deployment: only a confirmed, newer, same-name history entry counts */
{
  const app = loadApp(); const s = screen(app, 'four'); const { w, ev } = app; const d = s.d;
  cf(w).register(s.cfg);
  const hist = (e) => w.localStorage.setItem(ev('HISTORY_KEY'), JSON.stringify(e));
  hist([{ name: 'Alpha', address: '0x' + '1'.repeat(40), network: 'arc', abi: [], txHash: '0x1', timestamp: Date.now() - 100000 }]);
  s.generate(); await tick();
  eq(s.prog()[3], 'todo', 'a deployment from before this generation does not count');
  hist([{ name: 'Beta', address: '0x' + '2'.repeat(40), network: 'arc', abi: [], txHash: '0x2', timestamp: Date.now() + 5 }]);
  cf(w).render('four');
  eq(s.prog()[3], 'todo', 'a newer deployment of a different contract does not count');
  ev("addToDeployHistory({ name: 'Alpha', address: '0x' + '3'.repeat(40), network: 'arc', abi: [], txHash: '0x3' })"); await tick();
  eq(s.prog()[3], 'done', 'a recorded deployment of this contract after generation is shown');
  ok(/Confirmed on Arc Testnet at 0x3{40}/.test(s.texts()[3]), 'with the real network and address', s.texts()[3]);
  eq(s.head(), ['done', 'done', 'done'], 'and the header steps are all done');
  ok(s.code.getAttribute('data-gen-at') !== null, 'the panel remembers when it was generated');
  // nothing generated: nothing deployed, whatever the history says
  const b = screen(app, 'fourb'); cf(w).register(b.cfg); cf(w).render('fourb');
  eq(b.prog(), ['done', 'todo', 'locked', 'locked'], 'a screen that never generated shows no deployment');
}

/* 5. the engine only reads */
{
  const app = loadApp(); const s = screen(app, 'five'); const { w, ev } = app; const d = s.d;
  const calls = []; w.alert = (m) => calls.push('alert'); w.fetch = () => { calls.push('fetch'); return Promise.reject(new Error('no')); };
  cf(w).register(s.cfg); s.generate(); await tick();
  const snap = () => JSON.stringify({ f: [...d.querySelectorAll('#sec-five input')].map((i) => i.value), p: ev('JSON.stringify(pendingSource)'), net: ev('activeNetwork'), mode: ev('multichainMode'), ls: Object.keys(w.localStorage).sort().map((k) => [k, w.localStorage.getItem(k)]) , ps: ev('pendingSource === pendingSource') });
  const before = snap();
  for (let i = 0; i < 5; i++) { cf(w).renderAll(); cf(w).decorateCode('five'); }
  eq(snap(), before, 'rendering changes no field, no buffer, no network, no mode and no stored value');
  eq(calls, [], 'rendering never alerts and never calls the network');
  const src = fs.readFileSync(path.join(root, 'builder.js'), 'utf8');
  ok(!/innerHTML|insertAdjacentHTML|outerHTML|document\.write/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'builder.js never writes markup from strings');
  ok(!/\beval\b|new Function|setTimeout\(\s*['"`]/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), 'builder.js uses no eval');
  ok(!/\.value\s*=[^=]|localStorage\.setItem|\.click\(\)|compile|deployFromBuffer|genSwap|fetch\(/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'builder.js never writes a field or storage and never calls a generator, the compiler or the network');
  ok(!/\bpendingSource\s*=[^=]/.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), 'builder.js never assigns the deploy buffer');
}

/* 6. text safety and robustness */
{
  const app = loadApp(); const s = screen(app, 'six'); const { w } = app; const d = s.d;
  const evil = '<img src=x onerror="window.__x=1"><script>window.__x=2</script>';
  cf(w).register(s.cfg);
  d.getElementById('six_name').value = evil; d.getElementById('six_name').dispatchEvent(new w.Event('input', { bubbles: true }));
  ok(!d.querySelector('#sec-six img, #sec-six script') && w.__x === undefined, 'values reach the page as text, never as markup');
  ok(d.querySelector('#sixSum dd').textContent.includes('onerror'), 'and are shown literally');
  const orphan = loadApp(); const ghost = screen(orphan, 'ghost'); ghost.d.getElementById('ghostSum').remove();
  let threw = false; try { cf(orphan.w).register(ghost.cfg); cf(orphan.w).renderAll(); } catch (_) { threw = true; }
  ok(!threw, 'a screen whose summary element is missing does not break the page', String(threw));
}

/* 7. several screens, wording overrides, hooks */
{
  const app = loadApp(); const a = screen(app, 'sa'); const b = screen(app, 'sb', { texts: { genDone: () => 'custom done', configDone: () => 'custom config' }, guidance: (v) => { app.w.__guided = v.name; } });
  const { w } = app;
  cf(w).register(a.cfg); cf(w).register(b.cfg);
  cf(w).renderAll(); b.generate(); await tick();
  ok(a.prog()[1] === 'todo' && b.prog()[1] === 'done', 'screens are independent: generating one does not complete the other');
  eq(b.texts().slice(0, 2), ['custom config', 'custom done'], 'a screen can replace the wording of a step');
  ok(!/custom/.test(a.texts().join('')), 'and the other screen keeps the default wording');
  eq(w.__guided, 'Alpha', 'the guidance hook runs with the screen values');
  ok(a.code.querySelector('.tst-lang') === null && !!b.code.querySelector('.tst-lang'), 'only the screen that generated gets a decorated code head');
  cf(w).renderAll();
  eq(JSON.parse(app.ev('JSON.stringify(CFBuilder.keys())')), ['swap', 'treasury', 'vault', 'multisend', 'crosschain', 'sa', 'sb'], 'renderAll walks every registered screen');
  // the Deployment Mode control refreshes every screen
  w.eval("setMultichainMode('portable')"); await tick();
  ok(b.d.querySelector('#sbSum .tst-row') !== null, 'a mode change redraws every registered screen without errors');
  eq(app.pageErrors.length, 0, 'no page errors');
}

/* 8. Swap / AMM runs on the engine */
{
  const app = loadApp(); const { w, ev } = app;
  ok(ev("typeof swbRender === 'function' && typeof SWB_CONFIG === 'object' && SWB_CONFIG.key === 'swap'"), 'Swap / AMM is a config for the engine');
  const sw = cf(w).genState('swap');
  eq(sw && sw.s, 'todo', 'its generation state starts as todo');
  const cfg = JSON.parse(ev("JSON.stringify(Object.keys(SWB_CONFIG).sort())"));
  ok(['codePanel', 'isTemplate', 'key', 'prefix', 'problems', 'progress', 'read', 'section', 'signature', 'stages', 'summary', 'summaryRows'].every((k) => cfg.includes(k)), 'it provides every required part');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
