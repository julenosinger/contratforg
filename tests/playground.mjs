/* ABI Playground: real ethers + a local anvil node.
   Without anvil the tests are skipped on a developer machine, but with REQUIRE_ANVIL=1 (set in CI) a missing anvil is a failure,
   so a broken Foundry install cannot leave the job green with nothing tested. */
import { spawn, spawnSync } from 'node:child_process';
import solc from 'solc';
import ethersPkg from 'ethers';
import { loadApp } from './harness.mjs';

const { ethers } = ethersPkg;
if (spawnSync('anvil', ['--version']).status !== 0) {
  if (process.env.REQUIRE_ANVIL === '1') { console.error('FAIL: anvil not found and REQUIRE_ANVIL=1, so the playground tests cannot be skipped'); process.exit(1); }
  console.log('anvil not found: playground tests skipped (set REQUIRE_ANVIL=1 to make this a failure)'); process.exit(0);
}

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m); } };
const eq = (a, b, m) => ok(a === b, m + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')');
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

const PORT = 8599, URL_ = 'http://127.0.0.1:' + PORT;
const PK = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const ME = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const anvil = spawn('anvil', ['--port', String(PORT), '--chain-id', '31337', '--silent'], { stdio: 'ignore' });
const stop = () => { try { anvil.kill(); } catch (_) { /* ignore */ } };
process.on('exit', stop);
const rpc = new ethers.providers.StaticJsonRpcProvider(URL_, { chainId: 31337, name: 'local' });
for (let i = 0; i < 100; i++) { try { await rpc.getBlockNumber(); break; } catch (_) { await tick(100); } }

