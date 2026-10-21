# Guia de integração — Módulo 2 (GitHub Sync)

Este documento é a referência de integração do **Módulo 2 — Integração e Sincronização com GitHub** da AI Platform. Ele descreve o comportamento que está no código deste repositório em 21 de outubro de 2026. Não confirma que exista um ambiente remoto, credenciais GitHub, Redis, PostgreSQL ou webhook público ativos.

## Escopo e nível de prontidão

| Item | Situação | O que um módulo consumidor pode assumir |
| --- | --- | --- |
| API REST em Django | Implementado e coberto por testes locais | Pode consultar commits, repositórios, entregas e métricas de fluxo quando houver uma instância configurada. |
| Cadastro e sincronização via GitHub REST | Implementado | Depende de uma chamada válida à API GitHub e, para repositórios privados, de um token enviado na própria requisição. |
| Webhooks push e pull_request | Implementado | Exige repositório previamente cadastrado, segredo correspondente e worker Celery/Redis em execução para processamento assíncrono. |
| OpenAPI e Swagger UI | Implementado, mas parcial | Útil para descoberta; este guia e o código são a fonte de verdade para contratos sem serializer/schema explícito. |
| Dados de demonstração | Disponível localmente | seed_demo_data serve somente para demonstração/desenvolvimento; não representa dados institucionais. |
| Autenticação inter-módulos (JWT/OAuth da plataforma) | Não implementada | Não há Bearer/JWT compartilhado, emissão de token ou autorização por papel como contrato público. |
| CORS entre frontends | Não configurado | Um frontend em outra origem não deve presumir que poderá chamar a API diretamente pelo navegador. |
| GraphQL, análise semântica/IA e contratos Pact | Planejado | Não são endpoints nem integrações disponíveis nesta versão. |

O módulo armazena fatos derivados do GitHub (repositórios, commits, branches, PRs e entregas) e métricas simples. Ele **não** é o provedor de identidade, gestão de projetos, chatbot ou recomendações de IA da plataforma.

## Onde acessar

Use o endereço da instância que o grupo responsável disponibilizar. Para um ambiente local padrão, a base é http://localhost:8000.

| Recurso | Rota |
| --- | --- |
| Esquema OpenAPI 3.0.3 | GET /api/schema/ |
| Esquema em JSON | GET /api/schema/?format=json |
| Swagger UI | GET /docs/ |
| API versionada | /api/v1/… |
| Webhook público, sem versão | POST /webhooks/github |

Não há prefixo /api/v1 automático para a rota externa de webhook: as duas rotas POST /webhooks/github e POST /api/v1/webhooks/github chamam o mesmo handler. Para configurar o GitHub, prefira a rota sem versão, desde que a URL seja pública e HTTPS no ambiente escolhido.

## Onboarding de outro módulo

