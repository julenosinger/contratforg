// Generates the portable (constructor-argument) contracts with the app's generators
// into solidity/src/portable for the Foundry tests in solidity/test/Portable.t.sol.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadApp, fillAddresses } from './harness.mjs';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'solidity/src/portable');
fs.mkdirSync(out, { recursive: true });
const app = loadApp();
const { ev, set, w } = app;
ev("setMultichainMode('portable')");
ev("activeNetwork = 'arcMain'");
const clearTokens = () => { for (const id of ['s_token', 's_reward', 'swap_tokenA', 'swap_tokenB', 'vault_asset']) { const el = w.document.getElementById(id); if (el) el.value = ''; } };
const save = (file, rename) => {
  let { code } = JSON.parse(ev('JSON.stringify(pendingSource)'));
  if (rename) code = code.replace(rename[0], rename[1]);
  // forge runs offline with the solc that is installed (0.8.28), so an exact `pragma solidity 0.8.24` is relaxed here.
  // The exact 0.8.24 build is checked by compile-generators.mjs with the real 0.8.24 compiler.
  code = code.replace(/^pragma solidity 0\.8\.24;/m, 'pragma solidity ^0.8.24;');
  fs.writeFileSync(path.join(out, file + '.sol'), code);
  console.log(file, JSON.stringify(JSON.parse(ev('JSON.stringify(pendingCtorArgs.map(a => a.param))'))));
};
for (const [id, file] of [['erc721', 'Nft'], ['escrow', 'Escrow'], ['vesting', 'Vesting'], ['paywall', 'Paywall'], ['dao', 'Dao'], ['smartwallet', 'Wallet'], ['staking', 'Staking']]) {
  ev(`renderSimpleForm('${id}')`); fillAddresses(app, 'arcMain'); clearTokens();
  if (id === 'erc721') set('s_price', '10');
  if (id === 'staking') set('s_reward', '');
  if (id === 'dao') set('s_token', '0x' + '5'.repeat(40));
  if (id === 'smartwallet') set('s_session', '720');   // the longest allowed: 30 days
  ev(`genSimple('${id}')`); save(file);
}
fillAddresses(app, 'arcMain'); clearTokens(); ev('genVault()'); save('Vault');
fillAddresses(app, 'arcMain'); set('tre_streaming', 'yes'); ev('genTreasury()'); save('Treasury');
set('swap_kind', 'amm'); set('swap_multi', 'single'); ev('genSwap()'); save('Amm');
set('swap_kind', 'orderbook'); ev('genSwap()'); save('Book', [/^contract ArcSwapAMM \{/m, 'contract Orderbook {']);
ev('genCrosschain()'); save('Bridge');
ev('genMultisend()'); save('Multisend');

/* Smart wallet in single-network mode (limit in whole native units, scaled by the network's decimals),
   plus a variant whose guardian is the zero address (the constructor must refuse it). */
{
  const single = path.join(path.dirname(fileURLToPath(import.meta.url)), 'solidity/src/single');
  fs.mkdirSync(single, { recursive: true });
  const a2 = loadApp();
  const e2 = a2.ev;
  e2("setMultichainMode('single')"); e2("activeNetwork = 'arcMain'");
  const dump = (file, mutate) => {
    e2("renderSimpleForm('smartwallet')"); fillAddresses(a2, 'arcMain');
    a2.set('s_session', '720');   // the longest allowed: 30 days
    if (mutate) mutate();
    e2("genSimple('smartwallet')");
    let { code } = JSON.parse(e2('JSON.stringify(pendingSource)'));
    code = code.replace(/^pragma solidity 0\.8\.24;/m, 'pragma solidity ^0.8.24;');
    fs.writeFileSync(path.join(single, file + '.sol'), code);
    console.log('single/' + file);
  };
  dump('Wallet');
  dump('WalletZeroGuardian', () => a2.set('s_guardian', '0x0000000000000000000000000000000000000000'));
}
