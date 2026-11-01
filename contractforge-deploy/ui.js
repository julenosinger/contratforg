/* ======================================================================
   UI helpers — network banner, header text, keyboard access.
   Presentation only: no generator or deploy logic lives here.
   ====================================================================== */

/* Always-visible banner so the user knows which network (and what kind of funds) they are on. */
function renderNetBanner(){
  const el = document.getElementById('netBanner');
  if(!el || typeof NETWORKS === 'undefined') return;
  const net = NETWORKS[activeNetwork];
  if(!net) return;
  const main = !!net.isMainnet;
  el.className = 'net-banner ' + (main ? 'mainnet' : 'testnet');
  const mode = (typeof multichainMode !== 'undefined' && multichainMode !== 'single' && typeof MC_MODES !== 'undefined')
    ? '<span class="nb-sep">·</span><span class="nb-mode">' + escapeHtml(MC_MODES[multichainMode].label) + ' mode</span>' : '';
  el.innerHTML = '<span class="nb-tag">' + (main ? 'MAINNET' : 'TESTNET') + '</span>'
    + '<span class="nb-net">' + escapeHtml(net.label) + '</span>'
    + '<span class="nb-sep">·</span><span class="nb-chain">chain ' + escapeHtml(net.chainIdDec) + '</span>'
    + mode
    + '<button type="button" class="nb-change" id="netChangeBtn" aria-expanded="' + (uiNetPanelOpen() ? 'true' : 'false') + '" aria-controls="netPanel" onclick="toggleNetPanel()">Change network</button>'
    + '<span class="nb-note">' + (main ? 'Real funds. Transactions cannot be undone.' : 'Test funds only.') + '</span>';
  if(typeof renderHome === 'function') renderHome();
}

function uiNetPanelOpen(){ const p = document.getElementById('netPanel'); return !!(p && p.classList.contains('open')); }
function toggleNetPanel(force){
  const p = document.getElementById('netPanel');
  if(!p) return;
  const open = typeof force === 'boolean' ? force : !p.classList.contains('open');
  p.classList.toggle('open', open);
  const b = document.getElementById('netChangeBtn');
  if(b) b.setAttribute('aria-expanded', String(open));
  if(open && typeof renderNetBar === 'function') renderNetBar();
}

