// Phase 11.2 — Vault decimal integrity: the deposit cap is scaled by the asset's own decimals in every mode, and the
// generated Solidity compiles for 6, 8, 18 and fractional cap inputs.
import { loadApp } from './harness.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const solc = require('solc');

let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m + (d ? '  [' + d + ']' : '')); } };

function compile(code) {
  const input = { language: 'Solidity', sources: { 'Vault.sol': { content: code } }, settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } } };
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  return (out.errors || []).filter((e) => e.severity === 'error').map((e) => e.formattedMessage.split('\n')[0]);
}

const app = loadApp(); const { ev, w } = app; const d = w.document;

/* ---- 1. scaleAmount parsing (digits/scale, zero, invalid) ---- */
{
  const s = (x) => { try { return ev(`scaleAmount(${JSON.stringify(x)})`); } catch (e) { return { err: String(e.message) }; } };
  ok(JSON.stringify(s('500')) === JSON.stringify({ digits: '500', scale: 0, isZero: false }), 'scaleAmount: a whole number');
  ok(JSON.stringify(s('1.5')) === JSON.stringify({ digits: '15', scale: 1, isZero: false }), 'scaleAmount: a fractional number');
  ok(JSON.stringify(s('1000.25')) === JSON.stringify({ digits: '100025', scale: 2, isZero: false }), 'scaleAmount: two fractional digits');
  ok(JSON.stringify(s('0')) === JSON.stringify({ digits: '', scale: 0, isZero: true }), 'scaleAmount: zero');
  ok(JSON.stringify(s('0.000001')) === JSON.stringify({ digits: '1', scale: 6, isZero: false }), 'scaleAmount: leading zeros are stripped (0.000001 -> digits "1", scale 6)');
  ok(JSON.stringify(s('0.0000001')) === JSON.stringify({ digits: '1', scale: 7, isZero: false }), 'scaleAmount: seven fractional digits (0.0000001 -> digits "1", scale 7)');
  ok(/is not a number/.test(s('1e3').err || ''), 'scaleAmount: rejects a non-number', JSON.stringify(s('1e3')));
  ok(/is not a number/.test(s('abc').err || ''), 'scaleAmount: rejects text');
}

/* ---- 2. the single-mode deposit cap is scaled by the asset's own decimals (never a fixed 6) ---- */
{
  ev("activeNetwork = 'arc'; updateSideNet(); setMultichainMode('single')");
  d.getElementById('vault_asset').value = '';
  const capLine = (cap) => { d.getElementById('vault_cap').value = cap; ev('genVault()'); return ev('pendingSource.code').split('\n').find((l) => /depositCap/.test(l)); };
  ok(/depositCap = 0;/.test(capLine('0')), 'single: cap 0 stays 0 (unlimited)');
  ok(/depositCap = 500 \* 10\*\*uint256\(asset\.decimals\(\)\);/.test(capLine('500')), 'single: a whole cap uses asset.decimals()');
  ok(/depositCap = 15 \* 10\*\*uint256\(asset\.decimals\(\)\) \/ 10\*\*1;/.test(capLine('1.5')), 'single: a fractional cap is scaled exactly (no 1.5 * 10**6)');
  ok(/depositCap = 100025 \* 10\*\*uint256\(asset\.decimals\(\)\) \/ 10\*\*2;/.test(capLine('1000.25')), 'single: two fractional digits are preserved');
  ok(!/\* 10\*\*6/.test(capLine('500')), 'single: no hardcoded 10**6 remains');
}

/* ---- 3. the generated single-mode Solidity compiles for several cap shapes ---- */
{
  ev("activeNetwork = 'arc'; updateSideNet(); setMultichainMode('single')");
  d.getElementById('vault_asset').value = '';
  for (const cap of ['0', '500', '1.5', '1000.25', '999999999']) {
    d.getElementById('vault_cap').value = cap; ev('genVault()');
    const errs = compile(ev('pendingSource.code'));
    ok(errs.length === 0, `compile: single-mode cap ${cap} compiles`, errs.join('; '));
  }
}

