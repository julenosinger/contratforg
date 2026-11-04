/* ======================================================================
   09 — ABI PLAYGROUND (v2) + shared function-card helpers used by the Test Lab
   Loaded after app.js. Works with a connected wallet (writes) or read-only through the
   network's public RPC (reads and events).
   ====================================================================== */
let playgroundContract = null;   // signer-bound when a wallet is connected, read-only otherwise
let playgroundABI = null;
let pgReadContract = null;       // always read-only
let pgTarget = null;             // network key the loaded contract lives on
let eventSubscriptions = [];
let pgFilter = 'all';
let pgCalls = [];
let pgPoll = null;
const pgProviders = {};

/* ---------------- small helpers ---------------- */
function pgNetKey(){ return (pgTarget && NETWORKS[pgTarget]) ? pgTarget : activeNetwork; }

function pgReadProvider(key){
  const n = NETWORKS[key];
  if(!pgProviders[key] || pgProviders[key].__rpc !== n.rpc){
    const p = new ethers.providers.StaticJsonRpcProvider(n.rpc, { chainId: n.chainIdDec, name: key });
    p.__rpc = n.rpc;
    pgProviders[key] = p;
  }
  return pgProviders[key];
}

function pgSig(item){ return ethers.utils.Fragment.from(item).format(ethers.utils.FormatTypes.sighash); }
function pgIsRead(item){ return item.type === 'function' && (item.stateMutability === 'view' || item.stateMutability === 'pure'); }
function pgShort(a){ return a ? a.slice(0, 8) + '…' + a.slice(-4) : ''; }

/* decimal string × 10^dec, using exact integer maths ("1.5", 6 -> "1500000") */
function pgScaleUp(str, dec){
  const m = /^\s*(\d+)(?:\.(\d+))?\s*$/.exec(String(str));
  if(!m) return null;
  const frac = (m[2] || '');
  if(frac.length > dec) return null;
  return (BigInt(m[1]) * 10n ** BigInt(dec) + BigInt((frac + '0'.repeat(dec)).slice(0, dec) || '0')).toString();
}

/* ---------------- argument inputs ---------------- */
function pgPlaceholder(inp){
  const t = inp.type;
  if(t.endsWith(']')){
    const base = t.replace(/\[\d*\]$/, '');
    return base === 'address' ? '["0x…", "0x…"]  or one per line' : '[1, 2, 3]  or one per line';
  }
  if(t.startsWith('tuple')) return '{"field": "value"}  or  ["a", "b"]';
  return t;
}

function pgIsDeadlineName(inp){ return /uint/.test(inp.type) && /^_?(deadline|expiry|expiration|validuntil)$/i.test(inp.name || ''); }

function pgInputHtml(prefix, idx, i, inp, ctx){
  const id = prefix + '_arg_' + idx + '_' + i;
  const t = inp.type;
  const label = escapeHtml(inp.name || ('arg' + i)) + ' <span style="color:#5C6B65">(' + escapeHtml(t) + ')</span>';
  let control;
  if(t === 'bool'){
    control = '<select id="' + id + '"><option value="">choose…</option><option value="true">true</option><option value="false">false</option></select>';
  } else if(t.endsWith(']') || t.startsWith('tuple')){
    control = '<textarea id="' + id + '" rows="2" placeholder="' + escapeHtml(pgPlaceholder(inp)) + '"></textarea>';
  } else {
    const ph = pgIsDeadlineName(inp) ? 'empty = 30 minutes from now' : pgPlaceholder(inp);
    control = '<input id="' + id + '" placeholder="' + escapeHtml(ph) + '" />';
  }
  const chips = [];
  if(t === 'address'){
    if(ctx.me) chips.push(['me', ctx.meLabel || 'my wallet']);
    if(ctx.self) chips.push(['self', 'this contract']);
    if(ctx.usdc) chips.push(['usdc', 'USDC']);
    if(ctx.eurc) chips.push(['eurc', 'EURC']);
    (ctx.extra || []).forEach(x => chips.push(['extra:' + x.key, x.label]));
  } else if(/^u?int/.test(t) && !t.endsWith(']')){
    chips.push(['x6', '×10⁶'], ['x18', '×10¹⁸']);
    if(pgIsDeadlineName(inp)) chips.push(['plus30', '+30 min'], ['plus1d', '+1 day']);
  }
  const chipHtml = chips.map(c => '<button type="button" class="fn-chip" data-chip="' + c[0] + '" data-target="' + id + '" data-prefix="' + prefix + '">' + c[1] + '</button>').join('');
  return '<div class="fn-row"><label>' + label + '</label><div class="fn-field">' + control + (chipHtml ? '<div class="fn-chips">' + chipHtml + '</div>' : '') + '</div></div>';
}

