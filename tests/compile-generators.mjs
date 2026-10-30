// Loads the real app (index.html + app.js) in a simulated browser, runs every
// contract generator with its default form values on several networks, and
// compiles the output with solc 0.8.24 (the app's default compiler).
// Exit code 1 if any generator throws or produces code that does not compile.
import { JSDOM, VirtualConsole } from 'jsdom';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const solc = require('solc');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../contractforge-deploy');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace(/<script[^>]*src=[^>]*><\/script>/g, ''); // external scripts are injected below
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');

const pageErrors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => pageErrors.push(e.detail?.message || e.message));

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/' });
const w = dom.window;
w.alert = () => {}; w.confirm = () => true;
w.HTMLElement.prototype.scrollIntoView = () => {}; w.scrollTo = () => {};
w.ethers = { utils: {}, providers: {}, Contract: class {}, ContractFactory: class {} };
// run as a classic script so top-level let/const stay global, like in a browser
const scriptEl = w.document.createElement('script');
scriptEl.textContent = appJs;
w.document.body.appendChild(scriptEl);
const ev = (c) => w.eval(c);

const SIMPLE = ['erc20', 'erc721', 'escrow', 'vesting', 'paywall', 'dao', 'smartwallet', 'staking'];
const ADVANCED = ['genSwap', 'genTreasury', 'genVault', 'genMultisend', 'genCrosschain'];
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
  return { errors, count: Object.keys(contracts).length };
}

// Address fields have no default (empty = placeholder that intentionally does not
// compile). Fill them the way a user would, with distinct valid addresses.
let addrSeq = 0;
function fakeAddr() { addrSeq = (addrSeq % 9) + 1; return '0x' + String(addrSeq).repeat(40); }
function fillAddresses(net) {
  const doc = w.document;
  doc.querySelectorAll('input, textarea').forEach((el) => {
    if (el.value) return;
    const isCctp = /^cc_(tokenmessenger|msgtransmitter)$/.test(el.id);
    if (isCctp) { if (!ev(`NETWORKS['${net}'].cctp.tokenMessenger`)) el.value = fakeAddr(); return; }
    if ((el.getAttribute('placeholder') || '').includes('0x') && !/^cc_/.test(el.id)) el.value = fakeAddr();
  });
  const signers = doc.getElementById('tre_signers');
  if (signers) signers.value = [fakeAddr(), fakeAddr(), fakeAddr()].join('\n');
}

let failed = 0, passed = 0;
function check(label, run) {
  try {
    ev("pendingSource = { name:'', code:'' };");
    run();
    const { name, code } = JSON.parse(ev('JSON.stringify(pendingSource)'));
    if (!code) throw new Error('generator produced no code');
    const r = compile(name, code);
    if (r.errors.length) throw new Error('compile error: ' + r.errors[0]);
    if (!r.count) throw new Error('no contracts in compiler output');
    passed++; console.log(`  ok    ${label} -> ${name}`);
  } catch (e) {
    failed++; console.log(`  FAIL  ${label}: ${e.message}`);
  }
}

for (const net of NETWORKS) {
  console.log(`\n[${net}]`);
  ev(`activeNetwork = '${net}';`);
  for (const id of SIMPLE) check(`simple/${id}`, () => { ev(`renderSimpleForm('${id}');`); fillAddresses(net); ev(`genSimple('${id}');`); });
  for (const fn of ADVANCED) check(fn, () => { fillAddresses(net); ev(`${fn}();`); });
}

if (pageErrors.length) { failed++; console.log('\nPage errors:', pageErrors); }
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
