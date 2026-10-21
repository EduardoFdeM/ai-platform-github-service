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

const reviewExamples = [
  'Exemplo de resumo: nesta semana, o time simulou avanços na estabilização do fluxo de matrículas e na observabilidade da integração GitHub. O conteúdo abaixo usa métricas fictícias para demonstrar como um rascunho poderia apoiar uma Review. Antes de compartilhar, substitua todos os números e referências pelos dados verificados do projeto.',
  'Exemplo alternativo: a amostra local destaca uma possível dependência entre revisão de PRs e cobertura de testes. Esta é apenas uma variação de interface — nenhuma análise foi executada, nenhum repositório foi consultado e nenhum insight deve orientar decisão sem validação humana.',
] as const

const prDescriptionExamples = [
  '## Contexto\nExemplo de descrição para uma mudança de matrícula. Este texto é apenas um preview local.\n\n## Alterações\n- descreve uma possível extração de serviço assíncrono\n- lista um retry idempotente como exemplo de implementação\n- sugere validar cenários de matrícula duplicada\n\n## Validação necessária\n- confirmar comandos, issue e evidências antes de abrir o PR',
  '## Contexto\nOutro exemplo local de descrição de PR. Nenhum diff foi lido para compor este rascunho.\n\n## Alterações\n- apresenta uma hipótese de mudança\n- separa impacto e validação como campos revisáveis\n\n## Validação necessária\n- substituir este conteúdo por evidências do repositório',
] as const

const safeCommandsExample = '# Exemplo para revisão local — confirme o contexto antes de executar\ngit status\ngit log --oneline -5\ngit diff --check'

