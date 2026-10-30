# Multichain modes

A selector in the left sidebar ("Multichain mode") chooses how contracts are generated and deployed. It is saved in the browser.

| Mode | What it does |
| --- | --- |
| Single network (default) | Exactly the previous behaviour. Output is unchanged. |
| Portable | The Solidity is the same on every chain. Token and protocol addresses are no longer written into the code. They become constructor arguments, shown in "Constructor arguments" on the Compile and Deploy page, with the selected network's value filled in. |
| Multi-deploy | Portable, plus a panel to pick several networks. The contract is compiled once, then for each network your wallet is switched, that network's addresses are filled in (editable in a table), and it is deployed. |
| Crosschain | Multi-deploy, plus an option to deploy a Circle CCTP V2 USDC bridge on each chain that supports it. Section 06 (Crosschain payments) generates the V2 bridge in this mode. |

## What changes in the contract (portable modes)

- Token addresses (USDC, EURC, staking and reward tokens, vault asset, NFT payment token, AMM and order book pair) are constructor arguments. The constructor checks they are contracts.
- Amounts written as "100" tokens use the token's own `decimals()` instead of assuming 6 (matters for 18-decimal USDC on some chains).
- Smart wallet: the EntryPoint address and the daily limit (in the native token's smallest unit) are constructor arguments.
- DAO: the governance token and the voting period (in blocks, which differ per chain) are constructor arguments.
- CCTP bridge: Circle CCTP V2 (TokenMessengerV2 and MessageTransmitterV2). The old V1 form is only used in single mode.

## Things to know

- A value you type into a generator form (for example a custom token) applies to the network you generated for. Other networks get their own default, or stay empty and must be filled in.
- Networks without a known default (for example Robinhood and BNB for USDC) leave the field empty; deployment on that network fails with a clear message until you fill it.
- The ERC-4337 EntryPoint default (v0.6) is the same on every network, but check it exists on the chain you deploy to.
- Block time differs per chain, so check the DAO voting period for each network.
- CCTP V2 addresses come from developers.circle.com (contract addresses page). Arc (domain 26), Ethereum, Avalanche, OP, Arbitrum, Base and Polygon, plus their testnets, are included.
- Mainnet deployments still ask for confirmation for every network and use real funds.

## Tests

`cd tests && npm install && npm test` compiles every generator in every mode on four networks, checks that portable source is identical across networks and has no network addresses, compares single mode with `tests/golden`, and runs the multichain behaviour tests. `npm run test:portable` and `npm run test:swap` run the Foundry tests (need Foundry).
