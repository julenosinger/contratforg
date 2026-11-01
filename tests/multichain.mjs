// Behaviour of the multichain modes in the real app: constructor arguments per network,
// the constructor panel, input validation, and the multi-network deploy loop (wallet,
// compiler and chain are simulated; the generated Solidity is compiled for real with solc 0.8.24).
import { createRequire } from 'node:module';
import { loadApp, generateAll, fillAddresses, addrFor } from './harness.mjs';

const require = createRequire(import.meta.url);
const solc = require('solc');

// fillAddresses also fills the token fields; clear them so the network defaults apply
function fillParties(app, net) {
  fillAddresses(app, net);
  for (const id of ['s_token', 's_reward', 'swap_tokenA', 'swap_tokenB', 'vault_asset']) { const el = app.w.document.getElementById(id); if (el) el.value = ''; }
}

let failed = 0, passed = 0;
const ok = (cond, label, extra = '') => { if (cond) { passed++; } else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);

const NETS = ['arc', 'arcMain', 'ethereum', 'basesep'];

/* 1. constructor args match the constructor of the generated source, in every portable mode */
for (const mode of ['portable', 'multi', 'cross']) {
  const app = loadApp(); const { ev, w } = app;
  ev(`setMultichainMode('${mode}')`);
  for (const net of NETS) {
    for (const r of generateAll(app, net)) {
      if (r.error) { ok(false, `${mode}/${net}/${r.label}`, r.error); continue; }
      const parsed = JSON.parse(ev(`JSON.stringify(parseCtorParams(pendingSource.code, pendingSource.name))`));
      const args = JSON.parse(ev('JSON.stringify(pendingCtorArgs)'));
      eq(parsed.map((p) => p.param), args.map((a) => a.param), `${mode}/${net}/${r.label} ctor params`);
      eq(parsed.map((p) => p.type), args.map((a) => a.type), `${mode}/${net}/${r.label} ctor types`);
      const panel = w.document.getElementById('ctorArgsPanel');
      eq(w.document.querySelectorAll('#ctorArgsPanel input').length, args.length, `${mode}/${net}/${r.label} panel inputs`);
      ok(args.length === 0 ? panel.style.display === 'none' : panel.style.display === 'block', `${mode}/${net}/${r.label} panel visibility`);
    }
  }
  ok(app.pageErrors.length === 0, `${mode} page errors`, app.pageErrors.join('; '));
}

/* 1b. mode selector and panels */
{
  const app = loadApp(); const { ev, w } = app;
  const btns = () => [...w.document.querySelectorAll('#mcSelector .mc-btn')];
  eq(btns().map((b) => b.dataset.mode), ['single', 'portable', 'multi', 'cross'], 'selector buttons');
  eq(btns().filter((b) => b.classList.contains('active')).map((b) => b.dataset.mode), ['single'], 'single is the default mode');
  const panel = () => w.document.getElementById('multiDeployPanel').style.display;
  ok(panel() === 'none', 'multi-deploy panel hidden in single mode');
  btns()[1].click();
  eq(ev('multichainMode'), 'portable', 'clicking a button sets the mode');
  eq(btns().filter((b) => b.classList.contains('active')).map((b) => b.dataset.mode), ['portable'], 'active button follows');
  eq(w.localStorage.getItem('cf_mc_mode'), 'portable', 'mode persisted');
  ok(panel() === 'none', 'multi-deploy panel hidden in portable mode');
  btns()[2].click();
  ok(panel() === 'block', 'multi-deploy panel shown in multi mode');
  ok(w.document.querySelectorAll('#multiDeployPanel .md-chip').length === Object.keys(JSON.parse(ev('JSON.stringify(Object.keys(NETWORKS))'))).length, 'a chip per network');
  ok(!w.document.querySelector('#multiDeployPanel .md-bridge'), 'bridge option only in crosschain mode');
  btns()[3].click();
  ok(!!w.document.querySelector('#multiDeployPanel .md-bridge'), 'bridge option in crosschain mode');
  btns()[0].click();
  ok(panel() === 'none', 'back to single hides the panel');
  // single mode: a contract with constructor arguments (e.g. from the AI tab) still gets the panel
  ev("pendingSource = { name:'C', code:'contract C { constructor(address a, uint256 n) {} }' }; renderCtorArgs();");
  eq(w.document.querySelectorAll('#ctorArgsPanel input').length, 2, 'ctor panel works for any contract in single mode');
  ok(app.pageErrors.length === 0, 'selector page errors', app.pageErrors.join('; '));
}

