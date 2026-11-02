/* =====================================================================
   Maturity of every generator, and the mainnet gate.

   Levels
   - audited      an independent audit was completed (no template has this today)
   - reviewed     internal review documented in docs/ AND a dedicated Foundry suite (tests/solidity/test)
                  with fuzz or invariant tests AND no relevant open finding
   - experimental everything else. AI-written contracts are always experimental.

   On a mainnet an experimental contract cannot be deployed until the user ticks a box and types a phrase.
   The decision is taken here from the template that produced the contract (never from text inside the code,
   which an AI model could forge). See docs/mainnet-gate.md.
   ===================================================================== */

const GENERATOR_VERSION = '3.1.0';
const MAT_DOCS_BASE = 'https://github.com/julenosinger/contratforg/blob/main/docs/';
const MAT_PHRASE = 'DEPLOY EXPERIMENTAL';

const MATURITY_LEVELS = {
  audited:      { label: 'Audited',      icon: '\u2713', title: 'Independently audited' },
  reviewed:     { label: 'Reviewed',     icon: '\u25D0', title: 'Reviewed internally, NOT audited by a third party' },
  experimental: { label: 'Experimental', icon: '\u26A0', title: 'Not reviewed and not audited: you can lose funds' }
};

/* One entry per generator. `suite` is the Foundry file that must exist (and contain fuzz or invariant tests)
   for a "reviewed" entry; tests/maturity.mjs checks every claim against the repository. */
const MATURITY = {
  'smartwallet':       { level: 'reviewed', reason: 'Documented review and a Foundry suite with fuzz tests.', doc: 'smart-wallet-review.md', suite: 'SmartWallet.t.sol' },
  'swap-amm-single':   { level: 'reviewed', reason: 'Documented review and Foundry suites with fuzz tests. A pool is only as safe as its two tokens.', doc: 'swap-amm-review.md', suite: 'Gen.t.sol' },
  'treasury':          { level: 'reviewed', reason: 'Documented review and a Foundry suite with fuzz tests.', doc: 'generators-review.md', suite: 'Hardening.t.sol' },
  'vault':             { level: 'reviewed', reason: 'Documented review and a Foundry suite with fuzz tests.', doc: 'generators-review.md', suite: 'Hardening.t.sol' },
  'swap-amm-factory':  { level: 'experimental', reason: 'Same pool code as the reviewed single pool, but the permissionless factory has no fuzz or invariant tests of its own.', doc: 'swap-amm-review.md' },
  'swap-orderbook':    { level: 'experimental', reason: 'No fuzz or invariant tests for the order book.', doc: 'generators-review.md' },
  'dao':               { level: 'experimental', reason: 'Reviewed, but its test suite has no fuzz or invariant tests, and governance has known limits (guardian cancel, no vote escrow).', doc: 'generators-review.md' },
  'staking':           { level: 'experimental', reason: 'Second-pass review only; unit tests, no fuzz or invariant tests.', doc: 'generators-review.md' },
  'escrow':            { level: 'experimental', reason: 'Second-pass review only; unit tests, no fuzz or invariant tests.', doc: 'generators-review.md' },
  'vesting':           { level: 'experimental', reason: 'Second-pass review only; unit tests, no fuzz or invariant tests.', doc: 'generators-review.md' },
  'paywall':           { level: 'experimental', reason: 'Second-pass review only; unit tests, no fuzz or invariant tests.', doc: 'generators-review.md' },
  'erc721':            { level: 'experimental', reason: 'Second-pass review only; unit tests, no fuzz or invariant tests.', doc: 'generators-review.md' },
  'multisend':         { level: 'experimental', reason: 'Second-pass review only; unit tests, no fuzz or invariant tests.', doc: 'generators-review.md' },
  'erc20':             { level: 'experimental', reason: 'No review document of its own and no dedicated test suite.', doc: null },
  'crosschain':        { level: 'experimental', reason: 'Legacy CCTP V1 form: no review document and no dedicated test suite.', doc: null },
  'bridge':            { level: 'experimental', reason: 'CCTP V2 bridge helper: unit tests only, no review document.', doc: null },
  'ai':                { level: 'experimental', reason: 'Written by an AI model from a prompt: always experimental.', doc: null },
  'imported':          { level: 'experimental', reason: 'Loaded from a link, a saved session or another source: its origin cannot be checked.', doc: null }
};

/* Any template that is not in the table (or no template at all) is experimental. */
function matInfo(template){
  const e = (template && Object.prototype.hasOwnProperty.call(MATURITY, template)) ? MATURITY[template] : MATURITY.imported;
  return { template: template || 'imported', level: e.level, reason: e.reason, doc: e.doc, docUrl: e.doc ? MAT_DOCS_BASE + e.doc : null, suite: e.suite || null };
}
function matLevel(template){ return matInfo(template).level; }

