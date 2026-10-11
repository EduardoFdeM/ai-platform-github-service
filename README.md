# AI Platform — GitHub Service (Módulo 2)

Microsserviço responsável pela integração da **AI Platform** com o GitHub: recebimento de webhooks, autenticação e validação HMAC-SHA256, indexação relacional de commits e pull requests, métricas de fluxo e base para recomendações de IA.

Desenvolvido para a disciplina de **Engenharia de Software (2026.2)** — Universidade Presbiteriana Mackenzie.

## Equipe (Módulo 2)
- **Pedro Cavalcante** — 10437298
- **Henrique Ribeiro** — 10401770
- **Eduardo Ferreira de Mattos** — 10402800

---

## Fundação Entregue

- **Django REST Framework** com documentação OpenAPI e Swagger UI em `/docs/`.
- Endpoints de Webhooks: `POST /webhooks/github` e `/api/v1/webhooks/github` com validação de assinatura **HMAC-SHA256**.
- Segredos de webhooks criptografados no banco por repositório com **AES-256-GCM**.
- Idempotência rigorosa via cabeçalho `X-GitHub-Delivery` e enfileiramento assíncrono via **Celery / Redis**.
- Ingestão em segundo plano de eventos de `push` e `pull_request`.
- Modelo relacional normalizado: Repositories, Branches, Contributors, Emails, Commits, CommitFiles, PullRequests e WebhookDeliveries.
- Endpoints REST de consulta: `GET /api/v1/commits` (paginado com filtros), `GET /api/v1/metrics/flow` e verificações de integridade (`GET /api/v1/health` e `GET /api/v1/health/github-connectivity`).
- Dashboard operacional integrado em `/dashboard/`.
- Infraestrutura completa com **Docker Compose**, testes automatizados (**pytest**), SAST (**bandit**), linter (**ruff**) e pipeline de CI no **GitHub Actions**.

---

## Início Rápido

### Com Docker (Recomendado)

```bash
cp .env.example .env
# Configure CREDENTIAL_MASTER_KEY e as variáveis no .env
docker compose up --build -d
docker compose exec app python manage.py createsuperuser
```

Acesse:
- **Swagger UI:** `http://localhost:8000/docs/`
- **Health Check:** `http://localhost:8000/api/v1/health`
- **Latência GitHub:** `http://localhost:8000/api/v1/health/github-connectivity`
- **Dashboard:** `http://localhost:8000/dashboard/`

### Sem Docker (Desenvolvimento Local)

Requer Python 3.12+.

```bash
python -m venv .venv
source .venv/bin/activate  # No Windows: .venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py runserver
```

*(Sem `POSTGRES_HOST`, o projeto utiliza SQLite local; para testes síncronos sem Redis, utilize `CELERY_TASK_ALWAYS_EAGER=true`).*

---

## Registrar Repositório para Webhooks

```bash
docker compose exec app python manage.py register_repository \
  --github-id 123456 \
  --owner minha-organizacao \
  --name meu-repositorio \
  --webhook-secret 'seu-segredo-aqui'
```

Configure o webhook no GitHub apontando para a rota pública `/webhooks/github` com `application/json`.

---

## Qualidade e Testes

```bash
ruff check .
bandit -q -r apps -x apps/github_sync/tests
coverage run -m pytest
coverage report
python manage.py makemigrations --check --dry-run
```

Meta de cobertura de testes: **80%**.

---

## Documentação e Arquitetura

- [Guia de Deployment](DEPLOYMENT.md)
- [Arquitetura e Riscos](docs/architecture.md)
- [Decisões Arquiteturais (ADRs)](docs/adr/)
- [Contexto da AP1 e Backlog](CONTEXTO.md)

