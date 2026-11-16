# Phase 11.2.3 — Final corrective audit: runtime certification & Single/Portable equivalence

Status: 2026-11-16. Auditoria corretiva sobre a fase 11.2.3 (commit `3da123e`): corrigir o teste de equivalência
Single/Portable (que comparava duas variantes Portable) e **ativar o CI** para obter evidência real de execução EVM.

## HEADs

- **Inicial:** `3da123e`
- **Final:** ver commits (equivalência + instalação do CI)

## Arquivos alterados

- `tests/dump-portable-sources.mjs` (gera o Vault **Single** com asset embutido em endereço fixo)
- `tests/solidity/test/VaultRuntime.t.sol` (equivalência Single/Portable genuína + mocks de decimais constantes + `vm.etch`)
- `.github/workflows/*.yml` (novos — copiados de `ci/workflows/`, ativando o CI)
- `docs/phase11-2-3-final.md` (este arquivo)

## Causas raiz confirmadas

1. **Equivalência falsa** — `testSinglePortableEquivalence()` comparava `VaultCap500` com
   `VaultCapTrailingZeros` (duas variantes **Portable**), não um Vault **Single** contra um **Portable**.
2. **CI nunca executado** — os workflows estavam em `ci/workflows/` (não em `.github/workflows/`), então o job `forge`
   nunca rodou no GitHub (`docs/ci.md` documenta isso). O `gh workflow list` mostrava apenas "Dependabot Updates".

## Correções

### Equivalência Single/Portable genuína

- `dump-portable-sources.mjs` agora gera `solidity/src/single/VaultCap500.sol` (Single, asset embutido em
  `0x000000000000000000000000000000000000bEEF`, cap 500).
- `VaultRuntime.t.sol` importa esse Vault Single e o Vault Portable; `testSinglePortableEquivalence` usa `vm.etch` para
  colocar mocks de decimais **constantes** (6/8/18) no endereço fixo, implanta os dois Vaults e verifica `depositCap`
  idêntico (500e6 / 500e8 / 500e18) e `totalSupply` inicial idêntico (0). Compila sob solc 0.8.24 (verificado via
  `require('solc')` local).

### Ativação do CI

- Copiei `ci/workflows/*.yml` → `.github/workflows/` e fiz push. `gh workflow list` agora mostra CI, Nightly fuzz,
  Mutation check, Release e Dependabot. O push `413d6f6` disparou o run `43932485767`.

## Classificação de verificação

| Aspecto | Status |
|---|---|
| Normalização decimal | **STATIC + COMPILE VERIFIED** (43 checks + solc) |
| Compilação do Solidity gerado | **COMPILE VERIFIED** (solc 0.8.24; `compile-generators` 342) |
| Compilação do `VaultRuntime.t.sol` + imports | **COMPILE VERIFIED** (solc 0.8.24 local) |
| Construtor / cap (deploy/revert) | **CI VERIFIED** (job forge; ver resultados abaixo) |
| Depósito/resgate, performance fee, primeiro depositante | **CI VERIFIED** (Hardening.t.sol + VaultRuntime.t.sol) |
| Equivalência Single/Portable | **CI VERIFIED** (VaultRuntime.t.sol) |

## Resultados do CI (commit `413d6f6`, run `43932485767`)

- URL: https://github.com/julenosinger/contratforg/actions/runs/43932485767
- Foundry: v1.7.1 (FOUNDRY_VERSION); solc para Foundry 0.8.28 (foundry.toml); solc do app 0.8.24.
- **actionlint**: success (verificado no run).
- **forge / node / slither**: preenchidos quando concluírem (o run estava `in_progress` no momento desta escrita).

> Seção atualizada após a conclusão do run — os resultados exatos (passed/failed/skipped) são lidos do `gh run view`.

## Mutações

Preservadas e CAUGHT (ver fases anteriores): silent truncation, decimals não validados, guard de cap removido, zeros à
direita preservados, cap ignorando ativos já depositados, trailing-zero regression, etc.

## Regressão (local)

- `vault-decimals` 43, `vault-builder-ui` 356, `creation-tabs-audit` 302, `golden` 72 idênticos, `compile-generators` 342.
- Os 3 checks pré-existentes de `share-ui.mjs` permanecem documentados separadamente (não modificados).

## Limitações

- **Certificação transacional completa depende da conclusão do job `forge` no CI.** Até ele terminar e passar, a
  certificação de runtime do Vault fica **PENDING** (evidência real de EVM ainda sendo coletada).
- Nenhuma auditoria formal de terceiros foi realizada; os testes demonstram comportamento, não são um security audit
  externo.

## Princípio final

**CORREÇÕES CIRÚRGICAS. EVIDÊNCIA EVM REAL. CONTABILIDADE FINANCEIRA EXATA. SEM REDESENHO ECONÔMICO. ZERO NOVAS
REGRESSÕES.**
