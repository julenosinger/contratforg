# Phase 11.0 — Generator Integrity & Multichain Safety Audit

Status: 2026-11-16. **Read-only audit + isolated testing + reporting.** Nenhum código de produção foi modificado; nenhuma
transação real foi executada. Este relatório registra o que foi verificado, o que não pôde ser verificado e os achados
(confirmados vs. teóricos), para uma fase corretiva posterior.

## A. Baseline

- **HEAD:** `3846fbe1edeb81b17a62b3af8a0a85da4ef2b470` (branch `main`).
- **Working tree:** limpo no início da auditoria (nenhuma mudança não commitada).
- **Últimos commits:** fase 7.1 ("Ficar verde") — native-solc oracle, compile-foundry-tests, maturidade revertida, chat fix.
- **Comando de teste:** `cd tests && npm ci && npm test` (e `npm run test:swap`/`test:portable` para Foundry, `node slither-check.mjs` para Slither, `python3 tests/mutation-check.py` para mutações).
- **Resultado da linha de base:** `npm test` termina com **exit 0** (contagens na seção F). **NÃO rodei forge** (binário indisponível nesta máquina) nem **slither** — reportados como limitação.

## B. Architecture Map

O app é estático (sem build): `contractforge-deploy/` com `index.html` + um conjunto de `.js` carregados na ordem
`handlers.js → app.js → multichain.js → multideploy.js → maturity.js → required.js → playground.js → lab.js → ui.js → chat-md.js`.

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Seções 1–18 (Home, Simple, Swap, Treasury, Vault, MultiSend, Crosschain, Deploy, Auditor, Playground, History, Gas, Verify, Share, Wizard, AI chat, Analytics, Tests, Lab), top bar (wallet/network/contract bar) |
| `app.js` | Estado global (`NETWORKS`, `activeNetwork`, `pendingSource`, `pendingCtorArgs`, `account/signer/provider`), todos os geradores, compile/deploy, history, verify, share, wizard, AI chat, analytics |
| `handlers.js` | Dispatcher de `data-on*` sem `eval` (CSP sem `unsafe-inline`); só chama funções do app |
| `multichain.js` | Modos (single/portable/multi/cross), `portabilize()`, endereços CCTP V2 + domínios, painel de argumentos do construtor, `coerceCtorValue` |
| `multideploy.js` | `genCrosschainV2` (bridge CCTP V2), multi-deploy (compila uma vez, deploys por rede), painel multi |
| `maturity.js` | Níveis de maturidade, gate de mainnet (`matGate`, `matHash`/`matApprove`), carimbo (`matStamp`) |
| `required.js` | DRAFT (endereços obrigatórios, placeholders `0x…dEaD/bEEF/cAfE`), validação de endereço/checksum |
| `playground.js` / `lab.js` / `lab-evm.js` | ABI Playground e Test Lab (EVM simulado no navegador) |
| `ui.js` | Diálogos (gate experimental, confirmação de mainnet, resumo de deploy), render da UI |
| `chat-md.js` | Renderizador seguro de Markdown para o chat de IA (sem innerHTML) |
| `solc-worker.js` | Compilador auto-hospedado no worker (sha256 verificado contra o manifesto) |

**Estado compartilhado:** `pendingSource { name, code, template, problems, facts, acks, notDeployer }`, `pendingCtorArgs`
(argumentos do construtor por rede), `activeNetwork`, `multichainMode`, `account/signer/provider`, `uiDeployResults`,
histórico de deploy (localStorage), conversas do chat (`cf_ai_chats_v1`).

## C. Generator Matrix

Geradores (todos em `app.js`, exceto o bridge V2 em `multideploy.js`). Maturidade em `maturity.js` (fonte de verdade).

