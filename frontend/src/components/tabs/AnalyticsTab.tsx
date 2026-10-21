import React, { useState } from 'react'
import {
  TrendingDown,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Flame,
  Send,
  Download,
} from 'lucide-react'
import type { Commit, FlowMetrics, Repository } from '../../api'

interface AnalyticsTabProps {
  repository?: Repository | null
  commits?: Commit[]
  flow?: FlowMetrics | null
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  repository,
  commits,
  flow,
}) => {
  const [period, setPeriod] = useState('Últimos 14 dias')
  const [planCreated, setPlanCreated] = useState(false)
  const [contactedMembers, setContactedMembers] = useState<string[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)
  const totalRealCommits = flow?.total_commits ?? (commits?.length ?? 21)

  const members =
    flow?.commits_by_author && flow.commits_by_author.length > 0
      ? flow.commits_by_author.map((item) => ({
          name: item.author__login || 'Eduardo F. de M.',
          role: 'Engenheiro Responsável',
          commits: item.commits,
          prs: Math.max(1, Math.round(item.commits / 3)),
        }))
      : [
          {
            name: 'Eduardo F. de M.',
            role: 'Engenheiro Responsável',
            commits: totalRealCommits,
            prs: 4,
          },
        ]
  const maxCommits = Math.max(...members.map((m) => m.commits), 1)

  const showFeedback = (message: string) => setFeedback(message)

  const exportDemoReport = () => {
    const report = {
      kind: 'demonstracao-analytics-fluxo',
      generated_at: new Date().toISOString(),
      period,
      repository: repository?.full_name ?? null,
      disclaimer: 'Cenário demonstrativo. Os indicadores de lead time, PRs, hotspots e recomendações não foram calculados por uma API.',
      contributors: members,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'analytics-fluxo-demonstracao.json'
    link.click()
    URL.revokeObjectURL(url)
    showFeedback('Relatório demonstrativo exportado em JSON. Nenhum dado foi enviado para fora do navegador.')
  }

  const toggleContact = (name: string) => {
    const alreadyPrepared = contactedMembers.includes(name)
    setContactedMembers((current) =>
      alreadyPrepared ? current.filter((member) => member !== name) : [...current, name]
    )
    showFeedback(alreadyPrepared ? `Mensagem demonstrativa removida para ${name}.` : `Mensagem demonstrativa preparada para ${name}; nenhum contato foi enviado.`)
  }

  const shareDailySummary = async () => {
    const text = `Resumo demonstrativo de fluxo (${period}): cenário de ideação; validar indicadores antes de compartilhar.`
    try {
      await navigator.clipboard.writeText(text)
      showFeedback('Resumo demonstrativo copiado para a área de transferência. Revise os números antes de compartilhar.')
    } catch {
      showFeedback('Não foi possível acessar a área de transferência. O resumo continua sendo apenas demonstrativo.')
    }
  }

  return (
    <div className="view-container">
      {/* Sub-header da Tela 11 */}
      <div className="section-intro-bar">
        <div>
          <h2 className="section-intro-title">
            Visão executiva do fluxo{repository ? ` • ${repository.name}` : ''}
          </h2>
          <p className="section-intro-desc">
            Cenário demonstrativo de velocidade e qualidade para discutir espera sistêmica — não para avaliar performance individual.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-info">Dados de demonstração</span>
          <button onClick={exportDemoReport} className="btn-nexus btn-nexus-secondary btn-nexus-sm">
            <Download size={12} />
            <span>Exportar relatório</span>
          </button>
        </div>
      </div>

      {/* Seletor de Período e Equipe */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <label className="select-chip">
          <span>período:</span>
          <select
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value)
              showFeedback(`Cenário demonstrativo atualizado para ${event.target.value}.`)
            }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', font: 'inherit', fontWeight: 600 }}
          >
            <option value="Últimos 7 dias">Últimos 7 dias</option>
            <option value="Últimos 14 dias">Últimos 14 dias</option>
            <option value="Últimos 30 dias">Últimos 30 dias</option>
          </select>
        </label>
        <div className="select-chip">
          <span>branch:</span>
          <strong>main</strong>
        </div>
        <div className="select-chip">
          <span>equipe:</span>
          <strong>Squad Plataforma</strong>
        </div>
      </div>

      {feedback && (
        <div className="status-pill status-pill-info" role="status">
          {feedback}
        </div>
      )}

      {/* 3 KPIs Executivos de Fluxo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {/* Lead Time Médio */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Lead Time Médio</span>
            <span className="badge badge-success">
              <TrendingDown size={11} style={{ marginRight: 3 }} /> 12%
            </span>
          </div>
          <div className="kpi-value">3d 8h</div>
          <div className="kpi-sub">Primeiro commit → merge do PR</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 4 }}>
            14 dias anteriores: 3d 19h • mediana da equipe: 3d 2h
          </div>
        </div>

        {/* Cycle Time de Revisão */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Cycle Time de Revisão</span>
            <span className="badge badge-success">
              <TrendingDown size={11} style={{ marginRight: 3 }} /> 1h 18m
            </span>
          </div>
          <div className="kpi-value">9h 24m</div>
          <div className="kpi-sub">Abertura do PR → primeira aprovação</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 4 }}>
            Meta operacional: &lt; 12h • 81% dos PRs dentro do SLA
          </div>
        </div>

        {/* Razão de Testes */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Razão de Testes</span>
            <span className="badge badge-info">+3,4 p.p.</span>
          </div>
          <div className="kpi-value">38,6%</div>
          <div className="kpi-sub">Linhas test/*py / código produtivo</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 4 }}>
            Meta: &ge; 40% • 1.842 linhas de teste / 4.776 produtivas
          </div>
        </div>
      </div>

      {/* Card de Alertas Críticos — Ação Imediata */}
      <div className="nexus-card" style={{ borderColor: 'rgba(239, 68, 68, 0.35)' }}>
        <div className="nexus-card-header">
          <div>
            <div className="nexus-card-title" style={{ color: '#F87171' }}>
              <AlertTriangle size={15} />
              <span>Alertas críticos — ação imediata</span>
            </div>
            <div className="nexus-card-subtitle">
              Remova bloqueios de fluxo e confirme impedimentos com contexto antes da próxima daily.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <span className="badge badge-danger">6 itens críticos</span>
            <button
              className="btn-nexus btn-nexus-danger btn-nexus-sm"
              onClick={() => {
                setPlanCreated(true)
                showFeedback('Plano de ação demonstrativo criado localmente. Não foi aberto nenhum ticket.')
              }}
            >
              <span>{planCreated ? 'Plano demonstrativo criado' : 'Criar plano de ação'}</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {/* PRs Parados */}
          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>
                PRs sem movimentação há mais de 48h
              </span>
              <span className="badge badge-danger">3 PRs</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#050811',
                  padding: '8px 10px',
                  borderRadius: 6,
                }}
              >
                <div>
                  <strong style={{ color: '#93C5FD', fontSize: 11.5, display: 'block' }}>
                    #284 Refatora pipeline de matrículas
                  </strong>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 10.5 }}>
                    Rafael Lima • 2 revisores solicitados
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-danger">67h parado</span>
                  <button className="btn-nexus btn-nexus-secondary btn-nexus-sm" onClick={() => showFeedback('PR #284 é uma referência de demonstração; não há URL de pull request configurada.')}>
                    <ExternalLink size={10} /> Ver referência (demo)
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#050811',
                  padding: '8px 10px',
                  borderRadius: 6,
                }}
              >
                <div>
                  <strong style={{ color: '#93C5FD', fontSize: 11.5, display: 'block' }}>
                    #279 Corrige cálculo de frequência
                  </strong>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 10.5 }}>
                    Ana Martins • Aguardando aprovação
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-danger">55h parado</span>
                  <button className="btn-nexus btn-nexus-secondary btn-nexus-sm" onClick={() => showFeedback('PR #279 é uma referência de demonstração; não há URL de pull request configurada.')}>
                    <ExternalLink size={10} /> Ver referência (demo)
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#050811',
                  padding: '8px 10px',
                  borderRadius: 6,
                }}
              >
                <div>
                  <strong style={{ color: '#93C5FD', fontSize: 11.5, display: 'block' }}>
                    #276 Atualiza cliente de notificações
                  </strong>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 10.5 }}>
                    Bruna Nunes • Conflito com main detectado
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-danger">49h parado</span>
                  <button className="btn-nexus btn-nexus-secondary btn-nexus-sm" onClick={() => showFeedback('PR #276 é uma referência de demonstração; não há URL de pull request configurada.')}>
                    <ExternalLink size={10} /> Ver referência (demo)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Membros Sem Commits */}
          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>
                Membros sem novos commits há mais de 72h
              </span>
              <span className="badge badge-warning">3 membros</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#050811',
                  padding: '8px 10px',
                  borderRadius: 6,
                }}
              >
                <div>
                  <strong style={{ color: '#FFFFFF', fontSize: 11.5, display: 'block' }}>Carla Souza</strong>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 10.5 }}>
                    Último commit: Ajusta validação de calendário
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-danger">91h sem commits</span>
                  <button className="btn-nexus btn-nexus-secondary btn-nexus-sm" onClick={() => toggleContact('Carla Souza')}>
                    <MessageSquare size={10} /> {contactedMembers.includes('Carla Souza') ? 'Mensagem preparada' : 'Preparar contato'}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#050811',
                  padding: '8px 10px',
                  borderRadius: 6,
                }}
              >
                <div>
                  <strong style={{ color: '#FFFFFF', fontSize: 11.5, display: 'block' }}>Diego Freitas</strong>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 10.5 }}>
                    Último commit: Adiciona índices de consulta
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-danger">82h sem commits</span>
                  <button className="btn-nexus btn-nexus-secondary btn-nexus-sm" onClick={() => toggleContact('Diego Freitas')}>
                    <MessageSquare size={10} /> {contactedMembers.includes('Diego Freitas') ? 'Mensagem preparada' : 'Preparar contato'}
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#050811',
                  padding: '8px 10px',
                  borderRadius: 6,
                }}
              >
                <div>
                  <strong style={{ color: '#FFFFFF', fontSize: 11.5, display: 'block' }}>Lucas Almeida</strong>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 10.5 }}>
                    Último commit: Documenta estratégia de cache
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-danger">76h sem commits</span>
                  <button className="btn-nexus btn-nexus-secondary btn-nexus-sm" onClick={() => toggleContact('Lucas Almeida')}>
                    <MessageSquare size={10} /> {contactedMembers.includes('Lucas Almeida') ? 'Mensagem preparada' : 'Preparar contato'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Distribuição por Integrante & Hotspots */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
        {/* Distribuição por Integrante */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div>
              <div className="nexus-card-title">Distribuição de commits e PRs por integrante</div>
              <div className="nexus-card-subtitle">Volume relativo no período (commits vs PRs).</div>
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10.5 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#60A5FA' }}>
                <span style={{ width: 8, height: 8, backgroundColor: '#2563EB', borderRadius: 2 }} /> Commits
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#C084FC' }}>
                <span style={{ width: 8, height: 8, backgroundColor: '#8B5CF6', borderRadius: 2 }} /> PRs
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {members.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11.5 }}>
                <div style={{ width: 130 }}>
                  <strong style={{ color: '#FFFFFF', display: 'block' }}>{m.name}</strong>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>{m.role}</span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 6, backgroundColor: '#162035', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${(m.commits / maxCommits) * 100}%`, height: '100%', backgroundColor: '#2563EB' }} />
                    </div>
                    <span style={{ width: 16, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: '#93C5FD' }}>
                      {m.commits}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 4, backgroundColor: '#162035', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${(m.prs / 15) * 100}%`, height: '100%', backgroundColor: '#8B5CF6' }} />
                    </div>
                    <span style={{ width: 16, fontFamily: 'var(--font-mono)', fontSize: 10, color: '#C084FC' }}>
                      {m.prs}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hotspots de Código */}
        <div className="nexus-card">
          <div className="nexus-card-header">
            <div>
              <div className="nexus-card-title">
                <Flame size={15} style={{ color: '#EF4444' }} />
                <span>Hotspots de código</span>
              </div>
              <div className="nexus-card-subtitle">Arquivos mais concorridos ou modificados na semana.</div>
            </div>
            <span className="badge badge-danger">2 críticos</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { file: 'src/services/enrollment.py', changes: '485 alterações • 7 contrib.', crit: 'Alta', color: '#EF4444' },
              { file: 'src/api/routes/students.py', changes: '372 alterações • 6 contrib.', crit: 'Alta', color: '#EF4444' },
              { file: 'src/core/permissions.py', changes: '294 alterações • 5 contrib.', crit: 'Alta', color: '#EF4444' },
              { file: 'tests/test_enrollment.py', changes: '248 alterações • 4 contrib.', crit: 'Média', color: '#F59E0B' },
              { file: 'src/repositories/attendance.py', changes: '211 alterações • 4 contrib.', crit: 'Média', color: '#F59E0B' },
              { file: 'migrations/2026_10_add_index.py', changes: '164 alterações • 3 contrib.', crit: 'Moderada', color: '#64748B' },
            ].map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 10px',
                  backgroundColor: '#0A0F1D',
                  borderRadius: 6,
                  fontSize: 11.5,
                }}
              >
                <div>
                  <code style={{ color: '#E2E8F0', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{h.file}</code>
                  <span style={{ display: 'block', color: 'var(--text-tertiary)', fontSize: 10.5 }}>{h.changes}</span>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: h.color,
                    padding: '2px 6px',
                    borderRadius: 3,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                  }}
                >
                  {h.crit}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Próximas Ações Sugeridas */}
      <div className="nexus-card">
        <div className="nexus-card-header">
          <div>
            <div className="nexus-card-title">Próximas ações sugeridas</div>
            <div className="nexus-card-subtitle">
              Síntese do diagnóstico para preparar a daily e reduzir tempo de espera nesta sprint.
            </div>
          </div>
          <button className="btn-nexus btn-nexus-primary btn-nexus-sm" onClick={shareDailySummary}>
            <Send size={12} />
            <span>Compartilhar na daily</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span className="badge badge-danger">P0</span>
              <strong style={{ color: '#FFFFFF', fontSize: 12 }}>Destravar os 3 PRs mais antigos</strong>
            </div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
              Definir revisor primário e resolver comentários pendentes antes da daily.
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span className="badge badge-warning">P1</span>
              <strong style={{ color: '#FFFFFF', fontSize: 12 }}>Alinhar ownership dos hotspots</strong>
            </div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
              Parear responsáveis em enrollment.py e students.py com os Tech leads.
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span className="badge badge-info">P2</span>
              <strong style={{ color: '#FFFFFF', fontSize: 12 }}>Fechar gap da razão de testes</strong>
            </div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>
              Adicionar 68 linhas de teste para atingir a meta operacional de 40%.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
