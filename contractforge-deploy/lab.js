/* ======================================================================
   18 — TEST LAB
   Runs the generated contract on a private simulated chain inside the browser (ethereumjs EVM,
   loaded from lab-evm.js on first use). No wallet, no network, no real funds. Test accounts hold
   test USDC and EURC, time can be moved forward, and every call shows its events and revert reason.
   Uses playground.js for argument parsing and function cards.
   ====================================================================== */
const LAB_NAMES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve'];
const LAB_HEX = ['a11ce', 'b0b', 'ca401', 'da7e', 'e7e'];
const LAB_AUX = {
  usdc: '0x00000000000000000000000000000000000055dc',
  eurc: '0x00000000000000000000000000000000000000ec',
  messenger: '0x0000000000000000000000000000000000000a11',
  transmitter: '0x0000000000000000000000000000000000000a12',
};
const LAB_TOKEN_ABI = [
  'function mint(address to, uint256 amount)', 'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)', 'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event DepositForBurn(address indexed burnToken, uint256 amount, address indexed depositor, bytes32 mintRecipient, uint32 destinationDomain, uint256 maxFee, uint32 minFinalityThreshold)',
];
const LAB_PANIC = { 1: 'assertion failed', 17: 'arithmetic overflow or underflow', 18: 'division by zero', 33: 'invalid enum value', 34: 'storage encoding error', 49: 'pop on an empty array', 50: 'array index out of bounds', 65: 'out of memory', 81: 'call to an uninitialized function' };

const LAB_MOCKS_SRC = `// SPDX-License-Identifier: MIT
pragma solidity >=0.8.20 <0.9.0;
abstract contract LabERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 public totalSupply;
    uint8 public constant decimals = 6;
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function mint(address to, uint256 amount) external { balanceOf[to] += amount; totalSupply += amount; emit Transfer(address(0), to, amount); }
    function approve(address spender, uint256 amount) external returns (bool) { allowance[msg.sender][spender] = amount; emit Approval(msg.sender, spender, amount); return true; }
    function transfer(address to, uint256 amount) external returns (bool) { _move(msg.sender, to, amount); return true; }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a != type(uint256).max) { require(a >= amount, "ERC20: insufficient allowance"); allowance[from][msg.sender] = a - amount; }
        _move(from, to, amount);
        return true;
    }
    function _move(address from, address to, uint256 amount) internal {
        require(balanceOf[from] >= amount, "ERC20: transfer amount exceeds balance");
        balanceOf[from] -= amount; balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }
}
contract LabUSDC is LabERC20 {
    function name() external pure returns (string memory) { return "USD Coin (test)"; }
    function symbol() external pure returns (string memory) { return "USDC"; }
}
contract LabEURC is LabERC20 {
    function name() external pure returns (string memory) { return "Euro Coin (test)"; }
    function symbol() external pure returns (string memory) { return "EURC"; }
}
interface ILabToken { function transferFrom(address from, address to, uint256 amount) external returns (bool); }
contract LabMessenger {
    event DepositForBurn(address indexed burnToken, uint256 amount, address indexed depositor, bytes32 mintRecipient, uint32 destinationDomain, uint256 maxFee, uint32 minFinalityThreshold);
    function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes32, uint256 maxFee, uint32 minFinalityThreshold) external {
        require(ILabToken(burnToken).transferFrom(msg.sender, address(this), amount), "burn failed");
        emit DepositForBurn(burnToken, amount, msg.sender, mintRecipient, destinationDomain, maxFee, minFinalityThreshold);
    }
}
contract LabTransmitter { function localDomain() external pure returns (uint32) { return 26; } }
`;

const LAB = {
  lab: null, accounts: [], acting: 0, tokens: { usdc: '', eurc: '' }, mocks: null, mocksVersion: '',
  compiled: null, contract: null, txs: [], logs: [], filter: 'all', ctorInputs: null, busy: false, loadedHash: '', tokenIface: null,
};

