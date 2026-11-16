// Phase 8.4: the Deployment Mode control. One shared control (mounted in every creation section and in the AI composer) over the
// one existing state: multichainMode / setMultichainMode / cf_mc_mode. The old four-button panel is gone from the sidebar.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const KEYS = ['single', 'portable', 'multi', 'cross'];
const CREATION = ['simple', 'swap', 'treasury', 'vault', 'multisend', 'crosschain', 'wizard'];

function fresh(loadOpts) {
  const a = loadApp(loadOpts); const d = a.w.document;
  const key = (el, k, extra = {}) => { const e = new a.w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...extra }); (el || d.activeElement || d.body).dispatchEvent(e); return e; };
  const triggers = () => [...d.querySelectorAll('.dm-trigger')];
  const labels = () => triggers().map((t) => t.querySelector('.dm-v').textContent);
  const pop = () => d.getElementById('dmPopover');
  const opts = () => [...d.querySelectorAll('#dmPopover .dm-opt')];
  const go = async (sec) => { d.querySelector(`.nav-item[data-section="${sec}"]`).click(); await tick(); };
  return { ...a, d, key, triggers, labels, pop, opts, go, mode: () => a.ev('multichainMode') };
}

/* 1. the old selector is gone, the rest of the sidebar stays */
{
  const a = fresh(); const { d } = a;
  ok(!d.getElementById('mcSelector') && !d.querySelector('.spine .mc-box, .spine .mc-btn, .spine .mc-seg, .spine .dm-mount'), 'sidebar: the four-button Multichain mode panel is gone');
  ok(!!d.querySelector('.spine .net-pill') && !!d.getElementById('themeBtn') && !!d.getElementById('resetSavedBtn'), 'sidebar: active network, Appearance and Reset saved data are still there');
  eq(d.querySelectorAll('[data-mode]:not(.home-card):not(.dm-opt)').length, 0, 'sidebar: no stray mode buttons anywhere');
}

/* 2. where the control is */
{
  const a = fresh(); const { d } = a;
  for (const s of CREATION) eq(d.querySelectorAll(`#sec-${s} .section-head .dm-mount .dm-trigger`).length, 1, 'placement: ' + s + ' has one control in its heading');
  eq(d.querySelectorAll('#sec-nlai .ai-controls .dm-mount .dm-trigger').length, 1, 'placement: the AI composer toolbar has one control');
  const kids = [...d.querySelector('#sec-nlai .ai-controls').children].map((c) => c.className.split(' ')[0]);
  eq(kids, ['ai-ctl', 'ai-ctl', 'dm-mount', 'ai-attach'], 'placement: AI toolbar order is Network, Complexity, Deployment Mode, Attach');
  eq(d.querySelectorAll('.dm-mount').length, 9, 'placement: nine places in total (the global bar and eight builders), all from one shared renderer');
  eq(d.querySelectorAll('#dmPopover').length, 1, 'placement: one popover for all of them');
  eq(d.querySelector('#dmPopover').parentElement, d.body, 'placement: the popover lives on body (no parent can clip it)');
  ok(['deploy', 'auditor', 'playground', 'history', 'tests'].every((s) => !d.querySelector(`#sec-${s} .dm-mount`)), 'placement: not added to non-creation sections');
  ok(a.triggers().every((t) => /^Deployment Mode:\s*Single network/.test(t.textContent.replace('▾', '').trim().replace(/\s+/g, ' '))), 'label: every control reads "Deployment Mode: Single network" at first', JSON.stringify(a.labels()));
  ok(a.triggers().every((t) => t.getAttribute('aria-haspopup') === 'listbox' && t.getAttribute('aria-expanded') === 'false' && t.getAttribute('aria-controls') === 'dmPopover' && /Deployment mode: Single network/.test(t.getAttribute('aria-label'))), 'a11y: triggers declare the popup, the state and a full label');
  ok(a.triggers().every((t) => t.tagName === 'BUTTON' && t.type === 'button'), 'a11y: triggers are real buttons');
}

