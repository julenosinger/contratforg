# Phase 11.1.3 — Multichain gas integrity, crosschain signing & batch abort safety

Status: 2026-11-16. Escopo cirúrgico sobre a fase 11.1.2 (commit `0aab25c`): corrigir a distinção de gás nativo vs.
ERC-20 USDC no Arc, revalidar a identidade antes de cada assinatura (incluindo o Bridge crosschain) e classificar
erros fatais vs. recuperáveis no lote multichain. **Zero regressões novas; nenhuma mudança em geradores, templates,
redes, tokens, CCTP, gates ou dependências.**

## HEADs

- **Inicial:** `0aab25c`
- **Final:** ver commit final (produção + testes + docs em commits separados)

## Arquivos alterados

- `contractforge-deploy/app.js`
- `contractforge-deploy/multideploy.js`
- `tests/deploy-batch.mjs` (novo)
- `tests/package.json` (adiciona `deploy-batch.mjs` ao `npm test`)
- `tests/mutation-check.py` (3 novas mutações)
- `docs/phase11-1-3.md` (este arquivo)

## Causas raiz verificadas (no código real)

1. **Gás nativo vs. ERC-20 USDC no Arc** — `refreshBalance()` formatava o saldo nativo com `formatUnits(nativeBal, 18)`
   (18 fixo) e, no Arc, exibia **apenas** o saldo ERC-20 USDC (6 decimais) como se fosse o saldo de gás ("one pool"),
   escondendo o saldo nativo (18 decimais). Confirmado: `arc.gasDecimals=18` ≠ `arc.usdcDecimals=6`.
2. **Bridge crosschain sem revalidação** — `multiDeploy` chamava `mdAssertReady` antes do deploy **principal**, mas o
   deploy do **Bridge** (logo depois, após `factory.deploy()` + `contract.deployed()`) não revalidava conta/cadeia.
3. **Violação de identidade tratada como falha por rede** — `mdAssertReady` lançava dentro do `try` por rede; uma troca
   de conta/fonte/modo era capturada como `failed` e o lote **continuava** na rede seguinte com identidade obsoleta.
4. **Falha do Bridge marcava a rede inteira como falha** — se o Bridge falhasse após o principal ter sido confirmado, o
   `catch` por rede adicionava `[net, 'failed']` **além** do `[net, address]` já registrado (duplicava e falsificava o
   resultado).

## Correções (antes → depois)

| Caso | Antes | Depois |
|---|---|---|
| Saldo nativo | `formatUnits(bal, 18)` fixo | `formatUnits(bal, net.gasDecimals \|\| 18)` |
| Arc | só ERC-20 USDC (6 dec) | nativo USDC (gas, 18 dec) + ERC-20 USDC (6 dec) distintos |
| Rede não-Arc | ERC-20 USDC + nativo | idem (nunca USDC como gás) |
| Bridge crosschain | sem revalidação | `mdAssertReady` antes da 2ª assinatura |
| Violação de identidade no lote | `failed` e continua | `err.fatal` → aborta o lote inteiro |
| Cadeia errada | (n/a) | recuperável (não-fatal) |
| Principal ok + Bridge falha | duplica `[net, failed]` | principal preservado + `[net bridge, failed]` |

## Matriz de verificação de gás (registry `NETWORKS` como autoridade)

| Família | gasSymbol | gasDecimals | usdcDecimals |
|---|---|---|---|
| Ethereum / Sepolia / Base / Arb / Opt (+ testnets) | ETH | 18 | 6 |
| Polygon / Amoy | POL | 18 | 6 |
| Avalanche | AVAX | 18 | 6 |
| BNB | BNB | 18 | **18** |
| Robinhood (main + testnet) | ETH | 18 | 6 |
| Arc Mainnet / Testnet | **USDC** | **18** | **6** |

16 redes verificadas no teste; nenhuma usa USDC como gás fora do Arc; BNB mantém `usdcDecimals:18` (distinto).

## Testes

- **Novo** `tests/deploy-batch.mjs`: **23 checks, 23 passam.** Cobre a registry de gás (16 redes, Arc USDC vs ERC-20,
  nenhum USDC fora do Arc), `refreshBalance` (decimais nativos vs ERC-20, distinção Arc, rede não-Arc), classificação
  fatal/recoverável, e o fluxo real de `multiDeploy` com dependências mockadas: ordem sequencial, falha parcial
  recuperável, abort fatal por troca de conta, principal-ok+Bridge-falha (preserva principal), e Bridge revalidado.
- **Mutações novas** (CAUGHT): "bridge: the second signature skips its identity check", "batch: an identity violation
  continues to the next network", "gas: a non-Arc chain presents USDC as its native gas" (`deploy-batch.mjs`).
- **Regressão:** todas verdes — `deploy-concurrency` 18, `deploy-integrity` 27, `contract-resolution` 15,
  `creation-tabs` 302, `deploy-overview` 240, `crosschain` 556, `deploy-mode` 107, `multichain` 930, `ui` 376, `csp` 248,
  `xss` 43, `innerhtml-lint` OK, `treasury` 121, `vault` 359, `multisend` 312, `swap` 176, `simple` 1581, `wizard` 295,
  `builder-core` 59, `header-home` 190, `maturity` 146, `ai-proxy` 146, `history` 134, `verify` 119, `lab` 73,
  `solc-loader` 7, `vendor` 10, `reproducible-bytecode` 70, `compile-foundry-tests` 19, `native-solc-oracle` 9,
  `headers` 6, `zip` 15, `golden` 72, `compile-generators` 342.

## Falha pré-existente (fora de escopo)

`tests/share-ui.mjs` continua com os **mesmos 3 checks** falhando (97 passed, 3 failed) desde a base `6081b18` (fase
10.3, Share/QR). Como está no meio do encadeamento `&&` do `npm test`, a execução para nele; os testes seguintes são
rodados individualmente e passam. Não foi corrigido (fora de escopo), nem mascarado, nem atribuído a esta fase.

## Confirmações de não-mudança

- **Geradores / templates Solidity:** inalterados (`compile-generators` 342/342, `golden` 72 idênticos).
- **Redes / tokens / CCTP:** inalterados — nenhum chain ID, RPC, endereço, decimal ou domínio CCTP mudou; a registry
  `NETWORKS` foi **verificada**, não alterada.
- **Gates de segurança:** maturidade, DRAFT, confirmação de mainnet, validação de carteira/cadeia e construtor —
  preservados (as mutações de gate existentes continuam CAUGHT).
- **Dependências:** nenhuma nova.

## Limitações / riscos

- **Não rodei forge** (binário indisponível localmente); as suítes Foundry seguem só no CI.
- A verificação de gás é de **display/decimais** (a registry já estava correta); não foi adicionada uma checagem
  bloqueante de "saldo insuficiente" (a estimativa de gás pode ser indisponível, e a fase é de correção mínima).
- A falha pré-existente de `share-ui.mjs` permanece aberta (fase 10.3).

## Princípio final

**MULTICHAIN POR DESIGN. GÁS NATIVO POR REDE. CONTRATO EXATO POR IDENTIDADE. AUTORIZAÇÃO EXPLÍCITA PARA CADA
ASSINATURA.** Zero regressões novas, sem fallbacks silenciosos, sem assinatura em cadeia errada, sem mudanças não
relacionadas.
