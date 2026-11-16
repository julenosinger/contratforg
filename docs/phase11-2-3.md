# Phase 11.2.3 — Vault runtime certification & decimal edge cases

Status: 2026-11-16. Escopo cirúrgico sobre a fase 11.2.2 (commit `22aadcb`): normalizar zeros fracionários
insignificantes e adicionar **certificação transacional** (Foundry) do construtor do Vault. **Zero regressões novas;
nenhuma mudança de economia, de outros geradores, de redes, tokens, CCTP, gates ou dependências.**

## HEADs

- **Inicial:** `22aadcb`
- **Final:** ver commit final

## Arquivos alterados

- `contractforge-deploy/app.js` (`scaleAmount`: normalização de zeros fracionários à direita)
- `tests/dump-portable-sources.mjs` (gera variantes determinísticas do Vault com caps distintos)
- `tests/solidity/test/VaultRuntime.t.sol` (novo — testes de execução do construtor)
- `tests/vault-decimals.mjs` (ampliado para 43 checks)
- `tests/mutation-check.py` (2 novas mutações)
- `docs/phase11-2-3.md` (este arquivo)

## Causas raiz verificadas

1. **Zeros fracionários insignificantes** — `scaleAmount` removia zeros à esquerda mas preservava zeros à direita da
   fração (ex.: `1.000000` → `digits "1000000", scale 6`), inflando a escala fracionária e o risco de overflow
   intermediário sem alterar o valor. **Correção:** remover zeros fracionários finais (e zeros inteiros iniciais), sem
   `Number`/ponto flutuante.

## Algoritmo de normalização (string, sem ponto flutuante)

```
frac  = m[2].replace(/0+$/, '')       // remove zeros fracionários finais insignificantes
scale = frac.length
digits = (m[1] + frac).replace(/^0+/, '')   // remove zeros inteiros iniciais
isZero = digits === ''
```

| Entrada | digits | scale | valor |
|---|---|---|---|
| `1.000000` | `1` | 0 | 1 |
| `500.250000` | `50025` | 2 | 500.25 |
| `0.000001000` | `1` | 6 | 0.000001 |
| `000500.2500` | `50025` | 2 | 500.25 |
| `0.000000` | `` (isZero) | 0 | 0 |
| `1.0000001` | `10000001` | 7 | 1.0000001 (dígitos significativos preservados) |

Preserva dígitos fracionários **significativos**; nunca arredonda nem trunca. `scaleAmount` é compartilhado, mas a
normalização é preservadora de valor e os demais geradores usam entradas inteiras (sem fração) — verificado por
`golden.mjs` (72 idênticos, sem diff nos outros geradores).

## Certificação transacional (Foundry) — status

- **Ambiente local:** `forge` **não instalado** — os testes de runtime **não foram executados aqui**.
- **CI:** o job `forge` em `ci/workflows/ci.yml` já instala Foundry v1.7.1 e roda `npm run test:swap`/`test:portable`
  (que executam `forge test` sobre `solidity/src/portable` e `solidity/src/single`).

**`tests/solidity/test/VaultRuntime.t.sol`** (novo, roda no CI) implanta o **Solidity gerado de verdade** (as variantes
determinísticas produzidas por `dump-portable-sources.mjs` a partir de `genVault()`), não um mock reescrito:

- `VaultConstructorTest`: 6/8/18 decimais (cap 500), cap fracionário (1.5), zero = ilimitado, sub-unidade exata
  (0.000001 → 1 unidade-base), sub-unidade (0.0000001) reverte, `1.0000001` reverte em 6 dec e aceita em 8 dec,
  zeros à direita normalizados, decimals > 38 reverte.
- `VaultCapEnforcementTest`: depósito exato no cap, 1 unidade-base acima reverte, múltiplos depósitos não burlam o cap,
  equivalência Single/Portable.

Mocks: `DecTok` (decimais configuráveis via construtor) e `BadDecTok` (decimals() = 255).

Os invariantes de depósito/resgate e o ataque do primeiro depositante já são cobertos por `Hardening.t.sol`
(`VaultTest`: inflation attack, fee-on-gain, slippage, cap, fee-on-transfer, no-return token).

## Classificação de verificação

| Aspecto | Status |
|---|---|
| Normalização decimal | **STATIC + COMPILE VERIFIED** (43 checks Node + solc) |
| Compilação do Solidity gerado | **COMPILE VERIFIED** (solc 0.8.24; `compile-generators` 342) |
| Construtor / cap (deploy/revert) | **RUNTIME — CI PENDING** (testes Foundry escritos, não executados localmente) |
| Depósito/resgate | **RUNTIME — CI PENDING** (Hardening.t.sol existente + novos) |
| Primeiro depositante | **RUNTIME — CI PENDING** (Hardening.t.sol `testInflationAttackNoLongerWorks`) |
| Equivalência Single/Portable | **COMPILE + STATIC VERIFIED** (mesmo `scaledCtorLines`); runtime no CI |

**A fase NÃO está totalmente certificada em runtime localmente** — implementação completa, certificação transacional
pendente da execução do CI (`forge`).

## Mutações (CAUGHT)

- "vault: insignificant trailing zeros are preserved again" (`vault-decimals.mjs`).
- "vault: the nonzero-cap guard is removed" (`vault-decimals.mjs`).
- (anteriores das fases 11.2/11.2.1/11.2.2 continuam CAUGHT.)

## Regressão

- `vault-decimals` 43, `vault-builder-ui` 356, `creation-tabs-audit` 302, `golden` 72 idênticos, `compile-generators` 342.

## Confirmações de não-mudança

- **Outros 17 geradores:** inalterados (golden só difere onde a normalização muda o Vault; neste caso, nenhum diff, pois
  o cap do golden é 0).
- **Redes / tokens / CCTP / gates / economia do Vault (SHARE_OFFSET, taxas, shares, ownership):** inalterados.
- **Dependências:** nenhuma nova.

## Riscos remanescentes

- **Certificação runtime pendente de CI** (Foundry não disponível localmente). Até o CI rodar e passar, o deploy/revert
  do construtor e os invariantes transacionais permanecem **não verificados em execução**.
- A análise do primeiro depositante (SHARE_OFFSET = 1e12) continua com proteção demonstrável em 6 decimais
  (`testInflationAttackNoLongerWorks`); para 18 decimais a proteção por unidade é mais fraca — documentado, sem mudança
  do offset.

## Princípio final

**PRECISÃO DECIMAL EXATA. EVIDÊNCIA FINANCEIRA EXECUTÁVEL. CI REPRODUTÍVEL. PRESERVAR A ECONOMIA EXISTENTE. ZERO NOVAS
REGRESSÕES.**