/* 3. the four options, with the descriptions the code really has */
{
  const a = fresh(); const { d, ev } = a;
  eq(a.opts().map((o) => o.dataset.dmMode), KEYS, 'options: all four modes, in the existing order');
  const real = JSON.parse(ev('JSON.stringify(MC_MODES)'));
  eq(a.opts().map((o) => o.querySelector('b').textContent), KEYS.map((k) => real[k].label), 'options: titles are the existing labels');
  eq(a.opts().map((o) => o.querySelector('.dm-d').textContent), KEYS.map((k) => real[k].desc), 'options: descriptions are the existing ones (one source)');
  ok(a.opts().every((o) => o.querySelector('svg.dm-ico path') && o.querySelector('svg.dm-check') && o.getAttribute('role') === 'option' && o.type === 'button'), 'options: each has an icon, a selected indicator and role=option');
  eq(new Set(a.opts().map((o) => o.querySelector('svg.dm-ico path').getAttribute('d'))).size, 4, 'options: each mode has its own icon');
  eq(a.pop().getAttribute('role'), 'listbox', 'a11y: the popover is a listbox');
  ok(a.pop().hidden, 'popover: closed at start');
  ok(/Multi-deploy: ?|Portable, plus deploy the same contract to several networks/.test(real.multi.desc) && /Circle CCTP V2/.test(real.cross.desc) && /Same source on every chain/.test(real.portable.desc), 'options: the texts describe what the code does');
  ok(!/innerHTML/.test(fs.readFileSync(path.join(root, 'multichain.js'), 'utf8').split('/* ---------------- UI: deployment mode control')[1] || ''), 'safety: the control is built with the DOM API, no innerHTML');
}

/* 4. one state, everything follows it */
{
  const a = fresh(); const { d, ev, w } = a;
  eq(a.mode(), 'single', 'state: default is single');
  a.triggers()[0].click();
  ok(!a.pop().hidden && a.triggers()[0].getAttribute('aria-expanded') === 'true', 'state: a click opens the popover');
  eq(a.opts().filter((o) => o.getAttribute('aria-selected') === 'true').map((o) => o.dataset.dmMode), ['single'], 'state: the current mode is marked selected');
  a.opts()[2].click(); await tick();
  eq(a.mode(), 'multi', 'state: choosing Multi-deploy sets the existing multichainMode');
  eq(w.localStorage.getItem('cf_mc_mode'), 'multi', 'state: and the existing cf_mc_mode storage key');
  ok(a.pop().hidden, 'state: the popover closes after choosing');
  ok(a.labels().length === 9 && a.labels().every((l) => l === 'Multi-deploy'), 'sync: all nine controls show Multi-deploy', JSON.stringify(a.labels()));
  ok(/Multi-deploy mode/.test(d.getElementById('netBanner').textContent), 'sync: the network banner follows (existing behaviour)');
  eq(d.getElementById('multiDeployPanel').style.display, 'block', 'sync: the multi-deploy panel appears (existing behaviour)');
  ok(d.querySelector('#homeModes .home-card.active') && d.querySelector('#homeModes .home-card.active').dataset.mode === 'multi', 'sync: the Home cards follow too');
  ev("setMultichainMode('cross')");
  ok(a.labels().every((l) => l === 'Crosschain'), 'sync: the existing setter alone refreshes every control (another caller changes the mode)');
  d.querySelector('#homeModes .home-card[data-mode="portable"]').click(); await tick();
  ok(a.mode() === 'portable' && a.labels().every((l) => l === 'Portable'), 'sync: the Home cards (existing control) still change the mode and the new controls follow');
  ev("setMultichainMode('nonsense')");
  eq(a.mode(), 'portable', 'state: an unknown mode is still rejected by the existing setter');
  // navigation
  for (const s of ['swap', 'treasury', 'wizard', 'nlai', 'crosschain', 'home', 'simple']) { await a.go(s); ok(a.labels().every((l) => l === 'Portable'), 'navigation: still Portable after ' + s); }
  // the same value everywhere after a long run of changes
  for (let i = 0; i < 12; i++) ev(`setMultichainMode('${KEYS[i % 4]}')`);
  ok(a.labels().every((l) => l === a.ev('MC_MODES[multichainMode].label')), 'sync: twelve changes later every control still agrees with the state');
}