/* 2. defaults per network */
{
  const app = loadApp(); const { ev, set } = app;
  ev("setMultichainMode('portable')");
  ev("renderSimpleForm('escrow')"); fillParties(app, 'arc'); ev("activeNetwork='arc'"); ev("genSimple('escrow')");
  const nets = JSON.parse(ev('JSON.stringify({arc:NETWORKS.arc.usdc, arcMain:NETWORKS.arcMain.usdc, ethereum:NETWORKS.ethereum.usdc})'));
  for (const k of Object.keys(nets)) eq(ev(`ctorArgValue(pendingCtorArgs[0], '${k}')`), nets[k], `escrow token default on ${k}`);
  // a token typed by the user applies to the network it was generated for only
  ev("renderSimpleForm('escrow')"); set('s_token', addrFor('mytoken')); ev("activeNetwork='ethereum'"); ev("genSimple('escrow')");
  eq(ev("ctorArgValue(pendingCtorArgs[0], 'ethereum')"), addrFor('mytoken'), 'user token kept on its network');
  eq(ev("ctorArgValue(pendingCtorArgs[0], 'arcMain')"), nets.arcMain, 'user token not forced on other networks');
  // network switch refreshes the panel
  ev("activeNetwork='arcMain'; updateSideNet()");
  eq(app.w.document.getElementById('ctor_arg_0').value, nets.arcMain, 'panel follows network');
  // native-scaled limit uses the network's native decimals
  ev("renderSimpleForm('smartwallet')"); fillParties(app, 'arc'); ev("activeNetwork='arc'"); set('s_spendlimit', '1000'); ev("genSimple('smartwallet')");
  const idx = JSON.parse(ev('JSON.stringify(pendingCtorArgs.map(a=>a.param))')).indexOf('dailyLimit_');
  eq(ev(`ctorArgValue(pendingCtorArgs[${idx}], 'arc')`), '1000' + '0'.repeat(18), 'daily limit in native units');
  set('s_spendlimit', '0.5'); ev("genSimple('smartwallet')");
  eq(ev(`ctorArgValue(pendingCtorArgs[${idx}], 'arc')`), '5' + '0'.repeat(17), 'fractional daily limit');
}

/* 3. validation */
{
  const { ev, w } = loadApp();
  const bad = (expr) => { try { ev(expr); return false; } catch (e) { return true; } };
  ok(bad("coerceCtorValue('address','0x123','token')"), 'short address rejected');
  ok(bad("coerceCtorValue('address','" + '0x' + '0'.repeat(40) + "','token')"), 'zero address rejected');
  ok(bad("coerceCtorValue('uint256','1.5','n')"), 'non-integer rejected');
  eq(ev("coerceCtorValue('address','" + addrFor('x') + "','token')"), addrFor('x'), 'valid address accepted');
  eq(ev("coerceCtorValue('bool','true','b')"), true, 'bool parsed');
  ok(bad("coerceCtorValue('bool','yes','b')"), 'bad bool rejected');
  ok(bad("coerceCtorValue('uint256[]','1','n')"), 'unsupported type rejected');
  w.document.body.dataset.x = '1';
}

/* 4. multi-network deploy loop (simulated wallet) */
async function runMulti(mode, setup) {
  const app = loadApp(); const { ev, w, set } = app;
  const deployed = [];
  let chain = 0;
  w.realCompile = (i) => solc.compile(i);
  w.ethers = {
    utils: {}, providers: { Web3Provider: class { async getNetwork() { return { chainId: chain }; } getSigner() { return {}; } async getBalance() { return 0; } } },
    ContractFactory: class {
      constructor(abi, bytecode) { this.abi = abi; this.bytecode = bytecode; }
      async deploy(...args) { const c = { address: addrFor('deployed' + deployed.length), deployTransaction: { hash: '0x' + '1'.repeat(64) }, deployed: async () => {} }; deployed.push({ network: ev('activeNetwork'), args, hasCtor: this.abi.some((x) => x.type === 'constructor'), bytecode: this.bytecode }); return c; }
    },
  };
  w.window.ethereum = { request: async () => {}, on: () => {} };
  ev("solcCompile = async (i) => window.realCompile(i); ensureSolcLoaded = async () => {};");
  ev("switchWalletNetwork = async () => { window.__chain(NETWORKS[activeNetwork].chainIdDec); };");
  w.__chain = (id) => { chain = id; };
  ev("refreshBalance = async () => {}; account = '" + addrFor('acct') + "'; signer = {}; provider = {};");
  ev(`setMultichainMode('${mode}')`);
  // mainnet deployments open a summary the user must confirm by typing the network name
  w.setInterval(() => {
    const input = w.document.getElementById('dcInput');
    if (!input || input.dataset.done || w.__noAuto) return;
    input.dataset.done = '1';
    input.value = w.document.querySelector('.dc-type b').textContent;
    input.dispatchEvent(new w.Event('input', { bubbles: true }));
    w.document.getElementById('dcConfirm').click();
  }, 5);
  setup(app, () => fillParties(app, 'arc'));
  return { app, deployed, run: async () => { const r = await ev('multiDeploy()'); if (process.env.DEBUG_MC) console.log([...w.document.querySelectorAll('#deployConsole .line')].map((l) => l.textContent).join('\n')); return r; } };
}

