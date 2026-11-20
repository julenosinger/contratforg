// The Light/Dark toggle lives in the header next to the wallet controls (it used to be in the sidebar "Appearance" block).
// Same engine as before: toggleTheme / initTheme, body.light, localStorage 'cf_theme'. jsdom checks the markup, state, persistence and the
// sidebar; it does NOT measure geometry (theme-toggle-browser.mjs does that in a real browser).
import { loadApp } from './harness.mjs';

let failed = 0, passed = 0;
const ok = (c, label, extra = '') => { if (c) passed++; else { failed++; console.log(`  FAIL  ${label} ${extra}`); } };
const eq = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `got ${JSON.stringify(a)} want ${JSON.stringify(b)}`);

/* 1. markup: one toggle, in the header, none in the sidebar */
{
  const a = loadApp(); const d = a.w.document;
  eq(d.querySelectorAll('#themeBtn').length, 1, 'exactly one #themeBtn in the document');
  eq(d.querySelectorAll('[data-onclick^="toggleTheme"]').length, 1, 'exactly one element runs toggleTheme');
  const b = d.querySelector('#globalBar .walletbar #themeBtn');
  ok(!!b && b.tagName === 'BUTTON' && b.getAttribute('type') === 'button', 'the toggle is a <button type=button> inside the header wallet bar');
  ok(!d.querySelector('.spine #themeBtn') && !/Appearance|Light mode|Dark mode/.test(d.querySelector('.spine').textContent), 'the sidebar has no theme toggle and no Appearance label');
  ok(!!d.querySelector('.spine #resetSavedBtn') && /Reset saved data/.test(d.getElementById('resetSavedBtn').textContent), 'Reset saved data is still in the sidebar');
  eq(b.getAttribute('data-onclick'), 'toggleTheme()', 'the existing handler is reused (CSP-safe data-onclick)');
  ok(!b.hasAttribute('onclick') && !b.hasAttribute('style'), 'no inline handler or style on the toggle');
  eq(b.getAttribute('aria-label'), 'Switch to light mode', 'dark mode: accessible name is Switch to light mode');
  eq([...b.querySelectorAll('svg')].map((s) => s.getAttribute('aria-hidden')), ['true', 'true'], 'both icons are decorative (aria-hidden), the name comes from aria-label');
  eq([...d.querySelector('.walletbar').querySelectorAll('#balanceBadge, #walletStatus, #themeBtn, #connectBtn')].map((e) => e.id), ['walletStatus', 'balanceBadge', 'themeBtn', 'connectBtn'], 'wallet bar still holds status, balance, theme toggle and connect');
  eq(a.pageErrors, [], 'no initialization errors');
}

/* 2. dark -> light -> dark, state, label, storage */
{
  const a = loadApp(); const d = a.w.document; const b = () => d.getElementById('themeBtn');
  ok(!d.body.classList.contains('light'), 'starts dark');
  b().click();
  ok(d.body.classList.contains('light') && a.w.localStorage.getItem('cf_theme') === 'light', 'click: dark -> light, saved as cf_theme=light');
  eq([b().getAttribute('aria-label'), b().getAttribute('title')], ['Switch to dark mode', 'Switch to dark mode'], 'light mode: name and tooltip say Switch to dark mode');
  eq(b().querySelectorAll('svg').length, 2, 'the icons survive a toggle (the label is not rewritten as text)');
  b().click();
  ok(!d.body.classList.contains('light') && a.w.localStorage.getItem('cf_theme') === 'dark', 'click again: light -> dark, saved as cf_theme=dark');
  eq(b().getAttribute('aria-label'), 'Switch to light mode', 'dark mode: name is back to Switch to light mode');
  const keys = []; for (let i = 0; i < a.w.localStorage.length; i++) keys.push(a.w.localStorage.key(i));
  eq(keys.filter((k) => /theme/i.test(k)), ['cf_theme'], 'one storage key for the theme, no competing key');
  eq(a.pageErrors, [], 'no errors while toggling');
}

/* 3. a saved light theme is restored at startup, and Reset saved data does not touch it */
{
  const a = loadApp({ storage: { cf_theme: 'light' } }); const d = a.w.document;
  ok(d.body.classList.contains('light'), 'saved light theme restored on load');
  eq(d.getElementById('themeBtn').getAttribute('aria-label'), 'Switch to dark mode', 'restored light theme: the button offers dark mode');
  ok(a.ev('isDark') === false, 'engine state matches the restored theme');
  a.w.localStorage.setItem('cf_session_v1', JSON.stringify({ x: 1 }));
  try { d.getElementById('resetSavedBtn').click(); } catch (_) { /* jsdom does not implement location.reload */ }
  eq(a.w.localStorage.getItem('cf_session_v1'), null, 'Reset saved data still clears the saved session');
  eq(a.w.localStorage.getItem('cf_theme'), 'light', 'Reset saved data keeps the theme preference, as before');
  eq(a.pageErrors.filter((e) => !/not implemented/i.test(e)), [], 'no initialization errors with a saved theme');
}

/* 4. a missing button must never throw (the engine is tolerant of the DOM) */
{
  const a = loadApp(); const d = a.w.document;
  d.getElementById('themeBtn').remove();
  let err = null; try { a.ev('toggleTheme()'); a.ev('initTheme()'); } catch (e) { err = e; }
  ok(err === null, 'toggleTheme / initTheme do not throw without the button', String(err));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
