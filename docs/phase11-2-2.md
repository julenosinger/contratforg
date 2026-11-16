# Phase 11.2.2 — Exact decimal representation, safe constructor order & Vault runtime verification

Status: 2026-11-16. Escopo cirúrgico sobre a fase 11.2.1 (commit `a2349c6`): eliminar o **truncamento decimal
silencioso** de caps positivos (não apenas o truncamento para zero) e garantir que a validação ocorra **antes** da
aritmética perigosa. **Zero regressões novas; nenhuma mudança de economia, de outros geradores, de redes, tokens, CCTP,
gates ou dependências.**

## HEADs

- **Inicial:** `a2349c6`
- **Final:** ver commit final (produção + testes + docs em commits separados)

## Arquivos alterados

- `contractforge-deploy/app.js` (`scaleAmount`, novo `scaledCtorLines`, `genVault`)
- `contractforge-deploy/multichain.js` (spec `scaled` do `portabilize`: usa `scaledCtorLines` para `requireNonZero`)
- `tests/vault-decimals.mjs` (ampliado para 37 checks)
- `tests/vault-builder-ui.mjs`, `tests/creation-tabs-audit.mjs` (asserções atualizadas)
- `tests/golden/{arc,arcMain,ethereum,basesep}/genVault.sol` (regenerados — `depositCap` sem inicializador)
- `tests/mutation-check.py` (2 novas mutações)
- `docs/phase11-2-2.md` (este arquivo)

## Causas raiz verificadas (código real)

1. **Truncamento não-zero.** `depositCap = digits * 10**decimals() / 10**scale` trunca quando `scale > decimals`, mesmo
   quando o resultado é **não-zero** (ex.: `1.0000001` com 6 decimais → `1000000`, perdendo o `0.0000001`). O guard
   `require(depositCap > 0)` da 11.2.1 não detecta isso.
2. **Validação depois da aritmética.** O `depositCap` era um inicializador de variável de estado (`uint256 public
   depositCap = …`), que executa **antes** do corpo do construtor; o `require(decimals <= 38)` no construtor não podia
   proteger a exponenciação anterior.

## Correções (antes → depois)

| Caso | Antes | Depois |
|---|---|---|
| `1.0000001` (6 dec) | `1000000` (trunca silencioso) | **reverte** `deposit cap is not representable` |
| `1.0000001` (8 dec) | (não testado) | `100000010` (exato) |
| `0.000001` (6 dec) | `1` | `1` (exato, aceito) |
| `0.0000001` (6 dec) | `0` → guard >0 reverte | reverte (mesmo guard + mod) |
| `1000.250000` (6 dec) | aceito | aceito (zeros à direita ok) |
| `0` | ilimitado | ilimitado (sem guard) |
| Decimals > 38 | Panic | `require(_vltDec <= 38)` antes da exponenciação |

## Algoritmo de escala (exato, sem overflow desnecessário)

`scaledCtorLines(capS, name, tokenExpr)` gera, no **construtor** (não no inicializador):

```
uint8 _vltDec = <token>.decimals();
require(_vltDec <= 38, "asset decimals out of range");
if (_vltDec >= scale) { name = digits * 10**(_vltDec - scale); }
else { require(digits % 10**(scale - _vltDec) == 0, "deposit cap is not representable"); name = digits / 10**(scale - _vltDec); }
require(name > 0, "deposit cap is not representable");
```

- `scale <= decimals`: multiplicação (sempre exata); overflow é genuíno (aritmética checada).
- `scale > decimals`: divide apenas se os dígitos fracionários excedentes forem todos zero (mod); nunca arredonda.
- `_vltDec` é resolvido uma vez e reutilizado; a ordem garante validação antes da exponenciação.

O mesmo helper é usado no Single (`asset`) e no Portable (`IERC20(asset_)`) — **equivalência** garantida por
construção. Os outros geradores que usam `scaled` (nft, paywall, subscription) **não mudaram** (o caminho sem
`requireNonZero` mantém a expressão antiga); o regex do spec passou a aceitar declaração sem inicializador
(`(\s*=\s*[^;]*)?`), retrocompatível.

## Matriz de representação exata

| Cap | 6 dec | 8 dec | 18 dec |
|---|---|---|---|
| `0` | ilimitado | ilimitado | ilimitado |
| `500` | aceito | aceito | aceito |
| `1.5` | aceito | aceito | aceito |
| `0.000001` | aceito (1 unid.) | aceito | aceito |
| `0.0000001` | **rejeitado** | aceito | aceito |
| `1.0000001` | **rejeitado** | aceito | aceito |
| `0.000000000000000001` | rejeitado | rejeitado | aceito |
| `0.0000000000000000001` | rejeitado | rejeitado | **rejeitado** |
| `1000.250000` | aceito | aceito | aceito |

## Testes

- **`vault-decimals.mjs`** (ampliado): **37 checks, 37 passam** — `scaleAmount` (zeros à esquerda), expressão do
  construtor (Single/Portable), compilação solc, representação exata (`1.0000001` rejeitado em 6 dec, sub-unidade
  rejeitada, zeros à direita aceitos), e os invariantes de contabilidade.
- **Mutações novas** (CAUGHT): "vault: a nonrepresentable cap silently truncates again" e "vault: the decimals are not
  validated before the exponentiation" (`vault-decimals.mjs`).
- **Regressão:** `vault-builder-ui` 356, `creation-tabs-audit` 302, `golden` 72 idênticos, `compile-generators` 342.

## Compilação e Foundry

- **solc 0.8.24**: Single (caps 0/500/1.5/0.000001/0.0000001/1.0000001/1000.250000) e Portable compilam sem erro.
- **Foundry**: **não executado** (binário indisponível localmente). A verificação **transacional** (revert de cap
  não-representável, overflow, equivalência Single/Portable em runtime) fica **explicitamente não verificada** — a
  evidência aqui é estática (o `require`/`mod` estão no bytecode gerado) + compilação. Executar a suíte Foundry é CI.

## Confirmações de não-mudança

- **Outros 17 geradores:** inalterados (`golden` só difere nos 4 snapshots do Vault; `scaled` dos demais intacto).
- **Redes / tokens / CCTP / gates:** inalterados.
- **SHARE_OFFSET = 1e12, taxas, fórmulas de share, economia de resgate/ownership:** inalterados.
- **Dependências:** nenhuma nova.

## Riscos remanescentes / trabalho separado

- Verificação runtime (Foundry/EVM) pendente de CI.
- Conformidade ERC-4626 completa e proteção contra inflação do primeiro depositante continuam fora de escopo.
- Limite `decimals <= 38` é conservador (nenhum token real excede 18).

## Princípio final

**REPRESENTAÇÃO DECIMAL EXATA. VALIDAR ANTES DE CALCULAR. PRESERVAR A ECONOMIA DO VAULT. INTEGRIDADE MULTICHAIN. ZERO
NOVAS REGRESSÕES.**
