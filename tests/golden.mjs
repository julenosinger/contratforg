// Single-network output must never change by accident. `node golden.mjs` compares
// every generator's output with tests/golden/; `node golden.mjs --update` rewrites it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadApp, generateAll } from './harness.mjs';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'golden');
const update = process.argv.includes('--update');
const stampOnly = process.argv.includes('--only-stamp-changed');   // old golden files: the only allowed change is the one stamp line
const STAMP = /^\/\/ ContractForge v\S+ \| maturity: \w+ \| NOT AUDITED\n/m;
const NETS = ['arc', 'arcMain', 'ethereum', 'basesep'];
let bad = 0, n = 0;
for (const net of NETS) {
  const app = loadApp(); // fresh page per network keeps form state independent
  for (const r of generateAll(app, net)) {
    const file = path.join(dir, net, r.label + '.sol');
    if (r.error) { console.log(`  FAIL  ${net}/${r.label}: ${r.error}`); bad++; continue; }
    n++;
    if (update) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, r.code); continue; }
    if (stampOnly) {
      const old = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
      const stamped = r.code.match(STAMP);
      if (old === null || !stamped || r.code.replace(STAMP, '') !== old) { console.log(`  DIFF  ${net}/${r.label} (more than the stamp line changed)`); bad++; }
      continue;
    }
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== r.code) { console.log(`  DIFF  ${net}/${r.label}`); bad++; }
    if (/dEaD|bEEF|cAfE/.test(r.code)) { console.log(`  FAIL  ${net}/${r.label}: placeholder address in the output`); bad++; }
  }
}
console.log(update ? `golden updated (${n} files)` : bad ? `${bad} problem(s)` : `${n} outputs identical to golden`);
process.exit(bad ? 1 : 0);
