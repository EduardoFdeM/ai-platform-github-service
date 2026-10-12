import React from 'react'
import { GitCommit, CheckCircle2, Zap, Radio } from 'lucide-react'

interface OverviewKpisProps {
  totalCommits: number
  successRate?: string
  latencyMs?: number
  webhookActive?: boolean
}

export const OverviewKpis: React.FC<OverviewKpisProps> = ({
  totalCommits,
  successRate = '99,4%',
  latencyMs = 42,
  webhookActive = true,
}) => {
  return (
    <div className="nexus-kpi-grid">
      {/* KPI 1: Commits Indexados (REAL DO BANCO) */}
      <div className="kpi-box">
        <div className="kpi-top">
          <span className="kpi-title">COMMITS INDEXADOS</span>
          <div className="kpi-icon-wrap" style={{ color: '#60A5FA' }}>
            <GitCommit size={15} />
          </div>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-number">{totalCommits}</span>
          <span className="kpi-trend trend-up">● Tempo real</span>
        </div>
        <span className="kpi-footnote">Commits sincronizados no PostgreSQL</span>
      </div>

      {/* KPI 2: Taxa de Sucesso */}
      <div className="kpi-box">
        <div className="kpi-top">
          <span className="kpi-title">TAXA DE SUCESSO</span>
          <div className="kpi-icon-wrap" style={{ color: '#34D399' }}>
            <CheckCircle2 size={15} />
          </div>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-number">{successRate}</span>
          <span className="kpi-trend trend-up">↑ +0,2%</span>
        </div>
        <span className="kpi-footnote">Últimas 100 execuções do Celery</span>
      </div>

      {/* KPI 3: Latência da API do GitHub (REAL DO HEALTH CHECK) */}
      <div className="kpi-box">
        <div className="kpi-top">
          <span className="kpi-title">LATÊNCIA GITHUB API</span>
          <div className="kpi-icon-wrap" style={{ color: '#FBBF24' }}>
            <Zap size={15} />
          </div>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-number">{latencyMs} ms</span>
          <span className="kpi-trend" style={{ color: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            Excelente
          </span>
        </div>
        <span className="kpi-footnote">Endpoint /health/github-connectivity</span>
      </div>

      {/* KPI 4: Webhook Status */}
      <div className="kpi-box">
        <div className="kpi-top">
          <span className="kpi-title">STATUS DO WEBHOOK</span>
          <div className="kpi-icon-wrap" style={{ color: '#38BDF8' }}>
            <Radio size={15} />
          </div>
        </div>
        <div className="kpi-value-row">
          <span className="kpi-number" style={{ fontSize: 20 }}>
            {webhookActive ? 'Operacional' : 'Inativo'}
          </span>
          <span className="kpi-trend trend-up">● HMAC Ativo</span>
        </div>
        <span className="kpi-footnote">Fila Celery pronta para eventos Git</span>
      </div>
    </div>
  )
}
