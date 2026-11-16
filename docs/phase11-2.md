# Phase 11.2 — Vault decimal integrity, ERC-4626 compliance & multichain safety

Status: 2026-11-16. Escopo cirúrgico sobre a fase 11.1.4 (commit `77c6399`): eliminar a suposição de 6 decimais no
deposit cap do Vault (Single vs. Portable), auditar a contabilidade e o grau de conformidade ERC-4626, sem mudar o
comportamento econômico pretendido. **Zero regressões novas; nenhuma mudança em outros geradores, redes, tokens, CCTP,
gates ou dependências.**

## HEADs

- **Inicial:** `77c6399`
- **Final:** ver commit final (produção + testes + docs em commits separados)

## Arquivos alterados

- `contractforge-deploy/app.js` (`genVault`, `scaleAmount`, strings de UI do Vault)
- `contractforge-deploy/multichain.js` (spec `scaled` do `portabilize`)
- `tests/vault-decimals.mjs` (novo)
- `tests/golden/{arc,arcMain,ethereum,basesep}/genVault.sol` (regenerados)
- `tests/creation-tabs-audit.mjs`, `tests/vault-builder-ui.mjs` (asserções atualizadas)
- `tests/package.json`, `tests/mutation-check.py`
- `docs/phase11-2.md` (este arquivo)

## Causa raiz verificada (código real)

`genVault()` (modo Single) gerava `uint256 public depositCap = ${cap} * 10**6;` — **6 decimais fixos** — enquanto o
modo Portable (via spec `scaled` do `portabilize`) escalava por `10**decimals()`. Confirmado no template (linha 2223
original) e no comentário `// 0 = unlimited (assumes a 6-decimal asset)`. Além disso, `cap` fracionário no Single
gerava Solidity inválido (`1.5 * 10**6` não é literal inteiro) — só o Portable tratava fração (`digits * 10**decimals()
/ 10**scale`).

## Interpretação da unidade do deposit cap

`vault_cap` é **unidades legíveis do ativo** (ex.: "500" = 500 USDC). O contrato converte para **unidades-base** no
momento da implantação, multiplicando por `10**decimals()` do ativo. Esta interpretação é **preservada** — a correção
só troca o `10**6` fixo por `10**decimals()` dinâmico (e corrige o fracionário no Single). Nenhum contrato já
implantado muda; o bytecode de Vaults **novos** muda (a expressão de inicialização do `depositCap` e a adição de
`decimals()` à interface).

## Antes vs. depois

| Caso | Antes (Single) | Depois (Single) |
|---|---|---|
| Cap inteiro | `500 * 10**6` (6 dec fixo) | `500 * 10**uint256(asset.decimals())` |
| Cap fracionário | `1.5 * 10**6` (não compila) | `15 * 10**decimals() / 10**1` |
| Cap zero | `0 * 10**6` | `0` (ilimitado) |
| Interface IERC20 | sem `decimals()` | com `decimals()` |
| Aviso de UI | "assumes 6 decimals" | removido (escala pelo próprio ativo) |

O modo Portable **não mudou** (já usava `asset_.decimals()`); apenas o spec `scaled` foi refatorado para um helper
compartilhado (`scaleAmount`) e o regex passou a casar a nova declaração (sem efeito nos outros 4 geradores que usam
`scaled`: nft, paywall, subscription — verificado por `golden.mjs`, que só difere no Vault).

## Matriz de compatibilidade de decimais

| Decimais do ativo | Cap "500" → base units | Compila? |
|---|---|---|
| 6 (USDC padrão) | 500_000_000 | sim |
| 8 | 50_000_000_000 | sim |
| 18 (ETH, BNB-USDC) | 500 × 10^18 | sim |

O `SHARE_OFFSET = 1e12` é um **offset de precisão fixo** (comentário esclarecido), não uma suposição de decimal; ele
não foi alterado (mudança arquitetural exigiria aprovação separada).

## Matriz de conformidade ERC-4626 (auditoria honesta)

O Vault é **"ERC-4626-style", não totalmente conforme**. Implementa:

