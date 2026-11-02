# Política de segurança

## Como reportar

Use o **GitHub Private Vulnerability Reporting** deste repositório (aba *Security* → *Report a vulnerability*).
Não abra uma issue pública com detalhes de uma vulnerabilidade, e não publique um exploit antes de uma correção.

> Nota para o mantenedor: esse recurso precisa ser habilitado em *Settings → Code security* do repositório.
> Este arquivo não cria um e-mail nem uma chave PGP; se você os criar, atualize esta página.

## O que está no escopo

- Os **geradores** (`contractforge-deploy/*.js`) e o **Solidity que eles produzem** (templates, golden files).
- O **proxy de IA** (`api/ai.js`, `functions/api/ai.js`): contorno do controle de origem, do limite de
  requisições ou do controle do servidor sobre o prompt e o modelo.
- O **app** no navegador: contorno do gate de maturidade, dos campos obrigatórios ou das confirmações de
  mainnet; XSS; vazamento de dados.
- Os **workflows** de CI e o script de build do zip.

## O que não está no escopo

- Riscos **já documentados** nas revisões e aceitos como limites do desenho, por exemplo em
  [docs/generators-review.md](docs/generators-review.md), [docs/swap-amm-review.md](docs/swap-amm-review.md),
  [docs/smart-wallet-review.md](docs/smart-wallet-review.md) e nas seções "Fora do escopo" de
  [docs/mainnet-gate.md](docs/mainnet-gate.md) e [docs/ci.md](docs/ci.md). Se você achar que um desses limites é
  mais grave do que está escrito, reporte assim mesmo.
- Contratos que **você** modificou depois de gerá-los, ou conteúdo gerado pela IA (sempre `experimental`).
- Tokens, protocolos e redes de terceiros (por exemplo congelamento de USDC pelo emissor).
- Ataques que exijam controle do navegador ou do `localStorage` do próprio usuário.

**Nenhum template foi auditado por terceiros.** Isso vale mesmo para os marcados como `reviewed`.

## Versões suportadas

Só a branch `main`. Não há versões antigas com correções.

## Prazo de resposta

A intenção (não uma promessa contratual) é confirmar o recebimento em alguns dias e dar um retorno sobre a
gravidade em até duas semanas. Este é um projeto mantido em tempo parcial e não há recompensa financeira.