1. Obtenha do grupo Módulo 2 a **base URL do ambiente**, não apenas o endereço local, e confirme GET /api/v1/health.
2. Consulte GET /api/schema/?format=json e compare os endpoints desejados com este guia. O schema atual não descreve integralmente cinco respostas, como detalhado em [Limitações do OpenAPI](#limitações-do-openapi-atual).
3. Para leitura de dados já ingeridos, comece por GET /api/v1/repositories e use o id retornado como repository_id nas demais consultas.
4. Para um fluxo local reproduzível, configure as variáveis de ambiente, execute migrações e, se necessário, python manage.py seed_demo_data. Para processar webhooks reais, suba também Redis e o worker Celery, por exemplo com docker compose up --build.
5. Se o consumidor for outro backend, mantenha chamadas no servidor. Se for um frontend em outra origem, alinhe uma solução de gateway/BFF ou CORS antes de implementar: o projeto não configura cabeçalhos CORS.
6. Nunca registre, exponha em URL ou repasse tokens GitHub e segredos de webhook para outro módulo. Os exemplos abaixo usam marcadores deliberados.

## Autenticação e segurança

### Estado atual

As configurações padrão do Django REST Framework deixam SessionAuthentication e BasicAuthentication disponíveis. A maioria dos endpoints não declara uma permissão própria e, portanto, está acessível sem login pela política padrão AllowAny. A exceção é GET /api/v1/metrics/dashboard, que exige usuário autenticado (IsAuthenticated).

| Mecanismo | Uso atual | Observação para integradores |
| --- | --- | --- |
| Sessão Django (sessionid) | Dashboard e interface/admin locais | Uma sessão requer fluxo de login Django; não existe endpoint de login JSON público neste serviço. Em requisições mutáveis autenticadas por sessão, o CSRF do Django se aplica. |
| Basic Auth | Aceito pelas configurações padrão do DRF | Não há um fluxo documentado de provisionamento de usuários para integração. Não use sobre HTTP. |
| PAT GitHub | Somente no corpo de handshake, cadastro ou sincronização | É usado para chamar o GitHub; o handshake não o persiste, registra ou devolve. Não é autenticação da AI Platform. |
| Segredo de webhook | Apenas na assinatura HMAC recebida do GitHub | É criptografado em repouso com AES-256-GCM; nunca é retornado pela API. |
| JWT/Bearer institucional | Planejado | Ausente. Não enviar Authorization: Bearer esperando autenticação. |

CREDENTIAL_MASTER_KEY é obrigatório para criptografar/descriptografar o segredo de webhook. Deve ser uma chave base64 URL-safe que decodifica para 32 bytes e ser entregue pelo gerenciador de segredos do ambiente. Sua ausência pode fazer operações de cadastro/validação falharem no servidor.

`webhook_secret` é obrigatório no cadastro, deve ter pelo menos 16 caracteres e precisa ser exclusivo por repositório. O serviço rejeita a criação quando o campo está ausente ou curto. Isso não substitui uma política institucional de geração, rotação e entrega de segredos.

## Endpoints REST disponíveis

As rotas abaixo não terminam com barra. Envios JSON devem usar Content-Type: application/json.

| Método e rota | Autorização exigida | Finalidade e resposta principal |
| --- | --- | --- |
| GET /api/v1/health | Não | Confirma apenas acesso ao banco configurado. Retorna 200 ou 503. |
| GET /api/v1/health/github-connectivity | Não | Consulta /meta do GitHub e informa latência. Retorna 200 ou 503. |
| POST /api/v1/github/handshake | Não (PAT no corpo) | Valida um PAT contra /user do GitHub sem persistir o token. |
| GET /api/v1/repositories | Não | Lista repositórios ativos já cadastrados. Sem paginação. |
| POST /api/v1/repositories | Não (PAT opcional no corpo) | Valida um repositório no GitHub, persiste metadados/segredo e tenta carga inicial de commits. |
| POST /api/v1/repositories/{id}/sync | Não (PAT opcional no corpo) | Reconsulta GitHub e sincroniza até 200 commits; pode atualizar/remover commits locais conforme a resposta recebida. |
| GET /api/v1/branches | Não | Lista branches paginadas; aceita repository_id e include_deleted=true. |
| GET /api/v1/commits | Não | Lista commits paginados, com filtros descritos abaixo. |
| GET /api/v1/pull-requests | Não | Lista PRs paginadas; aceita repository_id, state e author. |
| GET /api/v1/metrics/flow | Não | Retorna total de commits e agrupamento por autor. |
| GET /api/v1/metrics/dashboard | Sessão Django ou Basic Auth | Retorna KPIs de dashboard para 7 ou 30 dias. |
| GET /api/v1/webhooks/deliveries | Não | Lista, no máximo, as 15 entregas de webhook mais recentes. |
| POST /api/v1/webhooks/github | Assinatura HMAC válida | Rota versionada do receptor de webhook. |
| POST /webhooks/github | Assinatura HMAC válida | Rota pública equivalente para configuração no GitHub. |

### Saúde e conectividade

```http
GET /api/v1/health
```

```json
{"status":"healthy","database":"up"}
```

Em falha do banco, a resposta é 503 com {"status":"unhealthy","database":"down"}. Isso não verifica Redis, worker, segredo criptográfico nem credenciais GitHub.

```http
GET /api/v1/health/github-connectivity
```

```json
{"status":"up","latency_ms":82.41,"github_status":200}
```

Em falha de rede/timeout contra GitHub, retorna 503 e inclui status: "down", latency_ms e detail. É um diagnóstico ao vivo contra o GitHub configurado, não uma garantia de que a sincronização esteja saudável.

### Handshake de PAT GitHub

```http
POST /api/v1/github/handshake
Content-Type: application/json

{"token":"<PAT_GITHUB_ENVIADO_APENAS_NESTA_REQUISICAO>"}
```

Resposta 200:

```json
{
  "valid": true,
  "login": "aluno-exemplo",
  "name": "Aluno Exemplo",
  "avatar_url": "https://avatars.githubusercontent.com/u/123",
  "scopes": ["read:org", "repo"]
}
```

Erros previstos: 400 se não houver token, 401 para token recusado pelo GitHub, 502 para outra resposta HTTP do GitHub e 503 para indisponibilidade de rede. Os escopos são apenas os informados pelo header do GitHub; o serviço não faz uma política própria de escopos mínimos.

### Repositórios e sincronização

GET /api/v1/repositories retorna uma lista sem paginação:

```json
[
  {
    "id": 7,
    "github_id": 123456789,
    "owner": "organizacao-exemplo",
    "name": "projeto-exemplo",
    "full_name": "organizacao-exemplo/projeto-exemplo",
    "default_branch": "main"
  }
]
```

Para cadastrar, forneça uma URL oficial de github.com, ou owner e name. repository_url é aceito como sinônimo de url.

```http
POST /api/v1/repositories
Content-Type: application/json

{
  "url": "https://github.com/organizacao-exemplo/projeto-exemplo",
  "token": "<PAT_SOMENTE_SE_NECESSARIO_PARA_ACESSO_GITHUB>",
  "webhook_secret": "<SEGREDO_UNICO_DO_WEBHOOK>"
}
```

Com sucesso, retorna 201 e o contrato de repositório acima, acrescido de `initial_sync_status` (`completed` ou `failed`) e, em caso de falha, `initial_sync_detail`. O cadastro chama o GitHub para descobrir github_id, owner, nome e branch padrão e tenta uma sincronização inicial. Um 201 confirma o cadastro; consulte `initial_sync_status` e `/commits` antes de afirmar que a importação terminou.

Erros previstos no cadastro: 400 para URL/owner/nome inválidos; código HTTP repassado pelo GitHub (por exemplo, 404) se o repositório não for encontrado; e 502 para erro de conexão tratado. Não envie segredos em logs, capturas de tela ou comentários de issues.

```http
POST /api/v1/repositories/7/sync
Content-Type: application/json

{"token":"<PAT_OPCIONAL_PARA_REPOSITORIO_PRIVADO>"}
```

```json
{"status":"synced","repository":"organizacao-exemplo/projeto-exemplo","commits_synced":42}
```

Esta implementação lê páginas REST de commits de até 100 itens e para ao atingir 200 itens por execução. Quando já existe histórico local, envia `since` com a data do commit mais recente e faz atualização incremental, sem remover commits antigos que não vieram na janela atual. O limite ainda impede afirmar que uma carga inicial com mais de 200 commits esteja completa. Erros conhecidos: 404 para ID local inativo/inexistente, código HTTP retornado pelo GitHub e 500 para exceções de sincronização não tratadas.

### Commits, filtros e paginação

```http
GET /api/v1/commits?repository_id=7&author=aluno-exemplo&since=2026-10-01T00:00:00Z&until=2026-10-31T23:59:59Z&page=1
```

Filtros implementados: repository_id, author (login), since, until e page. Os três primeiros filtros de data/autor não possuem validação/formato OpenAPI específico nesta versão; use timestamps ISO 8601/RFC 3339 e trate a resposta como uma consulta de leitura. A página padrão tem 50 itens.

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "sha": "0123456789abcdef0123456789abcdef01234567",
      "repository": "organizacao-exemplo/projeto-exemplo",
      "branch": "main",
      "author": "aluno-exemplo",
      "message": "Implementa integração",
      "authored_at": "2026-10-21T14:00:00Z",
      "url": "https://github.com/organizacao-exemplo/projeto-exemplo/commit/0123456",
      "forced_push": false,
      "files": [{"path":"apps/core.py","change_type":"modified"}]
    }
  ]
}
```

change_type pode ser added, modified ou removed. forced_push vem do payload de um webhook push; ele não é calculado pela sincronização REST.

### Branches e pull requests

`GET /api/v1/branches?repository_id=7` retorna branches ativas em resposta paginada. Para auditoria, `include_deleted=true` inclui registros com `deleted_at` preenchido.

`GET /api/v1/pull-requests?repository_id=7&state=open&author=aluno-exemplo` retorna PRs indexadas em resposta paginada, com número, título, estado, autor e datas de abertura, atualização, fechamento e merge. Este contrato não inclui diff, corpo, comentários ou conteúdo dos arquivos; esses campos continuam como lacuna para Code Review e RAG.

### Métricas

GET /api/v1/metrics/flow?repository_id=7 retorna contagem global ou filtrada:

```json
{
  "total_commits": 12,
  "commits_by_author": [
    {"author__login":"aluno-exemplo","commits":8},
    {"author__login":"outro-aluno","commits":4}
  ]
}
```

O nome author__login é o contrato atual, embora seja um detalhe do ORM; não foi normalizado para um DTO público ainda.

GET /api/v1/metrics/dashboard?repository_id=7&days=7 exige sessão Django ou Basic Auth. days aceita somente 7 ou 30; repository_id é opcional e, se ausente, escolhe o repositório configurado ou o primeiro ativo. Retorna 400 para parâmetros inválidos e 404 quando não há repositório ativo.

A resposta inclui repository, period_days, since, until, totais de commits/push/PR, indicadores de SLA, falhas e uma lista recent. Campos derivados como sla_percent, median_merge_hours e processing_within_2m_percent podem ser null quando não há coorte suficiente. Este endpoint é adequado ao dashboard atual, não um contrato estável de analytics para todos os módulos.

### Entregas de webhook

GET /api/v1/webhooks/deliveries?repository_id=7 retorna as 15 mais recentes (sem paginação), na ordem decrescente de recebimento:

```json
[
  {
    "delivery_id":"d6f52720-c872-4e99-8c1f-5b78e5f3e701",
    "event":"push",
    "status":"processed",
    "attempts":1,
    "error":"",
    "received_at":"2026-10-21T14:01:02Z",
    "processed_at":"2026-10-21T14:01:03Z",
    "ref":"main",
    "commits_count":2
  }
]
```

status pode ser pending, processing, processed ou failed. O campo error pode conter informação operacional; não o exiba indiscriminadamente a usuários finais. A ausência de autenticação nesta consulta é uma limitação de segurança a ser resolvida antes de expor a instância fora do contexto controlado.

## Integração de webhook GitHub

### Pré-requisitos

- O repositório precisa estar ativo e cadastrado pelo github_id do GitHub.
- O segredo configurado no webhook do GitHub deve ser o mesmo webhook_secret usado no cadastro e deve ser exclusivo do repositório.
- A URL precisa alcançar uma instância HTTPS pública. Túnel/local é aceitável somente para desenvolvimento.
- Redis e Celery precisam estar ativos para o processamento assíncrono real.

### Cabeçalhos exigidos

| Cabeçalho | Regra |
| --- | --- |
| X-Hub-Signature-256 | Obrigatório. Formato sha256=<hex>, HMAC-SHA256 calculado sobre os bytes brutos do corpo. |
| X-GitHub-Event | Obrigatório para selecionar push ou pull_request; outros eventos são aceitos/persistidos e concluídos sem extratores específicos. |
| X-GitHub-Delivery | Obrigatório. UUID; é a chave de idempotência. |
| Content-Type | Use application/json. |

O receptor localiza payload.repository.id, valida a assinatura usando o segredo daquele repositório e persiste a entrega antes de enfileirar o worker. Respostas imediatas:

| Status | Corpo | Significado |
| --- | --- | --- |
| 202 | {"status":"accepted","delivery_id":"<uuid>"} | Entrega autenticada e aceita; ainda pode falhar no worker. |
| 200 | {"status":"ignored","reason":"duplicate delivery"} | Mesmo X-GitHub-Delivery já havia sido persistido. |
| 400 | {"detail":"Invalid delivery, payload, or unknown repository"} | UUID, JSON, repository.id ou cadastro local inválido/desconhecido. |
| 401 | {"detail":"Invalid signature"} | HMAC ausente, formato incorreto ou assinatura não confere. |

O worker possui até três tentativas com backoff para exceções. Para push, ele ignora branches que correspondem a IGNORE_BRANCHES (padrão tmp/*), indexa commits e arquivos alterados e marca forced_push conforme o payload. Para pull_request, atualiza os dados básicos da PR. Consulte a entrega em /api/v1/webhooks/deliveries para distinguir aceitação (202) de processamento concluído (processed).

Exemplo de construção de assinatura **apenas para teste local** (não coloque o segredo em código de cliente):

```python
import hashlib
import hmac