- `asset()` (getter público), `totalAssets()`, `convertToShares()`, `convertToAssets()`, `deposit(assets, receiver)`,
  `redeem(shares, receiver)`.

Não implementa (documentado, fora do escopo desta fase):

- `maxDeposit/mint/withdraw/redeem`, `previewDeposit/mint/withdraw/redeem`, `mint()`, `withdraw()` (com `owner`).

Extensões não-padrão: `depositWithMin`/`redeemWithMin` (slippage), taxa de performance (`PERF_FEE_BPS`, `accruedFees`,
`costBasisOf`, `claimFees`), `setDepositCap`, ownership em dois passos. **Não rotulado como totalmente conforme**; a
conformidade completa exigiria redesenho (novas funções e semântica de shares) — documentado como fase separada.

## Invariantes financeiros verificados (no Solidity gerado)

- `require(assetsBefore + assets <= depositCap)` — o cap compara o total após o depósito (não apenas o valor entrante),
  evitando bypass por múltiplos depósitos.
- `received = totalAssets() - assetsBefore` — registra o que realmente chegou (seguro contra fee-on-transfer).
- `require(shares > 0)` / `require(assets > 0)` — operações de valor zero recusadas.
- `require(held >= shares)` — não resgata mais shares que o saldo.
- `assetsOut = grossAssets - perfFee` — a taxa sai do ganho bruto, nunca do principal.
- Aritmética inteira com `require` (revert) em toda parte; nenhum ponto flutuante.

## Testes

- **Novo** `tests/vault-decimals.mjs`: **25 checks, 25 passam** — `scaleAmount`, expressões de cap Single/Portable,
  compilação solc para caps 0/500/1.5/1000.25/999999999, e os invariantes de contabilidade.
- **Mutações novas** (CAUGHT): "vault: the deposit cap reverts to hardcoded six decimals" e "vault: the deposit cap
  ignores the assets already held" (`vault-decimals.mjs`).
- **Regressão:** `vault-builder-ui` 356, `creation-tabs-audit` 302, `golden` 72 idênticos, `lab` 73, `wizard` 295,
  `deploy-overview` 240, `header-home` 190, `compile-generators` 342.

## Compilação e Foundry

- **solc 0.8.24**: o Vault Single (caps 0/500/1.5/1000.25/999999999) e Portable compilam sem erro (verificado no
  `vault-decimals.mjs` e no `compile-generators.mjs`).
- **Foundry**: **não executado** (binário indisponível localmente). As suítes `Hardening.t.sol` (Vault) e
  `Portable.t.sol` seguem só no CI. A geração do Vault portable (`solidity/src/portable/Vault.sol`) **não muda**
  (o modo Portable já usava `decimals()`), então as suítes Foundry existentes não são afetadas.

## Confirmações de não-mudança

- **Outros 17 geradores:** inalterados (`golden` só difere nos 4 snapshots do Vault).
- **Redes / tokens / CCTP:** inalterados (nenhum chain ID, RPC, endereço, decimal ou domínio mudou).
- **Gates de segurança / infraestrutura 11.1.x:** inalterados.
- **Dependências:** nenhuma nova.

## Riscos remanescentes / trabalho proposto separadamente

- **Proteção contra inflação do primeiro depositante** (SHARE_OFFSET = 1e12): mantida como está; para ativos de 18
  decimais a proteção por unidade é mais fraca. Alterar o offset (ex.: escalar por decimais) é mudança arquitetural e
  econômica — **fase separada**.
- **Conformidade ERC-4626 completa** (`mint`/`withdraw`/preview/max): **fase separada**.
- **Arredondamento de caps sub-unidade-base** (ex.: cap "0.0000001" com ativo de 6 decimais arredonda para 0 =
  ilimitado): comportamento pré-existente do `scaled`, herdado pelo Single; documentado, não corrigido nesta fase.
- **Foundry**: não executado localmente.

## Princípio final

**UNIDADES DE ATIVO EXATAS. CONTABILIDADE DE SHARES SEGURA. COMPORTAMENTO ERC-4626 VERIFICADO. INTEGRIDADE DE GÁS
MULTICHAIN. ZERO NOVAS REGRESSÕES.**
