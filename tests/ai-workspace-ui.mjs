// Phase 8.2: AI -> Solidity as a full-height workspace. While section 15 is open the network bar, the current-contract bar
// and the section heading are hidden (by CSS, under body.ai-workspace); every other section keeps them. Runs in the
// simulated browser with app.css loaded, so getComputedStyle sees the real rules. Geometry (heights, overflow, the
// virtual keyboard) cannot be measured here: that is tests/ai-chat-browser.mjs, which needs Chromium.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');

const a = loadApp(); const { w, ev } = a; const d = w.document;
const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
const cs = (sel, p) => w.getComputedStyle(d.querySelector(sel))[p];
const go = async (sec) => { d.querySelector(`.nav-item[data-section="${sec}"]`).click(); await tick(); };
const inAi = () => d.body.classList.contains('ai-workspace');
const BARS = ['#netBanner', '#currentContract', '#netPanel'];

/* a current contract, so the contract bar has something to show */
ev("pendingSource = { name: 'Wizard', code: 'pragma solidity ^0.8.24;\\ncontract Wizard {}', template: 'erc20' }; renderCurrentContract();");
await tick();
const snap = () => Object.fromEntries(['netBanner', 'currentContract', 'netPanel', 'walletStatus', 'connectBtn', 'balanceBadge'].map((id) => [id, d.getElementById(id)]));
const before = snap();
const inlineBefore = Object.fromEntries(Object.entries(before).map(([k, v]) => [k, v.getAttribute('style')]));
const barHtml = before.currentContract.innerHTML;
ok(/Wizard\.sol/.test(barHtml) && before.currentContract.querySelectorAll('button').length === 6, 'setup: the contract bar has its six actions');

/* 1. state follows the open section */
ok(!inAi(), 'state: off at start (Home)');
for (const b of BARS) ok(cs(b, 'display') !== 'none' || b === '#netPanel', 'start: ' + b + ' is shown outside AI', cs(b, 'display'));
eq(cs('#currentContract', 'display'), 'flex', 'start: the contract bar is a visible flex row');
await go('nlai');
ok(inAi(), 'state: on when AI -> Solidity opens');
for (const b of BARS) eq(cs(b, 'display'), 'none', 'AI: ' + b + ' is hidden');
eq(cs('#sec-nlai .section-head', 'display'), 'none', 'AI: the external "15 AI -> Solidity" heading is hidden');
eq(cs('#sec-nlai', 'display'), 'flex', 'AI: the section is the flex column that holds the chat');
eq(cs('main', 'display'), 'flex', 'AI: main becomes a column the chat can fill');
eq(cs('#sec-nlai .ai-chat', 'height'), 'auto', 'AI: the chat no longer uses the fixed viewport formula');
ok(cs('#sec-nlai .ai-chat', 'flex-grow') === '1', 'AI: the chat grows into the free space');
eq(cs('main', 'overflowY'), 'auto', 'AI: main scrolls by itself if the chat minimum and the footer do not fit (nothing clipped)');
eq(cs('main', 'minWidth'), '0px', 'AI: main may shrink, so a long code line cannot widen the page');
ok(/minmax\(0,\s*1fr\)|minmax\(0, 1fr\)/.test(cs('.app', 'gridTemplateColumns')), 'AI: the page grid column can shrink', cs('.app', 'gridTemplateColumns'));
eq([cs('#sec-nlai', 'flexGrow'), cs('#sec-nlai', 'flexShrink')], ['1', '0'], 'AI: the chat section grows into free space but never shrinks below its content');
eq(cs('.foot-note', 'flexShrink'), '0', 'AI: the footer note keeps its size and stays reachable');
ok(cs('.walletbar', 'display') !== 'none' && cs('#connectBtn', 'display') !== 'none', 'AI: the wallet bar and Connect Wallet stay');
ok(cs('#sec-nlai .ai-sidebar', 'display') === 'flex' && cs('#sec-nlai .ai-main', 'display') === 'flex', 'AI: sidebar and main column are both there');