| Template | Variantes | Modo(s) | Redes com requisitos | Compilador | Maturidade | Suíte Foundry |
|---|---|---|---|---|---|---|
| `erc20` | cap, burn, supply, decimals | single/portable/multi/cross | nenhum | 0.8.24 ✓ | experimental* | `Erc20.t.sol` |
| `erc721` (NFT) | supply, price, royalty, baseURI | single/portable | token USDC (se price>0) | 0.8.24 ✓ | reviewed | `Nft.t.sol` |
| `escrow` | buyer/seller/arbiter, timeout | single/portable | token | 0.8.24 ✓ | experimental | `Rest.t.sol` |
| `vesting` | cliff, beneficiary | single/portable | token | 0.8.24 ✓ | experimental | `Rest.t.sol` |
| `paywall` (subscription) | price, period, beneficiary | single/portable | token | 0.8.24 ✓ | experimental* | `Paywall.t.sol` |
| `dao` | quorum, voting period, threshold, timelock | single/portable | token de governança | 0.8.24 ✓ | reviewed | `Dao.t.sol` |
| `smartwallet` | guardian, session keys, daily limit | single/portable | gas token | 0.8.24 ✓ | reviewed | `SmartWallet.t.sol` |
| `staking` | APY, lock, exit fee, reward token | single/portable | staking+reward token | 0.8.24 ✓ | experimental* | `Staking.t.sol` |
| `swap-amm-single` | fee | single/portable | tokenA+tokenB | 0.8.24 ✓ | reviewed | `Gen.t.sol` |
| `swap-amm-factory` | fee | single/portable | tokenA+tokenB | 0.8.24 ✓ | reviewed | `Factory.t.sol` |
| `swap-orderbook` | fee | single/portable | tokenA+tokenB | 0.8.24 ✓ | experimental | `Book` (Rest) |
| `treasury` | threshold, signers, streaming | single/portable | signers | 0.8.24 ✓ | reviewed | `Hardening.t.sol` |
| `vault` | perf fee, cap, asset | single/portable | asset | 0.8.24 ✓ | reviewed | `Hardening.t.sol` |
| `multisend` | erc20/native/both, fee | single/portable | (fee owner opcional) | 0.8.24 ✓ | reviewed | `Multisend.t.sol` |
| `crosschain` (CCTP V1) | payment/escrow/recurring, resume | single | TokenMessenger/MessageTransmitter/USDC | 0.8.24 ✓ | experimental | `Crosschain.t.sol` |
| `bridge` (CCTP V2) | — | portable/multi/cross | TokenMessenger/MessageTransmitter/USDC | 0.8.24 ✓ | experimental | `Crosschain.t.sol` |
| `ai` | chat (gera qualquer um) | single/portable | — | 0.8.24 ✓ | experimental (sempre) | — |
| `imported` | link/sessão/desconhecido | — | — | — | experimental (sempre) | — |

\* `erc20`, `paywall`, `staking` voltaram a `experimental` na fase 7.1 (suíte Foundry escrita mas nunca executada no CI).

Cobertura de testes: `compile-generators.mjs` (compila todos os geradores em todos os modos e redes), `golden.mjs`
(snapshots single-network), `maturity.mjs` (níveis vs. repositório), `ui.mjs` (navegação/gate/chat), `xss.mjs`,
`innerhtml-lint.mjs`, `csp.mjs`, `compile-foundry-tests.mjs` (compila as suítes), `reproducible-bytecode.mjs`,
`native-solc-bytecode.mjs`. **Gap:** a execução real das suítes Foundry (fuzz/invariantes) só acontece no CI.

## D. Multichain Matrix

`NETWORKS` (16 redes) + `CCTP_V2_ADDR`/`CCTP_DOMAINS` (V2). Configurações lidas do código; **não re-verificadas contra
fontes autoritativas nesta auditoria** (marcadas como "não verificado").

