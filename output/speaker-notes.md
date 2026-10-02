# AP1 — Módulo 2 — Notas do apresentador

Tempo total estimado: **7min50s**

## Slide 1 — Módulo 2 — Integração e Sincronização com GitHub

- Tempo: 00:25
- Mensagem principal: Abrir posicionando o grupo e o objetivo.
- Fala sugerida: Somos Pedro Cavalcante, Henrique Ribeiro e Eduardo Ferreira de Mattos. Nosso grupo é responsável pelo Módulo 2, que conecta a atividade real no GitHub à plataforma de Assistente Inteligente de Engenharia de Software.

## Slide 2 — A ponte entre GitHub e a plataforma

- Tempo: 00:30
- Mensagem principal: Explicar o papel do módulo.
- Fala sugerida: O GitHub concentra os sinais do trabalho: commits, branches, pull requests e eventos. Nosso módulo recebe, valida, organiza e sincroniza esses dados para que os demais serviços consigam consultar informações confiáveis.

## Slide 3 — Escopo técnico da integração

- Tempo: 00:35
- Mensagem principal: Resumir o perímetro técnico.
- Fala sugerida: O fluxo começa nas APIs e na autenticação, passa por webhooks, persistência e sincronização, e termina em APIs consumidas por analytics, IA e outros módulos. Idempotência, logs, resiliência e testes sustentam o fluxo.

## Slide 4 — Quem usa e quem depende

- Tempo: 00:30
- Mensagem principal: Apresentar os três perfis.
- Fala sugerida: O Product Owner acompanha valor e alinhamento. O gerente ou Scrum Master observa andamento e gargalos. O desenvolvedor produz os eventos capturados e recebe retorno sobre o fluxo. O mesmo dado atende necessidades diferentes.

## Slide 5 — Do escopo ao backlog

- Tempo: 00:35
- Mensagem principal: Explicar a decomposição do trabalho.
- Fala sugerida: No YouTrack, organizamos Epic, Feature e User Story. Os sete Epics cobrem o ciclo do módulo e o levantamento chegou a aproximadamente cem histórias. Esse total representa o universo do produto, não execução simultânea.

## Slide 6 — Roadmap e cronograma

- Tempo: 00:35
- Mensagem principal: Situar a execução no semestre.
- Fala sugerida: O cronograma vai de 28 de agosto a 12 de novembro, cerca de onze semanas. Ele avança da fundação GitHub para webhooks, sincronização, analytics, DevOps e integração final.

## Slide 7 — Priorização: uma trilha funcional

- Tempo: 00:40
- Mensagem principal: Mostrar o recorte end-to-end.
- Fala sugerida: Em vez de tentar implementar cerca de cem histórias ao mesmo tempo, escolhemos uma trilha funcional: handshake, webhook, HMAC, commits, idempotência, persistência, sincronização e APIs. Docker, CI, logs, Swagger e E2E apoiam a entrega.

## Slide 8 — Scrum e Kanban: execução atual

- Tempo: 00:35
- Mensagem principal: Explicar organização e estado atual.
- Fala sugerida: Usamos Scrum para organizar objetivo, prioridade e acompanhamento, e o Kanban para tornar o fluxo visível. Backlog é o universo planejado; To-Do é o recorte priorizado; Doing mostra o trabalho atual; Done registra o concluído.

## Slide 9 — Visão geral da integração

- Tempo: 00:25
- Mensagem principal: Apresentar a tela principal do protótipo.
- Fala sugerida: Esta é a visão operacional da integração: status da sincronização, cobertura do repositório, atividades recentes e diagnóstico. O painel lateral mostra como uma falha pode ser investigada e repetida.

## Slide 10 — Conectividade e autenticação

- Tempo: 00:25
- Mensagem principal: Explicar segurança e permissões.
- Fala sugerida: Aqui o protótipo concentra gestão de credenciais, teste de conectividade, permissões e auditoria. A intenção é tornar explícito o que o token permite e quando ele precisa ser rotacionado.

## Slide 11 — Webhooks em tempo real

- Tempo: 00:25
- Mensagem principal: Mostrar rastreabilidade dos eventos.
- Fala sugerida: O monitor de webhooks acompanha recebimento, validação HMAC, processamento assíncrono e persistência. A inspeção do JSON ajuda a diagnosticar um evento sem perder a visão do fluxo.

## Slide 12 — Indexação e sincronização

- Tempo: 00:25
- Mensagem principal: Explicar carga inicial e delta sync.
- Fala sugerida: Esta tela separa a importação histórica da sincronização incremental. Também evidencia vínculos entre contribuidores e identidades acadêmicas, que precisam ser revisáveis e auditáveis.

## Slide 13 — Analytics e diagnóstico de gargalos

- Tempo: 00:25
- Mensagem principal: Conectar dados a decisões.
- Fala sugerida: Os dados sincronizados alimentam indicadores de fluxo e alertas. O objetivo não é ranquear pessoas, mas detectar esperas sistêmicas, pull requests bloqueados e pontos de atenção para o time.

## Slide 14 — Assistente de IA com supervisão

- Tempo: 00:25
- Mensagem principal: Explicar a camada de assistência.
- Fala sugerida: A IA aparece como apoio: resume a semana, sugere descrição de pull request e verifica requisitos. O protótipo mantém revisão humana e trilha de auditoria antes de compartilhar qualquer saída.

## Slide 15 — DevOps, qualidade e release

- Tempo: 00:25
- Mensagem principal: Fechar o fluxo do protótipo.
- Fala sugerida: A última tela reúne esteira CI/CD, testes, segurança, cobertura, documentação e release. Ela representa o ponto em que integração, qualidade e governança convergem antes da publicação.

## Slide 16 — Estado atual e próximos passos

- Tempo: 00:30
- Mensagem principal: Encerrar com limites honestos.
- Fala sugerida: Já estruturamos escopo, perfis, backlog, cronograma, Scrum e Kanban, priorização e o protótipo. As telas são Figma, não um MVP funcional. Agora o foco é implementar a trilha end-to-end, testar, integrar e preparar o primeiro release.

## Observação sobre o protótipo

As telas 9 a 15 são protótipos Figma/PoC. Elas demonstram a experiência planejada, mas não comprovam um MVP funcional.