/* 5. persistence across a reload follows the existing behaviour */
{
  for (const [stored, label] of [['portable', 'Portable'], ['multi', 'Multi-deploy'], ['cross', 'Crosschain']]) {
    const a = fresh({ storage: { cf_mc_mode: stored } });
    ok(a.mode() === stored && a.labels().every((l) => l === label) && a.opts().find((o) => o.getAttribute('aria-selected') === 'true').dataset.dmMode === stored, 'reload: ' + stored + ' is restored and shown everywhere');
  }
  const bad = fresh({ storage: { cf_mc_mode: 'bogus' } });
  ok(bad.mode() === 'single' && bad.labels().every((l) => l === 'Single network'), 'reload: an invalid stored mode falls back to single');
  const none = fresh();
  ok(none.mode() === 'single' && none.w.localStorage.getItem('cf_mc_mode') === null, 'reload: nothing is written just by loading');
}

/* 6. no duplicated listeners */
{
  const a = fresh(); const { w, d, ev } = a;
  let adds = 0;
  for (const t of [d, w, d.body]) { const orig = t.addEventListener.bind(t); t.addEventListener = (...args) => { adds++; return orig(...args); }; }
  for (let i = 0; i < 25; i++) ev('renderModeSelector()');
  for (let i = 0; i < 8; i++) ev(`setMultichainMode('${KEYS[i % 4]}')`);
  a.triggers()[0].click(); a.key(a.opts()[0], 'Escape'); a.triggers()[1].click(); a.opts()[1].click(); await tick();
  eq(adds, 0, 'listeners: redrawing, switching, opening and closing adds no listener');
  eq(d.querySelectorAll('.dm-trigger').length, 9, 'listeners: still exactly one trigger per place after many redraws');
  eq(d.querySelectorAll('.dm-trigger .dm-v').length, 9, 'listeners: and no duplicated content inside them');
  eq(d.querySelectorAll('#dmPopover .dm-opt').length, 4, 'listeners: still four options');
  a.triggers()[2].click();
  ok(!a.pop().hidden, 'listeners: one click opens it (a doubled handler would toggle it shut again)');
  a.key(a.d.activeElement, 'Escape');
}

/* 7. choosing a mode is configuration only */
{
  const a = fresh(); const { d, ev, w } = a;
  ev(`window.__calls = []; ['compileAndDeploy','compileSource','compilePending','deployCompiled','deployFromBuffer','switchNetwork','connectWallet'].forEach((n) => { if (typeof window[n] === 'function') { const o = window[n]; window[n] = (...x) => { window.__calls.push(n); }; } });
    aiFetch = async () => { window.__calls.push('aiFetch'); return { text: 'x' }; };`);
  let rpc = 0; w.ethereum = { request: async () => { rpc++; return null; }, on() {} };
  let fetches = 0; w.fetch = async () => { fetches++; return { ok: false, status: 404 }; };
  ev("renderSimpleForm('escrow'); pendingSource = { name: 'Keep', code: 'pragma solidity ^0.8.24;\\ncontract Keep { uint256 x; }', template: 'erc20' }; renderCurrentContract(); activeNetwork = 'arcMain';");
  const field = d.querySelector('#sec-simple input, #sec-simple textarea'); if (field) field.value = 'typed by the user';
  d.getElementById('aiComposer').value = 'unsent draft';
  ev("aiState.convs = [{ id: 'q1', msgs: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'there' }] }]; aiState.activeId = 'q1'; aiSave();");
  const stored = w.localStorage.getItem('cf_ai_chats_v1');
  const src0 = ev('pendingSource.code'), net0 = ev('activeNetwork');
  for (const k of KEYS) { a.triggers()[3].click(); a.opts()[KEYS.indexOf(k)].click(); await tick(); }
  eq(ev('JSON.stringify(window.__calls)'), '[]', 'safety: no compile, deploy, wallet or AI function ran');
  eq([rpc, fetches], [0, 0], 'safety: no wallet request and no network request');
  eq(ev('activeNetwork'), net0, 'safety: the selected network did not change');
  eq(ev('pendingSource.code'), src0, 'safety: the contract source is untouched');
  eq(ev('pendingSource.template'), 'erc20', 'safety: and its template');
  ok(field ? field.value === 'typed by the user' : true, 'safety: form input is kept');
  eq(d.getElementById('aiComposer').value, 'unsent draft', 'safety: the unsent AI draft is kept');
  eq(w.localStorage.getItem('cf_ai_chats_v1'), stored, 'safety: AI conversations are untouched');
  eq(ev('aiState.activeId'), 'q1', 'safety: the open AI conversation stays open');
  eq(ev('pendingCtorArgs.length >= 0'), true, 'safety: the existing ctor panel logic still runs without error');
  ok(a.pageErrors.length === 0, 'safety: no page error', a.pageErrors.join(';'));
}