body = b'{"repository":{"id":123}}'
signature = "sha256=" + hmac.new(
    b"<SEGREDO_LOCAL_DE_TESTE>", body, hashlib.sha256
).hexdigest()
```

## Erros, limites e comportamento operacional

| Tema | Comportamento atual | Implicação para outro módulo |
| --- | --- | --- |
| Formato de erro | Geralmente {"detail":"…"}; handshake também retorna valid: false | Não existe envelope de erro versionado/uniforme. Trate status HTTP primeiro. |
| Paginação | Só GET /commits; 50 itens por página | Siga next/previous; não presuma paginação para repositórios ou entregas. |
| Rate limit GitHub | O cliente aguarda até o reset se X-RateLimit-Remaining for zero | Uma chamada pode ficar bloqueada; defina timeout no consumidor. |
| Timeout para GitHub | Configurável, padrão de 10 segundos por chamada | Falhas podem retornar 502, 503 ou o status do GitHub, conforme endpoint. |
| Sincronização REST | Limita leitura a 200 commits e pode remover SHAs locais ausentes na resposta | Não use como fonte de auditoria completa nem como feed de eventos. |
| Entregas assíncronas | Aceitas antes de processar | Polling de deliveries é a única observabilidade exposta; não há callback/event bus interno publicado. |
| Branches ignoradas | IGNORE_BRANCHES=tmp/* por padrão | Commits dessas branches não entram pelo fluxo push. |
| Disponibilidade | Apenas implementação e testes locais foram verificados neste repositório | Não trate /health ou Swagger local como prova de produção. |

## Limitações do OpenAPI atual

O Swagger UI em /docs/ e o schema em /api/schema/ são gerados por drf-spectacular. A geração atual completa, porém emite erros de inferência de serializer para health, github-connectivity, metrics/dashboard, metrics/flow e repositories/{id}/sync. Por isso, suas respostas e parâmetros podem aparecer como corpo vazio/incompleto no Swagger.

Há também uma diferença relevante no POST /api/v1/repositories: o schema gerado mostra o serializer de saída (github_id, owner, name), mas o handler em execução aceita url/repository_url, owner, name, token e webhook_secret. Até que serializers de entrada/saída explícitos sejam adicionados, este guia e testes do repositório prevalecem para integração.

## Próximos contratos a acordar com a turma

Antes de integrar módulos em ambiente compartilhado, é necessário acordar e registrar, em conjunto, pelo menos:

1. Base URL e dono operacional de cada ambiente (desenvolvimento, homologação e demonstração), inclusive TLS e rotação de segredos.
2. Autenticação institucional compartilhada (por exemplo, JWT validado por todos) e autorização por papel/repositório. A arquitetura registra isso como decisão futura; nada foi implementado aqui.
3. Política CORS/gateway para os frontends e uma forma segura de não expor PATs no navegador.
4. DTOs versionados para métricas e erros, paginação de repositórios/deliveries e contrato OpenAPI completo com testes de contrato.
5. Estratégia de eventos para consumidores: polling, broker/event bus ou callbacks, com retenção e política de reprocessamento.
6. Limites da carga inicial/incremental e semântica de remoção de commits antes de qualquer dashboard tratar o histórico como definitivo.

Consulte também o [mapa de integração entre módulos](platform-integration-map.md), a [cobertura das POCs](poc-coverage.md) e a [revisão do YouTrack](youtrack-status-review.md).

## Referências no repositório

- [Arquitetura e fronteiras](architecture.md)
- [ADR 0003 — REST primeiro, GraphQL seletivo](adr/0003-rest-first-graphql-selective.md)
- [README — execução local e qualidade](../README.md)
- [Guia de deployment](../DEPLOYMENT.md)
- [Contexto e backlog do módulo](../CONTEXTO.md)

### Evidência de validação deste guia

Os endpoints e contratos foram confrontados com config/urls.py, apps/github_sync/urls.py, views, serializers, tasks e testes do repositório. Em 21/10/2026, python manage.py spectacular --validate gerou o schema OpenAPI 3.0.3, mas reportou os cinco grupos de endpoints com serializer não inferido descritos acima. Essa é uma limitação conhecida da documentação gerada, não uma afirmação de indisponibilidade das rotas.