/* context providers per card prefix, so the same cards work for the Playground and the Test Lab */
const PG_CTX = {};
PG_CTX.pg = function(){
  const key = pgNetKey(), n = NETWORKS[key] || {};
  return { me: account || '', self: playgroundContract ? playgroundContract.address : '', usdc: n.usdc || '', eurc: n.eurc || '' };
};

function pgApplyChip(btn){
  const target = document.getElementById(btn.dataset.target);
  if(!target) return;
  const ctx = (PG_CTX[btn.dataset.prefix] || (() => ({})))();
  const kind = btn.dataset.chip;
  if(kind === 'me') target.value = ctx.me;
  else if(kind === 'self') target.value = ctx.self;
  else if(kind === 'usdc') target.value = ctx.usdc;
  else if(kind === 'eurc') target.value = ctx.eurc;
  else if(kind.startsWith('extra:')){ const x = (ctx.extra || []).find(e => e.key === kind.slice(6)); if(x) target.value = x.value; }
  else if(kind === 'x6' || kind === 'x18'){
    const scaled = pgScaleUp(target.value, kind === 'x6' ? 6 : 18);
    if(scaled !== null) target.value = scaled;
  } else if(kind === 'plus30') target.value = String(Math.floor(Date.now() / 1000) + 1800);
  else if(kind === 'plus1d') target.value = String(Math.floor(Date.now() / 1000) + 86400);
  target.dispatchEvent(new Event('input', { bubbles: true }));
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest && e.target.closest('.fn-chip');
  if(btn) pgApplyChip(btn);
});

/* ---------------- argument parsing ---------------- */
function pgCoerce(type, raw, comps, label){
  const fail = (msg) => { throw new Error(label + ': ' + msg); };
  if(type.endsWith(']')){
    const m = /^(.*)\[(\d*)\]$/.exec(type);
    const base = m[1], size = m[2];
    let items;
    const txt = String(raw == null ? '' : raw).trim();
    if(!txt) fail('required');
    if(txt.startsWith('[')){ try{ items = JSON.parse(txt); }catch(_){ fail('not valid JSON, for example [1, 2, 3]'); } }
    else items = txt.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if(!Array.isArray(items)) fail('enter a list');
    if(size && items.length !== Number(size)) fail('needs exactly ' + size + ' item(s)');
    return items.map((it, k) => pgCoerce(base, typeof it === 'string' ? it : (typeof it === 'object' && it !== null ? JSON.stringify(it) : String(it)), comps, label + '[' + k + ']'));
  }
  if(type === 'tuple'){
    const txt = String(raw == null ? '' : raw).trim();
    if(!txt) fail('required');
    let obj; try{ obj = JSON.parse(txt); }catch(_){ fail('not valid JSON'); }
    return (comps || []).map((c, k) => {
      const v = Array.isArray(obj) ? obj[k] : obj[c.name];
      if(v === undefined) fail('missing "' + (c.name || k) + '"');
      return pgCoerce(c.type, typeof v === 'string' ? v : (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)), c.components, label + '.' + (c.name || k));
    });
  }
  const v = String(raw == null ? '' : raw).trim();
  if(type === 'string') return String(raw == null ? '' : raw);
  if(!v) fail('required');
  if(type === 'address'){
    if(!/^0x[0-9a-fA-F]{40}$/.test(v)) fail('enter a valid address (0x + 40 hex characters)');
    if(/[a-f]/.test(v.slice(2)) && /[A-F]/.test(v.slice(2))){
      try{ return ethers.utils.getAddress(v); }catch(_){ fail('address checksum is wrong'); }
    }
    return v;
  }
  if(type === 'bool'){
    if(v !== 'true' && v !== 'false') fail('choose true or false');
    return v === 'true';
  }
  const im = /^(u?)int(\d*)$/.exec(type);
  if(im){
    const bits = Number(im[2] || 256), unsigned = im[1] === 'u';
    const clean = v.replace(/_/g, '');
    if(!(unsigned ? /^(0x[0-9a-fA-F]+|\d+)$/ : /^-?(0x[0-9a-fA-F]+|\d+)$/).test(clean)) fail('enter a whole number' + (unsigned ? ' (no negatives)' : ''));
    const big = clean.startsWith('-') ? -BigInt(clean.slice(1)) : BigInt(clean);
    const max = unsigned ? (1n << BigInt(bits)) - 1n : (1n << BigInt(bits - 1)) - 1n;
    const min = unsigned ? 0n : -(1n << BigInt(bits - 1));
    if(big > max || big < min) fail('too large for ' + type);
    return big.toString();
  }
  const bm = /^bytes(\d*)$/.exec(type);
  if(bm){
    if(!/^0x[0-9a-fA-F]*$/.test(v)) fail('enter hex data starting with 0x');
    if(bm[1] && v.length !== 2 + Number(bm[1]) * 2) fail('needs exactly ' + bm[1] + ' bytes');
    if(!bm[1] && v.length % 2) fail('hex data needs an even number of digits');
    return v;
  }
  return v;
}

