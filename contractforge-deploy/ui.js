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

if(typeof document !== 'undefined'){
  renderNetBanner();
  renderHeaderMeta();
  initUiAccessibility();
}
