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
    + '<span class="nb-note">' + (main ? 'Real funds. Transactions cannot be undone.' : 'Test funds only.') + '</span>';
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
  if(!has){ el.style.display = 'none'; el.innerHTML = ''; return; }
  const lines = pendingSource.code.split('\n').length;
  const nArgs = (typeof pendingCtorArgs !== 'undefined') ? pendingCtorArgs.length : 0;
  const modeChip = (typeof multichainMode !== 'undefined' && multichainMode !== 'single' && typeof MC_MODES !== 'undefined')
    ? '<span class="cc-chip">' + escapeHtml(MC_MODES[multichainMode].label) + '</span>' : '';
  el.style.display = 'flex';
  el.innerHTML = '<div class="cc-info"><span class="cc-label">Current contract</span><b>' + escapeHtml(pendingSource.name) + '.sol</b>'
    + '<span>' + lines + ' lines</span>' + modeChip
    + (nArgs ? '<span class="cc-chip warn">' + nArgs + ' constructor argument' + (nArgs === 1 ? '' : 's') + ' to review</span>' : '')
    + '</div><div class="cc-actions">'
    + '<button type="button" class="btn btn-ghost" onclick="ccAudit()">Audit</button>'
    + '<button type="button" class="btn btn-ghost" onclick="copySource()">Copy</button>'
    + '<button type="button" class="btn btn-ghost" onclick="downloadSource()">Download</button>'
    + '<button type="button" class="btn btn-primary" onclick="ccPublish()">Publish</button></div>';
}
function ccPublish(){ deployFromBuffer(); }
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
  smartwallet: ['s_entrypoint', 's_session'],
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
    if(/^0x0{40}$/.test(v)) return 'The zero address is not allowed.';
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

if(typeof document !== 'undefined'){
  initAdvancedOptions();
  initFieldValidation();
  initMobileMenu();
  renderCurrentContract();
  renderNetBanner();
  renderHeaderMeta();
  initUiAccessibility();
}