| Rede | Chain ID | Gas | gasDec | USDC (dec) | CCTP V1 | CCTP V2 | Explorer API |
|---|---|---|---|---|---|---|---|
| Ethereum | 1 | ETH | 18 | 0xA0b8… (6) | ✓ | dom 0 | ✓ |
| Polygon | 137 | POL | 18 | 0x3c49… (6) | ✓ | dom 7 | ✓ |
| Base | 8453 | ETH | 18 | 0x8335… (6) | ✓ | dom 6 | ✓ |
| Arbitrum One | 42161 | ETH | 18 | 0xaf88… (6) | ✓ | dom 3 | ✓ |
| Optimism | 10 | ETH | 18 | 0x0b2C… (6) | ✓ | dom 2 | ✓ |
| Avalanche C | 43114 | AVAX | 18 | 0xB97E… (6) | ✓ | dom 1 | ✓ |
| BNB Chain | 56 | BNB | 18 | 0x8AC7… (**18**) | — | — | ✓ |
| Robinhood Mainnet | 46623 | ETH | 18 | — | — | — | — |
| Arc Mainnet | 5042 | **USDC** | 18 | 0x3600… (6) | — | dom 26 | — |
| Arc Testnet | 5042002 | **USDC** | 18 | 0x3600… (6) | — | dom 26 | — |
| Robinhood Testnet | 46630 | ETH | 18 | — | — | — | — |
| Sepolia | 11155111 | ETH | 18 | 0x1c7D… (6) | ✓ | dom 0 | ✓ |
| Amoy | 80002 | POL | 18 | 0x41E9… (6) | ✓ | dom 7 | ✓ |
| Base Sepolia | 84532 | ETH | 18 | 0x036C… (6) | ✓ | dom 6 | ✓ |
| Arbitrum Sepolia | 421614 | ETH | 18 | 0x75fa… (6) | ✓ | dom 3 | ✓ |
| Optimism Sepolia | 11155420 | ETH | 18 | 0x5fd8… (6) | ✓ | dom 2 | ✓ |

Notas: CCTP V1 usa `NETWORKS[net].cctp` (vazio em BNB/Robinhood/Arc); CCTP V2 usa `CCTP_V2_ADDR` (mainnet/testnet) +
`CCTP_DOMAINS` (Arc=26 presente). Robinhood sem USDC/explorer/CCTP. Explorer API vazio em Arc e Robinhood (sem
"Verify on Explorer").

## E. Findings

Severidade: P0 crítico / P1 alto / P2 médio / P3 baixo. "Confirmado" = reproduzido ou evidente no código; "Teórico" = risco
hipotético não demonstrado.

### E1. Vault: `depositCap` assume 6 decimais (P2, confirmado)
- **Arquivo/função:** `contractforge-deploy/app.js` `genVault()` (linha ~2017) — `depositCap = ${cap} * 10**6`.
- **Reprodução:** gere um vault com asset de 18 decimais (não-USDC) em modo single; o cap fica 10^12× menor que o digitado.
- **Esperado vs. real:** o cap deveria respeitar os decimais do asset; o modo portable corrige (usa `IERC20.decimals()`), o single não.
- **Impacto:** cap errado (mais restritivo ou, se interpretado errado, overflow de depósito). Sem perda direta.
- **Correção sugerida:** usar o padrão `scaled` também no single, ou validar que o asset é 6 decimais.
- **Regressão:** baixa (mudança isolada no gerador). **Confiança:** alta.

### E2. Vault: "ERC-4626-style", não ERC-4626 completo (P2, confirmado)
- **Arquivo:** `genVault()` (título diz "ERC-4626-style" — honesto).
- **Falta:** `mint`, `withdraw`, `preview*`, `max*`, eventos `Deposit`/`Withdraw` com a assinatura padrão ERC-4626, e as
  shares **não são transferíveis** (desvio documentado).
- **Divergência de aritmética:** `convertToShares`/`convertToAssets` usam `totalAssets() + 1` (não-padrão) para evitar
  divisão por zero; o offset virtual `SHARE_OFFSET=1e12` mitiga a primeira-deposit inflation.
- **Impacto:** não é drop-in ERC-4626 (quem espera a interface completa quebra). **Correção:** decidir se vira ERC-4626 completo ou documenta claramente.
- **Confiança:** alta.