/* ---------------- small helpers ---------------- */
function labAddr(hex){
  const raw = '0x' + String(hex).replace(/^0x/, '').padStart(40, '0');
  try{ return ethers.utils.getAddress(raw); }catch(_){ return raw; }   // checksummed when ethers is available
}
function labActing(){ return LAB.accounts[LAB.acting] || { name: 'Alice', addr: labAddr(LAB_HEX[0]) }; }
function labNameOf(addr){
  const a = String(addr || '').toLowerCase();
  const acct = LAB.accounts.find(x => x.addr.toLowerCase() === a);
  if(acct) return acct.name;
  if(LAB.contract && LAB.contract.address.toLowerCase() === a) return 'the contract';
  if(LAB.tokens.usdc.toLowerCase() === a) return 'USDC';
  if(LAB.tokens.eurc.toLowerCase() === a) return 'EURC';
  return pgShort(addr);
}
function labHash(s){ let h = 5381; for(let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h) + ':' + s.length; }

function labLog(type, msg){
  const c = document.getElementById('lab_log');
  if(!c) return;
  const line = document.createElement('div');
  line.className = 'line ' + (type || '');
  const t = new Date().toLocaleTimeString('en-US', { hour12: false });
  line.innerHTML = '<span class="t">[' + t + ']</span><span class="msg">' + escapeHtml(msg) + '</span>';
  c.appendChild(line); c.scrollTop = c.scrollHeight;
}

function labStatus(text, kind){
  const el = document.getElementById('labStatus');
  if(!el) return;
  el.textContent = text;
  el.className = 'lab-status' + (kind ? ' lab-status-' + kind : '');
}

PG_CTX.lab = function(){
  const a = labActing();
  return {
    me: a.addr, meLabel: a.name + ' (acting)', self: LAB.contract ? LAB.contract.address : '', usdc: LAB.tokens.usdc, eurc: LAB.tokens.eurc,
    extra: LAB.accounts.filter((x, i) => i !== LAB.acting).map(x => ({ key: x.name.toLowerCase(), label: x.name, value: x.addr })),
  };
};

/* ---------------- engine and compiler ---------------- */
async function labEnsureEngine(){
  if(window.LabEVM && window.LabEVM.Lab) return;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'lab-evm.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load the simulator (lab-evm.js). Check your connection and try again.'));
    document.head.appendChild(s);
  });
  if(!(window.LabEVM && window.LabEVM.Lab)) throw new Error('The simulator did not start.');
}

