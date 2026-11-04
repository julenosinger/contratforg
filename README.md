# ContractForge

Gerador de contratos Solidity que roda no navegador: você preenche um formulário, o app gera o contrato,
compila com solc-js, deixa você testar numa cadeia simulada (Test Lab) e publica com a sua carteira.
Não há backend, exceto uma função pequena que guarda a chave dos recursos de IA.

> **AVISO: nenhum template foi auditado por terceiros.** Os contratos gerados não são recomendações
> financeiras nem garantia de segurança. Cada template tem um nível de maturidade: `reviewed` (revisão
> interna documentada e testes Foundry com fuzz) ou `experimental` (todo o resto, e sempre o que vem da IA).
> Em mainnet, um contrato `experimental` só pode ser publicado depois de uma confirmação explícita.
> Veja [docs/mainnet-gate.md](docs/mainnet-gate.md) antes de usar fundos reais.

## O que tem

- Geradores: token ERC-20, NFT ERC-721, escrow, vesting, assinatura, DAO, smart wallet, staking, swap/AMM
  (pool único e factory), order book, treasury multisig, vault, MultiSend e ponte CCTP.
- Modos multichain (Single, Portable, Multi-deploy, Crosschain): [docs/multichain.md](docs/multichain.md).
- ABI Playground e Test Lab (simulador de EVM no navegador): [docs/test-lab.md](docs/test-lab.md).
- Recursos de IA (auditoria, geração de Solidity, geração de testes) via `/api/ai`.

## Redes suportadas

Lidas de `NETWORKS` em `contractforge-deploy/app.js`.

| Mainnets | Chain ID | | Testnets | Chain ID |
|---|---|---|---|---|
| Ethereum | 1 | | Arc Testnet | 5042002 |
| Polygon | 137 | | Ethereum Sepolia | 11155111 |
| Base | 8453 | | Polygon Amoy | 80002 |
| Arbitrum One | 42161 | | Base Sepolia | 84532 |
| Optimism | 10 | | Arbitrum Sepolia | 421614 |
| Avalanche C-Chain | 43114 | | Optimism Sepolia | 11155420 |
| BNB Chain | 56 | | Robinhood Testnet | 46630 |
| Robinhood Chain | 46623 | | | |
| Arc Mainnet | 5042 | | | |

Nem todas têm USDC, CCTP ou verificação no explorer; veja `docs/multichain.md`.

## Rodar localmente

O app é estático (sem build). Qualquer servidor de arquivos serve:

```
cd contractforge-deploy
python3 -m http.server 8080      # abra http://localhost:8080
```

Sem a função `/api/ai` (ou sem `ANTHROPIC_API_KEY`) os recursos de IA avisam que não estão configurados ou disponíveis. Para testá-los localmente use
`vercel dev` ou `wrangler pages dev` (não foram testados neste repositório) com `ANTHROPIC_API_KEY` definida.

## Testes

Requer Node 24 (o CI usa 24.22.1) e, para os testes que usam um nó local, o Foundry (`anvil`, `forge`).

```
cd tests
npm ci
REQUIRE_ANVIL=1 npm test      # (REQUIRE_ANVIL=1: sem anvil o teste do Playground falha em vez de ser pulado)
                              # compilação de todos os geradores, golden, maturidade, proxy de IA, multichain,
                              # interface, Playground (usa anvil), Test Lab, carregador do solc e o zip
npm run test:swap             # Foundry: regenera as fontes e roda forge test
npm run test:portable         # Foundry: idem, modos portáteis
node slither-check.mjs        # Slither nos contratos gerados (precisa de slither 0.11.6 e solc 0.8.24)
npm run build:zip             # gera ../dist/contractforge-cloudflare.zip e o .sha256
cd .. && python3 tests/mutation-check.py   # (na raiz) desliga cada proteção e espera que algum teste falhe
```

Detalhes, versões fixadas e o que o CI faz: [docs/ci.md](docs/ci.md).

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `contractforge-deploy/` | O app (HTML, CSS e JavaScript sem build). `lab-evm.js` é gerado a partir de `tools/lab-evm/` |
| `api/ai.js` | Função serverless da Vercel (proxy de IA) |
| `functions/api/ai.js` | Pages Function da Cloudflare (mesmo proxy) |
| `tests/` | Testes Node, suítes Foundry (`tests/solidity`), golden files (`tests/golden`), Slither |
| `scripts/` | `build-zip.mjs` |
| `tools/lab-evm/` | Código-fonte do simulador usado pelo Test Lab |
| `docs/` | Revisões de segurança, maturidade, CI |
| `.github/` | Workflows, triagem do Slither, Dependabot |

## Deploy

**Vercel**: importe o repositório sem alterar nada. O `vercel.json` aponta `outputDirectory` para
`contractforge-deploy` e a pasta `api/` vira a função `/api/ai`.

**Cloudflare Pages**: conecte o repositório, *Framework preset* `None`, *Build command* vazio, *Build output
directory* `contractforge-deploy`. A pasta `functions/` na raiz vira `/api/ai`. Alternativa: `npm run build:zip`
e envie `dist/contractforge-cloudflare.zip` (com `index.html` na raiz); funções só rodam pelo Git ou pelo
Wrangler, confirme na documentação da Cloudflare.

Variáveis de ambiente (nenhuma é necessária para o app em si; todas são do proxy de IA):

| Variável | Para quê |
|---|---|
| `ANTHROPIC_API_KEY` | obrigatória para os recursos de IA |
| `AI_MODEL` | opcional |
| `AI_RATE_LIMIT_PER_MINUTE`, `AI_RATE_LIMIT_PER_HOUR` | opcionais (6 e 40 por IP) |
| `UPSTASH_REDIS_REST_URL`/`_TOKEN` (ou `KV_REST_API_URL`/`_TOKEN`), `AI_RATE_LIMITER`, `AI_RATE_LIMIT_KV` | armazenamento do limite de requisições; sem eles o limite é fraco |

Detalhes em [docs/mainnet-gate.md](docs/mainnet-gate.md#3-ai-proxy-apiaijs-functionsapiaijs).

## Revisões de segurança

[Maturidade e gate de mainnet](docs/mainnet-gate.md) · [Treasury, DAO e Vault + segunda passada](docs/generators-review.md) ·
[AMM](docs/swap-amm-review.md) · [Smart wallet](docs/smart-wallet-review.md) · [Auditoria do app](docs/app-audit.md)

Para reportar uma vulnerabilidade: [SECURITY.md](SECURITY.md). Para contribuir: [CONTRIBUTING.md](CONTRIBUTING.md).

## Licença

[MIT](LICENSE).