### E3. Arc "USDC gas" com `gasDecimals:18` vs `usdcDecimals:6` (P2, confirmado, documentado)
- **Arquivo:** `NETWORKS.arcMain`/`.arc` — `gasSymbol:'USDC'`, `gasDecimals:18`, `usdc:'0x3600…'`, `usdcDecimals:6`.
- **Real:** o gas "USDC" de Arc é uma unidade de 18 decimais distinta do ERC-20 USDC de 6 decimais. O limite diário da
  smart wallet usa `gasDecimals:18`. Documentado (fase 2), mas é um pé-duro fácil de errar.
- **Correção sugerida:** nenhuma (é o comportamento da rede); só reforçar a documentação/UI. **Confiança:** alta.

### E4. BNB Chain `usdcDecimals:18` (P2, confirmado, não re-verificado)
- **Arquivo:** `NETWORKS.bnb.usdcDecimals = 18`. BSC tem um "USDC" de 18 decimais (asset pegged, distinto do USDC 6-dec).
- **Real:** os geradores que usam `usdcDecimals` (ex. preço do NFT, cap) assumem 18 em BNB. **Não verificado** contra fonte autoritativa.
- **Confiança:** média.

### E5. CCTP V1 vs V2 com endereços distintos e redes desiguais (P2, confirmado)
- **Arquivos:** `genCrosschain()` (V1, usa `NETWORKS[net].cctp`) vs `genCrosschainV2()`/`cctpV2()` (V2, usa `CCTP_V2_ADDR`).
- **Real:** a seção "Crosschain" tem duas gerações: V1 (single mode, `depositForBurn` de 3 args, legado) e V2 (portable/multi/
  cross, `depositForBurn` de 6 args). Em Arc, o V1 fica DRAFT (sem `cctp` no NETWORKS) mas o V2 tem domínio 26 — coerência
  parcial. A V1 está marcada `experimental`/legada.
- **Correção sugerida:** aposentar a V1 (remover da UI) numa fase futura. **Confiança:** alta.

### E6. `compileSource` seleciona `contractNames[0]` se o nome não bate (P2, confirmado)
- **Arquivo:** `app.js` `compileSource()` — `const target = contracts[name] ? name : contractNames[0];`.
- **Real:** para uma fonte multi-contrato (o chat de IA pode gerar um contrato + helpers), o primeiro contrato do output é
  escolhido se o nome não bater. Os geradores de template produzem um contrato só, mas a IA não garante isso.
- **Impacto:** possível deploy do contrato errado (helper) em vez do principal. **Correção:** priorizar o contrato com o
  construtor, ou o maior, ou exigir um contrato por arquivo.
- **Confiança:** alta (o mecanismo é claro; a probabilidade depende do output da IA).

### E7. `matHash` (cyrb53) não-critográfico no gate de mainnet (P3, teórico)
- **Arquivo:** `maturity.js` `matHash()` — cyrb53 de 53 bits. `deployCompiled` compara `compiled.sourceHash` contra
  `MAT_APPROVED` (Set em memória, populado no `matGate`).
- **Real:** uma colisão de 53 bits entre duas fontes diferentes na MESMA sessão poderia aprovar a fonte errada. O gate é
  client-side e o aprovação é em memória, então o risco é baixo (o atacante precisaria de colisão + passar o gate + mesma sessão).
- **Correção sugerida:** trocar por keccak256 (ethers.utils.keccak256 já está disponível). **Confiança:** alta (mecanismo), baixa (explorabilidade).

### E8. Staking: recompensa exige mesmo decimal do token de stake (P3, documentado)
- **Arquivo:** `genSimpleStaking()` — comentário "use a reward token with the same decimals as the staking token".
- **Real:** se os decimais diferirem, o APY é mal escalado. Sem validação na UI.
- **Correção sugerida:** validar decimais iguais, ou escalar. **Confiança:** alta.

### E9. MultiSend: cap de gas 200000 por pagamento nativo (P3, documentado)
- **Arquivo:** `genMultisend()` — `NATIVE_TRANSFER_GAS = 200000`.
- **Real:** destinatário que precisa de mais gas não recebe nativo (mitiga DoS/gas-bomb). Documentado.
- **Confiança:** alta.