async function labCompile(name, code){
  const version = document.getElementById('solcVersion').value;
  await ensureSolcLoaded(version);
  const input = {
    language: 'Solidity', sources: { [name + '.sol']: { content: code } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'] } }, optimizer: { enabled: true, runs: 200 } },
  };
  const out = JSON.parse(await solcCompile(JSON.stringify(input)));
  const errs = (out.errors || []).filter(e => e.severity === 'error');
  if(errs.length){
    errs.slice(0, 4).forEach(e => labLog('err', e.formattedMessage.split('\n')[0]));
    const err = new Error('The contract does not compile. Fix the errors above.'); err.handled = true; throw err;
  }
  return { contracts: out.contracts[name + '.sol'], version };
}

async function labMocks(){
  const version = document.getElementById('solcVersion').value;
  if(LAB.mocks && LAB.mocksVersion === version) return LAB.mocks;
  const { contracts } = await labCompile('LabMocks', LAB_MOCKS_SRC);
  const pick = (n) => '0x' + contracts[n].evm.deployedBytecode.object;
  LAB.mocks = { usdc: pick('LabUSDC'), eurc: pick('LabEURC'), messenger: pick('LabMessenger'), transmitter: pick('LabTransmitter') };
  LAB.mocksVersion = version;
  return LAB.mocks;
}

/* ---------------- chain state ---------------- */
async function labResetState(){
  const net = NETWORKS[activeNetwork];
  LAB.lab = await window.LabEVM.Lab.create({ chainId: net.chainIdDec, timestamp: Math.floor(Date.now() / 1000) });
  LAB.accounts = LAB_NAMES.map((name, i) => ({ name, addr: labAddr(LAB_HEX[i]) }));
  LAB.acting = Math.min(LAB.acting, LAB.accounts.length - 1);
  for(const a of LAB.accounts) await LAB.lab.setBalance(a.addr, 1000n * 10n ** 18n);
  LAB.txs = []; LAB.logs = []; LAB.contract = null; LAB.compiled = null; LAB.ctorInputs = null;
  LAB.tokenIface = new ethers.utils.Interface(LAB_TOKEN_ABI);
}

/* the real USDC/EURC addresses that a contract hard-codes get the test tokens, so it works unchanged */
function labKnownTokenAddrs(code){
  const found = { usdc: null, eurc: null };
  const lits = (String(code).match(/0x[0-9a-fA-F]{40}/g) || []).map(s => s.toLowerCase());
  const all = Object.values(NETWORKS);
  for(const l of lits){
    if(!found.usdc && all.some(n => n.usdc && n.usdc.toLowerCase() === l)) found.usdc = l;
    if(!found.eurc && all.some(n => n.eurc && n.eurc.toLowerCase() === l)) found.eurc = l;
  }
  return found;
}

async function labSetupTokens(code){
  const mocks = await labMocks();
  const known = labKnownTokenAddrs(code);
  LAB.tokens.usdc = known.usdc || LAB_AUX.usdc;
  LAB.tokens.eurc = known.eurc || LAB_AUX.eurc;
  await LAB.lab.setCode(LAB.tokens.usdc, mocks.usdc);
  await LAB.lab.setCode(LAB.tokens.eurc, mocks.eurc);
  await LAB.lab.setCode(LAB_AUX.messenger, mocks.messenger);
  await LAB.lab.setCode(LAB_AUX.transmitter, mocks.transmitter);
  for(const a of LAB.accounts){
    for(const t of [LAB.tokens.usdc, LAB.tokens.eurc]){
      await LAB.lab.tx({ from: a.addr, to: t, data: LAB.tokenIface.encodeFunctionData('mint', [a.addr, 1000000n * 10n ** 6n]) });
    }
  }
  LAB.lab.setTime(Math.floor(Date.now() / 1000));
}

/* ---------------- readable errors and events ---------------- */
function labRevertText(ret){
  if(!ret || ret === '0x') return 'reverted without a reason';
  const sel = ret.slice(0, 10);
  try{
    if(sel === '0x08c379a0') return 'reverted: ' + ethers.utils.defaultAbiCoder.decode(['string'], '0x' + ret.slice(10))[0];
    if(sel === '0x4e487b71'){
      const code = ethers.utils.defaultAbiCoder.decode(['uint256'], '0x' + ret.slice(10))[0].toNumber();
      return 'panic: ' + (LAB_PANIC[code] || ('code 0x' + code.toString(16)));
    }
    if(LAB.contract){
      const p = LAB.contract.iface.parseError(ret);
      return 'reverted: ' + p.name + '(' + p.errorFragment.inputs.map((inp, k) => (inp.name || 'arg' + k) + '=' + formatResult(p.args[k])).join(', ') + ')';
    }
  }catch(_){ /* fall through */ }
  return 'reverted with data ' + ret.slice(0, 74);
}

function labErrorText(res){
  const e = String(res.error || '');
  if(e === 'revert') return labRevertText(res.returnData);
  if(/out of gas/i.test(e)) return 'ran out of gas (the lab allows 15,000,000 per call)';
  if(/code size/i.test(e)) return 'the contract is bigger than the 24 KB limit, so it could not be deployed on a real chain either';
  if(/insufficient balance/i.test(e)) return 'the account does not have enough native balance for this value';
  if(/static state change/i.test(e)) return 'tried to change state inside a read-only call';
  return e;
}

function labDecodeEvents(logs){
  const list = [];
  if(LAB.contract) list.push({ iface: LAB.contract.iface, address: LAB.contract.address });
  list.push({ iface: LAB.tokenIface, address: LAB.tokens.usdc, label: 'USDC' }, { iface: LAB.tokenIface, address: LAB.tokens.eurc, label: 'EURC' }, { iface: LAB.tokenIface, address: LAB_AUX.messenger, label: 'CCTP messenger (test)' });
  return pgDecodeLogs(logs, list);
}

/* ---------------- balances, time, history ---------------- */
async function labTokenBalance(token, who){
  const r = await LAB.lab.staticCall({ from: who, to: token, data: LAB.tokenIface.encodeFunctionData('balanceOf', [who]) });
  return r.ok ? ethers.BigNumber.from(r.returnData) : ethers.BigNumber.from(0);
}

async function labRefreshBalances(){
  const box = document.getElementById('lab_balances');
  if(!box || !LAB.lab) return;
  const fmt = (bn, dec, digits) => { const s = ethers.utils.formatUnits(bn, dec); const [i, f = ''] = s.split('.'); return Number(i).toLocaleString('en-US') + (digits && f.replace(/0+$/, '') ? '.' + f.slice(0, digits) : ''); };
  const rows = LAB.accounts.map(a => ({ name: a.name, addr: a.addr })).concat(LAB.contract ? [{ name: 'Contract', addr: LAB.contract.address }] : []);
  let html = '<table class="lab-table"><thead><tr><th></th><th>Native</th><th>USDC</th><th>EURC</th></tr></thead><tbody>';
  for(let i = 0; i < rows.length; i++){
    const r = rows[i];
    const nat = await LAB.lab.getBalance(r.addr);
    const u = await labTokenBalance(LAB.tokens.usdc, r.addr), e = await labTokenBalance(LAB.tokens.eurc, r.addr);
    html += '<tr' + (i === LAB.acting ? ' class="lab-acting"' : '') + '><td><b>' + escapeHtml(r.name) + '</b> <span class="lab-addr">' + escapeHtml(pgShort(r.addr)) + '</span></td><td>' + fmt(ethers.BigNumber.from(nat.toString()), 18, 4) + '</td><td>' + fmt(u, 6, 2) + '</td><td>' + fmt(e, 6, 2) + '</td></tr>';
  }
  box.innerHTML = html + '</tbody></table>';
}

function labRenderTime(){
  const el = document.getElementById('lab_time');
  if(!el || !LAB.lab) return;
  el.textContent = new Date(Number(LAB.lab.timestamp) * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC · block ' + LAB.lab.number;
}

function labAdvance(seconds){
  if(!LAB.lab){ labLog('warn', 'Start the lab first.'); return; }
  const s = Number(seconds);
  if(!Number.isFinite(s) || s <= 0){ labLog('warn', 'Enter a positive number of seconds.'); return; }
  LAB.lab.advance({ seconds: s });
  labRenderTime();
  labLog('ok', 'Moved time forward by ' + labHumanDuration(s) + '.');
}
function labAdvanceCustom(){
  const unit = Number(document.getElementById('lab_time_unit').value);
  const n = Number(document.getElementById('lab_time_n').value);
  labAdvance(n * unit);
}
function labMine(){
  const n = Math.max(1, Math.floor(Number(document.getElementById('lab_mine_n').value) || 1));
  if(!LAB.lab) return;
  LAB.lab.advance({ blocks: n });
  labRenderTime();
  labLog('ok', 'Mined ' + n + ' block(s).');
}
function labHumanDuration(s){
  const d = [[86400, 'day'], [3600, 'hour'], [60, 'minute'], [1, 'second']];
  for(const [u, n] of d){ if(s >= u && s % u === 0) return (s / u) + ' ' + n + (s / u === 1 ? '' : 's'); }
  return s + ' seconds';
}

function labRecord(entry){
  LAB.txs.unshift(entry);
  if(LAB.txs.length > 40) LAB.txs.length = 40;
  const box = document.getElementById('lab_txs');
  if(!box) return;
  box.style.display = LAB.txs.length ? 'block' : 'none';
  box.innerHTML = '<div class="fn-group">Transactions in the lab</div>' + LAB.txs.map(c =>
    '<div class="pg-call pg-call-' + (c.ok ? 'ok' : 'err') + '"><div class="pg-call-top"><b>' + escapeHtml(c.fn) + '</b>'
    + '<span class="pg-call-kind">' + escapeHtml(c.kind) + '</span><span class="pg-call-kind">by ' + escapeHtml(c.by) + '</span><span class="pg-call-time">' + escapeHtml(c.when) + '</span></div>'
    + (c.args ? '<div class="pg-call-line">args: ' + escapeHtml(c.args) + '</div>' : '')
    + '<div class="pg-call-line">' + (c.ok ? '' : 'failed: ') + escapeHtml(c.result) + (c.gas ? ' · gas ' + escapeHtml(c.gas) : '') + '</div>'
    + (c.events && c.events.length ? '<div class="pg-call-line pg-call-ev">' + c.events.map(escapeHtml).join('<br>') + '</div>' : '')
    + '</div>').join('');
}

/* ---------------- load and deploy the current contract ---------------- */
function labCtorDefault(inp, i){
  const meta = (typeof pendingCtorArgs !== 'undefined' && pendingCtorArgs.length === (LAB.ctorInputs || []).length) ? pendingCtorArgs[i] : null;
  if(meta){
    switch(meta.hint){
      case 'usdc': return LAB.tokens.usdc;
      case 'eurc': return LAB.tokens.eurc;
      case 'tokenMessenger': return LAB_AUX.messenger;
      case 'messageTransmitter': return LAB_AUX.transmitter;
      case 'gasAlias': return ZERO_ADDRESS;
      case 'nativeScaled': return scaleUnits(meta.units, (NETWORKS[activeNetwork] && NETWORKS[activeNetwork].gasDecimals) || 18);
      default: return meta.userSet || meta.hint === 'static' ? (meta.value || '') : '';
    }
  }
  return '';
}

function labRenderCtorForm(){
  const box = document.getElementById('labArgs');
  if(!box) return;
  const inputs = LAB.ctorInputs;
  if(!inputs || !inputs.length){ box.style.display = 'none'; box.innerHTML = ''; return; }
  const ctx = PG_CTX.lab();
  box.style.display = 'block';
  box.innerHTML = '<div class="fn-group">Constructor arguments</div>'
    + '<p class="lab-note">Filled with test values where the lab can supply them (test USDC, EURC, the CCTP stand-ins). Anything left empty needs a value.</p>'
    + inputs.map((inp, i) => pgInputHtml('lab', 'ctor', i, inp, ctx)).join('')
    + '<div class="btnrow" style="margin-top:10px;"><button class="btn btn-primary" onclick="labDeployWithArgs()">Deploy in the lab</button></div>';
  inputs.forEach((inp, i) => { const el = document.getElementById('lab_arg_ctor_' + i); if(el) el.value = labCtorDefault(inp, i); });
}

async function labLoadContract(){
  if(LAB.busy) return;
  if(!pendingSource || !pendingSource.code){
    labLog('warn', 'Generate a contract first (sections 01 to 06), then come back here.');
    labStatus('No contract yet', 'warn');
    return;
  }
  if(typeof reqBlockReason === 'function' && reqBlockReason()){
    labLog('warn', reqBlockReason());
    labStatus('Draft: fix the required fields first', 'warn');
    return;
  }
  LAB.busy = true;
  labStatus('Starting the simulator…', 'busy');
  try{
    await labEnsureEngine();
    labLog('step', 'Starting a private chain…');
    await labResetState();
    labStatus('Compiling…', 'busy');
    await labSetupTokens(pendingSource.code);
    const { contracts } = await labCompile(pendingSource.name, pendingSource.code);
    const names = Object.keys(contracts);
    const target = contracts[pendingSource.name] ? pendingSource.name : names[names.length - 1];
    LAB.compiled = { name: target, abi: contracts[target].abi, bytecode: '0x' + contracts[target].evm.bytecode.object };
    LAB.loadedHash = labHash(pendingSource.code);
    LAB.ctorInputs = (LAB.compiled.abi.find(x => x.type === 'constructor') || { inputs: [] }).inputs;
    labRenderCtorForm();
    if(LAB.ctorInputs.length){
      labStatus('Waiting for constructor arguments', 'warn');
      labLog('step', target + ' needs ' + LAB.ctorInputs.length + ' constructor argument(s). Check the values below, then press "Deploy in the lab".');
      await labRefreshBalances(); labRenderTime(); labRenderHeader();
    } else {
      await labDeploy([]);
    }
  }catch(e){
    labStatus('Could not start', 'err');
    if(!e.handled) labLog('err', e.message || String(e));
  }finally{
    LAB.busy = false;
  }
}

async function labDeployWithArgs(){
  if(!LAB.compiled || LAB.busy) return;
  LAB.busy = true;
  try{
    const values = LAB.ctorInputs.map((inp, i) => {
      const el = document.getElementById('lab_arg_ctor_' + i);
      return pgCoerce(inp.type, el ? el.value : '', inp.components, inp.name || ('argument ' + (i + 1)));
    });
    await labDeploy(values);
  }catch(e){
    labLog('err', e.message || String(e));
  }finally{
    LAB.busy = false;
  }
}

async function labDeploy(values){
  const c = LAB.compiled;
  const types = LAB.ctorInputs.map(x => x.type);
  const data = c.bytecode + (types.length ? ethers.utils.defaultAbiCoder.encode(LAB.ctorInputs, values).slice(2) : '');
  const from = labActing();
  const res = await LAB.lab.tx({ from: from.addr, data, gasLimit: 30000000n });
  const when = new Date(Number(LAB.lab.timestamp) * 1000).toISOString().slice(11, 19);
  if(!res.ok){
    const why = labErrorText(res);
    labRecord({ fn: 'deploy ' + c.name, kind: 'deploy', by: from.name, ok: false, result: why, when });
    labStatus('Deploy failed', 'err');
    labLog('err', 'Deploy failed: ' + why);
    return;
  }
  LAB.contract = { name: c.name, address: labAddr(res.created), abi: c.abi, iface: new ethers.utils.Interface(c.abi) };
  labRecord({ fn: 'deploy ' + c.name, kind: 'deploy', by: from.name, ok: true, result: 'deployed at ' + LAB.contract.address, gas: String(res.gasUsed), when });
  labStatus('Ready: ' + c.name + ' at ' + pgShort(LAB.contract.address), 'ok');
  labLog('ok', c.name + ' is deployed in the lab at ' + LAB.contract.address + ' (gas ' + res.gasUsed + ').');
  labRenderCtorForm();
  labRenderFunctions();
  labRenderHeader();
  labRenderTime();
  await labRefreshBalances();
}

/* ---------------- function cards and calls ---------------- */
function labRenderFunctions(){
  const container = document.getElementById('lab_functions');
  if(!container) return;
  if(!LAB.contract){ container.innerHTML = ''; return; }
  const search = document.getElementById('lab_search');
  pgBuildCards({
    container, abi: LAB.contract.abi, prefix: 'lab', filter: LAB.filter, search: search ? search.value : '',
    handlers: { call: 'labCall', events: 'labEvents' }, nativeSymbol: 'native',
  });
}

function labFilter(filter, el){
  LAB.filter = filter;
  document.querySelectorAll('#lab_filter .pill').forEach(p => p.classList.remove('active'));
  if(el) el.classList.add('active');
  labRenderFunctions();
}

function labSelectAccount(){
  const sel = document.getElementById('lab_acting');
  LAB.acting = Number(sel.value) || 0;
  const a = labActing();
  const addr = document.getElementById('lab_acting_addr');
  if(addr) addr.textContent = a.addr;
  labRefreshBalances();
}

async function labCall(idx){
  if(!LAB.contract){ labLog('warn', 'Load a contract first.'); return; }
  const item = LAB.contract.abi[idx];
  const result = document.getElementById('lab_result_' + idx);
  const sig = pgSig(item);
  const read = pgIsRead(item);
  const from = labActing();
  result.className = 'fn-result';
  let args, value = 0n, argsText = '';
  try{
    args = pgReadArgs('lab', idx, item);
    argsText = args.length ? args.map(formatResult).join(', ') : '';
    const v = item.stateMutability === 'payable' ? pgReadValue('lab', idx, 18) : null;
    value = v ? BigInt(v) : 0n;
  }catch(e){
    result.className = 'fn-result err'; result.textContent = e.message; return;
  }
  try{
    const data = LAB.contract.iface.encodeFunctionData(sig, args);
    const req = { from: from.addr, to: LAB.contract.address, data, value };
    const when = () => new Date(Number(LAB.lab.timestamp) * 1000).toISOString().slice(11, 19);
    if(read){
      const res = await LAB.lab.staticCall(req);
      if(!res.ok){
        const why = labErrorText(res);
        result.className = 'fn-result err'; result.textContent = why;
        labRecord({ fn: item.name, kind: 'read', by: from.name, ok: false, args: argsText, result: why, when: when() });
        return;
      }
      const decoded = LAB.contract.iface.decodeFunctionResult(sig, res.returnData);
      const outs = item.outputs || [];
      const text = outs.length === 1 ? formatResult(decoded[0]) : outs.length ? pgFormatOutputs(item, decoded) : 'ok';
      result.textContent = text;
      labRecord({ fn: item.name, kind: 'read', by: from.name, ok: true, args: argsText, result: text.replace(/\s+/g, ' ').slice(0, 300), when: when() });
      return;
    }
    const res = await LAB.lab.tx(req);
    LAB.logs.push(...res.logs);
    if(!res.ok){
      const why = labErrorText(res);
      result.className = 'fn-result err'; result.textContent = why;
      labRecord({ fn: item.name, kind: 'tx', by: from.name, ok: false, args: argsText, result: why, when: when() });
      labLog('err', item.name + '() ' + why);
      return;
    }
    const ev = labDecodeEvents(res.logs);
    result.textContent = 'Success · gas ' + res.gasUsed + (ev.length ? '\n' + ev.join('\n') : '');
    labRecord({ fn: item.name, kind: 'tx', by: from.name, ok: true, args: argsText, result: 'success', gas: String(res.gasUsed), events: ev, when: when() });
    labLog('ok', from.name + ' called ' + item.name + '() (gas ' + res.gasUsed + ')');
    labRenderTime();
    await labRefreshBalances();
  }catch(e){
    const msg = e.message || String(e);
    result.className = 'fn-result err'; result.textContent = msg;
    labLog('err', item.name + '() ' + msg);
  }
}

function labEvents(idx){
  const item = LAB.contract.abi[idx];
  const result = document.getElementById('lab_result_' + idx);
  const topic = LAB.contract.iface.getEventTopic(ethers.utils.EventFragment.from(item));
  const mine = LAB.logs.filter(l => l.address.toLowerCase() === LAB.contract.address.toLowerCase() && l.topics[0] === topic);
  if(!mine.length){ result.className = 'fn-result'; result.textContent = 'No ' + item.name + ' events yet in this lab session.'; return; }
  result.className = 'fn-result';
  result.textContent = mine.slice(-20).reverse().map((l) => {
    const p = LAB.contract.iface.parseLog({ topics: l.topics, data: l.data });
    return p.eventFragment.inputs.map((inp, k) => (inp.name || 'arg' + k) + '=' + formatResult(p.args[k])).join(', ');
  }).join('\n');
}

/* ---------------- token helpers and a quick check ---------------- */
function labTokenAddr(){ return document.getElementById('lab_token').value === 'eurc' ? LAB.tokens.eurc : LAB.tokens.usdc; }

async function labTokenTx(fnName, args, who, label){
  const res = await LAB.lab.tx({ from: who.addr, to: labTokenAddr(), data: LAB.tokenIface.encodeFunctionData(fnName, args) });
  if(!res.ok) { labLog('err', label + ' failed: ' + labErrorText(res)); return false; }
  labLog('ok', label);
  return true;
}

async function labMint(){
  if(!LAB.lab){ labLog('warn', 'Start the lab first.'); return; }
  const amt = pgScaleUp(document.getElementById('lab_token_amt').value, 6);
  if(amt === null){ labLog('err', 'Enter an amount like 1000 or 12.5 (at most 6 decimals).'); return; }
  const a = labActing(), sym = document.getElementById('lab_token').value.toUpperCase();
  await labTokenTx('mint', [a.addr, amt], a, 'Minted ' + document.getElementById('lab_token_amt').value + ' test ' + sym + ' to ' + a.name);
  await labRefreshBalances();
}

async function labApprove(){
  if(!LAB.lab || !LAB.contract){ labLog('warn', 'Load a contract first.'); return; }
  const all = document.getElementById('lab_approve_all').checked, sym = document.getElementById('lab_token').value.toUpperCase();
  const who = all ? LAB.accounts : [labActing()];
  for(const a of who) await labTokenTx('approve', [LAB.contract.address, ethers.constants.MaxUint256.toString()], a, a.name + ' approved the contract to spend ' + sym);
}

async function labSmoke(){
  if(!LAB.contract){ labLog('warn', 'Load a contract first.'); return; }
  const reads = LAB.contract.abi.map((x, i) => [x, i]).filter(([x]) => pgIsRead(x) && !(x.inputs || []).length);
  labLog('step', 'Quick check: calling ' + reads.length + ' read function(s) that need no input…');
  let bad = 0;
  for(const [item] of reads){
    const sig = pgSig(item);
    const res = await LAB.lab.staticCall({ from: labActing().addr, to: LAB.contract.address, data: LAB.contract.iface.encodeFunctionData(sig, []) });
    if(res.ok){
      const d = LAB.contract.iface.decodeFunctionResult(sig, res.returnData);
      labLog('ok', item.name + '() → ' + pgFormatOutputs(item, (item.outputs || []).length === 1 ? d[0] : d).replace(/\s+/g, ' ').slice(0, 140));
    } else { bad++; labLog('err', item.name + '() ' + labErrorText(res)); }
  }
  labLog(bad ? 'warn' : 'ok', 'Quick check done: ' + (reads.length - bad) + ' ok, ' + bad + ' failed.');
}

/* ---------------- header state ---------------- */
function labRenderHeader(){
  const el = document.getElementById('labContract');
  if(!el) return;
  const has = pendingSource && pendingSource.code;
  const stale = LAB.contract && has && LAB.loadedHash !== labHash(pendingSource.code);
  let html;
  if(!has) html = '<span class="lab-note">No contract yet. Generate one in sections 01 to 06, then press Load.</span>';
  else html = 'Current contract: <b>' + escapeHtml(pendingSource.name) + '.sol</b>' + (LAB.contract ? ' · in the lab: <b>' + escapeHtml(LAB.contract.name) + '</b> at <code>' + escapeHtml(LAB.contract.address) + '</code>' : '')
    + (stale ? ' <span class="pgc-warn">The contract changed since it was loaded. Press "Load current contract" to test the new version.</span>' : '');
  el.innerHTML = html;
}

function labInit(){
  const sel = document.getElementById('lab_acting');
  if(sel){
    sel.innerHTML = LAB_NAMES.map((n, i) => '<option value="' + i + '">' + n + '</option>').join('');
    document.getElementById('lab_acting_addr').textContent = labAddr(LAB_HEX[0]);
  }
  const search = document.getElementById('lab_search');
  if(search) search.addEventListener('input', labRenderFunctions);
  labRenderHeader();
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', labInit); else labInit();
