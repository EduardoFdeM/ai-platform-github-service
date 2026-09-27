# AI Platform — GitHub Service

Microsserviço responsável pela integração da **AI Platform** com o GitHub.

Este repositório faz parte do projeto desenvolvido na disciplina de **Engenharia de Software** e representa um dos microsserviços da arquitetura da plataforma.

## Objetivo

Centralizar as operações relacionadas ao GitHub, permitindo que a plataforma consulte e, futuramente, execute ações sobre repositórios de forma isolada dos demais módulos do sistema.

## Escopo inicial

O serviço deverá evoluir para suportar operações como:

- conexão com repositórios GitHub;
- consulta de informações de repositórios;
- leitura de arquivos e estrutura de código;
- consulta de commits, branches, issues e pull requests;
- suporte às funcionalidades da AI Platform que dependam de contexto vindo do GitHub.

## Arquitetura

Este repositório representa o **GitHub Service** dentro de uma arquitetura baseada em microsserviços.

```text
AI Platform
│
├── GitHub Service   ← este repositório
├── outros serviços
└── interface da plataforma
```

Cada serviço possui responsabilidade própria e pode evoluir independentemente, mantendo integração com os demais componentes por meio de interfaces bem definidas.

## Status

**Fase inicial / estruturação do projeto.**

Neste momento, o repositório foi criado para estabelecer a base do microsserviço, o fluxo de versionamento e a colaboração entre os integrantes do grupo.

### O que pode ser verificado hoje

O repositório contém a documentação inicial. Ainda não há aplicação executável,
API, testes automatizados ou integração com o GitHub. As operações da seção
"Escopo inicial" descrevem trabalho futuro.

Para acompanhar a implementação, cada pull request deve indicar qual operação
foi adicionada, como executá-la e qual teste demonstra seu comportamento. O
primeiro incremento deve definir um contrato de entrada e saída para consulta
de repositórios antes de conectar os demais módulos da AI Platform.

## Colaboração

O desenvolvimento seguirá fluxo baseado em Git e GitHub:

1. criar uma branch para a alteração;
2. realizar commits;
3. abrir um Pull Request;
4. revisar as alterações;
5. realizar o merge na branch principal.

## Disciplina

**Engenharia de Software — 2026/2**  
Universidade Presbiteriana Mackenzie

**Responsável por este repositório:** Eduardo Ferreira de Mattos
