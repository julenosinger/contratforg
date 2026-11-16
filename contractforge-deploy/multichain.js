/* ======================================================================
   MULTICHAIN — mode selector, portable contracts, constructor arguments
   Loaded after app.js (shares its globals: NETWORKS, activeNetwork, pendingSource…).
   In "single" mode (default) nothing here changes what the generators produce.
   ====================================================================== */

const MC_MODES = {
  single:   { label:'Single network', desc:'Contracts are generated for the selected network (default behaviour).' },
  portable: { label:'Portable',       desc:'Same source on every chain. Token and protocol addresses are set when you deploy.' },
  multi:    { label:'Multi-deploy',   desc:'Portable, plus deploy the same contract to several networks in one go.' },
  cross:    { label:'Crosschain',     desc:'Multi-deploy, plus a Circle CCTP V2 USDC bridge for each chain.' }
};

let multichainMode = 'single';
try{ const saved = localStorage.getItem('cf_mc_mode'); if(saved && MC_MODES[saved]) multichainMode = saved; }catch(_){ /* storage unavailable */ }

function isPortable(){ return multichainMode !== 'single'; }

/* ---------------- CCTP V2 (source: developers.circle.com/cctp/references/contract-addresses) ---------------- */
const CCTP_V2_ADDR = {
  mainnet: { tokenMessenger:'0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d', messageTransmitter:'0x81D40F21F12A8F0E3252Bccb954D722d4c464B64' },
  testnet: { tokenMessenger:'0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA', messageTransmitter:'0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275' }
};
const CCTP_DOMAINS = { // network key -> CCTP domain id
  ethereum:0, avalanche:1, optimism:2, arbitrum:3, base:6, polygon:7, arcMain:26,
  sepolia:0, opsep:2, arbsep:3, basesep:6, amoy:7, arc:26
};
function cctpV2(netKey){
  const n = NETWORKS[netKey];
  if(!n || CCTP_DOMAINS[netKey] === undefined) return null;
  const a = n.isMainnet ? CCTP_V2_ADDR.mainnet : CCTP_V2_ADDR.testnet;
  return { domain: CCTP_DOMAINS[netKey], tokenMessenger: a.tokenMessenger, messageTransmitter: a.messageTransmitter };
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/* ---------------- Constructor arguments ---------------- */
/* pendingCtorArgs: [{ param, type, hint, value, userSet, units, label, note }]
   hint decides the value per network: usdc | eurc | tokenMessenger | messageTransmitter |
   nativeScaled (units × 10^native decimals) | static (same value everywhere) */
let pendingCtorArgs = [];

/* '1000' or '0.5' -> smallest units as a decimal string */
function scaleUnits(units, decimals){
  const m = /^(\d+)(?:\.(\d+))?$/.exec(String(units == null ? '0' : units).trim());
  if(!m) return '';
  const frac = (m[2] || '').slice(0, decimals).padEnd(decimals, '0');
  return (BigInt(m[1]) * (10n ** BigInt(decimals)) + BigInt(frac || '0')).toString();
}

function hintValue(arg, netKey){
  const n = NETWORKS[netKey];
  if(!n) return '';
  switch(arg.hint){
    case 'usdc': return n.usdc || '';
    case 'eurc': return n.eurc || '';
    case 'tokenMessenger': return cctpV2(netKey)?.tokenMessenger || '';
    case 'messageTransmitter': return cctpV2(netKey)?.messageTransmitter || '';
    case 'gasAlias': return (n.gasSymbol === 'USDC' && n.usdc) ? n.usdc : ZERO_ADDRESS; // ERC-20 address of the same money as the gas token, or none
    case 'nativeScaled': return scaleUnits(arg.perNetworkDefault && n.walletDailyDefault ? n.walletDailyDefault : arg.units, n.gasDecimals || 18);   // untouched = each network's own default
    default: return arg.value || '';
  }
}

/* The value shown for a network: what the user typed applies to the network it was generated for. */
function ctorArgValue(arg, netKey){
  if(arg.userSet && netKey === arg.genNetwork) return arg.value;
  const v = hintValue(arg, netKey);
  return v || (netKey === arg.genNetwork ? (arg.value || '') : '');
}

function escRe(s){ return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

/* Turns chain-specific literals in generated Solidity into constructor parameters.
   specs: [{ kind:'addr',   name, type, value, param, hint, userSet, optional, check }
            { kind:'scaled', name, expr, tokenParam }                  (expr * 10**6  ->  expr * 10**decimals())
            { kind:'uint',   name, rhs, param, hint, value, units }    (constant -> constructor value) ]
   Returns the new source and fills pendingCtorArgs. A no-op in single mode. */
function portabilize(code, specs){
  pendingCtorArgs = [];
  if(typeof mdState !== 'undefined') mdState.edits = {};
  if(!isPortable() || !specs.length) return code;

  const params = [], assigns = [], checks = [], args = [];
  let needsDecimals = false;
  const addParam = (param, type) => { if(!params.some(p => p.endsWith(' ' + param))) params.push(type + ' ' + param); };

  for(const sp of specs){
    if(sp.kind === 'addr'){
      const isAddr = sp.type === 'address';
      const lit = escRe(sp.value);
      const re = isAddr
        ? new RegExp('^([ \\t]*)address(\\s+public)(\\s+immutable)?\\s+' + sp.name + '\\s*=\\s*' + lit + ';', 'm')
        : new RegExp('^([ \\t]*)' + sp.type + '(\\s+public)(\\s+immutable)?\\s+' + sp.name + '\\s*=\\s*' + sp.type + '\\(' + lit + '\\);', 'm');
      if(!re.test(code)) throw new Error('portabilize: declaration of "' + sp.name + '" not found');
      code = code.replace(re, (m, ind, pub, imm) => `${ind}${sp.type}${pub}${imm || ''} ${sp.name};`);
      addParam(sp.param, 'address');
      assigns.push(isAddr ? `${sp.name} = ${sp.param};` : `${sp.name} = ${sp.type}(${sp.param});`);
      if(!sp.optional && sp.check !== false && !checks.includes(sp.param)){
        checks.push(sp.param);
      }
      if(!args.some(a => a.param === sp.param)){
        args.push({ param: sp.param, type:'address', allowZero: !!sp.allowZero, hint: sp.hint || 'static', value: sp.argValue !== undefined ? sp.argValue : sp.value, userSet: !!sp.userSet, genNetwork: activeNetwork, optional: !!sp.optional });
      }
    } else if(sp.kind === 'scaled'){
      const re = new RegExp('^([ \\t]*)uint256(\\s+public)\\s+' + sp.name + '\\s*=\\s*' + escRe(sp.expr) + '\\s*\\*\\s*10\\*\\*6;[^\\n]*', 'm');
      if(!re.test(code)) throw new Error('portabilize: declaration of "' + sp.name + '" not found');
      code = code.replace(re, (m, ind, pub) => `${ind}uint256${pub} ${sp.name};`);
      const m = /^(\d+)(?:\.(\d+))?$/.exec(String(sp.expr).trim());
      if(!m) throw new Error('portabilize: "' + sp.expr + '" is not a number');
      const digits = m[1] + (m[2] || ''), scale = (m[2] || '').length;
      if(/^0+$/.test(digits)) continue; // zero stays zero, no token call needed
      needsDecimals = true;
      assigns.push(`${sp.name} = ${digits} * 10**uint256(IERC20(${sp.tokenParam}).decimals())${scale ? ' / 10**' + scale : ''};`);
    } else if(sp.kind === 'uint'){
      const re = new RegExp('^([ \\t]*)uint256\\s+public\\s+constant\\s+' + sp.name + '(\\s*)=\\s*' + escRe(sp.rhs) + ';', 'm');
      if(!re.test(code)) throw new Error('portabilize: declaration of "' + sp.name + '" not found');
      code = code.replace(re, (m, ind) => `${ind}uint256 public ${sp.name};`);
      addParam(sp.param, 'uint256');
      assigns.push(`${sp.name} = ${sp.param};`);
      args.push({ param: sp.param, type:'uint256', hint: sp.hint || 'static', value: sp.value, units: sp.units, perNetworkDefault: !!sp.perNetworkDefault, userSet: !!sp.userSet, genNetwork: activeNetwork, note: sp.note });
    } else {
      throw new Error('portabilize: unknown spec kind');
    }
  }

  const reqLines = checks.map(p => `require(${p}.code.length > 0, "${p.replace(/_$/, '')} is not a contract");`);
  const ctor = /constructor\(\)\s*\{/;
  if(!ctor.test(code)) throw new Error('portabilize: constructor not found');
  const body = [...reqLines, ...assigns].map(l => `        ${l}\n`).join('');
  code = code.replace(ctor, `constructor(${params.join(', ')}) {\n${body}       `);

  if(needsDecimals && !/function\s+decimals\s*\(/.test(code.split(/\ncontract\s/)[0])){
    code = code.replace(/(interface\s+IERC20\s*\{\n)/, '$1    function decimals() external view returns (uint8);\n');
  }

  pendingCtorArgs = args;
  return code;
}

/* ---------------- Reading constructor parameters out of Solidity source ---------------- */
function parseCtorParams(src, contractName){
  if(!src) return [];
  let start = 0;
  if(contractName){
    const m = new RegExp('\\bcontract\\s+' + escRe(contractName) + '\\b').exec(src);
    if(m) start = m.index;
  }
  const rest = src.slice(start);
  const nextContract = rest.slice(10).search(/\n\s*(?:abstract\s+)?contract\s+\w+/);
  const scope = nextContract === -1 ? rest : rest.slice(0, nextContract + 10);
  const m = /constructor\s*\(([^)]*)\)/.exec(scope);
  if(!m || !m[1].trim()) return [];
  return m[1].split(',').map(s => s.trim()).filter(Boolean).map(part => {
    const toks = part.split(/\s+/).filter(t => !['memory','calldata','storage','payable'].includes(t));
    return { type: toks[0], param: toks[toks.length - 1] };
  });
}

/* Keeps pendingCtorArgs in sync with the constructor of the pending source (also for AI / shared contracts). When a
   specific contract was resolved (a selected target), the form is driven by that target's compiled ABI instead, so the
   source re-parse is skipped — otherwise it would overwrite the ABI-synced form with the first contract's constructor. */
function syncCtorArgsFromSource(){
  if(pendingSource && pendingSource.resolvedTarget) return;
  const parsed = parseCtorParams(pendingSource.code, pendingSource.name);
  const known = new Map(pendingCtorArgs.map(a => [a.param, a]));
  if(parsed.length === pendingCtorArgs.length && parsed.every(p => known.has(p.param))) return;
  pendingCtorArgs = parsed.map(p => known.get(p.param) || { param:p.param, type:p.type, hint:'static', value:'', userSet:false, genNetwork:activeNetwork });
}

/* Rebuilds the constructor form schema from the selected contract's compiled ABI — the authoritative source. A selected
   target may have a different constructor than the contract the form was first parsed from. Values are kept only for
   parameters whose name still matches (their type is re-labelled from the ABI); everything else is cleared, never
   silently carried across to another contract. A no-op when the form already matches, so builder defaults are untouched. */
function syncCtorArgsFromAbi(ctorInputs){
  ctorInputs = ctorInputs || [];
  const prev = pendingCtorArgs || [];
  const names = ctorInputs.map((inp) => inp.name || '');
  const prevNames = prev.map((a) => a.param || '');
  const same = names.length === prevNames.length && names.every((n, i) => n === prevNames[i]);
  if(same) return;
  if(!ctorInputs.length){
    if(prev.length){ pendingCtorArgs = []; renderCtorArgs(); }
    return;
  }
  pendingCtorArgs = ctorInputs.map((inp, i) => {
    const name = inp.name || ('arg' + i);
    const match = prev.find((a) => (a.param || '') === name);
    return match ? { ...match, type: inp.type } : { param: name, type: inp.type, hint:'static', value:'', userSet:false, genNetwork:activeNetwork };
  });
  renderCtorArgs();
}

function coerceCtorValue(type, raw, label, opts){
  const v = String(raw == null ? '' : raw).trim();
  if(type === 'address'){
    if(!/^0x[0-9a-fA-F]{40}$/.test(v)) throw new Error(label + ': enter a valid address (0x + 40 hex characters).');
    if(v.toLowerCase() === ZERO_ADDRESS){
      if(opts && opts.allowZero) return v;
      throw new Error(label + ': the zero address is not allowed.');
    }
    if(/[a-f]/.test(v.slice(2)) && /[A-F]/.test(v.slice(2)) && typeof ethers !== 'undefined' && ethers.utils && ethers.utils.getAddress){
      try{ return ethers.utils.getAddress(v); }catch(_){ throw new Error(label + ': address checksum is wrong.'); }
    }
    return v;
  }
  if(/^u?int\d*$/.test(type)){
    if(!/^\d+$/.test(v)) throw new Error(label + ': enter a whole number.');
    return v;
  }
  if(type === 'bool'){
    if(v !== 'true' && v !== 'false') throw new Error(label + ': enter true or false.');
    return v === 'true';
  }
  if(/^bytes\d*$/.test(type)){
    if(!/^0x[0-9a-fA-F]*$/.test(v)) throw new Error(label + ': enter hex data starting with 0x.');
    return v;
  }
  if(type === 'string') return String(raw == null ? '' : raw);
  throw new Error(label + ': type ' + type + ' is not supported in this form. Deploy it with a script instead.');
}

/* Values from the "Constructor arguments" panel, checked against the compiled constructor. */
function collectCtorValues(abiInputs){
  if(!abiInputs.length) return [];
  const rows = pendingCtorArgs;
  if(rows.length !== abiInputs.length) throw new Error('This contract needs '+abiInputs.length+' constructor argument(s). Open "Constructor arguments" below and fill them in.');
  return abiInputs.map((inp, i) => {
    const el = document.getElementById('ctor_arg_'+i);
    const raw = el ? el.value : '';
    return coerceCtorValue(inp.type, raw, inp.name || ('argument '+(i+1)), { allowZero: !!rows[i].allowZero });
  });
}

/* Label/value pairs of the constructor panel, for the confirmation summary. */
function ctorSummary(){
  return pendingCtorArgs.map((a, i) => { const el = document.getElementById('ctor_arg_'+i); return { label: a.param.replace(/_$/, ''), value: el ? el.value : '' }; });
}

/* ---------------- UI: constructor arguments panel ---------------- */
function renderCtorArgs(){
  if(typeof renderCurrentContract === 'function') renderCurrentContract();
  const box = document.getElementById('ctorArgsPanel');
  if(!box) return;
  const hasSource = !!(pendingSource && pendingSource.code);
  if(hasSource) syncCtorArgsFromSource();
  const rows = pendingCtorArgs;
  if(!hasSource || !rows.length){ box.style.display = 'none'; box.innerHTML = ''; return; }
  const net = NETWORKS[activeNetwork];
  box.style.display = 'block';
  box.innerHTML = '<div class="mc-title">Constructor arguments <span>for '+escapeHtml(net.label)+'</span></div>'
    + rows.map((a,i)=>{
      const val = ctorArgValue(a, activeNetwork);
      const missing = !val;
      const hintTxt = ({usdc:'USDC on this network', eurc:'EURC on this network', tokenMessenger:'Circle CCTP V2 TokenMessenger', messageTransmitter:'Circle CCTP V2 MessageTransmitter', nativeScaled:'amount in the native token\'s smallest unit', static:''})[a.hint] || '';
      return '<div class="field"><label>'+escapeHtml(a.param.replace(/_$/,''))+' <span class="mc-type">'+escapeHtml(a.type)+'</span></label>'
        + '<input id="ctor_arg_'+i+'" data-type="'+escapeHtml(a.type)+'"'+(a.allowZero?' data-allowzero="1"':'')+' value="'+escapeHtml(val)+'" placeholder="'+(a.type==='address'?'0x…':'')+'" />'
        + '<div class="hint'+(missing?' mc-missing':'')+'">'+(missing?'No default for this network. Enter a value. ':'')+escapeHtml(hintTxt)+(a.note?' '+escapeHtml(a.note):'')+'</div></div>';
    }).join('');
}

/* ---------------- UI: mode selector ---------------- */
function setMultichainMode(mode){
  if(!MC_MODES[mode]) return;
  multichainMode = mode;
  try{ localStorage.setItem('cf_mc_mode', mode); }catch(_){ /* ignore */ }
  renderModeSelector();
  const hadSource = !!(pendingSource && pendingSource.code);
  logConsole('ok','Multichain mode: '+MC_MODES[mode].label+(hadSource?' — generate the contract again to apply it.':''));
  renderCtorArgs();
  if(typeof renderNetBanner === 'function') renderNetBanner();
  if(typeof renderMultiDeployPanel === 'function') renderMultiDeployPanel();
}

/* ---------------- UI: deployment mode control (shared, Phase 8.4) ----------------
   The mode lives in `multichainMode` and is changed only by setMultichainMode() above (same keys, same cf_mc_mode storage).
   Every <div class="dm-mount"> in the page gets one compact trigger; they all open the same popover (#dmPopover, a single
   element on <body>, so no parent can clip it) and they are all refreshed by renderModeSelector(), which setMultichainMode()
   already calls. Choosing a mode only sets the mode: it never compiles, deploys, switches the wallet chain or touches sources. */
const DM_ICONS = {
  single:   ['M12 6a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M7 19h10', 'M12 12v7'],
  portable: ['M4 8l8-4 8 4v8l-8 4-8-4z', 'M4 8l8 4 8-4', 'M12 12v8'],
  multi:    ['M12 4v6', 'M12 10l-6 8', 'M12 10v8', 'M12 10l6 8'],
  cross:    ['M4 8h14', 'M15 5l3 3-3 3', 'M20 16H6', 'M9 13l-3 3 3 3']
};
const DM_NOTE = 'Changing the mode only sets how the next contract is generated and deployed. Nothing is compiled or deployed, and your inputs are kept. Generate the contract again to apply it.';
const dmState = { open: false, trigger: null, bound: false };

function dmEl(tag, cls, text){
  const el = document.createElement(tag);
  if(cls) el.className = cls;
  if(text !== undefined) el.textContent = text;
  return el;
}
function dmSvg(paths, cls){
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('class', cls);
  paths.forEach(d => { const path = document.createElementNS(ns, 'path'); path.setAttribute('d', d); svg.appendChild(path); });
  return svg;
}

function dmPopover(){
  let pop = document.getElementById('dmPopover');
  if(pop) return pop;
  pop = dmEl('div', 'dm-pop');
  pop.id = 'dmPopover'; pop.hidden = true; pop.tabIndex = -1;
  pop.setAttribute('role', 'listbox'); pop.setAttribute('aria-label', 'Deployment mode');
  Object.keys(MC_MODES).forEach(k => {
    const opt = dmEl('button', 'dm-opt'); opt.type = 'button'; opt.tabIndex = -1;
    opt.setAttribute('role', 'option'); opt.setAttribute('data-dm-mode', k);
    const text = dmEl('span', 'dm-text');
    text.appendChild(dmEl('b', '', MC_MODES[k].label));
    text.appendChild(dmEl('span', 'dm-d', MC_MODES[k].desc));
    opt.appendChild(dmSvg(DM_ICONS[k], 'dm-ico')); opt.appendChild(text); opt.appendChild(dmSvg(['M5 12l5 5 9-10'], 'dm-check'));
    pop.appendChild(opt);
  });
  pop.appendChild(dmEl('p', 'dm-note'));
  document.body.appendChild(pop);
  return pop;
}

function dmClose(restoreFocus){
  const pop = document.getElementById('dmPopover');
  if(pop) pop.hidden = true;
  const t = dmState.trigger;
  if(t){ t.setAttribute('aria-expanded', 'false'); if(restoreFocus && t.focus) t.focus(); }
  dmState.open = false; dmState.trigger = null;
}

function dmPlace(trigger, pop){
  const r = trigger.getBoundingClientRect();
  const vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
  const w = pop.offsetWidth || 340, h = pop.offsetHeight || 300;
  const left = Math.max(8, Math.min(r.left, vw - w - 8));
  const below = vh - r.bottom - 8 >= h || r.top < h + 8;
  pop.style.left = left + 'px';
  if(below){ pop.style.top = Math.max(8, r.bottom + 6) + 'px'; pop.style.bottom = 'auto'; }
  else { pop.style.bottom = Math.max(8, vh - r.top + 6) + 'px'; pop.style.top = 'auto'; }
}

function dmOpen(trigger){
  const pop = dmPopover();
  if(dmState.open) dmClose(false);
  pop.querySelectorAll('.dm-opt').forEach(o => o.setAttribute('aria-selected', String(o.getAttribute('data-dm-mode') === multichainMode)));
  const mount = trigger.closest('.dm-mount');
  pop.querySelector('.dm-note').textContent = (mount && mount.getAttribute('data-dm-note')) || DM_NOTE;
  pop.hidden = false;
  dmPlace(trigger, pop);
  trigger.setAttribute('aria-expanded', 'true');
  dmState.open = true; dmState.trigger = trigger;
  const sel = pop.querySelector('.dm-opt[aria-selected="true"]') || pop.querySelector('.dm-opt');
  if(sel) sel.focus();
}

function dmToggle(btn){
  if(dmState.open && dmState.trigger === btn) dmClose(true);
  else dmOpen(btn);
}

function dmBind(){
  if(dmState.bound || typeof document === 'undefined') return;
  dmState.bound = true;   // one set of listeners for the whole page, however many times the control is redrawn
  document.addEventListener('click', (e) => {
    const t = e.target && e.target.closest ? e.target : null;
    if(!t) return;
    const opt = t.closest('.dm-opt');
    if(opt){ setMultichainMode(opt.getAttribute('data-dm-mode')); dmClose(true); return; }
    if(dmState.open && !t.closest('#dmPopover') && !t.closest('.dm-trigger')) dmClose(false);
  });
  document.addEventListener('keydown', (e) => {
    const pop = document.getElementById('dmPopover');
    if(!dmState.open){
      const onTrigger = e.target && e.target.classList && e.target.classList.contains('dm-trigger');
      if(onTrigger && (e.key === 'ArrowDown' || e.key === 'ArrowUp')){ e.preventDefault(); dmOpen(e.target); }
      return;
    }
    if(e.key === 'Escape'){ e.preventDefault(); e.stopImmediatePropagation(); dmClose(true); return; }
    if(e.key === 'Tab'){ dmClose(true); return; }
    const opts = [...pop.querySelectorAll('.dm-opt')];
    const i = opts.indexOf(document.activeElement);
    let next = -1;
    if(e.key === 'ArrowDown') next = i < 0 ? 0 : (i + 1) % opts.length;
    else if(e.key === 'ArrowUp') next = i < 0 ? opts.length - 1 : (i - 1 + opts.length) % opts.length;
    else if(e.key === 'Home') next = 0;
    else if(e.key === 'End') next = opts.length - 1;
    if(next >= 0){ e.preventDefault(); opts[next].focus(); }
  });
  window.addEventListener('resize', () => { if(dmState.open) dmClose(false); });
  document.addEventListener('scroll', (e) => { const pop = document.getElementById('dmPopover'); if(dmState.open && !(pop && e.target instanceof Node && pop.contains(e.target))) dmClose(false); }, true);
}

function renderModeSelector(){
  if(typeof document === 'undefined') return;
  const m = MC_MODES[multichainMode];
  dmPopover(); dmBind();
  document.querySelectorAll('.dm-mount').forEach(mount => {
    let btn = mount.querySelector('.dm-trigger');
    if(!btn){      // built once, then only updated, so focus and open state survive a mode change
      btn = dmEl('button', 'dm-trigger'); btn.type = 'button';
      btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'dmPopover');
      btn.setAttribute('data-onclick', 'dmToggle(this)');
      btn.appendChild(dmSvg(DM_ICONS[multichainMode], 'dm-ico'));
      btn.appendChild(dmEl('span', 'dm-k', 'Deployment Mode:'));
      btn.appendChild(dmEl('b', 'dm-v'));
      btn.appendChild(dmEl('span', 'dm-caret', '\u25BE')).setAttribute('aria-hidden', 'true');
      mount.appendChild(btn);
    }
    btn.querySelector('.dm-v').textContent = m.label;
    btn.setAttribute('aria-label', 'Deployment mode: ' + m.label + '. Change');
    const paths = btn.querySelectorAll('svg.dm-ico path');
    const want = DM_ICONS[multichainMode];
    if(paths.length !== want.length){ const fresh = dmSvg(want, 'dm-ico'); btn.replaceChild(fresh, btn.querySelector('svg.dm-ico')); }
    else paths.forEach((p, i) => p.setAttribute('d', want[i]));
  });
  const pop = document.getElementById('dmPopover');
  pop.querySelectorAll('.dm-opt').forEach(o => o.setAttribute('aria-selected', String(o.getAttribute('data-dm-mode') === multichainMode)));
  document.querySelectorAll('#homeModes .home-card[data-mode]').forEach(c => {      // the Home cards share the same state
    const on = c.getAttribute('data-mode') === multichainMode;
    c.classList.toggle('active', on); c.setAttribute('aria-pressed', String(on));
  });
  if(typeof CFBuilder !== 'undefined') CFBuilder.renderAll();      // every builder overview shows the mode
}

if(typeof document !== 'undefined') renderModeSelector();
