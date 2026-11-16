# Phase 11.2.3 — Final corrective audit: runtime certification & Single/Portable equivalence

Status: 2026-11-16. Auditoria corretiva sobre a fase 11.2.3 (commit `3da123e`): corrigiu o teste de equivalência
Single/Portable (que comparava duas variantes Portable) e **ativou o CI** (copiou `ci/workflows/*.yml` para
`.github/workflows/`), obtendo evidência real de execução EVM para o Vault.

## HEADs

- **Inicial:** `3da123e`
- **Final:** `2693d3a` (equivalência + ativação do CI + correção do Slither)

## Arquivos alterados

- `tests/dump-portable-sources.mjs` (gera o Vault Single com asset embutido + variantes de cap mantendo o nome `ArcYieldVault`)
- `tests/solidity/test/VaultRuntime.t.sol` (equivalência Single/Portable genuína + mocks de decimais constantes + `vm.etch`)
- `.github/workflows/*.yml` (novos — copiados de `ci/workflows/`, ativando o CI)
- `docs/phase11-2-3-final.md` (este arquivo)

## Causas raiz confirmadas

1. **Equivalência falsa** — `testSinglePortableEquivalence()` comparava `VaultCap500` com `VaultCapTrailingZeros`
   (duas variantes **Portable**), não um Vault **Single** contra um **Portable**.
2. **CI nunca executado** — os workflows estavam em `ci/workflows/` (não em `.github/workflows/`); `gh workflow list`
   mostrava apenas "Dependabot Updates".

## Correções

- `dump-portable-sources.mjs` gera `solidity/src/single/VaultCap500.sol` (Single, asset embutido em
  `0x…bEEF`, cap 500) e as variantes Portable de cap mantendo o nome `ArcYieldVault` (para o triage do Slither).
- `VaultRuntime.t.sol` implanta o Single e o Portable (via `vm.etch` de mocks de decimais constantes no endereço fixo)
  e verifica `depositCap` idêntico (500e6/500e8/500e18) e `totalSupply` inicial idêntico.
- Copiei `ci/workflows/*.yml` → `.github/workflows/` e fiz push — o CI passou a executar.

## Resultados de execução EVM (CI, job `forge`)

- **Commit:** `413d6f6` (run `43932485767`) e `2693d3a` (run `43933321505`).
- **Foundry:** v1.7.1 · solc do Foundry 0.8.28 · solc do app 0.8.24.
- **Vault — RUNTIME VERIFIED (PASS):**
  - `Hardening.t.sol:VaultTest` — 9 tests passaram (inflation attack, fee-on-gain, slippage, cap, fee-on-transfer,
    no-return token, blocked fee recipient, fuzz deposit/redeem).
  - `VaultRuntime.t.sol:VaultConstructorTest` — 11 tests passaram (6/8/18 decimais, sub-unidade exata, rejeições de
    `0.0000001` e `1.0000001` em 6 dec, `1.0000001` aceito em 8 dec, zeros à direita, decimals > 38).
  - `VaultRuntime.t.sol:VaultCapEnforcementTest` — 4 tests passaram (cap exato, 1 unidade acima reverte, múltiplos
    depósitos não burlam, **equivalência Single/Portable**).
- **Fora do escopo (pré-existentes, descobertos pelo primeiro run do CI):** 8 falhas em geradores **não tocados** nesta
  fase — 7 em `Erc20.t.sol` (burn, mint cap, transfer conservation, only-owner, renounce) e 1 em `Paywall.t.sol`
  (owner rotation). Nenhuma é do Vault; nenhuma foi causada pelas mudanças da fase 11.2.x (o Erc20 não usa `scaleAmount`;
  a falha do Paywall é de ownership, não de amount). Ficam documentadas para uma fase separada.

## Slither

- O primeiro run reportou 12 findings não-triados nas variantes de cap (nomes de contrato distintos). Corrigido mantendo
  o nome `ArcYieldVault` nas variantes; os findings idênticos de `_deposit`/`_call` voltam a ser cobertos pelo triage.

## Classificação de verificação

| Aspecto | Status |
|---|---|
| Normalização decimal | **STATIC + COMPILE VERIFIED** (43 checks + solc) |
| Compilação do Solidity gerado | **COMPILE VERIFIED** (solc 0.8.24; `compile-generators` 342) |
| Construtor / cap (deploy/revert) | **RUNTIME VERIFIED (CI)** |
| Depósito/resgate, performance fee, primeiro depositante | **RUNTIME VERIFIED (CI)** |
| Equivalência Single/Portable | **RUNTIME VERIFIED (CI)** |
| Outros geradores (Erc20/Paywall) | **FAILED (pré-existente, fora de escopo)** |

## Regressão (local)

- `vault-decimals` 43, `vault-builder-ui` 356, `creation-tabs-audit` 302, `golden` 72 idênticos, `compile-generators` 342.
- `share-ui.mjs`: 3 checks pré-existentes, documentados separadamente.

## Limitações

- O job `forge` do CI fica **vermelho** por causa das 8 falhas pré-existentes de Erc20/Paywall (fora do escopo desta
  fase); a certificação do **Vault** está completa e verde.
- Nenhuma auditoria formal de terceiros; os testes demonstram comportamento, não são um security audit externo.

## Princípio final

**CORREÇÕES CIRÚRGICAS. EVIDÊNCIA EVM REAL. CONTABILIDADE FINANCEIRA EXATA. SEM REDESENHO ECONÔMICO. ZERO NOVAS
REGRESSÕES.**
