// Bytecode reproducibility: the self-hosted vendor compiler and the npm solc devDependency must produce identical
// creation bytecode for every distinct contract in tests/golden/, using the exact settings the app uses
// (optimizer enabled, runs 200, no evmVersion override). If a Dependabot bump or a re-vendor changes the compiler,
// this fails and the deploy summary hashes would no longer match what a user reproduces outside the app.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');

const manifest = JSON.parse(fs.readFileSync(path.join(repo, 'contractforge-deploy/vendor/MANIFEST.json'), 'utf8'));
const wrapper = require('./node_modules/solc/wrapper.js');
const vendoredSolc = wrapper(require(path.join(repo, 'contractforge-deploy/vendor', manifest.solc.file)));
const npmSolc = require('./node_modules/solc');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m); } };

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const compile = (solc, input) => JSON.parse(solc.compile(JSON.stringify(input)));

/* collect every golden contract, deduped by content hash */
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
ok(contracts.length >= 65, 'there are at least 65 distinct golden contracts to check', String(contracts.length));

let nContracts = 0;
for (const { name, src } of contracts) {
  const input = {
    language: 'Solidity',
    sources: { [name]: { content: src } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } }, optimizer: { enabled: true, runs: 200 } },
  };
  const outV = compile(vendoredSolc, input);
  const outN = compile(npmSolc, input);
  const errs = (out) => (out.errors || []).filter((e) => e.severity === 'error');
  if (errs(outV).length || errs(outN).length) {
    ok(false, name + ': compiles without errors', (errs(outV)[0] || errs(outN)[0] || {}).formattedMessage);
    continue;
  }
  const bytecodes = (out) => Object.values(out.contracts[name] || {}).map((c) => c.evm.bytecode.object).sort();
  const bv = bytecodes(outV), bn = bytecodes(outN);
  const same = bv.length === bn.length && bv.every((b, i) => b === bn[i]);
  ok(same, name + ': vendor and npm solc produce identical creation bytecode (' + bv.length + ' contract' + (bv.length === 1 ? '' : 's') + ')');
  if (same) nContracts += bv.length;
}

ok(vendoredSolc.version() === npmSolc.version(), 'vendor and npm solc report the same version: ' + vendoredSolc.version());
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