function pgReadArgs(prefix, idx, item){
  return (item.inputs || []).map((inp, i) => {
    const el = document.getElementById(prefix + '_arg_' + idx + '_' + i);
    let raw = el ? el.value : '';
    if(!String(raw).trim() && pgIsDeadlineName(inp)) raw = String(Math.floor(Date.now() / 1000) + 1800);
    return pgCoerce(inp.type, raw, inp.components, inp.name || ('argument ' + (i + 1)));
  });
}

function pgReadValue(prefix, idx, decimals){
  const el = document.getElementById(prefix + '_val_' + idx);
  if(!el || !String(el.value).trim()) return null;
  const scaled = pgScaleUp(el.value, decimals);
  if(scaled === null) throw new Error('value: enter an amount like 1.5 (at most ' + decimals + ' decimals)');
  return scaled;
}

/* ---------------- output formatting ---------------- */
function formatResult(val){
  if(val === null || val === undefined) return 'null';
  if(ethers.BigNumber && ethers.BigNumber.isBigNumber(val)) return val.toString();
  if(Array.isArray(val)) return '[' + Array.from(val).map(formatResult).join(', ') + ']';
  if(typeof val === 'object') return JSON.stringify(val, (k, v) => typeof v === 'bigint' ? v.toString() : v, 2);
  return String(val);
}

function pgFormatOutputs(item, res){
  const outs = item.outputs || [];
  if(outs.length <= 1) return formatResult(outs.length ? res : res);
  return outs.map((o, i) => (o.name || ('out' + i)) + ': ' + formatResult(res[i])).join('\n');
}

function pgRevertReason(e){
  if(!e) return 'unknown error';
  const parts = [e.reason, e.error && e.error.reason, e.error && e.error.message, e.data && e.data.message, e.message];
  for(const p of parts){ if(p && String(p).trim()) { const m = /reverted(?: with reason string)? '([^']*)'/.exec(String(p)); return m ? m[1] : String(p).replace(/^execution reverted:?\s*/i, '').slice(0, 300); } }
  return String(e);
}

/* decode raw logs [{address,topics,data}] with one or more interfaces; returns readable lines */
function pgDecodeLogs(logs, ifaces){
  const lines = [];
  (logs || []).forEach((lg) => {
    for(const entry of ifaces){
      if(entry.address && lg.address && entry.address.toLowerCase() !== lg.address.toLowerCase()) continue;
      try{
        const parsed = entry.iface.parseLog({ topics: lg.topics, data: lg.data });
        const args = parsed.eventFragment.inputs.map((inp, k) => (inp.name || ('arg' + k)) + '=' + formatResult(parsed.args[k])).join(', ');
        lines.push(parsed.name + '(' + args + ')' + (entry.label ? '  · ' + entry.label : ''));
        return;
      }catch(_){ /* not this interface */ }
    }
  });
  return lines;
}

