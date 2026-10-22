# Mapa de integração da plataforma acadêmica

O Módulo 2 é a fonte de fatos do GitHub: autentica conexão, recebe webhooks, sincroniza repositórios e oferece dados/proveniência para os demais módulos. Não cria usuários, projetos acadêmicos, avaliações de código, bases RAG, notificações ou relatórios executivos.

## Contratos por módulo

| Origem → destino | O que já pode ser consumido do Módulo 2 | O que ainda precisa ser acordado externamente |
| --- | --- | --- |
| M1 → M2 | gate transitório por sessão/API key | JWT, papéis, `project_id`, `team_id` e repositórios autorizados |
| M2 → M3 Artefatos | commits, branches, PRs, conteúdo UTF-8 sob demanda, SHA/ref/URL | taxonomia e persistência de artefatos no M3 |
| M2 → M4 Code Review | commits, PRs, arquivos e patches limitados com proveniência | identidade do revisor e resultado da avaliação |
| M2 → M5 Curadoria | caminho, conteúdo, autoria, recência e referência imutável | classificação e política de curadoria |
| M2 → M6 Dashboard | métricas, insights, entregas, falhas e timestamps | identidade/projeto e atualização por Data Bus em vez de polling |
| M2 → M7 RAG/Chat | conteúdo/diff, commits, PRs, links e proveniência | chunking, embeddings, ACL institucional e respostas do RAG |
| M2 → M8 Relatórios | frequência, clareza, padrões, gargalos e métricas por período/repositório | contexto de projeto/equipe e DTO executivo compartilhado |

O documento formal do curso descreve oito módulos; o material do laboratório apresenta sete e um API Gateway/Data Bus. Até confirmação do professor, trate o M8 como consumidor possível e não codifique suposições sobre sua implantação.

## APIs públicas do Módulo 2

- descoberta: `GET /api/schema/`, `GET /docs/`;
- operação: `GET /api/v1/health`, `/health/readiness`, `/health/github-connectivity`;
- conexão: `POST /api/v1/github/handshake`, `GET|POST /api/v1/repositories`, `POST /repositories/{id}/sync`;
- fatos: `GET /commits`, `/branches`, `/pull-requests`, `/webhooks/deliveries`;
- consumidores: `POST /repositories/{id}/contents`, `POST /repositories/{id}/commits/{sha}/diff`;
- inteligência: `GET /repositories/{id}/insights`, `/metrics/flow`, `/metrics/dashboard`;
- eventos: `POST /webhooks/github`; replay autenticado em `POST /api/v1/webhooks/deliveries/{uuid}/replay`.

O contrato detalhado, payloads, segurança e limites estão em [integration-guide.md](integration-guide.md).

## O que está fechado internamente

- OpenAPI das rotas implementadas valida sem erros/avisos.
- Conteúdo e diff possuem limites, proveniência e PAT efêmero.
- Analytics/insights possuem baseline determinístico; IA externa é opt-in e recebe somente agregados.
- Webhook possui HMAC, idempotência, retry transitório, falha persistida e replay.
- Segredo possui criptografia, versão, expiração, rotação e auditoria.
- Frontend não inventa dados: mostra estados reais ou “em desenvolvimento”.

## Pendências que dependem da plataforma

1. M1 + M2: fechar JWT, claims, RBAC e associação usuário/projeto/equipe/repositório.
2. Turma: publicar gateway/BFF, CORS e envelope versionado do Data Bus com retry, retenção e DLQ.
3. Operação: disponibilizar ambiente HTTPS, secrets e serviços gerenciados; registrar readiness e E2E real.
4. Grupos consumidores: automatizar testes de contrato contra o OpenAPI e os exemplos deste repositório.

Proposta de claims para discussão — **não implementada como contrato**:

```json
{
  "sub": "user-id",
  "roles": ["developer"],
  "project_id": "project-id",
  "team_id": "team-id",
  "repository_ids": [7],
  "exp": 1792600000
}
```

## Ordem do E2E compartilhado

`login M1 → projeto/repositório autorizado → cadastro/sync M2 → webhook M2 → conteúdo/diff/insights → consumidor M3/M4/M5/M6/M7/M8 → relatório/chat`.

Fontes acadêmicas preservadas no repositório: `references/01-projeto-oficial-microsservicos.pdf` e `references/03-lab-projeto.pdf`.
