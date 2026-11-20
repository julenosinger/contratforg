// Shared by the Light Mode contrast test and the dark-mode preservation check: a static server for the app, a mock wallet, and one scripted
// scenario per page or overlay, so that both themes are measured on exactly the same screens and states. Browser only (playwright).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const dir = path.resolve(here, '../contractforge-deploy');

export async function startServer() {
  const headers = {};
  { let cur = false; for (const l of fs.readFileSync(path.join(dir, '_headers'), 'utf8').split('\n')) { if (l.startsWith('/')) { cur = l.trim() === '/*'; continue; } const m = l.match(/^\s+([A-Za-z-]+):\s*(.*)$/); if (cur && m) headers[m[1]] = m[2]; } }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const server = http.createServer((req, res) => {
    const u = req.url.split('?')[0]; const f = path.join(dir, u === '/' ? 'index.html' : u);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { ...headers, 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(fs.readFileSync(f));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { server, origin: 'http://127.0.0.1:' + server.address().port };
}

// A mock EIP-1193 wallet (no real transaction, no node).
export const walletScript = () => {
  window.__wallet = {
    accounts: ['0x00000000000000000000000000000000000a11ce'], chain: '0xaa36a7', balance: '0xde0b6b3a7640000', listeners: {},
    on(evt, cb) { (this.listeners[evt] = this.listeners[evt] || []).push(cb); }, removeListener() {},
    emit(evt, ...args) { (this.listeners[evt] || []).forEach((cb) => cb(...args)); },
    async request({ method }) {
      switch (method) {
        case 'eth_requestAccounts': case 'eth_accounts': return this.accounts;
        case 'eth_chainId': return this.chain;
        case 'net_version': return String(parseInt(this.chain, 16));
        case 'wallet_switchEthereumChain': case 'wallet_addEthereumChain': return null;
        case 'eth_getBalance': return this.balance;
        default: throw Object.assign(new Error('unsupported ' + method), { code: -32601 });
      }
    },
  };
  window.ethereum = window.__wallet;
};

const HISTORY = [
  { name: 'ArcSwapAMM', address: '0x24b91F33a1c05d3E2a77C0d48eF7c1aB3e86d63A', network: 'arcMain', abi: [], txHash: '0x' + 'ab'.repeat(32), timestamp: 1795170000000 },
  { name: 'ArcOriginals', address: '0xD7D9E8F7a1c05d3E2a77C0d48eF7c1aB3e6F7F73', network: 'basesep', abi: [], txHash: '0x' + 'cd'.repeat(32), timestamp: 1793900000000 },
  { name: 'SimpleToken', address: '0x5CC88E1a1c05d3E2a77C0d48eF7c1aB3e5E4d2c1', network: 'sepolia', abi: [], txHash: '0x' + 'ef'.repeat(32), timestamp: 1793000000000 },
];

const FREEZE = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';

// A fresh page with deterministic state: the same saved history, the same viewport, animations off.
export async function openPage(browser, origin, vp, { light = false, wallet = true } = {}) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 700, isMobile: vp.width < 700, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(String(e)));
  if (wallet) await page.addInitScript(walletScript);
  await page.addInitScript(([h, l]) => { try { localStorage.setItem('contractforge_deploy_history', JSON.stringify(h)); if (l) localStorage.setItem('cf_theme', 'light'); } catch (_) { /* ignore */ } }, [HISTORY, light]);
  await page.goto(origin + '/', { waitUntil: 'load' });
  await page.addStyleTag({ content: FREEZE });
  await page.waitForTimeout(150);
  return { ctx, page, problems };
}

const nav = (s) => async (p) => { await p.evaluate((x) => document.querySelector('.nav-item[data-section="' + x + '"]').click(), s); };
const gen = (code) => async (p) => { await p.evaluate((c) => { try { (0, eval)(c); } catch (e) { /* the generator may refuse an incomplete form: its error state is the point */ } }, code); };
const TRE = "document.getElementById('tre_signers').value=['0x0000000000000000000000000000000000000a01','0x0000000000000000000000000000000000000b02','0x0000000000000000000000000000000000000c03'].join('\\n');";

// id, what to do after the page loaded. Each one leaves the screen in the state a user would see.
export const SCENARIOS = [
  { id: 'home', run: async () => {} },
  { id: 'home-testnet', run: async (p) => { await p.evaluate(() => { activeNetwork = 'sepolia'; renderNetBanner(); updateSideNet(); renderSimpleForm('erc20'); genSimple('erc20'); }); } },
  { id: 'home-connected', run: async (p) => { await p.evaluate(() => { activeNetwork = 'sepolia'; renderNetBanner(); updateSideNet(); renderSimpleForm('erc20'); genSimple('erc20'); }); await p.click('#connectBtn'); await p.waitForFunction(() => /Connected/.test(document.getElementById('connectBtn').textContent)); } },
  { id: 'net-panel', run: async (p) => { await p.click('#netChangeBtn'); } },
  { id: 'wizard', run: nav('wizard') },
  { id: 'nlai', run: nav('nlai') },
  { id: 'simple', run: async (p) => { await nav('simple')(p); await gen("renderSimpleForm('erc20'); genSimple('erc20')")(p); } },
  { id: 'simple-dao-error', run: async (p) => { await nav('simple')(p); await gen("renderSimpleForm('dao'); genSimple('dao')")(p); } },
  { id: 'swap', run: async (p) => { await nav('swap')(p); await gen('genSwap()')(p); } },
  { id: 'treasury', run: async (p) => { await nav('treasury')(p); await gen(TRE + 'genTreasury()')(p); } },
  { id: 'vault', run: async (p) => { await nav('vault')(p); await gen('genVault()')(p); } },
  { id: 'multisend', run: async (p) => { await nav('multisend')(p); await gen('genMultisend()')(p); } },
  { id: 'crosschain', run: async (p) => { await nav('crosschain')(p); await gen('genCrosschain()')(p); } },
  { id: 'deploy', run: async (p) => { await gen("renderSimpleForm('erc20'); genSimple('erc20')")(p); await nav('deploy')(p); } },
  { id: 'history', run: nav('history') },
  { id: 'verify', run: nav('verify') },
  { id: 'share', run: async (p) => { await gen("renderSimpleForm('erc20'); genSimple('erc20')")(p); await nav('share')(p); } },
  { id: 'lab', run: nav('lab') },
  { id: 'auditor', run: nav('auditor') },
  { id: 'playground', run: nav('playground') },
  { id: 'gas', run: nav('gas') },
  { id: 'analytics', run: nav('analytics') },
  { id: 'tests', run: nav('tests') },
  { id: 'wizard-step', run: async (p) => { await nav('wizard')(p); await p.evaluate(() => { const c = document.querySelector('#wp-0 [data-onclick^="wizardPick"], #wp-0 .wz-card'); if (c) c.click(); }); await p.waitForTimeout(60); await p.evaluate(() => { try { wizardNext(); } catch (_) { /* ok */ } }); } },
  { id: 'simple-open', run: async (p) => { await nav('simple')(p); await gen("renderSimpleForm('escrow'); genSimple('escrow')")(p); await p.evaluate(() => document.querySelectorAll('#sec-simple details').forEach((d) => { d.open = true; })); } },
  { id: 'builders-open', run: async (p) => { for (const s of ['swap', 'treasury', 'vault', 'multisend', 'crosschain']) { await nav(s)(p); await p.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; })); } await nav('swap')(p); } },
  { id: 'field-error', run: async (p) => { await nav('simple')(p); await gen("renderSimpleForm('erc20'); genSimple('erc20')")(p); await p.evaluate(() => { const i = document.querySelector('#sec-simple .field input'); if (i) { i.value = '0xnope'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('blur', { bubbles: true })); i.classList.add('invalid'); } }); } },
  { id: 'deploy-console', run: async (p) => { await gen("renderSimpleForm('erc20'); genSimple('erc20')")(p); await nav('deploy')(p); await p.evaluate(() => { logConsole('step', 'Compiling…'); logConsole('ok', 'Compiled'); logConsole('warn', 'Warning: unused variable'); logConsole('err', 'Error: insufficient funds'); logConsole('step', 'Tx sent', { href: 'https://example.org/tx/0x1', text: 'view tx' }); }); } },
  { id: 'playground-loaded', run: async (p) => { await nav('playground')(p); await p.evaluate(() => { try { pgLoad('0x5CC88E1a1c05d3E2a77C0d48eF7c1aB3e5E4d2c1', [{ type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256', name: '' }], stateMutability: 'view' }, { type: 'function', name: 'transfer', inputs: [{ type: 'address', name: 'to' }, { type: 'uint256', name: 'amount' }], outputs: [{ type: 'bool', name: '' }], stateMutability: 'nonpayable' }, { type: 'event', name: 'Transfer', inputs: [{ type: 'address', name: 'from', indexed: true }, { type: 'address', name: 'to', indexed: true }, { type: 'uint256', name: 'value' }] }], 'sepolia'); } catch (_) { /* ok */ } }); await p.waitForTimeout(150); } },
  { id: 'mode-popover', run: async (p) => { await nav('simple')(p); await p.click('#sec-simple .dm-trigger'); } },
  { id: 'actions-menu', run: async (p) => { await gen("renderSimpleForm('erc20'); genSimple('erc20')")(p); await p.click('.cc-menubtn'); } },
  { id: 'modal-mainnet', run: async (p) => { await gen("renderSimpleForm('erc20'); genSimple('erc20'); uiConfirmMainnet(NETWORKS[activeNetwork], { facts: [['Fee', '0.01']], args: [{ label: 'owner', value: '0x0' }] })")(p); } },
  { id: 'modal-gate', run: async (p) => { await gen("uiExperimentalGate({ name: 'ArcSwapAMM', info: { reason: 'Experimental template' }, nets: ['Arc Mainnet'] })")(p); } },
  { id: 'modal-action', run: async (p) => { await gen("uiConfirmAction({ tag: 'Danger', title: 'Clear history', warn: 'This cannot be undone.', rows: [['Items', '3']], confirmLabel: 'Clear' })")(p); } },
];

// ---- in-page helpers (serialised into the page) ----

// Contrast audit: every visible text node's effective colour against the effective background (alpha composited up the tree, gradients take the worst stop),
// SVG icons, placeholders, and the boundary of every form field. Returns a list of failures with a selector, the numbers, and the text.
export const auditInPage = (rootSel) => {
  const parse = (s) => { const m = s && s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (top, bot) => { const a = top.a + bot.a * (1 - top.a); if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }; return { r: (top.r * top.a + bot.r * bot.a * (1 - top.a)) / a, g: (top.g * top.a + bot.g * bot.a * (1 - top.a)) / a, b: (top.b * top.a + bot.b * bot.a * (1 - top.a)) / a, a }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const white = { r: 255, g: 255, b: 255, a: 1 };
  const opacityOf = (e) => { let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; };
  // stacking: an element that paints above an opaque layer sits on that layer: compose bottom-up instead
  const compose = (e) => {
    const chain = []; for (let n = e; n && n.nodeType === 1; n = n.parentElement) chain.push(n);
    chain.reverse();
    let cands = [white];
    for (const n of chain) {
      const cs = getComputedStyle(n);
      const bg = parse(cs.backgroundColor); const img = cs.backgroundImage;
      let layers = null;
      if (img && img !== 'none' && /gradient/.test(img)) { const stops = (img.match(/rgba?\([^)]+\)/g) || []).map(parse).filter(Boolean); if (stops.length) layers = stops; }
      else if (bg && bg.a > 0) layers = [bg];
      if (layers) cands = cands.flatMap((c) => layers.map((l) => { const o = over(l, c); return { ...o, a: 1 }; }));
    }
    return cands;
  };
  const sel = (e) => { const parts = []; for (let n = e; n && n.nodeType === 1 && parts.length < 4; n = n.parentElement) { let s = n.tagName.toLowerCase(); if (n.id) { parts.push(s + '#' + n.id); break; } if (n.classList.length) s += '.' + [...n.classList].slice(0, 2).join('.'); parts.push(s); } return parts.join(' < '); };
  const visible = (e) => { if (!e.getClientRects().length) return false; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return false; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const c = getComputedStyle(n); if (c.display === 'none' || c.visibility === 'hidden' || parseFloat(c.opacity) === 0) return false; if (n.hasAttribute('hidden')) return false; } const b = e.getBoundingClientRect(); if (b.width < 1 || b.height < 1) return false; return true; };
  const clippedAway = (e) => { // inside a sr-only box
    const b = e.getBoundingClientRect(); return b.width <= 1 && b.height <= 1;
  };
  const disabled = (e) => !!e.closest('[disabled],[aria-disabled="true"],fieldset:disabled');
  const fails = [];
  window.__auditEls = [];
  const add = (e, rec) => { window.__auditEls.push(e); fails.push(rec); };
  const pathOf = (e) => { const a = []; for (let n = e; n && n.nodeType === 1 && n !== document.body && a.length < 9; n = n.parentElement) a.push({ t: n.tagName.toLowerCase(), id: n.id || '', c: [...n.classList] }); return a; };
  const num = (c) => [Math.round(c.r), Math.round(c.g), Math.round(c.b)];
  const push = (e, kind, fg, bgs, need, text) => {
    const worst = Math.min(...bgs.map((b) => ratio(fg, b)));
    if (worst + 0.001 < need) add(e, { path: pathOf(e), op: opacityOf(e), fgN: num(fg), bgN: bgs.map(num), sel: sel(e), kind, ratio: Math.round(worst * 100) / 100, need, fg: `rgb(${Math.round(fg.r)},${Math.round(fg.g)},${Math.round(fg.b)})`, bg: bgs.map((b) => `rgb(${Math.round(b.r)},${Math.round(b.g)},${Math.round(b.b)})`).join(' / '), text: (text || '').trim().slice(0, 40) });
  };
  const root = rootSel ? document.querySelector(rootSel) : null;
  const all = root ? [root, ...root.querySelectorAll('*')] : [...document.querySelectorAll('body *')];
  const seen = new Set();
  for (const e of all) {
    if (['SCRIPT', 'STYLE', 'OPTION', 'OPTGROUP', 'NOSCRIPT'].includes(e.tagName)) continue;
    if (!visible(e) || clippedAway(e)) continue;
    const cs = getComputedStyle(e);
    // text
    let own = ''; for (const n of e.childNodes) if (n.nodeType === 3) own += n.nodeValue;
    if (own.trim().length && !disabled(e) && cs.webkitTextFillColor !== 'transparent' && cs.backgroundClip !== 'text') {
      const col = parse(cs.color); const o = opacityOf(e);
      if (col && col.a * o > 0) {
        const bgs = compose(e);
        const eff = bgs.map((b) => over({ ...col, a: col.a * o }, b));
        const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight, 10) >= 700;
        const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
        const worst = Math.min(...eff.map((f, i) => ratio(f, bgs[i])));
        if (worst + 0.001 < need) add(e, { path: pathOf(e), op: o, fgN: num(col), bgN: bgs.map(num), sel: sel(e), kind: 'text', ratio: Math.round(worst * 100) / 100, need, fg: `rgb(${Math.round(eff[0].r)},${Math.round(eff[0].g)},${Math.round(eff[0].b)})`, bg: bgs.map((b) => `rgb(${Math.round(b.r)},${Math.round(b.g)},${Math.round(b.b)})`).join(' / '), text: own.trim().slice(0, 40) });
      }
    }
    // inputs: the value text, the placeholder, the boundary
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.tagName) && !['hidden', 'checkbox', 'radio', 'range', 'file'].includes(e.type) && !disabled(e)) {
      const bgs = compose(e);
      if ((e.value || e.tagName === 'SELECT') && !own.trim()) { const col = parse(cs.color); const o = opacityOf(e); push(e, 'field-text', over({ ...col, a: col.a * o }, bgs[0]), bgs, 4.5, e.value || ''); }
      if (e.placeholder) { const ph = parse(getComputedStyle(e, '::placeholder').color); if (ph) push(e, 'placeholder', over({ ...ph, a: ph.a * (parseFloat(getComputedStyle(e, '::placeholder').opacity) || 1) }, bgs[0]), bgs, 4.5, e.placeholder); }
      // the field must be told apart from what is around it: the field itself, or the wrapper that draws its box (up to 3 levels),
      // has to reach 3:1 against what is behind it through its fill or its border
      let best = { r: 0, node: e, border: null };
      for (let n = e, i = 0; n && n !== document.body && i < 4; n = n.parentElement, i++) {
        const ncs = getComputedStyle(n);
        const behind = compose(n.parentElement || document.body);
        const bd = parse(ncs.borderTopColor); const hasBd = bd && parseFloat(ncs.borderTopWidth) >= 1 && ncs.borderTopStyle !== 'none' && bd.a > 0;
        const fl = compose(n); const hasFill = parse(ncs.backgroundColor) && parse(ncs.backgroundColor).a > 0;
        if (!hasBd && !hasFill && n !== e) continue;
        if (!hasBd && !hasFill) continue;
        const viaFill = hasFill ? Math.min(...fl.flatMap((f) => behind.map((p) => ratio(f, p)))) : 0;
        const viaBorder = hasBd ? Math.min(...behind.map((p) => ratio(over(bd, fl[0]), p))) : 0;
        const r = Math.max(viaFill, viaBorder);
        if (r > best.r) best = { r, node: n, border: bd, behind };
        if (r >= 3) break;
      }
      if (best.r + 0.001 < 3) { const n = best.node; const nb = parse(getComputedStyle(n).borderTopColor); add(n, { path: pathOf(n), op: 1, fgN: nb ? num(nb) : [0, 0, 0], bgN: (best.behind || compose(e.parentElement || document.body)).map(num), sel: sel(n), kind: 'field-boundary', ratio: Math.round(best.r * 100) / 100, need: 3, fg: getComputedStyle(n).borderTopColor, bg: getComputedStyle(n).backgroundColor, text: e.id || e.name || '' }); }
    }
    // icons
    if (e.tagName === 'svg') {
      const stroke = cs.stroke !== 'none' ? parse(cs.stroke) : null; const fill = cs.fill !== 'none' ? parse(cs.fill) : null;
      const c = stroke || fill; if (c && c.a > 0 && e.getBoundingClientRect().width >= 8 && !seen.has(e)) { seen.add(e); const bgs = compose(e); push(e, 'icon', over({ ...c, a: c.a * opacityOf(e) }, bgs[0]), bgs, 3, ''); }
    }
  }
  return fails;
};

// A fingerprint of every colour the page paints, element by element (document order): used to prove Dark Mode did not change.
export const fingerprintInPage = (full) => {
  const props = ['color', 'backgroundColor', 'backgroundImage', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'outlineColor', 'opacity', 'boxShadow', 'fill', 'stroke', 'textDecorationColor', 'accentColor', 'caretColor', 'colorScheme'];
  const lines = [];
  for (const e of document.querySelectorAll('html, body, body *')) {
    if (['SCRIPT', 'STYLE'].includes(e.tagName)) continue;
    const cs = getComputedStyle(e);
    lines.push(e.tagName + (e.id ? '#' + e.id : '') + '|' + props.map((p) => cs[p]).join('|'));
    if (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA') lines.push('ph|' + getComputedStyle(e, '::placeholder').color);
  }
  let h = 2166136261; for (const l of lines) for (let i = 0; i < l.length; i++) { h ^= l.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return full ? { hash: h.toString(16), count: lines.length, lines } : { hash: h.toString(16), count: lines.length };
};