/* 2. nothing is removed, rewritten or re-bound: only CSS changes */
const mid = snap();
ok(Object.keys(before).every((k) => before[k] === mid[k] && d.body.contains(mid[k])), 'AI: the same DOM nodes are still in the page (nothing removed or duplicated)');
ok(Object.entries(before).every(([k, v]) => v.getAttribute('style') === inlineBefore[k]), 'AI: no inline style was written to the bars');
eq(before.currentContract.innerHTML, barHtml, 'AI: the contract bar content is untouched');
eq(d.querySelectorAll('#netBanner, #currentContract, #netPanel').length, 3, 'AI: no bar was duplicated');
eq(ev('pendingSource.name'), 'Wizard', 'AI: the current contract is kept');
ok(ev("typeof ccTest === 'function' && typeof ccAudit === 'function' && typeof ccPublish === 'function' && typeof copySource === 'function' && typeof downloadSource === 'function' && typeof ccDiscard === 'function'"), 'AI: the contract actions still exist');

/* 3. the header takes over the title; one chat header, one composer */
const head = d.querySelector('#sec-nlai .ai-main-head');
eq(d.querySelectorAll('#sec-nlai .ai-main-head').length, 1, 'header: there is a single chat header');
eq(head.querySelector('h2').textContent, 'ContractForge AI', 'header: compact title');
eq(head.querySelector('.ai-brand-sub').textContent, 'Solidity Development Assistant', 'header: subtitle');
ok(!!head.querySelector('#aiMainTitle') && !!head.querySelector('#aiStatus'), 'header: the conversation title and the status stay in the header');
eq(d.querySelectorAll('#sec-nlai #aiComposer').length + d.querySelectorAll('#sec-nlai #aiThread').length, 2, 'header: one composer and one thread');
ok(!!d.querySelector('#sec-nlai .section-head h2') && d.querySelector('#sec-nlai .section-head h2').textContent === 'AI → Solidity', 'header: the section heading is only hidden, not removed');
eq(d.querySelectorAll('#sec-nlai h2').length, 2, 'header: two h2 exist but only the header one is visible');
for (const sec of ['simple', 'swap', 'deploy', 'home']) ok(!!d.querySelector(`#sec-${sec} h1, #sec-${sec} h2`), 'headings: ' + sec + ' still has its own heading');

/* 4. every other section restores everything; repeated transitions leave nothing behind */
const others = [...d.querySelectorAll('.nav-item')].map((i) => i.dataset.section).filter((s) => s !== 'nlai');
for (const sec of others) {
  await go('nlai'); ok(inAi() && cs('#netBanner', 'display') === 'none', 'cycle: AI hides the bars before ' + sec);
  await go(sec);
  ok(!inAi(), 'cycle: ' + sec + ' turns the workspace off');
  ok(cs('#netBanner', 'display') === 'flex' && cs('#currentContract', 'display') === 'flex', 'cycle: ' + sec + ' shows both bars again', cs('#netBanner', 'display') + '/' + cs('#currentContract', 'display'));
  ok(cs('main', 'display') !== 'flex' && cs('main', 'maxWidth') !== 'none' && cs('main', 'padding') !== '0px', 'cycle: ' + sec + ' gets the original main layout', cs('main', 'maxWidth') + ' ' + cs('main', 'padding'));
  ok(cs('main', 'overflowY') === 'visible' && cs('.app', 'gridTemplateColumns') !== '280px minmax(0px, 1fr)', 'cycle: ' + sec + ' gets the original scrolling and grid back', cs('main', 'overflowY') + ' ' + cs('.app', 'gridTemplateColumns'));
}
// the exact sequence from the brief
for (const step of ['home', 'nlai', 'swap', 'nlai', 'deploy', 'nlai', 'home']) {
  await go(step);
  const on = step === 'nlai';
  ok(inAi() === on && (cs('#netBanner', 'display') === 'none') === on && (cs('#currentContract', 'display') === 'none') === on, 'sequence: ' + step + (on ? ' is the workspace' : ' is normal'));
}
for (let i = 0; i < 20; i++) { await go('nlai'); await go('simple'); }
ok(!inAi() && cs('#netBanner', 'display') === 'flex', 'sequence: twenty round trips leave nothing behind');
eq(d.body.className.split(/\s+/).filter((c) => c === 'ai-workspace').length, 0, 'sequence: the class is not left on the body');
ok(Object.keys(before).every((k) => snap()[k] === before[k]) && Object.entries(before).every(([k, v]) => v.getAttribute('style') === inlineBefore[k]), 'sequence: same nodes, same inline styles after all of it');
eq(before.currentContract.innerHTML, barHtml, 'sequence: the contract bar content survived');
eq(ev('pendingSource.name'), 'Wizard', 'sequence: the current contract survived');