/* ---------------- function cards (shared) ---------------- */
function pgBuildCards(opts){
  const { container, abi, prefix, filter, search, handlers, nativeSymbol } = opts;
  container.innerHTML = '';
  if(!abi) return 0;
  const ctx = (PG_CTX[prefix] || (() => ({})))();
  const q = String(search || '').trim().toLowerCase();
  const groups = { read: [], write: [], event: [] };
  abi.forEach((item, idx) => {
    if(item.type === 'constructor' || item.type === 'fallback' || item.type === 'receive' || item.type === 'error') return;
    if(q && !String(item.name || '').toLowerCase().includes(q)) return;
    const isRead = pgIsRead(item), isEvent = item.type === 'event';
    const kind = isRead ? 'read' : isEvent ? 'event' : 'write';
    if(filter !== 'all' && filter !== kind) return;
    groups[kind].push([item, idx]);
  });
  const titles = { read: 'Read functions', write: 'Write functions', event: 'Events' };
  let count = 0;
  ['read', 'write', 'event'].forEach((kind) => {
    if(!groups[kind].length) return;
    if(filter === 'all'){
      const h = document.createElement('div'); h.className = 'fn-group'; h.textContent = titles[kind] + ' (' + groups[kind].length + ')';
      container.appendChild(h);
    }
    groups[kind].forEach(([item, idx]) => {
      count++;
      const isRead = kind === 'read', isEvent = kind === 'event';
      const card = document.createElement('div');
      card.className = 'fn-card fn-type-' + kind;
      card.dataset.idx = idx;
      const inputs = item.inputs || [];
      let inputsHtml = inputs.map((inp, i) => pgInputHtml(prefix, idx, i, inp, ctx)).join('');
      if(item.stateMutability === 'payable'){
        inputsHtml += '<div class="fn-row"><label>value (' + escapeHtml(nativeSymbol || 'ETH') + ')</label><div class="fn-field"><input id="' + prefix + '_val_' + idx + '" placeholder="0.0" /></div></div>';
      }
      const outs = item.outputs || [];
      const outStr = outs.length ? '→ ' + outs.map(o => o.type + (o.name ? ' ' + o.name : '')).join(', ') : '';
      let buttons = '';
      if(isEvent) buttons = '<button class="btn btn-ghost" style="padding:9px 16px;font-size:11px;" data-onclick="' + handlers.events + '(' + idx + ')">Recent events</button>';
      else buttons = '<button class="btn btn-primary" style="padding:9px 16px;font-size:11px;" data-onclick="' + handlers.call + '(' + idx + ')">' + (isRead ? 'Call' : 'Send tx') + '</button>'
        + (isRead && handlers.watch ? '<button class="btn btn-ghost" style="padding:9px 16px;font-size:11px;" data-onclick="' + handlers.watch + '(' + idx + ')">Watch</button>' : '');
      card.innerHTML = '<h4>' + escapeHtml(item.name || item.type) + ' <span class="fn-out">' + escapeHtml(outStr) + '</span>'
        + '<span class="fn-kind fn-kind-' + kind + '">' + kind + '</span></h4>'
        + '<div class="fn-inputs">' + inputsHtml + '</div>'
        + '<div class="btnrow" style="margin-top:10px;">' + buttons + '</div>'
        + '<div class="fn-result" id="' + prefix + '_result_' + idx + '"></div>';
      container.appendChild(card);
    });
  });
  if(!count) container.innerHTML = '<p style="color:#5C6B65;font-family:var(--mono);font-size:12px;">No functions match.</p>';
  return count;
}

/* ---------------- the Playground ---------------- */
function onAbiSrcChange(){
  const src = document.getElementById('pg_abisrc').value;
  document.getElementById('pg_customAbiField').style.display = src === 'custom' ? 'block' : 'none';
}

