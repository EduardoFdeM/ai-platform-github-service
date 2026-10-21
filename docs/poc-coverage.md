# Cobertura das POCs no frontend

Este inventário separa o que é uma jornada funcional do Módulo 2, o que é demonstração local e o que ainda depende de contrato com outro módulo. A referência visual são as sete telas da POC/Figma armazenadas em `assets/figma/`.

## Comportamento padrão

- `/` é a página institucional mínima, com entrada para o módulo e links para a documentação.
- `/app` abre a jornada principal do GitHub Sync.
- `/legacy` preserva a entrega anterior.
- A navegação padrão mostra as sete áreas da POC. Analytics, Assistente IA e DevOps abrem estados honestos de **em desenvolvimento/em breve**, sem métricas ou ações fictícias.
- `VITE_SHOW_IDEATION_TABS=true` substitui esses estados pelas prévias completas da ideação para trabalho interno, sempre fora da jornada padrão.
- `VITE_SHOW_PLATFORM_SHELL=true` exibe o shell visual dos demais módulos. Ele fica oculto por padrão porque ainda não há rotas integradas da plataforma.

## Matriz das sete telas

| POC | Estado padrão | Dados/ações reais | Conteúdo mantido como ideação | USs relacionadas |
| --- | --- | --- | --- | --- |
| 07 — Visão geral | Visível | saúde do banco, conectividade GitHub, repositórios, commits, métricas de autores e sincronização manual | taxa de sucesso, pipeline, throughput e diagnóstico de fila | M2-81, M2-107, M2-108, M2-111, M2-114, M2-118 |
| 08 — Autenticação | Visível | handshake de PAT e escopos devolvidos pelo GitHub; PAT não é persistido | GitHub App, rotação, cofre, auditoria e base URL privada | M2-83 real; M2-84, M2-85, M2-88 a M2-92 pendentes/parciais |
| 09 — Webhooks | Visível | lista de entregas, filtros, detalhe, HMAC por repositório e simulador assinado | KPIs de broker/fila e consumidores | M2-93, M2-94, M2-96, M2-104, M2-147, M2-150, M2-169 |
| 10 — Sincronização | Visível | sincronização REST de branches, commits, arquivos e PRs; contagens, autores Git, busca e exportação local | progresso histórico, GraphQL, delta/ETag e vínculo acadêmico automático | M2-107, M2-108, M2-111, M2-114, M2-118 |
| 11 — Analytics | Visível como “em desenvolvimento” | `/metrics/flow`, commits, branches e PRs já formam a base real | risco, carga, sentimento e recomendações avançadas ficam fora da jornada padrão | épico futuro de analytics |
| 12 — Assistente IA | Visível como “em breve” | commits/mensagens/arquivos formam a futura fonte | geração/análise por IA sem endpoint fica fora da jornada padrão | M2-131 |
| 13 — DevOps | Visível como “em desenvolvimento” | links reais para `/docs/` e `/api/schema/`; CI/deployment versionados | release, deploy, cobertura e changelog só voltarão com fonte verificável | M2-139, M2-141, M2-166, M2-167 |

## Jornada demonstrável de ponta a ponta

1. Abrir `/app` e cadastrar um repositório GitHub com um segredo de webhook exclusivo de pelo menos 16 caracteres.
2. Se necessário, validar um PAT na aba Autenticação. O PAT é enviado apenas ao GitHub nessa requisição.
3. Sincronizar o repositório e consultar commits/autores indexados.
4. Configurar no GitHub o mesmo segredo e a URL pública `POST /webhooks/github`.
5. Receber um evento real ou usar o simulador com o segredo digitado novamente.
6. Confirmar a entrega e o commit nas abas Webhooks e Indexação.

## Limites honestos do frontend

- Não existe login/cadastro de usuário da plataforma no Módulo 2.
- Exportações de JSON/CSV, cópia para clipboard e rascunhos das telas de ideação são ações locais do navegador.
- Um `202 Accepted` no webhook confirma recepção, não conclusão do worker; o estado final deve ser consultado em `webhooks/deliveries`.
- Nas áreas conectadas, a interface não completa lacunas do contrato com autores, horários, payloads, headers ou estados inventados. Campos ausentes aparecem como **Não informado**, **Não exposto** ou **Indisponível**.
- A interface não guarda o segredo de webhook depois do fluxo. O usuário deve administrá-lo fora do frontend e configurar o mesmo valor no GitHub.
- Vínculo entre identidade Git e aluno/projeto depende do Módulo 1.

## Próximas integrações de frontend

1. Consumir identidade, projeto, turma e papéis do Módulo 1 e remover dados de perfil estáticos do shell.
2. Reaproveitar `GET /api/v1/branches` e `GET /api/v1/pull-requests`, já conectados na tela de sincronização, quando as métricas reais de Analytics forem definidas.
3. Trocar polling de entregas por contrato de eventos/gateway quando a turma definir o Data Bus.
4. Substituir cada estado “em desenvolvimento” pela tela funcional somente quando endpoint, autorização, estados de erro e teste estiverem disponíveis.
