# Phase 7.1: "Ficar verde"

Status: 2026-11-13. Sem funcionalidade nova. Objetivo: `npm test` verde do início ao fim, suítes Foundry que ao menos
compilam, maturidade honesta e um bug do chat corrigido. Achados de uma revisão externa que quebrariam o CI na primeira
execução.

## A. Oráculo nativo

**Achado:** `tests/native-solc-bytecode.mjs` procurava `['solc','solcjs']`; sob o npm, `node_modules/.bin` está no PATH e
traz o `solcjs` (o build Emscripten, o mesmo soljson do vendor), que era escolhido como "nativo" e quebrava o script
(SyntaxError). Reproduzido (raiz): `spawnSync('solcjs', ['--version'])` no Linux resolve o wrapper `/bin/sh` e reporta
"0.8.24+commit.e11b9ed9.Emscripten.clang".

**Correção:** só `solc` (ou `SOLC_NATIVE`) conta, e o `--version` precisa ser um build nativo de verdade. O classificador
foi extraído para `tests/native-solc-version.mjs` (`isNativeSolcVersion`): rejeita qualquer string com "Emscripten" e exige
`.PLATAFORMA.COMPILADOR` (`Linux.g++`, `Darwin.appleclang`, `Windows.msvc`, etc.).

**Teste:** `tests/native-solc-oracle.mjs` (novo, no `npm test`) testa o classificador com strings reais
("Linux.g++" aceita, "Emscripten.clang" rejeitada, sem marca rejeitada, marca dentro de linha maior) e roda o script com
`node_modules/.bin` no PATH, exigindo saída 0 e a mensagem "NÃO rodei o oráculo nativo".

**CI:** `ci/workflows/ci.yml` já estava correto: `REQUIRE_NATIVE_SOLC=1` só no job `slither` (que instala solc via
solc-select), nunca no job `node` (que roda `npm test`, onde o oráculo apenas pula). Nenhuma mudança de CI necessária.

## B. Suítes Foundry

**Achado:** `Staking.t.sol` e `Paywall.t.sol` acessavam variáveis de estado públicas do handler sem chamar o getter
(`h.tok`, `h.staking`, `h.paywall`), o que em Solidity resolve para a *função* do getter, não para o valor — TypeError
(confirmado compilando com o npm solc). Como o forge compila o diretório inteiro, todas as suítes falhariam.

**Correção:** `h.tok` → `h.tok()`, `h.staking` → `h.staking()`, `h.paywall` → `h.paywall()` nas invariantes.

**Teste:** `tests/compile-foundry-tests.mjs` (novo, no `npm test`): roda o dump e compila cada `tests/solidity/test/*.t.sol`
com o npm solc 0.8.24 (standard JSON, evmVersion cancun, imports resolvidos em `solidity/src` e `test/`), falhando com
arquivo e linha em qualquer erro. Antes: `Staking.t.sol` e `Paywall.t.sol` com TypeError; agora: 18 suítes + a checagem de
contagem = 19 passed.

**Releitura das quatro suítes** (Erc20, Paywall, Staking, Crosschain) procurando erros de lógica que só a execução revela:
- pré-condições dos handlers: `fund()` no StakingHandler minte/approva o próprio handler (que é o owner) antes de
  `fundRewardPool`, então o pool é de fato financiado; `rotate` usa try/catch e a primeira rotação tira o handler do papel
  de owner (as mints seguintes revertem e são engolidas por `fail_on_revert=false`, sem quebrar as invariantes);
- invariantes: `sum(balanceOf) == totalSupply` (Erc20) e `balance >= totalStaked + rewardPool` (Staking) valem porque os
  atores são os únicos que seguram tokens e as taxas ficam em `accruedFees` (que só reforça o `>=`);
- fundos iniciais: o Erc20 default tem `supply=0` (a invariante parte de 0); o Staking minte 1_000_000e6 por ator;
- limites de fuzz: `_bound` já limita transfer/stake/approve aos saldos; os valores grandes não estouram (uint256).

Nenhum outro erro de lógica encontrado. **NÃO rodei forge** (binário indisponível nesta máquina); os pontos que só o CI
confirma são a execução real dos handlers/invariantes (o compile-foundry-tests só garante que compilam).

## C. Maturidade honesta

**Achado:** erc20, paywall e staking foram promovidos a `reviewed` com suítes que nunca rodaram (o próprio doc da fase 7
admite "NÃO rodei forge") e duas que nem compilavam.

**Correção:** os três voltaram a `experimental` em `maturity.js` (motivo: "Foundry suite written but not yet executed in
CI; re-evaluate with evidence"). `tests/maturity.mjs` (conjunto reviewed e lista "fica experimental"), a tabela de
`docs/mainnet-gate.md`, o README (definição de `reviewed` agora exige a execução no CI), `docs/phase7.md` (cabeçalho e
seção D) e `docs/generators-review.md` (seção fase 7) foram atualizados. `node golden.mjs --update` mudou **só** as linhas
de carimbo dos três (12 arquivos, `reviewed` → `experimental`).

**Regra nova em `docs/mainnet-gate.md`:** para ser `reviewed`, a suíte Foundry precisa ter **passado no CI**, com o link ou
id da execução registrado no doc de revisão. Nenhum outro nível foi mexido.

## D. Chat: órfão e erro no contexto

**Achado (reproduzido):** `aiChatSend` salvava a mensagem do usuário antes da chamada; se a aba fechava durante a espera,
a conversa guardava um `user` órfão e o envio seguinte mandava `user,user` (o proxy recusa e a conversa trava). Mensagens
"Error: …" do assistente também voltavam ao modelo como contexto.

**Correção:** a montagem do request saiu de `aiChatSend` para `aiBuildRequestMessages`, que (1) exclui `kind 'tool'` e
`kind 'error'`; (2) une mensagens consecutivas do mesmo papel com `\n\n`; (3) descarta um início com assistant; (4) garante
que a última é user; (5) só então corta nas últimas 20 sem quebrar a alternância. Falhas são gravadas como assistant com
`kind:'error'`. `aiValidMessage`/`aiLoad` agora validam `kind` (`'tool'`/`'error'`/ausente) e descartam o resto.

**Teste (ui.mjs):** órfão + novo envio vira um único turno com conteúdo unido; erro anterior não entra no pedido; histórico
começando em assistant é aparado; `kind` inválido é descartado; conversa válida continua idêntica. Reprodução antes:
"roles sent: user,user"; depois: "roles sent: user" com conteúdo unido.

**Mutação:** "consecutive same-role messages are not merged" (`ui.mjs`) — **CAUGHT**.



