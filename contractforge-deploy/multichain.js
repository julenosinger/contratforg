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

/* Keeps pendingCtorArgs in sync with the constructor of the pending source (also for AI / shared contracts). */
function syncCtorArgsFromSource(){
  const parsed = parseCtorParams(pendingSource.code, pendingSource.name);
  const known = new Map(pendingCtorArgs.map(a => [a.param, a]));
  if(parsed.length === pendingCtorArgs.length && parsed.every(p => known.has(p.param))) return;
  pendingCtorArgs = parsed.map(p => known.get(p.param) || { param:p.param, type:p.type, hint:'static', value:'', userSet:false, genNetwork:activeNetwork });
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

function renderModeSelector(){
  const box = document.getElementById('mcSelector');
  if(!box) return;
  box.innerHTML = '<div class="mc-label">Multichain mode</div><div class="mc-seg" role="group" aria-label="Multichain mode">'
    + Object.keys(MC_MODES).map(k=>'<button type="button" class="mc-btn'+(k===multichainMode?' active':'')+'" data-mode="'+k+'" aria-pressed="'+(k===multichainMode)+'" data-onclick="setMultichainMode(\''+k+'\')">'+MC_MODES[k].label+'</button>').join('')
    + '</div><div class="mc-desc">'+escapeHtml(MC_MODES[multichainMode].desc)+'</div>';
}

if(typeof document !== 'undefined') renderModeSelector();
