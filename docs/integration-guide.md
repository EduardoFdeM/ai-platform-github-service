# Guia de integração — Módulo 2 (GitHub Sync)

Referência dos contratos disponíveis no código em **22 de outubro de 2026**. O módulo recebe e sincroniza fatos do GitHub, expõe conteúdo/diffs sob demanda e produz indicadores auditáveis. Esta documentação não confirma que um ambiente remoto ou credenciais reais estejam ativos.

## Prontidão

| Capacidade | Estado no código | Dependência de ambiente |
| --- | --- | --- |
| REST + OpenAPI/Swagger | concluída e validada | base URL publicada |
| Repositórios, commits, branches e PRs | concluída | GitHub acessível; PAT efêmero para recursos privados |
| Webhooks | concluída | HTTPS público, Redis e worker Celery |
| Conteúdo textual e diff | concluída | permissão GitHub para o recurso solicitado |
| Analytics e inteligência Git | concluída | dados previamente indexados; IA externa é opcional |
| Logs, retry, replay e readiness | concluída | serviços e secrets corretamente configurados |
| Login/JWT/RBAC institucional | fora do Módulo 2 | contrato do Módulo 1 |
| Gateway, CORS e Data Bus compartilhados | integração pendente | acordo entre os grupos |

Dados criados por `seed_demo_data` são somente demonstração local e nunca devem ser apresentados como dados institucionais.

## Endereços e descoberta

Base local padrão: `http://localhost:8000`.

| Recurso | Rota |
| --- | --- |
| OpenAPI 3.0.3 | `GET /api/schema/` |
| OpenAPI JSON | `GET /api/schema/?format=json` |
| Swagger UI | `GET /docs/` |
| API | `/api/v1/...` |
| Webhook preferencial | `POST /webhooks/github` |

`POST /api/v1/webhooks/github` aponta para o mesmo receptor. Configure no GitHub a rota pública sem versão, com HTTPS e `Content-Type: application/json`.

## Segurança para consumidores

- O PAT é aceito apenas no corpo de handshake, cadastro, sincronização, conteúdo ou diff. Ele não é persistido, devolvido nem usado como login da plataforma.
- O segredo do webhook é criptografado em repouso com AES-256-GCM, possui versão, rotação, expiração opcional e auditoria sem texto claro.
- Em produção, use `MODULE_ENFORCE_WRITE_AUTH=true` e `MODULE_API_KEY` para proteger rotas mutáveis até o JWT do Módulo 1 existir. Envie `X-Module-API-Key` entre backends.
- Sessão Django autenticada também satisfaz o gate de escrita. O replay operacional sempre exige usuário autenticado.
- Leituras permanecem abertas no contrato atual, exceto o dashboard autenticado. Exponha a API apenas atrás de uma rede/gateway controlado.
- `X-Request-ID` é aceito/gerado e devolvido na resposta; preserve-o ao correlacionar logs.

Não existe endpoint JSON de cadastro, login ou recuperação de usuário neste serviço. Essas jornadas pertencem ao Módulo 1.

## Catálogo de endpoints

| Método e rota | Proteção | Finalidade |
| --- | --- | --- |
| `GET /api/v1/health` | pública | liveness do processo e banco |
| `GET /api/v1/health/readiness` | pública | banco, Redis, worker e criptografia |
| `GET /api/v1/health/github-connectivity` | pública | conectividade e latência até o GitHub |
| `POST /api/v1/github/handshake` | PAT efêmero | valida identidade e política de escopos |
| `GET /api/v1/repositories` | leitura | lista repositórios ativos |
| `POST /api/v1/repositories` | gate de escrita | cadastra, cifra segredo e tenta carga inicial |
| `POST /api/v1/repositories/{id}/sync` | gate de escrita | sincronização incremental |
| `GET /api/v1/repositories/{id}/insights?days=30` | leitura | clareza, frequência, padrões, gargalos e recomendações |
| `POST /api/v1/repositories/{id}/contents` | gate de escrita | conteúdo UTF-8 com SHA e URL de origem |
| `POST /api/v1/repositories/{id}/commits/{sha}/diff` | gate de escrita | patches limitados por arquivo e proveniência |
| `GET /api/v1/branches` | leitura | branches, inclusive removidas sob opção |
| `GET /api/v1/commits` | leitura | commits paginados e filtráveis |
| `GET /api/v1/pull-requests` | leitura | PRs paginadas e filtráveis |
| `GET /api/v1/metrics/flow` | leitura | contagem de commits por autor |
| `GET /api/v1/metrics/dashboard` | usuário autenticado | KPIs operacionais de 7 ou 30 dias |
| `GET /api/v1/webhooks/deliveries` | leitura | 15 entregas mais recentes |
| `POST /api/v1/webhooks/deliveries/{uuid}/replay` | usuário autenticado | reagenda somente entrega falha |
| `POST /webhooks/github` | HMAC GitHub | recebe evento assinado |