export const AiTab: React.FC = () => {
  const [copiedReview, setCopiedReview] = useState(false)
  const [copiedPrDesc, setCopiedPrDesc] = useState(false)
  const [copiedCommands, setCopiedCommands] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isEditingReview, setIsEditingReview] = useState(false)
  const [reviewText, setReviewText] = useState<string>(reviewExamples[0])
  const [reviewDraft, setReviewDraft] = useState<string>(reviewExamples[0])
  const [reviewExampleIndex, setReviewExampleIndex] = useState(0)
  const [prExampleIndex, setPrExampleIndex] = useState(0)
  const [prDescription, setPrDescription] = useState<string>(prDescriptionExamples[0])
  const [localNotice, setLocalNotice] = useState('')

  const copyText = async (text: string, type: 'review' | 'pr' | 'commands') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'review') {
        setCopiedReview(true)
        setTimeout(() => setCopiedReview(false), 2000)
      } else if (type === 'pr') {
        setCopiedPrDesc(true)
        setTimeout(() => setCopiedPrDesc(false), 2000)
      } else {
        setCopiedCommands(true)
        setTimeout(() => setCopiedCommands(false), 2000)
      }
      setLocalNotice('')
      setCopyFeedback('Conteúdo de exemplo copiado localmente. Revise antes de usar fora desta tela.')
    } catch {
      setLocalNotice('')
      setCopyFeedback('A cópia automática não está disponível neste navegador. Selecione o conteúdo e copie manualmente.')
    }
  }

  const regenerateReview = () => {
    const nextIndex = (reviewExampleIndex + 1) % reviewExamples.length
    const nextExample = reviewExamples[nextIndex]
    setReviewExampleIndex(nextIndex)
    setReviewText(nextExample)
    setReviewDraft(nextExample)
    setIsEditingReview(false)
    setLocalNotice('Outro exemplo local foi carregado. Nenhuma IA, API ou repositório foi consultado.')
  }

  const regeneratePrDescription = () => {
    const nextIndex = (prExampleIndex + 1) % prDescriptionExamples.length
    setPrExampleIndex(nextIndex)
    setPrDescription(prDescriptionExamples[nextIndex])
    setLocalNotice('Outro rascunho de descrição foi carregado localmente. Nenhum diff foi analisado.')
  }

  const saveReviewDraft = () => {
    setReviewText(reviewDraft.trim() || reviewText)
    setIsEditingReview(false)
    setLocalNotice('Rascunho atualizado somente nesta sessão do navegador.')
  }

  return (
    <div className="view-container">
      {/* Sub-header da Tela 12 */}
      <div className="section-intro-bar">
        <div>
          <h2 className="section-intro-title">Painel Executivo para o PO</h2>
          <p className="section-intro-desc">
            Protótipo navegável com dados de exemplo. Nenhuma análise de IA ou fonte externa é consultada nesta tela.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-warning">◌ Demonstração local • dados fictícios</span>
          <button
            type="button"
            onClick={() => setIsSettingsOpen((isOpen) => !isOpen)}
            aria-expanded={isSettingsOpen}
            className="btn-nexus btn-nexus-secondary btn-nexus-sm"
          >
            <Sliders size={12} />
            <span>{isSettingsOpen ? 'Fechar configuração' : 'Configurar demonstração'}</span>
          </button>
        </div>
      </div>

      {isSettingsOpen && (
        <div
          className="nexus-card"
          role="status"
          style={{ borderColor: 'rgba(96, 165, 250, 0.35)', backgroundColor: 'rgba(30, 41, 59, 0.62)' }}
        >
          <div className="nexus-card-title">Configuração local da demonstração</div>
          <p className="nexus-card-subtitle">
            Esta tela alterna apenas estados visuais e rascunhos no navegador. Não envia prompts, commits ou credenciais.
          </p>
        </div>
      )}

      {(localNotice || copyFeedback) && (
        <div
          role="status"
          style={{ fontSize: 11, color: '#BFDBFE', borderLeft: '2px solid #60A5FA', paddingLeft: 10 }}
        >
          {localNotice || copyFeedback}
        </div>
      )}

      {/* Grid: Painel Executivo PO */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
        {/* Resumo Semanal para Review */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div className="nexus-card-title">
              <Sparkles size={15} style={{ color: '#C084FC' }} />
              <span>Resumo semanal para Review</span>
            </div>
              <span className="badge badge-purple">✦ Rascunho fictício + revisar</span>
          </div>

          {/* 4 Metadados da Geração */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: 10.5 }}>
            <div>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>PERÍODO ILUSTRATIVO</span>
                <strong style={{ color: '#FFFFFF' }}>Exemplo local</strong>
            </div>
            <div>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>AMOSTRA EXIBIDA</span>
                <strong style={{ color: '#FFFFFF' }}>Métricas fictícias</strong>
            </div>
            <div>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>ESCOPO</span>
                <strong style={{ color: '#FFFFFF' }}>Sem repositório conectado</strong>
            </div>
            <div>
                <span style={{ color: 'var(--text-dim)', display: 'block' }}>EXECUÇÃO</span>
                <span style={{ color: '#93C5FD', fontFamily: 'var(--font-mono)' }}>preview-local</span>
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
            {isEditingReview ? (
              <textarea
                value={reviewDraft}
                onChange={(event) => setReviewDraft(event.target.value)}
                aria-label="Editar rascunho de Review de exemplo"
                style={{ width: '100%', minHeight: 112, resize: 'vertical', color: '#E2E8F0', background: '#0A0F1D', border: 0, font: 'inherit', lineHeight: 'inherit' }}
              />
            ) : (
              reviewText
            )}
          </div>

          {/* Footer de Ações do Resumo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              Exemplo local: valide números e contexto antes de compartilhar.
            </span>

            <div style={{ display: 'flex', gap: 10 }}>
              {isEditingReview ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewDraft(reviewText)
                      setIsEditingReview(false)
                      setLocalNotice('Edição local descartada.')
                    }}
                    className="btn-nexus btn-nexus-secondary btn-nexus-sm"
                  >
                    <span>Cancelar</span>
                  </button>
                  <button type="button" onClick={saveReviewDraft} className="btn-nexus btn-nexus-primary btn-nexus-sm">
                    <Check size={11} />
                    <span>Salvar localmente</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewDraft(reviewText)
                      setIsEditingReview(true)
                      setLocalNotice('Modo de edição local ativado. O texto não será enviado para um serviço externo.')
                    }}
                    className="btn-nexus btn-nexus-secondary btn-nexus-sm"
                  >
                    <Edit3 size={11} />
                    <span>Revisar e editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={regenerateReview}
                    className="btn-nexus btn-nexus-secondary btn-nexus-sm"
                  >
                    <RotateCw size={11} />
                    <span>Trocar exemplo</span>
                  </button>
                </>
              )}
              <button
                type="button"
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
              <div className="nexus-card-subtitle">Amostra fictícia para demonstrar a visualização; não há reviews analisados.</div>
            </div>
            <span className="badge badge-warning">Exemplo estático</span>
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
                Exemplo de leitura: apresente tendências agregadas, nunca avaliações de indivíduos. Os percentuais desta tela não vieram do backend.
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
              Preview de interface para rascunhos revisáveis. Nenhum diff local, repositório ou serviço de IA é acessado.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <div className="select-chip">janela ilustrativa</div>
            <div className="select-chip">branch: exemplo/local</div>
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
              <span className="badge badge-info">✦ Conteúdo de exemplo</span>
            </div>

            <div style={{ display: 'flex', gap: 8, fontSize: 10.5 }}>
              <span className="badge badge-purple">PR fictício • exemplo/local</span>
              <span className="badge" style={{ backgroundColor: '#1E293B', color: '#CBD5E1' }}>
                DIFF ilustrativo • sem leitura de arquivos
              </span>
              <span className="badge" style={{ backgroundColor: '#1E293B', color: '#CBD5E1' }}>
                sem commits consultados
              </span>
            </div>

            <div className="code-box-dark" style={{ minHeight: 150, fontSize: 11.5 }}>
              <pre>{prDescription}</pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} /> Revise fatos, comandos e impacto antes de abrir o PR. Este texto não foi gerado por IA.
              </span>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={regeneratePrDescription} className="btn-nexus btn-nexus-secondary btn-nexus-sm">
                  <RotateCw size={11} />
                  <span>Trocar exemplo</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyText(prDescription, 'pr')}
                  className="btn-nexus btn-nexus-primary btn-nexus-sm"
                >
                  {copiedPrDesc ? <Check size={11} /> : <Copy size={11} />}
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
                  <span className="badge badge-warning">exemplo visual</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#93C5FD' }}>exemplo: feat(módulo): descreve a mudança</span>
                  <span className="badge badge-success">Modelo claro</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>exemplo: ajustes finais</span>
                  <span className="badge badge-warning">Modelo a revisar</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>exemplo: corrige erro</span>
                  <span className="badge badge-danger">Modelo vago</span>
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
                <span className="badge badge-warning">Sem validação conectada</span>
              </div>
              <p style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                Exemplo de padrão que um projeto pode adotar no corpo ou assunto: <code style={{ color: '#FBBF24' }}>YT-[0-9]+</code>. Esta tela não consulta o YouTrack.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => copyText(safeCommandsExample, 'commands')}
                  className="btn-nexus btn-nexus-secondary btn-nexus-sm"
                  style={{ flex: 1 }}
                >
                  {copiedCommands ? <Check size={11} /> : <Copy size={11} />}
                  <span>{copiedCommands ? 'Comandos copiados!' : 'Copiar comandos de exemplo'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
