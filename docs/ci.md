# CI and repository hygiene (phase 3)

Status as of 2026-11-04 (updated in phase 4; the first version was written on 2026-11-02). The workflows were checked with actionlint 1.7.7 and every step was run by hand in a fresh
clone, but **they have not run on GitHub yet**: the first real run happens when this branch is pushed.

## 1. Workflows (`ci/workflows/`, to be installed in `.github/workflows/`)

**The files are in `ci/workflows/` because Arc Studio cannot push to `.github/workflows/`** (GitHub rejects it). Until you copy them to `.github/workflows/` (instructions in `ci/README.md`), nothing runs on GitHub. After copying, keep the two copies in step or delete `ci/`.

| Workflow | When | What it does |
|---|---|---|
| `ci.yml` job **node** | push to `main`, every pull request | `npm ci` + `npm test` in `tests/` (compile every generator in every multichain mode, golden files, maturity table, AI proxy, multichain, UI, ABI playground against `anvil`, Test Lab, compiler loader, zip). `REQUIRE_ANVIL=1` is set for this step, so a missing `anvil` fails the playground tests instead of skipping them (phase 4; this is a change in `ci/workflows/ci.yml` that must be copied to `.github/workflows/`). Then `golden.mjs --update` followed by `git diff --exit-code -- golden`: it fails when a generator changed and the golden files were not updated. Builds the Cloudflare zip and uploads it as an artifact |
| `ci.yml` job **forge** | same | Foundry `v1.7.1`: `npm run test:swap` and `npm run test:portable` (each regenerates every Solidity source first, then runs the whole Foundry suite, fuzz included). The result line goes to the job summary |
| `ci.yml` job **slither** | same | Slither on every distinct generated contract (see section 3). Reports are an artifact; the job fails on an untriaged High or Medium finding |
| `ci.yml` job **actionlint** | same | actionlint 1.7.7 over the workflows, binary checked against its published sha256 |
| `mutation.yml` | manual and Mondays 05:23 UTC | `python3 tests/mutation-check.py`: switches 17 guards off one at a time; exits 1 when one is not detected (`--self-test` proves that) |
| `release.yml` | a pushed tag `v*` | builds the zip and attaches it with its `.sha256` to a release, using the workflow's own `GITHUB_TOKEN` (the only job with `contents: write`) |

Common to all: `permissions: contents: read` at the top, `concurrency` with cancellation of older runs of the same ref
(`ci.yml`), `defaults.run.shell: bash` (so `cmd | tee log` fails when `cmd` fails), a timeout on every job, `ubuntu-24.04`,
`persist-credentials: false` on checkout. **No secret is used or needed**, `pull_request_target` is not used, and
`ANTHROPIC_API_KEY` is not available to any job (the tests call the AI proxy only with a mocked `fetch`).

Measured in a fresh clone (this sandbox, so a hosted runner will differ): `npm ci` 2 s; `compile-generators` 144 s,
`lab` 30 s, `ui` 9 s, `multichain` 9 s, `playground` 6 s, the rest under 2 s each, whole `npm test` about 200 s;
Foundry about 3 s once solc is cached; Slither 31 s for 35 files; the Slither job also installs Python packages.

## 2. Pinned versions, and why

| What | Pin | Why / how to update |
|---|---|---|
| Node | `24.22.1` (`NODE_VERSION` in the workflows) | what the tests were written and run with; jsdom 26 and `zlib.crc32` (used by the zip script) need a recent Node. Change the env value and re-run `npm test` |
| Foundry | `v1.7.1` (`FOUNDRY_VERSION`) | not `nightly` or `latest`, so a new Foundry release cannot turn the build red by itself. Pick a release from github.com/foundry-rs/foundry/releases, change the env value, run `npm run test:portable` |
| solc for Foundry | `0.8.28` (`tests/solidity/foundry.toml`) | the suite has always compiled with 0.8.28 (the dump scripts relax the exact `0.8.24` pragma to `^0.8.24`). `offline = true` in that file is for the sandbox, so CI sets `FOUNDRY_OFFLINE=false` |
| solc for Slither | `0.8.24` via `solc-select` | the version the browser compiles with, and the one the generated pragma names |
| Slither | `slither-analyzer==0.11.6` | detector sets change between releases. To update: bump `SLITHER_VERSION`, run `node tests/slither-check.mjs`, and triage or remove entries |
| solc-select | `1.2.0` | |
| Python | `3.12` | only used to install Slither (minor version floats inside 3.12) |
| npm packages | `tests/package-lock.json` (`npm ci`) | Dependabot proposes updates weekly |
| Actions | commit SHAs, below | |

Third-party actions are pinned by commit SHA with the version in a comment. Each SHA was read from the GitHub API
(`/repos/<owner>/<repo>/commits/<tag>`) on 2026-11-02:

