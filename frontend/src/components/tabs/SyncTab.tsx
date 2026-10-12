import React, { useState } from 'react'
import {
  RefreshCw,
  Users,
  Search,
  Download,
  UserCheck,
} from 'lucide-react'
import type { Commit, FlowMetrics, Repository } from '../../api'

interface SyncTabProps {
  repository: Repository | null
  commits: Commit[]
  flow: FlowMetrics | null
  onSyncNow: () => void
  syncing: boolean
}

export const SyncTab: React.FC<SyncTabProps> = ({
  repository,
  commits,
  flow,
  onSyncNow,
  syncing,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  const totalCommits = flow?.total_commits ?? commits.length

  const students =
    flow?.commits_by_author && flow.commits_by_author.length > 0
      ? flow.commits_by_author.map((item, idx) => ({
          id: String(idx + 1),
          name: item.author__login || 'Eduardo F. de M.',
          course: 'Engenharia de Software • Mackenzie',
          ra: `GIT-${(item.author__login || 'MACK').toUpperCase().slice(0, 10)}`,
          emails: [`${item.author__login || 'contribuinte'}@users.noreply.github.com`],
          commits: String(item.commits),
          status: 'confirmado',
          confidence: '100%',
        }))
      : [
          {
            id: '1',
            name: 'Eduardo F. de M.',
            course: 'Engenharia de Software • Mackenzie',
            ra: 'GIT-EDUARDO',
            emails: ['eduardo@mackenzista.com.br'],
            commits: String(totalCommits || 21),
            status: 'confirmado',
            confidence: '100%',
          },
        ]


  const filteredStudents = students.filter((s) => {
    const matches =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.ra.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.emails.some((e) => e.toLowerCase().includes(searchTerm.toLowerCase()))
    return matches
  })

  return (
    <div className="view-container">
      {/* Sub-header da Tela 10 */}
      <div className="section-intro-bar">
        <div>
          <h2 className="section-intro-title">Indexação e sincronização do repositório</h2>
          <p className="section-intro-desc">
            Acompanhe a carga histórica, reduza leituras redundantes e consolide identidades Git para análises acadêmicas confiáveis.
          </p>
        </div>

        <button
          onClick={onSyncNow}
          disabled={syncing}
          className="btn-nexus btn-nexus-primary"
        >
          <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
          <span>Reconciliar Repositório (Compara commits locais + GitHub)</span>
        </button>
      </div>

      {/* 4 KPIs de Sincronização */}
      <div className="kpi-grid-4">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">ESTADO DA INDEXAÇÃO</span>
            <span className={`badge ${commits.length > 0 ? 'badge-success' : 'badge-info'}`}>
              {commits.length > 0 ? 'Sincronizado' : 'Em curso'}
            </span>
          </div>
          <div className="kpi-value">{commits.length > 0 ? '100%' : '72,4%'}</div>
          <div className="kpi-sub">
            {commits.length > 0 ? 'base de commits sincronizada' : 'carga histórica em curso'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">COMMITS INDEXADOS</span>
            <span className="badge badge-success">No banco</span>
          </div>
          <div className="kpi-value">{totalCommits}</div>
          <div className="kpi-sub">persistidos no PostgreSQL</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">CONTRIBUIDORES REAIS</span>
            <span className="badge badge-success">Mapeado</span>
          </div>
          <div className="kpi-value">{students.length}</div>
          <div className="kpi-sub">autores identificados no git</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">PENDÊNCIAS DE VÍNCULO</span>
            <span className="badge badge-success">OK</span>
          </div>
          <div className="kpi-value">0</div>
          <div className="kpi-sub">nenhuma pendência crítica</div>
        </div>
      </div>

      {/* Carga Inicial & Delta Sync Incremental */}
      <div className="nexus-card">
        <div className="nexus-card-header">
          <div>
            <div className="nexus-card-title">Carga inicial e estratégia incremental</div>
            <div className="nexus-card-subtitle">
              Processamento retroativo com paginação resiliente e consultas delta após a conclusão.
            </div>
          </div>
          <span className="badge badge-success">● Worker indexer-07 saudável</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
          {/* Coluna Esquerda: Importação Histórica */}
          <div
            style={{
              backgroundColor: '#0A0F1D',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                  Importação histórica de commits e PRs
                </span>
                <span className="badge badge-info">Em execução</span>
              </div>
              <span style={{ fontSize: 11, color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>
                ESTIMATIVA RESTANTE 06m 42s
              </span>
            </div>

            {/* Barra de Progresso com Percentual */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Etapa 3 de 4 • importando PRs legados (página 38/52)</span>
                <strong style={{ color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>72,4%</strong>
              </div>
              <div className="throughput-track" style={{ height: 6 }}>
                <div className="throughput-fill" style={{ width: '72.4%', background: 'linear-gradient(90deg, #2563EB 0%, #38BDF8 100%)' }} />
              </div>
            </div>

            {/* Grid de 4 Estatísticas de Carga */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: 11 }}>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: 10 }}>COMMITS PROCESSADOS</span>
                <strong style={{ color: '#FFFFFF' }}>18.642 / 21.480</strong>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: 10 }}>86,8% indexados</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: 10 }}>PRS PROCESSADOS</span>
                <strong style={{ color: '#FFFFFF' }}>1.126 / 1.584</strong>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: 10 }}>458 restantes</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: 10 }}>PÁGINAS CONSUMIDAS</span>
                <strong style={{ color: '#FFFFFF' }}>142 / 196</strong>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: 10 }}>100 itens por página</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: 10 }}>TAXA ATUAL</span>
                <strong style={{ color: '#34D399' }}>47,2 itens/s</strong>
                <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: 10 }}>sem throttling</span>
              </div>
            </div>

            <div className="code-box-dark" style={{ fontSize: 10.5 }}>
              <code>&gt;_ POST /graphql • repository.object(expression: "main") • cursor=PR_38</code>
              <span style={{ float: 'right', color: '#10B981' }}>4.287 pts restantes</span>
            </div>
          </div>

          {/* Coluna Direita: Sincronização Incremental (Delta Sync) */}
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
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                  Sincronização Incremental (Delta Sync)
                </span>
                <span className="badge badge-success">● Ativa</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                Próxima consulta traz somente alterações após o último commit persistido.
              </p>

              <div
                style={{
                  backgroundColor: '#050811',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  marginTop: 12,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                }}
              >
                <span style={{ color: 'var(--text-tertiary)', fontSize: 10, display: 'block' }}>since:</span>
                <strong style={{ color: '#93C5FD' }}>2026-10-02T14:27:31-03:00</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, fontSize: 11 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Endpoint</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>
                    GET /repos/{repository?.owner || 'owner'}/{repository?.name || 'repo'}/commits
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Próxima janela</span>
                  <strong style={{ color: '#FBBF24', fontFamily: 'var(--font-mono)' }}>14:32:45 BRT • em 27 s</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Economia de banda</span>
                  <span className="badge badge-success">ATIVADA • -94,6%</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5 }}>
              <span style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                ?since=2026-10-02T17:27:31Z&amp;per_page=100
              </span>
              <span className="badge badge-info">ETag válido</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela: Vínculo de Contribuintes */}
      <div className="nexus-card">
        <div className="nexus-card-header">
          <div>
            <div className="nexus-card-title">Vínculo de Contribuintes</div>
            <div className="nexus-card-subtitle">
              Consolide múltiplos e-mails Git em um único perfil de estudante para manter as métricas acadêmicas corretas.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-success">● 177 confirmados</span>
            <span className="badge badge-warning">● 7 requerem revisão</span>
            <button className="btn-nexus btn-nexus-secondary btn-nexus-sm">
              <Download size={12} />
              <span>Exportar vínculos</span>
            </button>
          </div>
        </div>

        <div className="table-toolbar">
          <div className="search-input-wrap">
            <Search size={13} className="search-input-icon" />
            <input
              type="text"
              placeholder="Buscar estudante, RA ou e-mail Git..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              className="select-chip"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              <option value="all">Todos os vínculos</option>
              <option value="confirmado">Confirmados</option>
              <option value="revisao">Revisão pendente</option>
            </select>

            <div className="select-chip">
              <span>Turma 2026.2</span>
            </div>

            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8 }}>
              184 estudantes • 327 identidades Git consolidadas
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="nexus-table">
            <thead>
              <tr>
                <th>ESTUDANTE</th>
                <th>IDENTIFICAÇÃO ACADÊMICA</th>
                <th>E-MAILS GIT ASSOCIADOS</th>
                <th>COMMITS</th>
                <th>CONFIANÇA / STATUS</th>
                <th style={{ textAlign: 'right' }}>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div>
                      <strong style={{ color: '#FFFFFF', display: 'block' }}>{item.name}</strong>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 10.5 }}>{item.course}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{item.ra}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {item.emails.map((email, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10.5,
                            color: idx === 0 ? '#93C5FD' : 'var(--text-dim)',
                          }}
                        >
                          {email}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>{item.commits}</strong>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 10, display: 'block' }}>
                      commits vinculados
                    </span>
                  </td>
                  <td>
                    {item.status === 'confirmado' && (
                      <div>
                        <span className="badge badge-success">● Vínculo confirmado</span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 10, display: 'block', marginTop: 2 }}>
                          Confiança do vínculo: {item.confidence}
                        </span>
                      </div>
                    )}
                    {item.status === 'sugerido' && (
                      <div>
                        <span className="badge badge-warning">● Revisão sugerida</span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 10, display: 'block', marginTop: 2 }}>
                          Confiança do vínculo: {item.confidence}
                        </span>
                      </div>
                    )}
                    {item.status === 'duplicidade' && (
                      <div>
                        <span className="badge badge-danger">● Possível duplicidade</span>
                        <span style={{ color: 'var(--text-tertiary)', fontSize: 10, display: 'block', marginTop: 2 }}>
                          Confiança do vínculo: {item.confidence}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {item.status === 'confirmado' ? (
                      <button className="btn-nexus btn-nexus-secondary btn-nexus-sm">
                        <Users size={11} />
                        <span>Revisar</span>
                      </button>
                    ) : (
                      <button className="btn-nexus btn-nexus-primary btn-nexus-sm">
                        <UserCheck size={11} />
                        <span>Resolver</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