Todas as rotas JSON usam `Content-Type: application/json`. Erros controlados seguem `{"code":"...","detail":"..."}`; automações devem decidir pelo status HTTP e pelo `code`.

## Fluxo de onboarding

1. Obtenha base URL, chave inter-módulos e responsável operacional do ambiente.
2. Exija `GET /api/v1/health/readiness` com HTTP 200; liveness sozinho não prova worker/Redis/crypto.
3. Consulte `/api/schema/?format=json` e gere o cliente a partir do contrato versionado.
4. Liste repositórios e guarde o `id` local; ele referencia as demais rotas.
5. Para repositório privado, envie o PAT somente do backend consumidor e somente na requisição necessária.
6. Preserve `repository`, `sha`, `ref` e `source_url` nas respostas de conteúdo/diff como proveniência.
7. Use webhook ou sincronização como origem dos fatos; `insights` analisa apenas o que já está indexado.

## Handshake e escopos

```http
POST /api/v1/github/handshake

{"token":"<PAT_EFEMERO>"}
```

Resposta 200:

```json
{
  "valid": true,
  "login": "aluno-exemplo",
  "scopes": ["repo"],
  "required_scopes": ["repo"],
  "missing_scopes": [],
  "excess_scopes": [],
  "least_privilege": true
}
```

`GITHUB_REQUIRED_SCOPES` e `GITHUB_ALLOWED_SCOPES` definem a política do ambiente. Escopo obrigatório ausente resulta em 403. O serviço também informa privilégios excedentes para orientar menor privilégio.

## Cadastro e sincronização

```http
POST /api/v1/repositories
X-Module-API-Key: <CHAVE_DO_AMBIENTE>

{
  "url": "https://github.com/organizacao/projeto",
  "token": "<PAT_OPCIONAL>",
  "webhook_secret": "<SEGREDO_UNICO_COM_16_OU_MAIS_CARACTERES>",
  "webhook_secret_expires_at": "2027-01-31T23:59:59Z"
}
```

O 201 contém o repositório, metadados de versão/rotação/expiração e `initial_sync_status`. Um cadastro bem-sucedido não implica carga inicial completa se `initial_sync_status` for `failed`.

```http
POST /api/v1/repositories/7/sync
X-Module-API-Key: <CHAVE_DO_AMBIENTE>

{"token":"<PAT_OPCIONAL>"}
```

Resposta: `{"status":"synced","repository":"organizacao/projeto","commits_synced":42}`. Cada execução lê até 200 commits, 200 branches e 200 PRs e detalha até `GITHUB_COMMIT_DETAILS_LIMIT` commits. O histórico local é preservado; branches ausentes só são marcadas como removidas quando a listagem foi comprovadamente exaustiva.

## Contratos para M3, M4, M5 e M7

### Conteúdo textual

```http
POST /api/v1/repositories/7/contents
X-Module-API-Key: <CHAVE_DO_AMBIENTE>

{"path":"src/app.py","ref":"main","token":"<PAT_OPCIONAL>"}
```

```json
{
  "repository": "organizacao/projeto",
  "path": "src/app.py",
  "ref": "main",
  "sha": "012345...",
  "size": 321,
  "encoding": "utf-8",
  "content": "...",
  "source_url": "https://github.com/organizacao/projeto/blob/main/src/app.py"
}
```

