// Phase 10.1: Deploy History (section 10). The records are untouched (same key, shape, order and indexes); the view only decides what to DRAW.
// These tests prove: nothing is written when the list is drawn or filtered, every button acts on the record's storage index even when others are
// hidden, all 16 networks are shown with the right kind and LIVE flag, the 50-record limit behaves as before (and the page says so), and
// stored text never becomes markup or an attribute.
import fs from 'node:fs';
import path from 'node:path';
import { loadApp, root, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const HK = 'contractforge_deploy_history';
const hx = (n) => '0x' + String(n).padStart(40, '0');
const tx = (n) => '0x' + String(n).padStart(64, 'a');

function fresh() {
  const a = loadApp(); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  const alerts = []; a.w.alert = (m) => alerts.push(m);
  const confirms = []; const ctl = { answer: true }; a.w.confirm = (m) => { confirms.push(m); return ctl.answer; };
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await tick(); await tick(); };
  const rowsEl = () => [...d.querySelectorAll('#historyList .hist-row')];
  const names = () => rowsEl().map((r) => r.querySelector('.hname').textContent);
  const seed = (entries) => { a.w.localStorage.setItem(HK, JSON.stringify(entries)); a.ev('renderHistory()'); };
  const stored = () => JSON.parse(a.w.localStorage.getItem(HK) || '[]');
  const setv = async (id, v, evt = 'input') => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new a.w.Event(evt, { bubbles: true })); await tick(); };
  return { ...a, d, go, rowsEl, names, seed, stored, setv, alerts, confirms, ctl };
}
const NETS = (a) => JSON.parse(a.ev('JSON.stringify(Object.entries(NETWORKS).map(([k, n]) => [k, n.label, !!n.isMainnet, n.chainIdDec, n.explorer || ""]))'));