/* 8. keyboard and focus */
{
  const a = fresh(); const { d } = a;
  await a.go('wizard');
  const t = d.querySelector('#sec-wizard .dm-trigger'); t.focus();
  const e0 = a.key(t, 'ArrowDown');
  ok(!a.pop().hidden && e0.defaultPrevented && d.activeElement === a.opts()[0], 'keys: ArrowDown on the trigger opens it and focuses the selected option');
  a.key(null, 'ArrowDown'); ok(d.activeElement === a.opts()[1], 'keys: ArrowDown moves down');
  a.key(null, 'End'); ok(d.activeElement === a.opts()[3], 'keys: End goes to the last');
  a.key(null, 'ArrowDown'); ok(d.activeElement === a.opts()[0], 'keys: it wraps around');
  a.key(null, 'ArrowUp'); ok(d.activeElement === a.opts()[3], 'keys: ArrowUp wraps back');
  a.key(null, 'Home'); ok(d.activeElement === a.opts()[0], 'keys: Home goes to the first');
  a.key(null, 'Escape');
  ok(a.pop().hidden && d.activeElement === t && t.getAttribute('aria-expanded') === 'false', 'keys: Escape closes it and returns focus to the trigger');
  t.click(); a.key(null, 'ArrowDown'); a.key(null, 'ArrowDown');
  a.opts()[2].focus(); a.opts()[2].click(); await tick();
  ok(a.mode() === 'multi' && a.pop().hidden && d.activeElement === t, 'keys: activating an option sets the mode, closes and returns focus');
  ok(a.labels().every((l) => l === 'Multi-deploy'), 'keys: and every control follows');
  t.click(); a.key(null, 'Tab');
  ok(a.pop().hidden && d.activeElement === t, 'keys: Tab closes it and leaves focus on the trigger so Tab moves on');
  t.click(); d.body.click(); await tick();
  ok(a.pop().hidden, 'outside: a click elsewhere closes it');
  t.click(); d.querySelector('#sec-wizard h2').click(); await tick();
  ok(a.pop().hidden && d.activeElement !== t, 'outside: and does not pull focus back');
  t.click(); t.click(); ok(a.pop().hidden, 'toggle: clicking the trigger again closes it');
  // only one popover open at a time, anchored to the trigger that opened it
  await a.go('swap');
  const t1 = d.querySelector('#sec-wizard .dm-trigger'), t2 = d.querySelector('#sec-swap .dm-trigger');
  t1.click(); t2.click();
  ok(!a.pop().hidden && t1.getAttribute('aria-expanded') === 'false' && t2.getAttribute('aria-expanded') === 'true', 'one at a time: opening a second control closes the first');
  a.key(null, 'Escape');
  // a dialog's own Escape/backdrop is not touched: nothing here is fixed full-screen
  ok(!d.querySelector('#dmPopover.dm-backdrop') && !d.querySelector('.dm-backdrop'), 'overlay: no backdrop or global overlay is added');
}