/* 5. other ways in and out of the section */
await go('nlai');
ev('window.__aiReply = "```solidity\\npragma solidity ^0.8.24;\\ncontract FromChat {}\\n```"; aiFetch = async () => ({ text: window.__aiReply, outputTokens: 1 });');
d.getElementById('aiComposer').value = 'make one'; ev('aiChatSend()'); await tick(); await tick();
ok(inAi(), 'paths: sending a message keeps the workspace on');
d.querySelector('#aiThread .ai-act-primary').click(); await tick(); await tick();
eq(ev('pendingSource.template'), 'ai', 'paths: Use in ContractForge still adopts the code (template ai)');
ok(/maturity: experimental/.test(ev('pendingSource.code')) && ev('pendingSource.name') === 'FromChat', 'paths: and still stamps it experimental');
ok(!inAi() && d.getElementById('sec-deploy').style.display === 'block', 'paths: Use leaves AI for Compile & Deploy and the workspace turns off');
eq(cs('#netBanner', 'display'), 'flex', 'paths: the network bar is back on the deploy page');
ok(/FromChat\.sol/.test(d.getElementById('currentContract').textContent) && cs('#currentContract', 'display') === 'flex', 'paths: the contract bar shows the adopted contract');
ev("document.querySelector('.nav-item[data-section=\"nlai\"]').click()"); await tick();
ok(inAi(), 'paths: back into AI');
ev("document.querySelector('.nav-item[data-section=\"playground\"]').click()"); await tick();
ok(!inAi(), 'paths: and out to the playground');
ok(a.pageErrors.length === 0, 'no page error during any of this', a.pageErrors.join(';'));

/* 6. the chat still works inside the workspace */
await go('nlai');
ev("aiState.convs = [{ id: 'k1', msgs: [{ role: 'user', content: 'hello' }, { role: 'assistant', content: 'hi' }] }]; aiState.activeId = 'k1'; aiChatRender();");
eq(d.getElementById('aiMainTitle').textContent, 'hello', 'chat: the conversation title is shown in the header');
ok(!d.getElementById('aiSendBtn').disabled && !!d.getElementById('aiThread') && d.getElementById('aiThread').getAttribute('role') === 'log', 'chat: composer and thread are intact');
eq(ev('aiState.convs.length'), 1, 'chat: history is untouched by navigation');

/* 7. the rules themselves */
const ws = css.slice(css.indexOf('/* ---- Phase 8.2'));
ok(ws.length > 200, 'css: the workspace block exists');
ok(/body\.ai-workspace #netBanner,body\.ai-workspace #currentContract,body\.ai-workspace #netPanel\{display:none !important;\}/.test(ws), 'css: exactly the two bars (and the network panel that hangs off the banner) are hidden');
ok(!/walletbar|connectBtn|#walletStatus|balanceBadge|\.spine|\.nav-item/.test(ws), 'css: nothing here touches the wallet bar or the menu');
ok(/100dvh/.test(ws) && !/calc\(100dvh/.test(ws), 'css: the workspace fills the viewport without a hand-tuned offset');
ok(/body\.ai-workspace #sec-nlai \.ai-chat\{flex:1 1 0;height:auto;min-height:420px;min-width:0;max-width:100%;\}/.test(ws), 'css: the chat takes the remaining height');
ok(!/body\.ai-workspace\s*\{/.test(ws) && ws.split('\n').filter((l) => /^[^\s\/@}]/.test(l) && !/^(body\.ai-workspace|#sec-nlai|\.light|\})/.test(l)).length === 0, 'css: every rule in the block is scoped');
ok(/\.ai-chat\{[^}]*clamp\(540px/.test(css), 'css: the Phase 8 sizing stays as the fallback when the class is absent');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
