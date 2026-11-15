# Phase 9.0: Foundation and audit of the creation tabs

Status: 2026-11-15. No visible change. Starting HEAD `8189648`. This phase prepares the redesign of the other creation tabs
(9.1 and later) without touching any of them. Everything below was read from the code and then confirmed by running the
generators; `tests/creation-tabs-audit.mjs` keeps these facts true.

## What was added

- `contractforge-deploy/builder.js` (new, loaded before `app.js`): the shared, read-only engine behind a builder screen
  (`CFBuilder`). A screen registers one config and the engine keeps its summary, its four progress steps, its three header
  steps and the head of its code panel in step with real state. It never writes a field, never calls a generator, never
  compiles or deploys, never assigns the deploy buffer, never writes markup from a string (no `innerHTML`) and uses no `eval`.
  Its only memory is two attributes on the code panel (`data-sig`, `data-gen-at`).
- Swap / AMM now runs on the engine: its code is one config (`SWB_CONFIG`) plus its own fields and wording. Its output is
  identical (the 176 checks of `swap-builder-ui.mjs` pass unchanged).
- `multichain.js`: one line. When the mode changes, every registered screen is redrawn (`CFBuilder.renderAll()`), where it
  used to redraw only Swap.
- `tests/builder-core.mjs` (59 checks): the engine on synthetic screens. `tests/creation-tabs-audit.mjs` (222 checks): the
  audit below as an executable contract.
- `tests/harness.mjs` loads `builder.js`, and `index.html` has its script tag.

The engine is deliberately not wired to any other tab yet.

## Config of a screen

| Field | Meaning |
|---|---|
| `key`, `prefix` | Name of the screen and the CSS class prefix of the elements the engine creates (`swb` gives `swb-row`, `swb-flag`, `swb-mark`, `swb-t`, `swb-lang`, `swb-warn`). |
| `section`, `codePanel`, `summary`, `progress`, `stages` | Ids of the screen's elements. |
| `isTemplate(tpl)` | Which `pendingSource.template` values this screen produces. |
| `read()` | The screen's values. The screen owns how it reads its form. |
| `problems(v)` | What is wrong with the configuration right now. |
| `signature(v)` | Everything that changes the generated code (form, network, mode). |
| `summaryRows(v, row)` | The summary lines, one `row(label, value, state, flag, mono)` call each. |
| `guidance(v)` | Optional. The screen updates its own hints. |
| `texts` | Optional. Replaces the wording of any step (`configDone`, `configIssue`, `genTodo`, `genDone`, `genStaleForm`, `genStaleBuf`, `reviewLocked`, `reviewTodo`, `depDone`, `depTodo`). |

What the engine reports, from real state only:

- Configuration: done when `problems` is empty.
- Code Generation: done only when the panel holds code, that code is exactly what is in the deploy buffer under one of the
  screen's templates, and the signature recorded at generation still matches. Otherwise `stale` (form or network changed, or
  another contract took the buffer).
- Review & Audit: never done. The app does not record which source an audit or a test run covered, so no success can be shown.
- Deployment: done only when the deploy history has an entry written after this generation with the name of the contract in
  the buffer. The history is written after `contract.deployed()` resolves.

## The audit

### Common to every tab

- Each tab has a section `sec-<tab>`, a form with fixed ids, a `gen…()` function on the first button, `deployFromBuffer('<tab>')`
  on the second, and a code panel filled by `showCode(panelId, file, code)` (the shared panel: `.codehead` + `pre`).
- `pendingSource = { name, code, template, problems? }` is the deploy buffer. `template` decides the maturity label
  (`matInfo`). `pendingCtorArgs` feeds the constructor panel of the deploy page.
- Phase 8.4: each tab head has one Deployment Mode control (`.dm-mount`). The mode changes the generated contract in some tabs
  and not in others (see the matrix).
- `UI_ADV_STATIC` and `UI_ADV_SIMPLE` (ui.js) fold the rarely changed fields into a collapsible block; a tab may author its own
  `<details class="adv">` (Swap does) and the script then leaves it alone.

### Two ways of handling a bad form (the most important difference)

- **Draft**: the generator still writes the code and records `pendingSource.problems`. The deploy page is blocked
  (`reqBlockReason()` returns "Draft: …", and the deploy, download and copy buttons are disabled). Treasury, Multisend,
  Crosschain, and every simple template except the Smart Wallet work this way. Placeholder addresses (`REQ_DRAFT_ADDR`) stand in
  for the missing ones.
- **Refusal**: the generator shows an alert and writes nothing. Swap (fee of 10000 or more, bad or equal tokens, no default
  token), Vault (performance fee above 9999) and the Smart Wallet with an empty guardian.

A redesign must keep both behaviors. A summary for a draft tab shows the draft problems; for a refusing tab it shows what the
alert would say.

### Per tab