Há rejeição de travessia de diretório, arquivo não textual e conteúdo acima de `GITHUB_CONTENT_MAX_BYTES` (padrão 512 KiB).

### Diff por commit

```http
POST /api/v1/repositories/7/commits/0123456789abcdef/diff
X-Module-API-Key: <CHAVE_DO_AMBIENTE>

{"token":"<PAT_OPCIONAL>"}
```

Cada arquivo retorna `path`, `status`, `additions`, `deletions`, `changes`, `patch` e `truncated`. O patch é limitado por `GITHUB_DIFF_PATCH_MAX_CHARS` (padrão 20.000 caracteres); consumidores devem respeitar `truncated` e a `source_url`.

## Analytics e inteligência Git

`GET /api/v1/repositories/7/insights?days=30` retorna total, nota média de clareza, distribuição de mensagens, frequência por dia/hora/autor, concentração, atividade fora de horário, dias de pico, gargalos, recomendações e avaliação dos commits recentes.

O modo padrão é determinístico e auditável. Quando `AI_INSIGHTS_ENABLED=true`, um provedor compatível com chat completions pode enriquecer recomendações; somente agregados são enviados, nunca conteúdo, diff, PAT ou segredo. `analysis_mode` informa o modo realmente utilizado.

`GET /api/v1/commits` aceita `repository_id`, `author`, `since`, `until` e `page`. `GET /api/v1/branches` aceita `repository_id` e `include_deleted=true`. `GET /api/v1/pull-requests` aceita `repository_id`, `state` e `author`.

## Webhooks, retry e replay

Cabeçalhos obrigatórios: `X-Hub-Signature-256`, `X-GitHub-Event` e `X-GitHub-Delivery`. O receptor identifica `payload.repository.id`, verifica HMAC-SHA256 com o segredo daquele repositório e persiste antes de enfileirar.

| Resposta | Significado |
| --- | --- |
| 202 `accepted` | autenticado e persistido; processamento ainda não terminou |
| 200 `ignored` | `X-GitHub-Delivery` duplicado |
| 400 | UUID, JSON ou repositório inválido/desconhecido |
| 401 | assinatura inválida ou segredo expirado |

O worker repete somente falhas transitórias de banco/rede, com backoff exponencial e jitter. Falhas permanentes ficam registradas como `failed`; o erro é sanitizado. O replay autenticado aceita somente esse estado, volta para `pending` e reaproveita a mesma entrega idempotente.

O cliente GitHub nunca dorme até o reset completo do rate limit. Ele respeita o teto `GITHUB_MAX_RETRY_AFTER` e propaga uma falha transitória para retry controlado.

## Operação e limites

- `GET /health` verifica processo/banco; `GET /health/readiness` verifica banco, Redis, worker e chave criptográfica. Em eager local, Redis/worker não bloqueiam readiness.
- Logs são JSON, incluem request/correlação e removem padrões de token/segredo.
- Webhooks são assíncronos; consulte `deliveries` até `processed` ou `failed`.
- Listas de commits, branches e PRs são paginadas em 50 itens; repositórios e as 15 entregas recentes não são paginados.
- Não há CORS configurado. Frontends de outra origem precisam de gateway/BFF definido pela plataforma.
- GraphQL foi retirado do MVP porque REST atende a jornada atual sem evidência de ganho que compense a complexidade.

## Dependências externas restantes

1. Módulo 1: JWT, papéis, `project_id`, `team_id` e autorização por repositório.
2. Plataforma: gateway/BFF, CORS e envelope de eventos/Data Bus.
3. Operação: URL HTTPS, secrets, PostgreSQL, Redis, worker e evidência de smoke/E2E remoto.
4. Consumidores: testes de contrato M1→M2 e M2→M3/M4/M5/M6/M7/M8.

Consulte também [platform-integration-map.md](platform-integration-map.md), [poc-coverage.md](poc-coverage.md), [youtrack-status-review.md](youtrack-status-review.md) e [DEPLOYMENT.md](../DEPLOYMENT.md).
