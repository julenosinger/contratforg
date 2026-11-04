/* Test Lab: the generated contracts run on the in-browser EVM (the real lab-evm.js bundle). */
import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';
import { loadApp, root, addrFor } from './harness.mjs';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m); } };
const eq = (a, b, m) => ok(a === b, m + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')');
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

function boot() {
  const app = loadApp({ realEthers: true });
  const { w, ev } = app;
  w.TextEncoder ??= TextEncoder; w.TextDecoder ??= TextDecoder; w.crypto ??= globalThis.crypto; w.structuredClone ??= structuredClone;
  w.eval(fs.readFileSync(path.join(root, 'lab-evm.js'), 'utf8'));            // what the browser does when the tab is opened
  w.__solcCompile = (i) => solc.compile(i);
  ev("ensureSolcLoaded = async () => {}; solcCompile = async (i) => window.__solcCompile(i);");
  return app;
}

const app = boot();
const { w, ev, set } = app;
const doc = w.document;
const text = (id) => doc.getElementById(id).textContent;
const A = (i) => ev('LAB.accounts[' + i + '].addr');
const fnIdx = (name, n) => ev('LAB.contract.abi.findIndex(x => x.name === "' + name + '"' + (n == null ? '' : ' && x.inputs.length === ' + n) + ')');
const setAct = (i) => { doc.getElementById('lab_acting').value = String(i); doc.getElementById('lab_acting').dispatchEvent(new w.Event('change')); };
async function call(name, args = [], opt = {}) {
  const i = fnIdx(name, args.length);
  args.forEach((v, k) => { doc.getElementById('lab_arg_' + i + '_' + k).value = v; });
  if (opt.value) doc.getElementById('lab_val_' + i).value = opt.value;
  await ev('labCall(' + i + ')');
  return text('lab_result_' + i);
}
const bal = async (token, who) => (await ev('labTokenBalance(LAB.tokens.' + token + ', "' + who + '")')).toString();

doc.querySelector('.nav-item[data-section="lab"]').click();
eq(doc.getElementById('sec-lab').style.display, 'block', 'the Test Lab opens from the menu');
ok(/No contract yet/.test(text('labContract')), 'nothing to test yet is explained');
await ev('labLoadContract()');
ok(/Generate a contract first/.test(text('lab_log')), 'loading without a contract explains what to do');

/* ================= Escrow (portable): fund, release, with the lab accounts as the parties ================= */
ev("setMultichainMode('portable')");
ev("activeNetwork = 'arcMain'; updateSideNet();");
ev("renderSimpleForm('escrow')"); await tick();
// the form takes the lab accounts as buyer, seller and arbiter
const ALICE = ev("labAddr('a11ce')"), BOB = ev("labAddr('b0b')"), CAROL = ev("labAddr('ca401')");
set('s_buyer', ALICE); set('s_seller', BOB); set('s_arbiter', CAROL);
ev("genSimple('escrow')");
await ev('labLoadContract()');
ok(/Waiting for constructor arguments/.test(text('labStatus')), 'a contract with constructor arguments waits for them: ' + text('labStatus'));
eq(doc.getElementById('lab_arg_ctor_0').value, ev('LAB.tokens.usdc'), 'the token argument is filled with the test USDC');
await ev('labDeployWithArgs()');
ok(/Ready: ArcEscrow/.test(text('labStatus')), 'the escrow is deployed in the lab: ' + text('labStatus'));
ok(doc.querySelectorAll('#lab_functions .fn-card').length >= 8, 'function cards are shown');
ok(doc.querySelector('#lab_functions .fn-chip[data-chip="extra:bob"]'), 'address inputs offer the other test accounts');
const escrow = ev('LAB.contract.address');
const amount = (await ev("(async()=>{ const r = await LAB.lab.staticCall({from: LAB.accounts[0].addr, to: LAB.contract.address, data: LAB.contract.iface.encodeFunctionData('amount')}); return ethers.BigNumber.from(r.returnData).toString(); })()"));
eq(amount, '100000000', 'amount is 100 tokens scaled by the token decimals (6)');

