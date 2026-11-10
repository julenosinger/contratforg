// The page under the real Content-Security-Policy, in a real browser (Chromium through playwright): no violation, no console error, and the
// main flow works with the policy in force: navigate with the data-on* handlers, switch to Arc Mainnet, generate an escrow, pass the experimental
// gate, compile it with solc (WebAssembly in a worker), reach the mainnet deploy summary, then compile and run it in the Test Lab (WebAssembly + the EVM bundle).
//   CHROME=/path/to/chrome node csp-browser.mjs        (otherwise playwright's own browser is used)
// Without a usable browser it prints a notice and exits 0, unless REQUIRE_BROWSER=1.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(here, '../contractforge-deploy');
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) pass++; else { fail++; console.log('FAIL', m, d || ''); } };
const skip = (why) => { if (process.env.REQUIRE_BROWSER === '1') { console.error('FAIL: ' + why + ' (REQUIRE_BROWSER=1)'); process.exit(1); } console.log('NOT tested in a real browser: ' + why); process.exit(0); };

let chromium;
try { ({ chromium } = await import('playwright')); } catch (_) { skip('playwright is not installed'); }

/* the page, served with the headers of _headers (the policy the host would send) */
const headers = {};
{
  let cur = false;
  for (const l of fs.readFileSync(path.join(dir, '_headers'), 'utf8').split('\n')) {
    if (l.startsWith('/')) { cur = l.trim() === '/*'; continue; }
    const m = l.match(/^\s+([A-Za-z-]+):\s*(.*)$/); if (cur && m) headers[m[1]] = m[2];
  }
}
if (process.env.CSP_OVERRIDE) headers['Content-Security-Policy'] = process.env.CSP_OVERRIDE;   // for checking that the test notices a weaker or a stricter policy
ok(!!headers['Content-Security-Policy'], 'the policy was read from _headers');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const u = req.url.split('?')[0]; const f = path.join(dir, u === '/' ? 'index.html' : u);
  if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { ...headers, 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = 'http://127.0.0.1:' + server.address().port;

let browser;
try { browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] }); } catch (e) { server.close(); skip('no Chromium could be started (' + String(e.message).split('\n')[0].slice(0, 100) + ')'); }
const ctx = await browser.newContext();
const page = await ctx.newPage();
const violations = [], errors = [];
await page.addInitScript(() => {
  window.__csp = [];
  document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI + ' ' + (e.sample || '')));
  // a minimal EIP-1193 wallet on Arc Mainnet (chain 5042), no signing needed for the steps below
  const chain = '0x13b2', acct = '0x00000000000000000000000000000000000a11ce';
  window.ethereum = {
    isMetaMask: true, on() {}, removeListener() {},
    async request({ method, params }) {
      switch (method) {
        case 'eth_requestAccounts': case 'eth_accounts': return [acct];
        case 'eth_chainId': return chain; case 'net_version': return '5042';
        case 'wallet_switchEthereumChain': case 'wallet_addEthereumChain': return null;
        case 'eth_getBalance': return '0x56bc75e2d63100000';
        case 'eth_blockNumber': return '0x10'; case 'eth_gasPrice': return '0x3b9aca00';
        default: throw Object.assign(new Error('unsupported in the test wallet: ' + method), { code: -32601 });
      }
    },
  };
});
page.on('console', (m) => { if (m.type() === 'error' || /Content Security Policy|Refused to/.test(m.text())) errors.push(m.type() + ': ' + m.text().slice(0, 200)); });
page.on('dialog', async (d) => { errors.push('dialog: ' + d.message().slice(0, 160)); await d.dismiss(); });
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 200)));

const until = async (fn, arg, ms = 10000) => { const t = Date.now(); for (;;) { if (await page.evaluate(fn, arg)) return; if (Date.now() - t > ms) throw new Error('timeout waiting for ' + String(fn).slice(0, 80)); await new Promise((r) => setTimeout(r, 150)); } };
const step = async (label, fn) => { try { await fn(); ok(true, label); } catch (e) { ok(false, label, String(e.message).replace(/\s+/g, ' ').slice(0, 480)); } };
try {
  await step('the page loads and shows the home page', async () => {
    await page.goto(origin + '/', { waitUntil: 'load' });
    await page.waitForSelector('#sec-home', { state: 'visible', timeout: 15000 });
  });
  await step('handlers work: the menu opens the first section', async () => {
    await page.click('.nav-item[data-section="simple"]');
    await page.waitForSelector('#sec-simple', { state: 'visible', timeout: 5000 });
  });
  await step('connect the wallet', async () => { await page.click('#connectBtn'); await until(() => /Connected/.test(document.getElementById('connectBtn').textContent), null, 10000); });
  await step('switch to Arc Mainnet through the in-app dialog', async () => {
    await page.evaluate(() => { netFilter = 'mainnet'; toggleNetPanel(true); });
    await page.click('#netbar .netbtn:has-text("Arc Mainnet")');
    await page.waitForSelector('#switchConfirm', { timeout: 5000 });
    await page.click('#scOk, #switchConfirm .dc-ok, #switchConfirm button:last-of-type');
    await until(() => activeNetwork === 'arcMain', null, 5000);
    await page.evaluate(() => toggleNetPanel(false));
  });
  await step('generate an escrow', async () => {
    await page.click('.nav-item[data-section="simple"]');
    await page.click('#simpleGrid .tcard[data-id="escrow"]');
    await page.waitForSelector('#s_buyer', { state: 'attached', timeout: 5000 });
    await page.fill('#s_buyer', '0x1111111111111111111111111111111111111111');
    await page.fill('#s_seller', '0x2222222222222222222222222222222222222222');
    await page.fill('#s_arbiter', '0x3333333333333333333333333333333333333333');
    await page.click('button[data-onclick="genSimple(\'escrow\')"]');
    await until(() => pendingSource && pendingSource.code && pendingSource.name, null, 5000);
  });
  await step('compile and deploy: the experimental gate, then solc in a worker, then the mainnet summary', async () => {
    await page.click('.nav-item[data-section="deploy"]');
    await page.click('#btnCompileDeploy');
    await page.waitForSelector('#experimentalGate', { timeout: 10000 });
    await page.check('#egBox'); await page.fill('#egInput', 'DEPLOY EXPERIMENTAL'); await page.click('#egOk');
    await page.waitForSelector('#deployConfirm', { timeout: 120000 });                 // compiled; the summary is showing
    ok(/Arc Mainnet/i.test(await page.textContent('#deployConfirm')), 'the summary names the network');
    await page.click('#dcCancel');
  });
  await step('the Test Lab compiles and runs the contract (WebAssembly, the EVM bundle)', async () => {
    await page.click('.nav-item[data-section="lab"]');
    await page.click('button[data-onclick="labLoadContract()"]');
    await until(() => /Ready|ready|Loaded|loaded/.test(document.getElementById('labStatus').textContent), null, 120000);
  });
} finally {
  const v = await page.evaluate(() => window.__csp).catch(() => []);
  violations.push(...v);
  await browser.close(); server.close();
}
ok(violations.length === 0, 'no Content-Security-Policy violation', violations.slice(0, 5).join(' | '));
const real = errors.filter((e) => !/favicon|Failed to load resource: the server responded with a status of 404/.test(e));
ok(real.length === 0, 'no console error', real.slice(0, 5).join(' | '));
console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
