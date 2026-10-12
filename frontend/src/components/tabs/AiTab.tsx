import React, { useState } from 'react'
import {
  Bot,
  Sparkles,
  Copy,
  Check,
  Edit3,
  RotateCw,
  CheckCircle2,
  Sliders,
} from 'lucide-react'

export const AiTab: React.FC = () => {
  const [copiedReview, setCopiedReview] = useState(false)
  const [copiedPrDesc, setCopiedPrDesc] = useState(false)

  const copyText = (text: string, type: 'review' | 'pr') => {
    navigator.clipboard.writeText(text)
    if (type === 'review') {
      setCopiedReview(true)
      setTimeout(() => setCopiedReview(false), 2000)
    } else {
      setCopiedPrDesc(true)
      setTimeout(() => setCopiedPrDesc(false), 2000)
    }
  }

  const reviewText = `Nesta semana, o produto avançou na estabilização do fluxo de matrículas e na observabilidade da integração GitHub. Foram concluídos 11 PRs, incluindo a correção do cálculo de frequência e a nova trilha de auditoria. A cobertura de testes subiu de 35,2% para 38,6%, enquanto o tempo médio de revisão caiu 1h18. O principal ponto de atenção é o PR #284, parado há 67 horas e com 428 linhas alteradas; recomenda-se dividir o escopo antes da próxima Review.`

  const prMarkdown = `## Contexto
Simplifica o pipeline de matrícula e adiciona rastreabilidade à validação de frequência.

## Alterações
- extrai EnrollmentService para fluxo assíncrono
- adiciona retry idempotente e métricas de latência
- cobre cenários de matrícula duplicada

## Validação
\`pnpm test enrollment --runInBand\` • YT-1842`

  return (
    <div className="view-container">
      {/* Sub-header da Tela 12 */}
      <div className="section-intro-bar">
        <div>
          <h2 className="section-intro-title">Painel Executivo para o PO</h2>
          <p className="section-intro-desc">
            Síntese semanal para preparar a Review com contexto verificável e supervisão humana.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-success">✦ IA assistiva ativa • Fontes auditáveis</span>
          <button className="btn-nexus btn-nexus-secondary btn-nexus-sm">
            <Sliders size={12} />
            <span>Configurar IA</span>
          </button>
        </div>
      </div>

      {/* Grid: Painel Executivo PO */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
        {/* Resumo Semanal para Review */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div className="nexus-card-title">
              <Sparkles size={15} style={{ color: '#C084FC' }} />
              <span>Resumo semanal para Review</span>
            </div>
            <span className="badge badge-purple">✦ Gerado por IA + revisar</span>
          </div>

          {/* 4 Metadados da Geração */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: 10.5 }}>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>PERÍODO ANALISADO</span>
              <strong style={{ color: '#FFFFFF' }}>23-27 set 2026</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>FONTES CONSIDERADAS</span>
              <strong style={{ color: '#FFFFFF' }}>74 commits • 18 PRs</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>ESCOPO</span>
              <strong style={{ color: '#FFFFFF' }}>main + 8 branches</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block' }}>EXECUÇÃO</span>
              <span style={{ color: '#93C5FD', fontFamily: 'var(--font-mono)' }}>nxs-ai-8f31</span>
            </div>
          </div>

          {/* Texto Gerado */}
          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 14,
              fontSize: 12.5,
              lineHeight: 1.6,
              color: '#E2E8F0',
            }}
          >
            {reviewText}
          </div>

          {/* Footer de Ações do Resumo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              Rascunho assistivo: valide números e contexto antes de compartilhar.
            </span>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-nexus btn-nexus-secondary btn-nexus-sm">
                <Edit3 size={11} />
                <span>Revisar e editar</span>
              </button>
              <button
                onClick={() => copyText(reviewText, 'review')}
                className="btn-nexus btn-nexus-primary btn-nexus-sm"
              >
                {copiedReview ? <Check size={11} /> : <Copy size={11} />}
                <span>{copiedReview ? 'Copiado!' : 'Copiar para Review'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Análise de Sentimento em Reviews */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div>
              <div className="nexus-card-title">Análise de Sentimento</div>
              <div className="nexus-card-subtitle">Tom agregado dos comentários (126 reviews).</div>
            </div>
            <span className="badge badge-success">Tendência +8 p.p.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                TOM PREDOMINANTE
              </span>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981', marginTop: 2 }}>
                Positivo
              </div>
            </div>

            {/* Barras de Sentimento */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 11 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Positivo</span>
                  <strong style={{ color: '#10B981' }}>68%</strong>
                </div>
                <div className="throughput-track">
                  <div className="throughput-fill" style={{ width: '68%', backgroundColor: '#10B981' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Neutro</span>
                  <strong style={{ color: '#F59E0B' }}>25%</strong>
                </div>
                <div className="throughput-track">
                  <div className="throughput-fill" style={{ width: '25%', backgroundColor: '#F59E0B' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Hostil / Bloqueador</span>
                  <strong style={{ color: '#EF4444' }}>7%</strong>
                </div>
                <div className="throughput-track">
                  <div className="throughput-fill" style={{ width: '7%', backgroundColor: '#EF4444' }} />
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 6,
                padding: 10,
                fontSize: 11,
                color: '#A7F3D0',
                lineHeight: 1.4,
              }}
            >
              Comentários estão mais objetivos e colaborativos. O tom hostil caiu 3 p.p.; acompanhe o padrão, não indivíduos.
            </div>
          </div>
        </div>
      </div>

      {/* Assistente para Desenvolvedores — Copilot Git */}
      <div className="nexus-card">
        <div className="nexus-card-header">
          <div>
            <div className="nexus-card-title">
              <Bot size={15} style={{ color: '#60A5FA' }} />
              <span>Assistente para Desenvolvedores — Copilot Git</span>
            </div>
            <div className="nexus-card-subtitle">
              Apoio operacional sobre o diff local. Sugestões são explicáveis, revisáveis e nunca executadas automaticamente.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div className="select-chip">Últimos 7 dias</div>
            <div className="select-chip">branch: feat/enrollment-pipeline</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
          {/* Coluna Esquerda: Descrição Automática de PR */}
          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#FFFFFF' }}>
                Descrição automática de PR em Markdown
              </span>
              <span className="badge badge-info">✦ Preview pronto</span>
            </div>

            <div style={{ display: 'flex', gap: 8, fontSize: 10.5 }}>
              <span className="badge badge-purple">PR #284 • feat/enrollment-pipeline</span>
              <span className="badge" style={{ backgroundColor: '#1E293B', color: '#CBD5E1' }}>
                DIFF 14 arquivos • 428 linhas
              </span>
              <span className="badge" style={{ backgroundColor: '#1E293B', color: '#CBD5E1' }}>
                7 commits analisados
              </span>
            </div>

            <div className="code-box-dark" style={{ minHeight: 150, fontSize: 11.5 }}>
              <pre>{prMarkdown}</pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> Revise fatos, comandos e impacto antes de abrir o PR.
              </span>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-nexus btn-nexus-secondary btn-nexus-sm">
                  <RotateCw size={11} />
                  <span>Regenerar</span>
                </button>
                <button
                  onClick={() => copyText(prMarkdown, 'pr')}
                  className="btn-nexus btn-nexus-primary btn-nexus-sm"
                >
                  <Copy size={11} />
                  <span>{copiedPrDesc ? 'Copiado!' : 'Usar descrição'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Clareza de Commits e Validação YouTrack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Clareza Semântica */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>Clareza semântica dos commits</span>
                <span className="badge badge-warning">78 / 100</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#93C5FD' }}>8f3a91c: feat(enrollment): add idempotent retry</span>
                  <span className="badge badge-success">Claro</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>c4b7d2e: ajustes finais</span>
                  <span className="badge badge-warning">Revisar</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>1ab08de: fix: corrige erro</span>
                  <span className="badge badge-danger">Vago</span>
                </div>
              </div>
            </div>

            {/* Validador YouTrack */}
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>Validador de requisito • YouTrack</span>
                <span className="badge badge-warning">2 commits sem chave</span>
              </div>
              <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                Padrão obrigatório no corpo ou assunto: <code style={{ color: '#FBBF24' }}>YT-[0-9]+</code>
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn-nexus btn-nexus-secondary btn-nexus-sm" style={{ flex: 1 }}>
                  <span>Copiar comandos seguros</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
