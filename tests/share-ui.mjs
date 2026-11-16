// Phase 10.3: Share & Export (section 13). generateShareUrl, copyShareUrl, loadFromUrlHash and the artifact builders are unchanged. Two things were fixed: the QR
// code no longer sends a link that cannot fit in a QR code (it holds the whole source) to the outside service, and an export of an ABI or bytecode that was never compiled
// is refused instead of saved as an empty file. These tests prove the link round trip, the files' exact content, what the page says about each
// (all 16 networks), and that the compiled artifact is only called "from this source" when a deployment made on this page proves it.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadApp, root, addrFor } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);
const tick = () => new Promise((r) => setTimeout(r, 0));
const css = fs.readFileSync(path.join(root, 'app.css'), 'utf8');
const A = addrFor('a1');
const kk = (x) => '0x' + crypto.createHash('sha256').update(String(x)).digest('hex');

function fresh() {
  const a = loadApp(); const d = a.w.document;
  const style = d.createElement('style'); style.textContent = css; d.head.appendChild(style);
  const alerts = []; a.w.alert = (m) => alerts.push(m);
  a.w.ethers.utils = { keccak256: kk };
  const fetches = []; a.w.fetch = async (u) => { fetches.push(String(u)); return { json: async () => ({}) }; };
  const files = []; a.w.Blob = class { constructor(p, o) { this.text = p.join(''); this.type = o && o.type; } }; a.w.URL.createObjectURL = (b) => { a.last = b; return 'blob:x'; }; a.w.URL.revokeObjectURL = () => {};
  a.w.HTMLAnchorElement.prototype.click = function () { files.push({ name: this.download, text: a.last && a.last.text, type: a.last && a.last.type }); };
  const clip = []; Object.defineProperty(a.w.navigator, 'clipboard', { value: { writeText: (x) => { clip.push(x); return Promise.resolve(); } }, configurable: true });
  const settle = async () => { await tick(); await tick(); await tick(); };
  const go = async (s) => { d.querySelector(`.nav-item[data-section="${s}"]`).click(); await settle(); };
  const net = async (k) => { a.ev(`activeNetwork = '${k}'; updateSideNet();`); await settle(); };
  const rows = () => Object.fromEntries([...d.querySelectorAll('#shrSummary .bld-row')].map((r) => [r.querySelector('dt').textContent, { text: r.querySelector('dd').childNodes[0] ? r.querySelector('dd').childNodes[0].textContent : '', flag: (r.querySelector('.bld-flag') || {}).textContent || '', state: r.dataset.state }]));
  const gen = () => a.ev("renderSimpleForm('erc20'); genSimple('erc20')");
  const click = async (sel) => { d.querySelector(sel).click(); await settle(); };
  const fmt = async (f) => { const s = d.getElementById('export_format'); s.value = f; s.dispatchEvent(new a.w.Event('change', { bubbles: true })); await settle(); };
  return { ...a, d, alerts, fetches, files, clip, settle, go, net, rows, gen, click, fmt };
}
const NETS = (a) => JSON.parse(a.ev('JSON.stringify(Object.entries(NETWORKS).map(([k, n]) => [k, n.label, !!n.isMainnet, n.chainIdDec]))'));

