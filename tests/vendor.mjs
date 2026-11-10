// The self-hosted vendor binaries are exactly the pinned devDependencies, and the manifest matches the files.
// A Dependabot bump of solc or ethers that is not re-vendored (or a manifest that drifts from the file) fails here.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const vendor = path.join(repo, 'contractforge-deploy', 'vendor');
const manifest = JSON.parse(fs.readFileSync(path.join(vendor, 'MANIFEST.json'), 'utf8'));

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m); } };
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function check(name, entry, npmFile) {
  const file = path.join(vendor, entry.file);
  const data = fs.existsSync(file) ? fs.readFileSync(file) : null;
  ok(!!data, name + ': the vendored file exists at ' + entry.file);
  if (!data) return;
  ok(entry.sha256 === sha256(data), name + ': the manifest sha256 matches the vendored file');
  ok(entry.size === data.length, name + ': the manifest size matches the vendored file');
  const npm = fs.readFileSync(path.join(here, 'node_modules', npmFile));
  ok(sha256(data) === sha256(npm), name + ': vendor is byte-identical to the pinned devDependency (a Dependabot bump needs a re-vendor)');
  ok(entry.version && /^\d+\.\d+\.\d+/.test(entry.version), name + ': the manifest records a version');
}

check('solc', manifest.solc, 'solc/soljson.js');
check('ethers', manifest.ethers, 'ethers/dist/ethers.umd.min.js');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
