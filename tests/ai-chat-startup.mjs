// Phase 8.3.1: AI -> Solidity opens clean. Saved chats are loaded and listed but none is selected at startup or when the
// section is entered from another one; unsent drafts and pending requests are protected; history is never rewritten by this.
import { loadApp } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const KEY = 'cf_ai_chats_v1';
const AMM = 'A minimal constant-product AMM for two ERC-20 tokens. Add/remove liquidity and swap both ways. 0.3% fee on swaps goes to liquidity providers.';
const STORED = JSON.stringify([
  { id: 'old1', msgs: [{ role: 'user', content: AMM }, { role: 'assistant', content: 'Error: AI is not configured on this deployment.', kind: 'error' }] },
  { id: 'old2', title: 'Escrow idea', msgs: [{ role: 'user', content: 'two party escrow' }, { role: 'assistant', content: 'Here is an **escrow**.' }, { role: 'user', content: 'add a timeout' }, { role: 'assistant', content: 'Done, with a timeout.' }] },
  { id: 'old3', msgs: [{ role: 'user', content: 'a staking contract' }, { role: 'assistant', content: 'ok staking' }] },
]);

function fresh(storage) {
  const a = loadApp(storage ? { storage: { [KEY]: storage } } : {}); const { ev } = a; const d = a.w.document;
  ev('window.__aiCalls = []; window.__aiReply = "fine"; aiFetch = async (action, payload) => { window.__aiCalls.push({ action, payload }); return { text: window.__aiReply, outputTokens: 1 }; };');
  const go = async (sec) => { d.querySelector(`.nav-item[data-section="${sec}"]`).click(); await tick(); };
  return { ...a, d, go, calls: () => JSON.parse(ev('JSON.stringify(window.__aiCalls)')), raw: () => a.w.localStorage.getItem(KEY) };
}
const rows = (a) => [...a.d.querySelectorAll('#aiConvs .ai-conv')];
const titles = (a) => rows(a).map((r) => r.querySelector('.ai-conv-title').textContent);

/* 1. fresh start, empty storage */
{
  const a = fresh(); const { d, ev } = a;
  eq(ev('aiState.activeId'), null, 'empty storage: nothing selected');
  eq(ev('aiState.convs.length'), 0, 'empty storage: no conversation is created just by loading');
  ok(!!d.querySelector('#aiThread .ai-empty') && d.querySelector('#aiThread .ai-empty h3').textContent === 'What would you like to build?', 'empty storage: the welcome screen is shown');
  eq(d.getElementById('aiComposer').value, '', 'empty storage: the composer is empty');
  eq(d.getElementById('aiStatus').getAttribute('data-state'), 'ready', 'empty storage: status is Ready');
  eq(a.raw(), null, 'empty storage: nothing was written');
  await a.go('nlai');
  ok(!!d.querySelector('#aiThread .ai-empty') && rows(a).length === 0 && a.raw() === null, 'empty storage: entering the section keeps it clean and writes nothing');
}

/* 2. fresh start with saved chats: all listed, none opened, nothing rewritten */
{
  const a = fresh(STORED); const { d, ev } = a;
  eq(ev('aiState.convs.length'), 3, 'saved: all three conversations are loaded');
  eq(ev('aiState.activeId'), null, 'saved: no conversation is selected automatically');
  ok(!!d.querySelector('#aiThread .ai-empty'), 'saved: the welcome screen is shown');
  ok(!d.querySelector('#aiThread .ai-msg') && !new RegExp(AMM.slice(0, 30)).test(d.getElementById('aiThread').textContent), 'saved: the old AMM prompt is not on screen');
  eq(d.getElementById('aiComposer').value, '', 'saved: the composer is empty');
  eq(d.getElementById('aiMainTitle').textContent, 'New chat', 'saved: the header does not show an old title');
  eq(titles(a).length, 3, 'saved: every saved chat is in the sidebar');
  ok(rows(a).every((r) => !r.classList.contains('active') && !r.querySelector('.ai-conv-title').hasAttribute('aria-current')), 'saved: none is highlighted');
  ok(d.querySelectorAll('#aiThread .ai-chip').length === 6, 'saved: the six suggestion chips are there');
  eq(d.getElementById('aiStatus').getAttribute('data-state'), 'ready', 'saved: status is Ready');
  eq(a.raw(), STORED, 'saved: startup did not rewrite the stored history');
  await a.go('nlai');
  ok(!!d.querySelector('#aiThread .ai-empty') && titles(a).length === 3, 'saved: entering the section is clean with the list intact');
  eq(a.raw(), STORED, 'saved: entering the section did not rewrite the stored history');
  ok(a.calls().length === 0, 'saved: no AI request was made');
}

