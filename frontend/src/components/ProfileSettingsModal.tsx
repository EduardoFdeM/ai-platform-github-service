import React, { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  LogOut,
  MinusCircle,
  RefreshCw,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'
import { api, type ModuleHealthStatus, type ModulesHealthReport } from '../api'
import { sessionRemainingSeconds, type PlatformSession } from '../platformSession'

interface ProfileSettingsModalProps {
  isOpen: boolean
  session: PlatformSession
  onClose: () => void
  onLogout: () => void
}

const STATUS_META: Record<ModuleHealthStatus, { label: string; tone: 'success' | 'danger' | 'warning' | 'info' | 'muted' }> = {
  up: { label: 'Online', tone: 'success' },
  down: { label: 'Indisponível', tone: 'danger' },
  degraded: { label: 'Degradado', tone: 'warning' },
  configured: { label: 'Configurado', tone: 'info' },
  not_configured: { label: 'Opcional', tone: 'muted' },
}

const OVERALL_LABEL: Record<ModulesHealthReport['overall_status'], string> = {
  operational: 'Todos os serviços essenciais online',
  degraded: 'Operando com contingência / degradação parcial',
  down: 'Núcleo do Módulo 2 indisponível',
}

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return 'expirada'
  const minutes = Math.floor(seconds / 60)
  const rem = seconds % 60
  return minutes > 0 ? `${minutes} min ${rem}s` : `${rem}s`
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  session,
  onClose,
  onLogout,
}) => {
  const [report, setReport] = useState<ModulesHealthReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.modulesHealth()
      setReport(data)
    } catch {
      setError('Não foi possível consultar a saúde dos módulos agora.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    void api.modulesHealth()
      .then((data) => {
        if (!cancelled) {
          setReport(data)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível consultar a saúde dos módulos agora.')
      })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelled = true
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const checking = loading || (!report && !error)

  const authMode = session.authMode ?? session.user.auth_mode ?? 'module1'
  const isFallback = authMode === 'fallback'
  const remaining = sessionRemainingSeconds(session)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog profile-settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-title-row">
          <div className="modal-title-content">
            <div className="modal-title-icon"><User size={18} /></div>
            <div>
              <h3 id="profile-settings-title">Perfil e Saúde dos Módulos</h3>
              <p>Sessão ativa e disponibilidade em tempo real dos serviços integrados.</p>
            </div>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar configurações do perfil">
            <X size={17} />
          </button>
        </div>

        <section className="profile-summary-card" aria-label="Dados da sessão">
          <div className="profile-summary-identity">
            <div className="user-avatar-circle">{session.user.display_name?.slice(0, 2).toUpperCase() || 'M2'}</div>
            <div className="profile-summary-text">
              <strong>{session.user.display_name}</strong>
              <span>{session.user.email}</span>
            </div>
          </div>
          <div className="profile-summary-meta">
            <span className={`profile-health-badge ${isFallback ? 'is-warning' : 'is-info'}`}>
              <ShieldCheck size={12} />
              {isFallback ? 'Contingência Local · M2' : 'Módulo 1 · JWT RS256'}
            </span>
            <span className="profile-session-ttl metric">Sessão expira em {formatRemaining(remaining)}</span>
          </div>
        </section>

        <section className="profile-health-section" aria-label="Janela de saúde dos módulos">
          <div className="profile-health-header">
            <div>
              <strong className="profile-health-title">
                <Activity size={15} /> Saúde dos módulos (Health)
              </strong>
              <span className="profile-health-sub">
                {report ? OVERALL_LABEL[report.overall_status] : 'Verificando serviços da plataforma…'}
              </span>
            </div>
            <button
              type="button"
              className="btn-module btn-module-secondary"
              onClick={() => void loadHealth()}
              disabled={checking}
            >
              <RefreshCw size={14} className={checking ? 'animate-spin' : undefined} />
              {checking ? 'Verificando…' : 'Atualizar status'}
            </button>
          </div>

          {error && (
            <div className="platform-feedback platform-feedback-error" role="alert">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          {report && (
            <div className="profile-health-list">
              {report.modules.map((mod) => {
                const meta = STATUS_META[mod.status]
                const StatusIcon = mod.status === 'up'
                  ? CheckCircle2
                  : mod.status === 'down' || mod.status === 'degraded'
                    ? AlertTriangle
                    : MinusCircle
                return (
                  <div className="profile-health-row" key={mod.id}>
                    <div className="profile-health-row-main">
                      <strong>{mod.name}</strong>
                      <p>{mod.detail}</p>
                    </div>
                    <div className="profile-health-row-right">
                      {mod.latency_ms !== null && (
                        <span className="profile-health-latency metric">{mod.latency_ms.toFixed(0)} ms</span>
                      )}
                      <span className={`profile-health-badge is-${meta.tone}`}>
                        <StatusIcon size={12} />
                        {meta.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {report?.fallback_enabled && (
            <p className="profile-health-footnote">
              Contingência ativa: caso o Módulo 1 fique indisponível, o M2 mantém login local e projetos em operação.
            </p>
          )}
        </section>

        <div className="modal-actions profile-modal-actions">
          <button type="button" className="btn-module btn-module-secondary" onClick={onLogout}>
            <LogOut size={14} /> Sair da plataforma
          </button>
          <button type="button" className="btn-module btn-module-primary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
