# AP1 — Engenharia de Software 2026.2

## Grupo
- Pedro Cavalcante — 10437298
- Henrique Ribeiro — 10401770
- Eduardo Ferreira de Mattos — 10402800

## Projeto
Plataforma de Assistente Inteligente de Engenharia de Software, desenvolvida pela turma em arquitetura de microsserviços com IA Generativa/Agêntica.

## Nosso módulo
**Módulo 2 — Integração e Sincronização com GitHub**

Objetivo: integrar a plataforma ao GitHub, transformar eventos e dados dos repositórios em informações estruturadas e disponibilizá-las para os demais módulos.

## Escopo oficial
- conectividade com GitHub via REST/GraphQL;
- autenticação/conexão;
- recepção e tratamento de Webhooks;
- commits, branches e Pull Requests;
- indexação e sincronização de repositórios;
- análise de frequência e padrões de commits;
- identificação de possíveis gargalos;
- recomendações/insights com IA.

## Perfis de usuário
1. Product Owner (PO)
2. Gerente de Projetos / Scrum Master
3. Desenvolvedor / Aluno

## Estrutura do backlog
No YouTrack, o backlog foi organizado em:

**Epic → Feature → User Story**

Principais Epics:
- E0 — Planejamento, Requisitos e Gestão do Projeto
- E1 — Fundação e Conectividade GitHub
- E2 — Webhooks e Processamento de Eventos GitHub
- E3 — Indexação, Persistência e Sincronização de Repositórios
- E4 — IA, Analytics e Inteligência sobre o Fluxo Git
- E5 — Qualidade, DevOps, CI/CD e Observabilidade
- E6 — Arquitetura, Integração, Hardening e Release Final

Foram levantadas aproximadamente 100 User Stories. O objetivo não é implementar todas de uma vez; o grupo priorizou uma trilha funcional end-to-end.

## Kanban atual
Fluxo:

**Backlog → To-Do → Doing → Done**

- Backlog: universo planejado.
- To-Do: User Stories prioritárias selecionadas para desenvolvimento.
- Doing: história efetivamente em implementação.
- Done: histórias concluídas.

Observação: as screenshots atuais ainda podem exibir Epics/Features no Backlog. Para a apresentação, use o board como evidência do processo, mas enfatize To-Do/Doing e a priorização de User Stories. Se houver tempo, substitua o asset do Kanban por um print final filtrado apenas para User Stories.

## User Story atualmente em Doing
**M2-81 — US1.2.018**
Criar endpoint `GET /health/github-connectivity` retornando latência e status do GitHub, permitindo detectar rapidamente falhas internas ou de infraestrutura.

## User Stories prioritárias (coluna To-Do)
As USs abaixo constituem a trilha prioritária atual:

- M2-83 — US1.3.009 — handshake `GET /user` na API do GitHub usando PAT.
- M2-93 — US2.1.019 — endpoint `POST /webhooks/github`.
- M2-94 — US2.1.020 — validação HMAC-SHA256 do webhook.
- M2-96 — US2.2.021 — processar commits de eventos push.
- M2-104 — US2.5.025 — idempotência via `X-GitHub-Delivery`.
- M2-107 — US3.1.030 — modelo relacional normalizado para dados Git.
- M2-111 — US3.2.028 — carga inicial do histórico de commits.
- M2-114 — US3.3.031 — sincronização incremental usando `since`.
- M2-118 — US3.5.052 — endpoints de commits e métricas/flow.
- M2-131 — US4.4.040 — IA para avaliar clareza semântica de mensagens de commit.
- M2-139 — US5.2.044 — Dockerfile multi-stage.
- M2-141 — US5.3.046 — pipeline de CI com GitHub Actions.
- M2-147 — US5.6.051 — logging estruturado em JSON.
- M2-150 — US5.7.016 — timeout, retry e exponential backoff.
- M2-166 — US054 — Swagger UI/documentação dos endpoints.
- M2-167 — US059 — `DEPLOYMENT.md` com requisitos e comandos.
- M2-169 — US097 — teste E2E do fluxo completo.

## Fluxo funcional prioritário
GitHub
→ autenticação / handshake
→ Webhooks
→ validação HMAC
→ eventos de commit
→ idempotência
→ persistência
→ carga inicial + sincronização incremental
→ APIs de consulta
→ analytics / IA
→ consumo pelos demais módulos.

Em paralelo:
Docker + CI/CD + logging + resiliência + Swagger + deployment + E2E.

## Cronograma
Planejamento no YouTrack:
- início: 28/08/2026
- término: 12/11/2026
- duração aproximada: 11 semanas

## Protótipo Figma
Existe um protótipo/PoC no Figma, mas os assets ainda serão adicionados posteriormente.

Quando os arquivos estiverem disponíveis, adicionar:
- `assets/07-figma-overview.png`
- `assets/08-figma-flow.png`

O Figma deve ser apresentado como **protótipo/PoC**, não como MVP funcional.

## GitHub
Se houver screenshot do repositório/README/primeiro commit, adicionar como:
- `assets/09-github.png`

## AP1
A apresentação parcial deve resumir as entregas realizadas até agora e durar entre 5 e 10 minutos. O deck deve privilegiar evidências reais do trabalho: YouTrack, Gantt, Kanban e Figma.