/* 1. the page: same ids and handlers, plus the new controls */
{
  const a = fresh(); const { d } = a;
  eq([...d.querySelectorAll('#sec-history [data-onclick]')].map((e) => e.getAttribute('data-onclick')).filter((x) => /clear|export/i.test(x)), ['clearHistory()', 'exportHistory()'], 'Clear All and Export JSON keep their handlers');
  ok(!!d.getElementById('historyList') && !!d.getElementById('sec-history'), 'ids: sec-history, historyList');
  eq(d.querySelector('#sec-history .section-head h2').textContent, 'Deploy History', 'the heading is unchanged');
  eq(a.ev('HISTORY_KEY'), HK, 'the storage key is unchanged');
  eq([...d.querySelectorAll('#histScope .hist-segbtn')].map((b) => b.textContent + ':' + b.getAttribute('aria-pressed')), ['All:true', 'Testnets:false', 'Mainnets:false'], 'the scope control: All is pressed first');
  ok(d.querySelector('label[for="histNet"]') && d.querySelector('label[for="histSearch"]'), 'a label for the network list and the search box');
  eq([...d.getElementById('sec-history').outerHTML.matchAll(/\son[a-z]+="/gi)].length, 0, 'csp: no inline handler attribute');
  eq(d.getElementById('historyList').textContent, 'No deployments yet. Deploy a contract in section 07.', 'an empty history: the original message');
  eq([d.getElementById('histStats').hidden, d.getElementById('histCount').textContent, d.getElementById('histNote').hidden], [true, '', true], 'and no summary, count or note');
  const hs = css.slice(css.indexOf('/* ---- Deploy History (section 10)'), css.indexOf('/* ---- Builder screens that share'));
  const sels = []; hs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, s) => { sels.push(...s.split(',').map((x) => x.trim())); return ''; });
  eq(sels.filter((s) => s && !s.startsWith('@') && !/^(\.light )?#sec-history(?![\w-])/.test(s)), [], 'css: every new rule is scoped to #sec-history');
  ok(/@media \(max-width:640px\)\{#sec-history \.hist-row\{grid-template-columns:minmax\(0,1fr\)/.test(hs) && /@media \(max-width:1100px\)/.test(hs), 'css: a tablet layout and a single column on phones');
  ok(/#sec-history \.hist-row\{display:grid;grid-template-columns:minmax\(150px,200px\) minmax\(0,1fr\) auto auto/.test(hs), 'css: desktop rows are four columns');
  eq(a.pageErrors.length, 0, 'no page errors on load');
}

/* 2. all 16 networks, one deployment each */
{
  const a = fresh(); const { d } = a; const nets = NETS(a);
  const entries = nets.map(([k], i) => ({ name: 'Token' + i, address: hx(i + 1), network: k, abi: [], txHash: tx(i + 1), timestamp: 1_700_000_000_000 + i * 1000 })).reverse();   // storage is newest first
  a.seed(entries);
  eq(a.rowsEl().length, 16, '16 rows');
  const cards = Object.fromEntries([...d.querySelectorAll('#histStats .hist-stat')].map((c) => [c.querySelector('.hist-k').textContent, c.querySelector('b').textContent]));
  eq([cards.Deployments, cards.Networks, cards['Live (mainnet)'], cards.Latest], ['16', '16', '9', 'Token15'], 'summary: 16 deployments, 16 networks, 9 live, latest is the newest timestamp');
  for (const [k, label, main, chain, explorer] of nets) {
    const row = a.rowsEl().find((r) => r.querySelector('.hnet').textContent === label);
    ok(!!row, `${k}: has a row with its label`);
    if (!row) continue;
    eq([!!row.querySelector('.hist-live'), row.getAttribute('data-live') === '1', row.querySelector('.hist-kind').textContent], [main, main, (main ? 'Mainnet' : 'Testnet') + ' · chain ' + chain], `${k}: ${main ? 'LIVE, ' : 'no LIVE, '}the kind and the chain id`);
    eq(!!row.querySelector('.hbtns [data-onclick^="openExternal"]'), !!explorer, `${k}: an Explorer button exactly when the network has an explorer`);
    eq(row.querySelector('.haddr').textContent.length, 42, `${k}: the full address is shown`);
  }
  eq(d.querySelectorAll('#histNet option').length, 17, 'the network list offers all 16 networks and "All networks"');
  eq([...d.querySelectorAll('#histNet option')].every((o) => o.value === '' || /^\d+$/.test(o.value)), true, 'its values are positions, never text from storage');
  /* 3. filters: only what is drawn changes */
  const before = a.w.localStorage.getItem(HK);
  let writes = 0; const setItem = a.w.Storage.prototype.setItem, removeItem = a.w.Storage.prototype.removeItem;
  a.w.Storage.prototype.setItem = function (...x) { writes++; return setItem.apply(this, x); }; a.w.Storage.prototype.removeItem = function (...x) { writes++; return removeItem.apply(this, x); };
  d.querySelector('[data-scope="mainnet"]').click(); await tick();
  eq([a.rowsEl().length, d.getElementById('histCount').textContent, d.querySelector('[data-scope="mainnet"]').getAttribute('aria-pressed')], [9, 'Showing 9 of 16', 'true'], 'Mainnets: 9 rows and the count says so');
  eq(a.rowsEl().every((r) => r.getAttribute('data-live') === '1'), true, 'every mainnet row is flagged');
  d.querySelector('[data-scope="testnet"]').click(); await tick();
  eq([a.rowsEl().length, a.rowsEl().some((r) => r.getAttribute('data-live') === '1')], [7, false], 'Testnets: 7 rows and none is LIVE');
  d.querySelector('[data-scope="all"]').click(); await tick();
  await a.setv('histNet', String([...d.querySelectorAll('#histNet option')].find((o) => o.textContent === 'Base').value), 'change');
  eq(a.names().length, 1, 'one network: one row'); eq(a.rowsEl()[0].querySelector('.hnet').textContent, 'Base', 'the right one');
  await a.setv('histNet', '', 'change');
  await a.setv('histSearch', 'token3');
  eq(a.names(), ['Token3'], 'search by name (case-insensitive)');
  await a.setv('histSearch', hx(5).toUpperCase().slice(0, 12));
  ok(a.names().includes('Token4'), 'search by address');
  await a.setv('histSearch', 'zzz');
  ok(/No deployment matches these filters/.test(d.getElementById('historyList').textContent) && !!d.querySelector('#historyList [data-onclick="histResetFilters()"]'), 'no match: a message and a reset button');
  d.querySelector('[data-onclick="histResetFilters()"]').click(); await tick();
  eq([a.rowsEl().length, d.getElementById('histSearch').value, d.getElementById('histNet').value, d.querySelector('[data-scope="all"]').getAttribute('aria-pressed')], [16, '', '', 'true'], 'reset puts every filter back');
  eq([writes, a.w.localStorage.getItem(HK) === before], [0, true], 'drawing, filtering and resetting never wrote to storage');
  a.w.Storage.prototype.setItem = setItem; a.w.Storage.prototype.removeItem = removeItem;
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 4. buttons act on the record's storage index, whatever is hidden */
{
  const a = fresh(); const { d } = a;
  const list = [['Alpha', 'arc'], ['Bravo', 'ethereum'], ['Charlie', 'arc'], ['Delta', 'base'], ['Echo', 'arc']].map(([name, network], i) => ({ name, address: hx(i + 1), network, abi: [{ type: 'function', name: 'ping', inputs: [], outputs: [], stateMutability: 'view' }], txHash: tx(i + 1), timestamp: Date.now() - i * 60000 }));
  a.seed(list);
  d.querySelector('[data-scope="testnet"]').click(); await tick();
  eq(a.names(), ['Alpha', 'Charlie', 'Echo'], 'testnets view: the three Arc Testnet deployments');
  const idxOf = (n) => { const r = a.rowsEl().find((x) => x.querySelector('.hname').textContent === n); return Number(r.querySelector('.hbtn-del').getAttribute('data-onclick').match(/\((\d+)\)/)[1]); };
  eq([idxOf('Alpha'), idxOf('Charlie'), idxOf('Echo')], [0, 2, 4], 'the buttons carry the index each record has in storage (not its place in the filtered list)');
  const clip = []; Object.defineProperty(a.w.navigator, 'clipboard', { value: { writeText: (x) => { clip.push(x); return Promise.resolve(); } }, configurable: true });
  a.rowsEl().find((r) => r.querySelector('.hname').textContent === 'Echo').querySelector('[data-onclick^="copyHistoryAddress"]').click(); await tick(); await tick();
  eq(clip, [hx(5)], 'Copy copies the address of that record');
  a.rowsEl().find((r) => r.querySelector('.hname').textContent === 'Charlie').querySelector('.hbtn-del').click(); await tick();
  eq(a.stored().map((e) => e.name), ['Alpha', 'Bravo', 'Delta', 'Echo'], 'removing from a filtered view removes exactly that record');
  eq(a.names(), ['Alpha', 'Echo'], 'and the view follows');
  a.rowsEl().find((r) => r.querySelector('.hname').textContent === 'Echo').querySelector('[data-onclick^="loadHistoryIntoPlayground"]').click(); await tick();
  eq([d.getElementById('sec-playground').style.display, d.getElementById('pg_address').value], ['block', hx(5)], 'Playground opens the record behind the button, not its neighbour') ;
  eq(a.stored().length, 4, 'opening the Playground changes nothing in storage');
  // Export JSON gives the whole list whatever the filter, Clear asks first
  let blobs = []; a.w.Blob = class { constructor(p) { blobs.push(p.join('')); } }; a.w.URL.createObjectURL = () => 'blob:x'; a.w.HTMLAnchorElement.prototype.click = function () {};
  await a.go('history'); d.querySelector('[data-scope="testnet"]').click(); await tick();
  d.querySelector('[data-onclick="exportHistory()"]').click(); await tick();
  eq(JSON.parse(blobs[0]).map((e) => e.name), ['Alpha', 'Bravo', 'Delta', 'Echo'], 'Export JSON exports the full list, not the filtered one');
  a.ctl.answer = false; d.querySelector('[data-onclick="clearHistory()"]').click(); await tick();
  eq([a.confirms.length, a.stored().length], [1, 4], 'Clear All asks first and does nothing when you say no');
  a.ctl.answer = true; d.querySelector('[data-onclick="clearHistory()"]').click(); await tick();
  eq([a.stored().length, d.getElementById('historyList').textContent], [0, 'No deployments yet. Deploy a contract in section 07.'], 'and clears everything when you say yes');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 5. the other readers of the history are untouched: Home, Playground, and the builders' "Deployed" stage */
{
  const a = fresh(); const { d } = a;
  a.seed([{ name: 'Recent', address: hx(9), network: 'sepolia', abi: [], txHash: tx(9), timestamp: Date.now() }]);
  ok(/Recent/.test(d.getElementById('homeRecent').textContent), 'Home still lists the recent deployment');
  ok(a.ev('typeof pgRefreshDeployments') === 'function', 'the Playground list function still exists');
  a.ev('genSwap()'); await tick(); await tick();
  const name = a.ev('pendingSource.name');
  a.ev(`addToDeployHistory({ name: '${name}', address: '${hx(11)}', network: 'arc', abi: [], txHash: '${tx(11)}' })`); await tick(); await tick();
  eq(a.stored()[0].name, name, 'addToDeployHistory still puts the newest record first');
  eq(Object.keys(a.stored()[0]).sort(), ['abi', 'address', 'name', 'network', 'timestamp', 'txHash'], 'and the record keeps its shape');
  const stage = [...d.querySelectorAll('#swbProgress li')].find((l) => l.querySelector('b').textContent === 'Deployment');
  eq(stage && stage.dataset.state, 'done', 'the Swap builder still reads the history to show "Deployment"');
  ok(d.querySelector('#historyList .hist-row .hname').textContent === name, 'and the new record is drawn first');
}

/* 6. the 50-record limit is as it was, and the page says what it means */
{
  const a = fresh(); const { d } = a;
  a.ev("localStorage.removeItem(HISTORY_KEY); for (let i = 1; i <= 49; i++) addToDeployHistory({ name: 'C' + i, address: '0x' + String(i).padStart(40, '0'), network: 'arc', abi: [], txHash: '0x' + i });");
  eq([a.stored().length, d.getElementById('histNote').hidden], [49, true], '49 records: no note');
  a.ev("addToDeployHistory({ name: 'C50', address: '0x' + String(50).padStart(40, '0'), network: 'arc', abi: [], txHash: '0x50' })");
  eq([a.stored().length, a.stored()[0].name, d.getElementById('histNote').hidden], [50, 'C50', false], '50 records: the note appears');
  ok(/The history is full \(50 entries\): a new deployment is not recorded/.test(d.getElementById('histNote').textContent), 'it says new deployments are not recorded');
  a.ev("addToDeployHistory({ name: 'C51', address: '0x' + String(51).padStart(40, '0'), network: 'arc', abi: [], txHash: '0x51' })");
  eq([a.stored().length, a.stored().map((e) => e.name).includes('C51'), a.stored().map((e) => e.name).includes('C1')], [50, false, true], 'known behaviour, unchanged: the 51st is dropped and the oldest stays (the note is true)');
  a.ev("deleteHistoryEntry(0)");
  eq([a.stored().length, d.getElementById('histNote').hidden], [49, true], 'removing one makes room and the note goes away');
}

/* 7. corrupted and odd records */
{
  const a = fresh(); const { d } = a;
  a.seed([{ name: 'Good', address: hx(1), network: 'arc', abi: [], txHash: tx(1), timestamp: Date.now() }, { name: 'NoAddr', address: 'nope', network: 'arc' }, null, { name: 'Short', address: '0x12', network: 'arc' }, { name: 'Odd', address: hx(2), network: 'not-a-network', abi: [], txHash: 'zzz', timestamp: 'later' }, { name: 'NoTx', address: hx(3), network: 'base', abi: [] }]);
  eq(a.names(), ['Good', 'Odd', 'NoTx'], 'only records with a valid address are drawn');
  ok(/3 stored entries have an invalid address and cannot be shown/.test(d.getElementById('histNote').textContent), 'the note counts the ones that cannot be shown');
  const odd = a.rowsEl()[1];
  eq([odd.querySelector('.hnet').textContent, odd.querySelector('.hist-kind').textContent, !!odd.querySelector('[data-onclick^="openExternal"]'), odd.querySelector('.htime').textContent], ['not-a-network', 'Network not in this app', false, 'unknown time'], 'an unknown network: its key as text, no Explorer button, no "NaN"');
  eq([odd.querySelector('.hist-tx').textContent, a.rowsEl()[2].querySelector('.hist-tx').textContent], ['txnot a valid transaction hash', 'txnot recorded'], 'a bad or missing transaction hash is said so');
  const good = a.rowsEl()[0];
  ok(!!good.querySelector('.hist-link') && good.querySelector('.hist-link').getAttribute('data-onclick') === `openExternal('${a.ev('NETWORKS.arc.explorer')}/tx/${tx(1)}')`, 'a valid hash is a link to the network explorer');
  a.w.localStorage.setItem(HK, '{not json'); a.ev('renderHistory()');
  eq(d.getElementById('historyList').textContent, 'No deployments yet. Deploy a contract in section 07.', 'unreadable storage: the empty state, no error');
  a.w.localStorage.setItem(HK, '{"a":1}'); a.ev('renderHistory()');
  eq([d.getElementById('historyList').textContent, a.pageErrors.length], ['No deployments yet. Deploy a contract in section 07.', 0], 'storage that is not a list: the empty state, no error');
}

/* 8. hostile text from storage stays text, in elements and in attributes */
{
  const a = fresh(); const { d } = a;
  const evil = '<img src=x onerror="window.__xss=1">"\'><script>window.__xss=2</script>';
  a.seed([{ name: evil, address: hx(1), network: evil, abi: [], txHash: evil, timestamp: Date.now() }, { name: evil, address: hx(2), network: 'arc', abi: [], txHash: tx(2), timestamp: Date.now() }]);
  eq([d.querySelectorAll('#sec-history img, #sec-history script').length, a.w.__xss], [0, undefined], 'no element came out of the payload and nothing ran');
  ok(d.getElementById('historyList').textContent.includes('onerror'), 'the payload is visible as text');
  const attrs = [...d.querySelectorAll('#sec-history *')].flatMap((e) => [...e.attributes].map((x) => x.name + '=' + x.value));
  eq(attrs.filter((x) => /__xss|onerror|<img|<script/.test(x)), [], 'no attribute holds any of it');
  await a.setv('histSearch', evil); eq(d.querySelectorAll('#sec-history img').length, 0, 'a payload typed in the search box is not drawn as markup either');
}

/* 9. times, opening the tab, and repeated navigation */
{
  const a = fresh(); const { d } = a;
  a.seed([{ name: 'Old', address: hx(1), network: 'arc', abi: [], txHash: tx(1), timestamp: Date.now() - 3 * 3600000 }]);
  eq(a.rowsEl()[0].querySelector('.htime').textContent, '3h ago', 'the relative time is as before');
  ok(a.rowsEl()[0].querySelector('.hist-date').textContent.length > 4, 'and the exact date is shown beside it');
  a.w.localStorage.setItem(HK, JSON.stringify([{ name: 'Fresh', address: hx(2), network: 'arc', abi: [], txHash: tx(2), timestamp: Date.now() }]));
  await a.go('history');
  eq(a.names(), ['Fresh'], 'opening the tab redraws from storage');
  for (let k = 0; k < 6; k++) { await a.go(['home', 'swap', 'deploy', 'history'][k % 4]); }
  await a.go('history');
  eq([d.querySelectorAll('#historyList .hist-row').length, d.querySelectorAll('#histStats .hist-stat').length, d.querySelectorAll('#histNet option').length], [1, 4, 2], 'repeated navigation leaves no duplicated rows, cards or options');
  for (const id of ['sec-swap', 'sec-treasury', 'sec-vault', 'sec-deploy']) ok(!d.getElementById(id).querySelector('#histStats, #histScope'), `${id} is untouched`);
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