| Tab | Fields (ids) | Particularities |
|---|---|---|
| 01 Simple contracts | `simpleGrid` (cards), `simpleForm` (redrawn per template), `simpleCode` | Eight templates: erc20, erc721, escrow, vesting, paywall, dao, smartwallet, staking. Each has its own field set (`s_*`), its own advanced fields, its own maturity. DAO, Smart Wallet and Staking have their own generators (`genSimpleDAO` …) that `genSimple` dispatches to. Escrow/Vesting/Paywall report missing parties as draft problems. In portable modes the number of constructor arguments depends on the template. The Smart Wallet refuses an empty guardian. |
| 02 Swap / AMM | `swap_name`, `swap_tokenA`, `swap_tokenB`, `swap_fee`, `swap_kind`, `swap_multi`, `swapCode` | Three real contracts: AMM single pair, AMM factory (token fields unused), order book (`swap_multi` has no effect; fee in Token B to the deployer). Refuses instead of drafting. In portable modes the tokens become two constructor arguments. |
| 03 Treasury | `tre_name`, `tre_threshold`, `tre_signers` (one per line), `tre_streaming`, `tre_tokens`, `treasuryCode` | Signers are required (draft problem when empty); threshold above the number of signers is a problem. Streaming is optional. In portable modes it gets one constructor argument. |
| 04 Vault (ERC-4626) | `vault_name`, `vault_symbol`, `vault_asset`, `vault_perf`, `vault_strategy`, `vault_cap`, `vaultCode` | Performance fee in bps, refused above 9999. Asset defaults to the network USDC. In portable modes it gets one constructor argument. |
| 05 MultiSend | `ms_name`, `ms_mode`, `ms_max`, `ms_fee`, `ms_owner`, `multisendCode` | Three variants (token, native, both; three golden fixtures). Not affected by portable modes: no constructor arguments in any mode. |
| 06 Crosschain (CCTP) | `cc_name`, `cc_tokenmessenger`, `cc_msgtransmitter`, `cc_usdc`, `cc_mode`, `cc_resume`, `crosschainCode` | The most mode-dependent tab. In single mode it generates `template: 'crosschain'` and needs the CCTP addresses (two draft problems on a network without defaults, such as Arc Testnet). In every portable mode it generates a different contract (`genCrosschainV2`, in `multideploy.js`, `template: 'bridge'`) with three constructor arguments and no draft problems. Its maturity badge follows the mode. |
| 14 Contract Wizard | `wizardSteps`, `wp-0`…`wp-3`, `wz-netbar`, `wizardSummary`, `wz-back`, `wz-next` | Not a generator. Six goals (token, payment, defi, org, bridge, wallet), then a subtype, a network, a summary. `wizardGenerate()` opens the right tab: the five advanced tabs by name, everything else the simple contracts. |

### Matrix: what an empty form produces (checked in all four modes)

`template / problems / constructor arguments`. Portable, Multi-deploy and Crosschain modes give the same results.

| Tab | Single network | Portable, Multi-deploy, Crosschain |
|---|---|---|
| Treasury | treasury / 1 / 0 | treasury / 1 / 1 |
| Vault | vault / 0 / 0 | vault / 0 / 1 |
| MultiSend | multisend / 0 / 0 | multisend / 0 / 0 |
| Crosschain | crosschain / 2 / 0 | bridge / 0 / 3 |
| ERC-20 | erc20 / 0 / 0 | erc20 / 0 / 0 |
| ERC-721 | erc721 / 0 / 0 | erc721 / 0 / 1 |
| Escrow | escrow / 3 / 0 | escrow / 3 / 1 |
| Vesting | vesting / 1 / 0 | vesting / 1 / 1 |
| Paywall | paywall / 1 / 0 | paywall / 1 / 1 |
| DAO | dao / 1 / 0 | dao / 0 / 2 |
| Smart Wallet | refused | refused |
| Staking | staking / 0 / 0 | staking / 0 / 1 |
| Swap / AMM | swap-amm-single / none / 0 | swap-amm-single / none / 2 |

Golden fixtures (`tests/golden/<net>/`) exist for every generator family and keep the Solidity byte for byte.

## Rules for phases 9.1 and later

1. A tab gets an engine config and its own markup/CSS scoped to its section. No generator, id, handler, template or storage key changes.
2. The summary mirrors the tab's real checks (draft problems for draft tabs, the refusal conditions for refusing tabs), read-only.
3. A tab never shows a success it cannot prove. Review & Audit stays "not audited" until the app records what an audit covered
   (a separate, deliberate change, not part of a layout phase).
4. `tests/creation-tabs-audit.mjs` and the tab's golden fixtures pass unchanged before and after.
5. Browser tests for the tab are written with the tab; they need Chromium, which this sandbox cannot start, so they are reported as NOT EXECUTED here.

## Not changed

Generators, the compiler, wallet and network code, Multi-deploy, maturity and security gates, the deploy page, the AI tab,
storage formats, and every id and handler of every tab.
