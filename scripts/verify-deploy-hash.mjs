// Verifies a generated contract's creation-bytecode hash offline, so you can check the deploy summary without the app:
//
//   node scripts/verify-deploy-hash.mjs <contract.sol>
//
// It compiles the file with the vendored compiler and the app's exact settings (optimizer enabled, runs 200, no
// evmVersion override) and prints the compiler version, its sha256 (from vendor/MANIFEST.json) and the keccak256 of the
// creation bytecode. These are the same three facts the deploy summary shows, so the user can reproduce the build
// outside the app and compare hashes.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = process.argv[2];
if (!file) { console.error('usage: node scripts/verify-deploy-hash.mjs <contract.sol>'); process.exit(1); }
const abs = path.resolve(file);
if (!fs.existsSync(abs)) { console.error('file not found: ' + abs); process.exit(1); }
const src = fs.readFileSync(abs, 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'contractforge-deploy/vendor/MANIFEST.json'), 'utf8'));

const wrapper = require(path.join(root, 'tests/node_modules/solc/wrapper.js'));
const solc = wrapper(require(path.join(root, 'contractforge-deploy/vendor', manifest.solc.file)));

const name = path.basename(file);
const input = {
  language: 'Solidity',
  sources: { [name]: { content: src } },
  settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } }, optimizer: { enabled: true, runs: 200 } },
};
const out = JSON.parse(solc.compile(JSON.stringify(input)));
const errs = (out.errors || []).filter((e) => e.severity === 'error');
if (errs.length) { console.error(errs.map((e) => e.formattedMessage).join('\n')); process.exit(1); }
const contracts = out.contracts[name] || {};
const first = Object.keys(contracts)[0];
if (!first) { console.error('no contract compiled from ' + name); process.exit(1); }
const bytecode = '0x' + contracts[first].evm.bytecode.object;

const ethers = require(path.join(root, 'tests/node_modules/ethers'));
const keccak = ethers.utils.keccak256(bytecode);

console.log('compiler version:  ' + manifest.solc.version);
console.log('compiler sha256:   ' + manifest.solc.sha256);
console.log('contract:          ' + name + ':' + first);
console.log('creation bytecode keccak256: ' + keccak);