/* 3. old chats open on demand and can be continued */
{
  const a = fresh(STORED); const { d, ev } = a;
  await a.go('nlai');
  rows(a)[1].querySelector('.ai-conv-title').click(); await tick();
  eq(ev('aiState.activeId'), 'old2', 'open: choosing an old chat selects it');
  eq(d.querySelectorAll('#aiThread .ai-msg').length, 4, 'open: its full history is shown');
  ok(/escrow/.test(d.getElementById('aiThread').textContent) && /timeout/.test(d.getElementById('aiThread').textContent), 'open: the messages are there');
  eq(d.getElementById('aiMainTitle').textContent, 'Escrow idea', 'open: the header shows its title');
  ok(!d.querySelector('#aiThread .ai-empty'), 'open: the welcome screen is gone');
  d.getElementById('aiComposer').value = 'now add arbitration'; ev('aiChatSend()'); await tick(); await tick();
  const p = a.calls().pop().payload.messages;
  ok(p.length === 5 && p[0].content === 'two party escrow' && p[4].content === 'now add arbitration', 'open: continuing sends the old history plus the new message', JSON.stringify(p.map((m) => m.role)));
  eq(ev('aiState.convs.find((c) => c.id === "old2").msgs.length'), 6, 'open: the reply is added to that same chat');
  eq(ev('aiState.convs.length'), 3, 'open: no extra conversation appeared');
  eq(JSON.parse(a.raw()).find((c) => c.id === 'old2').msgs.length, 6, 'open: it is saved');
  ok(JSON.parse(a.raw()).find((c) => c.id === 'old1').msgs[0].content === AMM, 'open: the other chats are untouched in storage');
}

/* 4. New Chat and the first message */
{
  const a = fresh(STORED); const { d, ev } = a;
  await a.go('nlai');
  ev('aiChatNew()');
  eq([ev('aiState.convs.length'), ev('aiState.convs[0].msgs.length')], [4, 0], 'new: New Chat shows an empty conversation');
  ok(!!d.querySelector('#aiThread .ai-empty') && d.querySelectorAll('#aiThread .ai-chip').length === 6, 'new: with the welcome screen and chips');
  eq(a.raw(), STORED, 'new: an empty chat is not written to storage');
  ev('aiChatNew()'); ev('aiChatNew()');
  eq(ev('aiState.convs.length'), 4, 'new: repeated New Chat never stacks empty chats');
  d.getElementById('aiComposer').value = 'brand new idea'; ev('aiChatSend()'); await tick(); await tick();
  eq(ev('aiState.convs.length'), 4, 'new: the first message goes into that chat (no duplicate)');
  eq(JSON.parse(a.raw()).length, 4, 'new: storage now has four chats, each with messages');
  ok(JSON.parse(a.raw()).every((c) => c.msgs.length > 0), 'new: and none is empty');
  ok(a.calls().pop().payload.messages.length === 1, 'new: the request carries only the new message, none of the old chats');
  // send from the welcome screen with nothing selected: exactly one new chat
  const b = fresh(STORED);
  b.d.getElementById('aiComposer').value = 'straight from the welcome screen'; b.ev('aiChatSend()'); await tick(); await tick();
  eq([b.ev('aiState.convs.length'), JSON.parse(b.raw()).length], [4, 4], 'new: sending from the welcome screen creates exactly one chat');
  // New Chat then leaving: the empty chat disappears from the list
  const c = fresh(STORED);
  c.ev('aiChatNew()'); await c.go('nlai'); await c.go('swap'); await c.go('nlai');
  eq([c.ev('aiState.convs.length'), titles(c).length], [3, 3], 'new: an unused empty chat does not pile up in the list');
}