/* ---- 4. the portable mode keeps the same semantic (asset_ as a constructor argument) ---- */
{
  ev("setMultichainMode('portable')");
  d.getElementById('vault_cap').value = '500'; d.getElementById('vault_asset').value = ''; ev('genVault()');
  const code = ev('pendingSource.code');
  ok(/depositCap = 500 \* 10\*\*uint256\(IERC20\(asset_\)\.decimals\(\)\);/.test(code), 'portable: the cap is scaled by the constructor asset');
  ok(ev('pendingCtorArgs.map((a) => a.param).join()') === 'asset_', 'portable: the asset is a constructor argument');
  ok(compile(code).length === 0, 'portable: the generated Solidity compiles');
}

/* ---- 5. deposit-cap accounting invariants are present in the generated Solidity ---- */
{
  ev("setMultichainMode('single')"); d.getElementById('vault_cap').value = '500'; ev('genVault()');
  const code = ev('pendingSource.code');
  ok(/assetsBefore \+ assets <= depositCap/.test(code), 'accounting: the cap compares the total assets after the deposit (not just the incoming amount)');
  ok(/received = totalAssets\(\) - assetsBefore/.test(code), 'accounting: it records what actually arrived (fee-on-transfer safe)');
  ok(/require\(shares > 0, "zero shares"\)/.test(code), 'accounting: a zero-share deposit is refused');
  ok(/require\(assets > 0, "zero deposit"\)/.test(code), 'accounting: a zero deposit is refused');
  ok(/require\(held >= shares, "insufficient shares"\)/.test(code), 'accounting: redeeming more shares than held is refused');
  ok(/assetsOut = grossAssets - perfFee/.test(code), 'accounting: the performance fee is taken from the gross, never from the principal');
}

/* ---- 6. positive-cap safety: a cap that truncates to zero is rejected, never treated as unlimited ---- */
{
  ev("setMultichainMode('single')"); d.getElementById('vault_asset').value = '';
  // zero = unlimited: no guard emitted
  d.getElementById('vault_cap').value = '0'; ev('genVault()');
  ok(!/deposit cap is not representable/.test(ev('pendingSource.code')), 'cap: an explicit zero cap (unlimited) emits no guard');
  // positive representable: guard present and compiles
  d.getElementById('vault_cap').value = '500'; ev('genVault()');
  const c500 = ev('pendingSource.code');
  ok(/require\(depositCap > 0, "deposit cap is not representable"\)/.test(c500), 'cap: a positive cap emits the not-representable guard');
  ok(/require\(asset\.decimals\(\) <= 38, "asset decimals out of range"\)/.test(c500), 'cap: a positive cap bounds the asset decimals');
  ok(compile(c500).length === 0, 'cap: the guarded single vault compiles');
  // positive sub-unit cap: written exactly, the require guards it at runtime
  d.getElementById('vault_cap').value = '0.0000001'; ev('genVault()');
  const cSub = ev('pendingSource.code');
  ok(/depositCap = 1 \* 10\*\*uint256\(asset\.decimals\(\)\) \/ 10\*\*7/.test(cSub), 'cap: a sub-unit cap is written exactly (1 * 10**decimals() / 10**7)');
  ok(/require\(depositCap > 0, "deposit cap is not representable"\)/.test(cSub), 'cap: the sub-unit cap still carries the guard');
  ok(compile(cSub).length === 0, 'cap: the sub-unit cap compiles (the require guards it at runtime)');
  // portable: the same guard, using the constructor asset
  ev("setMultichainMode('portable')"); d.getElementById('vault_cap').value = '500'; ev('genVault()');
  const p = ev('pendingSource.code');
  ok(/require\(IERC20\(asset_\)\.decimals\(\) <= 38, "asset decimals out of range"\)/.test(p) && /require\(depositCap > 0, "deposit cap is not representable"\)/.test(p), 'cap: the portable vault emits the same guard for the constructor asset');
  ok(compile(p).length === 0, 'cap: the guarded portable vault compiles');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
