// Independent oracle: compile every distinct golden contract with a NATIVE solc 0.8.24 binary and with the vendored
// soljson (the browser compiler), with the app's settings, and require identical creation bytecode (metadata CBOR
// stripped, because the trailing metadata can differ between a native and an Emscripten build of the same version).
//
//   SOLC_NATIVE=/path/to/solc node native-solc-bytecode.mjs      (or it finds `solc` on PATH, e.g. via solc-select)
//   REQUIRE_NATIVE_SOLC=1 node native-solc-bytecode.mjs          (fail if no native solc is available)
//
// The native binary's sha256 is checked against the official binaries.soliditylang.org list.json read at run time.
// tests/reproducible-bytecode.mjs only compares two files with the same sha256, so it proves determinism, not that the
// vendored compiler is the real 0.8.24; this test closes that gap with an independent compiler.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { isNativeSolcVersion } from './native-solc-version.mjs';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m); } };
const note = (m) => console.log('  note  ' + m);

/* find the native binary: only `solc` (or SOLC_NATIVE) counts, and its --version must be a real native build.
   The `solcjs` that npm puts on PATH is the Emscripten build (the same soljson the vendor ships), so it is refused. */
function findNativeSolc() {
  if (process.env.SOLC_NATIVE) return process.env.SOLC_NATIVE;
  const r = spawnSync('solc', ['--version'], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  if (r.status === 0 && isNativeSolcVersion(out)) return 'solc';
  return null;
}

const native = findNativeSolc();
if (!native) {
  const msg = 'native solc 0.8.24 not found (set SOLC_NATIVE or install it with solc-select)';
  if (process.env.REQUIRE_NATIVE_SOLC === '1') { console.error('FAIL: ' + msg + ' (REQUIRE_NATIVE_SOLC=1)'); process.exit(1); }
  console.log('NÃO rodei o oráculo nativo: ' + msg);
  process.exit(0);
}

const versionOut = spawnSync(native, ['--version'], { encoding: 'utf8' });
ok(/0\.8\.24/.test((versionOut.stdout || '') + (versionOut.stderr || '')), 'the native binary reports 0.8.24', (versionOut.stdout || '') + (versionOut.stderr || ''));

/* the native binary's sha256 against the official list.json (best effort, needs network) */
let verifiedPath = null;
try {
  const bin = fs.readFileSync(native);
  const sha = crypto.createHash('sha256').update(bin).digest('hex');
  const resp = await fetch('https://binaries.soliditylang.org/bin/list.json');
  const list = await resp.json();
  const matches = (list.builds || []).filter((b) => b.sha256 && String(b.sha256).replace(/^0x/, '').toLowerCase() === sha);
  if (matches.length) { verifiedPath = matches[0].path; ok(true, 'the native binary sha256 matches list.json: ' + matches[0].path); }
  else { ok(false, 'the native binary sha256 does not match any build in list.json', sha); }
} catch (e) {
  note('NÃO verificado contra o list.json (no network): ' + String(e.message).split('\n')[0]);
}

/* the vendored compiler (same wrapper the npm package uses) */
const manifest = JSON.parse(fs.readFileSync(path.join(repo, 'contractforge-deploy/vendor/MANIFEST.json'), 'utf8'));
const wrapper = require('./node_modules/solc/wrapper.js');
const vendoredSolc = wrapper(require(path.join(repo, 'contractforge-deploy/vendor', manifest.solc.file)));

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const stripMetadata = (bytecode) => {
  const hex = String(bytecode || '').replace(/^0x/, '');
  if (hex.length < 4) return bytecode;
  const len = parseInt(hex.slice(-4), 16);
  if (len * 2 + 4 > hex.length) return bytecode;      // no trailing metadata: return as-is
  return '0x' + hex.slice(0, hex.length - 4 - len * 2);
};

const goldenDir = path.join(here, 'golden');
const seen = new Map();
for (const net of fs.readdirSync(goldenDir)) {
  const dir = path.join(goldenDir, net);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.sol')) continue;
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const h = sha256(src);
    if (!seen.has(h)) seen.set(h, { name: f, src });
  }
}
const contracts = [...seen.values()];

const nativeCompile = (input) => {
  const r = spawnSync(native, ['--standard-json'], { input: JSON.stringify(input), encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 });
  if (r.status !== 0) throw new Error('native solc failed: ' + (r.stderr || '').slice(0, 200));
  return JSON.parse(r.stdout);
};
const vendorCompile = (input) => JSON.parse(vendoredSolc.compile(JSON.stringify(input)));

let nContracts = 0, nMetaDiff = 0;
for (const { name, src } of contracts) {
  const input = {
    language: 'Solidity',
    sources: { [name]: { content: src } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } }, optimizer: { enabled: true, runs: 200 } },
  };
  const outN = nativeCompile(input), outV = vendorCompile(input);
  const errs = (o) => (o.errors || []).filter((e) => e.severity === 'error');
  if (errs(outN).length || errs(outV).length) { ok(false, name + ': both compilers accept the source', (errs(outN)[0] || errs(outV)[0] || {}).formattedMessage); continue; }
  const codes = (o) => Object.values(o.contracts[name] || {}).map((c) => c.evm.bytecode.object).sort();
  const cn = codes(outN), cv = codes(outV);
  const sameCount = cn.length === cv.length;
  const codeSame = sameCount && cn.every((b, i) => stripMetadata('0x' + b) === stripMetadata('0x' + cv[i]));
  ok(codeSame, name + ': native and vendored compilers produce identical creation bytecode (metadata stripped)');
  if (sameCount && cn.every((b, i) => b === cv[i])) nContracts += cn.length;
  else { nMetaDiff++; note(name + ': full bytecode differs (native vs Emscripten metadata/version), code identical after stripping the CBOR'); }
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
console.log('(bytecode-identical contracts: ' + nContracts + ', metadata-differing: ' + nMetaDiff + ')');
process.exit(fail ? 1 : 0);