| Action | Version | SHA |
|---|---|---|
| actions/checkout | v4.2.2 | `11bd71901bbe5b1630ceea73d27597364c9af683` |
| actions/setup-node | v4.4.0 | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| actions/setup-python | v5.6.0 | `a26af69be951a213d495a4c3e4e4022e16d87065` |
| actions/upload-artifact | v4.6.2 | `ea165f8d65b6e75b540449e92b4886f43607fa02` |
| foundry-rs/foundry-toolchain | v1.4.0 | `82dee4ba654bd2146511f85f0d013af94670c4de` |

Dependabot (`.github/dependabot.yml`) updates the npm packages in `tests/` and the actions, weekly. It cannot update
the versions kept as `env:` values (Node, Foundry, Slither, solc-select); those are manual. The pip packages that
Slither itself depends on are not pinned or hash-checked (only Slither and solc-select are).

## 3. Slither

`node tests/slither-check.mjs` (what the CI job runs):

1. runs `dump-portable-sources.mjs`, then collects `tests/golden/*/*.sol` (Arc Mainnet first, then the other three
   networks) and `tests/solidity/src/portable/*.sol` (portable mode);
2. drops files that are identical once the network label is ignored: **85 sources, 35 distinct**; Arc Mainnet and
   portable are always among the analysed ones;
3. runs Slither on each one and writes `tests/slither-out/` (one JSON report per contract and a `summary.json`);
4. applies `.github/slither-triage.json` and **fails on any High or Medium finding that is not triaged**. Low,
   Informational and Optimization findings are only reported.

A triage entry needs the detector, the contract (and usually the function), a written reason of its own (20+
characters) and the review document when one exists; the script refuses entries without them, with a missing
document, or with contract `*` unless `generic: true` is set with a justification. There are no generic entries today.
Entries that match nothing are reported so they can be removed.

**First run** (Slither 0.11.6, solc 0.8.24, across the 35 distinct files):

| Severity | Findings | Triaged | Not triaged |
|---|---|---|---|
| High | 20 | 20 | 0 |
| Medium | 27 | 27 | 0 |
| Low | 114 | reported only | |
| Informational | 51 | reported only | |
| Optimization | 105 | reported only | |

Those 47 High/Medium findings were 24 distinct (detector, contract, function) cases, covered by 24 triage entries (23 since phase 4):
`arbitrary-send-eth` in the smart wallet (the wallet's purpose) and in MultiSend (the caller's own `msg.value`),
`arbitrary-send-erc20` in the escrow (`fund` requires `msg.sender == buyer`), `reentrancy-balance` and
`incorrect-equality` in the AMM, pair, order book and vault (balance reads that reject fee-on-transfer tokens, behind
`nonReentrant`), `divide-before-multiply` (rounding that favours the pool or the maker), `incorrect-equality` on
`ret.length == 0` (tokens that return nothing) and `reentrancy-no-eth` in staking (guarded). One entry was **not** a
false positive (`ArcOriginals.mint`); it was fixed in phase 4 and the entry removed.

**After phase 4** (2026-11-04, 37 distinct files from 87 sources): High 20 (20 triaged), Medium 23 (23 triaged), Low 98, Informational 51, Optimization 115; 23 triage entries, none stale, no new High or Medium finding. The three weakest reasons were rewritten to state their assumptions (`docs/phase4.md`).

To add an entry, run the check, read the finding, decide whether it is real, and write why it is not (or link the
issue). To see the Low and Informational findings: `node -e "…"` over `tests/slither-out/summary.json`, or open the
artifact of the CI run.

## 4. The rest of the repository

- **`contracts/` was removed.** Nothing read it (grep over the repository: scripts, docs, tests, deploy configuration).
  It held 15 hand-copied generator outputs that could drift from the golden files. `/contracts/` is git-ignored now.
  The single source of truth is `tests/golden/` (checked by `golden.mjs` and by the CI golden step); Slither and
  Foundry regenerate what they need.
- **`contractforge-cloudflare.zip` is no longer versioned.** It was a committed binary that had fallen behind the code
  (no `maturity.js`, no `required.js`). `npm run build:zip` (in `tests/`; the script is `scripts/build-zip.mjs`)
  writes `dist/contractforge-cloudflare.zip` and a `.sha256`; the build is reproducible and `tests/zip.mjs` checks its
  contents. CI uploads it as an artifact, and `release.yml` attaches it to a `v*` tag. History is not rewritten: old
  commits still contain the old zip.
- **Golden check**: see the `node` job. If it fails, run `node golden.mjs --update` in `tests/`, review the diff,
  commit.
- **Clean-machine check**: `tests/package.json`'s Foundry scripts now regenerate every source first
  (`npm run dump`). Before that, `npm run test:swap` only passed where earlier runs had left other files behind; a fresh
  clone exposed it.

## 5. Branch protection to enable by hand

These cannot be set from a file. In *Settings → Branches → Branch protection rule* for `main`:

