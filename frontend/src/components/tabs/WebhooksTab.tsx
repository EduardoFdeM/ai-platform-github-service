import React, { useState } from 'react'
import {
  Radio,
  CheckCircle2,
  Activity,
  Play,
  Pause,
  Download,
  Search,
  Send,
  X,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Check,
  Clock,
} from 'lucide-react'
import { api, type Delivery, type Repository } from '../../api'

interface WebhooksTabProps {
  repository: Repository | null
  deliveries: Delivery[]
  onRefreshData?: () => void
}

interface WebhookEventItem {
  id: string
  event: string
  deliveryId: string
  author: string
  timestamp: string
  forcePush: boolean
  status: string
  branch: string
}

// Utilitário para calcular HMAC-SHA256 no browser
async function computeHmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await window.crypto.subtle.sign('HMAC', key, enc.encode(message))
  const hashArray = Array.from(new Uint8Array(signature))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export const WebhooksTab: React.FC<WebhooksTabProps> = ({
  repository,
  deliveries,
  onRefreshData,
}) => {
  const [streamActive, setStreamActive] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEventType, setSelectedEventType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Gaveta lateral de inspeção JSON
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<WebhookEventItem | null>(null)
  const [activeJsonTab, setActiveJsonTab] = useState<'payload' | 'headers'>('payload')

  // Simulador de webhook
  const [showSimulator, setShowSimulator] = useState(false)
  const [simAuthor, setSimAuthor] = useState('EduardoFdeM')
  const [simBranch, setSimBranch] = useState('main')
  const [simMessage, setSimMessage] = useState('feat(ui): sincronizar eventos em tempo real no dashboard')
  const [simFile, setSimFile] = useState('frontend/src/App.tsx')
  const [simStatus, setSimStatus] = useState<string | null>(null)
  const [simulating, setSimulating] = useState(false)

  // Eventos do Figma
  const defaultEvents: WebhookEventItem[] = [
    {
      id: '1',
      event: 'push',
      deliveryId: 'd7c9d13e-55c2-4f28-9b7a-80e08dfdd6a91',
      author: 'rafael-lima',
      timestamp: '02 out 2026 • 14:32:18',
      forcePush: false,
      status: '202 Accepted',
      branch: 'main',
    },
    {
      id: '2',
      event: 'pull_request',
      deliveryId: '6a2f8e75-d9b6-4b1a-b1d8-e4a192fa7c06',
      author: 'ana-martins',
      timestamp: '02 out 2026 • 14:31:52',
      forcePush: false,
      status: '202 Accepted',
      branch: 'feat/auth-v2',
    },
    {
      id: '3',
      event: 'pull_request_review',
      deliveryId: 'b34dd192-1a88-4cd4-8e67-980c18c7f4ee',
      author: 'bruna-nunes',
      timestamp: '02 out 2026 • 14:30:09',
      forcePush: false,
      status: '202 Accepted',
      branch: 'fix/metrics',
    },
    {
      id: '4',
      event: 'member',
      deliveryId: 'f90e6571-235c-4c9c-b25a-f6a4a24fa0b2',
      author: 'marina-costa',
      timestamp: '02 out 2026 • 14:27:44',
      forcePush: false,
      status: '202 Accepted',
      branch: 'main',
    },
    {
      id: '5',
      event: 'push',
      deliveryId: '845bfe44-a8cb-44cc-ba96-1da5a7467888',
      author: 'github-actions',
      timestamp: '02 out 2026 • 14:25:11',
      forcePush: true,
      status: '202 Accepted',
      branch: 'release/v1.0.0',
    },
    {
      id: '6',
      event: 'pull_request',
      deliveryId: '2a8c81e9-2c60-41a5-9647-a82fa9ec25fe',
      author: 'diego-freitas',
      timestamp: '02 out 2026 • 14:22:36',
      forcePush: false,
      status: '202 Accepted',
      branch: 'feat/data-models',
    },
    {
      id: '7',
      event: 'push',
      deliveryId: '7e29c40b-cd10-4f02-87d5-2db9a45b207d',
      author: 'carla-souza',
      timestamp: '02 out 2026 • 14:18:05',
      forcePush: false,
      status: '202 Accepted',
      branch: 'chore/cleanup',
    },
  ]

  // Mesclando com entregas reais salvas no banco
  const displayEvents: WebhookEventItem[] =
    deliveries.length > 0
      ? deliveries.map((d) => ({
          id: d.delivery_id,
          event: d.event,
          deliveryId: d.delivery_id,
          author: 'EduardoFdeM',
          timestamp: new Date(d.received_at).toLocaleString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          forcePush: false,
          status: d.status === 'processed' ? '202 Accepted' : d.status,
          branch: d.ref ? d.ref.replace('refs/heads/', '') : 'main',
        }))
      : defaultEvents

  const filteredEvents = displayEvents.filter((item) => {
    const matchesSearch =
      item.deliveryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.event.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEvent = selectedEventType === 'all' || item.event === selectedEventType
    return matchesSearch && matchesEvent
  })

  const openDrawer = (item: WebhookEventItem) => {
    setSelectedEvent(item)
    setDrawerOpen(true)
  }

  // Disparo simulado com cálculo HMAC-SHA256 no browser
  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repository) return
    setSimulating(true)
    setSimStatus('Calculando digest HMAC-SHA256 e enviando payload...')

    try {
      const commitSha = Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
      const deliveryId = window.crypto.randomUUID()
      const timestamp = new Date().toISOString()

      const payload = {
        repository: {
          id: repository.github_id,
          name: repository.name,
          owner: { login: repository.owner },
        },
        ref: `refs/heads/${simBranch}`,
        forced: false,
        commits: [
          {
            id: commitSha,
            message: simMessage,
            timestamp,
            url: `https://github.com/${repository.owner}/${repository.name}/commit/${commitSha.slice(0, 7)}`,
            author: {
              name: simAuthor,
              email: `${simAuthor.toLowerCase()}@mackenzie.br`,
              username: simAuthor,
            },
            added: [simFile],
            modified: [],
            removed: [],
          },
        ],
      }

      const bodyStr = JSON.stringify(payload)
      const secret = 'mackenzie-secret-2026'
      const signatureHex = await computeHmacSha256(secret, bodyStr)

      const { status, data } = await api.sendWebhook(bodyStr, {
        'X-Hub-Signature-256': `sha256=${signatureHex}`,
        'X-GitHub-Event': 'push',
        'X-GitHub-Delivery': deliveryId,
      })

      if (status === 202) {
        setSimStatus(`Sucesso! Evento aceito (202 Accepted) · Delivery: ${deliveryId.slice(0, 8)}...`)
        if (onRefreshData) onRefreshData()
      } else if (status === 200 && data.status === 'ignored') {
        setSimStatus(`Idempotência: Evento duplicado ignorado com sucesso (200 OK).`)
      } else {
        setSimStatus(`Resposta: HTTP ${status} - ${data.detail || JSON.stringify(data)}`)
      }
    } catch (err: any) {
      setSimStatus(`Erro no envio: ${err.message}`)
    } finally {
      setSimulating(false)
    }
  }

  return (
    <div className="view-container">
      {/* Sub-header da Tela 09 */}
      <div className="section-intro-bar">
        <div>
          <h2 className="section-intro-title">Eventos em tempo real</h2>
          <p className="section-intro-desc">
            Recepção segura, enfileiramento assíncrono e rastreabilidade dos eventos enviados pelo GitHub.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="status-pill status-pill-success">
            <Radio size={12} className={streamActive ? 'animate-pulse' : ''} />
            <span>CANAL DE EVENTOS AO VIVO • 87 ms</span>
            <strong>● Operacional</strong>
          </div>

          <button
            onClick={() => setStreamActive(!streamActive)}
            className="btn-nexus btn-nexus-secondary btn-nexus-sm"
          >
            {streamActive ? <Pause size={12} /> : <Play size={12} />}
            <span>{streamActive ? 'Pausar stream' : 'Retomar stream'}</span>
          </button>

          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="btn-nexus btn-nexus-primary btn-nexus-sm"
          >
            <Send size={12} />
            <span>Simulador de Webhook</span>
          </button>
        </div>
      </div>

      {/* Card Verde: Saúde do Webhook */}
      <div
        style={{
          backgroundColor: '#0D1322',
          border: '1px solid var(--border-default)',
          borderRadius: 8,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10B981',
            }}
          >
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>Saúde do webhook</span>
              <span className="badge badge-success">● Recebendo eventos</span>
            </div>
            <div
              style={{
                fontSize: 11.5,
                fontFamily: 'var(--font-mono)',
                color: '#38BDF8',
                marginTop: 2,
              }}
            >
              https://api.plataforma.com/webhooks/github
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 11 }}>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: 10 }}>ASSINATURA</span>
            <strong style={{ color: '#34D399', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={12} /> X-Hub-Signature-256 Validada
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: 10 }}>IDEMPOTÊNCIA</span>
            <strong style={{ color: '#FFFFFF' }}>Chave ativa • TTL 24h</strong>
          </div>
        </div>
      </div>

      {/* Modal / Painel Inline do Simulador de Webhook */}
      {showSimulator && (
        <div className="nexus-card" style={{ borderColor: '#3B82F6' }}>
          <div className="nexus-card-header">
            <div className="nexus-card-title">
              <Send size={14} style={{ color: '#60A5FA' }} />
              <span>Simulador E2E de Evento Git (HMAC-SHA256)</span>
            </div>
            <button
              onClick={() => setShowSimulator(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          </div>

          <form onSubmit={handleSimulateWebhook} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <label className="form-label">Autor do Commit</label>
                <input
                  type="text"
                  className="form-input"
                  value={simAuthor}
                  onChange={(e) => setSimAuthor(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Branch de Destino</label>
                <input
                  type="text"
                  className="form-input"
                  value={simBranch}
                  onChange={(e) => setSimBranch(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label">Arquivo Alterado</label>
                <input
                  type="text"
                  className="form-input"
                  value={simFile}
                  onChange={(e) => setSimFile(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Mensagem do Commit</label>
              <input
                type="text"
                className="form-input"
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
              />
            </div>

            {simStatus && (
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  backgroundColor: '#050811',
                  border: '1px solid var(--border-default)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: '#93C5FD',
                }}
              >
                {simStatus}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="submit"
                disabled={simulating || !repository}
                className="btn-nexus btn-nexus-primary"
              >
                <Send size={12} />
                <span>{simulating ? 'Enviando e validando HMAC...' : 'Disparar Push Assinado'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Fila Assíncrona: 4 Cards KPI */}
      <div className="nexus-card">
        <div className="nexus-card-header">
          <div>
            <div className="nexus-card-title">
              Fila assíncrona
              <span className="badge badge-success" style={{ marginLeft: 6 }}>
                ● Consumidores saudáveis
              </span>
            </div>
            <div className="nexus-card-subtitle">
              Throughput e saúde operacional do processamento em segundo plano via Celery & Redis.
            </div>
          </div>
        </div>

        <div className="kpi-grid-4">
          <div className="kpi-card" style={{ backgroundColor: '#0A0F1D' }}>
            <div className="kpi-card-header">
              <span className="kpi-title">Eventos Processados/min</span>
              <span className="badge badge-success">Estável</span>
            </div>
            <div className="kpi-value">1.284</div>
            <div className="kpi-sub">+12,4% na última hora</div>
          </div>

          <div className="kpi-card" style={{ backgroundColor: '#0A0F1D' }}>
            <div className="kpi-card-header">
              <span className="kpi-title">Tempo de Resposta (&lt;200ms)</span>
              <span className="badge badge-success">Dentro do SLA</span>
            </div>
            <div className="kpi-value">87 ms</div>
            <div className="kpi-sub">p95 146 ms • SLA atendido</div>
          </div>

          <div className="kpi-card" style={{ backgroundColor: '#0A0F1D' }}>
            <div className="kpi-card-header">
              <span className="kpi-title">Itens na Fila (Redis)</span>
              <span className="badge badge-success">Saudável</span>
            </div>
            <div className="kpi-value">18</div>
            <div className="kpi-sub">worker lag 2,1 s</div>
          </div>

          <div className="kpi-card" style={{ backgroundColor: '#0A0F1D' }}>
            <div className="kpi-card-header">
              <span className="kpi-title">Mensagens na DLQ</span>
              <span className="badge badge-warning">Revisar</span>
            </div>
            <div className="kpi-value">2</div>
            <div className="kpi-sub">0 novas nos últimos 30 min</div>
          </div>
        </div>
      </div>

      {/* Tabela: Eventos Recentes */}
      <div className="nexus-card">
        <div className="nexus-card-header">
          <div>
            <div className="nexus-card-title">Eventos recentes</div>
            <div className="nexus-card-subtitle">
              Últimas entregas recebidas. Selecione uma linha para inspecionar o payload bruto.
            </div>
          </div>
          <button className="btn-nexus btn-nexus-secondary btn-nexus-sm">
            <Download size={12} />
            <span>Exportar eventos</span>
          </button>
        </div>

        <div className="table-toolbar">
          <div className="search-input-wrap">
            <Search size={13} className="search-input-icon" />
            <input
              type="text"
              placeholder="Buscar evento, autor ou delivery ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              className="select-chip"
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
            >
              <option value="all">Todos os eventos</option>
              <option value="push">push</option>
              <option value="pull_request">pull_request</option>
              <option value="member">member</option>
            </select>

            <select
              className="select-chip"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Todos os status</option>
              <option value="202 Accepted">202 Accepted</option>
            </select>

            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8 }}>
              2.848 eventos nas últimas 24 horas
            </span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="nexus-table">
            <thead>
              <tr>
                <th>EVENTO</th>
                <th>X-GITHUB-DELIVERY ID</th>
                <th>AUTOR</th>
                <th>TIMESTAMP</th>
                <th>FORCE PUSH</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((item) => (
                <tr key={item.id} onClick={() => openDrawer(item)}>
                  <td>
                    <span className="badge badge-info">{item.event}</span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                      {item.deliveryId}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{item.author}</span>
                  </td>
                  <td style={{ color: 'var(--text-tertiary)' }}>{item.timestamp}</td>
                  <td>
                    {item.forcePush ? (
                      <span className="badge badge-warning">Sim</span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)' }}>Não</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-success">● {item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GAVETA LATERAL DE INSPEÇÃO JSON (DRAWER DA SCREEN 09) */}
      {drawerOpen && (
        <aside className="inspector-drawer">
          <div className="drawer-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 14 }}>Inspeção JSON</span>
                <span className="badge badge-success">● 202 Accepted</span>
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {selectedEvent?.deliveryId}
              </span>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <div className="drawer-content">
            {/* Bloco: Evento Selecionado */}
            <div
              style={{
                backgroundColor: '#0A0F1D',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>Evento selecionado</span>
                <span className="badge badge-info">{selectedEvent?.event}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 11 }}>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: 10 }}>AUTOR</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 500 }}>{selectedEvent?.author}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: 10 }}>BRANCH</span>
                  <span style={{ color: '#93C5FD' }}>{selectedEvent?.branch}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-tertiary)', display: 'block', fontSize: 10 }}>RECEBIDO</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>14:32:18.041</span>
                </div>
              </div>

              <div style={{ fontSize: 11, color: '#34D399', display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle2 size={12} />
                <span>HMAC-SHA256 verificado antes do enfileiramento</span>
              </div>
            </div>

            {/* Stepper: Processamento em segundo plano */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>Processamento em segundo plano</span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>1,8 s</span>
              </div>

              <div className="drawer-timeline-step">
                <div className="stage-step-icon success" style={{ width: 22, height: 22 }}>
                  <CheckCircle2 size={12} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>Webhook recebido</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Assinatura validada • 84 ms</div>
                </div>
              </div>

              <div className="drawer-timeline-step">
                <div className="stage-step-icon success" style={{ width: 22, height: 22 }}>
                  <CheckCircle2 size={12} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>Idempotência verificada</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>delivery_id inédito • Redis SETNX</div>
                </div>
              </div>

              <div className="drawer-timeline-step">
                <div className="stage-step-icon success" style={{ width: 22, height: 22 }}>
                  <CheckCircle2 size={12} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF' }}>Evento publicado na fila</div>
                  <div style={{ fontSize: 11, color: '#38BDF8' }}>github.events.v1 • partition 04</div>
                </div>
              </div>

              <div className="drawer-timeline-step">
                <div className="stage-step-icon warning" style={{ width: 22, height: 22 }}>
                  <Activity size={12} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Normalização e persistência</span>
                    <span className="badge badge-info" style={{ fontSize: 9.5 }}>Em processamento</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Worker event-consumer-07 • tentativa 1/3</div>
                </div>
              </div>

              <div className="drawer-timeline-step">
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    backgroundColor: '#1E293B',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-dim)',
                  }}
                >
                  <Clock size={11} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-dim)' }}>Indexação analítica</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Aguardando conclusão da persistência</div>
                </div>
              </div>
            </div>

            {/* Code Box: Payload JSON Bruto */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border-default)', paddingBottom: 6 }}>
                <button
                  onClick={() => setActiveJsonTab('payload')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: activeJsonTab === 'payload' ? '#60A5FA' : 'var(--text-tertiary)',
                    fontWeight: 600,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Payload JSON bruto
                </button>
                <button
                  onClick={() => setActiveJsonTab('headers')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: activeJsonTab === 'headers' ? '#60A5FA' : 'var(--text-tertiary)',
                    fontWeight: 600,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Headers
                </button>
              </div>

              <div className="code-box-dark">
                {activeJsonTab === 'payload' ? (
                  <pre>{`{
  "ref": "refs/heads/${selectedEvent?.branch || 'main'}",
  "before": "8f3a91ce7f86d6a0",
  "after": "c4b7d2e84a91f0bc",
  "forced": ${selectedEvent?.forcePush ? 'true' : 'false'},
  "compare": "https://github.com/${repository?.full_name || 'uftech/academic-ms'}/compare/8f3a91c...c4b7d2e",
  "repository": {
    "id": 884120376,
    "full_name": "${repository?.full_name || 'uftech/academic-ms'}",
    "private": true,
    "default_branch": "main"
  },
  "pusher": {
    "name": "${selectedEvent?.author || 'rafael-lima'}",
    "email": "${selectedEvent?.author || 'rafael'}@uftech.edu.br"
  },
  "commits": [
    {
      "id": "c4b7d2e84a91f0bc",
      "message": "feat(events): adiciona consumidor Redis",
      "distinct": true,
      "modified": ["src/workers/event-consumer.ts"]
    }
  ]
}`}</pre>
                ) : (
                  <pre>{`X-GitHub-Delivery: ${selectedEvent?.deliveryId}
X-GitHub-Event: ${selectedEvent?.event}
X-Hub-Signature-256: sha256=9b7a80e08dfdd6a917e29c40bcd104f0287d52db9a45b207d
Content-Type: application/json
User-Agent: GitHub-Hookshot/8f3a91c`}</pre>
                )}
              </div>
            </div>

            {/* Card de Estado Atual */}
            <div
              style={{
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                borderRadius: 8,
                padding: 12,
                fontSize: 11,
                color: '#93C5FD',
                lineHeight: 1.4,
              }}
            >
              ℹ️ <strong>Estado atual: persistindo commit</strong>
              <p style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                A resposta HTTP foi desacoplada do processamento. O consumidor segue ativo e nenhuma repetição foi necessária.
              </p>
            </div>

            {/* Ações do Drawer */}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button className="btn-nexus btn-nexus-primary" style={{ flex: 1 }}>
                <ExternalLink size={12} />
                <span>Abrir trace distribuído</span>
              </button>
              <button className="btn-nexus btn-nexus-secondary" style={{ flex: 1 }}>
                <Terminal size={12} />
                <span>Logs</span>
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
