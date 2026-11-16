# Phase 11.1 — Exact contract selection & deployment integrity

Status: 2026-11-16. Escopo cirúrgico: eliminar a seleção ambígua de contrato em `compileSource`, sem reescrever
geradores, templates, redes ou gates. **Zero mudança de comportamento para os fluxos existentes de contrato único.**

## Root cause (confirmado)

`compileSource()` (app.js) usava `const target = contracts[name] ? name : contractNames[0];` — quando o nome pedido não
batia com o output do compilador, o **primeiro** contrato era escolhido silenciosamente. Isso podia implantar o contrato
errado numa fonte com vários contratos (ex.: saída da IA com um helper antes do contrato principal).

## Correção

1. **`resolveContract(contracts, requestedName)`** (centralizado, em app.js): match exato vence e nunca é substituído;
   sem nome pedido, um único contrato deployable é selecionado; vários exigem escolha explícita (o erro carrega a lista);
   `abstract`/`interface`/`library` (bytecode vazio) não são apresentados como alvo.
2. **`compileSource(name, code, explicitTarget)`**: usa `resolveContract`; o `explicitTarget` (da seleção) vence.
3. **`adoptAiCode`**: extrai **todos** os nomes de contrato (`aiTargets`); quando há mais de um, o alvo deixa de ser
   inferido da ordem de declaração e o seletor entra.
4. **`compileAndDeploy`**: em fonte ambígua, mostra um seletor compacto (`uiContractSelect`, em ui.js, construído com
   `createElement`/`textContent`, sem innerHTML) e recompila com o alvo escolhido; cancelar bloqueia o deploy antes de
   qualquer assinatura.

## Antes vs. depois

| Caso | Antes | Depois |
|---|---|---|
| Gerador de contrato único | match exato | match exato (inalterado) |
| Nome pedido não existe | `contractNames[0]` (silencioso) | erro claro "não encontrado" (sem substituição) |
| Fonte com 1 contrato deployable, sem nome | `contractNames[0]` | seleção determinística do único |
| Fonte com N deployable, sem nome | `contractNames[0]` (silencioso) | erro + seletor (escolha explícita) |
| `abstract`/`interface`/`library` | podia ser o `contractNames[0]` | recusado (sem bytecode) |
| IA com vários contratos | inferia o primeiro | seletor (sem inferência) |

## Testes

- `tests/contract-resolution.mjs` (novo, no `npm test`): 15 checks — match exato, alvo ausente, único/múltiplos
  deployable, `abstract`/`interface`, match explícito vence, integração do `compileSource` multi-contrato (recusa sem alvo,
  resolve com alvo explícito, contrato único sem seletor) e o seletor (renderiza, resolve, cancela).
- `mutation-check.py`: nova mutação "the first contract is silently chosen again" (`contract-resolution.mjs`) — **CAUGHT**.
- Regressão: `compile-generators` 342, `ui` 374, `csp` 235, `innerhtml-lint` OK — inalterados.

## Limitações

- **NÃO rodei forge** (binário indisponível); a execução real das suítes Foundry segue só no CI.
- Nenhum gerador, template, endereço de rede, chain ID, modo de deploy, gate de maturidade ou fluxo de carteira foi
  alterado.