/* ---- Home page ---- */
function renderHome(){
  if(typeof NETWORKS === 'undefined') return;
  const cont = document.getElementById('homeContinue');
  if(cont){
    const has = typeof pendingSource !== 'undefined' && pendingSource && pendingSource.code;
    if(has){
      cont.style.display = 'flex';
      cont.innerHTML = '<div>Continue where you left off: <b>' + escapeHtml(pendingSource.name) + '.sol</b></div>'
        + '<div class="hc-actions"><button type="button" class="btn btn-ghost" data-go="auditor">Audit</button>'
        + '<button type="button" class="btn btn-primary" data-go="deploy">Publish</button></div>';
    } else { cont.style.display = 'none'; cont.innerHTML = ''; }
  }
  const recentBox = document.getElementById('homeRecentBox'), recent = document.getElementById('homeRecent');
  if(recentBox && recent && typeof loadDeployHistory === 'function'){
    const rows = [];
    loadDeployHistory().forEach((e, i) => { if(e && isAddr(e.address) && rows.length < 5) rows.push([e, i]); });
    if(!rows.length){ recentBox.style.display = 'none'; recent.innerHTML = ''; }
    else {
      recentBox.style.display = 'block';
      recent.innerHTML = rows.map(([e, i]) => {
        const net = NETWORKS[e.network] || { label: String(e.network || 'unknown'), explorer: '' };
        const url = net.explorer ? net.explorer + '/address/' + e.address : '';
        return '<div class="home-recent-row"><div class="hr-main"><b>' + escapeHtml(e.name || 'Contract') + '</b><span>' + escapeHtml(net.label) + (net.isMainnet ? ' <span class="md-live">LIVE</span>' : '') + ' · ' + escapeHtml(typeof timeAgo === 'function' ? timeAgo(e.timestamp) : '') + '</span></div>'
          + '<code title="' + escapeHtml(e.address) + '">' + escapeHtml(e.address.slice(0, 10) + '…' + e.address.slice(-6)) + '</code>'
          + '<div class="hr-actions"><button type="button" class="btn btn-ghost" onclick="loadHistoryIntoPlayground(' + i + ')">Open in Playground</button>'
          + (/^https:\/\//.test(url) ? '<a class="btn btn-ghost" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">Explorer</a>' : '') + '</div></div>';
      }).join('');
    }
  }
  const modes = document.getElementById('homeModes');
  if(modes && typeof MC_MODES !== 'undefined'){
    modes.innerHTML = Object.entries(MC_MODES).map(([k, m]) =>
      '<button type="button" class="home-card' + (k === multichainMode ? ' active' : '') + '" data-mode="' + k + '" aria-pressed="' + (k === multichainMode) + '"><b>' + escapeHtml(m.label) + '</b><span>' + escapeHtml(m.desc) + '</span></button>').join('');
  }
  const nets = document.getElementById('homeNetworks');
  if(nets){
    nets.innerHTML = Object.entries(NETWORKS).map(([k, n]) =>
      '<span class="home-net' + (k === activeNetwork ? ' current' : '') + (n.isMainnet ? ' main' : '') + '">' + escapeHtml(n.label) + (n.isMainnet ? ' <span class="md-live">LIVE</span>' : '') + '</span>').join('');
  }
}

function initHome(){
  document.addEventListener('click', (e) => {
    const go = e.target.closest ? e.target.closest('[data-go]') : null;
    if(go){
      const item = document.querySelector('.nav-item[data-section="' + go.dataset.go + '"]');
      if(item){ item.click(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      return;
    }
    const mode = e.target.closest ? e.target.closest('[data-mode]') : null;
    if(mode && typeof setMultichainMode === 'function'){ setMultichainMode(mode.dataset.mode); return; }
    // network panel: close after choosing a network or clicking elsewhere
    const panel = document.getElementById('netPanel');
    if(panel && panel.classList.contains('open')){
      if(e.target.closest('.netbtn')) setTimeout(() => toggleNetPanel(false), 0);
      else if(!e.target.closest('#netPanel') && !e.target.closest('#netChangeBtn')) toggleNetPanel(false);
    }
  });
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && uiNetPanelOpen() && !document.getElementById('deployConfirm') && !document.getElementById('switchConfirm') && !document.getElementById('actionConfirm')) toggleNetPanel(false); });
  const mark = document.querySelector('.brand .mark');
  if(mark){
    mark.setAttribute('role', 'button'); mark.setAttribute('tabindex', '0'); mark.style.cursor = 'pointer';
    const go = () => { const item = document.querySelector('.nav-item[data-section="home"]'); if(item) item.click(); };
    mark.addEventListener('click', go);
    mark.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } });
  }
  renderHome();
}

function renderHeaderMeta(){
  const meta = document.querySelector('.head-meta');
  if(!meta || typeof NETWORKS === 'undefined') return;
  const all = Object.values(NETWORKS);
  const main = all.filter(n => n.isMainnet).length;
  meta.innerHTML = all.length + ' NETWORKS<br>' + main + ' MAINNET · ' + (all.length - main) + ' TESTNET<br><b id="headVersion">v3.0 — multichain</b>';
  if(typeof activeNetwork !== 'undefined' && NETWORKS[activeNetwork] && NETWORKS[activeNetwork].isMainnet) meta.style.color = '#C9A24B';
}

/* ---- Keyboard access: clickable <div>s behave like buttons ---- */
const UI_CLICKABLE = '.nav-item, .netbtn, .pill, .tcard, .wz-card';