/* 5. coming back from another section */
{
  const a = fresh(STORED); const { d, ev } = a;
  await a.go('nlai');
  rows(a)[0].querySelector('.ai-conv-title').click(); await tick();
  eq(ev('aiState.activeId'), 'old1', 'return: an old chat is open');
  await a.go('swap'); await a.go('nlai');
  eq(ev('aiState.activeId'), null, 'return: coming back starts clean');
  ok(!!d.querySelector('#aiThread .ai-empty') && d.getElementById('aiComposer').value === '', 'return: welcome screen, empty composer');
  eq(titles(a).length, 3, 'return: the chat is still in the list');
  eq(a.raw(), STORED, 'return: nothing in storage changed');
  rows(a)[0].querySelector('.ai-conv-title').click(); await tick();
  ok(d.querySelectorAll('#aiThread .ai-msg').length === 2, 'return: it opens again with its history');
  // the exact sequence from the brief
  for (const s of ['home', 'nlai', 'swap', 'nlai', 'deploy', 'nlai']) { await a.go(s); }
  ok(!!d.querySelector('#aiThread .ai-empty') && ev('aiState.convs.length') === 3 && a.raw() === STORED, 'return: Home, AI, Swap, AI, Deploy, AI ends clean with all data intact');
  ok(a.pageErrors.length === 0, 'return: no page error', a.pageErrors.join(';'));
}

/* 6. work in progress is protected */
{
  // an unsent draft keeps the open chat
  const a = fresh(STORED); const { d, ev } = a;
  await a.go('nlai');
  rows(a)[1].querySelector('.ai-conv-title').click(); await tick();
  d.getElementById('aiComposer').value = 'half written follow-up'; ev('aiAutoGrow(document.getElementById("aiComposer"))');
  await a.go('swap'); await a.go('nlai');
  eq(ev('aiState.activeId'), 'old2', 'draft: the open chat is kept');
  eq(d.getElementById('aiComposer').value, 'half written follow-up', 'draft: the unsent text is kept');
  // a draft on the welcome screen is kept too
  const w = fresh(STORED);
  await w.go('nlai'); w.d.getElementById('aiComposer').value = 'typed on the welcome screen'; await w.go('swap'); await w.go('nlai');
  ok(w.d.getElementById('aiComposer').value === 'typed on the welcome screen' && w.ev('aiState.activeId') === null, 'draft: text typed on the welcome screen survives');
  // a request in flight keeps the session
  const b = fresh(STORED);
  b.ev('aiFetch = (action, payload) => { window.__aiCalls.push({ action, payload }); return new Promise((res) => { window.__resolve = res; }); };');
  await b.go('nlai');
  rows(b)[2].querySelector('.ai-conv-title').click(); await tick();
  b.d.getElementById('aiComposer').value = 'question while I leave'; b.ev('aiChatSend()'); await tick();
  await b.go('swap'); await b.go('nlai');
  eq(b.ev('aiState.activeId'), 'old3', 'pending: the chat that is waiting stays open');
  ok(!!b.d.querySelector('#aiThread .ai-typing') && b.d.getElementById('aiSendBtn').disabled, 'pending: its activity indicator and disabled Send are still there');
  b.ev('window.__resolve({ text: "late but welcome" })'); await tick(); await tick();
  ok(/late but welcome/.test(b.d.getElementById('aiThread').textContent), 'pending: the reply arrives in that chat');
  eq(b.ev('aiState.convs.find((c) => c.id === "old3").msgs.length'), 4, 'pending: and is stored there');
  // things that are not a section entry never reset
  const c = fresh(STORED);
  await c.go('nlai'); rows(c)[1].querySelector('.ai-conv-title').click(); await tick();
  await c.go('nlai');
  eq(c.ev('aiState.activeId'), 'old2', 'stay: clicking AI -> Solidity again while in it does not reset');
  c.ev('aiChatToggleSidebar()'); c.ev('aiChatToggleSidebar()');
  c.w.dispatchEvent(new c.w.Event('resize'));
  const junk = c.d.createElement('div'); c.d.body.appendChild(junk); junk.setAttribute('class', 'x'); c.d.body.classList.add('probe'); c.d.body.classList.remove('probe'); await tick();
  c.ev('aiChatRender()'); c.ev('aiSyncWorkspace()'); await tick();
  eq(c.ev('aiState.activeId'), 'old2', 'stay: collapsing the list, resizing, DOM changes and re-renders do not reset');
  ok(c.d.querySelectorAll('#aiThread .ai-msg').length === 4, 'stay: the conversation is still on screen');
}