/* 9. the AI composer */
{
  const a = fresh(); const { d, ev } = a;
  await a.go('nlai');
  ev('window.__aiCalls = []; aiFetch = async (action, payload) => { window.__aiCalls.push({ action, payload }); return { text: "ok", outputTokens: 1 }; };');
  const t = d.querySelector('#sec-nlai .dm-trigger');
  t.click();
  ok(/not sent to the AI/.test(d.querySelector('#dmPopover .dm-note').textContent), 'AI: the popover says the mode is deployment context, not sent to the AI');
  a.opts()[3].click(); await tick();
  eq(a.mode(), 'cross', 'AI: choosing a mode from the composer sets the shared state');
  eq(JSON.parse(ev('JSON.stringify(window.__aiCalls)')).length, 0, 'AI: choosing a mode makes no AI request');
  eq(d.querySelectorAll('#aiThread .ai-msg').length, 0, 'AI: and adds no message');
  ok(!!d.querySelector('#aiThread .ai-empty') && d.getElementById('aiComposer').value === '', 'AI: the welcome screen and the empty composer are untouched');
  d.querySelector('#sec-wizard .dm-trigger').click(); ok(!/not sent to the AI/.test(d.querySelector('#dmPopover .dm-note').textContent) && /Nothing is compiled or deployed/.test(d.querySelector('#dmPopover .dm-note').textContent), 'AI: other places show the general note'); a.key(null, 'Escape');
  for (const m of KEYS) {
    ev(`setMultichainMode('${m}')`);
    d.getElementById('aiComposer').value = 'make a token'; ev('aiChatSend()'); await tick(); await tick();
  }
  const reqs = JSON.parse(ev('JSON.stringify(window.__aiCalls)')).filter((c) => c.action === 'chat');
  ok(reqs.length === 4 && reqs.every((c) => JSON.stringify(Object.keys(c.payload).sort()) === '["complexity","messages","network"]'), 'AI: the request schema is unchanged in every mode (the mode is not added)');
  ok(!reqs.some((c) => /multichain|deployment mode|portable|crosschain/i.test(JSON.stringify(c.payload).replace(/Generic EVM/g, ''))), 'AI: the mode never leaks into what is sent');
  ok(d.body.classList.contains('ai-workspace') && !!d.getElementById('aiSendBtn') && !!d.getElementById('aiThread') && !!d.getElementById('aiComposer'), 'AI: the fullscreen workspace and its ids are intact');
  ok(getComputedStyleOk(a), 'AI: the toolbar control does not change the workspace layout rules');
}
function getComputedStyleOk(a) {
  const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
  return /body\.ai-workspace #sec-nlai \.ai-chat\{flex:1 1 0;height:auto;min-height:360px;min-width:0;max-width:100%;border:0;border-radius:0;\}/.test(css);
}

/* 10. CSS: scoped, stacked correctly, usable on a phone */
{
  const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
  const start = css.indexOf('/* ---- Deployment mode control'), aiStart = css.indexOf('/* ---- AI chat (section 15).');
  ok(start > 0 && start < aiStart, 'css: the shared control rules sit before the AI block');
  const block = css.slice(start, aiStart);
  const sels = []; block.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, sel) => { sels.push(...sel.split(',').map((s) => s.trim())); return ''; });
  eq(sels.filter((s) => s && !s.startsWith('@') && !/^(\.light\s+)?\.dm-|^\.section-head/.test(s)), [], 'css: every shared rule is about the control (.dm-*) or its place in a heading');
  const z = Number((block.match(/\.dm-pop\{[^}]*z-index:(\d+)/) || [])[1]);
  ok(z > 20 && z < 100 && Number(css.match(/\.dc-backdrop\{[^}]*z-index:(\d+)/)[1]) > z, 'css: the popover is above the sticky bar and below the confirmation dialogs', String(z));
  ok(/@media \(max-width:600px\)\{[^@]*\.dm-pop\{[^}]*bottom:max\(8px,env\(safe-area-inset-bottom\)\)[^}]*\}/.test(block), 'css: on a phone the popover becomes a bottom sheet inside the safe area');
  ok(/\.dm-opt\{min-height:56px;\}/.test(block), 'css: touch-sized options on a phone');
  ok(/\.section-head:has\(\.dm-mount\)\{flex-wrap:wrap;\}/.test(block) && /\.section-head \.dm-mount\{flex:1 0 100%;\}/.test(block), 'css: on a phone the control drops under the heading instead of overflowing');
  ok(/\.dm-trigger:focus-visible,\.dm-opt:focus-visible\{outline:2px solid/.test(block), 'css: visible focus');
  ok(/\.light \.dm-trigger/.test(block), 'css: the light theme is covered');
  const ai = css.slice(css.indexOf('#sec-nlai .dm-mount'));
  ok(ai.split('\n').filter((l) => /^[^\s\/@}]/.test(l) && !/^#sec-nlai/.test(l)).length === 0, 'css: the AI toolbar rules are scoped to #sec-nlai');
  ok(!/\.mc-box|\.mc-btn/.test(fs.readFileSync(path.join(root, 'index.html'), 'utf8')), 'html: no old selector markup is left');
}

/* 11. a mount that appears later is picked up, nothing else changes */
{
  const a = fresh(); const { d, ev } = a;
  const m = d.createElement('div'); m.className = 'dm-mount'; d.body.appendChild(m);
  ev('renderModeSelector()');
  eq(m.querySelectorAll('.dm-trigger').length, 1, 'extra: a new mount gets exactly one control on the next refresh');
  ev('renderModeSelector()'); eq(m.querySelectorAll('.dm-trigger').length, 1, 'extra: and is not doubled by another refresh');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
