# Cadeia de suprimentos do compilador (fase 6)

Status: 2026-11-10. O risco tratado: o solc-js era baixado de CDN em tempo de execução sem hash; um compilador
adulterado geraria bytecode diferente do código mostrado e a carteira assinaria sem perceber. Agora o compilador e o
ethers são auto-hospedados e verificados por hash antes de executar.

## 1. O que carrega de onde — antes e depois

| Recurso | Antes | Depois |
|---|---|---|
| solc-js | `binaries.soliditylang.org` (primário) + `cdn.jsdelivr.net` (fallback), versão 0.8.24 ou 0.8.20, commit descoberto via `list.json` | `vendor/solc/soljson-v0.8.24+commit.e11b9ed9.js` (same-origin), só 0.8.24, sha256 verificado contra `vendor/MANIFEST.json` antes de executar |
| ethers | `cdnjs.cloudflare.com` (5.7.2, com `integrity`) | `vendor/ethers/ethers-5.7.2.umd.min.js` (same-origin), sha256 registrado no manifesto e conferido por `tests/vendor.mjs` |
| WalletConnect | `cdn.jsdelivr.net/@walletconnect/web3-provider@1.8.0` (v1) | removido; conexão só via carteira injetada (EIP-1193) |
| CSP `script-src` | `'self'` + 3 hosts CDN + `'wasm-unsafe-eval'` | `'self' 'wasm-unsafe-eval'` (sem host externo) |

Permanecem como fontes de dados em tempo de execução (não são código): os RPCs e explorers de `NETWORKS`, a cotação
do CoinGecko e o QR (`api.qrserver.com`), todos em `connect-src`/`img-src` e listados no `csp.mjs`.

## 2. Modelo de ameaça

- **Ameaça tratada:** um CDN comprometido (ou um MITM que não quebra TLS) substitui o solc-js. O compilador rodaria
  no worker, geraria bytecode diferente da fonte exibida, e o resumo de deploy não teria como o usuário perceber.
- **Mitigações:** o compilador é auto-hospedado (same-origin, imutável e cacheado), a versão é fixa (só 0.8.24), o
  sha256 do arquivo é conferido contra o manifesto com `crypto.subtle` **antes de executar** (no worker e no fallback
  da main thread), e não há fallback remoto — uma divergência é um erro, não uma chance de baixar outro compilador.
- **O que resta:** quem controla o próprio servidor de origem pode servir um compilador adulterado *e* um manifesto
  que combine. Isso é um comprometimento do servidor (ameaça diferente), e é mitigado pelo resumo de deploy, que
  mostra a versão, o sha256 do compilador e o keccak256 do bytecode de criação para o usuário reproduzir fora do app
  (`tests/reproducible-bytecode.mjs` prova que o vendor e o pacote npm produzem o mesmo bytecode).
- **Pin do commit:** o npm `solc@0.8.24` embute um build Emscripten do commit `e11b9ed9`. O build atual de
  `binaries.soliditylang.org` do mesmo commit tem outro sha256 (o binário foi recompilado desde a publicação do
  pacote); o pacote npm é a fonte de verdade deste repositório, e o teste de bytecode reproduzível é a prova funcional.

## 3. Hashes do manifesto

`contractforge-deploy/vendor/MANIFEST.json`:

| Arquivo | sha256 |
|---|---|
| `solc/soljson-v0.8.24+commit.e11b9ed9.js` | `fb59b825b7d57f9de89cd9de2415b12aab1fcc7eb2573fd2bf5c9b969eacf4d9` |
| `ethers/ethers-5.7.2.umd.min.js` | `a66293a6a2bb4dee061a68612be0be3c5c0ab7e4068ab8d98a4a357baf664c73` |

`tests/vendor.mjs` falha se um arquivo vendido divergir do devDependency pinado ou se o manifesto divergir do arquivo
(um bump do Dependabot exige re-vendorizar). `tests/solc-loader.mjs` prova que o worker confere o hash e recusa em
caso de divergência, e que só a versão fixada compila. `tests/reproducible-bytecode.mjs` compila cada contrato
distinto de `tests/golden/` com o vendor e com o npm e exige bytecode de criação idêntico.

## 4. Como atualizar o compilador ou o ethers

1. Deixe o Dependabot abrir o PR do bump (semver-major abre um PR próprio; minor/patch vêm agrupados).
2. Re-vendorize e re-confira os hashes: `node scripts/vendor-solc.mjs` e `node scripts/vendor-ethers.mjs` (ambos
   reescrevem o `MANIFEST.json`; o de solc também cruza com o `list.json` oficial quando há rede).
3. Se a versão do solc mudou, atualize `SOLC_VERSION` e `SOLC_SHA256` em `contractforge-deploy/app.js` (o teste de
   vendor confere que eles batem com o manifesto).
4. Rode `cd tests && npm test` (em especial `vendor.mjs`, `reproducible-bytecode.mjs` e `solc-loader.mjs`).
5. Confirme no navegador (`REQUIRE_BROWSER=1 node csp-browser.mjs` com Chromium) que a compilação continua sem
   violação de CSP.

## 5. Limitações restantes

- Os RPCs públicos de `NETWORKS` são confiáveis para saldo, gas e logs; o usuário ainda não pode apontar um RPC próprio.
- A cotação do CoinGecko e o QR do `api.qrserver.com` continuam sendo terceiros (dados, não código).
- Nenhum `integrity` é necessário para os arquivos vendidos (são same-origin e conferidos pelo manifesto + teste), mas
  o build do solc e o do ethers dependem de o `scripts/vendor-*.mjs` ter sido rodado após cada bump.
- A verificação é feita no cliente (worker/main thread); ela protege contra CDN adulterado, não contra o próprio
  servidor de origem.
- O teste de bytecode reproduzível carrega o solc duas vezes (uma por compilador) e é o trecho mais lento da suíte
  (~70 s nesta máquina); o job `node` do CI tem limite de 30 minutos, então cabe com folga.

## 6. Decisões que preciso validar

1. **Fonte de verdade do build do solc é o pacote npm**, não o `binaries.soliditylang.org` atual (os dois diferem em
   bytes para o mesmo commit `e11b9ed9`, porque o binário Emscripten foi recompilado). Se você prefere ancorar no
   `list.json` oficial, a re-vendorização deve baixar o build oficial e atualizar o manifesto e o teste.
2. **WalletConnect v1 foi removido.** A v1 está descontinuada e o carregador remoto era mais um host externo. A v2
   exige um `projectId` externo (que eu não inventei); se você quiser a v2, é uma mudança separada, com esse id.
3. **`script-src` sem host externo** (só `'self' 'wasm-unsafe-eval'`). O `'wasm-unsafe-eval'` permanece porque o solc é
   WebAssembly; removê-lo exigiria outro formato de compilador.
4. **O resumo de deploy passa a ser mostrado depois da compilação** (antes ele vinha antes), para incluir o keccak256
   do bytecode de criação; os passos de confirmação em si não mudaram.
5. **Os binários vendidos (~9,5 MB no total) estão commitados** em `contractforge-deploy/vendor/`, separados do código.
   O arquivo do solc tem 8.875.313 bytes, abaixo do limite de 25 MB por arquivo do Cloudflare Pages e do Vercel.
6. **Não há `integrity` nos `<script>` vendidos** (same-origin + manifesto + teste). Se você quiser defesa adicional
   contra o próprio servidor, adicione `integrity` com o sha256 do manifesto — é redundante, mas inócuo.