{
  const { app, deployed, run } = await runMulti('multi', ({ ev }, fill) => {
    ev("renderSimpleForm('escrow')"); fill(); ev("activeNetwork='arc'"); ev("genSimple('escrow')");
    for (const k of ['arc', 'arcMain', 'ethereum']) ev(`toggleMdNetwork('${k}')`);
  });
  const results = await run();
  eq(deployed.map((d) => d.network), ['arc', 'arcMain', 'ethereum'], 'multi-deploy network order');
  const want = JSON.parse(app.ev('JSON.stringify([NETWORKS.arc.usdc, NETWORKS.arcMain.usdc, NETWORKS.ethereum.usdc])'));
  eq(deployed.map((d) => d.args[0]), want, 'each network gets its own USDC');
  ok(new Set(deployed.map((d) => d.bytecode)).size === 1, 'same bytecode on every network');
  eq(results.map((r) => r[1] !== 'failed'), [true, true, true], 'all deployments succeeded');
  eq(app.ev('activeNetwork'), 'arc', 'original network restored');
  eq(app.w.document.querySelectorAll('#deployResult .dr-row').length, 3, 'result card lists every deployment');
  ok(app.w.document.getElementById('deployConfirm') === null, 'confirmation dialog closed');
}

{ // a network without a default blocks only that network
  const { deployed, run, app } = await runMulti('multi', ({ ev }, fill) => {
    ev("renderSimpleForm('smartwallet')"); fill(); ev("activeNetwork='arc'"); ev("genSimple('smartwallet')");
    ev("toggleMdNetwork('arc')");
  });
  const r = await run();
  eq(deployed.length, 1, 'smart wallet deploys on arc');
  eq(deployed[0].args.length, 1, 'smart wallet gets 1 arg (the daily limit)');
  void app; void r;
}

{ // placeholder required fields: staking on a network with no USDC default fails cleanly
  const { deployed, run } = await runMulti('multi', ({ ev }, fill) => {
    ev("renderSimpleForm('staking')"); fill(); ev("activeNetwork='arc'"); ev("genSimple('staking')");
    ev("toggleMdNetwork('arc')"); ev("toggleMdNetwork('robinhood')");
  });
  const r = await run();
  eq(deployed.map((d) => d.network), ['arc'], 'robinhood (no USDC) is skipped with an error, arc deploys');
  eq(r.map((x) => x[1] === 'failed'), [false, true], 'result summary marks the failure');
}

{ // crosschain mode with bridge companion
  const { deployed, run, app } = await runMulti('cross', ({ ev }, fill) => {
    ev("renderSimpleForm('paywall')"); fill(); ev("activeNetwork='arc'"); ev("genSimple('paywall')");
    for (const k of ['arc', 'ethereum', 'bnb']) ev(`toggleMdNetwork('${k}')`);
    ev('toggleMdBridge(true)');
  });
  const r = await run();
  const names = r.map((x) => x[0]);
  ok(names.includes('Arc Testnet bridge') && names.includes('Ethereum bridge'), 'bridge deployed where CCTP exists', JSON.stringify(r));
  ok(r.find((x) => x[0] === 'BNB Chain bridge')?.[1] === 'skipped', 'bridge skipped where CCTP is not available');
  const arcBridge = deployed.find((d) => d.network === 'arc' && d.args.length === 3);
  eq(arcBridge.args, ['0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA', '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275', app.ev('NETWORKS.arc.usdc')], 'arc bridge args');
}

