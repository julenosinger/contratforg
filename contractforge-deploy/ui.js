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

if(typeof document !== 'undefined'){
  initAdvancedOptions();
  renderCurrentContract();
  renderNetBanner();
  renderHeaderMeta();
  initUiAccessibility();
}
