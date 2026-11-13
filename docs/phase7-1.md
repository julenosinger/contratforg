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
