// Generates the three swap contracts with the app's real generator (single-network
// mode, Arc Mainnet defaults) into solidity/src, for the Foundry tests in solidity/test.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadApp } from './harness.mjs';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'solidity/src');
fs.mkdirSync(out, { recursive: true });
const { ev, set } = loadApp({ alerts: [] });
ev("activeNetwork = 'arcMain'");
for (const [kind, multi, file] of [['amm', 'single', 'Amm'], ['amm', 'factory', 'Fac'], ['orderbook', 'single', 'Book']]) {
  set('swap_kind', kind); set('swap_multi', multi); set('swap_tokenA', ''); set('swap_tokenB', '');
  ev('genSwap()');
  let { code } = JSON.parse(ev('JSON.stringify(pendingSource)'));
  if (file === 'Book') code = code.replace(/^contract ArcSwapAMM \{/m, 'contract Orderbook {'); // avoid a name clash in the test
  fs.writeFileSync(path.join(out, file + '.sol'), code);
}
console.log('wrote', fs.readdirSync(out).filter((f) => f.endsWith('.sol')).join(', '));