/* The one line added to every generated header (no date and no commit hash, so the golden files stay stable). */
function matStampLine(template){ return '// ContractForge v' + GENERATOR_VERSION + ' | maturity: ' + matLevel(template) + ' | NOT AUDITED'; }

/* Inserts the stamp right after the SPDX line (or at the top when there is none). Never adds it twice. */
function matStamp(code, template){
  const src = String(code || '');
  const line = matStampLine(template);
  const clean = src.split('\n').filter(l => !/^\/\/ ContractForge v\S+ \| maturity: \w+ \| NOT AUDITED$/.test(l)).join('\n');
  const lines = clean.split('\n');
  const i = lines.findIndex(l => /^\s*\/\/\s*SPDX-License-Identifier/.test(l));
  if(i >= 0){ lines.splice(i + 1, 0, line); return lines.join('\n'); }
  return line + '\n' + clean;
}

/* ---------------- approvals: which source was confirmed for which mainnet ---------------- */
function matHash(str){   // cyrb53, enough to bind an approval to one exact source text
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  const s = String(str);
  for(let i = 0; i < s.length; i++){
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}
const MAT_APPROVED = new Set();
function matApprove(hash, netKey){ MAT_APPROVED.add(hash + '|' + netKey); }
function matIsApproved(hash, netKey){ return MAT_APPROVED.has(hash + '|' + netKey); }

/* The gate. Resolves true when every selected mainnet may receive this source; testnets never need it. */
async function matGate(netKeys, src){
  const keys = (netKeys || []).filter(k => NETWORKS[k]);
  const mains = keys.filter(k => NETWORKS[k].isMainnet);
  if(!mains.length) return true;
  const info = matInfo(src.template);
  if(info.level === 'experimental'){
    const ok = (typeof uiExperimentalGate === 'function')
      ? await uiExperimentalGate({ name: src.name, info, nets: mains.map(k => NETWORKS[k].label) })
      : false;
    if(!ok) return false;
  }
  const hash = matHash(src.code);
  mains.forEach(k => matApprove(hash, k));
  return true;
}

/* What the deploy summary shows about maturity. */
function matDialogInfo(template){ const i = matInfo(template); return { level: i.level, reason: i.reason, docUrl: i.docUrl }; }

/* ---------------- badges (colour, symbol and text, so colour alone is never the signal) ---------------- */
function matBadgeHtml(template, opts){
  const i = matInfo(template), L = MATURITY_LEVELS[i.level];
  const small = opts && opts.small ? ' mat-small' : '';
  return '<span class="mat-badge mat-' + i.level + small + '" title="' + escapeHtml(L.title + '. ' + i.reason) + '"><span aria-hidden="true">' + L.icon + '</span> ' + escapeHtml(L.label) + '</span>';
}
function matBadgeFor(template){ return (typeof escapeHtml === 'function') ? matBadgeHtml(template, { small: true }) : ''; }

const MAT_SECTION_TEMPLATE = { treasury: () => 'treasury', vault: () => 'vault', multisend: () => 'multisend', crosschain: () => (typeof isPortable === 'function' && isPortable()) ? 'bridge' : 'crosschain', swap: () => matSwapTemplate() };
function matSwapTemplate(){
  const kind = (document.getElementById('swap_kind') || {}).value || 'amm';
  const multi = (document.getElementById('swap_multi') || {}).value || 'single';
  return kind === 'amm' ? (multi === 'factory' ? 'swap-amm-factory' : 'swap-amm-single') : 'swap-orderbook';
}

/* Puts a badge on the template cards and next to each section title. Safe to call again. */
function matDecorate(){
  document.querySelectorAll('#simpleGrid .tcard[data-id]').forEach(card => {
    if(card.querySelector('.mat-badge')) return;
    const h = card.querySelector('h3');
    if(h) h.insertAdjacentHTML('afterend', '<div class="mat-row">' + matBadgeFor(card.dataset.id) + '</div>');
  });
  Object.keys(MAT_SECTION_TEMPLATE).forEach(sec => {
    const head = document.querySelector('#sec-' + sec + ' .section-head h2');
    if(!head) return;
    let slot = head.parentElement.querySelector('.mat-slot');
    if(!slot){ slot = document.createElement('span'); slot.className = 'mat-slot'; head.insertAdjacentElement('afterend', slot); }
    slot.innerHTML = matBadgeFor(MAT_SECTION_TEMPLATE[sec]());
  });
}

if(typeof document !== 'undefined'){
  matDecorate();
  document.addEventListener('change', e => { if(e.target && (e.target.id === 'swap_kind' || e.target.id === 'swap_multi')) matDecorate(); });
}
