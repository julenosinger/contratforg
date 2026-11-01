# Test Lab and ABI Playground

**ABI Playground (menu 09)** talks to a contract you have published.
- Pick it from "Your deployed contracts" or paste an address and ABI. Reading and events work without a wallet.
- Every value is checked before it is sent (addresses, whole numbers and their size, true/false, lists, tuples, bytes).
- Quick-fill buttons: my wallet, this contract, USDC, EURC, x10^6, x10^18, +30 min / +1 day for deadlines.
- A transaction is dry-run first, so a failure shows its reason before any gas is spent. Mainnet transactions ask for confirmation.
- A call history keeps the arguments, result, decoded events and a link to the explorer.

**Test Lab (menu 18)** runs the contract you just generated on a private simulated chain in the browser. No wallet, network or real funds.
- Five test accounts (Alice, Bob, Carol, Dave, Eve) with test USDC, EURC and native balance.
- Contracts that hard-code the real USDC/EURC address work unchanged: the test tokens are placed at those addresses.
- Constructor arguments are pre-filled with test values (tokens, CCTP stand-ins).
- Move time forward (hour, day, week, month, custom) or mine blocks: useful for vesting, timelocks and streams.
- Each call shows gas, decoded events and the revert reason (custom errors, panics, out of gas, the 24 KB size limit).
- "Quick check" calls every read function that needs no input.
- Limits: it is a simulation. It does not model another chain's special rules (for example Circle's token blocklist), real token behaviour, or other contracts that are not part of the project.

The simulator is `contractforge-deploy/lab-evm.js`, built from `tools/lab-evm` (see its README). Tests: `cd tests && npm test`
(`playground.mjs` needs Foundry's `anvil`; it is skipped without it).
