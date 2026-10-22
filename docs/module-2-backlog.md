# Fechamento interno do Módulo 2

Revisão de 22 de outubro de 2026. Este documento separa código concluído, prova local e dependências externas.

## Concluído no repositório

| Área | Evidência implementada |
| --- | --- |
| Integração GitHub | handshake PAT, escopos mínimos configuráveis, cadastro, carga inicial e sincronização incremental de commits, branches, PRs e arquivos |
| Webhooks | HMAC por repositório, idempotência, processamento assíncrono, retry seletivo com jitter, estado final coerente e replay autenticado |
| Observabilidade | logs JSON, `X-Request-ID`, correlação pelo `delivery_id`, sanitização de segredos, liveness e readiness de banco/Redis/worker/crypto |
| Credenciais | AES-256-GCM, segredo exclusivo por repositório, versão, expiração, rotação e trilha de auditoria sem persistência de PAT |
| Inteligência | análise de frequência, concentração, picos, atividade fora da janela e clareza de mensagens; provedor externo é opt-in e recebe somente agregados |
| Consumidores | OpenAPI, conteúdo textual sob demanda, diff limitado e proveniência para M3/M4/M5/M7 |
| Frontend | sete tabs navegáveis, jornada real, PAT efêmero em memória, polling pausável, Analytics/Inteligência reais e estados explícitos para o que não possui fonte |
| Qualidade | pytest/coverage, Ruff, Bandit, OpenAPI, lint/build/test do frontend e smoke de health após deploy |

## Não bloqueia o fechamento interno

Estes itens exigem infraestrutura, credenciais ou contrato de outro grupo. Permanecem como integração, não como código ausente do Módulo 2:

- publicar a versão atual e registrar evidência do CI e do smoke no Azure;
- configurar PostgreSQL, Redis, worker, secrets e `MODULE_ENFORCE_WRITE_AUTH=true` no ambiente remoto;
- substituir o gate temporário de sessão/API key pelo JWT/RBAC e `project_id` definidos pelo Módulo 1;
- acordar gateway, CORS e Data Bus com a turma;
- executar E2E compartilhado com os módulos consumidores.

## Decisões de escopo

- GraphQL foi retirado do MVP: REST atende a carga atual e não houve medição que justificasse a complexidade adicional. O ADR 0003 registra a decisão.
- A análise inteligente possui baseline determinístico auditável. Um provedor compatível com chat completions pode enriquecer somente recomendações agregadas quando `AI_INSIGHTS_ENABLED=true`.
- Login e cadastro de usuário permanecem no Módulo 1. PAT GitHub não é identidade da plataforma.

## Critério para declarar produção

O código está concluído e validado localmente. “Produção” só pode ser marcado após push, CI remoto verde, migração remota, readiness verde e um webhook/sync real no ambiente publicado.