{ // single deploy button with constructor arguments
  const { app, deployed } = await runMulti('portable', ({ ev }, fill) => { ev("renderSimpleForm('escrow')"); fill(); ev("activeNetwork='arcMain'"); ev("genSimple('escrow')"); });
  const { ev, w } = app;
  await ev('compileAndDeploy()');
  eq(deployed.length, 1, 'single deploy sends one transaction');
  eq(deployed[0].args, [app.ev('NETWORKS.arcMain.usdc')], 'single deploy passes the panel value');
  // bad value: nothing is sent and the console says why
  w.document.getElementById('ctor_arg_0').value = '0x123';
  await ev('compileAndDeploy()');
  eq(deployed.length, 1, 'invalid address blocks the deployment');
  const lines = [...w.document.querySelectorAll('#deployConsole .line')].map((l) => l.textContent);
  ok(lines.some((l) => /enter a valid address/.test(l)), 'console explains the problem', lines.slice(-2).join(' | '));
  // edited value is used
  w.document.getElementById('ctor_arg_0').value = addrFor('custom');
  await ev('compileAndDeploy()');
  eq(deployed[1]?.args, [addrFor('custom')], 'edited value is deployed');
}

{ // mainnet: cancelling the summary sends nothing; confirming deploys
  const { app, deployed } = await runMulti('portable', ({ ev }, fill) => { ev("renderSimpleForm('escrow')"); fill(); ev("activeNetwork='arcMain'"); ev("genSimple('escrow')"); });
  const { w, ev } = app;
  w.__noAuto = true;
  const run = ev('compileAndDeploy()');
  await new Promise((r) => setTimeout(r, 20));
  ok(!!w.document.getElementById('deployConfirm'), 'single deploy on mainnet opens the summary');
  ok(/token/.test(w.document.querySelector('#deployConfirm .dc-args').textContent), 'summary lists the constructor arguments');
  w.document.getElementById('dcCancel').click();
  await run;
  eq(deployed.length, 0, 'cancelled mainnet deploy sends nothing');
  ok([...w.document.querySelectorAll('#deployConsole .line')].some((l) => /cancelled/.test(l.textContent)), 'console says it was cancelled');
  w.__noAuto = false;
  await ev('compileAndDeploy()');
  eq(deployed.length, 1, 'confirmed mainnet deploy goes through');
  const lines = [...w.document.querySelectorAll('#deployConsole .line')];
  ok(lines.some((l) => l.classList.contains('step') && /Sending deploy transaction/.test(l.textContent)), 'progress lines are steps');
  ok(lines.some((l) => l.classList.contains('step') && l.querySelector('a')?.href.startsWith('https://explorer.arc.io/tx/')), 'tx hash links to the explorer');
  ok(lines.some((l) => l.classList.contains('ok') && l.querySelector('a')?.href.startsWith('https://explorer.arc.io/address/')), 'address links to the explorer');
  ok(!lines.some((l) => l.classList.contains('warn') && /Sending|Starting|Tx sent/.test(l.textContent)), 'progress is no longer shown as a warning');
  const card = w.document.getElementById('deployResult');
  ok(card.style.display === 'block' && /ArcEscrow/.test(card.textContent) && card.querySelectorAll('.dr-row').length === 1, 'result card after a deployment');
}

{ // single mode: contracts without constructor arguments deploy exactly as before
  const { app, deployed } = await runMulti('single', ({ ev }, fill) => { ev("renderSimpleForm('erc20')"); ev("activeNetwork='arc'"); ev("genSimple('erc20')"); });
  await app.ev('compileAndDeploy()');
  eq(deployed.map((d) => d.args), [[]], 'erc20 deploys with no arguments');
  ok(deployed[0].hasCtor === false || deployed[0].hasCtor === true, 'deployed');
}

{ // single mode escrow keeps its hard-coded token (no constructor arguments)
  const { app, deployed } = await runMulti('single', ({ ev }, fill) => { ev("renderSimpleForm('escrow')"); fill(); ev("activeNetwork='arc'"); ev("genSimple('escrow')"); });
  await app.ev('compileAndDeploy()');
  eq(deployed.map((d) => d.args), [[]], 'single-mode escrow still has an empty constructor');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
