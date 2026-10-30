// Loads the real app in a simulated browser, runs every contract generator on several
// networks and in every multichain mode, and compiles the output with solc 0.8.24
// (the app's default compiler). In the portable modes it also checks that the source is
// the same on every network and has no network-specific addresses baked in.
// Exit code 1 if any generator throws, fails to compile, or is not portable.
import { createRequire } from 'node:module';
import { loadApp, generateAll, resetFakeAddr } from './harness.mjs';

const require = createRequire(import.meta.url);
const solc = require('solc');

const MODES = ['single', 'portable', 'multi', 'cross'];
const NETWORKS = ['arc', 'arcMain', 'ethereum', 'basesep'];

function compile(name, code) {
  const input = {
    language: 'Solidity',
    sources: { [`${name}.sol`]: { content: code } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } }, optimizer: { enabled: true, runs: 200 } },
  };
  const out = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (out.errors || []).filter((e) => e.severity === 'error').map((e) => e.formattedMessage.split('\n')[0]);
  const contracts = out.contracts?.[`${name}.sol`] || {};
  return { errors, count: Object.keys(contracts).length, contracts };
}

const normalize = (code) => code.replace(/for [A-Za-z0-9 ()-]*?\(chainId \d+\)/g, 'for NETWORK');
let failed = 0, passed = 0;
const fail = (label, msg) => { failed++; console.log(`  FAIL  ${label}: ${msg}`); };

for (const mode of MODES) {
  console.log(`\n=== mode: ${mode} ===`);
  const bySource = new Map(); // generator label -> Map(net -> code)
  const app = loadApp();
  const { ev } = app;
  ev(`setMultichainMode('${mode}')`);
  // every address literal that belongs to a specific network
  const chainAddrs = JSON.parse(ev(`JSON.stringify([...new Set(Object.values(NETWORKS).flatMap(n => [n.usdc, n.eurc, n.cctp.tokenMessenger, n.cctp.messageTransmitter]).concat(['${'0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d'}','${'0x81D40F21F12A8F0E3252Bccb954D722d4c464B64'}','${'0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA'}','${'0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275'}']).filter(Boolean))])`));

  for (const net of NETWORKS) {
    resetFakeAddr();
    for (const r of generateAll(app, net)) {
      const label = `${mode}/${net}/${r.label}`;
      if (r.error) { fail(label, r.error); continue; }
      const c = compile(r.name, r.code);
      if (c.errors.length) { fail(label, 'compile error: ' + c.errors[0]); continue; }
      if (!c.count) { fail(label, 'no contracts in compiler output'); continue; }
      if (mode !== 'single') {
        const lits = chainAddrs.filter((a) => r.code.toLowerCase().includes(a.toLowerCase()));
        if (lits.length) { fail(label, 'network-specific address in source: ' + lits[0]); continue; }
        if (!bySource.has(r.label)) bySource.set(r.label, new Map());
        bySource.get(r.label).set(net, { code: normalize(r.code), name: r.name });
      }
      passed++;
    }
  }
  for (const [label, nets] of bySource) {
    const codes = new Set([...nets.values()].map((v) => v.code));
    if (codes.size !== 1) fail(`${mode}/${label}`, `source differs between networks (${[...nets.keys()].join(', ')})`);
    else passed++;
  }
  if (app.pageErrors.length) fail(mode, 'page errors: ' + app.pageErrors.join('; '));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
