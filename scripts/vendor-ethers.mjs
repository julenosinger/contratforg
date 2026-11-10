// Vendors the ethers UMD build the app uses, so the page never loads it from cdnjs.cloudflare.com.
//
//   node scripts/vendor-ethers.mjs         (from the repository root)
//
// It copies tests/node_modules/ethers/dist/ethers.umd.min.js (the devDependency ethers 5.7.2) to
// contractforge-deploy/vendor/ethers/ under a versioned file name, and writes/updates
// contractforge-deploy/vendor/MANIFEST.json with the version, file name, size and sha256. index.html loads that
// file same-origin instead of the CDN script.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ethersDir = path.join(root, 'tests', 'node_modules', 'ethers');
const vendorDir = path.join(root, 'contractforge-deploy', 'vendor');
const manifestPath = path.join(vendorDir, 'MANIFEST.json');

const version = JSON.parse(fs.readFileSync(path.join(ethersDir, 'package.json'), 'utf8')).version;
const fileName = `ethers-${version}.umd.min.js`;

const src = path.join(ethersDir, 'dist', 'ethers.umd.min.js');
if (!fs.existsSync(src)) { console.error('ethers.umd.min.js not found at ' + src); process.exit(1); }
const buf = fs.readFileSync(src);
const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

fs.mkdirSync(path.join(vendorDir, 'ethers'), { recursive: true });
fs.writeFileSync(path.join(vendorDir, 'ethers', fileName), buf);

const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
manifest.ethers = { version, file: `ethers/${fileName}`, size: buf.length, sha256 };
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`vendored ${fileName} (${buf.length} bytes)`);
console.log(`sha256 ${sha256}`);
