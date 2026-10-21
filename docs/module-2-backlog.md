# Backlog restante exclusivo do Módulo 2

Este recorte contém apenas trabalho que o nosso grupo consegue concluir sem esperar código, contrato ou entrega dos demais módulos. A ordem considera risco funcional antes de expansão visual.

## P0 — fechar antes de chamar o módulo de pronto

| Entrega | Situação atual | Definition of Done |
| --- | --- | --- |
| Completar OpenAPI | cinco funções ainda não possuem resposta inferida e o cadastro usa schema de saída como entrada | schema sem erros, serializers explícitos de entrada/saída e exemplos para todos os status relevantes |
| Sincronizar branches e PRs na carga inicial | modelos, webhooks e endpoints de consulta existem, mas o sync REST inicial traz apenas branch padrão e commits | carga inicial e reconciliação de branches/PRs com paginação e testes |
| Indexar arquivos no sync REST | arquivos alterados entram pelo webhook, mas não pela carga REST | detalhes de commit buscados com limites controlados; `CommitFile` consistente nos dois caminhos |
| Fechar tratamento de falhas de cadastro/sync | o cadastro agora informa `initial_sync_status`, mas faltam estados uniformes nos demais fluxos | envelope de erro estável, logs sem segredos e respostas documentadas/testadas |

## P1 — robustez e operação do nosso serviço

| Entrega | Situação atual | Definition of Done |
| --- | --- | --- |
| Logging estruturado (M2-147) | existe logging pontual, sem configuração JSON/correlação | JSON com nível, timestamp, evento, `repository_id`, `delivery_id`/correlation id; teste sem token/segredo |
| Retry, timeout e recuperação (M2-150) | Celery tenta três vezes com backoff; o cliente GitHub pode bloquear esperando rate-limit | política por tipo de erro, jitter, limites, estado final coerente, reprocessamento manual e testes |
| DLQ/replay de webhooks | entrega pode terminar em `failed`, sem fila morta ou endpoint/comando de replay | mecanismo operacional de replay idempotente, auditoria e documentação |
| Health completo | `/health` verifica banco e outra rota verifica GitHub | checks distintos para banco, Redis, worker, GitHub e configuração criptográfica, com readiness/liveness |
| Política de escopos GitHub (M2-88) | handshake apenas devolve `X-OAuth-Scopes` | escopos mínimos por operação, mensagem de recusa e testes |
| Auditoria e ciclo de credenciais (M2-84, M2-91, M2-92) | segredo é cifrado; não há metadados de rotação/expiração/auditoria | decisão PAT vs GitHub App, expiração/rotação, trilha de alteração e operação segura |
| Deploy reproduzível | Docker/CI/deployment existem no repositório, mas não há prova atual de ambiente funcionando | ambiente do grupo publicado, migrações, Redis/worker, secrets e smoke E2E registrados |

## P2 — completar as experiências da POC com dados reais

| Área | Trabalho exclusivamente nosso |
| --- | --- |
| Sincronização | consumir `branches` e `pull-requests` na interface, com loading, vazio e erro reais |
| Analytics | definir métricas que pertencem ao GitHub Sync e montar gráficos somente sobre endpoints reais |
| Assistente IA (M2-131) | decidir se permanece no recorte; se sim, implementar endpoint, modelo/prompts, limites, segurança e testes antes de trocar “Em breve” |
| DevOps | expor status verificável de CI, cobertura e versão; não mostrar release/deploy sem fonte |
| GraphQL | medir necessidade conforme ADR 0003 e implementar apenas se trouxer ganho na carga inicial; caso contrário registrar retirada do MVP |
| UX | testar responsividade, acessibilidade, estados de erro e jornada completa sem usar dados seed como prova |

## Pode começar agora

Sequência recomendada para as próximas sessões do nosso grupo:

1. Completar OpenAPI e contratos de erro.
2. Sincronizar branches, PRs e arquivos na carga inicial.
3. Fechar logging, retry, replay e health operacional.
4. Conectar branches/PRs no frontend e só então evoluir Analytics.
5. Decidir formalmente GraphQL e IA no recorte final.
6. Publicar e registrar um E2E do nosso módulo isolado.

## Fechado nesta revisão

- Reconciliação de commits tornou-se incremental e não destrutiva: usa o commit local mais recente como `since`, preserva histórico anterior e possui testes para primeira carga e atualização incremental.
- O cadastro deixou de esconder falhas da sincronização inicial e devolve `initial_sync_status`/`initial_sync_detail`.
- A suíte alcançou **29 testes e 82% de cobertura**; o CI agora exige no mínimo 80%, executa lint/build do frontend e análise Bandit do backend.

## Não entra neste recorte

Estes itens precisam dos demais módulos ou de uma decisão compartilhada e, portanto, não bloqueiam o fechamento interno acima:

- login institucional, JWT, RBAC, usuário, turma e projeto do Módulo 1;
- IDs compartilhados de projeto/equipe e autorização entre serviços;
- API Gateway, CORS global e Data Bus da plataforma;
- formato final dos eventos consumidos por M3–M8;
- integração visual/navegação definitiva do portal único.
