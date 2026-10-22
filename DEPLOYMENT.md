# Deployment

## Pre-requisitos

- Docker 24+ com Compose v2
- PostgreSQL 16+ e Redis 7+ no ambiente gerenciado
- Secret manager capaz de injetar as variaveis de ambiente

## Variáveis obrigatórias

Use `.env.example` como referência. Em produção, defina `DJANGO_SECRET_KEY`, `POSTGRES_PASSWORD`, `CREDENTIAL_MASTER_KEY`, `MODULE_ENFORCE_WRITE_AUTH=true` e `MODULE_API_KEY` no secret manager. Nunca versione `.env`.

Defina também `GITHUB_REQUIRED_SCOPES` conforme o tipo de repositório. `AI_INSIGHTS_ENABLED` deve permanecer `false` salvo se URL, chave, modelo, privacidade e custo do provedor tiverem sido aprovados; o modo determinístico funciona sem IA externa.

## Subida local

```bash
cp .env.example .env
# Substitua todos os valores `replace-*`.
docker compose up --build -d
docker compose exec app python manage.py createsuperuser
```

## Banco e processos

```bash
docker compose exec app python manage.py migrate
docker compose exec app python manage.py check --deploy
docker compose logs -f app worker
```

O PostgreSQL aplica usuario e senha somente na primeira criacao do volume. Se essas variaveis forem alteradas depois,
atualize a credencial no banco ou recrie explicitamente o volume local quando nao houver dados a preservar.

API e worker devem executar a mesma imagem. O encerramento gracioso do worker usa janela de quinze segundos definida no Compose.

## Critério de saúde

- `/api/v1/health` é liveness e verifica banco.
- `/api/v1/health/readiness` é o gate de tráfego e verifica banco, Redis, worker Celery e chave criptográfica.
- `/api/v1/health/github-connectivity` é diagnóstico externo e não deve reiniciar a aplicação quando o GitHub estiver indisponível.

O Compose inclui healthchecks de PostgreSQL, Redis, app e worker. Em ambiente remoto, só encaminhe tráfego após readiness HTTP 200.

## Migração e smoke pós-deploy

1. Execute `python manage.py migrate` com a mesma versão da aplicação.
2. Confirme `/api/v1/health/readiness`.
3. Confirme `/api/schema/?format=json` e `/docs/`.
4. Faça handshake com um PAT de teste e verifique escopos sem registrar o token.
5. Sincronize um repositório controlado.
6. Envie um webhook assinado e aguarde `processed` em `/api/v1/webhooks/deliveries`.
7. Consulte conteúdo, diff e insights do repositório de teste.

O workflow executa lint, testes backend/frontend, cobertura mínima, OpenAPI, Bandit, auditoria de dependências e um smoke de health após o deploy. O smoke do GitHub Actions e os testes locais são evidências diferentes; não declare produção apenas com execução local.