/* 1. the page: ids, handlers, options, defaults and the QR box as they were */
{
  const a = fresh(); const { d } = a;
  for (const id of ['shareUrl', 'export_format', 'qrBox']) ok(!!d.getElementById(id), 'id: ' + id);
  eq([...d.querySelectorAll('#sec-share .btn')].map((b) => b.textContent + ':' + b.getAttribute('data-onclick')), ['Generate URL:generateShareUrl()', 'Copy URL:copyShareUrl()', 'Download:exportArtifact()', 'QR Code:generateQR()'], 'the four buttons keep their text and handlers');
  eq([...d.querySelectorAll('#export_format option')].map((o) => o.value + ':' + o.textContent), ['hardhat:Hardhat deploy script (JS)', 'forge:Foundry script (Solidity)', 'abi:ABI JSON only', 'full:Full artifact (ABI + bytecode + source)'], 'the four formats are unchanged');
  eq([d.getElementById('shareUrl').readOnly, d.getElementById('shareUrl').placeholder, d.getElementById('qrBox').getAttribute('style')], [true, "Click 'Generate URL' to encode current config", 'margin-top:16px;display:none;text-align:center;'], 'the link field is read-only with its placeholder; the QR box is as it was');
  ok(['shareUrl', 'export_format'].every((id) => !!d.querySelector(`label[for="${id}"]`)), 'the link and the format have labels');
  eq([...d.getElementById('sec-share').outerHTML.matchAll(/\son[a-z]+="/gi)].length, 0, 'csp: no inline handler');
  eq(d.querySelector('#sec-share .section-head h2').textContent, 'Share & Export', 'the heading is unchanged');
  ok(/api\.qrserver\.com, an outside service: it receives the whole link, source code included/.test(d.querySelector('#shrQrH').closest('section').textContent), 'the QR card says who draws the image and what it receives');
  const vs = css.slice(css.indexOf('/* ---- Share & Export (section 13)'), css.indexOf('/* ---- Verify on Explorer (section 12)'));
  const sels = []; vs.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\})\s*([^{}@][^{}]*)\{/g, (_, __, s) => { sels.push(...s.split(',').map((x) => x.trim())); return ''; });
  eq(sels.filter((s) => s && !s.startsWith('@') && !/^\.bld#sec-share(?![\w-])/.test(s)), [], 'css: every new rule is scoped to #sec-share');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 2. all 16 networks: the overview states the network, the mainnet warning, and what opening the link does */
{
  const a = fresh(); const { d } = a; a.gen(); await a.go('share');
  const nets = NETS(a);
  for (const [k, label, main, chain] of nets) {
    await a.net(k); const r = a.rows();
    eq([r.Network.text, !!r.Network.flag, r['When someone opens it'].text], [label + ' (' + chain + ')', main, 'Starts on ' + label], `${k}: the network, ${main ? 'with' : 'without'} the mainnet warning, and where the link starts`);
    eq([...d.querySelectorAll('#shrNotes li')].some((li) => /You are on a mainnet \(/.test(li.textContent) && li.textContent.includes(label)), main, `${k}: the scripts caution appears only on mainnets`);
  }
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 3. the link: what it holds, the round trip into a fresh page, and when it is out of date */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); await a.go('share');
  eq([a.rows().Contract.text, a.rows()['Share link'].state, /holds only the network/.test(a.rows()['Share link'].flag), a.rows()['When someone opens it']], ['None generated yet', 'missing', true, undefined], 'no contract: the link would hold only the network');
  a.gen(); await a.go('home'); await a.go('share');
  const name = a.ev('pendingSource.name'), code = a.ev('pendingSource.code');
  ok(/^It would be [\d,]+ characters$/.test(a.rows()['Share link'].flag), 'before generating: it says how long the link would be');
  await a.click('[data-onclick="generateShareUrl()"]');
  const link = d.getElementById('shareUrl').value;
  ok(/#cfg=/.test(link) && !link.slice(link.indexOf('#cfg=') + 5).includes(' '), 'Generate URL puts the link in the field');
  eq([a.rows()['Share link'].state, a.rows()['Share link'].text, a.rows()['Share link'].flag], ['ok', link.length.toLocaleString() + ' characters', 'Holds the network and the full source'], 'the overview states its real size and what it holds');
  const cfg = JSON.parse(decodeURIComponent(escape(Buffer.from(link.split('#cfg=')[1], 'base64').toString('binary'))));
  eq([cfg.network, cfg.name, cfg.code === code, Object.keys(cfg).sort()], ['sepolia', name, true, ['code', 'name', 'network']], 'the link holds exactly the network, the name and the source');
  await a.click('[data-onclick="copyShareUrl()"]'); eq(a.clip, [link], 'Copy URL copies the link');
  // opening it somewhere else
  const b = fresh(); b.w.location.hash = '#cfg=' + link.split('#cfg=')[1]; b.ev('loadFromUrlHash()'); await b.settle();
  eq([b.ev('activeNetwork'), b.ev('pendingSource.name'), b.ev('pendingSource.code') === code, b.ev('pendingSource.template'), b.ev('pendingCtorArgs.length')], ['sepolia', name, true, 'imported', 0], 'opening the link loads the source as an imported contract on the same network');
  eq(b.ev("matInfo(pendingSource.template).level"), 'experimental', 'an imported contract is treated as experimental');
  // a link that names a template or an unknown network is not trusted
  const evil = Buffer.from(unescape(encodeURIComponent(JSON.stringify({ network: 'nope', name: 'X', code: '// x', template: 'erc20', level: 'reviewed' }))), 'binary').toString('base64');
  const c = fresh(); c.w.location.hash = '#cfg=' + evil; c.ev('loadFromUrlHash()');
  eq([c.ev('activeNetwork'), c.ev('pendingSource.template')], ['arc', 'imported'], 'an unknown network is ignored and a template named in the link is never trusted');
  // out of date
  await a.net('base'); eq([a.rows()['Share link'].state, a.rows()['Share link'].text], ['bad', 'Out of date'], 'the network changed after the link was made: out of date');
  await a.net('sepolia'); eq(a.rows()['Share link'].state, 'ok', 'back to the same network: current again');
  a.ev("document.getElementById('s_supply').value = '5'; genSimple('erc20')"); await a.go('home'); await a.go('share');
  eq(a.rows()['Share link'].state, 'bad', 'the contract changed: out of date');
  eq(a.fetches.length, 0, 'none of this sent anything');
}

/* 4. the QR code: a link that cannot fit is never sent to the outside service */
{
  const a = fresh(); const { d } = a; a.gen(); await a.go('share');
  ok(a.rows()['QR code'].state === 'bad' && a.rows()['QR code'].text === 'Too long' && /of 2,953 characters/.test(a.rows()['QR code'].flag), 'a generated contract: the overview says it is too long for a QR code, with the real numbers');
  ok([...d.querySelectorAll('#shrNotes li')].some((li) => /too long for a QR code, so no request is made/.test(li.textContent)), 'and the notes say no request is made');
  await a.click('[data-onclick="generateQR()"]');
  const box = d.getElementById('qrBox');
  eq([box.style.display, box.querySelector('img') === null, /api\.qrserver\.com/.test(box.innerHTML)], ['block', true, false], 'Press QR Code: no image and no mention of the service in the box');
  ok(/^This link is [\d,]+ characters and a QR code holds at most 2,953\. Nothing was sent to the QR service\./.test(box.textContent), 'the box says why, and that nothing was sent');
  eq(a.fetches.length, 0, 'and no request was made');
  // a short link still gets its image, exactly as before
  a.ev("pendingSource = { name: '', code: '', template: '' }"); await a.go('home'); await a.go('share');
  eq([a.rows()['QR code'].state, a.rows()['QR code'].text], ['ok', 'Fits'], 'a short link: it fits');
  await a.click('[data-onclick="generateQR()"]');
  const img = box.querySelector('img'), link = d.getElementById('shareUrl').value;
  ok(!!img && img.getAttribute('src') === 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(link), 'a short link: the image is requested exactly as before');
  eq(link.length <= 2953, true, 'and the link was within the limit');
}

/* 5. the files: exact content, names, and no empty ABI or bytecode */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.gen(); await a.go('share');
  const name = a.ev('pendingSource.name'), code = a.ev('pendingSource.code');
  // nothing compiled in this session
  eq([a.rows()['Compiled artifact'].state, a.rows()['Compiled artifact'].text], ['missing', 'None in this session'], 'no compile: the overview says so');
  for (const f of ['abi', 'full', 'hardhat']) { a.alerts.length = 0; await a.fmt(f); ok(/Nothing has been compiled in this session, so this export is refused/.test(d.getElementById('exportInfo').textContent), `${f}: the page says it is refused until you compile`); await a.click('[data-onclick="exportArtifact()"]'); eq([a.files.length, a.alerts], [0, ['No content to export. Ensure the contract is compiled first.']], `${f}: refused with the page's own message, no file`); }
  await a.fmt('forge'); await a.click('[data-onclick="exportArtifact()"]');
  eq(a.files.map((f) => f.name), ['Deploy' + name + '.s.sol'], 'the Foundry script needs no compile and is saved');
  const fg = a.files[0].text;
  ok(fg.includes('Network: Ethereum Sepolia (chainId 11155111)') && fg.includes('vm.envUint("PRIVATE_KEY")') && fg.includes(`import {${name}} from "../src/${name}.sol";`) && fg.includes('/* add constructor args here */'), 'it names the network, reads PRIVATE_KEY, imports the contract and leaves the constructor placeholder');
  ok(/save the source with Download \.sol/.test(d.getElementById('exportInfo').textContent) && d.getElementById('exportInfo').textContent.includes('PRIVATE_KEY'), 'and the page says so');
  // with a compiled artifact
  const ABI = [{ type: 'function', name: 'ping', inputs: [], outputs: [], stateMutability: 'view' }];
  a.ev(`window.__lastCompiledABI = ${JSON.stringify(ABI)}; window.__lastCompiledBytecode = '0x6080604052';`); await a.go('home'); await a.go('share');
  eq([a.rows()['Compiled artifact'].state, a.rows()['Compiled artifact'].text, /^Unverified/.test(a.rows()['Compiled artifact'].flag)], ['missing', '1 ABI items', true], 'a compile with nothing tying it to this source: shown as unverified');
  a.files.length = 0;
  for (const f of ['abi', 'full', 'hardhat']) { await a.fmt(f); ok(/may belong to another source/.test(d.getElementById('exportInfo').textContent), `${f}: the page warns the compiled part may belong to another source`); await a.click('[data-onclick="exportArtifact()"]'); }
  eq(a.files.map((f) => f.name), [name + '_abi.json', name + '_artifact.json', 'deploy_' + name + '.js'], 'the three files are saved under their own names');
  eq(JSON.parse(a.files[0].text), ABI, 'the ABI file is exactly the ABI');
  const full = JSON.parse(a.files[1].text);
  eq([full.name, full.abi, full.bytecode, full.source === code, full.network, typeof full.timestamp], [name, ABI, '0x6080604052', true, 'sepolia', 'string'], 'the full artifact: name, ABI, bytecode, the source on screen, the network and a timestamp');
  const hh = a.files[2].text;
  ok(hh.includes('Network: Ethereum Sepolia (chainId 11155111)') && hh.includes('"0x6080604052"') && hh.includes('"name": "ping"') && hh.includes(`"${name} deployed to:"`) && hh.includes('/* add constructor args here */'), 'the Hardhat script has the network, the bytecode, the ABI and the constructor placeholder');
  eq([a.files[0].type, a.files[2].type], ['application/json', 'text/plain'], 'and the right file types');
  eq(a.fetches.length, 0, 'nothing was sent');
}

/* 6. the compiled artifact is "from this source" only when a deployment made on this page proves it */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); a.gen(); await a.go('deploy');                         // the deploy tab installs the run tracker
  const name = a.ev('pendingSource.name');
  a.ev("window.__lastCompiledABI = [{ type: 'constructor', inputs: [] }]; window.__lastCompiledBytecode = '0xaaaa';");
  a.ev('uiResetDeployResults()'); a.ev(`uiAddDeployResult({ name: '${name}', network: 'sepolia', address: '${A}', txHash: '0x1', bytecodeKeccak256: '${kk('0xaaaa')}' })`);
  await a.go('share');
  eq([a.rows()['Compiled artifact'].state, /Compiled from this exact source/.test(a.rows()['Compiled artifact'].flag)], ['ok', true], 'a run with this source and a result whose bytecode hash equals the artifact: exact');
  a.ev("window.__lastCompiledBytecode = '0xbbbb';"); await a.go('home'); await a.go('share');
  eq(a.rows()['Compiled artifact'].state, 'missing', 'a different bytecode than the deployment used: unverified');
  a.ev("window.__lastCompiledBytecode = '0xaaaa';"); a.ev("document.getElementById('s_supply').value = '9'; genSimple('erc20')"); await a.go('home'); await a.go('share');
  eq(a.rows()['Compiled artifact'].state, 'missing', 'the source changed after the run: unverified');
  eq(a.pageErrors.length, 0, 'no page errors');
}

/* 7. the constructor note, the hostile text, nothing written, and repeated navigation */
{
  const a = fresh(); const { d } = a; await a.net('sepolia'); await a.go('share');
  a.ev("setMultichainMode('portable'); renderSimpleForm('escrow')"); d.getElementById('s_buyer').value = A; d.getElementById('s_seller').value = addrFor('b2'); d.getElementById('s_arbiter').value = addrFor('c3'); a.ev("genSimple('escrow')"); await a.go('home'); await a.go('share');
  eq([a.rows().Constructor.text, /placeholder/.test(a.rows().Constructor.flag)], ['1 argument', true], 'a contract with a constructor argument: the scripts leave a placeholder, and it says so');
  const evil = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
  a.ev(`pendingSource = { name: ${JSON.stringify(evil)}, code: '// ' + ${JSON.stringify(evil)}, template: 'erc20' }`); await a.click('[data-onclick="generateShareUrl()"]'); await a.fmt('forge'); await a.go('home'); await a.go('share');
  eq([d.querySelectorAll('#sec-share img, #sec-share script').length, a.w.__xss], [0, undefined], 'hostile text in the contract name is not drawn as markup and nothing ran');
  eq([...d.querySelectorAll('#sec-share *')].flatMap((e) => e.tagName === 'INPUT' ? [] : [...e.attributes].map((x) => x.name + '=' + x.value)).filter((x) => /__xss|onerror|<img|<script/.test(x)), [], 'no attribute holds any of it');
  let writes = 0; const si = a.w.Storage.prototype.setItem; a.w.Storage.prototype.setItem = function (...x) { writes++; return si.apply(this, x); };
  for (let k = 0; k < 8; k++) await a.go(['home', 'swap', 'deploy', 'history', 'verify', 'share'][k % 6]);
  await a.go('share'); await a.fmt('abi'); await a.fmt('hardhat'); a.w.Storage.prototype.setItem = si;
  eq([d.querySelectorAll('#shrSummary .bld-row').length, d.querySelectorAll('#shrNotes li').length], [8, 2], 'repeated navigation leaves no duplicated rows or notes');
  eq(writes, 0, 'drawing the overview never wrote to storage');
  for (const id of ['sec-verify', 'sec-history', 'sec-deploy']) ok(!d.getElementById(id).querySelector('#shrSummary, #shrNotes'), `${id} is untouched`);
  ok(JSON.parse(a.ev('JSON.stringify(CFBuilder.viewKeys())')).includes('share'), 'the overview redraws with the other views when the network or mode changes');
  eq(a.pageErrors.length, 0, 'no page errors');
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
