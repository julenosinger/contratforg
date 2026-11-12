// Every maturity claim in contractforge-deploy/maturity.js is checked against the repository:
// a "reviewed" template needs a review document in docs/ AND a Foundry suite in tests/solidity/test
// that contains fuzz or invariant tests. Nothing may be "audited" (no independent audit exists).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadApp } from './harness.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);

const { ev } = loadApp();
const M = JSON.parse(ev('JSON.stringify(MATURITY)'));

/* the registry covers every template a generator can produce */
const TEMPLATES = ['erc20', 'erc721', 'escrow', 'vesting', 'paywall', 'dao', 'smartwallet', 'staking', 'swap-amm-single', 'swap-amm-factory', 'swap-orderbook', 'treasury', 'vault', 'multisend', 'crosschain', 'bridge', 'ai', 'imported'];
for (const t of TEMPLATES) ok(!!M[t], `registry has an entry for ${t}`);
eq(Object.keys(M).filter((k) => !TEMPLATES.includes(k)), [], 'no unknown registry entries');

/* levels are valid and nothing claims an audit */
for (const [k, e] of Object.entries(M)) {
  ok(['reviewed', 'experimental'].includes(e.level), `${k}: level is reviewed or experimental`, e.level);
  ok(typeof e.reason === 'string' && e.reason.length > 10, `${k}: has a reason`);
}
ok(!Object.values(M).some((e) => e.level === 'audited'), 'no template is audited');

/* classification rule, checked against real files */
const reviewed = Object.entries(M).filter(([, e]) => e.level === 'reviewed').map(([k]) => k).sort();
eq(reviewed, ['dao', 'erc20', 'erc721', 'multisend', 'paywall', 'smartwallet', 'staking', 'swap-amm-factory', 'swap-amm-single', 'treasury', 'vault'], 'the reviewed set');
for (const k of reviewed) {
  const e = M[k];
  const docPath = path.join(repo, 'docs', e.doc || '__missing__');
  ok(!!e.doc && fs.existsSync(docPath), `${k}: review document ${e.doc} exists`);
  const suitePath = path.join(repo, 'tests/solidity/test', e.suite || '__missing__');
  ok(!!e.suite && fs.existsSync(suitePath), `${k}: Foundry suite ${e.suite} exists`);
  if (e.suite && fs.existsSync(suitePath)) {
    const src = fs.readFileSync(suitePath, 'utf8');
    ok(/function\s+testFuzz\w*\s*\(|function\s+invariant\w*\s*\(/.test(src), `${k}: ${e.suite} has fuzz or invariant tests`);
  }
}
/* an experimental entry that names a document or a suite must name real files (the DAO does) */
for (const [k, e] of Object.entries(M).filter(([, x]) => x.level === 'experimental')) {
  if (e.doc) ok(fs.existsSync(path.join(repo, 'docs', e.doc)), `${k}: the document ${e.doc} exists`);
  if (e.suite) ok(fs.existsSync(path.join(repo, 'tests/solidity/test', e.suite)), `${k}: the suite ${e.suite} exists`);
}
/* the DAO is reviewed only because its High finding (a permanent admin veto) is fixed in its review */
{
  const dao = fs.readFileSync(path.join(repo, 'docs/dao-review.md'), 'utf8');
  ok(M.dao.level === 'reviewed' && /promoted to `reviewed`/.test(dao), 'dao: reviewed, and docs/dao-review.md records the promotion');
  ok(!dao.split('\n').some((l) => /^\| \d+ \|/.test(l) && /\| High/.test(l) && /\*\*Open\*\*/.test(l)), 'dao: no High finding is open in docs/dao-review.md');
}
/* templates that must stay experimental by evidence in the repo */
for (const k of ['ai', 'imported', 'crosschain', 'bridge', 'swap-orderbook', 'escrow', 'vesting']) {
  eq(M[k].level, 'experimental', `${k} stays experimental`);
}


/* docs/mainnet-gate.md lists every template with its level */
{
  const doc = fs.readFileSync(path.join(repo, 'docs', 'mainnet-gate.md'), 'utf8');
  for (const [k, e] of Object.entries(M)) {
    const row = doc.split('\n').find((l) => l.startsWith('|') && l.includes('`' + k + '`'));
    ok(!!row, `mainnet-gate.md has a row for ${k}`);
    if (row) ok(row.includes(e.level), `mainnet-gate.md row for ${k} says ${e.level}`, row.slice(0, 80));
  }
}

/* unknown or missing templates are experimental */
eq(ev("matLevel('does-not-exist')"), 'experimental', 'unknown template');
eq(ev('matLevel(undefined)'), 'experimental', 'no template');
eq(ev("matLevel('__proto__')"), 'experimental', 'prototype keys are not templates');
eq(ev("matLevel('constructor')"), 'experimental', 'object builtins are not templates');

/* the stamp carries the version and level and is never added twice */
const stamped = ev("matStamp('// SPDX-License-Identifier: MIT\\npragma solidity ^0.8.24;', 'treasury')");
ok(/^\/\/ SPDX-License-Identifier: MIT\n\/\/ ContractForge v\d+\.\d+\.\d+ \| maturity: reviewed \| NOT AUDITED\npragma/.test(stamped), 'stamp sits under the SPDX line');
eq(ev(`matStamp(${JSON.stringify(stamped)}, 'treasury')`), stamped, 'stamping twice changes nothing');
ok(/maturity: experimental/.test(ev(`matStamp(${JSON.stringify(stamped)}, 'ai')`)) && !/maturity: reviewed/.test(ev(`matStamp(${JSON.stringify(stamped)}, 'ai')`)), 're-stamping replaces the level');

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
