# Phase 11.1.1 — Contract resolution & multichain deployment hardening

Status: 2026-11-16. Escopo cirúrgico sobre a fase 11.1 (commit `96ab490`): fechar os gaps restantes em
resolução de contrato, sincronização de construtor, validação de linking de bibliotecas e segurança assíncrona.
**Zero regressões novas; nenhuma mudança em geradores, templates, redes, gates ou dependências.**

## HEADs

- **Inicial:** `96ab490`
- **Final:** ver commit final (produção + testes + docs em commits separados)

## Arquivos alterados

- `contractforge-deploy/app.js`
- `contractforge-deploy/multichain.js`
- `contractforge-deploy/multideploy.js`
- `tests/deploy-integrity.mjs` (novo)
- `tests/package.json` (adiciona `deploy-integrity.mjs` ao `npm test`)
- `tests/mutation-check.py` (2 novas mutações)
- `docs/phase11-1-1.md` (este arquivo)

## Correções (causa raiz → mudança)

### P1 — Resolução unificada (multi-deploy não oferecia seleção)
`multiDeploy()` chamava `compilePending()` direto; numa fonte ambígua (IA com vários contratos) o erro `ambiguous`
caía no catch externo ("Multi-deploy stopped") sem oferecer seleção. **Correção:** novo helper
`compilePendingResolved()` (compila uma vez e, se ambíguo, mostra `uiContractSelect` e recompila com o alvo
escolhido; retorna `null` no cancelamento). `compileAndDeploy()` e `multiDeploy()` usam o mesmo helper; o multi-deploy
resolve **uma vez** e reusa o alvo exato no lote. Cancelar interrompe antes de qualquer assinatura. O bridge
(`compileSource(bname, bridgeCode, bname)`) passou a declarar o alvo explicitamente, eliminando a leitura do
`pendingSource.aiTargets` global que podia vazar para a compilação do bridge.

### P1 — Sincronização de construtor pela ABI
Selecionar outro contrato deixava o formulário de construtor associado ao contrato anterior (o formulário era
derivado do `parseCtorParams` do **primeiro** contrato da fonte). **Correção:** `syncCtorArgsFromAbi(ctorInputs)`
reconstrói o esquema do formulário a partir da ABI **compilada** do alvo resolvido; valores sobrevivem só quando o
nome do parâmetro continua igual (o tipo é re-rotulado da ABI), o resto é limpo (nunca carregado de outro contrato).
`compilePending()` registra `pendingSource.resolvedTarget` e chama o sync; `syncCtorArgsFromSource()` agora **pula**
o re-parse de fonte quando há um alvo resolvido (senão desfaria o sync da ABI). No-op quando o formulário já bate,
preservando os defaults dos builders (`hint`/`value`).

### P1 — Validação de linking de bibliotecas e de bytecode
`isDeployableArtifact` só checava bytecode não-vazio; um contrato com biblioteca desvinculada passava. **Correção:**
`compileSource` passou a pedir `evm.bytecode.linkReferences`; `unresolvedLibraries()` lê as referências; `resolveContract`
recusa (e nunca oferece no seletor) um contrato com bibliotecas desvinculadas, com erro claro nomeando as bibliotecas
(`libraryLinkError`, com `err.libraries`). `compileSource` também valida que o bytecode de criação é hex puro
(pega placeholder desvinculado/malformado). Bibliotecas/contratos sem necessidade de linking seguem inalterados.

### P2 — Integridade de estado assíncrono
Entre compilar e assinar, a fonte/carteira/modo/rede podiam mudar e o deploy seguia com dados obsoletos. **Correção:**
`deployInFlight` impede clique duplo/operações concorrentes (single e multi); `deployOpSnapshot()`/`assertOpUnchanged(op)`
reverificam, nos limites de assinatura, fonte (hash), conta, modo e rede. A transição interna de rede do multi-deploy
(`switchWalletNetwork` não muda `account`) é permitida via `{ allowNetworkChange: true }`; uma mudança externa de
fonte/carteira/modo **aborta o lote inteiro** antes de assinar. O hash de fonte já existente (`matHash`) é reaproveitado;
nenhum novo "state manager".

