// Single-network output must never change by accident. `node golden.mjs` compares
// every generator's output with tests/golden/; `node golden.mjs --update` rewrites it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadApp, generateAll } from './harness.mjs';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'golden');
const update = process.argv.includes('--update');
const NETS = ['arc', 'arcMain', 'ethereum', 'basesep'];
let bad = 0, n = 0;
for (const net of NETS) {
  const app = loadApp(); // fresh page per network keeps form state independent
  for (const r of generateAll(app, net)) {
    const file = path.join(dir, net, r.label + '.sol');
    if (r.error) { console.log(`  FAIL  ${net}/${r.label}: ${r.error}`); bad++; continue; }
    n++;
    if (update) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, r.code); continue; }
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== r.code) { console.log(`  DIFF  ${net}/${r.label}`); bad++; }
  }
}
console.log(update ? `golden updated (${n} files)` : bad ? `${bad} problem(s)` : `${n} outputs identical to golden`);
process.exit(bad ? 1 : 0);
