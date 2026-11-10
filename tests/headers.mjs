// The cache rules for vendor/ are equivalent in _headers (Cloudflare Pages) and vercel.json (Vercel):
// the versioned binaries are immutable for a year, and the fixed-name manifest is no-cache/must-revalidate so a
// compiler change is never hidden behind a stale cached manifest.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(repo, 'contractforge-deploy');
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL  ' + m); } };

/* _headers: path -> { key: value } */
const cf = {};
{
  let cur = null;
  for (const l of fs.readFileSync(path.join(dir, '_headers'), 'utf8').split('\n')) {
    if (!l.trim() || l.trim().startsWith('#')) { if (l.startsWith('#')) cur = null; continue; }
    if (l.startsWith('/')) { cur = l.trim(); cf[cur] = {}; continue; }
    const m = l.match(/^\s+([A-Za-z-]+):\s*(.*)$/);
    if (cur && m) cf[cur][m[1]] = m[2];
  }
}
/* vercel.json: source -> { key: value } */
const vc = {};
{
  const j = JSON.parse(fs.readFileSync(path.join(repo, 'vercel.json'), 'utf8'));
  for (const rule of j.headers || []) {
    const h = {};
    for (const { key, value } of rule.headers || []) h[key] = value;
    vc[rule.source] = h;
  }
}

const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/* the manifest: no-cache / must-revalidate on both platforms */
ok(norm(cf['/vendor/MANIFEST.json'] && cf['/vendor/MANIFEST.json']['Cache-Control']) === norm(vc['/vendor/MANIFEST.json'] && vc['/vendor/MANIFEST.json']['Cache-Control']),
  'the manifest Cache-Control matches on both platforms: ' + JSON.stringify([cf['/vendor/MANIFEST.json'], vc['/vendor/MANIFEST.json']]));
ok(/no-cache/.test(cf['/vendor/MANIFEST.json'] && cf['/vendor/MANIFEST.json']['Cache-Control'] || '') && /must-revalidate/.test(cf['/vendor/MANIFEST.json'] && cf['/vendor/MANIFEST.json']['Cache-Control'] || ''),
  'the manifest is no-cache, must-revalidate (Cloudflare): ' + JSON.stringify(cf['/vendor/MANIFEST.json']));
ok(/no-cache/.test(vc['/vendor/MANIFEST.json'] && vc['/vendor/MANIFEST.json']['Cache-Control'] || '') && /must-revalidate/.test(vc['/vendor/MANIFEST.json'] && vc['/vendor/MANIFEST.json']['Cache-Control'] || ''),
  'the manifest is no-cache, must-revalidate (Vercel): ' + JSON.stringify(vc['/vendor/MANIFEST.json']));

/* the versioned files: immutable on both platforms */
ok(norm(cf['/vendor/*'] && cf['/vendor/*']['Cache-Control']) === norm(vc['/vendor/(.*)'] && vc['/vendor/(.*)']['Cache-Control']),
  'the vendor Cache-Control matches on both platforms: ' + JSON.stringify([cf['/vendor/*'], vc['/vendor/(.*)']]));
ok(/max-age=31536000/.test(cf['/vendor/*'] && cf['/vendor/*']['Cache-Control'] || '') && /immutable/.test(cf['/vendor/*'] && cf['/vendor/*']['Cache-Control'] || ''),
  'the versioned files are immutable for a year (Cloudflare): ' + JSON.stringify(cf['/vendor/*']));
ok(/max-age=31536000/.test(vc['/vendor/(.*)'] && vc['/vendor/(.*)']['Cache-Control'] || '') && /immutable/.test(vc['/vendor/(.*)'] && vc['/vendor/(.*)']['Cache-Control'] || ''),
  'the versioned files are immutable for a year (Vercel): ' + JSON.stringify(vc['/vendor/(.*)']));

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
