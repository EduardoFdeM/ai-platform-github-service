# Mapa de integração da plataforma acadêmica

Este documento consolida o papel do Módulo 2 à luz dos dois documentos do curso e do código atual. Ele não presume que os outros grupos já publicaram ambientes ou contratos.

## Divergência nos documentos do curso

- O documento formal descreve **oito módulos**, incluindo o Módulo 8 — Relatórios e Indicadores de Alta Gestão.
- A apresentação do laboratório descreve **sete módulos** e mostra um API Gateway/Data Bus, sem o módulo de relatórios.
- Até confirmação do professor, a integração deve considerar o Módulo 8 como consumidor possível e registrar essa decisão na arquitetura compartilhada.

## Responsabilidade do Módulo 2

O GitHub Sync recebe e valida eventos do GitHub, sincroniza repositórios, branches, commits e pull requests e expõe fatos versionáveis para os demais serviços. Ele não deve assumir responsabilidade por login institucional, backlog, avaliação de código, RAG, notificações ou relatórios executivos.

## Dependências entre módulos

| Origem | Destino | Contrato necessário | Estado no Módulo 2 |
| --- | --- | --- | --- |
| M1 Autenticação/Projetos | M2 | JWT/identidade, papel, `project_id`, `team_id` e autorização por repositório | Ausente; bloqueador P0 |
| M2 GitHub Sync | M3 Artefatos | commits, branches, PRs, arquivos alterados e proveniência do repositório | REST parcial; commits/branches/PRs disponíveis, conteúdo de artefato ausente |
| M2 GitHub Sync | M4 Code Review | PR, commits, lista de arquivos, diffs e referência imutável de revisão | PR/commits disponíveis; diff/conteúdo ausentes |
| M2 GitHub Sync | M5 Curadoria | caminhos, linguagem, recência, autoria e conteúdo candidato | metadados parciais; conteúdo/linguagem ausentes |
| M2 GitHub Sync | M6 Dashboard | métricas, entregas, falhas, latência e eventos de atualização | leitura HTTP disponível; evento/alerta compartilhado ausente |
| M2 GitHub Sync | M7 RAG/Chat | commits, PRs, arquivos, links e contexto de projeto com proveniência | dados básicos disponíveis; chunks/conteúdo e escopo de projeto ausentes |
| M2 GitHub Sync | M8 Relatórios | métricas históricas por projeto/equipe/período | métricas básicas disponíveis; contexto institucional e contrato agregado ausentes |

## APIs disponíveis para consumo

- `GET /api/v1/repositories`
- `GET /api/v1/branches?repository_id=<id>&include_deleted=false`
- `GET /api/v1/commits?repository_id=<id>&author=<login>&since=<iso>&until=<iso>`
- `GET /api/v1/pull-requests?repository_id=<id>&state=open&author=<login>`
- `GET /api/v1/webhooks/deliveries?repository_id=<id>`
- `GET /api/v1/metrics/flow?repository_id=<id>`
- `GET /api/v1/metrics/dashboard?repository_id=<id>&days=7` (sessão/Basic no estado atual)

O contrato detalhado, respostas e erros estão em [integration-guide.md](integration-guide.md).

## Lacunas priorizadas

### P0 — necessárias para uma plataforma integrada

1. Definir com o Módulo 1 o JWT compartilhado, claims, RBAC e associação `project_id/team_id/repository_id`.
2. Proteger todas as rotas mutáveis e leituras sensíveis; hoje a maioria usa `AllowAny` por padrão.
3. Publicar o contrato do API Gateway/Data Bus: endereço, autenticação, envelope de evento, versionamento, retry, retenção e DLQ.
4. Expor diffs e conteúdo de arquivos com proveniência para M3, M4, M5 e M7, sem vazar segredos ou repositórios fora do projeto autorizado.
5. Acordar ambiente compartilhado HTTPS e registrar URLs reais. Código local e testes não provam implantação.

### P1 — necessárias para consumo confiável

1. Corrigir as cinco respostas que o OpenAPI ainda não infere e separar serializers de entrada/saída do cadastro de repositório.
2. Normalizar DTOs de erro, paginação e métricas; evitar nomes internos como `author__login`.
3. Definir se GraphQL será realmente implementado ou formalmente retirado da primeira jornada.
4. Publicar eventos de `repository.synced`, `commit.indexed`, `pull_request.updated` e `webhook.failed`, com `event_id`, `occurred_at`, `project_id`, `repository_id`, `schema_version` e `correlation_id`.
5. Criar testes de contrato entre pelo menos M1→M2 e M2→M4/M6/M7.

## Contrato de identidade ainda esperado do Módulo 1

O frontend do Módulo 2 não deve inventar cadastro próprio. Ele espera receber, via gateway ou token validável:

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

Os nomes acima são uma proposta para discussão, não um contrato implementado.

## Ordem sugerida para as próximas sessões

1. M1 + M2: autenticação, contexto de projeto e autorização de repositórios.
2. Plataforma: gateway, CORS/BFF e envelope de eventos.
3. M2 + M4/M7: diff, conteúdo e proveniência.
4. M2 + M6/M8: métricas estáveis, alertas e agregações históricas.
5. Todos os grupos: teste E2E da jornada login → projeto → repositório → webhook/sync → consumidor → relatório/chat.

## Fontes do curso

- [`references/01-projeto-oficial-microsservicos.pdf`](../references/01-projeto-oficial-microsservicos.pdf) — especificação formal com oito módulos.
- [`references/03-lab-projeto.pdf`](../references/03-lab-projeto.pdf) — apresentação do laboratório com sete módulos e desenho de API Gateway/Data Bus.
