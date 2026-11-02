# Workflows do GitHub Actions

Os três workflows ficam aqui, e **não** em `.github/workflows/`, porque o Arc Studio não tem permissão para criar
ou alterar arquivos nessa pasta (o GitHub recusa o push). Para ativá-los, copie-os você mesmo:

**Pelo site do GitHub** (não precisa de nada além da sua conta): em *Add file → Create new file*, digite
`.github/workflows/ci.yml`, cole o conteúdo de `ci/workflows/ci.yml` e faça o commit; repita para `mutation.yml` e
`release.yml`.

**Pelo seu computador**, com um token que tenha o escopo `workflow` (ou SSH):

```
git pull
mkdir -p .github/workflows
cp ci/workflows/*.yml .github/workflows/
git add .github/workflows && git commit -m "ci: install the workflows" && git push
```

Depois disso, mantenha as duas cópias iguais: edite `.github/workflows/*.yml` e copie a mudança para `ci/workflows/`
(ou apague `ci/` quando quiser que a pasta do GitHub seja a única fonte). Veja [docs/ci.md](../docs/ci.md).
