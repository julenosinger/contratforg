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
  // trailing fractional zeros are normalised away without changing the value
  ok(JSON.stringify(s('1.000000')) === JSON.stringify({ digits: '1', scale: 0, isZero: false }), 'scaleAmount: 1.000000 normalises to 1');
  ok(JSON.stringify(s('500.250000')) === JSON.stringify({ digits: '50025', scale: 2, isZero: false }), 'scaleAmount: 500.250000 normalises to 500.25');
  ok(JSON.stringify(s('0.000001000')) === JSON.stringify({ digits: '1', scale: 6, isZero: false }), 'scaleAmount: 0.000001000 normalises to 0.000001');
  ok(JSON.stringify(s('000500.2500')) === JSON.stringify({ digits: '50025', scale: 2, isZero: false }), 'scaleAmount: 000500.2500 normalises to 500.25');
  ok(JSON.stringify(s('0.000000')) === JSON.stringify({ digits: '', scale: 0, isZero: true }), 'scaleAmount: 0.000000 normalises to 0');
  ok(JSON.stringify(s('1.0000001')) === JSON.stringify({ digits: '10000001', scale: 7, isZero: false }), 'scaleAmount: meaningful fractional digits are preserved (1.0000001)');
  ok(/is not a number/.test(s('1e3').err || ''), 'scaleAmount: rejects a non-number', JSON.stringify(s('1e3')));
  ok(/is not a number/.test(s('abc').err || ''), 'scaleAmount: rejects text');
}

/* ---- 2. the single-mode deposit cap is computed in the constructor from the asset's own decimals ---- */
{
  ev("activeNetwork = 'arc'; updateSideNet(); setMultichainMode('single')");
  d.getElementById('vault_asset').value = '';
  const gen = (cap) => { d.getElementById('vault_cap').value = cap; ev('genVault()'); return ev('pendingSource.code'); };
  ok(/uint256 public depositCap;/.test(gen('0')), 'single: the cap is a constructor-assigned state variable (no initializer)');
  ok(/depositCap = 500 \* 10\*\*_vltDec;/.test(gen('500')), 'single: a whole cap is 500 * 10**_vltDec');
  ok(/depositCap = 15 \* 10\*\*\(_vltDec - 1\);/.test(gen('1.5')), 'single: a fractional cap uses the exact (scale <= decimals) branch');
  ok(/depositCap = 100025 \* 10\*\*\(_vltDec - 2\);/.test(gen('1000.25')), 'single: two fractional digits are preserved');
  ok(!/\* 10\*\*6/.test(gen('500')), 'single: no hardcoded 10**6 remains');
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
  ok(/uint8 _vltDec = IERC20\(asset_\)\.decimals\(\);/.test(code) && /depositCap = 500 \* 10\*\*_vltDec;/.test(code), 'portable: the cap is computed from the constructor asset decimals');
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

/* ---- 6. positive-cap safety: exact representation, validation before arithmetic, never silent truncation ---- */
{
  ev("setMultichainMode('single')"); d.getElementById('vault_asset').value = '';
  // zero = unlimited: no guard emitted
  d.getElementById('vault_cap').value = '0'; ev('genVault()');
  ok(!/deposit cap is not representable/.test(ev('pendingSource.code')), 'cap: an explicit zero cap (unlimited) emits no guard');
  // positive representable: decimals resolved and bounded before any exponentiation
  d.getElementById('vault_cap').value = '500'; ev('genVault()');
  const c500 = ev('pendingSource.code');
  ok(/uint8 _vltDec = asset\.decimals\(\);/.test(c500), 'cap: the decimals are resolved first');
  ok(/require\(_vltDec <= 38, "asset decimals out of range"\);/.test(c500), 'cap: the decimals are bounded before any exponentiation');
  ok(/require\(depositCap > 0, "deposit cap is not representable"\);/.test(c500), 'cap: a positive cap emits the not-representable guard');
  ok(compile(c500).length === 0, 'cap: the guarded single vault compiles');
  // nonrepresentable fractional precision is rejected exactly (no floor/ceiling)
  d.getElementById('vault_cap').value = '1.0000001'; ev('genVault()');
  const cN = ev('pendingSource.code');
  ok(/require\(10000001 % 10\*\*\(7 - _vltDec\) == 0, "deposit cap is not representable"\);/.test(cN), 'cap: excess fractional precision is rejected by the exact-representation check');
  ok(compile(cN).length === 0, 'cap: the nonrepresentable-cap vault compiles (the require guards it at runtime)');
  // sub-unit cap: rejected by the same check
  d.getElementById('vault_cap').value = '0.0000001'; ev('genVault()');
  const cSub = ev('pendingSource.code');
  ok(/require\(1 % 10\*\*\(7 - _vltDec\) == 0, "deposit cap is not representable"\);/.test(cSub), 'cap: a sub-unit cap is rejected by the exact-representation check');
  // portable: same guard, constructor asset
  ev("setMultichainMode('portable')"); d.getElementById('vault_cap').value = '500'; ev('genVault()');
  const p = ev('pendingSource.code');
  ok(/uint8 _vltDec = IERC20\(asset_\)\.decimals\(\);/.test(p) && /require\(depositCap > 0, "deposit cap is not representable"\);/.test(p), 'cap: the portable vault emits the same guard for the constructor asset');
  ok(compile(p).length === 0, 'cap: the guarded portable vault compiles');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
