# Phase 7: endurecer o compilador e dar rotação de owner + fuzz aos templates experimentais

Status: 2026-11-10. Em andamento. Escopo: A compilador; B rotação de owner (erc20, paywall, staking, crosschain V1);
C testes e revisão; D promoção (só o que a regra do `mainnet-gate.md` permitir); E docs finais.

## A. Compilador

### A1. Cache do manifesto e dos binários

**Achado:** `vendor/MANIFEST.json` tem nome fixo e caía na regra `/vendor/*` (immutable de 1 ano). Numa troca de
compilador, quem tivesse o manifesto antigo em cache veria um erro até limpar o cache — e o `vercel.json` nem tinha
regra para `vendor/`.

**Correção:** o manifesto passou a `no-cache, must-revalidate` (regra específica `/vendor/MANIFEST.json`, que vence a
`/vendor/*` por ser mais específica), e os binários versionados continuam `public, max-age=31536000, immutable`. As
mesmas duas regras foram adicionadas ao `vercel.json` (o `source` mais específico vence o `/(.*)`).

**Teste red-green:** `tests/headers.mjs` (novo) prova que `_headers` (Cloudflare) e `vercel.json` (Vercel) carregam as
mesmas regras para o manifesto (no-cache) e para `vendor/*` (immutable). Antes: o `vercel.json` não tinha regra de
vendor e o teste falharia; agora passa (6 checks).

### A2. Oráculo independente (solc nativo)

**Achado:** `tests/reproducible-bytecode.mjs` compara dois arquivos com o mesmo sha256 (o vendido e o do npm), então só
prova determinismo — não prova que o compilador vendido é o solc 0.8.24 verdadeiro.

**Correção:** `tests/native-solc-bytecode.mjs` compila cada contrato distinto de `tests/golden/` com um solc nativo
0.8.24 (de `SOLC_NATIVE` ou do PATH, ex. via `solc-select`) e com o soljson vendido, mesmas configurações do app, e exige
bytecode de criação idêntico **com o CBOR de metadados removido** (o metadado pode diferir entre build nativo e Emscripten
da mesma versão). O sha256 do binário nativo é conferido contra o `list.json` oficial lido em tempo de execução. Sem solc
nativo imprime "NÃO rodei o oráculo nativo" e sai 0; com `REQUIRE_NATIVE_SOLC=1` falha se faltar. Ligado no CI
(`ci/workflows/ci.yml`, job `slither`) com `REQUIRE_NATIVE_SOLC=1`.

**NÃO rodei o oráculo nativo localmente** (sem solc nativo nesta máquina); o teste está escrito e ligado ao CI.

### A3. Verificação fora do app

`scripts/verify-deploy-hash.mjs <arquivo.sol>` compila com o vendor e imprime versão, sha256 do compilador e keccak256 do
bytecode de criação. Documentado no README (seção "Verifique o compilador"), com o sha256 esperado do manifesto.

### A4. Limitação do worker (hash e execução em passos separados)

O worker confere o sha256 num `fetch` e executa por outro (`importScripts` da URL same-origin). Executar os bytes já
verificados exigiria `importScripts(blob:)` (proibido: `blob:` em `script-src`) ou `eval` (proibido: `unsafe-eval`); o
soljson é JS+WASM, então não dá para instanciar só com `WebAssembly`. Mantido como está. A janela entre o fetch e o
`importScripts` é mitigada pelo `Cache-Control: immutable` dos binários (o segundo pedido vem do cache, os mesmos bytes
verificados). Registrado como limitação em `docs/supply-chain.md`.