### E10. DAO: sem vote escrow (P2, documentado)
- **Arquivo:** `genSimpleDAO()` — delegar antes do snapshot dá voto; quem compra e delega antes do snapshot vota (sem escrow).
- **Real:** documentado em `dao-review.md` (finding 7). Limitação de design compartilhada com Governor padrão.
- **Confiança:** alta.

### E11. Order book: arredondamento de fee (P2, documentado)
- **Arquivo:** `genSwap()` (orderbook) — `fillOrder` arredonda a fee para cima ("a tiny fill is never free").
- **Real:** documentado em `generators-review.md`; sem fuzz dedicado (experimental).
- **Confiança:** alta.

## F. Test Results

| Suíte | Linha de base (antes) | Resultado |
|---|---|---|
| compile-generators | 342 | 342 passed |
| golden | 72 | 72 outputs identical |
| maturity | 146 | 146 passed |
| ai-proxy | 146 | 146 passed |
| multichain | 930 | 930 passed |
| ui | 374 | 374 passed |
| xss | 43 | 43 passed |
| innerhtml-lint | 48 aprovados | OK (0 não aprovado) |
| csp | 235 | 235 passed |
| playground | skip | skip (sem anvil) |
| lab / solc-loader / vendor / reproducible | 73/7/10/70 | idem |
| compile-foundry-tests | 19 | 19 passed |
| native-solc-bytecode / oracle | skip / 9 | skip / 9 passed |
| headers / zip | 6/15 | 6/15 passed |

- **Falhas novas:** nenhuma (a suíte já estava verde na fase 7.1).
- **Não executado:** `forge` (test:swap/test:portable — binário indisponível), `slither` (não instalado), oráculo nativo
  (sem solc nativo). Todos reportados como limitação, não como falha.
- **Nenhum teste foi removido/alterado** nesta fase (auditoria read-only).

## G. Next-Phase Plan (corretivo, priorizado)

1. **Fase 11.1 — ERC-4626 e cap do Vault:** decidir ERC-4626 completo (mint/withdraw/preview/max, shares transferíveis,
   eventos padrão) ou documentar claramente a divergência; corrigir `depositCap` para usar os decimais do asset em single
   mode (reaproveitar o spec `scaled`). Escopo: só `genVault`. Aceitação: `golden` só no vault, `Hardening.t.sol` + um novo
   teste de cap multi-decimal.
2. **Fase 11.2 — Seleção de contrato no compile:** em `compileSource`, selecionar o contrato principal deterministicamente
   (ex.: o que tem construtor, senão o maior por bytecode) e avisar quando houver mais de um. Escopo: `compileSource` +
   teste unitário com fonte multi-contrato. Aceitação: sem mudança para os geradores atuais; teste novo.
3. **Fase 11.3 — `matHash` criptográfico:** trocar cyrb53 por keccak256 no gate de mainnet (e no carimbo, se aplicável).
   Escopo: `maturity.js`. Aceitação: `maturity.mjs` + mutação "hash fraco".
4. **Fase 11.4 — Aposentar CCTP V1:** remover a V1 da UI (manter no proxy por compatibilidade), documentar a migração para
   V2. Escopo: `genCrosschain` (single mode), `index.html`. Aceitação: navegação sem a V1, `golden` atualizado.
5. **Fase 11.5 — Validações de decimal:** staking (reward==stake decimals), vault (asset decimals), NFT price (USDC
   decimals). Escopo: validações de UI/gerador. Aceitação: testes por rede.
6. **Fase 11.6 — Re-promoção com evidência:** quando as suítes Foundry de erc20/paywall/staking passarem no CI, registrar a
   execução e promover.

## Decisões / limitações desta auditoria

- Não re-verifiquei endereços de contrato (USDC, CCTP, explorers, RPCs) contra fontes autoritativas; estão como no
  repositório. Uma fase futura deve re-verificar `NETWORKS` e `CCTP_V2_ADDR`/`CCTP_DOMAINS`.
- Não executei forge/slither/oráculo nativo (binários indisponíveis); os pontos que só o CI confirma estão na seção F.
- Nenhum comportamento de produção foi alterado; nenhum arquivo fora do relatório foi modificado.
