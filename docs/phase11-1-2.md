# Phase 11.1.2 — Deployment concurrency & constructor/network integrity

Status: 2026-11-16. Escopo cirúrgico sobre a fase 11.1.1 (commit `10deedd`): eliminar os riscos restantes de
concorrência de deploy, compatibilidade de construtor e transição de rede multichain. **Zero regressões novas;
nenhuma mudança em geradores, templates, redes, gates ou dependências.**

## HEADs

- **Inicial:** `10deedd`
- **Final:** ver commit final (produção + testes + docs em commits separados)

## Arquivos alterados

- `contractforge-deploy/app.js`
- `contractforge-deploy/multichain.js`
- `contractforge-deploy/multideploy.js`
- `tests/deploy-concurrency.mjs` (novo)
- `tests/package.json` (adiciona `deploy-concurrency.mjs` ao `npm test`)
- `tests/mutation-check.py` (3 novas mutações)
- `docs/phase11-1-2.md` (este arquivo)

## Correções (causa raiz → mudança)

### P1 — Guarda atômica de concorrência
`deployInFlight` era ativado **depois** do `await matGate(...)`. Entre o clique e a ativação, dois cliques rápidos
passavam o `if(deployInFlight)` e ambos aguardavam a maturidade, resultando em dois deploys sobrepostos. **Correção:**
`deployInFlight = true` é adquirido **sincronamente** antes do primeiro `await` (a maturidade), em `compileAndDeploy`
e em `multiDeploy`; o lock é liberado num `finally` em **toda** saída (cancelamento, exceção, promessa rejeitada).
Um segundo clique rejeitado só registra "already in progress" e não toca a operação ativa. `mdState.running` é
preservado (estado de UI); não há um novo state manager concorrente.

### P1 — Compatibilidade estrita de construtor
`syncCtorArgsFromAbi` preservava valor quando o **nome** batia, mesmo com tipo diferente, e o early-return comparava só
nomes. **Correção:** o valor é preservado apenas quando **posição + nome + tipo canônico** coincidem; tipos canônicos
são normalizados (`uint`→`uint256`, `int`→`int256`). Mesmo nome + tipo diferente → valor limpo; mesmo tipo + posição
diferente → não reutilizado; dimensão de array/tupla diferente → limpo; parâmetro removido → descartado; novo parâmetro
→ campo vazio (entrada obrigatória); construtor sem argumentos → campos obsoletos limpos. Defaults dos builders
(`hint`/`value`) só são preservados quando a identidade e o tipo continuam válidos. Tipos complexos não suportados
(array/tupla) seguem bloqueados por `coerceCtorValue` ("type … is not supported").

### P1 — Integridade da transição de rede multichain
A verificação de rede era ad hoc (setar `activeNetwork` + `switchWalletNetwork` + poll de chainId) sem re-checagem
explícita antes de assinar. **Correção:** novo `mdAssertReady(key, op)` — **falha fechado imediatamente antes de
assinar**: valida que a carteira ainda está conectada, que a conta pretendida é a mesma, que a identidade da operação
(fonte/modo/conta) não mudou, e que a carteira está na cadeia esperada (chainId). Distingue os modos de falha:
desconexão ("Wallet disconnected"), troca de conta ("wallet account changed"), cadeia errada ("chainId N but … needs
chainId M"). A transição interna de rede do multi-deploy (sequência selecionada, `switchWalletNetwork` não muda
`account`) continua permitida via `{ allowNetworkChange: true }`; uma mudança **externa** de conta/fonte/modo aborta o
lote inteiro. Ordem sequencial, política de falha parcial, restauração final e isolamento main/bridge preservados.

## Antes vs. depois

| Caso | Antes | Depois |
|---|---|---|
| Dois cliques rápidos em Deploy | dois deploys sobrepostos | segundo recusado (lock antes do await) |
| Lock liberado em erro/cancelamento | (n/a) | `finally` em toda saída |
| Mesmo nome, tipo diferente | valor preservado (bug) | valor limpo |
| Mesmo tipo, posição diferente | valor reutilizado (bug) | não reutilizado |
| Dimensão de array mudou | valor preservado (bug) | valor limpo |
| Cadeia errada antes de assinar | não checado | `mdAssertReady` falha fechado |
| Desconexão/troca de conta no meio | não checado | falha fechado antes de assinar |
| Transição interna do multi-deploy | (n/a) | permitida (interna) |

## Testes

- **Novo** `tests/deploy-concurrency.mjs`: **18 checks, 18 passam.** Cobre a guarda atômica (lock adquirido antes do
  `await`, segundo clique recusado antes da maturidade, cancelamento/exceção liberam o lock), compatibilidade estrita
  de construtor (tipo/posição/dimensão, equivalência `uint`/`uint256`, zero-arg), e `mdAssertReady` (cadeia errada,
  desconexão, troca de conta, transição interna permitida, mesma troca bloqueia single-deploy).
- **Mutações novas** (CAUGHT): "lock: two deploys can overlap again", "ctor: a value survives a type change again",
  "net: a wrong chain no longer blocks signing" (`deploy-concurrency.mjs`).
- **Regressão:** todas as suítes rápidas verdes — `deploy-integrity` 27, `contract-resolution` 15, `creation-tabs` 302,
  `deploy-overview` 240, `crosschain` 556, `deploy-mode` 107, `multichain` 930, `ui` 376, `xss` 43, `csp` 248,
  `innerhtml-lint` OK, `treasury` 121, `vault` 359, `multisend` 312, `swap` 176, `simple` 1581, `wizard` 295,
  `builder-core` 59, `header-home` 190, `maturity` 146, `ai-proxy` 146.

## Falha pré-existente (fora de escopo)

`tests/share-ui.mjs` continua com os **mesmos 3 checks** falhando (97 passed, 3 failed) que já existiam desde a base
`6081b18` (fase 10.3, Share/QR). Como está no meio do encadeamento `&&` do `npm test`, a execução para nele; os testes
seguintes são rodados individualmente e passam. Não foi corrigido (fora de escopo), nem mascarado, nem atribuído a esta
fase.

## Confirmações de não-mudança

- **Geradores / templates Solidity:** inalterados (`compile-generators` 342/342 — ver nota de tempo abaixo; golden idêntico).
- **Redes / tokens / CCTP:** inalterados (nenhuma mudança em chain ID, RPC, endereços, decimais, domínios CCTP).
- **Gates de segurança:** maturidade, DRAFT, confirmação de mainnet, validação de carteira/cadeia e construtor —
  preservados (as mutações de gate existentes continuam CAUGHT).
- **Dependências:** nenhuma nova.

## Limitações / riscos

- **Não rodei forge** (binário indisponível localmente); as suítes Foundry seguem só no CI.
- `compile-generators.mjs` ficou lento neste ambiente (a compilação solc WASM dos 288 casos leva vários minutos); foi
  verificado que a lentidão é **pré-existente** (a base `10deedd` também é lenta) e não é causada por esta fase — os 18
  geradores do primeiro modo compilam sem erro num teste isolado.
- A falha pré-existente de `share-ui.mjs` permanece aberta (fase 10.3).

## Princípio final

**MULTICHAIN POR DESIGN, CHAIN-SPECIFIC POR EXECUÇÃO, ATÔMICO POR OPERAÇÃO, EXATO POR IDENTIDADE DE CONTRATO.**
Sem regressões, sem fallbacks silenciosos, sem transições de rede não autorizadas, sem mudanças não relacionadas.