function filterFns(filter, el){
  pgFilter = filter;
  document.querySelectorAll('#pg_filter .pill').forEach(p => p.classList.remove('active'));
  if(el) el.classList.add('active');
  renderPlaygroundFunctions(playgroundABI);
}

function logPG(type, msg, link){
  const c = document.getElementById('pg_log');
  if(!c) return;
  const line = document.createElement('div');
  line.className = 'line ' + (type || '');
  const t = new Date().toLocaleTimeString('en-US', { hour12: false });
  line.innerHTML = '<span class="t">[' + t + ']</span><span class="msg">' + escapeHtml(msg) + '</span>';
  if(link && /^https:\/\//.test(link.href)){
    const a = document.createElement('a'); a.href = link.href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.className = 'log-link'; a.textContent = link.text || link.href;
    line.querySelector('.msg').append(' ', a);
  }
  c.appendChild(line); c.scrollTop = c.scrollHeight;
}

function pgExplorerLink(key, kind, value){
  const n = NETWORKS[key];
  return n && n.explorer && value ? { href: n.explorer + '/' + kind + '/' + value, text: kind === 'tx' ? 'view tx' : 'view' } : null;
}

async function pgRenderContext(){
  const el = document.getElementById('pg_context');
  if(!el) return;
  if(!pgReadContract){ el.style.display = 'none'; el.innerHTML = ''; return; }
  const key = pgNetKey(), n = NETWORKS[key];
  let walletLine;
  if(!signer) walletLine = '<span class="pgc-warn">Wallet not connected: read-only (calls and events work, sending needs a wallet).</span>';
  else {
    let cid = null; try{ cid = await signer.getChainId(); }catch(_){ /* ignore */ }
    if(cid === n.chainIdDec) walletLine = '<span class="pgc-ok">Wallet is on ' + escapeHtml(n.label) + ' ✓</span>';
    else walletLine = '<span class="pgc-warn">Your wallet is on another network.</span> <button type="button" class="hbtn" data-onclick="pgSwitchWallet()">Switch wallet to ' + escapeHtml(n.label) + '</button>';
  }
  el.style.display = 'block';
  el.className = 'pg-context' + (n.isMainnet ? ' pgc-main' : '');
  el.innerHTML = '<b>' + escapeHtml(n.label) + '</b>' + (n.isMainnet ? ' <span class="pgc-live">LIVE</span>' : '') + ' · ' + escapeHtml(pgShort(playgroundContract.address)) + ' · ' + walletLine;
}

async function pgSwitchWallet(){
  const key = pgNetKey(), n = NETWORKS[key];
  if(n.isMainnet && !(await confirmMainnet(n.label))) return;
  activeNetwork = key;
  if(typeof renderNetBar === 'function') renderNetBar();
  if(typeof updateSideNet === 'function') updateSideNet();
  if(account) await switchWalletNetwork();
  pgRebindWallet();
  pgRenderContext();
}

function pgRebindWallet(){
  if(!pgReadContract || !playgroundABI) return;
  playgroundContract = signer ? new ethers.Contract(pgReadContract.address, playgroundABI, signer) : pgReadContract;
}

