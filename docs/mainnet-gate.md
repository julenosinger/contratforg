# Mainnet gate (phase 2)

Status as of 2026-11-02. Nothing here is an audit: no template has had an independent audit, and the
generator version is stamped in every contract as `// ContractForge v3.1.0 | maturity: <level> | NOT AUDITED`.

## 1. Maturity of every template

Source of truth: `contractforge-deploy/maturity.js` (`MATURITY`). `tests/maturity.mjs` checks every claim below
against the files in this repository, so a wrong "reviewed" fails the test run.

| Template | Level | Why |
|---|---|---|
| Smart wallet (`smartwallet`) | reviewed | `docs/smart-wallet-review.md` + `SmartWallet.t.sol` with fuzz tests |
| AMM, single pool (`swap-amm-single`) | reviewed | `docs/swap-amm-review.md` + `Gen.t.sol` with fuzz tests. A pool is only as safe as its two tokens |
| Treasury (`treasury`) | reviewed | `docs/generators-review.md` + `Hardening.t.sol` with fuzz tests |
| Vault (`vault`) | reviewed | `docs/generators-review.md` + `Hardening.t.sol` with fuzz tests |
| AMM with factory (`swap-amm-factory`) | experimental | same pool code as the single pool, but the permissionless factory has no fuzz or invariant tests of its own |
| Order book (`swap-orderbook`) | experimental | unit tests only |
| DAO (`dao`) | experimental | reviewed, but its Foundry suite has no fuzz or invariant tests; governance has known limits (guardian cancel, no vote escrow) |
| Staking (`staking`), Escrow (`escrow`), Vesting (`vesting`), Subscription (`paywall`), NFT (`erc721`), MultiSend (`multisend`) | experimental | second-pass review and unit tests; no fuzz or invariant tests |
| ERC-20 (`erc20`) | experimental | no review document of its own, no dedicated suite |
| CCTP V1 form (`crosschain`) | experimental | no review document, no dedicated suite |
| CCTP V2 bridge helper (`bridge`) | experimental | unit tests only, no review document |
| AI-written (`ai`) | experimental | always. The model's text is untrusted |
| Loaded from a link, a saved session or any unknown source (`imported`) | experimental | the origin cannot be checked |

No template is `audited`.

### Rule

A template is `reviewed` only if all three hold, and the test run verifies the first two:

1. a review document for it exists in `docs/`;
2. a dedicated Foundry suite in `tests/solidity/test/` exists **and** contains fuzz (`testFuzz*`) or invariant tests;
3. no relevant finding from that review is still open.

Everything else is `experimental`. `audited` needs an independent audit report, and nothing sets it today.

### Promoting a template

1. Add or extend the Foundry suite with fuzz or invariant tests, and make it pass (`npm run test:portable`).
2. Review the generator (a written review in `docs/`), fix what it finds, repeat until nothing relevant is open.
3. In `maturity.js` set `level: 'reviewed'`, `doc` and `suite`. Update the table above and
   `tests/maturity.mjs` (the expected reviewed set). Run `node golden.mjs --update` and check that only the
   stamp line changed.

## 2. What the gate does

Testnets are unchanged. On a mainnet:

- **experimental**: deployment is blocked until the user ticks "I understand this contract has not been reviewed or
  audited and I can lose funds" **and** types `DEPLOY EXPERIMENTAL` (exact, upper case). The usual typed network
  confirmation follows.
- **reviewed**: the usual flow, and the deploy summary shows "Reviewed internally, NOT audited by a third party"
  with a link to the review.
- The same applies to Multi-deploy (one gate for all mainnets selected, and one for the CCTP bridge helper when it
  is deployed with the contract) and to the portable and crosschain modes, because they all end in the same
  deploy function.
- The decision is taken from the **template that produced the contract**, never from text in the code, so a forged
  stamp changes nothing. A contract without a template, with an unknown one, or from the AI is experimental.
- Last line of defence: `deployCompiled` refuses any mainnet send whose exact source and network were not approved.
- Badges (text, an icon and a tooltip, not colour alone) appear on the contract bar, the template cards, the
  wizard and the section titles.

Entry points checked by `tests/ui.mjs`: Compile and deploy, Publish (click and keyboard), Multi-deploy, a saved
session that is reloaded (with and without its template), an AI contract with a forged stamp, a prototype key
as template, and `deployCompiled` called on its own.

## 3. AI proxy (`api/ai.js`, `functions/api/ai.js`)

The browser sends only `{ action, payload }` with `action` in `audit`, `generate`, `tests`. Prompts, model and
`max_tokens` live on the server; any `system`, `model`, `max_tokens` or `messages` from the browser is ignored.
A request needs a same-host `Origin` (a missing one is refused), `Sec-Fetch-Site: same-origin` when the browser
sends it, and `Content-Type: application/json`. The request body is limited to 60,000 characters. Errors are
generic. The shared logic is the same text in both files (checked by `tests/ai-proxy.mjs`).

Environment variables (nothing is configured for you):