function uiMakeFocusable(root){
  (root.querySelectorAll ? root.querySelectorAll(UI_CLICKABLE) : []).forEach(el => {
    if(!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    if(!el.hasAttribute('role')) el.setAttribute('role', 'button');
  });
}

function uiSyncCurrent(){
  document.querySelectorAll('.nav-item').forEach(el => {
    if(el.classList.contains('active')) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
  });
}

function initUiAccessibility(){
  uiMakeFocusable(document);
  uiSyncCurrent();
  document.addEventListener('keydown', (e) => {
    if(e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target && e.target.closest ? e.target.closest(UI_CLICKABLE) : null;
    if(!el || e.target !== el) return; // never hijack typing inside inputs
    e.preventDefault();
    el.click();
  });
  new MutationObserver((muts) => {
    for(const m of muts){
      if(m.type === 'childList') m.addedNodes.forEach(n => { if(n.nodeType === 1){ if(n.matches && n.matches(UI_CLICKABLE)) uiMakeFocusable({ querySelectorAll: () => [n] }); uiMakeFocusable(n); } });
      if(m.type === 'attributes' && m.target.classList && m.target.classList.contains('nav-item')) uiSyncCurrent();
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
}

/* ---- Current contract bar: actions for the contract in the buffer, from any section ---- */
function renderCurrentContract(){
  const el = document.getElementById('currentContract');
  if(!el) return;
  const has = typeof pendingSource !== 'undefined' && pendingSource && pendingSource.code;
  if(typeof labRenderHeader === 'function') labRenderHeader();
  if(!has){ el.style.display = 'none'; el.innerHTML = ''; if(typeof renderHome === 'function') renderHome(); return; }
  uiSaveContract();
  if(typeof renderHome === 'function') renderHome();
  const lines = pendingSource.code.split('\n').length;
  const nArgs = (typeof pendingCtorArgs !== 'undefined') ? pendingCtorArgs.length : 0;
  const modeChip = (typeof multichainMode !== 'undefined' && multichainMode !== 'single' && typeof MC_MODES !== 'undefined')
    ? '<span class="cc-chip">' + escapeHtml(MC_MODES[multichainMode].label) + '</span>' : '';
  el.style.display = 'flex';
  el.innerHTML = '<div class="cc-info"><span class="cc-label">Current contract</span><b>' + escapeHtml(pendingSource.name) + '.sol</b>'
    + '<span>' + lines + ' lines</span>' + modeChip
    + (nArgs ? '<span class="cc-chip warn">' + nArgs + ' constructor argument' + (nArgs === 1 ? '' : 's') + ' to review</span>' : '')
    + '</div><div class="cc-actions">'
    + '<button type="button" class="btn btn-ghost" onclick="ccTest()">Test</button>'
    + '<button type="button" class="btn btn-ghost" onclick="ccAudit()">Audit</button>'
    + '<button type="button" class="btn btn-ghost" onclick="copySource()">Copy</button>'
    + '<button type="button" class="btn btn-ghost" onclick="downloadSource()">Download</button>'
    + '<button type="button" class="btn btn-ghost" onclick="ccDiscard()">Discard</button>'
    + '<button type="button" class="btn btn-primary" onclick="ccPublish()">Publish</button></div>';
}
function ccPublish(){ deployFromBuffer(); }
function ccTest(){
  const item = document.querySelector('.nav-item[data-section="lab"]');
  if(item) item.click();
  window.scrollTo({ top:0, behavior:'smooth' });
}
function ccAudit(){
  const item = document.querySelector('.nav-item[data-section="auditor"]');
  if(item) item.click();
  window.scrollTo({ top:0, behavior:'smooth' });
}

/* ---- Advanced options: rarely changed fields move into a collapsible block (ids and values are untouched) ---- */
const UI_ADV_STATIC = {
  'sec-swap':       ['swap_fee', 'swap_multi'],
  'sec-treasury':   ['tre_streaming', 'tre_tokens'],
  'sec-vault':      ['vault_perf', 'vault_cap'],
  'sec-multisend':  ['ms_max', 'ms_fee', 'ms_owner'],
  'sec-crosschain': ['cc_tokenmessenger', 'cc_msgtransmitter', 'cc_usdc', 'cc_resume']
};
const UI_ADV_SIMPLE = {
  erc20:       ['s_decimals', 's_cap', 's_burn'],
  erc721:      ['s_royalty', 's_baseuri'],
  escrow:      ['s_token', 's_timeout'],
  vesting:     ['s_token', 's_cliff'],
  paywall:     ['s_token'],
  dao:         ['s_quorum', 's_voting', 's_delay', 's_threshold'],
  smartwallet: ['s_session'],
  staking:     ['s_token', 's_reward', 's_exitfee']
};

function uiCollapseAdvanced(scope, ids){
  if(!scope || scope.querySelector('details.adv')) return;
  const fields = ids.map(id => scope.querySelector('#' + id)).filter(Boolean).map(el => el.closest('.field')).filter(Boolean);
  if(!fields.length) return;
  const grid = fields[0].parentElement;
  const d = document.createElement('details');
  d.className = 'adv';
  const s = document.createElement('summary');
  s.textContent = 'Advanced options (' + fields.length + ')';
  const inner = document.createElement('div');
  inner.className = 'field-grid';
  fields.forEach(f => inner.appendChild(f));
  d.appendChild(s);
  d.appendChild(inner);
  grid.parentNode.insertBefore(d, grid.nextSibling);
}

function uiCollapseSimpleForm(){
  const form = document.getElementById('simpleForm');
  if(!form) return;
  const btn = form.querySelector('button[onclick^="genSimple("]');
  const m = btn && /genSimple\('(\w+)'\)/.exec(btn.getAttribute('onclick'));
  if(m && UI_ADV_SIMPLE[m[1]]) uiCollapseAdvanced(form, UI_ADV_SIMPLE[m[1]]);
  if(m) uiRestoreSimpleForm(m[1]);
}

function initAdvancedOptions(){
  Object.entries(UI_ADV_STATIC).forEach(([sec, ids]) => uiCollapseAdvanced(document.getElementById(sec), ids));
  const form = document.getElementById('simpleForm');
  if(form){
    new MutationObserver(uiCollapseSimpleForm).observe(form, { childList: true });
    uiCollapseSimpleForm();
  }
}

/* ---- Mainnet deployment summary (replaces the browser confirm box) ---- */
function uiConfirmMainnet(net, details){
  return new Promise((resolve) => {
    const prev = document.activeElement;
    const src = (typeof pendingSource !== 'undefined' && pendingSource && pendingSource.code) ? pendingSource : null;
    const wallet = (typeof account !== 'undefined' && account) ? account : '';
    const rows = [
      ['Network', escapeHtml(net.label) + ' <span class="dc-dim">(chain ' + escapeHtml(net.chainIdDec) + ')</span>'],
      ['Wallet', wallet ? '<code>' + escapeHtml(wallet.slice(0, 8) + '…' + wallet.slice(-6)) + '</code>' : '<span class="dc-dim">not connected</span>'],
      ['Contract', src ? escapeHtml(src.name) + '.sol <span class="dc-dim">(' + src.code.split('\n').length + ' lines)</span>' : '<span class="dc-dim">none</span>'],
      ['Gas paid in', 'real ' + escapeHtml(net.gasSymbol)]
    ];
    const args = (details && details.args) || [];
    const argHtml = args.length
      ? '<div class="dc-args"><div class="dc-sub">Constructor arguments</div>' + args.map(a => '<div class="dc-arg"><span>' + escapeHtml(a.label) + '</span><code>' + escapeHtml(a.value || '(empty)') + '</code></div>').join('') + '</div>'
      : '';
    const root = document.createElement('div');
    root.className = 'dc-backdrop'; root.id = 'deployConfirm';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'dcTitle');
    root.innerHTML = '<div class="dc-box">'
      + '<div class="dc-head"><span class="dc-tag">MAINNET</span><h3 id="dcTitle">Confirm deployment</h3></div>'
      + '<p class="dc-warn">This uses real funds and cannot be undone.</p>'
      + '<div class="dc-rows">' + rows.map(r => '<div class="dc-row"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>').join('') + '</div>'
      + argHtml
      + '<ul class="dc-check"><li>The source was reviewed or audited</li><li>It was tested on a testnet first</li><li>Every address above is correct for this network</li></ul>'
      + '<label class="dc-type" for="dcInput">Type <b>' + escapeHtml(net.label) + '</b> to confirm</label>'
      + '<input id="dcInput" autocomplete="off" spellcheck="false" />'
      + '<div class="dc-actions"><button type="button" class="btn btn-ghost" id="dcCancel">Cancel</button>'
      + '<button type="button" class="btn btn-primary" id="dcConfirm" disabled>Deploy to ' + escapeHtml(net.label) + '</button></div>'
      + '</div>';
    document.body.appendChild(root);
    const input = root.querySelector('#dcInput'), ok = root.querySelector('#dcConfirm'), cancel = root.querySelector('#dcCancel');
    const finish = (v) => { document.removeEventListener('keydown', onKey, true); root.remove(); if(prev && prev.focus) prev.focus(); resolve(v); };
    const matches = () => input.value.trim().toLowerCase() === String(net.label).toLowerCase();
    const onKey = (e) => {
      if(e.key === 'Escape'){ e.preventDefault(); finish(false); }
      else if(e.key === 'Enter' && e.target === input && matches()){ e.preventDefault(); finish(true); }
      else if(e.key === 'Tab'){ // keep focus inside the dialog
        const f = [input, cancel, ok].filter(x => !x.disabled);
        const i = f.indexOf(document.activeElement);
        if(e.shiftKey && i <= 0){ e.preventDefault(); f[f.length - 1].focus(); }
        else if(!e.shiftKey && i === f.length - 1){ e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    input.addEventListener('input', () => { ok.disabled = !matches(); });
    ok.addEventListener('click', () => { if(matches()) finish(true); });
    cancel.addEventListener('click', () => finish(false));
    input.focus();
  });
}

/* ---- Switching to a mainnet: in-app dialog instead of the browser's confirm box ---- */
/* A confirmation for a single action: opts = { tag, title, warn, rows:[[label,value]...], confirmLabel, cancelLabel }.
   Cancel is the default focus, Esc cancels, Tab stays inside. Resolves true or false. */
function uiConfirmAction(opts){
  return new Promise((resolve) => {
    const prev = document.activeElement;
    const root = document.createElement('div');
    root.className = 'dc-backdrop'; root.id = 'actionConfirm';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'acTitle');
    const rows = (opts.rows || []).map(r => '<div class="dc-row"><span>' + escapeHtml(r[0]) + '</span><b><code>' + escapeHtml(String(r[1])) + '</code></b></div>').join('');
    root.innerHTML = '<div class="dc-box dc-small">'
      + '<div class="dc-head">' + (opts.tag ? '<span class="dc-tag">' + escapeHtml(opts.tag) + '</span>' : '') + '<h3 id="acTitle">' + escapeHtml(opts.title || 'Confirm') + '</h3></div>'
      + (opts.warn ? '<p class="dc-warn">' + escapeHtml(opts.warn) + '</p>' : '')
      + '<div class="dc-rows">' + rows + '</div>'
      + '<div class="dc-actions"><button type="button" class="btn btn-ghost" id="acCancel">' + escapeHtml(opts.cancelLabel || 'Cancel') + '</button>'
      + '<button type="button" class="btn btn-primary" id="acOk">' + escapeHtml(opts.confirmLabel || 'Confirm') + '</button></div></div>';
    document.body.appendChild(root);
    const ok = root.querySelector('#acOk'), cancel = root.querySelector('#acCancel');
    const finish = (v) => { document.removeEventListener('keydown', onKey, true); root.remove(); if(prev && prev.focus) prev.focus(); resolve(v); };
    const onKey = (e) => {
      if(e.key === 'Escape'){ e.preventDefault(); finish(false); }
      else if(e.key === 'Tab'){
        const f = [cancel, ok], i = f.indexOf(document.activeElement);
        if(e.shiftKey && i <= 0){ e.preventDefault(); f[1].focus(); }
        else if(!e.shiftKey && i === 1){ e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    ok.addEventListener('click', () => finish(true));
    cancel.addEventListener('click', () => finish(false));
    cancel.focus();
  });
}

function uiConfirmSwitch(label, gasSymbol){
  return new Promise((resolve) => {
    const prev = document.activeElement;
    const root = document.createElement('div');
    root.className = 'dc-backdrop'; root.id = 'switchConfirm';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'scTitle');
    root.innerHTML = '<div class="dc-box dc-small">'
      + '<div class="dc-head"><span class="dc-tag">MAINNET</span><h3 id="scTitle">Switch to ' + escapeHtml(label) + '?</h3></div>'
      + '<p class="dc-warn">This network uses real funds.</p>'
      + '<p class="dc-text">Any contract you deploy will spend real ' + escapeHtml(gasSymbol) + ' and cannot be undone. Keep testing on a testnet first.</p>'
      + '<div class="dc-actions"><button type="button" class="btn btn-ghost" id="scCancel">Stay on testnet</button>'
      + '<button type="button" class="btn btn-primary" id="scOk">Switch to ' + escapeHtml(label) + '</button></div></div>';
    document.body.appendChild(root);
    const ok = root.querySelector('#scOk'), cancel = root.querySelector('#scCancel');
    const finish = (v) => { document.removeEventListener('keydown', onKey, true); root.remove(); if(prev && prev.focus) prev.focus(); resolve(v); };
    const onKey = (e) => {
      if(e.key === 'Escape'){ e.preventDefault(); finish(false); }
      else if(e.key === 'Tab'){
        const f = [cancel, ok], i = f.indexOf(document.activeElement);
        if(e.shiftKey && i <= 0){ e.preventDefault(); f[1].focus(); }
        else if(!e.shiftKey && i === 1){ e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    ok.addEventListener('click', () => finish(true));
    cancel.addEventListener('click', () => finish(false));
    cancel.focus(); // the safe choice is the default
  });
}

/* ---- Field validation while typing (advice only: it never blocks generating) ---- */
const UI_RANGES = { // id -> [min, max, label]
  swap_fee: [0, 9999, 'Fee in basis points, 0 to 9999'],
  vault_perf: [0, 9999, 'Fee in basis points, 0 to 9999'],
  ms_fee: [0, 10000, 'Fee in basis points, 0 to 10000'],
  s_exitfee: [0, 9999, 'Fee in basis points, 0 to 9999'],
  s_royalty: [0, 10000, 'Royalty in basis points, 0 to 10000'],
  s_quorum: [0, 100, 'Percentage, 0 to 100'],
  tre_threshold: [1, 1000, 'At least 1 approval']
};
const UI_ADDR = /^0x[0-9a-fA-F]{40}$/;

function uiFieldProblem(el){
  const v = (el.value || '').trim();
  if(el.id === 'tre_signers'){
    const bad = v.split('\n').map(l => l.trim()).filter(Boolean).find(l => !UI_ADDR.test(l));
    return bad ? 'Not an address: ' + bad.slice(0, 18) + (bad.length > 18 ? '…' : '') : '';
  }
  if(!v) return '';
  const type = el.dataset ? el.dataset.type : '';
  const isAddrField = type === 'address' || (el.tagName === 'INPUT' && (el.getAttribute('placeholder') || '').indexOf('0x') === 0 && !/^cc_|^ver_|^an_|^pg_/.test(el.id));
  if(isAddrField){
    if(!UI_ADDR.test(v)) return 'Enter a valid address: 0x followed by 40 hex characters.';
    if(/^0x0{40}$/.test(v)) return el.dataset && el.dataset.allowzero ? '' : 'The zero address is not allowed.';
    if(/[a-f]/.test(v.slice(2)) && /[A-F]/.test(v.slice(2)) && typeof ethers !== 'undefined' && ethers.utils && ethers.utils.getAddress){
      try{ ethers.utils.getAddress(v); }catch(_){ return 'Checksum does not match. Check the capitalisation.'; }
    }
    return '';
  }
  if(/^u?int/.test(type) && !/^\d+$/.test(v)) return 'Enter a whole number.';
  if(UI_RANGES[el.id]){
    const [min, max, label] = UI_RANGES[el.id];
    if(!/^\d+$/.test(v) || Number(v) < min || Number(v) > max) return label + '.';
    return '';
  }
  if(el.type === 'number' && v !== '' && Number(v) < 0) return 'Cannot be negative.';
  return '';
}

function uiValidateField(el){
  if(!el || !el.matches || !el.matches('input, textarea')) return;
  if(el.closest('#deployConfirm')) return;
  const problem = uiFieldProblem(el);
  const host = el.closest('.field') || el.parentElement;
  let msg = host ? host.querySelector(':scope > .field-error') : null;
  if(problem){
    el.classList.add('invalid'); el.setAttribute('aria-invalid', 'true');
    if(!msg && host){ msg = document.createElement('div'); msg.className = 'field-error'; msg.setAttribute('role', 'alert'); host.appendChild(msg); }
    if(msg) msg.textContent = problem;
    el.title = problem;
  } else {
    el.classList.remove('invalid'); el.removeAttribute('aria-invalid');
    if(msg) msg.remove();
    if(el.title && el.classList.contains('md-missing') === false) el.removeAttribute('title');
  }
}

function initFieldValidation(){
  document.addEventListener('input', (e) => uiValidateField(e.target));
  document.addEventListener('focusout', (e) => uiValidateField(e.target));
}

/* ---- Small screens: the menu collapses behind a button ---- */
function initMobileMenu(){
  const brand = document.querySelector('.brand');
  const nav = document.querySelector('.nav');
  if(!brand || !nav || document.getElementById('navToggle')) return;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'navToggle'; btn.className = 'nav-toggle';
  btn.setAttribute('aria-controls', 'mainNav'); btn.setAttribute('aria-expanded', 'false');
  btn.textContent = 'Menu';
  nav.id = 'mainNav';
  brand.appendChild(btn);
  const set = (open) => { nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Close' : 'Menu'; };
  btn.addEventListener('click', () => set(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if(e.target.closest('.nav-item')) set(false); });
}

/* ---- Deploy results card ---- */
let uiDeployResults = [];
function uiResetDeployResults(){ uiDeployResults = []; renderDeployResult(); }
function uiAddDeployResult(r){ uiDeployResults.push(r); renderDeployResult(); }
function renderDeployResult(){
  const box = document.getElementById('deployResult');
  if(!box) return;
  if(!uiDeployResults.length){ box.style.display = 'none'; box.innerHTML = ''; return; }
  box.style.display = 'block';
  box.innerHTML = '<div class="dr-title">' + (uiDeployResults.length === 1 ? 'Deployed' : uiDeployResults.length + ' deployments') + '</div>'
    + uiDeployResults.map((r, i) => {
      const net = NETWORKS[r.network] || { label: r.network, explorer: '' };
      const url = net.explorer ? net.explorer + '/address/' + r.address : '';
      return '<div class="dr-row"><div class="dr-main"><b>' + escapeHtml(r.name) + '</b><span class="dr-net">' + escapeHtml(net.label) + '</span></div>'
        + '<code class="dr-addr">' + escapeHtml(r.address) + '</code>'
        + '<div class="dr-actions"><button type="button" class="btn btn-ghost" data-copy="' + i + '">Copy address</button>'
        + (/^https:\/\//.test(url) ? '<a class="btn btn-ghost" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">View on explorer</a>' : '')
        + '</div></div>';
    }).join('');
}

function initConsoleTools(){
  const box = document.getElementById('deployResult');
  if(box) box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]');
    if(!b) return;
    const r = uiDeployResults[Number(b.dataset.copy)];
    if(r && navigator.clipboard) navigator.clipboard.writeText(r.address).then(() => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Copy address'; }, 1500); });
  });
  const lines = () => [...document.querySelectorAll('#deployConsole .line')];
  const copy = document.getElementById('consoleCopy'), clear = document.getElementById('consoleClear');
  if(copy) copy.addEventListener('click', () => {
    const text = lines().map(l => l.textContent).join('\n');
    if(navigator.clipboard) navigator.clipboard.writeText(text).then(() => { copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy log'; }, 1500); });
  });
  if(clear) clear.addEventListener('click', () => { document.getElementById('deployConsole').innerHTML = ''; });
}

/* ---- Saved session: last contract + generator form values stay in this browser ---- */
const UI_STORE = 'cf_session_v1';
const UI_FORM_PREFIX = /^(swap_|tre_|vault_|ms_|cc_)/;
let uiSaveTimer = null;
const uiRestoredTemplates = {};

function uiStoreRead(){ try{ const o = JSON.parse(localStorage.getItem(UI_STORE) || '{}'); return (o && typeof o === 'object') ? o : {}; }catch(_){ return {}; } }
function uiStoreWrite(o){ try{ localStorage.setItem(UI_STORE, JSON.stringify(o)); }catch(_){ /* storage full or unavailable */ } }

function uiSaveContract(){
  if(typeof pendingSource === 'undefined' || !pendingSource || !pendingSource.code) return;
  const o = uiStoreRead();
  o.contract = { name: pendingSource.name, code: pendingSource.code, args: (typeof pendingCtorArgs !== 'undefined') ? pendingCtorArgs : [], savedAt: Date.now() };
  uiStoreWrite(o);
}

function uiCurrentSimpleTemplate(){
  const form = document.getElementById('simpleForm');
  const btn = form && form.querySelector('button[onclick^="genSimple("]');
  const m = btn && /genSimple\('(\w+)'\)/.exec(btn.getAttribute('onclick'));
  return m ? m[1] : '';
}

function uiFormKey(el){
  if(!el || !el.id || el.type === 'password' || /key|secret|pass/i.test(el.id)) return '';
  if(UI_FORM_PREFIX.test(el.id) && !el.closest('#simpleForm')) return el.id;
  if(el.closest('#simpleForm')){ const t = uiCurrentSimpleTemplate(); return t ? 's:' + t + ':' + el.id : ''; }
  return '';
}

const uiPendingForms = {};
function uiQueueFormSave(el){
  const key = uiFormKey(el);
  if(!key) return;
  uiPendingForms[key] = el.value; // every changed field is kept; one write per burst
  clearTimeout(uiSaveTimer);
  uiSaveTimer = setTimeout(() => {
    const o = uiStoreRead();
    o.forms = Object.assign(o.forms || {}, uiPendingForms);
    Object.keys(uiPendingForms).forEach(k => delete uiPendingForms[k]);
    uiStoreWrite(o);
  }, 250);
}

function uiSetFieldValue(el, v){
  if(!el || typeof v !== 'string') return;
  if(el.tagName === 'SELECT' && ![...el.options].some(op => op.value === v)) return;
  el.value = v;
}

/* Called once per template per page load, right after its form is built. */
function uiRestoreSimpleForm(tpl){
  if(!tpl || uiRestoredTemplates[tpl]) return;
  uiRestoredTemplates[tpl] = true;
  const forms = uiStoreRead().forms || {};
  const prefix = 's:' + tpl + ':';
  Object.keys(forms).filter(k => k.startsWith(prefix)).forEach(k => uiSetFieldValue(document.getElementById('simpleForm').querySelector('#' + k.slice(prefix.length)), forms[k]));
}

function uiRestoreSession(){
  const o = uiStoreRead();
  Object.entries(o.forms || {}).filter(([k]) => !k.startsWith('s:')).forEach(([k, v]) => uiSetFieldValue(document.getElementById(k), v));
  const c = o.contract;
  if(c && typeof c.name === 'string' && typeof c.code === 'string' && c.code && typeof pendingSource !== 'undefined' && !pendingSource.code){
    pendingSource = { name: c.name, code: c.code };
    pendingCtorArgs = Array.isArray(c.args) ? c.args : [];
    const label = document.getElementById('pendingContractLabel');
    if(label) label.value = c.name + '.sol  (' + NETWORKS[activeNetwork].label + ')';
    logConsole('step', 'Restored your last contract (' + c.name + '.sol) from this browser. Use Discard in the top bar to remove it.');
  }
}

function ccDiscard(){
  pendingSource = { name:'', code:'' };
  pendingCtorArgs = [];
  const o = uiStoreRead(); delete o.contract; uiStoreWrite(o);
  const label = document.getElementById('pendingContractLabel');
  if(label) label.value = '— none generated yet';
  document.querySelectorAll('.codepanel').forEach(p => { p.style.display = 'none'; p.innerHTML = ''; });
  renderCtorArgs();
  if(typeof renderMultiDeployPanel === 'function') renderMultiDeployPanel();
}

function uiReload(){ location.reload(); }
function uiResetSaved(){
  try{ localStorage.removeItem(UI_STORE); }catch(_){ /* ignore */ }
  uiReload();
}

function initSession(){
  uiRestoreSession();
  document.addEventListener('input', (e) => uiQueueFormSave(e.target));
  document.addEventListener('change', (e) => uiQueueFormSave(e.target));
  const reset = document.getElementById('resetSavedBtn');
  if(reset) reset.addEventListener('click', uiResetSaved);
}

if(typeof document !== 'undefined'){
  initAdvancedOptions();
  initHome();
  initFieldValidation();
  initMobileMenu();
  initConsoleTools();
  initSession();
  renderCurrentContract();
  if(typeof renderCtorArgs === 'function') renderCtorArgs();
  renderNetBanner();
  renderHeaderMeta();
  initUiAccessibility();
}