let r = await call('fund');
ok(/transfer amount exceeds balance|allowance/.test(r), 'funding without approval fails with the token reason: ' + r);
doc.getElementById('lab_approve_all').checked = false;
await ev('labApprove()');
r = await call('fund');
ok(/Success/.test(r) && /Transfer\(from=0x/.test(r) && /USDC/.test(r), 'funding works after approval and the token event is decoded: ' + r);
eq(await bal('usdc', escrow), '100000000', 'the escrow holds the funds');
eq(await bal('usdc', A(0)), '999900000000', 'Alice paid 100 (of her 1,000,000)');
setAct(1);                                           // Bob is not the buyer
r = await call('release');
ok(/reverted/.test(r), 'the seller cannot release: ' + r);
setAct(0);
r = await call('release');
ok(/Success/.test(r), 'the buyer releases');
eq(await bal('usdc', A(1)), '1000100000000', 'Bob (the seller) received the payment');
eq(await bal('usdc', escrow), '0', 'the escrow is empty');
ok(/Alice/.test(text('lab_txs')) && /Bob/.test(text('lab_txs')), 'the transaction list names who acted');
ok(doc.querySelector('#lab_balances .lab-acting'), 'balances table highlights the acting account');

/* ================= Vesting: time travel ================= */
ev("renderSimpleForm('vesting')"); await tick();
set('s_beneficiary', BOB);
ev("genSimple('vesting')");
await ev('labLoadContract()'); await ev('labDeployWithArgs()');
await ev('labApprove()');
await call('fund');
const rel = async () => (await ev("(async()=>{ const r = await LAB.lab.staticCall({from: LAB.accounts[0].addr, to: LAB.contract.address, data: LAB.contract.iface.encodeFunctionData('releasable')}); return ethers.BigNumber.from(r.returnData).toString(); })()"));
eq(await rel(), '0', 'nothing is releasable before the cliff');
const t0 = BigInt(ev('String(LAB.lab.timestamp)'));
await ev('labAdvance(86400 * 30)');
eq((BigInt(ev('String(LAB.lab.timestamp)')) - t0).toString(), String(86400 * 30), 'time moves forward by exactly the requested amount');
ok(/UTC · block/.test(text('lab_time')), 'the clock is shown');
eq(await rel(), '0', 'still before the 90 day cliff');
await ev('labAdvance(86400 * 400)');
eq(await rel(), '120000000000', 'after the whole period everything is releasable (120,000 tokens)');
setAct(1);
r = await call('release');
ok(/Success/.test(r), 'the beneficiary releases');
eq(await bal('usdc', A(1)), (1000000000000n + 120000000000n).toString(), 'Bob received the vested amount');

/* ================= single mode: real USDC/EURC addresses are replaced by the test tokens ================= */
ev("setMultichainMode('single')");
ev("renderSimpleForm('erc20')"); await tick();
ev("activeNetwork = 'arcMain'; updateSideNet(); document.getElementById('swap_kind').value = 'amm'; document.getElementById('swap_multi').value = 'single';");
ev("genSwap()");
ok(/0x3600000000000000000000000000000000000000/.test(ev('pendingSource.code')), 'the AMM hard-codes the real USDC address');
setAct(0);
await ev('labLoadContract()');
ok(/Ready: ArcSwapAMM/.test(text('labStatus')), 'the AMM deploys: ' + text('labStatus'));
eq(ev('LAB.tokens.usdc'), '0x3600000000000000000000000000000000000000', 'the test USDC sits at the real USDC address');
eq(ev('LAB.tokens.eurc.toLowerCase()'), '0xbef5f6d51cb62b58e6a8f77868681825c6fe21c1', 'and the test EURC at the real EURC address');
eq(await bal('usdc', A(0)), '1000000000000', 'accounts start with 1,000,000 test USDC');
doc.getElementById('lab_approve_all').checked = false;
doc.getElementById('lab_token').value = 'usdc'; await ev('labApprove()');
doc.getElementById('lab_token').value = 'eurc'; await ev('labApprove()');
const dl = String(Math.floor(Date.now() / 1000) + 3600);
r = await call('addLiquidity', ['1000000000', '1000000000', '0', '0', dl]);
ok(/Success/.test(r) && /LiquidityAdded/.test(r), 'liquidity added and its events decoded: ' + r);
r = await call('swapAtoB', ['10000000', '999999999999', dl]);
ok(/slippage exceeded/.test(r), 'a custom revert reason is shown: ' + r);
r = await call('swapAtoB', ['10000000', '1', dl]);
ok(/Success/.test(r) && /Swap\(/.test(r), 'a swap succeeds');
const out = await bal('eurc', A(0));
ok(BigInt(out) > 999000000000n - 1000000000n + 9000000n, 'Alice received EURC for her USDC: ' + out);
await ev('labAdvance(7200)');
r = await call('swapAtoB', ['1000000', '1', dl]);
ok(/expired/.test(r), 'moving time past the deadline makes the swap fail with "expired": ' + r);
r = await call('getAmountOut', ['1000000', 'true']);
ok(/^\d+$/.test(r), 'a read call returns a number: ' + r);

/* ================= revert decoding, panics, native value, size limit ================= */
const CUSTOM = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
contract Probe {
    error Nope(address who, uint256 n);
    uint256 public total; address public last;
    constructor(uint256 start, address owner_) { total = start; last = owner_; }
    function boom() external pure { revert Nope(address(0xBEEF), 7); }
    function over() external pure returns (uint256) { uint256 x = type(uint256).max; return x + 1; }
    function idx(uint256 i) external pure returns (uint256) { uint256[] memory a = new uint256[](2); return a[i]; }
    function spin() external { while (true) { total += 1; } }
    function who() external view returns (address) { return msg.sender; }
    function take() external payable { total += msg.value; }
    function empty() external pure { revert(); }
}`;
ev("pendingSource = { name: 'Probe', code: " + JSON.stringify(CUSTOM) + " }; pendingCtorArgs = []; renderCtorArgs();");
await ev('labLoadContract()');
ok(doc.getElementById('lab_arg_ctor_1'), 'constructor arguments are read from the ABI for any contract');
doc.getElementById('lab_arg_ctor_0').value = '41'; doc.getElementById('lab_arg_ctor_1').value = BOB;
await ev('labDeployWithArgs()');
ok(/Ready: Probe/.test(text('labStatus')), 'a custom contract deploys: ' + text('labStatus'));
r = await call('boom'); ok(/Nope\(who=0x[0-9a-fA-F]+BEEF/i.test(r) && /n=7/.test(r), 'custom errors are decoded: ' + r);
r = await call('over'); ok(/panic: arithmetic overflow/.test(r), 'panics are explained: ' + r);
r = await call('idx', ['5']); ok(/panic: array index out of bounds/.test(r), 'index panic: ' + r);
r = await call('empty'); ok(/without a reason/.test(r), 'an empty revert is explained: ' + r);
r = await call('spin'); ok(/out of gas/.test(r), 'an infinite loop runs out of gas instead of hanging: ' + r);
setAct(2); r = await call('who'); eq(r.toLowerCase(), A(2).toLowerCase(), 'msg.sender is the acting account');
setAct(0);
r = await call('take', [], { value: '2.5' });
ok(/Success/.test(r), 'a payable call with a value works: ' + r);
eq((await ev("LAB.lab.getBalance(LAB.contract.address)")).toString(), '2500000000000000000', 'the native value (18 decimals) reached the contract');
r = await call('take', [], { value: '5000' });
ok(/not have enough native balance/.test(r), 'spending more than the balance is explained: ' + r);
r = await call('total'); eq(r, '2500000000000000041', 'state persists between calls');
const big = 'pragma solidity ^0.8.24;\ncontract Big { bytes constant D = hex"' + 'ab'.repeat(30000) + '"; function d() external pure returns (bytes memory) { return D; } }';
ev("pendingSource = { name: 'Big', code: " + JSON.stringify('// SPDX-License-Identifier: MIT\n' + big) + " }; pendingCtorArgs = []; renderCtorArgs();");
await ev('labLoadContract()');
ok(/larger than the 24 KB|24 KB limit/.test(text('lab_log')), 'a contract over the 24 KB size limit is flagged: ' + text('lab_log').slice(-200));

/* ================= quick check, stale warning, reset ================= */
ev("pendingSource = { name: 'Probe', code: " + JSON.stringify(CUSTOM) + " }; renderCtorArgs();");
await ev('labLoadContract()');
doc.getElementById('lab_arg_ctor_0').value = '1'; doc.getElementById('lab_arg_ctor_1').value = BOB;
await ev('labDeployWithArgs()');
await ev('labSmoke()');
ok(/Quick check done: 3 ok, 3 failed/.test(text('lab_log')) && /boom\(\) reverted: Nope/.test(text('lab_log')), 'the quick check calls every no-input read and names the ones that revert: ' + text('lab_log').slice(-260));
ev("pendingSource = { name: 'Probe', code: " + JSON.stringify(CUSTOM + '\n// changed') + " }; renderCtorArgs();");
ok(/changed since it was loaded/.test(text('labContract')), 'editing the contract marks the loaded one as stale');
await ev('labMine && document.getElementById("lab_mine_n") && labMine()');
ok(/block/.test(text('lab_time')), 'mining blocks works');
doc.getElementById('lab_token_amt').value = '12.5'; doc.getElementById('lab_token').value = 'usdc';
const before = await bal('usdc', A(0));
await ev('labMint()');
eq((BigInt(await bal('usdc', A(0))) - BigInt(before)).toString(), '12500000', 'minting 12.5 adds 12,500,000 units (6 decimals)');
doc.getElementById('lab_token_amt').value = '1.1234567'; await ev('labMint()');
ok(/at most 6 decimals/.test(text('lab_log')), 'too many decimals are refused');

/* ================= vault (single mode, real USDC address) ================= */
ev("setMultichainMode('single')");
ev("activeNetwork = 'arcMain'; updateSideNet(); document.getElementById('vault_name').value = 'ArcYieldVault'; genVault();");
setAct(0);
await ev('labLoadContract()');
ok(/Ready: ArcYieldVault/.test(text('labStatus')), 'the vault deploys: ' + text('labStatus'));
doc.getElementById('lab_token').value = 'usdc'; doc.getElementById('lab_approve_all').checked = false; await ev('labApprove()');
r = await call('deposit', ['100000000', A(0)]);
ok(/Success/.test(r) && /Deposit\(/.test(r), 'deposit works against the real USDC address: ' + r);
r = await call('balanceOf', [A(0)]);
ok(/^\d+$/.test(r) && r !== '0', 'shares were minted: ' + r);
r = await call('redeem', [r, A(0)]);
ok(/Success/.test(r), 'redeem works');
eq(await bal('usdc', A(0)), '1000000000000', 'Alice got every unit back (no yield, no fee)');

/* ================= crosschain mode: the CCTP bridge talks to the test messenger ================= */
ev("setMultichainMode('cross')");
ev("document.getElementById('cc_name').value = 'ArcBridge'; genCrosschain();");
await ev('labLoadContract()');
ok(doc.getElementById('lab_arg_ctor_2'), 'the bridge takes three constructor arguments');
eq(doc.getElementById('lab_arg_ctor_0').value, ev('LAB_AUX.messenger'), 'token messenger is filled with the test messenger');
eq(doc.getElementById('lab_arg_ctor_1').value, ev('LAB_AUX.transmitter'), 'message transmitter is filled with the test transmitter');
await ev('labDeployWithArgs()');
ok(/Ready: /.test(text('labStatus')), 'the bridge deploys: ' + text('labStatus'));
doc.getElementById('lab_token').value = 'usdc'; await ev('labApprove()');
r = await call('bridgeUSDC', ['5000000', '6', BOB, '0', '2000']);
ok(/Success/.test(r) && /DepositForBurn\(/.test(r) && /destinationDomain=6/.test(r), 'bridging emits the burn event for domain 6: ' + r);
eq(await bal('usdc', A(0)), '999995000000', 'the burned USDC left Alice');
r = await call('bridgeUSDC', ['5000000', '26', BOB, '0', '2000']);
ok(/same chain/.test(r), 'the local domain is rejected (the test transmitter reports domain 26): ' + r);
ev("setMultichainMode('single')");

/* ================= operations never overlap ================= */
setAct(0);
const before2 = BigInt(await bal('usdc', A(0)));
doc.getElementById('lab_token_amt').value = '1';
await Promise.all([ev('labMint()'), ev('labRefreshBalances()'), ev('labMint()'), ev('labRefreshBalances()'), ev('labMint()')]);
eq((BigInt(await bal('usdc', A(0))) - before2).toString(), '3000000', 'three mints started at once are all applied exactly once');
await Promise.all([ev('labRefreshBalances()'), ev('labAdvance(60)'), ev('labRefreshBalances()')]);
ok(/UTC/.test(text('lab_time')), 'the lab stays healthy after overlapping requests');

/* session-key permissions are (address, bytes4) pairs: the Playground and the Lab parse them from JSON (phase 5) */
{
  const comps = JSON.stringify([{ type: 'address', name: 'target' }, { type: 'bytes4', name: 'selector' }]);
  const A = '0x00000000000000000000000000000000000a11ce', B = '0x0000000000000000000000000000000000000b0b';
  const good = ev(`pgCoerce('tuple[]', '[["${A}","0xa9059cbb"],{"target":"${B}","selector":"0x00000000"}]', ${comps}, 'permissions')`);
  eq(JSON.stringify(good), JSON.stringify([[A, '0xa9059cbb'], [B, '0x00000000']]), 'permissions: pairs as arrays or objects are parsed');
  for (const bad of [`[["${A}","0x12"]]`, '[["nope","0x12345678"]]']) {
    let msg = ''; try { ev(`pgCoerce('tuple[]', '${bad}', ${comps}, 'permissions')`); } catch (e) { msg = String(e.message); }
    ok(/selector|address/.test(msg), 'permissions: a bad pair is refused with a clear message', msg);
  }
}

ok(app.pageErrors.length === 0, 'no page errors: ' + app.pageErrors.join(' | '));
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
