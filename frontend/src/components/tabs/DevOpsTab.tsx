import React, { useState } from 'react'
import {
  Rocket,
  CheckCircle2,
  FileCode,
  Download,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Play,
} from 'lucide-react'

export const DevOpsTab: React.FC = () => {
  const [copiedChangelog, setCopiedChangelog] = useState(false)
  const [demoFeedback, setDemoFeedback] = useState<string | null>(null)

  const showDemoFeedback = (message: string) => {
    setDemoFeedback(message)
  }

  const copyChangelog = () => {
    const text = `## Rascunho de changelog — demonstração de interface

Este conteúdo é ilustrativo. A geração automática a partir de User Stories,
pull requests e commits ainda não está integrada a esta tela.

### Fluxos disponíveis no módulo
- Receber webhooks com validação HMAC e idempotência
- Consultar commits e métricas de fluxo
- Conectar e sincronizar repositórios GitHub

### Próximos passos
- Integrar a análise semântica de commits
- Definir a publicação e a rastreabilidade reais da release`
    navigator.clipboard.writeText(text)
    setCopiedChangelog(true)
    showDemoFeedback('Rascunho demonstrativo copiado. Nenhum changelog foi publicado.')
    setTimeout(() => setCopiedChangelog(false), 2000)
  }

  return (
    <div className="view-container">
      {/* Sub-header da Tela 13 */}
      <div className="section-intro-bar">
        <div>
          <h2 className="section-intro-title">Prontidão da release</h2>
          <p className="section-intro-desc">
            Demonstração de interface para esteira, qualidade, documentação e controles de publicação.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-warning">Dados de exemplo • integrações em desenvolvimento</span>
          <button
            className="btn-nexus btn-nexus-primary"
            onClick={() => showDemoFeedback('Publicação é uma ação demonstrativa: nenhum deploy foi iniciado.')}
          >
            <Rocket size={13} />
            <span>Simular publicação</span>
          </button>
        </div>
      </div>

      {demoFeedback && (
        <div
          role="status"
          style={{
            padding: '10px 12px',
            borderRadius: 8,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(96, 165, 250, 0.35)',
            color: '#BFDBFE',
            fontSize: 12,
          }}
        >
          {demoFeedback}
        </div>
      )}

      {/* 5 KPIs de Prontidão da Release */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">RELEASE CANDIDATA</span>
            <CheckCircle2 size={13} style={{ color: '#10B981' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
            Estado demonstrativo
          </div>
          <div className="kpi-sub">publicação ainda não integrada</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">ESTEIRA CI/CD</span>
            <span className="badge badge-info">exemplo</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
            Fluxo modelado
          </div>
          <div className="kpi-sub">build, test, audit</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">QUALITY GATE</span>
            <span className="badge badge-warning">pendente</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#34D399', marginTop: 4 }}>
            Ferramenta não conectada
          </div>
          <div className="kpi-sub">sem resultado remoto nesta tela</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">COBERTURA</span>
            <span className="badge badge-info">exemplo</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#10B981', marginTop: 4 }}>
            71%
          </div>
          <div className="kpi-sub">última referência local</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">CODE FREEZE</span>
            <Lock size={12} style={{ color: '#F59E0B' }} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FBBF24', marginTop: 4 }}>
            Não verificado
          </div>
          <div className="kpi-sub">proteção remota não consultada</div>
        </div>
      </div>

      {/* Grid: Status da Esteira CI/CD + Cobertura de Código */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
        {/* Coluna Esquerda: Status da Esteira CI/CD */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div>
              <div className="nexus-card-title">
                Status da Esteira CI/CD
                <span className="badge badge-success" style={{ marginLeft: 6 }}>
                  Demonstração local
                </span>
              </div>
              <div className="nexus-card-subtitle">
                O workflow versionado executa lint, testes, cobertura e pip-audit. Esta tela não consulta execuções remotas.
              </div>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              dados ilustrativos
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {/* Job 1: Testes unitários */}
            <div
              style={{
                backgroundColor: '#0A0F1D',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 12, color: '#FFFFFF' }}>Testes unitários</strong>
                <span className="badge badge-info">exemplo</span>
              </div>
              <div className="code-box-dark" style={{ padding: 6, fontSize: 10 }}>
                coverage run -m pytest
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                Resultado deve ser conferido na esteira ou localmente.
              </span>
              <span style={{ fontSize: 10, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={11} /> Comando configurado no workflow
              </span>
            </div>

            {/* Job 2: SAST SonarQube */}
            <div
              style={{
                backgroundColor: '#0A0F1D',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 12, color: '#FFFFFF' }}>Auditoria de dependências</strong>
                <span className="badge badge-info">configurada</span>
              </div>
              <div className="code-box-dark" style={{ padding: 6, fontSize: 10 }}>
                pip-audit -r requirements.txt
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                Sem conexão com SonarQube nesta demonstração.
              </span>
              <span style={{ fontSize: 10, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={11} /> Executado pela CI quando configurada
              </span>
            </div>

            {/* Job 3: Dependências pip-audit */}
            <div
              style={{
                backgroundColor: '#0A0F1D',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 12, color: '#FFFFFF' }}>Dependências • pip-audit</strong>
                <span className="badge badge-warning">verificar execução</span>
              </div>
              <div className="code-box-dark" style={{ padding: 6, fontSize: 10 }}>
                ruff check .
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                Não há resultado remoto carregado nesta tela.
              </span>
              <span style={{ fontSize: 10, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={11} /> Gate descrito no workflow
              </span>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Cobertura de Código */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div>
              <div className="nexus-card-title">Cobertura de Código</div>
              <div className="nexus-card-subtitle">Relatório combinado do pytest-cov.</div>
            </div>
            <span className="badge badge-info">referência local</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {/* Donut Chart / Indicador Visual Circular */}
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: 'conic-gradient(#60A5FA 0% 71%, #162035 71% 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: '50%',
                  backgroundColor: '#0D1322',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF' }}>71%</span>
                <span style={{ fontSize: 8.5, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  COBERTURA TOTAL
                </span>
              </div>
            </div>

            <div style={{ width: '100%', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>MÍNIMO EXIGIDO PELO PO:</span>
                <strong style={{ color: '#FFFFFF' }}>70,0%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Fonte:</span>
                <strong style={{ color: '#93C5FD' }}>checagem local</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Atualização automática:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>não integrada</span>
              </div>
            </div>

            <div
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 4,
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: 10.5,
                color: '#34D399',
                textAlign: 'center',
              }}
            >
              Referência visual: confirme a cobertura antes de qualquer release.
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Documentação OpenAPI + Release Code Freeze */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
        {/* Documentação de API Integrada */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div>
              <div className="nexus-card-title">Documentação de API Integrada</div>
              <div className="nexus-card-subtitle">Swagger UI gerado pela especificação OpenAPI 3.0 do serviço.</div>
            </div>
            <span className="badge badge-info">OpenAPI 3.0</span>
          </div>

          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#93C5FD' }}>Swagger UI /docs</span>
              <span className="badge badge-info">rota disponível</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-success" style={{ fontFamily: 'var(--font-mono)' }}>GET</span>
                <code style={{ color: '#FFFFFF' }}>/commits</code>
                <span style={{ color: 'var(--text-tertiary)' }}>Lista commits com filtros e paginação</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-info" style={{ fontFamily: 'var(--font-mono)' }}>POST</span>
                <code style={{ color: '#FFFFFF' }}>/webhooks/github</code>
                <span style={{ color: 'var(--text-tertiary)' }}>Recebe e valida eventos do GitHub</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              className="btn-nexus btn-nexus-secondary btn-nexus-sm"
              onClick={() => showDemoFeedback('Use a rota /api/schema/ para obter a especificação OpenAPI real.')}
            >
              <Download size={11} />
              <span>Baixar openapi.json</span>
            </button>
            <a
              href="/docs/"
              target="_blank"
              rel="noreferrer"
              className="btn-nexus btn-nexus-primary btn-nexus-sm"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={11} />
              <span>Abrir Swagger local</span>
            </a>
          </div>
        </div>

        {/* Release e Code Freeze */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div>
              <div className="nexus-card-title">Release e Code Freeze</div>
              <div className="nexus-card-subtitle">Estado de interface para uma futura janela de publicação.</div>
            </div>
            <span className="badge badge-warning">
              <Lock size={10} style={{ marginRight: 3 }} /> Exemplo de política
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>TAG ATIVA</span>
              <strong style={{ color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>não consultada</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>BRANCH DE PUBLICAÇÃO</span>
              <span className="badge badge-info">main (referência)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>POLÍTICA</span>
              <span style={{ color: '#FBBF24' }}>requer verificação no GitHub</span>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-dim)', borderTop: '1px solid var(--border-default)', paddingTop: 6 }}>
              A proteção de branch não é lida por esta interface.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn-nexus btn-nexus-secondary btn-nexus-sm"
              style={{ flex: 1 }}
              onClick={() => showDemoFeedback('Comparação de tags ainda não está integrada ao GitHub.')}
            >
              <span>Comparar tag</span>
            </button>
            <button
              className="btn-nexus btn-nexus-secondary btn-nexus-sm"
              style={{ flex: 1 }}
              onClick={() => showDemoFeedback('A consulta da proteção da branch é planejada para uma integração futura.')}
            >
              <span>Ver proteção</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seção CHANGELOG.md e Rastreabilidade */}
      <div className="nexus-card">
        <div className="nexus-card-header">
          <div>
            <div className="nexus-card-title">
              <FileCode size={15} style={{ color: '#60A5FA' }} />
              <span>CHANGELOG.md</span>
              <span className="badge badge-info" style={{ marginLeft: 6 }}>✦ rascunho de interface</span>
            </div>
            <div className="nexus-card-subtitle">
              Exemplo de como a rastreabilidade poderá ser apresentada quando essas fontes forem integradas.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={copyChangelog} className="btn-nexus btn-nexus-secondary btn-nexus-sm">
              {copiedChangelog ? <Check size={11} /> : <Copy size={11} />}
              <span>{copiedChangelog ? 'Copiado!' : 'Copiar Markdown'}</span>
            </button>
            <button
              className="btn-nexus btn-nexus-secondary btn-nexus-sm"
              onClick={() => showDemoFeedback('A abertura no GitHub depende de uma integração de release ainda não implementada.')}
            >
              <ExternalLink size={11} />
              <span>Abrir no GitHub</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
          {/* Conteúdo Renderizado do Changelog */}
          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>## Rascunho de changelog</h3>
              <span className="badge badge-info">conteúdo de exemplo</span>
            </div>
            <p style={{ color: 'var(--text-tertiary)' }}>
              Este bloco não representa uma release publicada nem dados coletados automaticamente.
            </p>

            <strong style={{ color: '#93C5FD', fontSize: 12 }}>### Adicionado</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong style={{ color: '#38BDF8' }}>Exemplo</strong> Receber e processar eventos do GitHub
                </span>
                <span className="hash-badge">a confirmar</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong style={{ color: '#38BDF8' }}>Exemplo</strong> Validar assinatura de webhook
                </span>
                <span className="hash-badge">a confirmar</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  <strong style={{ color: '#38BDF8' }}>Exemplo</strong> Publicar consulta de commits
                </span>
                <span className="hash-badge">a confirmar</span>
              </div>
            </div>

            <strong style={{ color: '#34D399', fontSize: 12, marginTop: 6 }}>### Corrigido e protegido</strong>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Conferir resultados e rastreabilidade antes da publicação</span>
                <span className="hash-badge">pendente</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Registrar o artefato depois da integração de release</span>
                <span className="hash-badge">pendente</span>
              </div>
            </div>
          </div>

          {/* Rastreabilidade da Versão */}
          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: 11.5,
            }}
          >
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', display: 'block', marginBottom: 10 }}>
                Rastreabilidade da versão
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pull requests mesclados:</span>
                  <span style={{ color: '#93C5FD' }}>não conectado</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Commits incluídos:</span>
                  <strong style={{ color: '#FFFFFF' }}>a calcular</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Autor da release:</span>
                  <span>não informado</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Artefato:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>não gerado</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12, fontSize: 11 }}>
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={12} /> Aguardando integração de tags
                </span>
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={12} /> Aguardando registro de artefato
                </span>
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={12} /> Aguardando estratégia de rollback
                </span>
              </div>
            </div>

            <button
              className="btn-nexus btn-nexus-primary"
              style={{ width: '100%' }}
              onClick={() => showDemoFeedback('Fluxo de publicação demonstrado. Nenhuma alteração foi enviada.')}
            >
              <Play size={12} />
              <span>Demonstrar publicação</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
