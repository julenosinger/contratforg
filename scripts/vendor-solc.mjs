// Vendors the solc compiler the app compiles with, so the browser never downloads it from a CDN.
//
//   node scripts/vendor-solc.mjs          (from the repository root)
//
// It copies tests/node_modules/solc/soljson.js (the devDependency solc 0.8.24, which is also what the tests
// compile with) to contractforge-deploy/vendor/solc/ under a versioned file name, and writes/updates
// contractforge-deploy/vendor/MANIFEST.json with the version, file name, size and sha256. The worker loads that
// file same-origin and checks its sha256 against the manifest before running it.
//
// When there is network access it also fetches the official binaries.soliditylang.org list.json and reports whether
// the vendored hash matches the official build of the same commit. The two can differ: binaries.soliditylang.org
// rebuilds the Emscripten output over time, while the npm package pins the build it was published with. The
// authoritative check is therefore the bytecode-identity test (tests/reproducible-bytecode.mjs), which compiles with
// both the vendored file and the npm package and requires identical creation bytecode.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const solcDir = path.join(root, 'tests', 'node_modules', 'solc');
const vendorDir = path.join(root, 'contractforge-deploy', 'vendor');
const manifestPath = path.join(vendorDir, 'MANIFEST.json');

// The npm solc package pins the Emscripten build of a specific commit. solc.version() reports
// "0.8.24+commit.e11b9ed9.Emscripten.clang"; the commit is not recoverable from the minified soljson.js itself,
// so it is recorded here and checked against the official list.json below.
const VERSION = '0.8.24';
const COMMIT = 'e11b9ed9';
const fileName = `soljson-v${VERSION}+commit.${COMMIT}.js`;

const src = path.join(solcDir, 'soljson.js');
if (!fs.existsSync(src)) { console.error('soljson.js not found at ' + src + ' (run npm install in tests/ first)'); process.exit(1); }
const buf = fs.readFileSync(src);
const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

fs.mkdirSync(path.join(vendorDir, 'solc'), { recursive: true });
fs.writeFileSync(path.join(vendorDir, 'solc', fileName), buf);

const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
manifest.solc = { version: `${VERSION}+commit.${COMMIT}`, file: `solc/${fileName}`, size: buf.length, sha256 };
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`vendored ${fileName} (${buf.length} bytes)`);
console.log(`sha256 ${sha256}`);

// Cross-check against the official list.json (best effort; needs network).
let verified = null;
try {
  const resp = await fetch('https://binaries.soliditylang.org/emscripten-wasm32/list.json');
  const list = await resp.json();
  const rel = list.releases && list.releases[VERSION];
  const build = rel && (list.builds || []).find((b) => b.path === rel);
  if (build && build.sha256) {
    const official = String(build.sha256).replace(/^0x/, '').toLowerCase();
    verified = official === sha256;
    if (verified) console.log('verified against list.json: ' + rel);
    else console.log(`NOTE: the official build ${rel} has sha256 ${official}, which differs from the npm-pinned build ${sha256} (binaries.soliditylang.org rebuilt the Emscripten output). The npm package is the source of truth for this repository.`);
  } else {
    console.log('NÃO verificado contra o list.json (entry not found for ' + VERSION + ')');
  }
} catch (e) {
  console.log('NÃO verificado contra o list.json (no network: ' + String(e.message).split('\n')[0] + ')');
}