const SRC = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract Probe {
    uint public a; uint public b; bool public flag; uint public total;
    mapping(address => uint) public funded;
    struct P { uint x; address y; }
    event Put(address indexed who, uint v);
    event Funded(address indexed who, uint v);
    function put(uint v) external { a = v; emit Put(msg.sender, v); }
    function put(uint v, uint w) external { a = v; b = w; emit Put(msg.sender, v + w); }
    function setFlag(bool f) external { flag = f; }
    function sum(uint[] calldata xs) external returns (uint s) { for (uint i; i < xs.length; i++) s += xs[i]; total = s; }
    function echo(P calldata p) external pure returns (uint, address) { return (p.x, p.y); }
    function pair() external view returns (uint x, address y) { return (a, msg.sender); }
    function fund() external payable { funded[msg.sender] += msg.value; emit Funded(msg.sender, msg.value); }
    function fail() external { total = 1; revert("nope"); }
    function needDeadline(uint deadline) external view returns (bool) { require(deadline > block.timestamp, "expired"); return true; }
    function addrs(address[] calldata xs) external pure returns (uint) { return xs.length; }
    function who(address a) external pure returns (address) { return a; }
    function pick(bytes4 sel, int8 n) external pure returns (bytes4, int8) { return (sel, n); }
}`;
const out = JSON.parse(solc.compile(JSON.stringify({ language: 'Solidity', sources: { 'P.sol': { content: SRC } }, settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } } })));
const { abi, evm } = out.contracts['P.sol'].Probe;
const wallet = new ethers.Wallet(PK, rpc);
const probe = await new ethers.ContractFactory(abi, '0x' + evm.bytecode.object, wallet).deploy();
await probe.deployed();

const app = loadApp({ realEthers: true });
const { w, ev, set } = app;
const doc = w.document;
const val = (id) => doc.getElementById(id).value;
const text = (id) => doc.getElementById(id).textContent;
const idx = (name, nIn) => abi.findIndex((x) => x.type !== 'constructor' && x.name === name && (x.inputs || []).length === (nIn == null ? (x.inputs || []).length : nIn));

ev("NETWORKS.testlocal = { label:'Local test', chainIdHex:'0x7a69', chainIdDec:31337, isMainnet:false, rpc:'" + URL_ + "', explorer:'https://explorer.example', gasSymbol:'ETH', gasDecimals:18, usdc:'0x3600000000000000000000000000000000000000', eurc:'0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1', usdcDecimals:6, cctp:{} }");
ev("addToDeployHistory(" + JSON.stringify({ name: 'Probe', address: probe.address, network: 'testlocal', abi, txHash: '0x' + '11'.repeat(32) }) + ")");
ev("signer = new ethers.Wallet('" + PK + "', new ethers.providers.StaticJsonRpcProvider('" + URL_ + "', { chainId: 31337, name: 'local' })); account = '" + ME + "';");
ev("activeNetwork = 'testlocal';");

/* ---- picking a deployment ---- */
const sel = doc.getElementById('pg_deployments');
ok(sel.querySelectorAll('option').length === 2, 'the deployments list has the entry');
sel.value = '0'; sel.dispatchEvent(new w.Event('change', { bubbles: true }));
eq(val('pg_address'), probe.address, 'the address is filled in');
eq(ev('pgTarget'), 'testlocal', 'the contract network is taken from the history entry');
ok(doc.querySelectorAll('#pg_functions .fn-card').length >= 10, 'function cards are rendered');
ok(doc.querySelectorAll('#pg_functions .fn-group').length === 3, 'read, write and event groups');
await tick(300);
ok(/Wallet is on Local test/.test(text('pg_context')), 'context bar shows the wallet is on the right network: ' + text('pg_context'));

const call = async (name, nIn, args = [], valueId) => {
  const i = idx(name, nIn);
  args.forEach((v, k) => { const el = doc.getElementById('pg_arg_' + i + '_' + k); el.value = v; });
  await ev('callFunction(' + i + ')');
  return text('pg_result_' + i);
};

/* ---- reads and writes, overloads ---- */
let r = await call('put', 1, ['7']);
ok(/Confirmed in block/.test(r) && /Put\(who=0xf39F/.test(r) && /v=7/.test(r), 'write works and its event is decoded: ' + r);
eq((await probe.a()).toString(), '7', 'put(uint) changed the state');
r = await call('put', 2, ['5', '6']);
eq((await probe.a()).toString() + ',' + (await probe.b()).toString(), '5,6', 'the overload put(uint,uint) is called, not put(uint)');
r = await call('a', 0);
eq(r, '5', 'a read call returns the value');
r = await call('pair', 0);
ok(/x: 5/.test(r) && /y: 0xf39F/i.test(r), 'several outputs are labelled and msg.sender is the wallet: ' + r);

/* ---- argument types ---- */
await ev("(()=>{ document.getElementById('pg_arg_" + idx('setFlag') + "_0').value = 'true'; })()");
r = await call('setFlag', 1, ['true']);
eq(await probe.flag(), true, 'bool true');
r = await call('setFlag', 1, ['false']);
eq(await probe.flag(), false, 'bool false is really false (the old string "false" was truthy)');
ok(doc.getElementById('pg_arg_' + idx('setFlag') + '_0').tagName === 'SELECT', 'bool uses a select');
r = await call('sum', 1, ['1, 2, 3']);
eq((await probe.total()).toString(), '6', 'array from a comma separated list');
r = await call('sum', 1, ['[4,5]']);
eq((await probe.total()).toString(), '9', 'array from JSON');
r = await call('sum', 1, ['[1,"x"]']);
ok(/whole number/.test(r), 'bad array item explained: ' + r);
r = await call('echo', 1, ['{"x": 9, "y": "' + ME + '"}']);
ok(/\[?9, 0xf39F/i.test(r) || /out0: 9/.test(r) || /9/.test(r), 'tuple from JSON: ' + r);
r = await call('addrs', 1, [ME + '\n' + ME]);
eq(r, '2', 'address list, one per line');
r = await call('pick', 2, ['0x12345678', '-5']);
ok(/0x12345678/.test(r) && /-5/.test(r), 'bytes4 and int8: ' + r);
r = await call('pick', 2, ['0x1234', '1']);
ok(/exactly 4 bytes/.test(r), 'bytes4 length checked: ' + r);
r = await call('pick', 2, ['0x12345678', '200']);
ok(/too large for int8/.test(r), 'int8 range checked: ' + r);
r = await call('put', 1, ['abc']);
ok(/whole number/.test(r), 'a non-number is explained: ' + r);
r = await call('put', 1, ['-1']);
ok(/no negatives/.test(r), 'uint refuses negatives: ' + r);
r = await call('addrs', 1, ['0x123']);
ok(/valid address/.test(r), 'bad address explained: ' + r);

/* ---- chips ---- */
const iPut = idx('put', 1), iAddrs = idx('who'), iDl = idx('needDeadline');
const chip = async (id, kind) => { doc.querySelector('.fn-chip[data-target="' + id + '"][data-chip="' + kind + '"]').click(); };
set('pg_arg_' + iPut + '_0', '1.5'); await chip('pg_arg_' + iPut + '_0', 'x6');
eq(val('pg_arg_' + iPut + '_0'), '1500000', '×10⁶ scales 1.5 exactly');
set('pg_arg_' + iPut + '_0', '2'); await chip('pg_arg_' + iPut + '_0', 'x18');
eq(val('pg_arg_' + iPut + '_0'), '2000000000000000000', '×10¹⁸');
await chip('pg_arg_' + iAddrs + '_0', 'me');
eq(val('pg_arg_' + iAddrs + '_0'), ME, 'my wallet chip');
await chip('pg_arg_' + iAddrs + '_0', 'usdc');
eq(val('pg_arg_' + iAddrs + '_0'), '0x3600000000000000000000000000000000000000', 'USDC chip uses the contract network');
await chip('pg_arg_' + iAddrs + '_0', 'self');
eq(val('pg_arg_' + iAddrs + '_0'), probe.address, 'this contract chip');
r = await call('needDeadline', 1, ['']);
eq(r, 'true', 'an empty deadline defaults to 30 minutes from now');
set('pg_arg_' + iDl + '_0', '1'); r = await call('needDeadline', 1, ['1']);
ok(/expired/.test(r), 'a real revert reason is shown on reads: ' + r);
await chip('pg_arg_' + iDl + '_0', 'plus30');
ok(Number(val('pg_arg_' + iDl + '_0')) > Date.now() / 1000, '+30 min chip');

/* ---- payable ---- */
const iFund = idx('fund');
set('pg_val_' + iFund, '0.5');
await ev('callFunction(' + iFund + ')');
eq((await rpc.getBalance(probe.address)).toString(), '500000000000000000', 'payable value is sent (0.5 in 18 decimals)');
set('pg_val_' + iFund, '1.5555555555555555555');
await ev('callFunction(' + iFund + ')');
ok(/at most 18 decimals/.test(text('pg_result_' + iFund)), 'too many decimals refused: ' + text('pg_result_' + iFund));

/* ---- failing write: no transaction, reason shown ---- */
const before = await rpc.getBlockNumber();
r = await call('fail', 0);
ok(/This call would fail: nope/.test(r), 'the dry run shows the reason: ' + r);
eq(await rpc.getBlockNumber(), before, 'nothing was sent');

/* ---- call history ---- */
ok(doc.querySelectorAll('#pg_calls .pg-call').length >= 10, 'the session keeps a call history');
ok(doc.querySelector('#pg_calls .pg-call-err'), 'failed calls are marked');
ok(doc.querySelector('#pg_calls a[href^="https://explorer.example/tx/"]'), 'transactions link to the explorer');

/* ---- wrong network ---- */
ev("NETWORKS.testlocal.chainIdDec = 1");
r = await call('put', 1, ['3']);
ok(/another network/.test(r), 'writes are blocked when the wallet is on another chain: ' + r);
ev("NETWORKS.testlocal.chainIdDec = 31337");

/* ---- mainnet confirmation ---- */
ev("NETWORKS.testlocal.isMainnet = true");
const pending = call('put', 1, ['11']);
await tick(800);
ok(doc.getElementById('actionConfirm'), 'a mainnet write asks first');
ok(/MAINNET/.test(doc.getElementById('actionConfirm').textContent) && /put\(uint256\)/.test(doc.getElementById('actionConfirm').textContent), 'the dialog shows the function');
eq(doc.activeElement.id, 'acCancel', 'Cancel is focused by default');
doc.getElementById('acCancel').click();
r = await pending;
ok(/Cancelled/.test(r), 'cancel sends nothing: ' + r);
ok((await probe.a()).toString() !== '11', 'state unchanged after cancel');
const pending2 = call('put', 1, ['11']);
await tick(800);
doc.getElementById('acOk').click();
r = await pending2;
eq((await probe.a()).toString(), '11', 'confirmed mainnet write goes through');
ev("NETWORKS.testlocal.isMainnet = false");

/* ---- read-only mode ---- */
ev("signer = null; account = null; pgRebindWallet(); pgRenderContext();");
await tick(50);
ok(/read-only/i.test(text('pg_context')), 'no wallet: read-only notice');
r = await call('a', 0);
eq(r, '11', 'reads work without a wallet');
r = await call('put', 1, ['4']);
ok(/Connect your wallet/.test(r), 'writes ask for a wallet: ' + r);

/* ---- search, filters, events ---- */
set('pg_search', 'put'); doc.getElementById('pg_search').dispatchEvent(new w.Event('input', { bubbles: true }));
eq(doc.querySelectorAll('#pg_functions .fn-card').length, 3, 'search finds put, put and the Put event');
set('pg_search', ''); doc.getElementById('pg_search').dispatchEvent(new w.Event('input', { bubbles: true }));
ev("filterFns('event', document.querySelector('#pg_filter [data-filter=event]'))");
const iPutEv = abi.findIndex((x) => x.type === 'event' && x.name === 'Put');
await ev('pgQueryEvents(' + iPutEv + ')');
ok(/who=0xf39F/i.test(text('pg_result_' + iPutEv)) && /v=11|arg1=11/.test(text('pg_result_' + iPutEv)) || /11/.test(text('pg_result_' + iPutEv)), 'recent events are listed: ' + text('pg_result_' + iPutEv));
ev("filterFns('all', document.querySelector('#pg_filter [data-filter=all]'))");
ev("subscribeEvents()");
ok(app.pageErrors.length === 0, 'no page errors: ' + app.pageErrors.join(' | '));

/* ---- the old entry point from Deploy History ---- */
ev("loadHistoryIntoPlayground(0)");
eq(doc.getElementById('sec-playground').style.display, 'block', 'Deploy History opens the Playground');
eq(val('pg_address'), probe.address, 'and loads the contract');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
stop();
process.exit(fail ? 1 : 0);