function pgLoad(address, abi, networkKey){
  if(!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error('Enter a valid contract address (0x + 40 hex characters).');
  if(!Array.isArray(abi)) throw new Error('The ABI must be a JSON array.');
  const key = (networkKey && NETWORKS[networkKey]) ? networkKey : activeNetwork;
  pgTarget = key;
  playgroundABI = abi;
  pgReadContract = new ethers.Contract(address, abi, pgReadProvider(key));
  playgroundContract = signer ? new ethers.Contract(address, abi, signer) : pgReadContract;
  renderPlaygroundFunctions(abi);
  pgRenderContext();
}

function pgFindEntry(address){
  const a = String(address || '').toLowerCase();
  return loadDeployHistory().find(h => h && h.address && h.address.toLowerCase() === a);
}

function loadPlayground(){
  const addrVal = document.getElementById('pg_address').value.trim();
  if(!addrVal){ alert('Enter the deployed contract address.'); return; }
  const src = document.getElementById('pg_abisrc').value;
  let abi, netKey = null;
  if(src === 'last'){
    if(!window.__lastCompiledABI || !window.__lastCompiledABI.length){
      alert('No compiled ABI available. Generate and compile a contract first (section 07).');
      return;
    }
    abi = window.__lastCompiledABI;
    const e = pgFindEntry(addrVal); if(e) netKey = e.network;
  } else if(src === 'custom'){
    try{ abi = JSON.parse(document.getElementById('pg_customAbi').value); }
    catch(e){ alert('Invalid ABI JSON: ' + e.message); return; }
  } else {
    const match = pgFindEntry(addrVal);
    if(!match || !match.abi){ alert('No ABI found for this address in deploy history.'); return; }
    abi = match.abi; netKey = match.network;
  }
  try{
    pgLoad(addrVal, abi, netKey);
    logPG('ok', 'Loaded ' + abi.length + ' ABI items for ' + addrVal.slice(0, 10) + '… on ' + NETWORKS[pgNetKey()].label + (signer ? '' : ' (read-only: connect a wallet to send transactions)'));
  }catch(e){
    logPG('err', 'Failed to load: ' + e.message);
  }
}

/* open a deploy-history entry in the Playground (also used by Home and Deploy History) */
function pgOpenEntry(entry){
  if(!entry || !entry.address) return;
  document.getElementById('pg_address').value = entry.address;
  document.getElementById('pg_abisrc').value = 'history';
  onAbiSrcChange();
  if(entry.abi){
    try{
      pgLoad(entry.address, entry.abi, entry.network);
      logPG('ok', 'Loaded from history: ' + entry.name + ' @ ' + entry.address.slice(0, 10) + '… on ' + NETWORKS[pgNetKey()].label);
    }catch(e){ logPG('err', 'Failed to load: ' + e.message); }
  }
  const sel = document.getElementById('pg_deployments');
  if(sel){ const i = loadDeployHistory().indexOf(entry); if(i >= 0 && sel.querySelector('option[value="' + i + '"]')) sel.value = String(i); }
}

function pgRefreshDeployments(){
  const sel = document.getElementById('pg_deployments');
  if(!sel) return;
  const hist = loadDeployHistory();
  const keep = sel.value;
  let html = '<option value="">' + (hist.length ? 'Choose a deployed contract…' : 'No deployments yet (section 07)') + '</option>';
  hist.slice(0, 40).forEach((h, i) => {
    if(!h || !/^0x[0-9a-fA-F]{40}$/.test(h.address || '')) return;
    const label = (NETWORKS[h.network] ? NETWORKS[h.network].label : (h.network || '?'));
    html += '<option value="' + i + '">' + escapeHtml((h.name || 'Contract') + ' · ' + label + ' · ' + pgShort(h.address)) + '</option>';
  });
  sel.innerHTML = html;
  if(keep && sel.querySelector('option[value="' + keep + '"]')) sel.value = keep;
}

function pgSelectDeployment(){
  const sel = document.getElementById('pg_deployments');
  if(!sel || sel.value === '') return;
  const entry = loadDeployHistory()[Number(sel.value)];
  if(entry) pgOpenEntry(entry);
}

function renderPlaygroundFunctions(abi){
  const container = document.getElementById('pg_functions');
  const search = document.getElementById('pg_search');
  const n = NETWORKS[pgNetKey()] || {};
  pgBuildCards({
    container, abi, prefix: 'pg', filter: pgFilter, search: search ? search.value : '',
    handlers: { call: 'callFunction', watch: 'watchRead', events: 'pgQueryEvents' }, nativeSymbol: n.gasSymbol,
  });
}

function pgRecordCall(entry){
  pgCalls.unshift(entry);
  if(pgCalls.length > 25) pgCalls.length = 25;
  const box = document.getElementById('pg_calls');
  if(!box) return;
  if(!pgCalls.length){ box.style.display = 'none'; box.innerHTML = ''; return; }
  box.style.display = 'block';
  box.innerHTML = '<div class="fn-group">Call history (this session)</div>' + pgCalls.map(c =>
    '<div class="pg-call pg-call-' + (c.ok ? 'ok' : 'err') + '"><div class="pg-call-top"><b>' + escapeHtml(c.fn) + '</b>'
    + '<span class="pg-call-kind">' + (c.write ? 'tx' : 'read') + '</span><span class="pg-call-time">' + escapeHtml(c.time) + '</span>'
    + (c.href ? '<a class="log-link" target="_blank" rel="noopener noreferrer" href="' + escapeHtml(c.href) + '">view tx</a>' : '') + '</div>'
    + (c.args ? '<div class="pg-call-line">args: ' + escapeHtml(c.args) + '</div>' : '')
    + '<div class="pg-call-line">' + (c.ok ? '' : 'failed: ') + escapeHtml(c.result) + '</div>'
    + (c.events && c.events.length ? '<div class="pg-call-line pg-call-ev">' + c.events.map(escapeHtml).join('<br>') + '</div>' : '')
    + '</div>').join('');
}

async function callFunction(idx){
  if(!playgroundContract || !playgroundABI){ logPG('err', 'Load a contract first.'); return; }
  const item = playgroundABI[idx];
  const result = document.getElementById('pg_result_' + idx);
  const key = pgNetKey(), net = NETWORKS[key];
  const sig = pgSig(item);
  const read = pgIsRead(item);
  const stamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  result.className = 'fn-result';
  result.textContent = read ? 'calling…' : 'checking…';
  let args, argsText = '';
  try{
    args = pgReadArgs('pg', idx, item);
    argsText = args.length ? args.map(formatResult).join(', ') : '';
  }catch(e){
    result.className = 'fn-result err'; result.textContent = e.message; return;
  }

  try{
    if(read){
      const overrides = account ? { from: account } : {};
      const res = await pgReadContract[sig](...args, overrides);
      const text = pgFormatOutputs(item, res);
      result.textContent = text;
      logPG('ok', item.name + '() → ' + text.replace(/\s+/g, ' ').slice(0, 120));
      pgRecordCall({ fn: item.name, write: false, ok: true, args: argsText, result: text.replace(/\s+/g, ' ').slice(0, 300), time: stamp });
      return;
    }

    // ---- write ----
    if(!signer){ throw new Error('Connect your wallet to send transactions.'); }
    const cid = await signer.getChainId();
    if(cid !== net.chainIdDec){
      throw new Error('Your wallet is on another network. Switch it to ' + net.label + ' (button above), then try again.');
    }
    const value = item.stateMutability === 'payable' ? pgReadValue('pg', idx, net.gasDecimals || 18) : null;
    const opts = value ? { value } : {};
    // dry-run first: shows the revert reason without spending gas
    try{
      await playgroundContract.callStatic[sig](...args, opts);
    }catch(e){
      throw new Error('This call would fail: ' + pgRevertReason(e));
    }
    if(net.isMainnet && typeof uiConfirmAction === 'function'){
      const ok = await uiConfirmAction({
        tag: 'MAINNET', title: 'Send this transaction?', confirmLabel: 'Send transaction',
        warn: 'This uses real funds and cannot be undone.',
        rows: [['Network', net.label + ' (chain ' + net.chainIdDec + ')'], ['Contract', playgroundContract.address], ['Function', sig], ['Arguments', argsText || 'none'], ['Value', value ? (ethers.utils.formatUnits(value, net.gasDecimals || 18) + ' ' + net.gasSymbol) : '0']],
      });
      if(!ok){ result.textContent = 'Cancelled.'; logPG('warn', item.name + '() cancelled.'); return; }
    }
    result.textContent = 'confirm in your wallet…';
    const tx = await playgroundContract[sig](...args, opts);
    const link = pgExplorerLink(key, 'tx', tx.hash);
    result.textContent = 'tx sent: ' + tx.hash;
    logPG('step', 'Tx sent: ' + tx.hash, link);
    const receipt = await tx.wait();
    const ev = pgDecodeLogs(receipt.logs, [{ iface: playgroundContract.interface, address: playgroundContract.address }]);
    const summary = 'Confirmed in block ' + receipt.blockNumber + ' · gas ' + receipt.gasUsed.toString();
    result.textContent = summary + (ev.length ? '\n' + ev.join('\n') : '');
    logPG('ok', item.name + '() ' + summary);
    pgRecordCall({ fn: item.name, write: true, ok: true, args: argsText, result: summary, events: ev, time: stamp, href: link ? link.href : '' });
    if(typeof refreshBalance === 'function') refreshBalance();
  }catch(e){
    const msg = pgRevertReason(e);
    result.className = 'fn-result err';
    result.textContent = msg;
    logPG('err', item.name + '() error: ' + msg.slice(0, 160));
    pgRecordCall({ fn: item.name, write: !read, ok: false, args: argsText, result: msg.slice(0, 300), time: stamp });
  }
}

function watchRead(idx){
  if(!pgReadContract){ logPG('err', 'Load a contract first.'); return; }
  const item = playgroundABI[idx];
  const result = document.getElementById('pg_result_' + idx);
  let args;
  try{ args = pgReadArgs('pg', idx, item); }catch(e){ result.className = 'fn-result err'; result.textContent = e.message; return; }
  if(pgPoll){ clearInterval(pgPoll); pgPoll = null; }
  const sig = pgSig(item);
  logPG('ok', 'Watching ' + item.name + '() every 5s… (starting another watch stops this one)');
  const tick = async () => {
    try{ result.className = 'fn-result'; result.textContent = pgFormatOutputs(item, await pgReadContract[sig](...args)); }
    catch(e){ clearInterval(pgPoll); pgPoll = null; logPG('err', 'Watch error: ' + pgRevertReason(e)); }
  };
  tick();
  pgPoll = setInterval(tick, 5000);
}

async function pgQueryEvents(idx){
  if(!pgReadContract){ logPG('err', 'Load a contract first.'); return; }
  const item = playgroundABI[idx];
  const result = document.getElementById('pg_result_' + idx);
  result.className = 'fn-result'; result.textContent = 'searching the last 2,000 blocks…';
  try{
    const latest = await pgReadContract.provider.getBlockNumber();
    const logs = await pgReadContract.queryFilter(pgReadContract.filters[ethers.utils.EventFragment.from(item).format(ethers.utils.FormatTypes.sighash)](), Math.max(0, latest - 2000), latest);
    if(!logs.length){ result.textContent = 'No ' + item.name + ' events in the last 2,000 blocks.'; return; }
    result.textContent = logs.slice(-20).reverse().map(l => 'block ' + l.blockNumber + ': ' + l.args.map((a, k) => ((item.inputs[k] && item.inputs[k].name) || ('arg' + k)) + '=' + formatResult(a)).join(', ')).join('\n');
  }catch(e){ result.className = 'fn-result err'; result.textContent = pgRevertReason(e); }
}

function subscribeEvents(){
  if(!pgReadContract){ logPG('err', 'Load a contract first.'); return; }
  eventSubscriptions.forEach(unsub => { try{ unsub(); }catch(_){ /* ignore */ } });
  eventSubscriptions = [];
  const events = playgroundABI.filter(i => i.type === 'event');
  if(!events.length){ logPG('warn', 'No events in this ABI.'); return; }
  events.forEach((ev) => {
    const listener = (...args) => {
      const vals = args.slice(0, ev.inputs.length).map((a, i) => (ev.inputs[i] && ev.inputs[i].name || 'arg' + i) + ': ' + formatResult(a)).join(', ');
      logPG('ok', 'EVENT ' + ev.name + ' — ' + vals);
    };
    pgReadContract.on(ev.name, listener);
    eventSubscriptions.push(() => pgReadContract.off(ev.name, listener));
  });
  logPG('ok', 'Subscribed to ' + events.length + ' event(s): ' + events.map(e => e.name).join(', '));
}

function pgInit(){
  pgRefreshDeployments();
  const search = document.getElementById('pg_search');
  if(search) search.addEventListener('input', () => renderPlaygroundFunctions(playgroundABI));
  // keep the wallet binding fresh when the wallet connects or changes network
  if(window.ethereum && window.ethereum.on){
    try{ window.ethereum.on('chainChanged', () => { setTimeout(() => { pgRebindWallet(); pgRenderContext(); }, 400); }); }catch(_){ /* ignore */ }
  }
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pgInit); else pgInit();
