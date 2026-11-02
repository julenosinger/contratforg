# Contribuir

## Rodar os testes

```
cd tests
npm ci
npm test                    # precisa do Foundry (anvil) para o Playground
npm run test:swap && npm run test:portable   # Foundry
node slither-check.mjs      # precisa de slither 0.11.6 e solc 0.8.24
```

O CI roda tudo isso em cada push e pull request (`.github/workflows/ci.yml`, instalado a partir de `ci/workflows/`; veja [ci/README.md](ci/README.md) e [docs/ci.md](docs/ci.md)).

## Mudar um gerador

1. Altere o gerador em `contractforge-deploy/app.js` (ou `multideploy.js`).
2. O Solidity gerado é versionado em `tests/golden/`. Rode `node golden.mjs` em `tests/`: ele mostra o que mudou.
   Se a mudança é intencional, rode `node golden.mjs --update` e **revise o diff** antes de commitar.
3. Adicione ou atualize um teste que falhe sem a sua mudança (Foundry em `tests/solidity/test/` para o Solidity,
   `tests/*.mjs` para o app).
4. Rode a suíte inteira. Se o Slither passar a apontar algo, ou uma entrada de `.github/slither-triage.json`
   deixar de se aplicar, atualize a triagem **com uma justificativa escrita**; não ignore detectores em bloco.

## Mudar o nível de maturidade de um template

A regra e o procedimento estão em [docs/mainnet-gate.md](docs/mainnet-gate.md) (seção "Promoting a template").
Resumo: um template só é `reviewed` com um documento de revisão em `docs/` e uma suíte Foundry dedicada com
testes de fuzz ou invariantes; `tests/maturity.mjs` confere isso contra o repositório.

## Pull requests

Mudanças pequenas e focadas, com uma mensagem de commit de uma linha e um corpo que explique o porquê. Não é
preciso (nem possível) configurar segredos para o CI. Não use `ANTHROPIC_API_KEY` em testes.