## Antes vs. depois

| Caso | Antes | Depois |
|---|---|---|
| Fonte ambígua em multi-deploy | "Multi-deploy stopped" sem seleção | seletor + recompila com o alvo |
| Cancelar seleção | (n/a) | `null` → sem deploy, sem assinatura |
| Selecionar outro contrato | formulário do 1º contrato | formulário da ABI do alvo |
| Contrato com biblioteca desvinculada | deploy de bytecode com placeholder | erro claro com o nome da biblioteca |
| Bytecode malformado/não-hex | deploy | recusado por `compileSource` |
| Clique duplo em Deploy | duas operações concorrentes | segunda recusada |
| Fonte/carteira/modo mudam no meio | deploy com dados obsoletos | aborta antes de assinar |
| Transição de rede do multi-deploy | (n/a) | permitida (transição interna) |

## Testes

- **Novo** `tests/deploy-integrity.mjs`: **27 checks, 27 passam.** Usa solc 0.8.24 real para os casos críticos
  (seleção, fábrica vs. par, biblioteca desvinculada, hex do bytecode) e exercita `syncCtorArgsFromAbi` e
  `assertOpUnchanged` no harness. Cobre: seleção (exato, ausente, único, múltiplo, fábrica/par), linking/bytecode,
  construtor (reconstrução, valores obsoletos, zero-arg, defaults preservados, contagem), e async (fonte/rede/conta/modo,
  clique duplo, transição multi).
- **Mutações novas** (CAUGHT): "resolve: an unlinked library is deployed again" e "async: a changed source no longer
  aborts the deploy" (`deploy-integrity.mjs`).
- **Regressão:** `compile-generators` 342, `multichain` 930, `ui` 376, `csp` 248, `xss` 43, `innerhtml-lint` OK, e todos
  os builders/UI (creation-tabs 302, crosschain 556, deploy-mode 107, deploy-overview 240, treasury 121, vault 359,
  multisend 312, swap 176, simple 1581, wizard 295, builder-core 59, header-home 190, maturity 146, ai-proxy 146) — **todos
  inalterados e passando**.

## Falha pré-existente (fora de escopo)

`tests/share-ui.mjs` continua com os **mesmos 3 checks** falhando (97 passed, 3 failed) que já existiam na base
`6081b18`/`96ab490` (fase 10.3, Share/QR). Como ele está no meio do encadeamento `&&` do `npm test`, a execução para
nele; por isso os testes seguintes (incluindo `contract-resolution.mjs` e `deploy-integrity.mjs`) foram rodados
individualmente — todos passam. Não foi corrigido (fora do escopo desta fase), nem mascarado.

## Confirmações de não-mudança

- **Geradores / templates Solidity:** inalterados (nenhum rewrite; `compile-generators` 342/342 e golden idênticos).
- **Redes / tokens / CCTP:** inalterados (nenhuma mudança em chain ID, RPC, endereços, decimais, domínios CCTP).
- **Gates de segurança:** maturidade, DRAFT, confirmação de mainnet, validação de carteira/cadeia e construtor —
  preservados (as mutações de gate existentes continuam CAUGHT).
- **Dependências:** nenhuma nova.

## Limitações / riscos

- **Não rodei forge** (binário indisponível localmente); as suítes Foundry seguem só no CI.
- A detecção de biblioteca usa `evm.bytecode.linkReferences` (não distingue uma *library* com funções externas —
  que tem bytecode próprio e é "deployable" — de um contrato); na prática os geradores não usam bibliotecas e
  `adoptAiCode` já exclui `library` do regex de contratos, então o fluxo real nunca oferece uma library como alvo.
- A falha pré-existente de `share-ui.mjs` permanece aberta (fase 10.3).

## Princípio final

**CONTRATO CORRETO + ABI CORRETA + BYTECODE CORRETO + CONSTRUTOR CORRETO + REDE CORRETA + AUTORIZAÇÃO EXPLÍCITA.**
Sem fallbacks silenciosos, sem refatoração não relacionada, zero regressões novas.