| Variable | Where | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | both | required for the AI features; without it the proxy answers 503 |
| `AI_MODEL` | both | optional, default `claude-sonnet-4-6` |
| `AI_RATE_LIMIT_PER_MINUTE`, `AI_RATE_LIMIT_PER_HOUR` | both | optional, default 6 and 40 per IP |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_URL`, `KV_REST_API_TOKEN`) | both | shared counter for the rate limit |
| `AI_RATE_LIMITER` (binding) | Cloudflare | Rate Limiting binding; used first when present |
| `AI_RATE_LIMIT_KV` (KV namespace) | Cloudflare | KV counter (eventually consistent, so approximate) |

**Without any of the storage settings the limit is kept in the memory of each server instance. That is best
effort and weak**: instances do not share it and it resets on a cold start. Configure Redis, KV or the binding
before announcing the app.

The client IP comes from `x-real-ip` (Vercel) and `cf-connecting-ip` (Cloudflare), never from the other
platform's header, so it cannot be spoofed across them.

## 4. Required address fields (no more `0x…dEaD`)

No generator invents an address any more. A missing or wrong value makes the source a **DRAFT**: it is shown, tagged,
and Compile and deploy, Download, Copy, Publish, Test, the Lab and Multi-deploy are off on **every** network until the
reason is fixed. A regex guard for the old placeholders (`dEaD`, `bEEF`, `cAfE`) stays at deploy time on every network.

A value is accepted if it is `0x` plus 40 hex characters, has a valid checksum when the case is mixed, is not the zero
address and is not a placeholder.

| Template | Required |
|---|---|
| Escrow | buyer, seller and arbiter, all different |
| Vesting, Subscription | beneficiary |
| Treasury | signers (at least the threshold, no duplicates) |
| DAO | governance token (single-network mode; a deploy argument when portable) |
| Smart wallet | guardian (cannot be the zero address or the deploying wallet; checked again at deploy) |
| CCTP V1 form | TokenMessenger, MessageTransmitter, USDC when the network has no default |
| Any template with a token | the token, when the network has no default (Robinhood has no USDC) and the mode is not portable |

Fields that are optional but filled in are validated the same way (swap tokens, MultiSend fee owner, bridge fields).

## 5. Daily limit of the smart wallet

The old default of 100 meant 100 ETH on Ethereum. Each network now has `walletDailyDefault` in `NETWORKS`:
USDC 100, ETH 0.1, POL 100, AVAX 2, BNB 0.1. The form shows the selected network's gas token as the unit, follows a
network change until the user types a value, and does not save the value in the session. In portable modes an
untouched limit resolves to each network's own default. On a mainnet the deploy summary lists the limit and needs
its own tick.

## 6. Running the checks

```
cd tests && npm install && npm test          # compile, golden, maturity, ai-proxy, multichain, ui, playground, lab, solc loader
npm run test:swap && npm run test:portable   # Foundry (needs forge)
python3 tests/mutation-check.py              # switches 17 guards off one at a time and expects a failure each time
```

## 7. Fora do escopo / achados

- The CSP still has `unsafe-inline` and `unsafe-eval` (the page still uses inline `onclick`). Not touched.
- The `innerHTML` sweep is not complete; the places fixed earlier are listed in `docs/app-audit.md`. Not touched.
- The gate is client-side. A user who edits `localStorage` or the page can bypass it; it protects against mistakes,
  not against the person at the keyboard.
- The ABI Playground can send transactions to a deployed contract on a mainnet. That is not a deployment, so the
  maturity gate does not apply; it keeps its own confirmation dialog.
- Vercel `x-forwarded-host` is trusted for the Origin comparison; a direct non-browser caller can forge both headers,
  which only the rate limit and the API key's own limits then bound.
- Cloudflare KV counters are not atomic (read-modify-write).
- The swap form still blocks bad tokens with an alert (no source is produced) instead of the DRAFT state.
- CCTP V1 addresses are still typed by hand in single-network mode (the V2 addresses are in the code and were checked
  on the Arc networks).
- Reviewed templates keep the limits stated in their review documents (for example the AMM has no router and
  accepts any token pair).
- DAO and the order book need fuzz or invariant suites before they can be promoted.

## 8. Decisões que precisam da sua validação

1. **Language**: the gate texts are in English, like the rest of the interface; the phrase is `DEPLOY EXPERIMENTAL`.
2. **DAO and AMM-with-factory are experimental.** You listed the AMM and the DAO as examples of reviewed. By the rule
   (fuzz or invariant tests required) the DAO and the factory form do not qualify today; the single pool does.
3. **Default limits** for POL (100), AVAX (2) and BNB (0.1) are my conservative guesses; USDC (100) and ETH (0.1) are yours.
4. **Rate limit numbers**: 6 per minute and 40 per hour per IP.
5. **Experimental also gates the CCTP bridge helper** that Crosschain mode deploys next to a contract.
6. **A draft blocks the Lab and the multi-deploy too**, not only the deploy button.
7. **`GENERATOR_VERSION` is 3.1.0** and is shown in the header.
8. Review links point to `github.com/julenosinger/contratforg/blob/main/docs/`; change `MAT_DOCS_BASE` if the repository moves.
