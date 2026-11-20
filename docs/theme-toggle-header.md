# Theme toggle in the header

The Light/Dark toggle moved from the sidebar ("Appearance" block) to the global header (`#globalBar .walletbar`), between the wallet status and Connect Wallet.

- Same engine: `toggleTheme()` / `initTheme()` in `app.js`, `body.light`, `localStorage` key `cf_theme`. No second state, no new key.
- The button keeps `id="themeBtn"` and the CSP-safe `data-onclick="toggleTheme()"`. It shows the icon of the mode it switches to (sun in dark mode, moon in light mode; chosen by CSS from the `.light` class) and its `aria-label` / `title` say "Switch to light mode" or "Switch to dark mode".
- The sidebar keeps **Reset saved data** (`#resetSavedBtn`); only the theme button and the "Appearance" label were removed. Reset still clears only the saved session (`cf_session_v1`), so the theme preference survives it, as before.
- Header width: the wallet region's fixed width grows from 430px to 476px at viewports of 1240px and wider (below that the 36px button takes its space from the balance badge and wallet status, which already truncate with an ellipsis, so the header wraps exactly where it did before). On phones (640px and below) the button is 44px and sits on the second wallet row.

Tests: `tests/theme-toggle-ui.mjs` (jsdom: markup, state, persistence, sidebar) and `tests/theme-toggle-browser.mjs` (Chromium: 9 viewports from 1920px to 320px, connected and disconnected, both themes, overlap, overflow, tap size, keyboard, reload). `tests/theme-toggle-browser.mjs` is wired into `ci/workflows/ci.yml`; copy that change to `.github/workflows/ci.yml` (see `ci/README.md`).
