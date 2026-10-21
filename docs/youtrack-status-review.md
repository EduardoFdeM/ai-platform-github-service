# Revisão de status do YouTrack — Módulo 2

Esta recomendação usa o código e os testes locais atuais. Mover um cartão para **Done** ainda exige que o critério de aceite do grupo esteja satisfeito; deploy, credenciais e integração externa não foram comprovados por esta revisão.

## Alterações recomendadas agora

| Card | De | Para | Evidência/condição |
| --- | --- | --- | --- |
| M2-85 — URL base customizada | Backlog | Done | `GITHUB_API_BASE_URL` existe no cliente e permite instância privada; validar em ambiente se o aceite exigir GitHub Enterprise real. |
| M2-86 — bundle CA | Backlog | Done | `GITHUB_CA_BUNDLE` é aplicado pelo cliente e possui teste local. |
| M2-90 — segredo via runtime | Backlog | Doing | código depende de `CREDENTIAL_MASTER_KEY`, mas falta prova do secret manager no ambiente de deploy. |
| M2-95 — segredo por repositório | Backlog | Doing | lookup por `github_id` e HMAC por repositório existem; o fallback compartilhado foi removido. Falta aceite multi-repositório em ambiente. |
| M2-97 — branches ignoradas | Backlog | Done | `IGNORE_BRANCHES` existe, padrão `tmp/*`, e o worker aplica a regra. |
| M2-98 — forced push | Backlog | Done | flag do payload é persistida no commit e coberta pelo fluxo de webhook. |
| M2-79 — OpenAPI inicial | Backlog | Doing | `/api/schema/` existe, mas cinco respostas ainda têm inferência incompleta e o POST de repositório precisa schema de entrada próprio. |

## Manter como está

| Cards | Status | Motivo |
| --- | --- | --- |
| M2-83 — handshake PAT | Done | endpoint e tratamento de escopos existem e têm testes. |
| M2-108 — cadastro e sincronização inicial | Done | fluxo real existe; segredo agora é obrigatório. |
| M2-84, M2-88, M2-89, M2-91, M2-92 | Backlog | token temporário, política de escopos, auditoria, expiração e controles de credencial ainda não estão completos. |
| M2-131 — IA de qualidade de commit | To Do | somente interface de ideação; não há backend de IA. |
| M2-147 — logger estruturado | To Do | a interface não comprova logs JSON estruturados em toda aplicação. |
| M2-150 — timeout/retry/backoff | To Do | há partes no cliente/worker, mas falta critério consolidado, observabilidade e teste de resiliência. |

## Novos cards sugeridos

Estes itens vieram da revisão dos documentos do curso e são necessários para integração, mesmo que não estivessem no recorte original:

1. **M1→M2: validar JWT e RBAC por projeto/repositório.**
2. **M2: proteger POST de cadastro/sync e leituras sensíveis.**
3. **M2→M4/M7: expor diff e conteúdo de arquivos com proveniência.**
4. **Plataforma: definir API Gateway/Data Bus e envelope de eventos.**
5. **M2: completar OpenAPI de entrada/saída e testes de contrato.**
6. **M2→M6/M8: publicar métricas e eventos de falha/sincronização.**

## Sobre login e cadastro

Não há login/cadastro de usuário da plataforma neste repositório. `/app` é público. O PAT da aba Autenticação identifica a credencial técnica usada contra o GitHub; ele não autentica o aluno na plataforma. O único endpoint com autenticação de usuário é `/api/v1/metrics/dashboard`, usando sessão Django ou Basic Auth, sem endpoint JSON de login.

Logo, login, cadastro, recuperação de acesso, papéis e associação usuário/projeto devem vir do Módulo 1. Até essa integração existir, não se deve marcar uma US de login institucional como concluída pelo Módulo 2.
