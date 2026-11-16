# Phase 11.1.4 — Final wallet identity & multichain deployment status hardening

Status: 2026-11-16. Escopo cirúrgico sobre a fase 11.1.3 (commit `edda444`): confirmar a identidade **autorizada** da
carteira antes de cada assinatura (não a conta em cache) e classificar o resultado final do lote multichain com
veracidade. **Zero regressões novas; nenhuma mudança em geradores, templates, redes, tokens, CCTP, gates ou
dependências.**

## HEADs

- **Inicial:** `edda444`
- **Final:** ver commit final (produção + testes + docs em commits separados)

## Arquivos alterados

- `contractforge-deploy/app.js`
- `contractforge-deploy/multideploy.js`
- `tests/deploy-final.mjs` (novo)
- `tests/deploy-batch.mjs` (atualizado para o retorno `{ outcome, results }`)
- `tests/package.json` (adiciona `deploy-final.mjs`)
- `tests/mutation-check.py` (2 novas mutações)
- `docs/phase11-1-4.md` (este arquivo)

## Causas raiz verificadas (no código real)

1. **Identidade de carteira em cache** — `mdAssertReady()`/`assertOpUnchanged` confiavam no `account` global, atualizado
   pelo listener `accountsChanged`. Um evento de troca de conta **atrasado** deixava a conta em cache obsoleta passar na
   guarda pré-assinatura.
2. **Status final enganoso** — `multiDeploy` sempre registrava `logConsole('ok','Multi-deploy finished: …')` mesmo após
   um abort fatal (que registrava `Multi-deploy stopped` no `catch`), exibindo sucesso onde houve abort.

## Correções (antes → depois)

| Caso | Antes | Depois |
|---|---|---|
| Conta antes de assinar | cache (`account`) | `eth_accounts`/`listAccounts` autoritativo + comparação com `op.account` |
| Evento de conta atrasado | passava com conta obsoleta | `fatal` ("account changed before signing") |
| Carteira desconectada na verificação | (n/a) | `fatal` ("disconnected") |
| Query de conta indisponível | (n/a) | degrada graciosamente para a checagem em cache |
| Fim do lote | sempre "finished" (ok) | `completed` / `partially_completed` / `aborted` / `failed` |
| Retorno | `results[]` | `{ outcome, results }` |

## Compatibilidade com o provedor

`currentWalletAccounts()` usa `window.ethereum.request({ method:'eth_accounts' })` (EIP-1193, **leitura**, sem popup de
conexão) e, se indisponível, `provider.listAccounts()`; se nenhum existir, retorna `null` e a guarda degrada para a
checagem em cache (que já passou). A comparação é case-insensitive (`op.account.toLowerCase()` vs conta autorizada). A
verificação é somente leitura — não escreve em `account`/`signer`, portanto uma resposta antiga não sobrescreve estado
mais novo; o resultado é sempre confrontado com o snapshot imutável `op`.

## Testes

- **Novo** `tests/deploy-final.mjs`: **20 checks, 20 passam.** `currentWalletAccounts` (eth_accounts, fallback
  listAccounts, null), `assertWalletIdentity` (igual/diferente/vazio/indisponível), `mdOutcome` (4 classes), e o fluxo
  real de `multiDeploy`: `completed`, `partially_completed`, `aborted` (fatal), sem log de sucesso após abort, lock
  liberado e rede restaurada.
- **Mutações novas** (CAUGHT): "identity: the authorized account is no longer verified" e "status: an aborted batch is
  reported as success" (`deploy-final.mjs`).
- **Regressão:** todas verdes — `deploy-batch` 23, `deploy-concurrency` 18, `deploy-integrity` 27, `contract-resolution`
  15, `creation-tabs` 302, `deploy-overview` 240, `crosschain` 556, `deploy-mode` 107, `multichain` 930, `ui` 376,
  `csp` 248, `xss` 43, `innerhtml-lint` OK, `maturity` 146, `ai-proxy` 146, `compile-generators` 342, `golden` 72.

## Falha pré-existente (fora de escopo)

`tests/share-ui.mjs` continua com os **mesmos 3 checks** falhando (97 passed, 3 failed) desde a base `6081b18` (fase
10.3, Share/QR). Como está no meio do encadeamento `&&` do `npm test`, a execução para nele; os testes seguintes são
rodados individualmente e passam. Não foi corrigido, nem mascarado, nem atribuído a esta fase.

## Confirmações de não-mudança

- **Geradores / templates Solidity:** inalterados (`compile-generators` 342/342, `golden` 72 idênticos).
- **Redes / tokens / CCTP:** inalterados — nenhum chain ID, RPC, endereço, decimal ou domínio CCTP mudou.
- **Gates de segurança:** maturidade, DRAFT, confirmação de mainnet, validação de carteira/cadeia e construtor —
  preservados (as mutações de gate existentes continuam CAUGHT).
- **Dependências:** nenhuma nova; nenhuma permissão de carteira nova.

## Limitações / riscos

- **Não rodei forge** (binário indisponível localmente); as suítes Foundry seguem só no CI.
- A verificação de identidade é "melhor esforço" no instante da assinatura (há sempre uma janela TOCTOU inerente entre a
  consulta e o `send`); o ganho é eliminar a confiança na conta em cache obsoleta.
- A falha pré-existente de `share-ui.mjs` permanece aberta (fase 10.3).

## Princípio final

**IDENTIDADE DE CARTEIRA VERIFICADA, EXECUÇÃO DE REDE EXATA, STATUS DE IMPLANTAÇÃO VERDADEIRO, ZERO REGRESSÕES NOVAS.**
Sem assinatura com signer obsoleto, sem status de sucesso após abort, sem mudanças não relacionadas.