/* 7. other ways of leaving and coming back */
{
  const a = fresh(STORED); const { d, ev } = a;
  await a.go('nlai');
  ev("aiState.convs.find((c) => c.id === 'old1').msgs.push({ role: 'user', content: 'x' });");
  ev('window.__aiReply = "```solidity\\npragma solidity ^0.8.24;\\ncontract Z {}\\n```";');
  d.getElementById('aiComposer').value = 'make Z'; ev('aiChatSend()'); await tick(); await tick();
  d.querySelector('#aiThread .ai-act-primary').click(); await tick(); await tick();
  ok(d.getElementById('sec-deploy').style.display === 'block' && ev('pendingSource.template') === 'ai', 'paths: Use in ContractForge still hands the contract over');
  await a.go('nlai');
  ok(!!d.querySelector('#aiThread .ai-empty') && ev('aiState.convs.length') >= 3 && ev('pendingSource.name') === 'Z', 'paths: coming back is clean, history and the contract are kept');
  // delete / delete all still behave
  const n = ev('aiState.convs.length');
  rows(a)[0].querySelector('[aria-label^="Delete chat"]').click(); await tick();
  eq(ev('aiState.convs.length'), n - 1, 'paths: Delete removes one chat');
  ev('aiChatAskDeleteAll()'); d.querySelector('#aiDelConfirm .ai-del-yes').click(); await tick();
  ok(ev('aiState.convs.length') === 0 && !!d.querySelector('#aiThread .ai-empty') && a.raw() === '[]', 'paths: Delete All empties history and shows the welcome screen');
}

/* 8. the drawer on a phone, and the layout of Phase 8.3 is untouched */
{
  const a = fresh(STORED); const { d, ev, w } = a;
  w.matchMedia = (q) => ({ matches: /max-width:\s*760px/.test(q) });
  await a.go('nlai');
  ev('aiSetSidebar(false)');
  rows(a)[1].querySelector('.ai-conv-title').click(); await tick();
  ok(d.getElementById('aiSidebar').classList.contains('collapsed') && ev('aiState.activeId') === 'old2', 'phone: choosing a chat closes the drawer and opens the chat');
  ev('aiSetSidebar(false)'); ev('aiChatNew()');
  ok(d.getElementById('aiSidebar').classList.contains('collapsed') && !!d.querySelector('#aiThread .ai-empty'), 'phone: New Chat closes the drawer and shows the welcome screen');
  w.matchMedia = undefined;
  ok(d.body.classList.contains('ai-workspace') && d.getElementById('aiThread').getAttribute('role') === 'log', 'layout: the workspace class and the live log region are intact');
  ok(['aiChat', 'aiSidebar', 'aiConvs', 'aiThread', 'aiComposer', 'aiSendBtn', 'aiGenerating', 'aiCount', 'nl_network', 'nl_complexity'].every((id) => !!d.getElementById(id)), 'layout: every id is still there');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
