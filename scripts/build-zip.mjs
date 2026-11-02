// Builds dist/contractforge-cloudflare.zip (and its .sha256) from contractforge-deploy/ and functions/.
//
//   node scripts/build-zip.mjs [--out DIR]        (from the repository root, or: cd tests && npm run build:zip)
//
// The archive has index.html at its root, which is what a Cloudflare Pages "direct upload" expects, and the
// Pages Functions under functions/. The zip is a build artifact: it is git-ignored, CI publishes it, and the
// release workflow attaches it to a tag. The build is reproducible: sorted entries, fixed timestamps, no
// extra fields, so the same inputs give the same bytes (with the same Node/zlib).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outIdx = process.argv.indexOf('--out');
const outDir = path.resolve(outIdx >= 0 ? process.argv[outIdx + 1] : path.join(root, 'dist'));
const NAME = 'contractforge-cloudflare.zip';

// What is shipped. wrangler.toml is only for the Wrangler CLI and is not part of an upload.
const SKIP = (rel) => rel === 'wrangler.toml' || rel.endsWith('.map') || rel.endsWith('.DS_Store') || rel.split('/').some((p) => p.startsWith('.'));
function walk(dir, prefix, into) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const rel = prefix ? prefix + '/' + e.name : e.name;
    if (e.isDirectory()) walk(path.join(dir, e.name), rel, into);
    else if (e.isFile() && !SKIP(rel)) into.push({ name: rel, file: path.join(dir, e.name) });
  }
}
const files = [];
walk(path.join(root, 'contractforge-deploy'), '', files);
const fnDir = path.join(root, 'functions');
if (fs.existsSync(fnDir)) walk(fnDir, 'functions', files);
files.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
if (!files.some((f) => f.name === 'index.html')) { console.error('index.html is missing: nothing to ship'); process.exit(1); }

const DOS_TIME = 0, DOS_DATE = (0 << 9) | (1 << 5) | 1;   // 1980-01-01 00:00:00
const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16LE(n); return b; };
const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; };
const parts = []; const central = []; let offset = 0;
for (const f of files) {
  const data = fs.readFileSync(f.file);
  const comp = zlib.deflateRawSync(data, { level: 9 });
  const useDeflate = comp.length < data.length;
  const body = useDeflate ? comp : data;
  const crc = zlib.crc32(data) >>> 0;
  const name = Buffer.from(f.name, 'utf8');
  const method = useDeflate ? 8 : 0;
  const local = Buffer.concat([u32(0x04034b50), u16(20), u16(0x0800), u16(method), u16(DOS_TIME), u16(DOS_DATE), u32(crc), u32(body.length), u32(data.length), u16(name.length), u16(0), name]);
  parts.push(local, body);
  central.push(Buffer.concat([u32(0x02014b50), u16(0x031e), u16(20), u16(0x0800), u16(method), u16(DOS_TIME), u16(DOS_DATE), u32(crc), u32(body.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32((0o100644 << 16) >>> 0), u32(offset), name]));
  offset += local.length + body.length;
}
const cd = Buffer.concat(central);
const end = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cd.length), u32(offset), u16(0)]);
const zip = Buffer.concat([...parts, cd, end]);

fs.mkdirSync(outDir, { recursive: true });
const zipPath = path.join(outDir, NAME);
fs.writeFileSync(zipPath, zip);
const sha = crypto.createHash('sha256').update(zip).digest('hex');
fs.writeFileSync(zipPath + '.sha256', sha + '  ' + NAME + '\n');
console.log(`${path.relative(process.cwd(), zipPath) || NAME}: ${files.length} files, ${zip.length} bytes`);
console.log(`sha256 ${sha}`);
if (process.argv.includes('--list')) files.forEach((f) => console.log('  ' + f.name));
