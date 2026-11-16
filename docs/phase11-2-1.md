# Phase 11.2.1 — Vault cap safety, financial invariants & decimal precision hardening

Status: 2026-11-16. Escopo cirúrgico sobre a fase 11.2 (commit `91c899a`): garantir que um cap positivo de depósito
nunca vire silenciosamente "ilimitado", e endurecer a precisão decimal. **Zero regressões novas; nenhuma mudança de
economia, de outros geradores, de redes, tokens, CCTP, gates ou dependências.**

## HEADs

- **Inicial:** `91c899a`
- **Final:** ver commit final (produção + testes + docs em commits separados)

## Arquivos alterados

- `contractforge-deploy/app.js` (`scaleAmount`, `genVault`, spec `scaled` do Vault)
- `contractforge-deploy/multichain.js` (spec `scaled` do `portabilize`: flag `requireNonZero`)
- `tests/vault-decimals.mjs` (ampliado para 36 checks)
- `tests/golden/{arc,arcMain,ethereum,basesep}/genVault.sol` (regenerados — construtor virou bloco multi-linha)
- `tests/mutation-check.py` (2 novas mutações)
- `docs/phase11-2-1.md` (este arquivo)

## Causas raiz verificadas (código real)

1. **Cap positivo → ilimitado.** `depositCap = digits * 10**decimals() / 10**scale` trunca para 0 quando o cap é menor
   que uma unidade-base (ex.: `0.0000001` com ativo de 6 decimais → `1 * 10**6 / 10**7 = 0`). Zero era interpretado
   como **ilimitado** — financeiramente inseguro.
2. **Zeros à esquerda geram literal octal.** `scaleAmount` produzia `digits` com zeros à esquerda (ex.: `0.000001` →
   `"0000001"`), e `0000001 * 10**…` era rejeitado pelo solc como "Octal numbers not allowed" (não compilava).

## Correções (antes → depois)

| Caso | Antes | Depois |
|---|---|---|
| Cap "0" | ilimitado (0) | ilimitado (0) — **sem guard** (inalterado) |
| Cap "500" (6 dec) | `500 * 10**6` | `500 * 10**decimals()` + guard |
| Cap "0.0000001" (6 dec) | trunca para 0 = **ilimitado** | `require(depositCap > 0, "deposit cap is not representable")` → **reverte** |
| Cap "0.000001" (6 dec) | `0000001 * …` (octal, não compila) | `1 * 10**decimals() / 10**6` (compila, = 1 unidade-base) |
| Decimals absurdos | `10**255` estoura (Panic) | `require(asset.decimals() <= 38, "asset decimals out of range")` (razão clara) |

Guard no construtor (Single, via template) e no `portabilize` (Portable, via flag `requireNonZero`), usando o ativo
correto em cada modo (`asset.decimals()` no Single, `IERC20(asset_).decimals()` no Portable). Sem duplicação: o guard do
Single é emitido só no modo Single; nos modos portáveis o `scaled` spec o injeta.

## Matriz de precisão decimal

| Cap (entrada) | digits/scale | 6 decimais | 18 decimais |
|---|---|---|---|
| `0` | ilimitado | 0 (ilimitado) | 0 (ilimitado) |
| `500` | 500/0 | 500e6 | 500e18 |
| `1.5` | 15/1 | 1.5e6 | 1.5e18 |
| `0.000001` | 1/6 | 1 (1 unidade-base) | 1e12 |
| `0.0000001` | 1/7 | **0 → reverte** | 1e11 (representável) |

`scaleAmount` remove zeros à esquerda; `isZero` agora é `digits === ''` após a remoção.

## Invariantes financeiros (estáticos, no Solidity gerado)

- `require(assetsBefore + assets <= depositCap)` — o cap compara o total após o depósito (sem bypass por múltiplos).
- `received = totalAssets() - assetsBefore` — registra o que chegou (fee-on-transfer).
- `require(shares > 0)` / `require(assets > 0)` — zero recusado.
- `require(held >= shares)` — sem resgate acima do saldo.
- `assetsOut = grossAssets - perfFee` — taxa sai do ganho, nunca do principal.
- Overflow de `digits * 10**decimals()` e de `10**decimals()` é **revertido por aritmética checada** (Solidity 0.8.x);
  o `require(decimals <= 38)` dá razão clara antes do overflow.

## Testes

- **`vault-decimals.mjs`** (ampliado): **36 checks, 36 passam** — `scaleAmount` (incl. zeros à esquerda), expressões de
  cap Single/Portable, compilação solc, o guard de cap positivo (zero sem guard, positivo com guard, sub-unidade com
  guard), e os invariantes de contabilidade.
- **Mutações novas** (CAUGHT): "vault: a positive cap can truncate to unlimited again" e "vault: leading zeros are not
  stripped again" (`vault-decimals.mjs`).
- **Regressão:** `vault-builder-ui` 356, `creation-tabs-audit` 302, `golden` 72 idênticos, `compile-generators` 342.

## Compilação e Foundry

- **solc 0.8.24**: Vault Single (caps 0/500/1.5/0.000001/0.0000001) e Portable compilam sem erro (verificado).
- **Foundry**: **não executado** (binário indisponível localmente). O teste de execução (revert do cap sub-unidade) fica
  **marcado como não verificado em runtime** — a evidência aqui é estática (o `require` está no bytecode gerado) +
  compilação. Adicionar/executar a suíte Foundry é trabalho de CI.

## Confirmações de não-mudança

- **Outros 17 geradores:** inalterados (`golden` só difere nos 4 snapshots do Vault, apenas o construtor virou bloco).
- **Redes / tokens / CCTP / gates:** inalterados.
- **SHARE_OFFSET = 1e12:** **inalterado** (mudança arquitetural fora de escopo).
- **Dependências:** nenhuma nova.

## Riscos remanescentes / trabalho separado

- A proteção contra inflação do primeiro depositante e a conformidade ERC-4626 completa continuam fora de escopo
  (documentados na fase 11.2).
- O revert runtime do cap sub-unidade e o overflow precisam de execução Foundry (CI) para verificação transacional;
  não reivindicado localmente.
- O limite `decimals <= 38` é conservador (nenhum token real excede 18; rejeita apenas metadados absurdos).

## Princípio final

**CAPS FINITOS PERMANECEM FINITOS. PRECISÃO DECIMAL EXATA. CONTABILIDADE FINANCEIRA VERIFICADA. SEGURANÇA MULTICHAIN.
ZERO NOVAS REGRESSÕES.**