- Require a pull request before merging.
- Require status checks to pass: **node**, **forge**, **slither** (and **actionlint**), and require branches to be up to date.
- Block force pushes and deletions of `main`.
- Optionally require linear history and conversation resolution.

Also: *Settings → Code security*: enable **Private vulnerability reporting** (SECURITY.md relies on it), Dependabot
alerts and Dependabot security updates. Set *Actions → General → Workflow permissions* to read-only by default.

## 6. Achados do CI

Found while building this phase. Nothing below was fixed (generator logic is out of scope here); each item is triaged
with a pointer to this section.

1. **FIXED in phase 4 (2026-11-04), was Medium/Low, `ArcOriginals.mint` (NFT)**: the USDC payment (`transferFrom`) happens before `totalSupply` and the owner are
   updated, and the function has no reentrancy guard. A payment token that calls back could mint past `MAX_SUPPLY`. The
   token is chosen at deploy time and USDC has no callbacks, so the exposure is limited to deploying with a hostile token.
   Suggested fix: update `totalSupply`, `_owners` and `_balances` before the payment, or add `nonReentrant`. (Slither
   `reentrancy-no-eth`; the template stays `experimental`.)
2. **FIXED in phase 4 for the three setters named here; two more setters found, Low and still open (`setBaseURI` of the NFT, `setBeneficiary` of the subscription): missing events**: `ArcSubscription.setPrice`, `ArcOriginals.setMintPrice` and `ArcYieldVault.setDepositCap` change
   privileged parameters without emitting an event (Slither `events-maths`). Monitoring cannot see the change.
   Suggested fix: emit an event in each setter.
3. **Test plumbing**: `npm run test:swap` could not run on a clean checkout (it only wrote the swap sources, while the
   tests also import the portable ones). Fixed in the test scripts, not in a generator.
4. **Reported only, by design**: `calls-loop` (MultiSend payments, DAO `execute`, wallet `_call`), `timestamp` (deadlines,
   vesting, recovery delay), `return-bomb` in `multiSendNative` (gas-capped and tested), `reentrancy-benign` and
   `reentrancy-events` (events after external calls), `missing-zero-check` in the treasury constructor (the gas-token alias may
   legitimately be zero).

No other new High or Medium issue appeared: the other 23 triaged cases match what the review documents already say.

## 7. Decisões que precisam da minha validação

1. **Licença**: `LICENSE` is MIT, 2026, holder `julenosinger` (the GitHub owner in the repository URL and the one non-tool
   commit author; the other 33 commits are authored by the "Arc Studio" tool). The generated contracts already carry
   `SPDX-License-Identifier: MIT`. The choice of licence and holder is yours.
2. **Versions** (section 2): Node 24.22.1, Foundry v1.7.1, Slither 0.11.6, solc-select 1.2.0, solc 0.8.24 for Slither and
   0.8.28 for Foundry, Python 3.12, runner `ubuntu-24.04`.
3. **Action SHAs**: all five were confirmed through the GitHub API; none is pending. The actionlint download is checked
   against a sha256 I computed from the release asset and that matches the published checksums file.
4. **Triage**: 23 entries since phase 4 (the entry for `ArcOriginals.mint` was removed when it was fixed). Three reasons name a weak assumption (smart wallet denylist, rounding in `addLiquidity`, `fillOrder` evidence).
   Review the reasons in `.github/slither-triage.json`.
5. **Zip layout**: the script puts `index.html` at the root and `functions/` beside it, and leaves out `wrangler.toml`. The
   old zip had a wrapping `contractforge-deploy/` folder. I chose the layout a Pages direct upload needs; I did not test an
   upload to Cloudflare, and I am not sure the dashboard runs `functions/` from a direct upload (Git or Wrangler do).
6. **`/contracts/` is git-ignored** (Arc Studio and Foundry use that folder as scratch space), so nobody commits copies there
   by accident.
7. **Release via `gh`** with the workflow token instead of a third-party release action: fewer dependencies, but release
   notes are a fixed paragraph.
8. **Mutation check** runs weekly and on demand, not on pushes; it takes a while and edits files (it restores them with
   `git checkout`).
9. **Slither coverage**: 35 distinct files from the golden set (four networks) and the portable set. The cross-mode bridge
   and other variants that only appear under special form values are not analysed.
10. **Where the workflows live**: `ci/workflows/`, because the Arc Studio push is refused for `.github/workflows/`. Installing them is a manual step (`ci/README.md`). To do it from the GitHub web UI no token is needed. The rejected push also made me rewrite the nine unpushed commits (never published) so that none of them touches `.github/workflows/`.
11. **Not verified**: the workflows on GitHub's runners (first push), `foundry-toolchain`'s `version` input format with `v1.7.1`
    (it matches the release tag; the local binary is 1.7.1), `solc-select install 0.8.24` from a clean runner, and
    Dependabot. The same commands were run locally in a fresh clone, with a locally downloaded solc 0.8.24 in place of solc-select.
