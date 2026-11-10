// The Cloudflare zip is a build artifact: check that the script builds exactly what it should, byte for byte.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const build = (dir) => spawnSync('node', [path.join(repo, 'scripts/build-zip.mjs'), '--out', dir], { encoding: 'utf8' });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-zip-'));
const a = build(path.join(tmp, 'a')), b = build(path.join(tmp, 'b'));
ok(a.status === 0 && b.status === 0, 'the build script succeeds', a.stderr + b.stderr);
const zipA = fs.readFileSync(path.join(tmp, 'a/contractforge-cloudflare.zip'));
const zipB = fs.readFileSync(path.join(tmp, 'b/contractforge-cloudflare.zip'));
ok(zipA.equals(zipB), 'two builds are byte-identical (reproducible)');
const shaFile = fs.readFileSync(path.join(tmp, 'a/contractforge-cloudflare.zip.sha256'), 'utf8').trim();
ok(shaFile === crypto.createHash('sha256').update(zipA).digest('hex') + '  contractforge-cloudflare.zip', 'the .sha256 file matches the zip');

/* read the archive back through its central directory */
const eocd = zipA.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
const count = zipA.readUInt16LE(eocd + 10); let p = zipA.readUInt32LE(eocd + 16);
const entries = {};
for (let i = 0; i < count; i++) {
  const method = zipA.readUInt16LE(p + 10), crc = zipA.readUInt32LE(p + 16), csize = zipA.readUInt32LE(p + 20), size = zipA.readUInt32LE(p + 24);
  const nlen = zipA.readUInt16LE(p + 28), elen = zipA.readUInt16LE(p + 30), clen = zipA.readUInt16LE(p + 32), off = zipA.readUInt32LE(p + 42);
  const name = zipA.subarray(p + 46, p + 46 + nlen).toString('utf8');
  const lnlen = zipA.readUInt16LE(off + 26), lelen = zipA.readUInt16LE(off + 28);
  const raw = zipA.subarray(off + 30 + lnlen + lelen, off + 30 + lnlen + lelen + csize);
  const data = method === 8 ? zlib.inflateRawSync(raw) : raw;
  entries[name] = { data, crcOk: (zlib.crc32(data) >>> 0) === crc, sizeOk: data.length === size };
  p += 46 + nlen + elen + clen;
}
const names = Object.keys(entries);
ok(names.length === count && names.every((n) => entries[n].crcOk && entries[n].sizeOk), 'every entry has a valid CRC and size');
ok(names.includes('index.html') && names.includes('_headers') && names.includes('_redirects'), 'index.html, _headers and _redirects are at the root');
ok(names.includes('functions/api/ai.js'), 'the Pages Function is under functions/');
ok(!names.some((n) => n.startsWith('contractforge-deploy/')), 'no wrapping folder');
ok(!names.includes('wrangler.toml') && !names.some((n) => /(^|\/)\./.test(n) || n.endsWith('.map')), 'no wrangler.toml, dotfiles or source maps');

/* the same bytes as the source tree (recursive, including vendor/) */
const deploy = path.join(repo, 'contractforge-deploy');
const skip = (rel) => rel === 'wrangler.toml' || rel.endsWith('.map') || rel.endsWith('.DS_Store') || rel.split('/').some((p) => p.startsWith('.'));
const collect = (dir, prefix, into) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const rel = prefix ? prefix + '/' + e.name : e.name;
    if (e.isDirectory()) collect(path.join(dir, e.name), rel, into);
    else if (e.isFile() && !skip(rel)) into.push(rel);
  }
};
const want = [];
collect(deploy, '', want);
ok(want.every((f) => entries[f] && entries[f].data.equals(fs.readFileSync(path.join(deploy, f)))), 'every deploy file (including vendor/) is in the zip with identical content');
ok(names.filter((n) => !n.startsWith('functions/')).length === want.length, 'nothing else from the deploy folder is added');
const manifest = JSON.parse(fs.readFileSync(path.join(deploy, 'vendor/MANIFEST.json'), 'utf8'));
ok(entries['vendor/' + manifest.solc.file] && entries['vendor/' + manifest.solc.file].data.equals(fs.readFileSync(path.join(deploy, 'vendor', manifest.solc.file))), 'the vendor compiler is in the zip');
ok(entries['vendor/' + manifest.ethers.file] && entries['vendor/' + manifest.ethers.file].data.equals(fs.readFileSync(path.join(deploy, 'vendor', manifest.ethers.file))), 'the vendor ethers build is in the zip');
ok(entries['functions/api/ai.js'] && entries['functions/api/ai.js'].data.equals(fs.readFileSync(path.join(repo, 'functions/api/ai.js'))), 'the function in the zip is the one in the repository');

/* it is not versioned */
const tracked = spawnSync('git', ['ls-files', '--', '*.zip'], { cwd: repo, encoding: 'utf8' }).stdout.trim();
ok(tracked === '', 'no zip is tracked by git', tracked);
const ignored = spawnSync('git', ['check-ignore', 'dist/contractforge-cloudflare.zip', 'contractforge-cloudflare.zip'], { cwd: repo, encoding: 'utf8' }).stdout.trim().split('\n').filter(Boolean);
ok(ignored.length === 2, '.gitignore covers the zip and dist/', ignored.join(','));

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
